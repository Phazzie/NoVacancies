import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const host = process.env.E2E_HOST || '127.0.0.1';
const port = Number(process.env.E2E_PORT || 8080);

const mimeTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8'
};

function safeResolvePath(requestPathname) {
    const pathname = decodeURIComponent(requestPathname || '/');
    const normalizedPath = pathname.replace(/\\/g, '/');
    const relativePath = normalizedPath === '/' ? '/index.html' : normalizedPath;
    const resolvedPath = path.resolve(projectRoot, `.${relativePath}`);

    if (!resolvedPath.startsWith(projectRoot)) {
        return null;
    }
    return resolvedPath;
}

async function isRegularFile(targetPath) {
    try {
        const fileStats = await stat(targetPath);
        return fileStats.isFile();
    } catch {
        return false;
    }
}

const server = http.createServer(async (req, res) => {
    const requestPathname = new URL(req.url || '/', `http://${host}:${port}`).pathname;
    const resolvedPath = safeResolvePath(requestPathname);
    if (!resolvedPath) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
    }

    let filePath = resolvedPath;
    if (!(await isRegularFile(filePath))) {
        filePath = path.join(projectRoot, 'index.html');
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extension] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });

    const stream = createReadStream(filePath);
    stream.on('error', () => {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Server error');
    });
    stream.pipe(res);
});

server.listen(port, host, () => {
    console.log(`[E2E StaticServer] Listening on http://${host}:${port}`);
});
