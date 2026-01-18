#!/bin/bash
set -e

ENV=${1:-dev}
STACK_NAME="endofszn-api-${ENV}"
REGION=${AWS_REGION:-us-east-1}
IMAGE_TAG=${2:-latest}

echo "Deploying API to ${ENV}..."

# Get ECR repository URI
REPO_URI=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='APIRepositoryUri'].OutputValue" \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

if [ -z "$REPO_URI" ] || [ "$REPO_URI" == "None" ]; then
  echo "Error: Could not find ECR repository."
  echo "Deploy API infrastructure first: yarn deploy:api-infra:$ENV"
  exit 1
fi

echo "ECR Repository: $REPO_URI"

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REPO_URI"

# Build Docker image
echo "Building Docker image..."
docker build -t "$REPO_URI:$IMAGE_TAG" -f apps/api/Dockerfile .

# Push to ECR
echo "Pushing image to ECR..."
docker push "$REPO_URI:$IMAGE_TAG"

# Get cluster name
NETWORK_STACK="endofszn-network-${ENV}"
CLUSTER_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$NETWORK_STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='ECSClusterName'].OutputValue" \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

SERVICE_NAME="endofszn-${ENV}-api"

# Force new deployment and ensure at least 1 task is running
echo "Updating ECS service..."
aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service "$SERVICE_NAME" \
  --desired-count 1 \
  --force-new-deployment \
  --region "$REGION" \
  --no-cli-pager > /dev/null

echo "Deployment initiated. Waiting for service to stabilize..."
aws ecs wait services-stable \
  --cluster "$CLUSTER_NAME" \
  --services "$SERVICE_NAME" \
  --region "$REGION"

# Get website URL
GATEWAY_STACK="endofszn-gateway-${ENV}"
WEBSITE_URL=$(aws cloudformation describe-stacks \
  --stack-name "$GATEWAY_STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='WebsiteUrl'].OutputValue" \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

echo ""
echo "Deployment complete!"
echo "API URL: ${WEBSITE_URL}/api"
