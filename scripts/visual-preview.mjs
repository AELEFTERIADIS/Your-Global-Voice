// Serve precisely the deployable Pages artifact, never the repository tree.
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { preparePages, pagesFiles, assets } from './prepare-pages.mjs';
const root = await mkdtemp(join(tmpdir(), 'ygv-responsive-'));
const destination = join(root, 'pages');
await preparePages(destination, 'https://ygv-contact.andyelft.workers.dev');
const allowed = new Set([...pagesFiles, ...assets]);
const mime = { html: 'text/html', css: 'text/css', js: 'text/javascript', png: 'image/png', webp: 'image/webp', svg: 'image/svg+xml', woff: 'font/woff', woff2: 'font/woff2' };
const server = createServer(async (req, res) => {
 const file = new URL(req.url, 'http://localhost').pathname.slice(1);
 if (!allowed.has(file)) { res.writeHead(404); return res.end(); }
 try { res.setHeader('Cache-Control', 'no-store'); res.setHeader('Content-Type', mime[file.split('.').at(-1).toLowerCase()] || 'text/plain'); res.end(await readFile(join(destination, file))); }
 catch { res.writeHead(500); res.end(); }
});
server.listen(3107, '127.0.0.1');
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => server.close(async () => { await rm(root, { recursive: true, force: true }); process.exit(0); }));
