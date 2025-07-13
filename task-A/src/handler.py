import json
import os
import boto3
import base64
from botocore.exceptions import ClientError, NoCredentialsError
from typing import Dict, Any

# Initialize AWS clients
s3_client = boto3.client('s3')
kms_client = boto3.client('kms')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda function to decrypt S3 blobs using AWS KMS.
    
    Expected input:
    {
        "blobKey": "s3-key"
    }
    
    Returns:
    {
        "plaintext": "decrypted-content"
    }
    """
    
    # CORS headers for all responses
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
    }
    
    # Handle OPTIONS requests for CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': ''
        }
    
    try:
        # Parse request body
        if 'body' not in event:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Request body is required'})
            }
        
        body = json.loads(event['body'])
        blob_key = body.get('blobKey')
        
        if not blob_key:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({'error': 'blobKey is required in request body'})
            }
        
        # Get environment variables
        s3_bucket = os.environ.get('S3_BUCKET')
        kms_key_id = os.environ.get('KMS_KEY_ID')
        
        if not s3_bucket or not kms_key_id:
            return {
                'statusCode': 500,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Missing required environment variables: S3_BUCKET or KMS_KEY_ID'})
            }
        
        # Download encrypted blob from S3
        try:
            response = s3_client.get_object(Bucket=s3_bucket, Key=blob_key)
            encrypted_blob = response['Body'].read()
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchKey':
                return {
                    'statusCode': 404,
                    'headers': cors_headers,
                    'body': json.dumps({'error': f'Blob not found: {blob_key}'})
                }
            elif error_code == 'NoSuchBucket':
                return {
                    'statusCode': 500,
                    'headers': cors_headers,
                    'body': json.dumps({'error': f'S3 bucket not found: {s3_bucket}'})
                }
            else:
                raise
        
        # Decrypt the blob using KMS
        try:
            decrypt_response = kms_client.decrypt(
                CiphertextBlob=encrypted_blob,
                KeyId=kms_key_id
            )
            plaintext = decrypt_response['Plaintext'].decode('utf-8')
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'InvalidCiphertextException':
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Invalid encrypted data'})
                }
            elif error_code == 'AccessDeniedException':
                return {
                    'statusCode': 403,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Access denied to KMS key'})
                }
            else:
                raise
        
        # Return successful response
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'plaintext': plaintext
            })
        }
        
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': cors_headers,
            'body': json.dumps({'error': 'Invalid JSON in request body'})
        }
    except NoCredentialsError:
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': 'AWS credentials not configured'})
        }
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': 'Internal server error'})
        } 