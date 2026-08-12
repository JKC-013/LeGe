const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

content = content.replace(
  '<div className="mt-4 sm:mt-0">',
  '<div className="mt-4 sm:mt-0 flex flex-wrap gap-3">'
);

content = content.replace(
  '<Link to="/admin" className="px-6 py-2 bg-primary text-on-primary rounded-full hover:bg-primary-container text-sm font-bold shadow-ambient transition-colors">',
  '<Link to="/admin" className="inline-block px-6 py-2 bg-primary text-on-primary rounded-full hover:bg-primary-container text-sm font-bold shadow-ambient transition-colors whitespace-nowrap">'
);

content = content.replace(
  '<Link to="/publisher" className="px-6 py-2 bg-primary text-on-primary rounded-full hover:bg-primary-container text-sm font-bold shadow-ambient transition-colors">',
  '<Link to="/publisher" className="inline-block px-6 py-2 bg-primary text-on-primary rounded-full hover:bg-primary-container text-sm font-bold shadow-ambient transition-colors whitespace-nowrap">'
);

fs.writeFileSync('src/pages/Home.tsx', content);
