const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminHub.tsx', 'utf8');

content = content.replace(
  "import { Users, FileCheck, Database, Search, Check, X, Trash2, Edit, BarChart3, Download } from 'lucide-react';",
  "import { Users, FileCheck, Database, Search, Check, X, Trash2, Edit, BarChart3, Download, ArrowLeft } from 'lucide-react';\nimport { Link } from 'react-router-dom';"
);

const target = `<div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-bold text-on-surface">{t('admin.title')}</h1>`;

const replacement = `<div className="space-y-8">
      <Link to="/songs" className="inline-flex items-center text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">
        <ArrowLeft className="w-4 h-4 mr-1" />
        {t('song.back') || 'Back'}
      </Link>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-bold text-on-surface">{t('admin.title')}</h1>`;

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/AdminHub.tsx', content);
