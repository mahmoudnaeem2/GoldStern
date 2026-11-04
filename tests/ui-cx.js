const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  await p.route(/decimal/, r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(require('path').join(__dirname, 'dec-shim.js'), 'utf8') }));
  await p.route(/googleapis|gstatic|xlsx/, r => r.abort());
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../index.html')); await p.waitForTimeout(300);
  await p.click('button.primary'); await p.waitForTimeout(400); await p.evaluate(() => { OVERDRAFT_CONTROL = false; });
  const ids = await p.evaluate(() => { A.seedChart();
    const a = A.createImportOrder({ makeName:'BMW', modelName:'X5', vin:'WBAX5111', customerName:'Mahmoud Naeem', customerPhone:'01001234567', supplierName:'AMG', price:'50000', currency:'EUR', rate:'55' });
    const b = A.createImportOrder({ makeName:'BMW', modelName:'X3', vin:'WBAX3222', customerName:'Ahmed Hamdy', customerPhone:'01001234568', supplierName:'AMG', price:'30000', currency:'EUR', rate:'55' });
    A.billImportOrder(b.id, { pi_line: [b.lines[0].id], date: todayCairo(), partnerRef: 'AMG-B', destination:'transit' });
    return { a: a.id, b: b.id, va: poVehicle(a).id, vb: poVehicle(poById(b.id)).id }; });
  // UI: open from order A, tick car B, split manual
  await p.evaluate(id => { location.hash = '#/pur/import'; render(); setTimeout(() => poView(poById(id)), 50); }, ids.a); await p.waitForTimeout(300);
  await p.click('button[data-act="cx-new"]'); await p.waitForTimeout(300);
  await p.selectOption('select[name=costTypeName]', { label: 'International shipping' });
  await p.fill('input[name=description]', 'Container Hamburg → Alexandria');
  await p.fill('input[name=amount]', '120000');
  await p.check(`input[name=cx_car][value="${ids.vb}"]`);
  await p.fill(`input[name=cx_amt_${ids.va}]`, '70000'); await p.fill(`input[name=cx_amt_${ids.vb}]`, '50000');
  const cashOpt = await p.evaluate(() => [...document.querySelectorAll('select[name=bankId] option')].find(o => o.textContent.includes('1110')).value);
  await p.selectOption('select[name=bankId]', cashOpt); await p.waitForTimeout(200);
  await p.screenshot({ path: require('path').join(__dirname, 'out', 'cx-form.png'), fullPage: true });
  await p.click('#mform button[type=submit], .modal-f button.primary'); await p.waitForTimeout(400);
  // EUR expense on credit for car A only
  const r = await p.evaluate(ids => {
    A.createCarExpense({ costTypeName:'Customs clearance', amount:'1000', currency:'EUR', rate:'56', payMode:'credit', supplierName:'Alex Clearing Co', cx_car:[ids.va], date: todayCairo(), ref:'CL-77' });
    A.createCarExpense({ costTypeName:'Car wash', amount:'500', currency:'EGP', payMode:'now', bankId:'gl:' + S.accounts.find(a => a.code === '1110').id, cx_car:[ids.va, ids.vb], split:'equal', date: todayCairo() });
    const va = vehById(ids.va), vb = vehById(ids.vb);
    const before = { a: vehicleCost(va).total.toFixed(2), b: vehicleCost(vb).total.toFixed(2), aExp: carExpensesOf(va.id).map(x => x.egp.toFixed(2)), bExp: carExpensesOf(vb.id).map(x => x.egp.toFixed(2)) };
    // complete car B: receive + sell
    A.sellImportOrder(ids.b, { price:'2000000', currency:'EGP', date: todayCairo(), deliver:'no' });
    // post-sale expense on B
    A.createCarExpense({ costTypeName:'Import-related transportation', amount:'3000', currency:'EGP', payMode:'now', bankId:'gl:' + S.accounts.find(a => a.code === '1110').id, cx_car:[ids.vb], date: todayCairo() });
    const sm = orderSummary(poById(ids.b));
    const bad = integrityChecks().filter(c => c.status !== 'OK').map(c => c.status + ' ' + c.name + ': ' + c.detail);
    return { before, bCost: vehicleCost(vehById(ids.vb)).total.toFixed(2), bProfit: sm.profit.toFixed(2), bCogs: sm.cost.toFixed(2), bad, n: S.expenses.length };
  }, ids);
  console.log(JSON.stringify(r, null, 1));
  await p.evaluate(id => { closeModal(); poView(poById(id)); }, ids.b); await p.waitForTimeout(300); await p.screenshot({ path: require('path').join(__dirname, 'out', 'cx-po.png'), fullPage: true });
  await p.evaluate(() => { closeModal(); location.hash = '#/pur/carexp'; render(); }); await p.waitForTimeout(300); await p.screenshot({ path: require('path').join(__dirname, 'out', 'cx-list.png') });
  await p.evaluate(id => { location.hash = '#/veh/view?id=' + id; render(); }, ids.va); await p.waitForTimeout(300); await p.screenshot({ path: require('path').join(__dirname, 'out', 'cx-car.png'), fullPage: true });
  console.log('errors', errs); await b.close();
})();
