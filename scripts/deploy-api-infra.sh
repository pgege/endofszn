#!/bin/bash
set -e

ENV=${1:-dev}
STACK_NAME="endofszn-api-${ENV}"
TEMPLATE_FILE="infrastructure/cloudformation/api-service.yaml"
REGION=${AWS_REGION:-us-east-1}

echo "Deploying API service infrastructure for ${ENV}..."

# Check gateway stack exists
GATEWAY_STACK="endofszn-gateway-${ENV}"
if ! aws cloudformation describe-stacks --stack-name "$GATEWAY_STACK" --region "$REGION" &>/dev/null; then
  echo "Error: Gateway stack '$GATEWAY_STACK' does not exist."
  echo "Deploy it first: yarn deploy:gateway:$ENV"
  exit 1
fi

aws cloudformation deploy \
  --stack-name "$STACK_NAME" \
  --template-file "$TEMPLATE_FILE" \
  --parameter-overrides Environment="$ENV" \
  --tags Project=endofszn Environment="$ENV" \
  --region "$REGION" \
  --no-cli-pager

echo "API service infrastructure deployed."
aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs" \
  --output table \
  --region "$REGION" \
  --no-cli-pager
