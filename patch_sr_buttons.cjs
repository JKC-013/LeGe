const fs = require('fs');
let content = fs.readFileSync('src/pages/ServiceRequests.tsx', 'utf8');

content = content.replace(
  "const { currentUser, serviceRequests, requestQueue, songs, removeFromRequestQueue, submitServiceRequest, users } = useStore();",
  "const { currentUser, serviceRequests, requestQueue, songs, removeFromRequestQueue, submitServiceRequest, users, approveServiceRequest, declineServiceRequest } = useStore();"
);

content = content.replace(
  "<button className=\"px-4 py-2 bg-error/10 text-error hover:bg-error/20 rounded-lg text-sm font-bold flex items-center transition-colors\">",
  "<button onClick={() => declineServiceRequest(req.id)} className=\"px-4 py-2 bg-error/10 text-error hover:bg-error/20 rounded-lg text-sm font-bold flex items-center transition-colors\">"
);

content = content.replace(
  "<button className=\"px-4 py-2 bg-primary text-on-primary hover:bg-primary-container rounded-lg text-sm font-bold flex items-center shadow-ambient transition-colors\">",
  "<button onClick={() => approveServiceRequest(req.id)} className=\"px-4 py-2 bg-primary text-on-primary hover:bg-primary-container rounded-lg text-sm font-bold flex items-center shadow-ambient transition-colors\">"
);

fs.writeFileSync('src/pages/ServiceRequests.tsx', content);
