#!/usr/bin/env python3
"""
Test suite for the Solace Lambda Decryption Service.
This includes unit tests and integration test scenarios.
"""

import json
import os
import unittest
from unittest.mock import Mock, patch, MagicMock
import sys
import tempfile

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from handler import lambda_handler

class TestLambdaHandler(unittest.TestCase):
    """Test cases for the lambda_handler function."""
    
    def setUp(self):
        """Set up test environment variables."""
        os.environ['S3_BUCKET'] = 'test-bucket'
        os.environ['KMS_KEY_ID'] = 'test-key-id'
        
        # Common CORS headers for all tests
        self.cors_headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'POST,OPTIONS'
        }
    
    def test_cors_preflight_request(self):
        """Test CORS preflight OPTIONS request."""
        event = {'httpMethod': 'OPTIONS'}
        
        result = lambda_handler(event, None)
        
        self.assertEqual(result['statusCode'], 200)
        self.assertEqual(result['headers'], self.cors_headers)
        self.assertEqual(result['body'], '')
    
    def test_missing_request_body(self):
        """Test request without body."""
        event = {'httpMethod': 'POST'}
        
        result = lambda_handler(event, None)
        
        self.assertEqual(result['statusCode'], 400)
        self.assertEqual(result['headers'], self.cors_headers)
        self.assertIn('Request body is required', result['body'])
    
    def test_missing_blob_key(self):
        """Test request without blobKey."""
        event = {
            'httpMethod': 'POST',
            'body': json.dumps({})
        }
        
        result = lambda_handler(event, None)
        
        self.assertEqual(result['statusCode'], 400)
        self.assertEqual(result['headers'], self.cors_headers)
        self.assertIn('blobKey is required', result['body'])
    
    def test_invalid_json(self):
        """Test request with invalid JSON."""
        event = {
            'httpMethod': 'POST',
            'body': 'invalid json'
        }
        
        result = lambda_handler(event, None)
        
        self.assertEqual(result['statusCode'], 400)
        self.assertEqual(result['headers'], self.cors_headers)
        self.assertIn('Invalid JSON', result['body'])
    
    @patch('handler.s3_client')
    @patch('handler.kms_client')
    def test_successful_decryption(self, mock_kms, mock_s3):
        """Test successful decryption flow."""
        # Mock S3 response
        mock_s3.get_object.return_value = {
            'Body': Mock(read=lambda: b'encrypted-data')
        }
        
        # Mock KMS response
        mock_kms.decrypt.return_value = {
            'Plaintext': b'Hello, World!'
        }
        
        event = {
            'httpMethod': 'POST',
            'body': json.dumps({'blobKey': 'test-blob'})
        }
        
        result = lambda_handler(event, None)
        
        self.assertEqual(result['statusCode'], 200)
        self.assertEqual(result['headers'], self.cors_headers)
        
        body = json.loads(result['body'])
        self.assertEqual(body['plaintext'], 'Hello, World!')
        
        # Verify S3 was called correctly
        mock_s3.get_object.assert_called_once_with(
            Bucket='test-bucket', 
            Key='test-blob'
        )
        
        # Verify KMS was called correctly
        mock_kms.decrypt.assert_called_once_with(
            CiphertextBlob=b'encrypted-data',
            KeyId='test-key-id'
        )
    
    @patch('handler.s3_client')
    def test_s3_blob_not_found(self, mock_s3):
        """Test S3 blob not found error."""
        from botocore.exceptions import ClientError
        
        # Mock S3 error
        error_response = {'Error': {'Code': 'NoSuchKey'}}
        mock_s3.get_object.side_effect = ClientError(error_response, 'GetObject')
        
        event = {
            'httpMethod': 'POST',
            'body': json.dumps({'blobKey': 'non-existent-blob'})
        }
        
        result = lambda_handler(event, None)
        
        self.assertEqual(result['statusCode'], 404)
        self.assertEqual(result['headers'], self.cors_headers)
        self.assertIn('Blob not found', result['body'])
    
    @patch('handler.s3_client')
    @patch('handler.kms_client')
    def test_kms_invalid_ciphertext(self, mock_kms, mock_s3):
        """Test KMS invalid ciphertext error."""
        from botocore.exceptions import ClientError
        
        # Mock S3 response
        mock_s3.get_object.return_value = {
            'Body': Mock(read=lambda: b'invalid-encrypted-data')
        }
        
        # Mock KMS error
        error_response = {'Error': {'Code': 'InvalidCiphertextException'}}
        mock_kms.decrypt.side_effect = ClientError(error_response, 'Decrypt')
        
        event = {
            'httpMethod': 'POST',
            'body': json.dumps({'blobKey': 'test-blob'})
        }
        
        result = lambda_handler(event, None)
        
        self.assertEqual(result['statusCode'], 400)
        self.assertEqual(result['headers'], self.cors_headers)
        self.assertIn('Invalid encrypted data', result['body'])
    
    @patch('handler.s3_client')
    @patch('handler.kms_client')
    def test_kms_access_denied(self, mock_kms, mock_s3):
        """Test KMS access denied error."""
        from botocore.exceptions import ClientError
        
        # Mock S3 response
        mock_s3.get_object.return_value = {
            'Body': Mock(read=lambda: b'encrypted-data')
        }
        
        # Mock KMS error
        error_response = {'Error': {'Code': 'AccessDeniedException'}}
        mock_kms.decrypt.side_effect = ClientError(error_response, 'Decrypt')
        
        event = {
            'httpMethod': 'POST',
            'body': json.dumps({'blobKey': 'test-blob'})
        }
        
        result = lambda_handler(event, None)
        
        self.assertEqual(result['statusCode'], 403)
        self.assertEqual(result['headers'], self.cors_headers)
        self.assertIn('Access denied to KMS key', result['body'])
    
    def test_missing_environment_variables(self):
        """Test missing environment variables."""
        # Remove environment variables
        os.environ.pop('S3_BUCKET', None)
        os.environ.pop('KMS_KEY_ID', None)
        
        event = {
            'httpMethod': 'POST',
            'body': json.dumps({'blobKey': 'test-blob'})
        }
        
        result = lambda_handler(event, None)
        
        self.assertEqual(result['statusCode'], 500)
        self.assertEqual(result['headers'], self.cors_headers)
        self.assertIn('Missing required environment variables', result['body'])
        
        # Restore environment variables
        os.environ['S3_BUCKET'] = 'test-bucket'
        os.environ['KMS_KEY_ID'] = 'test-key-id'

class TestIntegrationScenarios(unittest.TestCase):
    """Integration test scenarios."""
    
    def setUp(self):
        """Set up test environment."""
        os.environ['S3_BUCKET'] = 'test-bucket'
        os.environ['KMS_KEY_ID'] = 'test-key-id'
    
    def test_end_to_end_flow(self):
        """Test complete end-to-end flow with mocked AWS services."""
        with patch('handler.s3_client') as mock_s3, \
             patch('handler.kms_client') as mock_kms:
            
            # Setup mocks
            mock_s3.get_object.return_value = {
                'Body': Mock(read=lambda: b'encrypted-data')
            }
            mock_kms.decrypt.return_value = {
                'Plaintext': b'Secret message from S3!'
            }
            
            # Test request
            event = {
                'httpMethod': 'POST',
                'body': json.dumps({'blobKey': 'secret-file.txt'})
            }
            
            result = lambda_handler(event, None)
            
            # Verify response
            self.assertEqual(result['statusCode'], 200)
            body = json.loads(result['body'])
            self.assertEqual(body['plaintext'], 'Secret message from S3!')
    
    def test_error_handling_flow(self):
        """Test error handling flow."""
        with patch('handler.s3_client') as mock_s3:
            from botocore.exceptions import ClientError
            
            # Mock S3 error
            error_response = {'Error': {'Code': 'NoSuchBucket'}}
            mock_s3.get_object.side_effect = ClientError(error_response, 'GetObject')
            
            # Test request
            event = {
                'httpMethod': 'POST',
                'body': json.dumps({'blobKey': 'test-blob'})
            }
            
            result = lambda_handler(event, None)
            
            # Verify error response
            self.assertEqual(result['statusCode'], 500)
            self.assertIn('S3 bucket not found', result['body'])

def run_tests():
    """Run all tests and return results."""
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add test cases
    suite.addTests(loader.loadTestsFromTestCase(TestLambdaHandler))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegrationScenarios))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result.wasSuccessful()

if __name__ == '__main__':
    print("Running Solace Lambda Decryption Service Tests")
    print("=" * 50)
    
    success = run_tests()
    
    print("=" * 50)
    if success:
        print("✅ All tests passed!")
    else:
        print("❌ Some tests failed!")
    
    sys.exit(0 if success else 1) 