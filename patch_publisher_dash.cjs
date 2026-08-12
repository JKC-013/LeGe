const fs = require('fs');
let content = fs.readFileSync('src/pages/PublisherDashboard.tsx', 'utf8');

content = content.replace(
  "import { CheckCircle2, Upload, Loader2, Music, ChevronDown } from 'lucide-react';",
  "import { CheckCircle2, Upload, Loader2, Music, ChevronDown } from 'lucide-react';\nimport { generatePdfThumbnail } from '../lib/pdfThumbnail';"
);

// Remove thumbnailFile state
content = content.replace(
  "const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);",
  ""
);

content = content.replace(
  "const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {\n    if (e.target.files && e.target.files[0]) {\n      setThumbnailFile(e.target.files[0]);\n    }\n  };",
  ""
);

// Replace thumbnail processing logic
content = content.replace(
  /let thumbnailUrl = undefined;[\s\S]*?thumbnailUrl = thumbPublicUrl;\n        }\n      }/,
  `let thumbnailUrl = undefined;
      try {
        console.log('Generating thumbnail from PDF...');
        const thumbnailBlob = await generatePdfThumbnail(pdfFile);
        const thumbName = \`\${Math.random().toString(36).substring(2)}.jpg\`;
        const thumbPath = \`thumbnails/\${thumbName}\`;
        
        const { error: thumbUploadError } = await supabase.storage
          .from('music-sheets')
          .upload(thumbPath, thumbnailBlob, {
            contentType: 'image/jpeg',
            upsert: true
          });
          
        if (!thumbUploadError) {
          const { data: { publicUrl: thumbPublicUrl } } = supabase.storage
            .from('music-sheets')
            .getPublicUrl(thumbPath);
          thumbnailUrl = thumbPublicUrl;
          console.log('Thumbnail uploaded:', thumbnailUrl);
        } else {
          console.error('Thumbnail upload error:', thumbUploadError);
        }
      } catch (err) {
        console.error('Failed to generate thumbnail', err);
      }`
);

// Remove thumbnailFile reset
content = content.replace(
  "setThumbnailFile(null);",
  ""
);

// Remove the Thumbnail upload UI block completely
content = content.replace(
  /<div className="space-y-2">\s*<label className="block text-sm font-medium text-on-surface">[\s\S]*?<\/div>\s*<\/div>/,
  ""
);

fs.writeFileSync('src/pages/PublisherDashboard.tsx', content);
