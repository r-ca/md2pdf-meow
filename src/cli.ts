import { DIST_INLINE_HTML, DIST_PDF, TEMPLATE_FILE, WORK_MARKDOWN_HTML, WORK_TEMPLATE_HTML } from './config.js';
import { logger } from './logger.js';
import { concatMarkdown } from './pipeline/concatMarkdown.js';
import { generatePdf } from './pipeline/generatePdf.js';
import { injectToc } from './pipeline/generateToc.js';
import { inlineAssets } from './pipeline/inlineAssets.js';
import { prepareWorkspace } from './pipeline/prepareWorkspace.js';
import { AssetManager } from './pipeline/assetManager.js';
import { renderMarkdownToHtml } from './pipeline/renderMarkdown.js';
import { renderTemplate } from './pipeline/renderTemplate.js';
import { loadMeta } from './pipeline/loadMeta.js';

async function runPipeline() {
    logger.info('md2pdf-meow のビルドを開始します。');
    await prepareWorkspace();
    const assetManager = new AssetManager();
    const { outputPath: markdownPath, orderedFiles } = await concatMarkdown(assetManager);
    assetManager.report();
    await injectToc(markdownPath);
    await renderMarkdownToHtml(markdownPath, WORK_MARKDOWN_HTML, assetManager, orderedFiles);
    const meta = await loadMeta();
    await renderTemplate(TEMPLATE_FILE, WORK_TEMPLATE_HTML, meta);
    await inlineAssets(WORK_TEMPLATE_HTML, DIST_INLINE_HTML);
    await generatePdf(DIST_INLINE_HTML, DIST_PDF);
}

async function main() {
    try {
        await runPipeline();
        logger.succ('PDF 生成パイプラインが完了しました 🐈');
    } catch (error) {
        logger.error(`ビルドに失敗しました: ${(error as Error).message}`);
        if (error instanceof Error && error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

main();
