import MarkdownIt from 'markdown-it';
import implicitFigures from 'markdown-it-implicit-figures';
import namedHeaders from 'markdown-it-named-headers';
import anchor from 'anchor-markdown-header';
import path from 'node:path';

import { DOCUMENTS_DIR } from '../config.js';
import { logger } from '../logger.js';
import { readText, writeText } from '../utils/fs.js';
import { AssetManager } from './assetManager.js';
import { FILE_MARKER_PREFIX, FILE_MARKER_SUFFIX } from './fileMarkers.js';

/**
 * 元々の scripts/mdit.js (2SC1815J/md2pdf, MIT License) を TypeScript へ移植したレンダラー。
 * スラッグ生成ロジックはフォーク元の実装をベースにしている。
 */
function createRenderer(assetManager: AssetManager) {
    const headerInstances: Record<string, number> = {};

    const renderer = new MarkdownIt({ html: true })
        .use(namedHeaders, {
            slugify(header: string) {
                if (headerInstances[header] !== undefined) {
                    headerInstances[header]++;
                } else {
                    headerInstances[header] = 0;
                }
                const slug = anchor(header, 'github.com', headerInstances[header]);
                const match = slug.match(/]\(#(.+?)\)$/);
                return match ? decodeURI(match[1]) : header;
            }
        })
        .use(implicitFigures, {
            figcaption: true
        });

    const defaultImageRule = renderer.renderer.rules.image;
    renderer.renderer.rules.image = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        const src = token.attrGet('src');
        const sourceFile = (env as { currentFile?: string }).currentFile;
        if (src && sourceFile) {
            const resolved = assetManager.resolve(sourceFile, src);
            if (resolved) {
                token.attrSet('src', resolved);
            }
        }
        if (defaultImageRule) {
            return defaultImageRule(tokens, idx, options, env, self);
        }
        return self.renderToken(tokens, idx, options);
    };

    return renderer;
}

interface MarkdownSegment {
    filePath: string;
    content: string;
}

function toAbsoluteDocumentPath(relativePath: string) {
    return path.resolve(DOCUMENTS_DIR, relativePath.trim());
}

function splitByFileMarkers(markdown: string, defaultFile?: string): MarkdownSegment[] {
    const segments: MarkdownSegment[] = [];
    const markerRegex = new RegExp(`${FILE_MARKER_PREFIX}(.*?)${FILE_MARKER_SUFFIX}`, 'g');
    let currentFile = defaultFile;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = markerRegex.exec(markdown)) !== null) {
        const chunk = markdown.slice(lastIndex, match.index);
        if (chunk && currentFile) {
            segments.push({ filePath: currentFile, content: chunk });
        }
        currentFile = toAbsoluteDocumentPath(match[1]);
        lastIndex = markerRegex.lastIndex;
    }

    const tail = markdown.slice(lastIndex);
    if (tail && currentFile) {
        segments.push({ filePath: currentFile, content: tail });
    }

    return segments;
}

export async function renderMarkdownToHtml(
    markdownPath: string,
    outputPath: string,
    assetManager: AssetManager,
    orderedFiles: string[]
) {
    logger.info('Markdown から HTML へ変換しています…');
    const markdown = await readText(markdownPath);
    const renderer = createRenderer(assetManager);
    const defaultFile = orderedFiles[0];
    const segments = splitByFileMarkers(markdown, defaultFile);

    if (segments.length === 0) {
        const html = renderer.render(markdown);
        await writeText(outputPath, html);
        logger.succ(`${path.relative('.', outputPath)} を生成しました`);
        return;
    }

    const htmlParts: string[] = [];
    for (const segment of segments) {
        htmlParts.push(renderer.render(segment.content, { currentFile: segment.filePath }));
    }

    const html = htmlParts.join('');
    await writeText(outputPath, html);
    logger.succ(`${path.relative('.', outputPath)} を生成しました`);
}
