#!/bin/bash
set -e

ENV=${1:-dev}
STACK_NAME="endofszn-network-${ENV}"
TEMPLATE_FILE="infrastructure/cloudformation/network.yaml"
REGION=${AWS_REGION:-us-east-1}

echo "Deploying network infrastructure for ${ENV}..."

aws cloudformation deploy \
  --stack-name "$STACK_NAME" \
  --template-file "$TEMPLATE_FILE" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides Environment="$ENV" \
  --tags Project=endofszn Environment="$ENV" \
  --region "$REGION" \
  --no-cli-pager

echo "Network infrastructure deployed."
aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs" \
  --output table \
  --region "$REGION" \
  --no-cli-pager
