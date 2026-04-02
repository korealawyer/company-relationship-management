import fs from 'fs';
import path from 'path';

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

// Find all routes
traverseDir(appDir, (file) => {
  if (file.endsWith('page.tsx') || file.endsWith('page.jsx')) {
    let routePath = path.relative(appDir, file)
      .replace(/\\/g, '/')
      .replace(/\/page\.(tsx|jsx)$/, '')
      .replace(/^page\.(tsx|jsx)$/, '/');
    
    // Remove group brackets like (admin), (client), etc. but keep their children
    // e.g. (admin)/dashboard -> /dashboard
    let normalizedPath = '/' + routePath.split('/')
      .filter(segment => !segment.startsWith('(') || !segment.endsWith(')'))
      .join('/');
    
    // Fix trailing space if any
    normalizedPath = normalizedPath.replace(/\/\//g, '/');
    if (normalizedPath !== '/' && normalizedPath.endsWith('/')) {
        normalizedPath = normalizedPath.slice(0, -1);
    }
    
    routes.push({ file: file.replace(process.cwd(), ''), route: normalizedPath });
  }
});

const srcDir = path.join(process.cwd(), 'src');
const allLinks = new Set();
const linkRegex = /(?:href|router\.push|router\.replace|route):\s*[`"']([^`"'$]+)[`"']/g; 
const stringRegex = /[`"'](\/[a-zA-Z0-9\-\/]+)[`"']/g;

traverseDir(srcDir, (file) => {
  if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.js')) {
    const content = fs.readFileSync(file, 'utf-8');
    
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      allLinks.add(match[1]);
    }
    while ((match = stringRegex.exec(content)) !== null) {
      allLinks.add(match[1]);
    }
  }
});

const unlinkedRoutes = [];
const dynamicRoutes = [];
const maybeLinked = [];

for (const { file, route } of routes) {
  if (route.includes('[')) { // dynamic routing like [id]
    dynamicRoutes.push({ file, route });
    continue;
  }
  
  if (route === '' || route === '/') {
    continue; // root is usually accessible
  }

  // Check if any link matches this route
  let isLinked = false;
  for (const link of allLinks) {
    // Exact match or matches base path with query string/hash
    if (link === route || link.startsWith(route + '?') || link.startsWith(route + '#')) {
      isLinked = true;
      break;
    }
  }

  if (!isLinked) {
    unlinkedRoutes.push({ file, route });
  }
}

console.log("=== Unlinked Static Routes ===");
unlinkedRoutes.forEach(r => console.log(r.route, "(" + r.file + ")"));

console.log("\n=== Dynamic Routes (Not Checked Automatically) ===");
dynamicRoutes.forEach(r => console.log(r.route, "(" + r.file + ")"));

console.log("\nTotal routes:", routes.length);
console.log("Unlinked static routes:", unlinkedRoutes.length);
