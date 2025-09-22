const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const allowedFiles = new Set([
  'tailwind.config.js',
  'app/globals.css',
  'app/utilities.css',
  'sanity/plugins/calendarSyncTool/fullcalendarStyles.ts',
  'sanity/plugins/calendarSyncTool/index.tsx'
]);

const hexColorRegex = /#[0-9a-fA-F]{3,6}\b/;
const tailwindColorRegex = /\b(?:bg|text|border|fill|stroke)-(?!\[[^\]]+\]|brand|neutral)(?:black|white|slate|gray|zinc|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-[0-9]{1,3})?(?:\/[0-9]{1,3})?\b/;

let hasError = false;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (['node_modules', '.git', '.next', 'public'].includes(entry.name)) continue;
      walk(path.join(dir, entry.name));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (!['.js', '.ts', '.tsx', '.jsx', '.css'].includes(ext)) continue;
      const filePath = path.join(dir, entry.name);
      const relPath = path.relative(rootDir, filePath);
      if (allowedFiles.has(relPath)) continue;
      const content = fs.readFileSync(filePath, 'utf8');
      const hexMatches = content.match(hexColorRegex);
      const tailwindMatches = content.match(tailwindColorRegex);
      if (hexMatches || tailwindMatches) {
        console.error(`Brand color violation in ${relPath}`);
        if (hexMatches) console.error(`  Hex colors: ${hexMatches.join(', ')}`);
        if (tailwindMatches) console.error(`  Classes: ${tailwindMatches.join(', ')}`);
        hasError = true;
      }
    }
  }
}

walk(rootDir);

if (hasError) {
  console.error('Brand consistency check failed.');
  process.exit(1);
} else {
  console.log('Brand consistency check passed.');
}
