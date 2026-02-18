const fs = require('fs');
const path = require('path');

// Reads the asciiArt template literal from src/App.tsx and ensures it exactly
// matches the expected canonical ASCII. This prevents accidental edits.

const file = path.join(__dirname, '..', 'src', 'App.tsx');
const src = fs.readFileSync(file, 'utf8');

// load the exact source-snippet we expect to find in src/App.tsx (includes escaped backticks)
const expectedSource = fs.readFileSync(path.join(__dirname, 'canonical-ascii-source.txt'), 'utf8');

if (!src.includes(expectedSource)) {
  console.error('ASCII source mismatch — src/App.tsx no longer contains the canonical asciiArt source block.');
  // show a short preview of where the file differs
  const idx = src.indexOf('const asciiArt');
  console.error('Preview (around const asciiArt):\n', src.slice(Math.max(0, idx-80), idx+240));
  process.exit(1);
}

// NOTE: runtime extraction of the template literal can be brittle when the
// content contains escaped backticks. The source-snippet check above is the
// authoritative regression guard for accidental edits.

console.log('ASCII art OK');
process.exit(0);
