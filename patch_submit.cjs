const fs = require('fs');
let content = fs.readFileSync('src/pages/PublisherDashboard.tsx', 'utf8');

const target = `    try {
      const fileExt = pdfFile.name.split('.').pop();`;

const replacement = `    try {
      console.log('Starting upload...');
      const fileExt = pdfFile.name.split('.').pop();`;

content = content.replace(target, replacement);

const target2 = `        upsert: true
        });

      if (uploadError) throw uploadError;`;

const replacement2 = `        upsert: true
        });

      if (uploadError) {
        console.error('Upload Error:', uploadError);
        throw uploadError;
      }
      console.log('PDF uploaded successfully');`;

content = content.replace(target2, replacement2);

fs.writeFileSync('src/pages/PublisherDashboard.tsx', content);
