const ECR_IMAGE = process.env.ECR_IMAGE || 'public.ecr.aws/endofszn/storefront:latest';

export const TEMPLATE_CONFIG = {
  image: ECR_IMAGE,
  alias: 'storefront',
  startCmd: 'cd /app && yarn dev --port 3000',
  cpuCount: 2,
  memoryMB: 2048,
};
