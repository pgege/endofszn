#!/bin/bash
set -e

ENV=${1:-dev}
GATEWAY_STACK="endofszn-gateway-${ENV}"
REGION=${AWS_REGION:-us-east-1}

echo "Deploying web app to ${ENV}..."

# Get stack outputs
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$GATEWAY_STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name "$GATEWAY_STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

if [ -z "$BUCKET_NAME" ] || [ "$BUCKET_NAME" == "None" ]; then
  echo "Error: Could not find S3 bucket."
  echo "Deploy gateway infrastructure first: yarn deploy:gateway:$ENV"
  exit 1
fi

echo "S3 Bucket: $BUCKET_NAME"
echo "CloudFront Distribution: $DISTRIBUTION_ID"

# Build
echo "Building web application..."
cd apps/web && yarn build
cd ../..

# Sync to S3
echo "Syncing to S3..."
aws s3 sync apps/web/dist/ "s3://${BUCKET_NAME}" \
  --delete \
  --cache-control "max-age=31536000,public,immutable" \
  --exclude "index.html" \
  --exclude "*.json" \
  --region "$REGION" \
  --no-cli-pager

aws s3 sync apps/web/dist/ "s3://${BUCKET_NAME}" \
  --cache-control "max-age=0,no-cache,no-store,must-revalidate" \
  --exclude "*" \
  --include "index.html" \
  --include "*.json" \
  --region "$REGION" \
  --no-cli-pager

# Invalidate CloudFront
if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
  echo "Invalidating CloudFront cache..."
  aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/*" \
    --no-cli-pager > /dev/null
fi

WEBSITE_URL=$(aws cloudformation describe-stacks \
  --stack-name "$GATEWAY_STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='WebsiteUrl'].OutputValue" \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

echo ""
echo "Deployment complete!"
echo "Website URL: $WEBSITE_URL"
