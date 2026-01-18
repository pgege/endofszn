#!/bin/bash
set -e

ENV=${1:-dev}
STACK_NAME="endofszn-gateway-${ENV}"
REGION=${AWS_REGION:-us-east-1}

echo "Destroying gateway infrastructure for ${ENV}..."

# Check if API stack still exists
API_STACK="endofszn-api-${ENV}"
if aws cloudformation describe-stacks --stack-name "$API_STACK" --region "$REGION" &>/dev/null; then
  echo "Error: API stack '$API_STACK' still exists and depends on gateway."
  echo "Destroy it first: yarn destroy:api-infra:$ENV"
  exit 1
fi

# Get bucket name
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" \
  --output text \
  --region "$REGION" \
  --no-cli-pager 2>/dev/null || echo "")

if [ -n "$BUCKET_NAME" ] && [ "$BUCKET_NAME" != "None" ]; then
  echo "Emptying S3 bucket: $BUCKET_NAME"
  aws s3 rm "s3://${BUCKET_NAME}" --recursive --region "$REGION"
  
  # Delete all versions
  aws s3api list-object-versions \
    --bucket "$BUCKET_NAME" \
    --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}' \
    --output json \
    --region "$REGION" 2>/dev/null | \
  jq -c 'select(.Objects != null) | .Objects[]' 2>/dev/null | \
  while read -r obj; do
    KEY=$(echo "$obj" | jq -r '.Key')
    VERSION=$(echo "$obj" | jq -r '.VersionId')
    aws s3api delete-object --bucket "$BUCKET_NAME" --key "$KEY" --version-id "$VERSION" --region "$REGION" 2>/dev/null || true
  done
  
  # Delete markers
  aws s3api list-object-versions \
    --bucket "$BUCKET_NAME" \
    --query '{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}' \
    --output json \
    --region "$REGION" 2>/dev/null | \
  jq -c 'select(.Objects != null) | .Objects[]' 2>/dev/null | \
  while read -r obj; do
    KEY=$(echo "$obj" | jq -r '.Key')
    VERSION=$(echo "$obj" | jq -r '.VersionId')
    aws s3api delete-object --bucket "$BUCKET_NAME" --key "$KEY" --version-id "$VERSION" --region "$REGION" 2>/dev/null || true
  done
fi

aws cloudformation delete-stack \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --no-cli-pager

echo "Waiting for stack deletion..."
aws cloudformation wait stack-delete-complete \
  --stack-name "$STACK_NAME" \
  --region "$REGION"

echo "Gateway infrastructure destroyed."
