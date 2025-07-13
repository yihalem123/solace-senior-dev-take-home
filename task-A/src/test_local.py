#!/usr/bin/env python3
"""
Local test script for the Lambda handler function.
This script allows you to test the lambda_handler function locally
without deploying to AWS Lambda.
"""

import json
import os
from handler import lambda_handler

def test_lambda_handler():
    """Test the lambda_handler function with sample data."""
    
    # Set environment variables for testing
    os.environ['S3_BUCKET'] = 'test-bucket'
    os.environ['KMS_KEY_ID'] = 'test-key-id'
    
    # Test case 1: Valid request
    print("=== Test Case 1: Valid Request ===")
    test_event = {
        'httpMethod': 'POST',
        'body': json.dumps({
            'blobKey': 'test-blob-key'
        })
    }
    
    try:
        result = lambda_handler(test_event, None)
        print(f"Status Code: {result['statusCode']}")
        print(f"Response Body: {result['body']}")
        print(f"Headers: {result['headers']}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # Test case 2: Missing blobKey
    print("=== Test Case 2: Missing blobKey ===")
    test_event = {
        'httpMethod': 'POST',
        'body': json.dumps({})
    }
    
    try:
        result = lambda_handler(test_event, None)
        print(f"Status Code: {result['statusCode']}")
        print(f"Response Body: {result['body']}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # Test case 3: Invalid JSON
    print("=== Test Case 3: Invalid JSON ===")
    test_event = {
        'httpMethod': 'POST',
        'body': 'invalid json'
    }
    
    try:
        result = lambda_handler(test_event, None)
        print(f"Status Code: {result['statusCode']}")
        print(f"Response Body: {result['body']}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # Test case 4: CORS preflight request
    print("=== Test Case 4: CORS Preflight Request ===")
    test_event = {
        'httpMethod': 'OPTIONS'
    }
    
    try:
        result = lambda_handler(test_event, None)
        print(f"Status Code: {result['statusCode']}")
        print(f"Headers: {result['headers']}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # Test case 5: Missing request body
    print("=== Test Case 5: Missing Request Body ===")
    test_event = {
        'httpMethod': 'POST'
    }
    
    try:
        result = lambda_handler(test_event, None)
        print(f"Status Code: {result['statusCode']}")
        print(f"Response Body: {result['body']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Testing Lambda Handler Function Locally")
    print("Note: This will show expected errors for AWS services since we're not connected to AWS")
    print("="*70)
    test_lambda_handler()
    print("\n" + "="*70)
    print("Local testing complete!")
    print("\nTo test with real AWS services, you need to:")
    print("1. Deploy the infrastructure using Terraform")
    print("2. Use the provided test script: ../decrypt_test.sh") 