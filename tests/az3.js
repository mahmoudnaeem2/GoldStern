// Headless harness: runs the Goldstern ERP script in a Node vm with a minimal browser shim.
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
scripts.sort((a, b) => b.length - a.length); // the app is the largest inline script

// --- BigInt decimal stand-in (only the API surface the app uses) ---
const SC = 40n, SCALE = 10n ** SC;
class Dec {
  constructor(v){
    if (v instanceof Dec){ this.n = v.n; return; }
    const s = String(v).trim(); const m = /^(-)?(\d+)(?:\.(\d+))?$/.exec(s);
    if (!m) throw new Error('[DecimalError] Invalid argument: ' + s);
    const frac = (m[3] || '').padEnd(Number(SC), '0').slice(0, Number(SC));
    this.n = (BigInt(m[2]) * SCALE + BigInt(frac || '0')) * (m[1] ? -1n : 1n);
  }
  static set(){} static get ROUND_HALF_UP(){ return 4; }
  static _(n){ const d = Object.create(Dec.prototype); d.n = n; return d; }
  static _rd(num, den){ const q = num / den, r = num % den; if ((r < 0n ? -r : r) * 2n >= (den < 0n ? -den : den)) return q + ((num < 0n) !== (den < 0n) ? -1n : 1n); return q; }
  plus(o){ return Dec._(this.n + new Dec(o).n); }
  mul(o){ return Dec._(Dec._rd(this.n * new Dec(o).n, SCALE)); }
  div(o){ const d = new Dec(o).n; if (d === 0n) throw new Error('div by zero'); return Dec._(Dec._rd(this.n * SCALE, d)); }
  lte(o){ return this.n <= new Dec(o).n; }
  minus(o){ return Dec._(this.n - new Dec(o).n); }
  eq(o){ return this.n === new Dec(o).n; } lt(o){ return this.n < new Dec(o).n; } gt(o){ return this.n > new Dec(o).n; } gte(o){ return this.n >= new Dec(o).n; }
  abs(){ return Dec._(this.n < 0n ? -this.n : this.n); } negated(){ return Dec._(-this.n); }
  toDecimalPlaces(dp){ const f = 10n ** (SC - BigInt(dp)); return Dec._(Dec._rd(this.n, f) * f); }
  toFixed(dp){
    const neg = this.n < 0n, a = neg ? -this.n : this.n;
    let s;
    if (dp === undefined){ const i = a / SCALE, f = (a % SCALE).toString().padStart(Number(SC), '0').replace(/0+$/, ''); s = i + (f ? '.' + f : ''); }
    else { const r = this.toDecimalPlaces(dp).n; const ar = r < 0n ? -r : r; const i = ar / SCALE; const f = (ar % SCALE).toString().padStart(Number(SC), '0').slice(0, dp); s = i + (dp ? '.' + f : ''); }
    return (neg && /[1-9]/.test(s) ? '-' : '') + s;
  }
  toString(){ return this.toFixed(); }
}

// --- minimal browser shim ---
const store = () => { const m = new Map(); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
const el = () => ({ innerHTML: '', appendChild(){}, classList: { toggle(){}, remove(){} }, style: {} });
const elements = { app: el(), 'modal-root': el(), toasts: el() };
const ctx = {
  console, Decimal: Dec, localStorage: store(), sessionStorage: store(),
  navigator: { userAgent: 'node-harness' }, crypto: globalThis.crypto, TextEncoder, performance, URLSearchParams, Blob: class {},
  location: { hash: '#/dashboard' }, setInterval: () => 0, setTimeout: () => 0,
  document: { getElementById: id => elements[id] || null, addEventListener(){}, documentElement: {}, querySelector: () => null, querySelectorAll: () => [], createElement: el, body: el() },
  addEventListener(){}
};
ctx.window = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(scripts[0], ctx, { filename: 'goldstern-erp.js' });
(async () => {
  const out = await vm.runInContext(`(async () => {
    await A.setupCompany({ legalName:'Goldstern', adminName:'Admin', fyStartMonth:'1' }); SESSION = { userId: S.users[0].id }; seedCatalogue(); A.seedChart();
    A.createFiscalYear({ start: '2026-01-01' });
    const acc1 = c => S.accounts.find(a => a.code === c);
    A.createRate({ from:'EUR', to:'EGP', rate:'58', effective:'2026-01-01', type:'official', source:'CBE' });
    const M = '2026-09-', N = '2026-10-';
    A.addTaxRate('VAT_STD', { rate:'14', from:'2026-01-01', reason:'Egypt VAT 14%', ref:'test configuration' });
    const log = [], seen = new Set();
    const dump = label => { for (const e of S.entries.filter(x => !seen.has(x.id) && x.status !== 'draft')){ seen.add(e.id); log.push('\\n### ' + label + ' — ' + e.number + ' ' + e.journal + ' ' + e.accountingDate + (e.status !== 'posted' ? ' [' + e.status + ']' : ''));
      for (const l of e.lines){ const a = acc1 && S.accounts.find(x => x.id === l.accountId); const dr = D(l.egpDebit || 0).gt(0); log.push((dr ? 'Dr ' : '   Cr ') + a.code + ' ' + a.nameEn.padEnd(32) + (dr ? l.egpDebit : l.egpCredit).padStart(14) + (l.fcCurrency ? '  [' + (D(l.fcDebit||0).plus(l.fcCredit||0)).toFixed(2) + ' ' + l.fcCurrency + ' @' + l.fcRate + ']' : '') + (l.vehicle ? '  {' + l.vehicle + '}' : '')); } } };
    const eur = 'gl:' + acc1('1122').id, cash = 'gl:' + acc1('1110').id;
    const step = (label, fn) => { try { const r = fn(); dump(label); return r; } catch (e){ log.push('\\n!!! ' + label + ' FAILED: ' + e.message); return null; } };
    // ===== CAR A: EUR purchase, EGP sale =====
    const A1 = step('A1 import order (no entry expected)', () => A.createImportOrder({ makeName:'BMW', modelName:'X5', vin:'WBAA0000000000001', customerName:'Mahmoud Naeem', customerPhone:'01000000001', supplierName:'AMG', price:'50000', currency:'EUR', rate:'58', date: M + '01' }));
    const vA = poVehicle(A1);
    step('A2 customer deposit 10,000 EUR into EUR bank', () => A.createSettlement('ar', { side:'ar', partnerId: A1.customerId, bankId: eur, date: M + '02', amount:'10000', currency:'EUR', rate:'58', poId: A1.id }));
    step('A3 customer deposit 500,000 EGP cash', () => A.createSettlement('ar', { side:'ar', partnerId: A1.customerId, bankId: cash, date: M + '03', amount:'500000', currency:'EGP', poId: A1.id }));
    step('A4 supplier advance 1,160,000 EGP (=20,000 EUR @58)', () => A.createSettlement('ap', { side:'ap', partnerId: A1.supplierId, bankId: cash, date: M + '04', amount:'1160000', currency:'EGP', orderRate:'58', poId: A1.id }));
    step('A5 freight 1,500 EUR paid from EUR bank @59, before invoice', () => A.createCarExpense({ costTypeName:'International shipping', amount:'1500', currency:'EUR', rate:'59', payMode:'now', bankId: eur, cx_car:[vA.id], date: M + '05' }));
    const bill = step('A6 supplier invoice 50,000 EUR + advance applied + received', () => A.billImportOrder(A1.id, { pi_line:[A1.lines[0].id], partnerRef:'AMG-1', date: M + '10', destination:'transit' }));
    step('A7 customs 114,000 EGP on credit incl. 14,000 VAT (Customs Authority)', () => A.createCarExpense({ costTypeName:'Customs duties (non-recoverable)', amount:'114000', vat:'14000', currency:'EGP', payMode:'credit', supplierName:'Customs Authority', cx_car:[vA.id], date: M + '11', ref:'CUS-1' }));
    const supInv = poCycle(poById(A1.id)).supInv;
    step('A8 pay supplier 30,000 EUR @60 from EUR bank', () => A.createSettlement('ap', { side:'ap', partnerId: A1.supplierId, bankId: eur, date: M + '12', amount:'30000', currency:'EUR', rate:'60', alloc_inv:[supInv.id], alloc_applied:['30000'], alloc_portion:[''] }));
    const cusInv = S.invoices.find(i => i.partnerRef === 'CUS-1');
    step('A9 pay customs 114,000 EGP cash', () => A.createSettlement('ap', { side:'ap', partnerId: cusInv.partnerId, bankId: cash, date: M + '13', amount:'114000', currency:'EGP', alloc_inv:[cusInv.id], alloc_applied:['114000'], alloc_portion:[''] }));
    const saleA = step('A10 sell 4,104,000 EGP incl. 14% VAT; deposits applied; delivered', () => A.sellImportOrder(A1.id, { price:'4104000', currency:'EGP', date: M + '20', taxCode:'VAT_STD', taxMode:'inclusive' }));
    const sA = poCycle(poById(A1.id)).sale;
    step('A11 customer pays balance EGP cash', () => { const o = invState(sA).open; return A.createSettlement('ar', { side:'ar', partnerId: A1.customerId, bankId: cash, date: M + '22', amount: o.toFixed(2), currency:'EGP', alloc_inv:[sA.id], alloc_applied:[o.toFixed(2)], alloc_portion:[''] }); });
    step('A12 after-sale transport 5,000 EGP cash', () => A.createCarExpense({ costTypeName:'Import-related transportation', amount:'5000', currency:'EGP', payMode:'now', bankId: cash, cx_car:[vA.id], date: M + '23' }));
    step('A13 close car', () => A.closeCar(vA.id, {}));
    step('A14 expense on closed car must be refused', () => A.createCarExpense({ costTypeName:'Port charges', amount:'100', currency:'EGP', payMode:'now', bankId: cash, cx_car:[vA.id], date: M + '24' }));
    // ===== CAR B & C: shared freight, EUR sale with EUR deposit =====
    const B1 = A.createImportOrder({ makeName:'Porsche', modelName:'Cayenne', vin:'WP0B000000000002', customerName:'Sara Ali', customerPhone:'01000000002', supplierName:'AMG', price:'80000', currency:'EUR', rate:'59', date: N + '01' });
    const C1 = A.createImportOrder({ makeName:'Mercedes-Benz', modelName:'CLE', vin:'W1KC000000000003', customerName:'Kamal', customerPhone:'01000000003', supplierName:'AMG', price:'40000', currency:'EUR', rate:'59', date: N + '01' });
    const vB = poVehicle(B1), vC = poVehicle(C1);
    step('B1 EUR deposit 20,000 EUR @59 for B', () => A.createSettlement('ar', { side:'ar', partnerId: B1.customerId, bankId: eur, date: N + '02', amount:'20000', currency:'EUR', rate:'59', poId: B1.id }));
    step('B2 supplier invoices B & C @59', () => { A.billImportOrder(B1.id, { pi_line:[B1.lines[0].id], partnerRef:'AMG-2', date: N + '05', destination:'transit' }); A.billImportOrder(C1.id, { pi_line:[C1.lines[0].id], partnerRef:'AMG-3', date: N + '05', destination:'transit' }); });
    step('B3 shared container 3,000 EUR @60 on B+C, B gets 2,000', () => A.createCarExpense({ costTypeName:'International shipping', amount:'3000', currency:'EUR', rate:'60', payMode:'credit', supplierName:'Maersk', cx_car:[vB.id, vC.id], cx_amt_WP: '', ['cx_amt_' + vB.id]: '2000', date: N + '06', ref:'MSK-9' }));
    step('B4 sell B for 95,000 EUR @61; EUR deposit applied', () => A.sellImportOrder(B1.id, { price:'95000', currency:'EUR', rate:'61', date: N + '10' }));
    const sB = poCycle(poById(B1.id)).sale;
    step('B5 customer pays B balance 75,000 EUR @62 into EUR bank', () => { const o = invState(sB).open; return A.createSettlement('ar', { side:'ar', partnerId: B1.customerId, bankId: eur, date: N + '15', amount: o.toFixed(2), currency:'EUR', rate:'62', alloc_inv:[sB.id], alloc_applied:[o.toFixed(2)], alloc_portion:[''] }); });
    step('B6 pay AMG for B 80,000 EUR @61', () => { const i = poCycle(poById(B1.id)).supInv; return A.createSettlement('ap', { side:'ap', partnerId: B1.supplierId, bankId: eur, date: N + '16', amount:'80000', currency:'EUR', rate:'61', alloc_inv:[i.id], alloc_applied:['80000'], alloc_portion:[''] }); });
    // ===== month-end close September =====
    const cl = closeChecklist('2026-09'); log.push('\\n=== CLOSE 2026-09 checklist ===\\n' + cl.steps.map(x => '[' + x.state + '] ' + x.title + ' — ' + x.detail).join('\\n'));
    const p9 = S.periods.find(p => p.start === '2026-09-01');
    try { for (const p of S.periods.filter(p => p.fyId === p9.fyId && p.num < p9.num && p.status === 'open')) A.setPeriodStatus(p.id, 'closed', 'year-end test'); A.setPeriodStatus(p9.id, 'closed', 'month end'); log.push('Closed 2026-09'); } catch (e){ log.push('close failed: ' + e.message); }
    try { A.createCarExpense({ costTypeName:'Port charges', amount:'100', currency:'EGP', payMode:'now', bankId: cash, cx_car:[vC.id], date: M + '28' }); log.push('!!! posting into closed September was ACCEPTED'); } catch (e){ log.push('Posting into closed September refused: ' + e.message); }
    // ===== reconciliation =====
    const bal = code => { const a = acc1(code); let t = D0(); for (const { l } of ledgerLines()) if (l.accountId === a.id) t = t.plus(l.egpDebit).minus(l.egpCredit); return t; };
    log.push('\\n=== BALANCES (EGP, debit +) ===');
    for (const a of S.accounts.filter(a => !a.group)){ const b = bal(a.code); if (!b.eq(0)) log.push(a.code + ' ' + a.nameEn.padEnd(34) + b.toFixed(2).padStart(16)); }
    const banks = S.banks.map(b => b.name + ': ' + bankBalance(b).fc.toFixed(2) + ' ' + b.currency + ' (EGP ' + bankBalance(b).egp.toFixed(2) + ')'); log.push('\\nBanks: ' + banks.join(' | '));
    log.push('\\n=== CARS ===');
    let gpSum = D0();
    for (const v of S.vehicles){ const vp = vehicleProfit(v); gpSum = gpSum.plus(vp.net.minus(vp.cogs)); log.push(v.vin + ' ' + carName(v) + ' status ' + v.status + (v.closedAt ? ' CLOSED' : '') + ' | stock cost ' + vehicleCost(v).total.toFixed(2) + ' | revenue ' + vp.net.toFixed(2) + ' cogs ' + vp.cogs.toFixed(2) + ' GP ' + vp.net.minus(vp.cogs).toFixed(2) + ' fx ' + vp.fx.toFixed(2) + ' | breakdown ' + carCostBreakdown(v).map(r => r.label + ' ' + r.egp.toFixed(2)).join('; ')); }
    const is = bal('4100').negated().minus(bal('5100'));
    log.push('Sum of car gross profit ' + gpSum.toFixed(2) + ' vs ledger 4100-5100 ' + is.toFixed(2));
    let d = D0(), c = D0(); for (const { l } of ledgerLines()){ d = d.plus(l.egpDebit); c = c.plus(l.egpCredit); } log.push('TB: ' + d.toFixed(2) + ' / ' + c.toFixed(2));
    log.push('Integrity not OK: ' + JSON.stringify(integrityChecks().filter(x => x.status !== 'OK').map(x => x.status + ' ' + x.name + ': ' + x.detail)));
    log.push('Open AR: ' + S.invoices.filter(i => i.side === 'ar' && invIsLive(i) && invState(i).open.gt(0)).map(i => i.number + ' ' + invState(i).open.toFixed(2) + i.currency).join(', '));
    log.push('Open AP: ' + S.invoices.filter(i => i.side === 'ap' && invIsLive(i) && invState(i).open.gt(0)).map(i => i.number + ' ' + invState(i).open.toFixed(2) + i.currency + ' ' + (partnerById('ap', i.partnerId) || {}).legalName).join(', '));
    log.push('Sale tax on A: ' + JSON.stringify((S.invoices.find(i => i.id === sA.id) || {}).tax || null));
    return log.join('\\n'); })()`, ctx);
  console.log(out);
})().catch(e => { console.error('ERR', e); process.exit(2); });
