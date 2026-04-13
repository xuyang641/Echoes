const fs = require('fs');
const path = require('path');
const dir = 'src/app/views';
fs.readdirSync(dir).forEach(file => {
  if (!file.endsWith('.tsx')) return;
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');
  content = content.replace(/from '\.\/([^']+)'/g, "from '../components/$1'");
  content = content.replace(/from "\.\/([^"]+)"/g, 'from "../components/$1"');
  fs.writeFileSync(p, content);
});
console.log('Fixed imports in views');
