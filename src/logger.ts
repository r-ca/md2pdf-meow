import chalk from 'chalk';

// 'SUCC' を型に追加
type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SUCC';

function format(level: LogLevel, message: string): string {
    switch (level) {
        case 'INFO':
            return `${chalk.cyan.bold('[INFO]')}  ${message}`;
        case 'WARN':
            return `${chalk.yellow.bold('[WARN]')}  ${message}`;
        case 'ERROR':
            return `${chalk.red.bold('[ERROR]')} ${chalk.red(message)}`;
        case 'SUCC':
            return `${chalk.green.bold('[SUCC]')}  ${message}`;
        default:
            return `[${level}] ${message}`;
    }
}

export const logger = {
    info(message: string) {
        console.log(format('INFO', message));
    },
    warn(message: string) {
        console.warn(format('WARN', message));
    },
    error(message: string) {
        console.error(format('ERROR', message));
    },
    succ(message: string) {
        console.log(format('SUCC', message));
    }
};
