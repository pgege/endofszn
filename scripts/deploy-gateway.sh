#!/bin/bash
set -e

ENV=${1:-dev}
STACK_NAME="endofszn-gateway-${ENV}"
TEMPLATE_FILE="infrastructure/cloudformation/gateway.yaml"
REGION=${AWS_REGION:-us-east-1}

DOMAIN_NAME=${DOMAIN_NAME:-""}
CERTIFICATE_ARN=${CERTIFICATE_ARN:-""}
PRICE_CLASS=${PRICE_CLASS:-"PriceClass_100"}

echo "Deploying gateway infrastructure for ${ENV}..."

# Check network stack exists
NETWORK_STACK="endofszn-network-${ENV}"
if ! aws cloudformation describe-stacks --stack-name "$NETWORK_STACK" --region "$REGION" &>/dev/null; then
  echo "Error: Network stack '$NETWORK_STACK' does not exist."
  echo "Deploy it first: yarn deploy:network:$ENV"
  exit 1
fi

aws cloudformation deploy \
  --stack-name "$STACK_NAME" \
  --template-file "$TEMPLATE_FILE" \
  --parameter-overrides \
    Environment="$ENV" \
    DomainName="$DOMAIN_NAME" \
    CertificateArn="$CERTIFICATE_ARN" \
    PriceClass="$PRICE_CLASS" \
  --tags Project=endofszn Environment="$ENV" \
  --region "$REGION" \
  --no-cli-pager

echo "Gateway infrastructure deployed."
aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs" \
  --output table \
  --region "$REGION" \
  --no-cli-pager
