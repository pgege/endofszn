#!/bin/bash
set -e

ENV=${1:-dev}
REGION=${AWS_REGION:-us-east-1}

DATABASE_STACK="endofszn-database-${ENV}"

echo "Fetching database configuration for ${ENV}..."
echo ""

# Get API RDS endpoint
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

# Get Medusa RDS endpoint
MEDUSA_DB_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name "$DATABASE_STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='MedusaDBEndpoint'].OutputValue" \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

MEDUSA_DB_PORT=$(aws cloudformation describe-stacks \
  --stack-name "$DATABASE_STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='MedusaDBPort'].OutputValue" \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

MEDUSA_DB_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$DATABASE_STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='MedusaDBName'].OutputValue" \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

MEDUSA_SECRET_ARN=$(aws cloudformation describe-stacks \
  --stack-name "$DATABASE_STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='MedusaDBSecretArn'].OutputValue" \
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


# Get API DB credentials from Secrets Manager
SECRET_VALUE=$(aws secretsmanager get-secret-value \
  --secret-id "$SECRET_ARN" \
  --query SecretString \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

USERNAME=$(echo "$SECRET_VALUE" | jq -r '.username')
PASSWORD=$(echo "$SECRET_VALUE" | jq -r '.password')
ENCODED_PASSWORD=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$PASSWORD', safe=''))")

# Get Medusa DB credentials from Secrets Manager
MEDUSA_SECRET_VALUE=$(aws secretsmanager get-secret-value \
  --secret-id "$MEDUSA_SECRET_ARN" \
  --query SecretString \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

MEDUSA_USERNAME=$(echo "$MEDUSA_SECRET_VALUE" | jq -r '.username')
MEDUSA_PASSWORD=$(echo "$MEDUSA_SECRET_VALUE" | jq -r '.password')
MEDUSA_ENCODED_PASSWORD=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$MEDUSA_PASSWORD', safe=''))")

DATABASE_URL="postgresql://${USERNAME}:${ENCODED_PASSWORD}@${DB_ENDPOINT}:${DB_PORT}/${DB_NAME}?sslmode=require"
MEDUSA_DATABASE_URL="postgresql://${MEDUSA_USERNAME}:${MEDUSA_ENCODED_PASSWORD}@${MEDUSA_DB_ENDPOINT}:${MEDUSA_DB_PORT}/${MEDUSA_DB_NAME}?sslmode=require"

echo "=== Environment Variables for endofszn-${ENV} secret ==="
echo ""
echo "# API Database (full URL)"
echo "DATABASE_URL=$DATABASE_URL"
echo ""
echo "# API Database (individual)"
echo "DB_HOST=$DB_ENDPOINT"
echo "DB_PORT=$DB_PORT"
echo "DB_NAME=$DB_NAME"
echo "DB_USERNAME=$USERNAME"
echo "DB_PASSWORD=$PASSWORD"
echo ""
echo "# Medusa Database (full URL)"
echo "MEDUSA_DATABASE_URL=$MEDUSA_DATABASE_URL"
echo ""
echo "# Medusa Database (individual)"
echo "MEDUSA_DB_HOST=$MEDUSA_DB_ENDPOINT"
echo "MEDUSA_DB_PORT=$MEDUSA_DB_PORT"
echo "MEDUSA_DB_NAME=$MEDUSA_DB_NAME"
echo "MEDUSA_DB_USERNAME=$MEDUSA_USERNAME"
echo "MEDUSA_DB_PASSWORD=$MEDUSA_PASSWORD"
echo ""
echo "# Redis"
echo "REDIS_HOST=$REDIS_HOST"
echo "REDIS_PORT=$REDIS_PORT"
echo ""
echo "Add these to your endofszn-${ENV} secret in AWS Secrets Manager"
