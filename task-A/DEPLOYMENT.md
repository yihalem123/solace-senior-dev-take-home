# Deployment Guide

This guide provides step-by-step instructions for deploying and testing the Solace Senior Dev Take Home project.

## 🚀 Quick Deployment

### 1. Prerequisites Check

Ensure you have the following tools installed:

```bash
# Check AWS CLI
aws --version

# Check Terraform
terraform --version

# Check Python
python --version

# Check curl (for testing)
curl --version
```

### 2. AWS Configuration

Configure your AWS credentials:

```bash
aws configure
```

Or set environment variables:
```bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"
```

### 3. Deploy Infrastructure

```bash
# Navigate to the infrastructure directory
cd solace-senior-dev-take-home/task-A/infra

# Initialize Terraform
terraform init

# Plan the deployment
terraform plan

# Apply the configuration
terraform apply
```

### 4. Get Deployment Information

After successful deployment, get the Lambda Function URL:

```bash
terraform output lambda_function_url
```

### 5. Create Test Data

```bash
# Get the S3 bucket name
S3_BUCKET=$(terraform output -raw s3_bucket_name)

# Get the KMS key ID
KMS_KEY_ID=$(terraform output -raw kms_key_id)

# Create test data
echo "Hello, World! This is a test message." > test_message.txt

# Encrypt the data using KMS
aws kms encrypt \
  --key-id $KMS_KEY_ID \
  --plaintext fileb://test_message.txt \
  --output text \
  --query CiphertextBlob | base64 -d > encrypted_data.bin

# Upload to S3
aws s3 cp encrypted_data.bin s3://$S3_BUCKET/test-blob
```

### 6. Test the Lambda Function

```bash
# Get the Lambda Function URL
LAMBDA_URL=$(terraform output -raw lambda_function_url)

# Test the function
../decrypt_test.sh $LAMBDA_URL test-blob
```

## 🔧 Advanced Configuration

### Custom S3 Bucket

To use an existing S3 bucket instead of creating a new one:

```bash
terraform apply -var="s3_bucket_name=your-existing-bucket"
```

### Custom Region

To deploy in a different AWS region:

```bash
terraform apply -var="aws_region=us-west-2"
```

### Custom Lambda Configuration

To modify Lambda settings:

```bash
terraform apply \
  -var="lambda_timeout=30" \
  -var="lambda_memory_size=512"
```

## 🧪 Testing Scenarios

### 1. Basic Functionality Test

```bash
# Test with valid data
../decrypt_test.sh $LAMBDA_URL test-blob
```

Expected output:
```
[SUCCESS] Request successful!
Decrypted plaintext:
Hello, World! This is a test message.
```

### 2. Error Handling Test

```bash
# Test with non-existent blob
../decrypt_test.sh $LAMBDA_URL non-existent-blob
```

Expected output:
```
[ERROR] Request failed with status code: 404
Error message: Blob not found: non-existent-blob
```

### 3. Invalid Request Test

```bash
# Test with invalid JSON
curl -X POST $LAMBDA_URL \
  -H "Content-Type: application/json" \
  -d "invalid json"
```

Expected output:
```
{"error": "Invalid JSON in request body"}
```

### 4. CORS Test

```bash
# Test CORS preflight
curl -X OPTIONS $LAMBDA_URL \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

## 📊 Monitoring

### CloudWatch Logs

View Lambda function logs:

```bash
# Get log group name
LOG_GROUP=$(terraform output -raw cloudwatch_log_group_name)

# View recent logs
aws logs tail $LOG_GROUP --follow
```

### CloudWatch Metrics

Monitor Lambda performance:

```bash
# Get Lambda function name
FUNCTION_NAME=$(terraform output -raw lambda_function_name)

# View metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
  --start-time $(date -d '1 hour ago' --iso-8601=seconds) \
  --end-time $(date --iso-8601=seconds) \
  --period 300 \
  --statistics Sum
```

## 🔍 Troubleshooting

### Common Issues

1. **Terraform Init Fails**
   ```bash
   # Clear Terraform cache
   rm -rf .terraform
   terraform init
   ```

2. **AWS Permissions Error**
   - Ensure your AWS user has necessary permissions
   - Check IAM policies for Lambda, S3, KMS, and CloudWatch

3. **Lambda Function URL Not Working**
   - Check if the function is deployed correctly
   - Verify the URL format
   - Check CloudWatch logs for errors

4. **KMS Decryption Fails**
   - Verify the data was encrypted with the correct key
   - Check KMS key policy
   - Ensure Lambda role has decrypt permissions

### Debug Mode

Enable detailed logging in the Lambda function by adding more print statements to `handler.py`.

## 🧹 Cleanup

To destroy all resources:

```bash
cd solace-senior-dev-take-home/task-A/infra
terraform destroy
```

**⚠️ Warning:** This will delete:
- Lambda function
- KMS key (and all encrypted data)
- S3 bucket (and all data)
- IAM roles and policies
- CloudWatch log groups

## 📝 Next Steps

After successful deployment:

1. **Security Review**: Review IAM policies and KMS key policies
2. **Performance Testing**: Test with larger files and higher concurrency
3. **Monitoring Setup**: Set up CloudWatch alarms and dashboards
4. **Backup Strategy**: Implement backup for KMS keys and S3 data
5. **CI/CD Pipeline**: Set up automated deployment pipeline

## 📞 Support

For issues or questions:
1. Check the [README](README.md) for detailed documentation
2. Review [Troubleshooting](task-A/README.md#troubleshooting) section
3. Check CloudWatch logs for error details
4. Verify AWS service limits and quotas 