const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  await p.route(/decimal/, r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(require('path').join(__dirname, 'dec-shim.js'), 'utf8') }));
  await p.route(/googleapis|gstatic|xlsx/, r => r.abort());
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../index.html')); await p.waitForTimeout(300);
  await p.click('button.primary'); await p.waitForTimeout(400); await p.evaluate(() => { OVERDRAFT_CONTROL = false; });
  const ids = await p.evaluate(() => { A.seedChart();
    const mk = (m, vin, c) => A.createImportOrder({ makeName:'BMW', modelName:m, vin, customerName:c, customerPhone:'010012345' + vin.slice(-2), supplierName:'AMG', price:'30000', currency:'EUR', rate:'55' });
    const a = mk('X5', 'WBAX5111', 'Mahmoud Naeem'), b2 = mk('X3', 'WBAX3222', 'Ahmed Hamdy'), c = mk('X1', 'WBAX1333', 'Sara Ali');
    for (const po of [a, b2, c]) A.billImportOrder(po.id, { pi_line: [po.lines[0].id], date: todayCairo(), partnerRef: 'AMG-' + po.number, destination:'transit' });
    A.sellImportOrder(a.id, { price:'2000000', currency:'EGP', date: todayCairo() });
    return { a: a.id, va: poVehicle(a).id, vb: poVehicle(poById(b2.id)).id, vc: poVehicle(poById(c.id)).id }; });
  // UI form: 3 cars, type one amount
  await p.evaluate(() => { location.hash = '#/pur/carexp'; render(); }); await p.waitForTimeout(200);
  await p.click('button[data-act="cx-new"]'); await p.waitForTimeout(300);
  await p.selectOption('select[name=costTypeName]', { label: 'Port charges' });
  await p.fill('input[name=amount]', '10000');
  for (const k of ['va','vb','vc']) await p.check(`input[name=cx_car][value="${ids[k]}"]`);
  await p.fill(`input[name=cx_amt_${ids.vc}]`, '5000'); await p.waitForTimeout(200);
  await p.screenshot({ path: require('path').join(__dirname, 'out', 'cx-form2.png') });
  await p.click('.modal-f button.primary, #mform button[type=submit]'); await p.waitForTimeout(400);
  const r1 = await p.evaluate(ids => ({ a: carExpensesOf(ids.va).map(x => x.share.toFixed(2)), c: carExpensesOf(ids.vc).map(x => x.share.toFixed(2)) }), ids);
  console.log(r1);
  // close car A via UI
  await p.evaluate(id => { location.hash = '#/pur/import'; render(); setTimeout(() => poView(poById(id)), 50); }, ids.a); await p.waitForTimeout(300);
  await p.click('button[data-act="car-close"]'); await p.waitForTimeout(300); await p.screenshot({ path: require('path').join(__dirname, 'out', 'close-modal.png') });
  await p.click('.modal-f button.primary, #mform button[type=submit]'); await p.waitForTimeout(400);
  await p.screenshot({ path: require('path').join(__dirname, 'out', 'po-shut.png') });
  const r2 = await p.evaluate(ids => { let err = ''; try { A.createCarExpense({ costTypeName:'Port charges', amount:'100', currency:'EGP', payMode:'now', bankId:'gl:' + S.accounts.find(a => a.code === '1110').id, cx_car:[ids.va], date: todayCairo() }); } catch (e){ err = e.message; }
    const listed = carExpenseForm({}).includes(ids.va); return { closed: !!vehById(ids.va).closedAt, err, listed }; }, ids);
  console.log(r2, 'errors', errs); await b.close();
})();
