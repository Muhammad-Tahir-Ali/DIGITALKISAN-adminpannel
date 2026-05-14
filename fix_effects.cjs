const fs = require('fs');
const path = require('path');
const pagesDir = path.join(__dirname, 'src', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Pattern: fetchSomething(); inside useEffect
  const regex = /useEffect\(\(\) => \{\n\s*fetch([A-Za-z]+)\(\);\n\s*\}, \[.*?\]\);/g;
  
  content = content.replace(regex, (match, p1) => {
    return match.replace(`fetch${p1}();`, `setTimeout(() => fetch${p1}(), 0);`);
  });
  
  fs.writeFileSync(filePath, content);
}
