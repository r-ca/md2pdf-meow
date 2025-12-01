import MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token';
import path from 'node:path';
import { promises as fs } from 'node:fs';

import { DOCUMENTS_DIR, WORK_DIR } from '../config.js';
import { logger } from '../logger.js';
import { ensureDir, pathExists } from '../utils/fs.js';

const scanner = new MarkdownIt({ html: true });

function isExternalSource(value: string) {
    return /^[a-zA-Z][\w+.-]*:/.test(value);
}

function normalizeSource(value: string) {
    let normalized = value.trim();
    if (normalized.startsWith('<') && normalized.endsWith('>')) {
        normalized = normalized.slice(1, -1).trim();
    }
    normalized = normalized.replace(/\\/g, '/');
    try {
        normalized = decodeURI(normalized);
    } catch {
        // ignore decode errors
    }
    return normalized;
}

function splitSegments(relativePath: string) {
    return relativePath.split(/[\\/]/).filter(Boolean);
}

function encodeSegments(segments: string[]) {
    return segments.map((segment) => encodeURIComponent(segment));
}

function buildTarget(relativeSegments: string[]) {
    const encodedSegments = encodeSegments(relativeSegments);
    const targetRelativePosix = ['assets', ...encodedSegments].join('/');
    const targetPath = path.join(WORK_DIR, 'assets', ...encodedSegments);
    return { targetRelativePosix, targetPath };
}

function extractImageSources(tokens: Token[]) {
    const sources: string[] = [];
    for (const token of tokens) {
        if (token.type === 'inline' && token.children) {
            for (const child of token.children) {
                if (child.type === 'image') {
                    const src = child.attrGet('src');
                    if (src) {
                        sources.push(src);
                    }
                }
            }
        }
    }
    return sources;
}

export class AssetManager {
    private assetMap = new Map<string, string>();
    private copiedCount = 0;

    private key(filePath: string, src: string) {
        return `${filePath}::${src}`;
    }

    async scanMarkdown(filePath: string, markdown: string) {
        const tokens = scanner.parse(markdown, {});
        const sources = extractImageSources(tokens);
        for (const source of sources) {
            await this.registerAsset(filePath, source);
        }
    }

    private async registerAsset(filePath: string, rawSource: string) {
        const normalized = normalizeSource(rawSource);
        if (!normalized || isExternalSource(normalized)) {
            return;
        }

        if (path.isAbsolute(normalized)) {
            logger.warn(`絶対パスの画像参照には対応していません: ${normalized}`);
            return;
        }

        const absoluteSource = path.resolve(path.dirname(filePath), normalized);
        if (!(await pathExists(absoluteSource))) {
            logger.warn(`画像ファイルが見つかりません: ${normalized} (参照元: ${path.relative('.', filePath)})`);
            return;
        }

        let relativeFromDocuments = path.relative(DOCUMENTS_DIR, absoluteSource);
        if (relativeFromDocuments.startsWith('..')) {
            relativeFromDocuments = path.basename(absoluteSource);
        }

        const segments = splitSegments(relativeFromDocuments);
        const { targetRelativePosix, targetPath } = buildTarget(segments);
        const targetRelativePath = path.relative('.', targetPath);

        logAssetCopyStart(relativeFromDocuments, targetRelativePath);
        await ensureDir(path.dirname(targetPath));
        await fs.copyFile(absoluteSource, targetPath);
        this.copiedCount++;

        this.assetMap.set(this.key(filePath, rawSource), targetRelativePosix);
        if (rawSource !== normalized) {
            this.assetMap.set(this.key(filePath, normalized), targetRelativePosix);
        }
    }

    resolve(filePath: string, src: string) {
        return (
            this.assetMap.get(this.key(filePath, src)) ??
            this.assetMap.get(this.key(filePath, normalizeSource(src)))
        );
    }

    report() {
        logger.succ(`asset copy total: ${this.copiedCount} file(s)`);
    }
}

function logAssetCopyStart(source: string, target: string) {
    logger.info('├─ asset copy');
    logger.info(`│   ├─ src: ${abbreviate(source)}`);
    logger.info(`│   └─ dst: ${abbreviate(target)}`);
}
