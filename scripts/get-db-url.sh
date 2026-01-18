#!/bin/bash
set -e

ENV=${1:-dev}
REGION=${AWS_REGION:-us-east-1}

DATABASE_STACK="endofszn-database-${ENV}"

echo "Fetching database configuration for ${ENV}..."
echo ""

# Get RDS endpoint
DB_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name "$DATABASE_STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='DBEndpoint'].OutputValue" \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

DB_PORT=$(aws cloudformation describe-stacks \
  --stack-name "$DATABASE_STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='DBPort'].OutputValue" \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

DB_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$DATABASE_STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='DBName'].OutputValue" \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

SECRET_ARN=$(aws cloudformation describe-stacks \
  --stack-name "$DATABASE_STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='DBSecretArn'].OutputValue" \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

# Get Redis endpoint
REDIS_HOST=$(aws cloudformation describe-stacks \
  --stack-name "$DATABASE_STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='CacheEndpoint'].OutputValue" \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

REDIS_PORT=$(aws cloudformation describe-stacks \
  --stack-name "$DATABASE_STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='CachePort'].OutputValue" \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

# Get credentials from Secrets Manager
SECRET_VALUE=$(aws secretsmanager get-secret-value \
  --secret-id "$SECRET_ARN" \
  --query SecretString \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

USERNAME=$(echo "$SECRET_VALUE" | jq -r '.username')
PASSWORD=$(echo "$SECRET_VALUE" | jq -r '.password')

# URL encode password
ENCODED_PASSWORD=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$PASSWORD', safe=''))")

DATABASE_URL="postgresql://${USERNAME}:${ENCODED_PASSWORD}@${DB_ENDPOINT}:${DB_PORT}/${DB_NAME}"

echo "=== Database Configuration ==="
echo ""
echo "DATABASE_URL=$DATABASE_URL"
echo ""
echo "REDIS_HOST=$REDIS_HOST"
echo "REDIS_PORT=$REDIS_PORT"
echo ""
echo "=== Individual DB Values ==="
echo "POSTGRES_HOST=$DB_ENDPOINT"
echo "POSTGRES_PORT=$DB_PORT"
echo "POSTGRES_DB=$DB_NAME"
echo "POSTGRES_USER=$USERNAME"
echo "POSTGRES_PASSWORD=$PASSWORD"
echo ""
echo "Add these to your endofszn-${ENV} secret in AWS Secrets Manager"
