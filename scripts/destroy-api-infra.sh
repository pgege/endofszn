#!/bin/bash
set -e

ENV=${1:-dev}
STACK_NAME="endofszn-api-${ENV}"
REGION=${AWS_REGION:-us-east-1}

echo "Destroying API service infrastructure for ${ENV}..."

# Delete ECR images
REPO_NAME="endofszn-${ENV}-api"
echo "Deleting ECR images..."
aws ecr list-images \
  --repository-name "$REPO_NAME" \
  --query 'imageIds[*]' \
  --output json \
  --region "$REGION" 2>/dev/null | \
jq -c '.[]' 2>/dev/null | \
while read -r image; do
  aws ecr batch-delete-image \
    --repository-name "$REPO_NAME" \
    --image-ids "$image" \
    --region "$REGION" \
    --no-cli-pager 2>/dev/null || true
done

aws cloudformation delete-stack \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --no-cli-pager

echo "Waiting for stack deletion..."
aws cloudformation wait stack-delete-complete \
  --stack-name "$STACK_NAME" \
  --region "$REGION"

echo "API service infrastructure destroyed."
