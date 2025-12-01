import path from 'node:path';
import transform from 'doctoc/lib/transform';

import { logger } from '../logger.js';
import { readText, writeText } from '../utils/fs.js';

export async function injectToc(markdownPath: string) {
    logger.info('目次情報 (DocToc) を更新しています…');
    const current = await readText(markdownPath);
    const result = transform(current, 'github.com', 3, undefined, true);

    if (!result.transformed) {
        logger.warn('DocToc の対象ヘッダーが見つからなかったため、目次は更新されませんでした。');
        return;
    }

    await writeText(markdownPath, result.data);
    logger.succ(`DocToc を ${path.relative('.', markdownPath)} に書き込みました`);
}
