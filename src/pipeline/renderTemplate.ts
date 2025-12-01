import { promisify } from 'node:util';
import path from 'node:path';
import ejs from 'ejs';
import tidy from 'htmltidy2';

import { logger } from '../logger.js';
import { writeText } from '../utils/fs.js';

const renderFile = promisify(ejs.renderFile);
const tidyHtml = promisify(tidy.tidy);

/**
 * scripts/ejs.js (2SC1815J/md2pdf, MIT License) を TypeScript 化し、
 * HTML Tidy 設定もフォーク元に合わせている。
 */
export async function renderTemplate(templatePath: string, outputPath: string) {
    logger.info('テンプレート HTML を描画しています…');
    const rendered = await renderFile(templatePath);
    const tidied = await tidyHtml(rendered, {
        doctype: 'html5',
        indent: 'auto',
        wrap: 0,
        tidyMark: false,
        quoteAmpersand: false,
        hideComments: true,
        dropEmptyElements: false,
        newline: 'LF'
    });
    await writeText(outputPath, tidied);
    logger.succ(`${path.relative('.', outputPath)} を整形済み HTML として保存しました`);
}
