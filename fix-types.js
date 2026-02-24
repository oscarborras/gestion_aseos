const fs = require('fs');
const content = fs.readFileSync('/home/oscar/.gemini/antigravity/brain/58e8c4a3-29ee-4604-b74b-97f1b260de19/.system_generated/steps/341/output.txt', 'utf8');
const unescaped = content.replace(/^"|"$/g, '').replace(/\\n/g, '\n').replace(/\\"/g, '"');
fs.writeFileSync('src/types/supabase.ts', unescaped);
console.log('Fixed supabase.ts');
