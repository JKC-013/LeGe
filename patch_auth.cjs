const fs = require('fs');

let content = fs.readFileSync('src/components/AuthModal.tsx', 'utf8');

content = content.replace(
  `const handleSubmit = async (e: React.FormEvent) => {`,
  `const handleSubmit = async (e: React.FormEvent) => {
    console.log("handleSubmit called");`
);

content = content.replace(
  `} finally {`,
  `} finally {
      console.log("finally called, setting loading false");`
);

fs.writeFileSync('src/components/AuthModal.tsx', content);
