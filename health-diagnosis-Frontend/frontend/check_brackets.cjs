const fs = require('fs');
const content = fs.readFileSync('src/pages/History.tsx', 'utf8');

let round = 0; // ()
let curly = 0; // {}
let angle = 0; // <>

for (let i = 0; i < content.length; i++) {
  const c = content[i];
  if (c === '(') round++;
  else if (c === ')') round--;
  else if (c === '{') curly++;
  else if (c === '}') curly--;
}

console.log('Ngoặc tròn (chưa đóng):', round);
console.log('Ngoặc nhọn (chưa đóng):', curly);
