#!/bin/bash
set -e

ENV=${1:-dev}
STACK_NAME="endofszn-network-${ENV}"
REGION=${AWS_REGION:-us-east-1}

echo "Destroying network infrastructure for ${ENV}..."

# Check if dependent stacks exist
for STACK in "endofszn-gateway-${ENV}" "endofszn-api-${ENV}"; do
  if aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" &>/dev/null; then
    echo "Error: Stack '$STACK' still exists and depends on network."
    echo "Destroy dependent stacks first."
    exit 1
  fi
done

aws cloudformation delete-stack \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --no-cli-pager

echo "Waiting for stack deletion..."
aws cloudformation wait stack-delete-complete \
  --stack-name "$STACK_NAME" \
  --region "$REGION"

echo "Network infrastructure destroyed."
