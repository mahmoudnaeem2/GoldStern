// Fails if a known feature disappears from index.html — usually a sign the file was
// edited from an old copy. Add a line here when a feature ships.
const fs = require('fs');
const src = fs.readFileSync(process.argv[2] || 'index.html', 'utf8');
const FEATURES = {
  'Income statement (Odoo-style)': 'function pageIncomeStatement',
  'Partner ledger': 'function partnerLedger',
  'Formatted Excel exports': 'const XW = ',
  'Multi-currency journal lines': 'function jeFillRates',
  'Car report': 'function printCarReport',
  'Order page: all customer payments': 'invPays',
  'Bank statements page': 'function pageBankStatements',
  'Update data (migrations)': 'function updateData',
  'Startup error guard': 'function safePage',
  'Pro-forma invoices': 'proformaById',
  'Fixed assets': 'function ensureStandardAssetCats',
  'Expenses module': 'function ensureStandardExpenseCats',
};
let bad = 0;
for (const [name, marker] of Object.entries(FEATURES)){ const ok = src.includes(marker); if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'MISSING'}  ${name}`); }
if (bad){ console.error(`\n${bad} feature(s) missing. Was index.html edited from an older copy? Run "git pull" and re-apply your change.`); process.exit(1); }
