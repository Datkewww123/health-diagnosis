require('dotenv').config({ path: '.env' });
const { Sequelize } = require('sequelize');
const seq = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, { host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'mysql' });
async function test() {
  const [rows] = await seq.query("SELECT id, name FROM symptoms");
  const symptomsText = 'sốt cao, ho khan, đau họng';
  const inputText = symptomsText.toLowerCase();
  const matchedNames = [];
  const keywordMap = {
    'sốt cao': ['sốt', 'sot', 'nóng'],
    'ho khan': ['ho', 'ho khan', 'ho có đờm'],
    'đau họng': ['đau họng', 'rát họng', 'rát cổ', 'nuốt vướng'],
    'đau đầu': ['đau đầu', 'nhức đầu', 'đau nửa đầu']
  };
  for (const sym of rows) {
    const sn = sym.name.toLowerCase();
    const kws = keywordMap[sn] || [sn];
    const match = inputText.includes(sn) || sn.includes(inputText) || kws.some(kw => inputText.includes(kw));
    if (match) {
      matchedNames.push(sym.name);
      console.log('MATCHED:', sym.name);
    }
  }
  console.log('matchedNames:', matchedNames.length, matchedNames);
  await seq.close();
}
test().catch(e => console.error(e));
