#!/bin/bash
set -e

ENV=${1:-dev}
STACK_NAME="endofszn-api-${ENV}"
NETWORK_STACK="endofszn-network-${ENV}"
REGION=${AWS_REGION:-us-east-1}
IMAGE_TAG=${2:-latest}

CPU=${CPU:-256}
MEMORY=${MEMORY:-512}
CONTAINER_PORT=${CONTAINER_PORT:-3000}

echo "Deploying API to ${ENV}..."

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

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

# Get IAM role ARNs
EXECUTION_ROLE_ARN=$(aws cloudformation describe-stacks \
  --stack-name "$NETWORK_STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='ECSTaskExecutionRoleArn'].OutputValue" \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

TASK_ROLE_ARN=$(aws cloudformation describe-stacks \
  --stack-name "$NETWORK_STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='ECSTaskRoleArn'].OutputValue" \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REPO_URI"

# Build Docker image
echo "Building Docker image..."
docker build -t "$REPO_URI:$IMAGE_TAG" -f apps/api/Dockerfile .

# Push to ECR
echo "Pushing image to ECR..."
docker push "$REPO_URI:$IMAGE_TAG"

# Generate task definition from template
echo "Registering task definition..."
TASK_DEF=$(cat apps/api/task-definition.json | \
  sed "s|__ENVIRONMENT__|$ENV|g" | \
  sed "s|__CPU__|$CPU|g" | \
  sed "s|__MEMORY__|$MEMORY|g" | \
  sed "s|__IMAGE_URI__|$REPO_URI:$IMAGE_TAG|g" | \
  sed "s|__EXECUTION_ROLE_ARN__|$EXECUTION_ROLE_ARN|g" | \
  sed "s|__TASK_ROLE_ARN__|$TASK_ROLE_ARN|g" | \
  sed "s|__AWS_REGION__|$REGION|g" | \
  sed "s|__AWS_ACCOUNT_ID__|$AWS_ACCOUNT_ID|g" | \
  sed "s|__CONTAINER_PORT_NUM__|$CONTAINER_PORT|g" | \
  sed "s|__CONTAINER_PORT__|$CONTAINER_PORT|g")

# Register the task definition
TASK_DEF_ARN=$(echo "$TASK_DEF" | aws ecs register-task-definition \
  --cli-input-json file:///dev/stdin \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

echo "Registered task definition: $TASK_DEF_ARN"

# Get cluster name
CLUSTER_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$NETWORK_STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='ECSClusterName'].OutputValue" \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

SERVICE_NAME="endofszn-${ENV}-api"

# Update ECS service with new task definition and desired count
echo "Updating ECS service..."
aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service "$SERVICE_NAME" \
  --task-definition "$TASK_DEF_ARN" \
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
