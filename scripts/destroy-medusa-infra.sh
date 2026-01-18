#!/bin/bash
set -e

ENV=${1:-dev}
STACK_NAME="endofszn-medusa-infra-${ENV}"
REGION=${AWS_REGION:-us-east-1}

echo "Destroying Medusa infrastructure for ${ENV}..."

REPO_NAME="endofszn-${ENV}-medusa"
echo "Deleting ECR images..."
aws ecr list-images \
  --repository-name "$REPO_NAME" \
  --query 'imageIds[*]' \
  --output json \
  --region "$REGION" \
  --no-cli-pager 2>/dev/null | \
  xargs -I {} aws ecr batch-delete-image \
    --repository-name "$REPO_NAME" \
    --image-ids '{}' \
    --region "$REGION" \
    --no-cli-pager 2>/dev/null || echo "No images to delete or repo doesn't exist"

echo "Deleting CloudFormation stack..."
aws cloudformation delete-stack \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --no-cli-pager

echo "Waiting for stack deletion..."
aws cloudformation wait stack-delete-complete \
  --stack-name "$STACK_NAME" \
  --region "$REGION"

echo "Medusa infrastructure destroyed!"
