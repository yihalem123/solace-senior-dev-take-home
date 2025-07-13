terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Data source for current AWS region
data "aws_region" "current" {}

# Create S3 bucket for encrypted blobs (if not provided)
resource "aws_s3_bucket" "encrypted_blobs" {
  count  = var.s3_bucket_name == null ? 1 : 0
  bucket = "${var.project_name}-encrypted-blobs-${random_string.bucket_suffix.result}"
}

# Random string for bucket name uniqueness
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Use existing S3 bucket if provided
data "aws_s3_bucket" "existing" {
  count  = var.s3_bucket_name != null ? 1 : 0
  bucket = var.s3_bucket_name
}

# S3 bucket encryption configuration
resource "aws_s3_bucket_server_side_encryption_configuration" "encrypted_blobs" {
  count  = var.s3_bucket_name == null ? 1 : 0
  bucket = aws_s3_bucket.encrypted_blobs[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "encrypted_blobs" {
  count  = var.s3_bucket_name == null ? 1 : 0
  bucket = aws_s3_bucket.encrypted_blobs[0].id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "encrypted_blobs" {
  count  = var.s3_bucket_name == null ? 1 : 0
  bucket = aws_s3_bucket.encrypted_blobs[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Create KMS key for encryption/decryption
resource "aws_kms_key" "decrypt_key" {
  description             = "KMS key for decrypting S3 blobs in ${var.project_name}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow Lambda to use the key"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.lambda_role.arn
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-decrypt-key"
    Environment = var.environment
  }
}

# Create KMS alias (only if it doesn't exist)
resource "aws_kms_alias" "decrypt_key" {
  count         = var.create_kms_alias ? 1 : 0
  name          = "alias/solace/decrypt"
  target_key_id = aws_kms_key.decrypt_key.key_id
}

# Create IAM role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-lambda-role"
    Environment = var.environment
  }
}

# Create IAM policy for Lambda
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = [
          var.s3_bucket_name != null ? "${data.aws_s3_bucket.existing[0].arn}/*" : "${aws_s3_bucket.encrypted_blobs[0].arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.decrypt_key.arn
      }
    ]
  })
}

# Create CloudWatch log group for Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.project_name}-decrypt"
  retention_in_days = 14
}

# Create ZIP file from Lambda source code
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src"
  output_path = "${path.module}/lambda_function.zip"
}

# Create Lambda function
resource "aws_lambda_function" "decrypt_function" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.project_name}-decrypt"
  role            = aws_iam_role.lambda_role.arn
  handler         = "handler.lambda_handler"
  runtime         = "python3.9"
  timeout         = 15
  memory_size     = 256

  environment {
    variables = {
      S3_BUCKET  = var.s3_bucket_name != null ? var.s3_bucket_name : aws_s3_bucket.encrypted_blobs[0].bucket
      KMS_KEY_ID = aws_kms_key.decrypt_key.key_id
    }
  }

  depends_on = [
    aws_iam_role_policy.lambda_policy,
    aws_cloudwatch_log_group.lambda_logs
  ]

  tags = {
    Name        = "${var.project_name}-decrypt"
    Environment = var.environment
  }
}

# Create Lambda Function URL
resource "aws_lambda_function_url" "decrypt_function_url" {
  function_name      = aws_lambda_function.decrypt_function.function_name
  authorization_type = "NONE"
} 