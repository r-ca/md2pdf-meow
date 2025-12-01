import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import htmlInline from 'html-inline';

import { logger } from '../logger.js';

export async function inlineAssets(inputPath: string, outputPath: string) {
    logger.info('HTML 内の CSS / 画像 / スクリプトをインライン展開しています…');
    const transformer = htmlInline({ basedir: path.dirname(inputPath) });
    await pipeline(fs.createReadStream(inputPath), transformer, fs.createWriteStream(outputPath));
    logger.succ(`${path.relative('.', outputPath)} にインライン済み HTML を出力しました`);
}
