const fs = require('fs');
let content = fs.readFileSync('src/pages/PublisherDashboard.tsx', 'utf8');

const target = `    try {
      console.log('Starting upload...');`;

const replacement = `    try {
      console.log('1. Starting upload process...');`;

content = content.replace(target, replacement);

const target2 = `      const { error: uploadError } = await supabase.storage
        .from('music-sheets')
        .upload(filePath, pdfFile, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload Error:', uploadError);
        throw uploadError;
      }
      console.log('PDF uploaded successfully');`;

const replacement2 = `      console.log('2. Starting Supabase storage upload...', filePath);
      const { error: uploadError } = await supabase.storage
        .from('music-sheets')
        .upload(filePath, pdfFile, {
          contentType: 'application/pdf',
          upsert: true
        });
      console.log('3. Supabase storage upload finished', uploadError);

      if (uploadError) {
        console.error('Upload Error:', uploadError);
        throw uploadError;
      }
      console.log('4. PDF uploaded successfully');`;

content = content.replace(target2, replacement2);

const target3 = `        console.log('Generating thumbnail from PDF...');
        // generatePdfThumbnail now returns a base64 Data URL
        thumbnailUrl = await generatePdfThumbnail(pdfFile);
        console.log('Thumbnail generated successfully');
      } catch (err) {
        console.error('Failed to generate thumbnail', err);
      }`;

const replacement3 = `        console.log('5. Generating thumbnail from PDF...');
        // generatePdfThumbnail now returns a base64 Data URL
        thumbnailUrl = await generatePdfThumbnail(pdfFile);
        console.log('6. Thumbnail generated successfully');
      } catch (err) {
        console.error('6. Failed to generate thumbnail', err);
      }`;
content = content.replace(target3, replacement3);

const target4 = `      await addSong({ 
        title: formData.title,`;

const replacement4 = `      console.log('7. Calling addSong...');
      await addSong({ 
        title: formData.title,`;
content = content.replace(target4, replacement4);

const target5 = `      setSuccess(true);
      setFormData({`;

const replacement5 = `      console.log('8. addSong finished. Setting success...');
      setSuccess(true);
      setFormData({`;
content = content.replace(target5, replacement5);

fs.writeFileSync('src/pages/PublisherDashboard.tsx', content);
