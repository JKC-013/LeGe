const fs = require('fs');
let content = fs.readFileSync('src/pages/Notifications.tsx', 'utf8');

content = content.replace(
  "const { currentUser, notifications } = useStore();",
  "const { currentUser, notifications, deleteNotification } = useStore();"
);

content = content.replace(
  `<button className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-colors">`,
  `<button onClick={() => deleteNotification(notification.id)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-colors">`
);

fs.writeFileSync('src/pages/Notifications.tsx', content);
