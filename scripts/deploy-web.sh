#!/bin/bash
set -e

ENV=${1:-dev}
STACK_NAME="endofszn-web-${ENV}"
REGION=${AWS_REGION:-us-east-1}

echo "Deploying web app to ${ENV} environment..."

# Get stack outputs
echo "Fetching CloudFormation stack outputs..."
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

if [ -z "$BUCKET_NAME" ] || [ "$BUCKET_NAME" == "None" ]; then
  echo "Error: Could not find S3 bucket. Make sure the stack '$STACK_NAME' exists."
  exit 1
fi

echo "S3 Bucket: $BUCKET_NAME"
echo "CloudFront Distribution: $DISTRIBUTION_ID"

# Build the app
echo "Building web application..."
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR/../apps/web"
yarn build

# Sync to S3
echo "Syncing build to S3..."
aws s3 sync dist/ "s3://${BUCKET_NAME}" \
  --delete \
  --cache-control "max-age=31536000,public,immutable" \
  --exclude "index.html" \
  --exclude "*.json" \
  --region "$REGION" \
  --no-cli-pager

# Upload HTML and JSON with shorter cache
aws s3 sync dist/ "s3://${BUCKET_NAME}" \
  --cache-control "max-age=0,no-cache,no-store,must-revalidate" \
  --exclude "*" \
  --include "index.html" \
  --include "*.json" \
  --region "$REGION" \
  --no-cli-pager

# Invalidate CloudFront cache
if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
  echo "Invalidating CloudFront cache..."
  aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/*" \
    --no-cli-pager
fi

echo "Deployment complete!"

# Get website URL
WEBSITE_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='WebsiteUrl'].OutputValue" \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

echo "Website URL: $WEBSITE_URL"
