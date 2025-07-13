# Solace Senior Dev Take Home - Task A

A secure enclave-style decryption Lambda service using AWS Lambda, KMS, and S3.

## 🏗️ Architecture

```
┌─────────────────┐    POST     ┌─────────────────┐    GetObject    ┌─────────────┐
│   Client        │ ──────────► │   Lambda        │ ──────────────► │   S3        │
│                 │             │   Function      │                 │   Bucket    │
└─────────────────┘             └─────────────────┘                 └─────────────┘
                                         │
                                         │ Decrypt
                                         ▼
                                 ┌─────────────────┐
                                 │   KMS Key       │
                                 │   (alias/solace/decrypt) │
                                 └─────────────────┘
```

## 📁 Project Structure

```
task-A/
├── src/
│   └── handler.py                    # Lambda function
├── infra/
│   ├── main.tf                       # Terraform infrastructure
│   ├── variables.tf                  # Terraform variables
│   └── outputs.tf                    # Terraform outputs
├── decrypt_test.sh                   # Bash test script
└── README.md                         # This file
```

## 🚀 Quick Start

### Prerequisites

- AWS CLI configured with appropriate permissions
- Terraform >= 1.0
- Python 3.9+
- curl (for testing)
- jq (optional, for better JSON parsing)

### 1. Deploy Infrastructure

```bash
cd task-A/infra

# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Deploy infrastructure
terraform apply
```

### 2. Test the Service

After deployment, you'll get a Lambda Function URL. Use the test script:

```bash
# Make script executable (Linux/Mac)
chmod +x ../decrypt_test.sh

# Test the function
../decrypt_test.sh <LAMBDA_FUNCTION_URL> <S3_BLOB_KEY>
```

## 🔧 Configuration

### Environment Variables

The Lambda function uses these environment variables:

- `S3_BUCKET`: S3 bucket containing encrypted blobs
- `KMS_KEY_ID`: KMS key ID for decryption

### Terraform Variables

Key variables you can customize in `variables.tf`:

- `aws_region`: AWS region (default: us-east-1)
- `s3_bucket_name`: Existing S3 bucket name (optional)
- `lambda_timeout`: Lambda timeout in seconds (default: 15)
- `lambda_memory_size`: Lambda memory in MB (default: 256)

## 📡 API Reference

### Endpoint

`POST <LAMBDA_FUNCTION_URL>`

### Request

```json
{
  "blobKey": "path/to/encrypted/blob"
}
```

### Response

**Success (200):**
```json
{
  "plaintext": "decrypted content"
}
```

**Error (4xx/5xx):**
```json
{
  "error": "error message"
}
```

### CORS Headers

The function includes CORS headers for cross-origin requests:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token`

## 🔐 Security Features

### IAM Least Privilege
- Lambda role only has `s3:GetObject` on the specific S3 bucket
- Lambda role only has `kms:Decrypt` and `kms:DescribeKey` on the KMS key
- KMS key policy restricts access to Lambda role only

### S3 Security
- Bucket encryption with AES256
- Public access blocked
- Versioning enabled

### KMS Security
- Key rotation enabled
- 7-day deletion window
- Restricted access via IAM policies

## 🧪 Testing

### 1. Create Test Data

```bash
# Encrypt some test data
aws kms encrypt \
  --key-id alias/solace/decrypt \
  --plaintext "Hello, World!" \
  --output text \
  --query CiphertextBlob | base64 -d > test_data.bin

# Upload to S3
aws s3 cp test_data.bin s3://<BUCKET_NAME>/test-blob
```

### 2. Test Decryption

```bash
# Test the Lambda function
./decrypt_test.sh <LAMBDA_FUNCTION_URL> test-blob
```

Expected output:
```
[INFO] Testing Lambda decrypt function...
[INFO] Lambda URL: https://...
[INFO] S3 Blob Key: test-blob

[INFO] Sending POST request to Lambda function...
Payload: {"blobKey": "test-blob"}

Response Status: 200
Response Body:
{"plaintext": "Hello, World!"}

[SUCCESS] Request successful!
Decrypted plaintext:
Hello, World!
```

## 🛠️ Development

### Local Development

1. Install dependencies:
```bash
pip install boto3
```

2. Set environment variables:
```bash
export S3_BUCKET="your-bucket-name"
export KMS_KEY_ID="your-kms-key-id"
```

3. Test locally (requires AWS credentials):
```bash
python src/handler.py
```

### Updating the Lambda Function

1. Modify `src/handler.py`
2. Redeploy:
```bash
cd infra
terraform apply
```

## 🧹 Cleanup

To destroy all resources:

```bash
cd task-A/infra
terraform destroy
```

**⚠️ Warning:** This will delete the KMS key and all associated data!

## 📊 Monitoring

### CloudWatch Logs

Lambda logs are available in CloudWatch:
```
/aws/lambda/solace-senior-dev-take-home-decrypt
```

### Metrics

Monitor these CloudWatch metrics:
- Lambda invocation count
- Lambda duration
- Lambda errors
- KMS API calls

## 🔍 Troubleshooting

### Common Issues

1. **403 Access Denied**
   - Check IAM permissions
   - Verify KMS key policy
   - Ensure Lambda role has correct permissions

2. **404 Blob Not Found**
   - Verify S3 bucket name
   - Check blob key exists in S3
   - Ensure bucket region matches Lambda region

3. **Invalid Ciphertext**
   - Verify data was encrypted with the correct KMS key
   - Check encryption method used

4. **Timeout**
   - Increase Lambda timeout in Terraform
   - Check S3/KMS service availability

### Debug Mode

Enable detailed logging by modifying the Lambda function to include more print statements.

## 📝 License

This project is part of the Solace Senior Developer take-home assignment.

## 🤝 Contributing

This is a take-home assignment. Please follow the provided requirements and security guidelines. 