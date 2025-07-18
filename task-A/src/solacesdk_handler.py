import json
import os
import base64
import boto3
from urllib.parse import unquote

s3 = boto3.client('s3')
BUCKET = os.environ.get('SOLACE_BLOB_BUCKET', 'solace-blob-bucket')

# Helper to generate a unique blob key
import uuid
def generate_blob_key():
    return str(uuid.uuid4())

def lambda_handler(event, context):
    method = event.get('httpMethod')
    path = event.get('path', '')
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    }

    # CORS preflight
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }

    if method == 'POST' and path.endswith('/upload'):
        try:
            body = json.loads(event['body'])
            iv = body['iv']
            ciphertext = body['ciphertext']
            blob_key = generate_blob_key()
            print(f"Uploading blob with key: {blob_key}")
            print(f"Data to store: iv={iv}, ciphertext={ciphertext}")
            s3.put_object(
                Bucket=BUCKET,
                Key=blob_key,
                Body=json.dumps({'iv': iv, 'ciphertext': ciphertext}),
                ContentType='application/json'
            )
            print(f"Successfully stored blob: {blob_key}")
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'blobKey': blob_key})
            }
        except Exception as e:
            print(f"Upload error: {str(e)}")
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }

    if method == 'GET' and path.startswith('/blob/'):
        try:
            blob_key = unquote(path.split('/blob/', 1)[1])
            print(f"Downloading blob with key: {blob_key}")
            obj = s3.get_object(Bucket=BUCKET, Key=blob_key)
            data = obj['Body'].read().decode('utf-8')
            print(f"Retrieved data: {data}")
            return {
                'statusCode': 200,
                'headers': headers,
                'body': data
            }
        except Exception as e:
            print(f"Download error: {str(e)}")
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }

    return {
        'statusCode': 404,
        'headers': headers,
        'body': json.dumps({'error': 'Not found'})
    } 