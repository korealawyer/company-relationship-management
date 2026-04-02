const fs = require('fs');
const path = require('path');

function traverseDir(dir, cb) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath, cb);
    } else {
      cb(fullPath);
    }
  }
}

const appDir = path.join(process.cwd(), 'src', 'app');
const routes = [];

traverseDir(appDir, (file) => {
  if (file.endsWith('page.tsx') || file.endsWith('page.jsx')) {
    let routePath = path.relative(appDir, file)
      .replace(/\\/g, '/')
      .replace(/\/page\.(tsx|jsx)$/, '')
      .replace(/^page\.(tsx|jsx)$/, '/');
    
    let normalizedPath = '/' + routePath.split('/')
      .filter(segment => !segment.startsWith('(') || !segment.endsWith(')'))
      .join('/');
    
    normalizedPath = normalizedPath.replace(/\/\//g, '/');
    if (normalizedPath !== '/' && normalizedPath.endsWith('/')) {
        normalizedPath = normalizedPath.slice(0, -1);
    }
    
    routes.push(normalizedPath);
  }
});

fs.writeFileSync('all-routes-output.json', JSON.stringify({ routes: Array.from(new Set(routes)).sort() }, null, 2), 'utf-8');
console.log('done.');
