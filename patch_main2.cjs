const fs = require('fs');
let content = fs.readFileSync('src/main.tsx', 'utf8');
content = content.replace("import { ErrorBoundary } from './ErrorBoundary';\n", "");
content = content.replace('<ErrorBoundary><App /></ErrorBoundary>', '<App />');
fs.writeFileSync('src/main.tsx', content);
