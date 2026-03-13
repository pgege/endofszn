import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getSandbox, getWebsiteUrl } from './e2b-manager.js';
import { cleanup } from './shared.js';

const server = new McpServer({
  name: 'sandbox',
  version: '1.0.0',
});

server.tool(
  'write_files',
  'Write one or more files to the storefront sandbox. Use this to create or update source files in the Next.js storefront application.',
  {
    store_id: z.string().describe('The store ID identifying which storefront sandbox to write to'),
    files: z.array(z.object({
      path: z.string().describe('File path relative to /app (e.g. "app/page.tsx", "features/products/components/product-list.tsx")'),
      content: z.string().describe('The full file content to write'),
    })).describe('Array of files to write'),
  },
  async ({ store_id, files }) => {
    const sandbox = await getSandbox(store_id);
    for (const file of files) {
      const fullPath = file.path.startsWith('/') ? file.path : `/app/${file.path}`;
      await sandbox.files.write(fullPath, file.content);
    }
    return { content: [{ type: 'text', text: `Wrote ${files.length} file(s)` }] };
  }
);

server.tool(
  'read_file',
  'Read a file from the storefront sandbox.',
  {
    store_id: z.string().describe('The store ID identifying which storefront sandbox to read from'),
    path: z.string().describe('File path relative to /app (e.g. "app/page.tsx")'),
  },
  async ({ store_id, path }) => {
    const sandbox = await getSandbox(store_id);
    const fullPath = path.startsWith('/') ? path : `/app/${path}`;
    const content = await sandbox.files.read(fullPath);
    return { content: [{ type: 'text', text: content }] };
  }
);

server.tool(
  'list_files',
  'List files and directories in the storefront sandbox.',
  {
    store_id: z.string().describe('The store ID identifying which storefront sandbox to list files from'),
    path: z.string().default('/app').describe('Directory path to list (default: /app)'),
  },
  async ({ store_id, path }) => {
    const sandbox = await getSandbox(store_id);
    const fullPath = path.startsWith('/') ? path : `/app/${path}`;
    const entries = await sandbox.files.list(fullPath);
    const listing = entries.map(e => `${e.type === 'dir' ? 'd' : 'f'} ${e.name}`).join('\n');
    return { content: [{ type: 'text', text: listing }] };
  }
);

server.tool(
  'run_command',
  'Execute a shell command inside the storefront sandbox. Use this for installing packages, running builds, or other shell operations.',
  {
    store_id: z.string().describe('The store ID identifying which storefront sandbox to run the command in'),
    command: z.string().describe('The shell command to execute'),
    cwd: z.string().default('/app').describe('Working directory for the command (default: /app)'),
    timeout_ms: z.number().default(60000).describe('Timeout in milliseconds (default: 60000)'),
  },
  async ({ store_id, command, cwd, timeout_ms }) => {
    const sandbox = await getSandbox(store_id);
    const result = await sandbox.commands.run(command, {
      cwd: cwd.startsWith('/') ? cwd : `/app/${cwd}`,
      timeoutMs: timeout_ms,
    });
    const output = [
      result.stdout ? `stdout:\n${result.stdout}` : '',
      result.stderr ? `stderr:\n${result.stderr}` : '',
      `exit code: ${result.exitCode}`,
    ].filter(Boolean).join('\n\n');
    return { content: [{ type: 'text', text: output }] };
  }
);

server.tool(
  'get_website_url',
  'Get the public URL of the storefront website running in the sandbox. Use this to share the live preview URL.',
  {
    store_id: z.string().describe('The store ID identifying which storefront sandbox to get the URL for'),
  },
  async ({ store_id }) => {
    const url = await getWebsiteUrl(store_id);
    return { content: [{ type: 'text', text: url }] };
  }
);

server.tool(
  'restart_website',
  'Restart the Next.js dev server in the storefront sandbox. Use this after making changes that require a full restart.',
  {
    store_id: z.string().describe('The store ID identifying which storefront sandbox to restart'),
  },
  async ({ store_id }) => {
    const sandbox = await getSandbox(store_id);
    await sandbox.commands.run('pkill -f "next dev" || true', { cwd: '/app' });
    await sandbox.commands.run('nohup yarn dev --port 3000 > /tmp/next.log 2>&1 &', { cwd: '/app' });
    return { content: [{ type: 'text', text: 'Website restarted. It may take a few seconds to become available.' }] };
  }
);

server.tool(
  'get_logs',
  'Get the recent logs from the Next.js dev server in the sandbox.',
  {
    store_id: z.string().describe('The store ID identifying which storefront sandbox to get logs from'),
    lines: z.number().default(50).describe('Number of recent log lines to return (default: 50)'),
  },
  async ({ store_id, lines }) => {
    const sandbox = await getSandbox(store_id);
    const result = await sandbox.commands.run(`tail -n ${lines} /tmp/next.log 2>/dev/null || echo "No logs available"`, {
      cwd: '/app',
    });
    return { content: [{ type: 'text', text: result.stdout || result.stderr || 'No logs available' }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Sandbox MCP server running on stdio');
}

process.on('SIGINT', async () => {
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(0);
});

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
