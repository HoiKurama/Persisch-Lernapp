import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, ViteDevServer } from 'vite';
import pronunciationHandler from '../api/check-pronunciation.ts';

const API_PATH = '/api/check-pronunciation';

async function readBody(request: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function requestHeaders(request: IncomingMessage): Headers {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (value === undefined) continue;
    headers.set(name, Array.isArray(value) ? value.join(', ') : value);
  }
  return headers;
}

async function handleApiRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const body = request.method === 'GET' || request.method === 'HEAD'
    ? undefined
    : await readBody(request);
  const url = `http://${request.headers.host ?? 'localhost'}${request.url ?? API_PATH}`;
  const webRequest = new Request(url, {
    method: request.method ?? 'GET',
    headers: requestHeaders(request),
    body: body && body.length > 0 ? body : undefined,
    duplex: 'half',
  } as RequestInit & { duplex: 'half' });
  const webResponse = await pronunciationHandler.fetch(webRequest);

  response.statusCode = webResponse.status;
  webResponse.headers.forEach((value, name) => response.setHeader(name, value));
  response.end(Buffer.from(await webResponse.arrayBuffer()));
}

export function pronunciationApi(): Plugin {
  return {
    name: 'local-pronunciation-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (request, response, next) => {
        if (request.url?.split('?')[0] !== API_PATH) {
          next();
          return;
        }

        try {
          await handleApiRequest(request, response);
        } catch (error) {
          next(error);
        }
      });
    },
  };
}
