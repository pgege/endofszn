#!/bin/bash
set -e

ENV=${1:-dev}
STACK_NAME="endofszn-database-${ENV}"
REGION=${AWS_REGION:-us-east-1}

echo "WARNING: This will delete the database infrastructure for ${ENV}."
echo "RDS has deletion protection enabled for prod - disable it first if needed."
echo ""
read -p "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

echo "Deleting database infrastructure for ${ENV}..."

aws cloudformation delete-stack \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --no-cli-pager

echo "Waiting for stack deletion..."
aws cloudformation wait stack-delete-complete \
  --stack-name "$STACK_NAME" \
  --region "$REGION"

echo "Database infrastructure deleted."
