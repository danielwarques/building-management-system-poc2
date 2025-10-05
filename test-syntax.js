const fs = require('fs');
const path = require('path');

const files = [
  'backend/auth/auth.ts',
  'backend/auth/login.ts',
  'backend/auth/register.ts',
  'backend/units/update.ts',
  'backend/units/update_helper.ts',
  'backend/issues/create.ts',
  'backend/issues/list.ts'
];

let hasErrors = false;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // Basic syntax checks
  const openBraces = (content.match(/\{/g) || []).length;
  const closeBraces = (content.match(/\}/g) || []).length;
  const openParens = (content.match(/\(/g) || []).length;
  const closeParens = (content.match(/\)/g) || []).length;
  
  if (openBraces !== closeBraces) {
    console.error(`❌ ${file}: Mismatched braces (${openBraces} open, ${closeBraces} close)`);
    hasErrors = true;
  }
  
  if (openParens !== closeParens) {
    console.error(`❌ ${file}: Mismatched parentheses (${openParens} open, ${closeParens} close)`);
    hasErrors = true;
  }
  
  if (!hasErrors) {
    console.log(`✓ ${file}: Basic syntax OK`);
  }
});

if (!hasErrors) {
  console.log('\n✅ All files passed basic syntax validation');
  process.exit(0);
} else {
  console.log('\n❌ Some files have syntax errors');
  process.exit(1);
}
