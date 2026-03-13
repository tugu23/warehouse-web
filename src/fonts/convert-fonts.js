const fs = require('fs');
const path = require('path');

// Read font files
const regularFont = fs.readFileSync(path.join(__dirname, 'Roboto-Regular.ttf'));
const boldFont = fs.readFileSync(path.join(__dirname, 'Roboto-Bold.ttf'));

// Convert to base64
const regularBase64 = regularFont.toString('base64');
const boldBase64 = boldFont.toString('base64');

// Create module exports
const regularModule = `// Auto-generated font file for jsPDF
// Roboto Regular font with Cyrillic support
export const RobotoRegular = '${regularBase64}';
`;

const boldModule = `// Auto-generated font file for jsPDF
// Roboto Bold font with Cyrillic support
export const RobotoBold = '${boldBase64}';
`;

// Write to TypeScript files
fs.writeFileSync(path.join(__dirname, 'Roboto-Regular.ts'), regularModule);
fs.writeFileSync(path.join(__dirname, 'Roboto-Bold.ts'), boldModule);

console.log('✅ Fonts converted successfully!');
console.log('✅ Created: Roboto-Regular.ts');
console.log('✅ Created: Roboto-Bold.ts');

