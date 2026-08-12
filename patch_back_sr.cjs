const fs = require('fs');
let content = fs.readFileSync('src/pages/ServiceRequests.tsx', 'utf8');

content = content.replace("Calendar, MessageSquare, Trash2, CheckCircle2, XCircle } from 'lucide-react';", "Calendar, MessageSquare, Trash2, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';");

const target = `<div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-display font-bold text-on-surface">{t('nav.requests')}</h1>`;

const replacement = `<div className="max-w-4xl mx-auto space-y-8">
      <Link to="/songs" className="inline-flex items-center text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">
        <ArrowLeft className="w-4 h-4 mr-1" />
        {t('song.back') || 'Back'}
      </Link>
      <h1 className="text-3xl font-display font-bold text-on-surface">{t('nav.requests')}</h1>`;

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/ServiceRequests.tsx', content);
