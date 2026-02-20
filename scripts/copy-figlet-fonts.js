const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'node_modules', 'figlet', 'fonts');
const outDir = path.join(__dirname, '..', 'public', 'fonts');

if (!fs.existsSync(srcDir)) {
  console.error('source fonts directory not found:', srcDir);
  process.exit(1);
}
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const files = fs.readdirSync(srcDir).filter((f) => f.toLowerCase().endsWith('.flf'));
let copied = 0;
for (const f of files) {
  const src = path.join(srcDir, f);
  const dst = path.join(outDir, f);
  try {
    fs.copyFileSync(src, dst);
    copied++;
  } catch (err) {
    console.error('failed to copy', f, err && err.message);
  }
}
console.log(`Copied ${copied}/${files.length} fonts to ${outDir}`);
