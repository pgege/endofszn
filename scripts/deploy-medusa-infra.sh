#!/bin/bash
set -e

ENV=${1:-dev}
STACK_NAME="endofszn-medusa-infra-${ENV}"
REGION=${AWS_REGION:-us-east-1}

echo "Deploying Medusa infrastructure for ${ENV}..."

STACK_STATUS=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].StackStatus" \
  --output text \
  --region "$REGION" \
  --no-cli-pager 2>/dev/null || echo "DOES_NOT_EXIST")

if [ "$STACK_STATUS" = "DOES_NOT_EXIST" ]; then
  echo "Creating new stack..."
  aws cloudformation create-stack \
    --stack-name "$STACK_NAME" \
    --template-body file://infrastructure/cloudformation/medusa-service.yaml \
    --parameters ParameterKey=Environment,ParameterValue="$ENV" \
    --capabilities CAPABILITY_IAM \
    --region "$REGION" \
    --no-cli-pager

  echo "Waiting for stack creation..."
  aws cloudformation wait stack-create-complete \
    --stack-name "$STACK_NAME" \
    --region "$REGION"
else
  echo "Updating existing stack..."
  aws cloudformation update-stack \
    --stack-name "$STACK_NAME" \
    --template-body file://infrastructure/cloudformation/medusa-service.yaml \
    --parameters ParameterKey=Environment,ParameterValue="$ENV" \
    --capabilities CAPABILITY_IAM \
    --region "$REGION" \
    --no-cli-pager 2>/dev/null || echo "No updates to perform"

  if [ $? -eq 0 ]; then
    echo "Waiting for stack update..."
    aws cloudformation wait stack-update-complete \
      --stack-name "$STACK_NAME" \
      --region "$REGION" 2>/dev/null || true
  fi
fi

echo "Medusa infrastructure deployment complete!"
