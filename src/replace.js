const fs = require('fs');
const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/text-\[11px\] font-normal/g, 'text-[13px] font-normal');
content = content.replace(/text-\[12px\] font-normal/g, 'text-[14px] font-normal');

// Custom targets specified by user
content = content.replace(/'Mix 10 Pro combina 10 ativos'/g, "'Mix 10 Pro combina 10 ativos'");

fs.writeFileSync(file, content, 'utf8');
console.log('Replaced custom text classes');
