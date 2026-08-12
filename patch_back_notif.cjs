const fs = require('fs');
let content = fs.readFileSync('src/pages/Notifications.tsx', 'utf8');

content = content.replace("import { Trash2, Bell } from 'lucide-react';", "import { Trash2, Bell, ArrowLeft } from 'lucide-react';\nimport { Link } from 'react-router-dom';");

const target = `<div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl font-display font-bold text-on-surface">{t('notifications.title')}</h1>`;

const replacement = `<div className="max-w-3xl mx-auto space-y-8">
      <Link to="/songs" className="inline-flex items-center text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">
        <ArrowLeft className="w-4 h-4 mr-1" />
        {t('song.back') || 'Back'}
      </Link>
      <h1 className="text-3xl font-display font-bold text-on-surface">{t('notifications.title')}</h1>`;

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/Notifications.tsx', content);
