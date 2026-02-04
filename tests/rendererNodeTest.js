/**
 * Node runner for renderer tests.
 *
 * Uses JSDOM so renderer tests can run in CI via `npm test`.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const DEFAULT_RENDERER_TIMEOUT_MS = 60000;

function getRendererTimeoutMs() {
    const fromEnv = Number.parseInt(process.env.RENDERER_TEST_TIMEOUT_MS || '', 10);
    if (!Number.isFinite(fromEnv) || fromEnv <= 0) {
        return DEFAULT_RENDERER_TIMEOUT_MS;
    }
    return fromEnv;
}

function summarizeActiveHandles() {
    if (typeof process._getActiveHandles !== 'function') {
        return 'Active handle diagnostics unavailable on this runtime.';
    }

    const handles = process._getActiveHandles();
    if (!handles || handles.length === 0) {
        return 'No active handles reported.';
    }

    const summary = handles
        .slice(0, 10)
        .map((handle, index) => {
            const handleName = handle?.constructor?.name || typeof handle;
            return `${index + 1}. ${handleName}`;
        })
        .join('\n');

    return `Active handles: ${handles.length}\n${summary}`;
}

function summarizeActiveRequests() {
    if (typeof process._getActiveRequests !== 'function') {
        return 'Active request diagnostics unavailable on this runtime.';
    }

    const requests = process._getActiveRequests();
    if (!requests || requests.length === 0) {
        return 'No active requests reported.';
    }

    const summary = requests
        .slice(0, 10)
        .map((request, index) => {
            const requestName = request?.constructor?.name || typeof request;
            return `${index + 1}. ${requestName}`;
        })
        .join('\n');

    return `Active requests: ${requests.length}\n${summary}`;
}

async function createDomEnvironment() {
    const [html, css] = await Promise.all([
        fs.readFile(path.join(projectRoot, 'index.html'), 'utf8'),
        fs.readFile(path.join(projectRoot, 'style.css'), 'utf8')
    ]);

    const htmlWithStyles = html.replace('</head>', `<style>${css}</style></head>`);

    const dom = new JSDOM(htmlWithStyles, {
        url: 'http://localhost/',
        pretendToBeVisual: true
    });

    const setGlobal = (key, value) => {
        try {
            globalThis[key] = value;
        } catch {
            Object.defineProperty(globalThis, key, {
                configurable: true,
                writable: true,
                value
            });
        }
    };

    setGlobal('window', dom.window);
    setGlobal('document', dom.window.document);
    setGlobal('navigator', dom.window.navigator);
    setGlobal('HTMLElement', dom.window.HTMLElement);
    setGlobal('Node', dom.window.Node);
    setGlobal('getComputedStyle', dom.window.getComputedStyle.bind(dom.window));

    const raf = (callback) => setTimeout(() => callback(Date.now()), 0);
    globalThis.requestAnimationFrame = raf;
    globalThis.cancelAnimationFrame = clearTimeout;
    dom.window.requestAnimationFrame = raf;
    dom.window.cancelAnimationFrame = clearTimeout;

    return dom;
}

function createTimeoutGuard(timeoutMs) {
    let timeoutId = null;

    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            const diagnostics = [
                `Renderer tests stalled after ${timeoutMs}ms.`,
                summarizeActiveHandles(),
                summarizeActiveRequests()
            ].join('\n\n');

            reject(new Error(diagnostics));
        }, timeoutMs);
    });

    return {
        timeoutPromise,
        clear: () => {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }
        }
    };
}

async function run() {
    const timeoutMs = getRendererTimeoutMs();
    const startedAt = Date.now();
    const dom = await createDomEnvironment();
    const timeoutGuard = createTimeoutGuard(timeoutMs);

    try {
        const { runAllRendererTests } = await import('./rendererTest.js');
        const passed = await Promise.race([runAllRendererTests(), timeoutGuard.timeoutPromise]);
        if (!passed) {
            throw new Error('Renderer tests reported failure.');
        }
        const elapsedMs = Date.now() - startedAt;
        console.log(`[RendererNodeTest] Completed successfully in ${elapsedMs}ms`);
    } finally {
        timeoutGuard.clear();
        dom.window.close();
    }
}

run()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('Renderer test runner crashed:', error);
        process.exit(1);
    });
