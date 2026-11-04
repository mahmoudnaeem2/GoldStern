// Headless harness: runs the Goldstern ERP script in a Node vm with a minimal browser shim.
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (scripts.length !== 1) throw new Error('expected one inline script, found ' + scripts.length);

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
vm.runInContext('OVERDRAFT_CONTROL = false;', ctx);

(async () => {
  const out = vm.runInContext(`(async () => {
    const r = runTestSuite();
    // Smoke-render every page as a real Super Admin to catch template errors.
    await A.setupCompany({ legalName:'Goldstern', taxRegNo:'123-456-789', fyStartMonth:'1', adminName:'Mahmoud Admin', adminUsername:'admin', adminPassword:'CorrectHorse9', adminPassword2:'CorrectHorse9' });
    A.createFiscalYear({ start: todayCairo().slice(0,4) + '-01-01' });
    await A.createUser({ username:'fmgr', name:'Fin Manager', password:'CorrectHorse9', roles:['finance_manager'] });
    A.createRate({ from:'EUR', to:'EGP', rate:'52.1234', effective:todayCairo(), type:'official', source:'CBE' });
    const pages = ['acc/coa-empty','dashboard','acc/dashboard','acc/coa','acc/journals','acc/opening','acc/gl','acc/tb','acc/mappings','acc/integrity','bank/accounts','bank/transfers','bank/txns','bank/statements','bank/reval','bank/fx','partners/customers','partners/suppliers','ar/invoices','ap/invoices','ar/receipts','ap/receipts','ar/advances','ap/advances','ar/aging','ap/aging','veh/list','veh/settings','inv/valuation','inv/moves','inv/counts','pur/requests','pur/orders','imp/shipments','imp/costs','imp/costtypes','imp/landed','sal/inquiries','sal/quotes','sal/orders','sal/deliveries','ana/profit','ana/accounts','tax/codes','tax/report','tax/einvoice','exp/list','exp/schedules','fa/register','rep/center','rep/statements','rep/budgets','setup-status','settings/company','settings/users','settings/roles','settings/currencies','settings/rates','settings/fiscal','settings/sequences','settings/audit','settings/tests','settings/data','m/vehicles','m/coa','m/reval'];
    const renders = [];
    for (const p of pages){ if (p === 'acc/coa-empty'){ location.hash = '#/acc/coa'; render(); renders.push([p, document.getElementById('app').innerHTML.length]); A.seedChart(); continue; } location.hash = '#/' + p; render(); renders.push([p, document.getElementById('app').innerHTML.length]); }
    const je = A.saveEntry(null, { journal:'GJ', accountingDate: todayCairo(), documentDate:'', currency:'EGP', rateType:'official', reference:'', sourceRef:'', description:'Smoke', lines:[{accountId: accByCode('6170').id, debit:'10', credit:''},{accountId: accByCode('1110').id, debit:'', credit:'10'}] });
    jeView(je); const viewLen = document.getElementById('modal-root').innerHTML.length; closeModal();
    openEntryEditor(null); const edLen = document.getElementById('modal-root').innerHTML.length; closeModal();
    renders.push(['je-view', viewLen], ['je-editor', edLen]);
    // banking smoke with data (admin has all rights; approvals by second user)
    const egp = S.accounts.find(a=>a.code==='1121'), eur = S.accounts.find(a=>a.code==='1122');
    A.saveBank(null,{name:'NBE EGP',currency:'EGP',glAccountId:egp.id}); A.saveBank(null,{name:'NBE EUR',currency:'EUR',glAccountId:eur.id});
    A.createRate({from:'EUR',to:'EGP',rate:'52',effective:todayCairo().slice(0,4)+'-01-01',type:'official',source:'CBE'});
    const t = A.createTransfer({fromBankId:S.banks[0].id,toBankId:S.banks[1].id,date:todayCairo(),srcAmount:'5200',dstAmount:'100',fee:'10',valuation:'actual'});
    const st = A.importStatement(S.banks[1].id, tableToStatementLines(csvRows('Date,Description,Reference,Debit,Credit\\n'+todayCairo()+',In,'+t.number+',,100.00')), {});
    for (const p of ['bank/accounts','bank/book?id='+S.banks[1].id,'bank/transfers','bank/statements','bank/reconcile?st='+st.id,'bank/reval','bank/fx']){ location.hash='#/'+p; render(); renders.push([p+'*', document.getElementById('app').innerHTML.length]); }
    CLICK['bt-new'](); renders.push(['bt-modal', document.getElementById('modal-root').innerHTML.length]); closeModal();
    // Login round trip with real hashing
    A.logout(); let bad = ''; try { await A.login('admin','wrong-password'); } catch(e){ bad = e.message; }
    await A.login('admin','CorrectHorse9');
    // Read-only role sees access denied on users page
    await A.createUser({ username:'viewer', name:'Viewer', password:'CorrectHorse9', roles:['read_only'] });
    A.logout(); await A.login('viewer','CorrectHorse9'); location.hash = '#/settings/users'; render();
    const deniedShown = document.getElementById('app').innerHTML.includes('Access denied');
    // Phase 1 -> Phase 2 migration of a saved v1 state
    const v1 = JSON.parse(JSON.stringify(S)); delete v1.schema; delete v1.accounts; delete v1.entries; delete v1.journals; delete v1.mappings; delete v1.costCenters;
    for (const role of Object.keys(v1.permissions)) for (const m of ['coa','journals','ledger','mappings','integrity']) delete v1.permissions[role][m];
    v1.sequences = v1.sequences.filter(q => !q.doc.startsWith('jnl_')).map(q => ({ ...q, next: 7, year: '2026', counters: undefined }));
    const m2 = migrate(v1);
    const migration = { schema: m2.schema, journals: m2.journals.length, fmCanPost: m2.permissions.finance_manager.journals.includes('post'), seqJE: m2.sequences.find(q => q.doc==='journal_entry').counters['2026'], hasGJ: !!m2.sequences.find(q => q.doc==='jnl_general'), auditKept: m2.audit.length === S.audit.length };
    return { migration, suite: r, renders, bad, deniedShown, chain: verifyAuditChain(), audit: S.audit.length, persisted: !!localStorage.getItem(LS_KEY) };
  })()`, ctx);
  const res = await out;
  for (const [i, x] of res.suite.results.entries()) console.log(String(i + 1).padStart(2), x.status.padEnd(4), `[${x.area}]`, x.name, '→', x.detail);
  console.log(`\nSUITE: ${res.suite.passed} passed, ${res.suite.failed} failed, ${res.suite.skipped} not executable`);
  console.log('RENDER:', res.renders.map(([p, n]) => `${p}=${n}b`).join(', '));
  console.log('LOGIN wrong password →', JSON.stringify(res.bad), '| read-only sees Access denied on Users:', res.deniedShown);
  console.log('MIGRATION:', JSON.stringify(res.migration));
  console.log('AUDIT chain:', JSON.stringify(res.chain), '| persisted to storage:', res.persisted);
  process.exit(res.suite.failed ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(2); });
