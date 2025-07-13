output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.decrypt_function.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.decrypt_function.arn
}

output "lambda_function_url" {
  description = "URL of the Lambda function"
  value       = aws_lambda_function_url.decrypt_function_url.url
}

output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.decrypt_key.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.decrypt_key.arn
}

output "kms_key_alias" {
  description = "Alias of the KMS key"
  value       = aws_kms_alias.decrypt_key.name
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for encrypted blobs"
  value       = var.s3_bucket_name != null ? var.s3_bucket_name : aws_s3_bucket.encrypted_blobs[0].bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for encrypted blobs"
  value       = var.s3_bucket_name != null ? data.aws_s3_bucket.existing[0].arn : aws_s3_bucket.encrypted_blobs[0].arn
}

output "lambda_role_arn" {
  description = "ARN of the Lambda IAM role"
  value       = aws_iam_role.lambda_role.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.lambda_logs.name
}

output "environment_variables" {
  description = "Environment variables for the Lambda function"
  value = {
    S3_BUCKET  = var.s3_bucket_name != null ? var.s3_bucket_name : aws_s3_bucket.encrypted_blobs[0].bucket
    KMS_KEY_ID = aws_kms_key.decrypt_key.key_id
  }
}

output "deployment_instructions" {
  description = "Instructions for deploying and testing the Lambda function"
  value = <<-EOT
    🚀 Deployment Complete!
    
    📋 Next Steps:
    1. Test the Lambda function using the provided test script:
       ./decrypt_test.sh <LAMBDA_FUNCTION_URL> <S3_BLOB_KEY>
    
    2. Upload an encrypted blob to S3:
       aws s3 cp <encrypted_file> s3://${var.s3_bucket_name != null ? var.s3_bucket_name : aws_s3_bucket.encrypted_blobs[0].bucket}/<blob_key>
    
    3. Encrypt data using the KMS key:
       aws kms encrypt --key-id ${aws_kms_key.decrypt_key.key_id} --plaintext "Hello, World!" --output text --query CiphertextBlob | base64 -d > encrypted_data.bin
    
    🔗 Lambda Function URL: ${aws_lambda_function_url.decrypt_function_url.url}
    🔑 KMS Key ID: ${aws_kms_key.decrypt_key.key_id}
    🪣 S3 Bucket: ${var.s3_bucket_name != null ? var.s3_bucket_name : aws_s3_bucket.encrypted_blobs[0].bucket}
  EOT
} 