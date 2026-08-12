const fs = require('fs');
let content = fs.readFileSync('src/pages/ServiceRequests.tsx', 'utf8');

const target2 = `    <div className="max-w-4xl mx-auto space-y-12">`;
const replacement2 = `    <div className="max-w-4xl mx-auto space-y-12">
      <Link to="/songs" className="inline-flex items-center text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">
        <ArrowLeft className="w-4 h-4 mr-1" />
        {t('song.back') || 'Back'}
      </Link>`;

content = content.replace(target2, replacement2);
const target3 = `      <div className="max-w-4xl mx-auto space-y-8">`;
const replacement3 = `      <div className="max-w-4xl mx-auto space-y-8">
        <Link to="/songs" className="inline-flex items-center text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('song.back') || 'Back'}
        </Link>`;

content = content.replace(target3, replacement3);
fs.writeFileSync('src/pages/ServiceRequests.tsx', content);
