# EndofSzn

Monorepo for the EndofSzn platform.

## Prerequisites

- Node.js 22+
- Yarn 4+
- Docker
- AWS CLI configured

## Local Development

```bash
# Install dependencies
yarn install

# Start local infrastructure (Postgres, Redis)
yarn infra:up

# Pull environment variables from AWS Secrets Manager
yarn setup:local

# Start the API
cd apps/api && yarn dev

# Start the web app (in another terminal)
cd apps/web && yarn dev
```

The web app runs at `http://localhost:4200` and proxies `/api/*` to `http://localhost:3000`.

## Project Structure

```
apps/
├── api/          # NestJS API with Prisma
└── web/          # React frontend with Vite
infrastructure/
└── cloudformation/
    ├── network.yaml      # VPC, subnets, ECS cluster
    ├── gateway.yaml      # ALB, CloudFront, S3
    └── api-service.yaml  # API ECS service
scripts/
├── deploy-*.sh   # Deployment scripts
├── destroy-*.sh  # Teardown scripts
└── setup-env.sh  # Environment setup
```

## AWS Infrastructure

### Architecture

```
                         CloudFront
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         /api/*          /assets/*         /*
              │              │              │
              ▼              ▼              ▼
            ALB            S3             S3
              │         (cached)      (SPA routing)
              ▼
         ECS Fargate
         (API Service)
```

### CloudFormation Stacks

| Stack | Template | Description |
|-------|----------|-------------|
| `endofszn-network-{env}` | `network.yaml` | VPC, subnets, NAT, ECS cluster, Cloud Map, IAM roles |
| `endofszn-gateway-{env}` | `gateway.yaml` | ALB, CloudFront, S3 bucket, cache policies |
| `endofszn-api-{env}` | `api-service.yaml` | ECR, task definition, ECS service, target group |

### Cross-Stack References

Stacks share information via CloudFormation Exports/Imports:

```
network.yaml
  └─ Exports: VPC, subnets, security groups, ECS cluster, IAM roles
        │
        ▼
gateway.yaml
  └─ Exports: ALB, CloudFront, S3 bucket, listener ARN
        │
        ▼
api-service.yaml
  └─ Exports: ECR URI, service name
```

### Deployment Order

Deploy in this order (dependencies must exist first):

```bash
# 1. Network (VPC, ECS Cluster) - rarely changes
yarn deploy:network:dev

# 2. Gateway (ALB, CloudFront, S3) - rarely changes
yarn deploy:gateway:dev

# 3. API service infrastructure
yarn deploy:api-infra:dev

# 4. Deploy application code
yarn deploy:api:dev
yarn deploy:web:dev
```

### Teardown Order

Destroy in reverse order:

```bash
yarn destroy:api-infra:dev
yarn destroy:gateway:dev
yarn destroy:network:dev
```

## Environment Variables

### API (Backend)

| Variable | Description |
|----------|-------------|
| `API_PORT` | Port the API listens on (default: 3000) |
| `API_CORS_ORIGINS` | Comma-separated allowed origins |
| `DATABASE_URL` | PostgreSQL connection string |

### Web (Frontend)

| Variable | Description |
|----------|-------------|
| `VITE_WEB_ENV` | Environment name |

In production, the frontend uses relative paths (`/api/*`) - no API URL configuration needed.

## AWS Secrets Manager

Secrets are stored per environment:

- `endofszn-local` - Local development
- `endofszn-dev` - Dev environment
- `endofszn-staging` - Staging environment
- `endofszn-prod` - Production environment

## Scripts

| Script | Description |
|--------|-------------|
| `yarn infra:up` | Start local Docker infrastructure |
| `yarn infra:down` | Stop local Docker infrastructure |
| `yarn setup:local` | Pull secrets from AWS for local dev |
| `yarn deploy:network:{env}` | Deploy VPC and ECS cluster |
| `yarn deploy:gateway:{env}` | Deploy ALB, CloudFront, S3 |
| `yarn deploy:api-infra:{env}` | Deploy API ECS service infrastructure |
| `yarn deploy:api:{env}` | Build and deploy API code |
| `yarn deploy:web:{env}` | Build and deploy web app |

## Adding a New Service

1. Copy `infrastructure/cloudformation/api-service.yaml` to `{service}-service.yaml`
2. Update resource names, ports, and paths
3. Create deploy/destroy scripts
4. The new service automatically gets:
   - Access to shared VPC, ECS cluster, IAM roles
   - Routing via shared ALB + CloudFront
   - Service discovery via Cloud Map (`{service}.endofszn-{env}.local`)
