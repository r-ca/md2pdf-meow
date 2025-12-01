import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function ensureDir(targetPath: string) {
    await fs.mkdir(targetPath, { recursive: true });
}

export async function resetDir(targetPath: string) {
    await fs.rm(targetPath, { recursive: true, force: true });
    await fs.mkdir(targetPath, { recursive: true });
}

export async function readText(filePath: string) {
    return fs.readFile(filePath, 'utf8');
}

export async function writeText(filePath: string, content: string) {
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf8');
}

export async function pathExists(filePath: string) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}
