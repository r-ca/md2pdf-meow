import path from 'node:path';
import puppeteer from 'puppeteer';
import PuppeteerHTMLPDF from 'puppeteer-html-pdf';

import { logger } from '../logger.js';
import { pathExists } from '../utils/fs.js';

async function getEnvExecutable() {
    const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (envPath && (await pathExists(envPath))) {
        return envPath;
    }
    return undefined;
}

function getPlatformCandidates() {
    if (process.platform === 'win32') {
        return [
            'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
            'C:\\\\Program Files (x86)\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
            'C:\\\\Program Files\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe'
        ];
    }
    if (process.platform === 'darwin') {
        return [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Chromium.app/Contents/MacOS/Chromium',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
        ];
    }
    return [
        process.env.CHROME_PATH,
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/usr/bin/microsoft-edge',
        '/snap/bin/chromium'
    ].filter((value): value is string => Boolean(value));
}

async function findChromiumExecutable() {
    const envPath = await getEnvExecutable();
    if (envPath) {
        return envPath;
    }

    try {
        const internalPath = puppeteer.executablePath?.();
        if (internalPath && (await pathExists(internalPath))) {
            return internalPath;
        }
    } catch (error) {
        logger.warn(`Puppeteer の実行ファイル検出で問題が発生しました: ${(error as Error).message}`);
    }

    const candidates = getPlatformCandidates();
    for (const candidate of candidates) {
        if (await pathExists(candidate)) {
            return candidate;
        }
    }

    return undefined;
}

export async function generatePdf(htmlPath: string, pdfPath: string) {
    logger.info('Chromium / Chrome の実行ファイルを確認しています…');
    const executablePath = await findChromiumExecutable();

    if (!executablePath) {
        throw new Error(
            'Chromium / Chrome の実行ファイルが見つかりませんでした。' +
                'PUPPETEER_EXECUTABLE_PATH を設定するか、Chrome/Chromium をインストールしてください。'
        );
    }

    const htmlPdf = new PuppeteerHTMLPDF();
    await htmlPdf.setOptions({
        format: 'A4',
        margin: {
            top: '16mm',
            right: '16mm',
            bottom: '16mm',
            left: '16mm'
        },
        printBackground: true,
        executablePath
    });

    logger.info('HTML から PDF を生成しています…');
    const html = await htmlPdf.readFile(htmlPath, 'utf8');
    const pdfBuffer = await htmlPdf.create(html);
    await htmlPdf.writeFile(pdfBuffer, pdfPath);
    logger.succ(`${path.relative('.', pdfPath)} を作成しました`);
}
