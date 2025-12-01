export const FILE_MARKER_PREFIX = '<!-- md2pdf-file:';
export const FILE_MARKER_SUFFIX = '-->';

export function createFileMarker(relativePath: string) {
    return `${FILE_MARKER_PREFIX}${relativePath}${FILE_MARKER_SUFFIX}`;
}
