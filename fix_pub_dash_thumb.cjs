const fs = require('fs');
let content = fs.readFileSync('src/pages/PublisherDashboard.tsx', 'utf8');

const target = `      let thumbnailUrl = undefined;
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
      }`;

const replacement = `      let thumbnailUrl = undefined;
      try {
        console.log('Generating thumbnail from PDF...');
        // generatePdfThumbnail now returns a base64 Data URL
        thumbnailUrl = await generatePdfThumbnail(pdfFile);
        console.log('Thumbnail generated successfully');
      } catch (err) {
        console.error('Failed to generate thumbnail', err);
      }`;

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/PublisherDashboard.tsx', content);
