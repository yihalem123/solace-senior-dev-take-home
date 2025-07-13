#!/bin/bash

# Solace Task A - Test Runner Script
# This script runs all tests for the Lambda decryption service

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

echo "🧪 Solace Task A - Test Suite"
echo "=============================="

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is required but not installed."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "src/handler.py" ]; then
    print_error "Please run this script from the task-A directory"
    exit 1
fi

# Install dependencies if needed
print_status "Installing Python dependencies..."
pip install boto3 botocore

# Run unit tests
print_status "Running unit tests..."
cd tests
python3 test_lambda.py

if [ $? -eq 0 ]; then
    print_success "Unit tests passed!"
else
    print_error "Unit tests failed!"
    exit 1
fi

cd ..

# Run local function test
print_status "Running local function test..."
cd src
python3 test_local.py

if [ $? -eq 0 ]; then
    print_success "Local function test completed!"
else
    print_warning "Local function test had issues (expected without AWS)"
fi

cd ..

echo ""
echo "=============================="
print_success "All tests completed!"
echo ""
echo "Next steps:"
echo "1. Deploy to AWS using Terraform or AWS Console"
echo "2. Test with real AWS services using decrypt_test.sh"
echo "3. Verify end-to-end functionality" 