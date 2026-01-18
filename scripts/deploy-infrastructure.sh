#!/bin/bash
set -e

ENV=${1:-dev}
STACK_NAME="endofszn-web-${ENV}"
TEMPLATE_FILE="infrastructure/cloudformation/web-hosting.yaml"
REGION=${AWS_REGION:-us-east-1}

# Optional parameters
DOMAIN_NAME=${DOMAIN_NAME:-""}
CERTIFICATE_ARN=${CERTIFICATE_ARN:-""}
PRICE_CLASS=${PRICE_CLASS:-"PriceClass_100"}

echo "Deploying CloudFormation stack: $STACK_NAME"
echo "Environment: $ENV"
echo "Region: $REGION"

PARAMS="ParameterKey=Environment,ParameterValue=$ENV"
PARAMS="$PARAMS ParameterKey=PriceClass,ParameterValue=$PRICE_CLASS"

if [ -n "$DOMAIN_NAME" ]; then
  PARAMS="$PARAMS ParameterKey=DomainName,ParameterValue=$DOMAIN_NAME"
fi

if [ -n "$CERTIFICATE_ARN" ]; then
  PARAMS="$PARAMS ParameterKey=CertificateArn,ParameterValue=$CERTIFICATE_ARN"
fi

# Check if stack exists
STACK_EXISTS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" 2>&1 || true)

if echo "$STACK_EXISTS" | grep -q "does not exist"; then
  echo "Creating new stack..."
  aws cloudformation create-stack \
    --stack-name "$STACK_NAME" \
    --template-body "file://$TEMPLATE_FILE" \
    --parameters $PARAMS \
    --capabilities CAPABILITY_IAM \
    --tags Key=Project,Value=endofszn Key=Environment,Value="$ENV" \
    --region "$REGION"

  echo "Waiting for stack creation..."
  aws cloudformation wait stack-create-complete \
    --stack-name "$STACK_NAME" \
    --region "$REGION"
else
  echo "Updating existing stack..."
  aws cloudformation update-stack \
    --stack-name "$STACK_NAME" \
    --template-body "file://$TEMPLATE_FILE" \
    --parameters $PARAMS \
    --capabilities CAPABILITY_IAM \
    --tags Key=Project,Value=endofszn Key=Environment,Value="$ENV" \
    --region "$REGION" 2>&1 || {
      if echo "$?" | grep -q "No updates"; then
        echo "No updates to perform."
        exit 0
      fi
      exit 1
    }

  echo "Waiting for stack update..."
  aws cloudformation wait stack-update-complete \
    --stack-name "$STACK_NAME" \
    --region "$REGION"
fi

echo "Stack deployment complete!"

# Print outputs
echo ""
echo "Stack Outputs:"
aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[*].[OutputKey,OutputValue]" \
  --output table \
  --region "$REGION"
