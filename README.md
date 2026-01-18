# EndofSzn

Monorepo for the EndofSzn platform.

## Prerequisites

- Node.js 22+
- Yarn 4+
- Docker
- AWS CLI configured
- jq (for database config script)

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
├── api/                    # NestJS API with Prisma
│   └── task-definition.json  # ECS task definition template
└── web/                    # React frontend with Vite
infrastructure/
└── cloudformation/
    ├── network.yaml        # VPC, subnets, ECS cluster, Cloud Map
    ├── database.yaml       # RDS PostgreSQL, ElastiCache Valkey
    ├── gateway.yaml        # ALB, CloudFront, S3
    └── api-service.yaml    # API ECS service infrastructure
scripts/
├── deploy-*.sh             # Deployment scripts
├── destroy-*.sh            # Teardown scripts
├── get-db-url.sh           # Get database/redis config
└── setup-env.sh            # Environment setup
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
         ECS Fargate ─────► RDS PostgreSQL
         (API Service)         │
              │                │
              └────────► ElastiCache Valkey
```

### CloudFormation Stacks

| Stack | Template | Description |
|-------|----------|-------------|
| `endofszn-network-{env}` | `network.yaml` | VPC, subnets, NAT, ECS cluster, Cloud Map, IAM roles |
| `endofszn-database-{env}` | `database.yaml` | RDS PostgreSQL, ElastiCache Valkey, security groups |
| `endofszn-gateway-{env}` | `gateway.yaml` | ALB, CloudFront, S3 bucket, cache policies |
| `endofszn-api-{env}` | `api-service.yaml` | ECR, ECS service, target group (task def managed separately) |

### Cross-Stack References

Stacks share information via CloudFormation Exports/Imports:

```
network.yaml
  └─ Exports: VPC, subnets, security groups, ECS cluster, IAM roles
        │
        ├──────────────────┐
        ▼                  ▼
database.yaml          gateway.yaml
  └─ Exports:            └─ Exports: ALB, CloudFront, S3, listener ARN
     DB endpoint,              │
     cache endpoint            ▼
                         api-service.yaml
                           └─ Exports: ECR URI, service name
```

### Deployment Order

Deploy in this order (dependencies must exist first):

```bash
# 1. Network (VPC, ECS Cluster) - foundation, rarely changes
yarn deploy:network:dev

# 2. Database (RDS, ElastiCache) - takes ~10-15 min
yarn deploy:database:dev

# 3. Gateway (ALB, CloudFront, S3) - rarely changes
yarn deploy:gateway:dev

# 4. API service infrastructure
yarn deploy:api-infra:dev

# 5. Get database config and update secrets
yarn get-db-url:dev
# Copy the output values to AWS Secrets Manager (endofszn-dev)

# 6. Deploy application code
yarn deploy:api:dev    # Builds image, registers task def, starts service
yarn deploy:web:dev    # Builds and uploads to S3
```

### Teardown Order

Destroy in reverse order:

```bash
yarn destroy:api-infra:dev
yarn destroy:gateway:dev
yarn destroy:database:dev   # Confirmation required
yarn destroy:network:dev
```

## Task Definition Management

The ECS task definition is managed **separately from CloudFormation** for faster deployments:

- **Template**: `apps/api/task-definition.json`
- **Registered by**: `deploy-api.sh` (not CloudFormation)

To update environment variables or secrets:
1. Edit `apps/api/task-definition.json`
2. Run `yarn deploy:api:dev`

No CloudFormation update needed for task definition changes.

## Environment Variables

### API (Backend)

| Variable | Description |
|----------|-------------|
| `API_PORT` | Port the API listens on (default: 3000) |
| `API_CORS_ORIGINS` | Comma-separated allowed origins |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_HOST` | ElastiCache endpoint |
| `REDIS_PORT` | ElastiCache port (default: 6379) |

### Web (Frontend)

| Variable | Description |
|----------|-------------|
| `VITE_WEB_ENV` | Environment name |

In production, the frontend uses relative paths (`/api/*`) - no API URL configuration needed.

## AWS Secrets Manager

Secrets are stored per environment:

| Secret Name | Usage |
|-------------|-------|
| `endofszn-local` | Local development |
| `endofszn-dev` | Dev environment |
| `endofszn-staging` | Staging environment |
| `endofszn-prod` | Production environment |
| `endofszn-{env}-db-credentials` | RDS auto-generated credentials |

### Required Keys in `endofszn-{env}`

```
DATABASE_URL=postgresql://...
API_CORS_ORIGINS=https://your-cloudfront-url.cloudfront.net
REDIS_HOST=your-cache.cache.amazonaws.com
REDIS_PORT=6379
```

Run `yarn get-db-url:{env}` after database deployment to get these values.

## Scripts

| Script | Description |
|--------|-------------|
| `yarn infra:up` | Start local Docker infrastructure |
| `yarn infra:down` | Stop local Docker infrastructure |
| `yarn setup:local` | Pull secrets from AWS for local dev |
| `yarn get-db-url:{env}` | Get DATABASE_URL and Redis config |
| `yarn deploy:network:{env}` | Deploy VPC and ECS cluster |
| `yarn deploy:database:{env}` | Deploy RDS and ElastiCache |
| `yarn deploy:gateway:{env}` | Deploy ALB, CloudFront, S3 |
| `yarn deploy:api-infra:{env}` | Deploy API ECS service infrastructure |
| `yarn deploy:api:{env}` | Build and deploy API code |
| `yarn deploy:web:{env}` | Build and deploy web app |

## Adding a New Service

1. Create `apps/{service}/task-definition.json` (copy from api)
2. Copy `infrastructure/cloudformation/api-service.yaml` to `{service}-service.yaml`
3. Update resource names, ports, and paths
4. Create deploy/destroy scripts
5. The new service automatically gets:
   - Access to shared VPC, ECS cluster, IAM roles
   - Routing via shared ALB + CloudFront (`/{service}/*`)
   - Service discovery via Cloud Map (`{service}.endofszn-{env}.local`)
   - Access to RDS and ElastiCache via security groups

## Accessing Resources

| Resource | Public Access | How to Access Locally |
|----------|--------------|----------------------|
| RDS PostgreSQL | ✅ Yes | Direct connection with credentials |
| ElastiCache | ❌ No (VPC only) | Use local Redis via Docker |
| API | ✅ Via CloudFront | `https://{cloudfront}/api/*` |
| Web | ✅ Via CloudFront | `https://{cloudfront}` |
