const fs = require('fs');
let content = fs.readFileSync('src/pages/PublisherDashboard.tsx', 'utf8');

content = content.replace(
  "import { CheckCircle2, Upload, Loader2, Music, ChevronDown } from 'lucide-react';",
  "import { CheckCircle2, Upload, Loader2, Music, ChevronDown, ArrowLeft } from 'lucide-react';\nimport { Link } from 'react-router-dom';"
);

const target = `<div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-display font-bold text-on-surface">{t('publisher.title')}</h1>`;

const replacement = `<div className="max-w-2xl mx-auto space-y-8">
      <Link to="/songs" className="inline-flex items-center text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">
        <ArrowLeft className="w-4 h-4 mr-1" />
        {t('song.back') || 'Back'}
      </Link>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-display font-bold text-on-surface">{t('publisher.title')}</h1>`;

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/PublisherDashboard.tsx', content);
