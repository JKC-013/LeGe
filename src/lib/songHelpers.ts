export interface ParsedSongPdfs {
  versionPdfs: Record<string, string>;
  versionKeys: Record<string, string>;
  defaultPdf: string;
}

/**
 * Parses the pdfUrl field of a song.
 * Supports backward-compatible plain URL strings and JSON objects mapping version -> pdfUrl and version -> key.
 */
export function parseSongPdfs(pdfUrl?: string | null, versions?: string[]): ParsedSongPdfs {
  if (!pdfUrl) {
    return { versionPdfs: {}, versionKeys: {}, defaultPdf: '' };
  }

  const trimmed = pdfUrl.trim();
  if (trimmed.startsWith('{')) {
    try {
      const data = JSON.parse(trimmed);
      if (data && typeof data === 'object') {
        const rawPdfs = data.versionPdfs || data.pdfs || { ...data };
        const versionPdfs: Record<string, string> = {};
        for (const [k, v] of Object.entries(rawPdfs)) {
          if (k !== 'versionKeys' && k !== 'keysMap' && k !== 'default' && typeof v === 'string') {
            versionPdfs[k] = v;
          }
        }
        const rawKeys = data.versionKeys || data.keysMap || {};
        const versionKeys: Record<string, string> = {};
        if (typeof rawKeys === 'object' && rawKeys !== null) {
          for (const [k, v] of Object.entries(rawKeys)) {
            if (typeof v === 'string') {
              versionKeys[k] = v;
            }
          }
        }
        const defaultPdf = data.default || Object.values(versionPdfs)[0] || '';
        return { versionPdfs, versionKeys, defaultPdf };
      }
    } catch (e) {
      // JSON parse error, treat as raw URL
    }
  }

  // Plain string URL: map to first version or fallback
  const primaryVersion = (versions && versions.length > 0) ? versions[0] : 'Vietnamese';
  return {
    versionPdfs: { [primaryVersion]: trimmed },
    versionKeys: {},
    defaultPdf: trimmed
  };
}

/**
 * Serializes version PDFs and keys into a JSON string to be stored in the pdf_url column.
 */
export function serializeSongPdfs(
  versionPdfs: Record<string, string>,
  versionKeys: Record<string, string> = {},
  fallbackUrl?: string
): string {
  const versions = Object.keys(versionPdfs);
  const defaultPdf = fallbackUrl || (versions.length > 0 ? versionPdfs[versions[0]] : '');
  return JSON.stringify({
    default: defaultPdf,
    versionPdfs,
    versionKeys
  });
}
