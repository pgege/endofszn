#!/bin/bash

set -e

ENV="${1:-local}"
SECRET_NAME="${2:-endofszn-$ENV}"
REGION="${AWS_REGION:-us-east-1}"
ENV_FILE=".env"

echo "Setting up environment: $ENV"

if ! command -v aws &> /dev/null; then
  echo "Error: AWS CLI is not installed"
  exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
  echo "Error: AWS credentials not configured. Run 'aws configure' or set AWS_PROFILE"
  exit 1
fi

echo "Fetching secrets from AWS Secrets Manager: $SECRET_NAME (region: $REGION)"

SECRET_VALUE=$(aws secretsmanager get-secret-value \
  --secret-id "$SECRET_NAME" \
  --region "$REGION" \
  --query 'SecretString' \
  --output text)

if [ -z "$SECRET_VALUE" ]; then
  echo "Error: Secret '$SECRET_NAME' is empty or not found"
  exit 1
fi

echo "$SECRET_VALUE" | jq -r 'to_entries | .[] | "\(.key)=\(.value)"' > "$ENV_FILE"

echo "Created $ENV_FILE with $(wc -l < "$ENV_FILE" | tr -d ' ') variables"
