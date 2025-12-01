import path from 'node:path';

import { DOCUMENTS_DIR, DOCUMENT_LIST, WORK_MARKDOWN } from '../config.js';
import { logger } from '../logger.js';
import { AssetManager } from './assetManager.js';
import { createFileMarker } from './fileMarkers.js';
import { pathExists, readText, writeText } from '../utils/fs.js';

export interface MarkdownBundleResult {
    outputPath: string;
    orderedFiles: string[];
}

function normalizeEntries(rawList: string) {
    return rawList
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('#'));
}

export async function concatMarkdown(assetManager: AssetManager): Promise<MarkdownBundleResult> {
    logger.info('documents/files.txt を読み込み Markdown を連結します…');
    const rawList = await readText(DOCUMENT_LIST);
    const entries = normalizeEntries(rawList);

    if (entries.length === 0) {
        throw new Error('documents/files.txt に有効なエントリがありません。');
    }

    const orderedFiles = entries.map((entry) => path.resolve(DOCUMENTS_DIR, entry));
    for (const filePath of orderedFiles) {
        if (!(await pathExists(filePath))) {
            throw new Error(`Markdown ファイルが見つかりません: ${path.relative(DOCUMENTS_DIR, filePath)}`);
        }
    }

    const parts: string[] = [];
    for (const filePath of orderedFiles) {
        logger.info(`  - ${path.relative(DOCUMENTS_DIR, filePath)} を連結対象に追加しました`);
        const markdown = await readText(filePath);
        await assetManager.scanMarkdown(filePath, markdown);
        const relativePath = path.relative(DOCUMENTS_DIR, filePath).replace(/\\/g, '/');
        const marker = createFileMarker(relativePath);
        parts.push(`${marker}\n${markdown.trim()}`);
    }

    const combined = parts.join('\n\n\n') + '\n';
    await writeText(WORK_MARKDOWN, combined);
    logger.succ(`連結済み Markdown を ${path.relative('.', WORK_MARKDOWN)} に保存しました`);

    return {
        outputPath: WORK_MARKDOWN,
        orderedFiles
    };
}
