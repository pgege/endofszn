#!/bin/bash
set -e

ENV=${1:-dev}
STACK_NAME="endofszn-database-${ENV}"
TEMPLATE_FILE="infrastructure/cloudformation/database.yaml"
REGION=${AWS_REGION:-us-east-1}

DB_INSTANCE_CLASS=${DB_INSTANCE_CLASS:-db.t4g.micro}
DB_STORAGE=${DB_STORAGE:-20}
CACHE_NODE_TYPE=${CACHE_NODE_TYPE:-cache.t4g.micro}
CACHE_NUM_NODES=${CACHE_NUM_NODES:-1}

echo "Deploying database infrastructure for ${ENV}..."

# Check network stack exists
NETWORK_STACK="endofszn-network-${ENV}"
if ! aws cloudformation describe-stacks --stack-name "$NETWORK_STACK" --region "$REGION" --no-cli-pager &>/dev/null; then
  echo "Error: Network stack '$NETWORK_STACK' does not exist."
  echo "Deploy it first: yarn deploy:network:$ENV"
  exit 1
fi

aws cloudformation deploy \
  --stack-name "$STACK_NAME" \
  --template-file "$TEMPLATE_FILE" \
  --parameter-overrides \
    Environment="$ENV" \
    DBInstanceClass="$DB_INSTANCE_CLASS" \
    DBAllocatedStorage="$DB_STORAGE" \
    CacheNodeType="$CACHE_NODE_TYPE" \
    CacheNumNodes="$CACHE_NUM_NODES" \
  --tags Project=endofszn Environment="$ENV" \
  --region "$REGION" \
  --no-cli-pager

echo "Database infrastructure deployed."
echo ""
echo "Outputs:"
aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs" \
  --output table \
  --region "$REGION" \
  --no-cli-pager

echo ""
echo "To get DATABASE_URL, run:"
echo "  ./scripts/get-db-url.sh $ENV"
