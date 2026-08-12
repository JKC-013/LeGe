const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

content = content.replace(
  'Welcome back, {currentUser.name || currentUser.email}!',
  "{t('home.welcomeBack', { name: currentUser.name || currentUser.email })}"
);
content = content.replace(
  'You are signed in as <span className="font-bold capitalize">{currentUser.role}</span>.',
  '<span>{t("home.signedInAs", { role: currentUser.role })}</span>'
);
content = content.replace(
  'Go to Admin Hub',
  "{t('home.goToAdminHub')}"
);
content = content.replace(
  'Go to Publisher Dashboard',
  "{t('home.goToPublisherDashboard')}"
);

fs.writeFileSync('src/pages/Home.tsx', content);
