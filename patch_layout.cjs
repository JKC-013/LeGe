const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// 1. Move the hook to the top of the component
if (!content.includes('const requestQueue = useStore(state => state.requestQueue);')) {
  content = content.replace(
    'const navigate = useNavigate();',
    'const navigate = useNavigate();\n  const requestQueue = useStore(state => state.requestQueue);'
  );
}

// 2. Replace the hook call inside JSX
content = content.replace(
  '{useStore(state => state.requestQueue).length > 0 && (',
  '{requestQueue.length > 0 && ('
);

fs.writeFileSync('src/components/Layout.tsx', content);
