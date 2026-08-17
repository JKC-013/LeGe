const fs = require('fs');
let content = fs.readFileSync('final_schema.sql', 'utf8');

const target = `CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);`;
const replacement = target + `\nCREATE POLICY "Admins can update user roles" ON public.users FOR UPDATE USING (\n  EXISTS (\n    SELECT 1 FROM public.users \n    WHERE id = auth.uid() AND role = 'admin'\n  )\n);`;

content = content.replace(target, replacement);

fs.writeFileSync('final_schema.sql', content);
