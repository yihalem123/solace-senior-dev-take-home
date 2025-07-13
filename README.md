# Solace Senior Developer Take Home

This repository contains the take-home assignment for the Solace Senior Developer position.

## 📁 Project Structure

```
solace-senior-dev-take-home/
├── task-A/                    # Secure enclave-style decryption Lambda service
│   ├── src/
│   │   ├── handler.py         # Lambda function
│   │   └── requirements.txt   # Python dependencies
│   ├── infra/
│   │   ├── main.tf           # Terraform infrastructure
│   │   ├── variables.tf      # Terraform variables
│   │   └── outputs.tf        # Terraform outputs
│   ├── decrypt_test.sh       # Bash test script
│   └── README.md             # Task A documentation
├── env.example               # Environment variables example
├── .gitignore               # Git ignore rules
└── README.md                # This file
```

## 🚀 Quick Start

### Prerequisites

- AWS CLI configured with appropriate permissions
- Terraform >= 1.0
- Python 3.9+
- curl (for testing)
- jq (optional, for better JSON parsing)

### Environment Setup

1. Copy the environment example file:
```bash
cp env.example .env
```

2. Edit `.env` with your AWS configuration:
```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_PROFILE=default
```

## 📋 Tasks

### Task A: Secure Enclave-Style Decryption Lambda Service

A secure enclave-style decryption Lambda service using AWS Lambda, KMS, and S3.

**Features:**
- HTTP POST endpoint for decryption requests
- S3 blob download and KMS decryption
- CORS support for cross-origin requests
- Comprehensive error handling
- Security best practices (least privilege IAM, encrypted S3, etc.)

**Architecture:**
- AWS Lambda (Python 3.9, 256MB, 15s timeout)
- AWS KMS key with alias `alias/solace/decrypt`
- S3 bucket with AES256 encryption
- Lambda Function URL for public access
- CloudWatch logging and monitoring

**Quick Start:**
```bash
cd task-A/infra
terraform init
terraform plan
terraform apply
```

**Testing:**
```bash
# Create test data
echo "Hello, World! This is a test message." > test_messages.txt

# Encrypt and upload
aws kms encrypt --key-id $(terraform output -raw kms_key_id) --plaintext fileb://test_messages.txt --output text --query CiphertextBlob > simple_encrypted_base64.txt
aws s3 cp simple_encrypted_base64.txt s3://$(terraform output -raw s3_bucket_name)/simple_encrypted_base64.txt

# Test the function
./decrypt_test.sh "$(terraform output -raw lambda_function_url)" "simple_encrypted_base64.txt"
```

For detailed instructions, see [Task A README](task-A/README.md) and [Deployment Guide](task-A/DEPLOYMENT.md).

## 🔐 Security Features

- **IAM Least Privilege**: Lambda role only has necessary permissions
- **KMS Key Policy**: Restricted access to Lambda role only
- **S3 Encryption**: AES256 server-side encryption
- **Public Access Blocked**: S3 bucket blocks all public access
- **Key Rotation**: KMS key rotation enabled
- **No Hardcoded Secrets**: All secrets managed via environment variables

## 🧪 Testing

Each task includes comprehensive testing:

- **Task A**: Bash script for testing Lambda function
- **Unit Tests**: Python unit tests for Lambda functions
- **Integration Tests**: End-to-end testing with real AWS services

## 📊 Monitoring

- CloudWatch Logs for Lambda functions
- CloudWatch Metrics for performance monitoring
- Terraform outputs for resource information

## 🛠️ Development

### Local Development

1. Install Python dependencies:
```bash
cd task-A/src
pip install -r requirements.txt
```

2. Set up AWS credentials:
```bash
aws configure
```

3. Test locally (requires AWS credentials):
```bash
python handler.py
```

### Infrastructure as Code

All infrastructure is defined using Terraform:

- **Modular Design**: Reusable Terraform modules
- **Environment Variables**: Configurable via variables
- **State Management**: Remote state storage (recommended)
- **Security**: Least privilege IAM policies

## 🧹 Cleanup

To destroy all resources:

```bash
cd task-A/infra
terraform destroy
```

**⚠️ Warning:** This will delete all resources including KMS keys and S3 buckets!

## 📝 Documentation

- [Task A Documentation](task-A/README.md) - Detailed setup and usage
- [API Reference](task-A/README.md#api-reference) - HTTP API documentation
- [Security Guide](task-A/README.md#security-features) - Security implementation details
- [Troubleshooting](task-A/README.md#troubleshooting) - Common issues and solutions

## 🤝 Contributing

This is a take-home assignment. Please follow the provided requirements and security guidelines.

## 📄 License

This project is part of the Solace Senior Developer take-home assignment. 