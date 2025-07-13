variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "solace-senior-dev-take-home"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "s3_bucket_name" {
  description = "Existing S3 bucket name for encrypted blobs. If not provided, a new bucket will be created."
  type        = string
  default     = null
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 15
}

variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 256
}

variable "lambda_runtime" {
  description = "Lambda function runtime"
  type        = string
  default     = "python3.9"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
}

variable "kms_key_deletion_window" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 7
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default = {
    Project     = "solace-senior-dev-take-home"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
} 