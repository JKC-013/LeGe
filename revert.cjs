const fs = require('fs');
let content = fs.readFileSync('src/components/AuthModal.tsx', 'utf8');
content = content.replace(
  `const handleSubmit = async (e: React.FormEvent) => {\n    console.log("handleSubmit called");`,
  `const handleSubmit = async (e: React.FormEvent) => {`
);
content = content.replace(
  `} finally {\n      console.log("finally called, setting loading false");`,
  `} finally {`
);
fs.writeFileSync('src/components/AuthModal.tsx', content);
