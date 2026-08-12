const fs = require('fs');
let content = fs.readFileSync('src/pages/SongDetail.tsx', 'utf8');

// Add import for PdfViewer
content = content.replace(
  "import { ArrowLeft, Star, Mic, Download, Copy, Check, Maximize2, X, ChevronDown } from 'lucide-react';",
  "import { ArrowLeft, Star, Mic, Download, Copy, Check, Maximize2, X, ChevronDown, FileQuestion } from 'lucide-react';\nimport { PdfViewer } from '../components/PdfViewer';"
);

// Determine if the selected version exists for this song
const targetKeys = `                {(!song.keys || song.keys.length === 0) ? (
                  <option value="Empty">{t('song.empty')}</option>
                ) : (
                  song.keys.map(k => <option key={k} value={k}>{k}</option>)
                )}`;

const replacementKeys = `                {(!song.keys || song.keys.length === 0 || !song.versions?.includes(selectedVersion)) ? (
                  <option value="Empty">{t('song.empty')}</option>
                ) : (
                  song.keys.map(k => <option key={k} value={k}>{k}</option>)
                )}`;
content = content.replace(targetKeys, replacementKeys);

const targetPdf = `          {song.pdfUrl ? (
            <iframe 
              src={\`\${song.pdfUrl}#toolbar=0\`} 
              className="w-full h-full border-none"
              title="PDF Viewer"
            ></iframe>
          ) : (
            <div className="flex items-center justify-center h-full text-on-surface-variant">
              {t("song.noPdf")}
            </div>
          )}`;

const replacementPdf = `          {(song.pdfUrl && song.versions?.includes(selectedVersion)) ? (
            <PdfViewer url={song.pdfUrl} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant bg-surface">
              <FileQuestion className="w-16 h-16 mb-4 text-outline-variant opacity-50" />
              <p className="text-lg font-medium">{t("song.empty")}</p>
            </div>
          )}`;

content = content.replace(targetPdf, replacementPdf);
fs.writeFileSync('src/pages/SongDetail.tsx', content);
