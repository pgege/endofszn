#!/bin/bash
set -e

ENV=${1:-dev}
STACK_NAME="endofszn-medusa-infra-${ENV}"
NETWORK_STACK="endofszn-network-${ENV}"
GATEWAY_STACK="endofszn-gateway-${ENV}"
REGION=${AWS_REGION:-us-east-1}
IMAGE_TAG=${2:-latest}

CPU=${CPU:-512}
MEMORY=${MEMORY:-1024}
CONTAINER_PORT=${CONTAINER_PORT:-9000}

echo "Deploying Medusa to ${ENV}..."

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

REPO_URI=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='MedusaRepositoryUri'].OutputValue" \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

if [ -z "$REPO_URI" ] || [ "$REPO_URI" == "None" ]; then
  echo "Error: Could not find ECR repository."
  echo "Deploy Medusa infrastructure first: yarn deploy:medusa-infra:$ENV"
  exit 1
fi

echo "ECR Repository: $REPO_URI"

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

WEBSITE_URL=$(aws cloudformation describe-stacks \
  --stack-name "$GATEWAY_STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='WebsiteUrl'].OutputValue" \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

echo "Logging in to ECR..."
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REPO_URI"

echo "Building Docker image..."
docker build -t "$REPO_URI:$IMAGE_TAG" -f apps/medusa/Dockerfile .

echo "Pushing image to ECR..."
docker push "$REPO_URI:$IMAGE_TAG"

echo "Registering task definition..."
cat apps/medusa/task-definition.yaml | \
  sed "s|__ENVIRONMENT__|$ENV|g" | \
  sed "s|__CPU__|$CPU|g" | \
  sed "s|__MEMORY__|$MEMORY|g" | \
  sed "s|__IMAGE_URI__|$REPO_URI:$IMAGE_TAG|g" | \
  sed "s|__EXECUTION_ROLE_ARN__|$EXECUTION_ROLE_ARN|g" | \
  sed "s|__TASK_ROLE_ARN__|$TASK_ROLE_ARN|g" | \
  sed "s|__AWS_REGION__|$REGION|g" | \
  sed "s|__AWS_ACCOUNT_ID__|$AWS_ACCOUNT_ID|g" | \
  sed "s|__CONTAINER_PORT__|$CONTAINER_PORT|g" > /tmp/medusa-task-def.yaml

TASK_DEF_ARN=$(aws ecs register-task-definition \
  --cli-input-yaml file:///tmp/medusa-task-def.yaml \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

echo "Registered task definition: $TASK_DEF_ARN"

CLUSTER_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$NETWORK_STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='ECSClusterName'].OutputValue" \
  --output text \
  --region "$REGION" \
  --no-cli-pager)

SERVICE_NAME="endofszn-${ENV}-medusa"

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

echo ""
echo "Deployment complete!"
echo "Medusa Store API: ${WEBSITE_URL}/store"
echo "Medusa Admin API: ${WEBSITE_URL}/admin"
