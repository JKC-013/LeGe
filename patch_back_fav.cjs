const fs = require('fs');
let content = fs.readFileSync('src/pages/Favourites.tsx', 'utf8');

if (!content.includes('ArrowLeft')) {
  content = content.replace("import { Music, Star } from 'lucide-react';", "import { Music, Star, ArrowLeft } from 'lucide-react';");
}

const target = `<div className="space-y-8">
      <div className="text-center space-y-2">`;

const replacement = `<div className="space-y-8">
      <Link to="/songs" className="inline-flex items-center text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">
        <ArrowLeft className="w-4 h-4 mr-1" />
        {t('song.back') || 'Back'}
      </Link>
      <div className="text-center space-y-2">`;

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/Favourites.tsx', content);
