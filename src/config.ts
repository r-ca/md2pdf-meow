import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, '..');
export const DOCUMENTS_DIR = path.join(ROOT_DIR, 'documents');
export const DOCUMENT_LIST = path.join(DOCUMENTS_DIR, 'files.txt');
export const WORK_DIR = path.join(ROOT_DIR, 'work');
export const DIST_DIR = path.join(ROOT_DIR, 'dist');
export const WORK_ASSETS_DIR = path.join(WORK_DIR, 'assets');
export const DIST_ASSETS_DIR = path.join(DIST_DIR, 'assets');
export const TEMPLATE_FILE = path.join(ROOT_DIR, 'template', 'template.html');
export const WORK_MARKDOWN = path.join(WORK_DIR, 'all.md');
export const WORK_MARKDOWN_HTML = path.join(WORK_DIR, 'all_md.html');
export const WORK_TEMPLATE_HTML = path.join(WORK_DIR, 'all.html');
export const DIST_INLINE_HTML = path.join(DIST_DIR, 'all.html');
export const DIST_PDF = path.join(DIST_DIR, 'result.pdf');
