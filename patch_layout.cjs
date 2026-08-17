const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// Add Book to imports
content = content.replace(
  "import { Globe, LogOut, User as UserIcon, ChevronDown, Star, Mic, Mail } from 'lucide-react';",
  "import { Globe, LogOut, User as UserIcon, ChevronDown, Star, Mic, Mail, Book } from 'lucide-react';"
);

// Fix the dropdown hover issue by changing mt-2 to pt-2, and adjusting inner divs
const oldDropdown = `<div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant/15 py-2 z-20 overflow-hidden hidden group-hover:block">`;
const newDropdown = `<div className="absolute right-0 pt-2 w-48 z-20 hidden group-hover:block">
                    <div className="bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant/15 py-2 overflow-hidden">`;

content = content.replace(oldDropdown, newDropdown);

// Close the inner div for the dropdown
content = content.replace(
  `                  </div>\n                </div>`,
  `                  </div>\n                  </div>\n                </div>`
);

// Add Book icon link
const oldNav = `<Link to="/favourites" className="text-on-surface-variant hover:text-primary hover:bg-surface-container p-2.5 rounded-full transition-all" title={t('nav.favourites')}>`;
const newNav = `<Link to="/songs" className="text-on-surface-variant hover:text-primary hover:bg-surface-container p-2.5 rounded-full transition-all" title={t('nav.songs') || 'Songs'}>
                  <Book className="w-5 h-5" />
                </Link>
                <Link to="/favourites" className="text-on-surface-variant hover:text-primary hover:bg-surface-container p-2.5 rounded-full transition-all" title={t('nav.favourites')}>`;

content = content.replace(oldNav, newNav);

fs.writeFileSync('src/components/Layout.tsx', content);
