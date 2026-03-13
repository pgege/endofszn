import { Sandbox } from 'e2b';
import { callApi } from './shared.js';

const MEDUSA_PROTOCOL = process.env.MEDUSA_PROTOCOL || 'http';
const MEDUSA_HOST = process.env.MEDUSA_HOST || 'localhost';
const MEDUSA_PORT = process.env.MEDUSA_PORT || '9000';
const E2B_TEMPLATE = process.env.E2B_TEMPLATE || 'storefront';
const SANDBOX_TIMEOUT_MS = parseInt(process.env.SANDBOX_TIMEOUT_MS || '3600000', 10);

interface StoreConfig {
  id: string;
  storeId: string;
  sandboxId: string | null;
}

const activeSandboxes = new Map<string, Sandbox>();

async function getStoreConfig(storeId: string): Promise<StoreConfig> {
  return callApi('get_store_config', { store_id: storeId });
}

async function updateStoreSandbox(storeId: string, sandboxId: string): Promise<void> {
  await callApi('update_store_sandbox', { store_id: storeId, sandbox_id: sandboxId });
}

async function injectEnvFile(sandbox: Sandbox, storeId: string): Promise<void> {
  const envContent = [
    `STORE_ID=${storeId}`,
    `MEDUSA_PROTOCOL=${MEDUSA_PROTOCOL}`,
    `MEDUSA_HOST=${MEDUSA_HOST}`,
    `MEDUSA_PORT=${MEDUSA_PORT}`,
  ].join('\n');

  await sandbox.files.write('/home/user/.env', envContent);
}

export async function getSandbox(storeId: string): Promise<Sandbox> {
  const cached = activeSandboxes.get(storeId);
  if (cached) {
    try {
      await cached.isRunning();
      await cached.setTimeout(SANDBOX_TIMEOUT_MS);
      return cached;
    } catch {
      activeSandboxes.delete(storeId);
    }
  }

  const config = await getStoreConfig(storeId);

  if (config.sandboxId) {
    try {
      const sandbox = await Sandbox.connect(config.sandboxId);
      await sandbox.setTimeout(SANDBOX_TIMEOUT_MS);
      activeSandboxes.set(storeId, sandbox);
      return sandbox;
    } catch {
      console.log(`Sandbox ${config.sandboxId} not reachable, creating new one for store ${storeId}`);
    }
  }

  const sandbox = await Sandbox.create(E2B_TEMPLATE, {
    metadata: {
      storeId,
    },
    timeoutMs: SANDBOX_TIMEOUT_MS,
  });

  await injectEnvFile(sandbox, storeId);

  await updateStoreSandbox(storeId, sandbox.sandboxId);
  activeSandboxes.set(storeId, sandbox);

  return sandbox;
}

export async function getWebsiteUrl(storeId: string): Promise<string> {
  const sandbox = await getSandbox(storeId);
  const host = sandbox.getHost(3000);
  return `https://${host}`;
}
