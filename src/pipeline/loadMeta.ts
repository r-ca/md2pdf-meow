import path from 'node:path';
import { parse as parseYaml } from 'yaml';

import { DOCUMENTS_DIR } from '../config.js';
import { logger } from '../logger.js';
import { pathExists, readText } from '../utils/fs.js';

export interface DocumentMetaSection {
    title?: string;
    author?: string;
    published?: string;
    pubDate?: string;
    copyright?: string;
    description?: string;
}

export interface DocumentMeta {
    title: string;
    author: string;
    published: string;
    description?: string;
    copyright: string;
    frontCover?: DocumentMetaSection;
    backCover?: DocumentMetaSection;
}

const META_FILES = ['_meta.yaml', '_meta.yml'];

const DEFAULT_META: DocumentMeta = {
    title: 'Template',
    author: 'ろむねこ',
    published: '0000/000/00',
    copyright: 'template',
    description: ''
};

function toRecord(value: unknown): Record<string, unknown> | undefined {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }
    return undefined;
}

function pickString(value: unknown): string | undefined {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
}

function buildSection(value: unknown): DocumentMetaSection | undefined {
    const record = toRecord(value);
    if (!record) {
        return undefined;
    }
    const section: DocumentMetaSection = {};
    const title = pickString(record.title);
    const author = pickString(record.author);
    const published = pickString(record.published);
    const pubDate = pickString(record.pubDate);
    const copyright = pickString(record.copyright);
    const description = pickString(record.description);

    if (title) section.title = title;
    if (author) section.author = author;
    if (published) section.published = published;
    if (pubDate) section.pubDate = pubDate;
    if (copyright) section.copyright = copyright;
    if (description) section.description = description;

    return Object.keys(section).length > 0 ? section : undefined;
}

function mergeMeta(partial: Record<string, unknown>): DocumentMeta {
    return {
        title: pickString(partial.title) ?? DEFAULT_META.title,
        author: pickString(partial.author) ?? DEFAULT_META.author,
        published: pickString(partial.published) ?? DEFAULT_META.published,
        description: pickString(partial.description) ?? DEFAULT_META.description,
        copyright: pickString(partial.copyright) ?? DEFAULT_META.copyright,
        frontCover: buildSection(partial.frontCover),
        backCover: buildSection(partial.backCover)
    };
}

async function loadYamlMeta(filePath: string) {
    const raw = await readText(filePath);
    try {
        const parsed = parseYaml(raw);
        const record = toRecord(parsed);
        if (!record) {
            throw new Error('YAML の内容がオブジェクトではありません。');
        }
        return mergeMeta(record);
    } catch (error) {
        throw new Error(`YAML を解析できませんでした (${path.basename(filePath)}): ${(error as Error).message}`);
    }
}

export async function loadMeta(): Promise<DocumentMeta> {
    for (const filename of META_FILES) {
        const fullPath = path.join(DOCUMENTS_DIR, filename);
        if (await pathExists(fullPath)) {
            logger.info(`メタ情報ファイル ${filename} を読み込みます`);
            const meta = await loadYamlMeta(fullPath);
            logMetaInfo(meta, filename);
            logger.succ('メタ情報の読み込みが完了しました');
            return meta;
        }
    }
    logger.info('メタ情報ファイルが見つからなかったため、テンプレートのデフォルト値を使用します');
    logMetaInfo(DEFAULT_META, 'default');
    logger.succ('メタ情報の読み込みが完了しました');
    return DEFAULT_META;
}

function logMetaInfo(meta: DocumentMeta, source: string) {
    logger.info(`├─ meta source: ${source}`);
    logger.info(`│   ├─ title: ${meta.title}`);
    logger.info(`│   ├─ author: ${meta.author}`);
    logger.info(`│   ├─ published: ${meta.published}`);
    if (meta.description) {
        logger.info(`│   ├─ description: ${meta.description}`);
    }
    logger.info(`│   └─ copyright: ${meta.copyright}`);
    logSection('frontCover', meta.frontCover);
    logSection('backCover', meta.backCover);
}

function logSection(label: string, section?: DocumentMetaSection) {
    if (!section) {
        return;
    }
    logger.info(`├─ ${label}:`);
    if (section.title) logger.info(`│   ├─ title: ${section.title}`);
    if (section.author) logger.info(`│   ├─ author: ${section.author}`);
    if (section.published) logger.info(`│   ├─ published: ${section.published}`);
    if (section.pubDate) logger.info(`│   ├─ pubDate: ${section.pubDate}`);
    if (section.description) logger.info(`│   ├─ description: ${section.description}`);
    if (section.copyright) logger.info(`│   └─ copyright: ${section.copyright}`);
}
