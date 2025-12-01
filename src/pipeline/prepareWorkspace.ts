import { DIST_DIR, WORK_DIR } from '../config.js';
import { logger } from '../logger.js';
import { resetDir } from '../utils/fs.js';

export async function prepareWorkspace() {
    logger.info('作業ディレクトリを初期化しています…');
    await resetDir(WORK_DIR);
    await resetDir(DIST_DIR);
    logger.succ('作業ディレクトリを初期化しました');
}
