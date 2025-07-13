#!/bin/bash

# Solace Senior Dev Take Home - Lambda Decrypt Test Script
# Usage: ./decrypt_test.sh <LAMBDA_FUNCTION_URL> <S3_BLOB_KEY>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if required arguments are provided
if [ $# -ne 2 ]; then
    print_error "Usage: $0 <LAMBDA_FUNCTION_URL> <S3_BLOB_KEY>"
    echo ""
    echo "Example:"
    echo "  $0 https://abc123.lambda-url.us-east-1.on.aws/ test-blob-key"
    echo ""
    echo "To get the Lambda Function URL, run:"
    echo "  terraform output lambda_function_url"
    exit 1
fi

LAMBDA_URL="$1"
BLOB_KEY="$2"

# Validate URL format
if [[ ! "$LAMBDA_URL" =~ ^https://.*\.lambda-url\..*\.on\.aws/?$ ]]; then
    print_error "Invalid Lambda Function URL format: $LAMBDA_URL"
    print_warning "Expected format: https://<id>.lambda-url.<region>.on.aws/"
    exit 1
fi

print_status "Testing Lambda decrypt function..."
print_status "Lambda URL: $LAMBDA_URL"
print_status "S3 Blob Key: $BLOB_KEY"
echo ""

# Check if curl is available
if ! command -v curl &> /dev/null; then
    print_error "curl is required but not installed. Please install curl and try again."
    exit 1
fi

# Prepare JSON payload
JSON_PAYLOAD=$(cat <<EOF
{
  "blobKey": "$BLOB_KEY"
}
EOF
)

print_status "Sending POST request to Lambda function..."
echo "Payload: $JSON_PAYLOAD"
echo ""

# Send POST request to Lambda function
RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$JSON_PAYLOAD" \
    "$LAMBDA_URL")

# Extract HTTP status code (last line)
HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
# Extract response body (all lines except last)
RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)

echo "Response Status: $HTTP_STATUS"
echo "Response Body:"
echo "$RESPONSE_BODY"
echo ""

# Check if request was successful
if [ "$HTTP_STATUS" -eq 200 ]; then
    print_success "Request successful!"
    
    # Try to extract plaintext from JSON response
    if command -v jq &> /dev/null; then
        PLAINTEXT=$(echo "$RESPONSE_BODY" | jq -r '.plaintext // empty')
        if [ -n "$PLAINTEXT" ]; then
            echo "Decrypted plaintext:"
            echo "$PLAINTEXT"
        else
            print_warning "Could not extract plaintext from response"
        fi
    else
        print_warning "jq not installed. Install jq for better JSON parsing."
        print_status "Response contains the decrypted plaintext in the 'plaintext' field."
    fi
else
    print_error "Request failed with status code: $HTTP_STATUS"
    
    # Try to extract error message
    if command -v jq &> /dev/null; then
        ERROR_MSG=$(echo "$RESPONSE_BODY" | jq -r '.error // empty')
        if [ -n "$ERROR_MSG" ]; then
            print_error "Error message: $ERROR_MSG"
        fi
    fi
fi

echo ""
print_status "Test completed." 