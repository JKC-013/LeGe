const fs = require('fs');
let content = fs.readFileSync('src/main.tsx', 'utf8');
if (!content.includes('ErrorBoundary')) {
  content = "import { ErrorBoundary } from './ErrorBoundary';\n" + content;
  content = content.replace('<App />', '<ErrorBoundary><App /></ErrorBoundary>');
  fs.writeFileSync('src/main.tsx', content);
}
