const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 950 } });
  await p.route(/decimal/, r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(require('path').join(__dirname, 'dec-shim.js'), 'utf8') })); await p.route(/googleapis|gstatic|xlsx/, r => r.abort());
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../index.html')); await p.waitForTimeout(300); await p.click('button.primary'); await p.waitForTimeout(400);
  await p.evaluate(() => { if (!S.accounts.length) A.seedChart(); location.hash = '#/pur/import'; render(); }); await p.waitForTimeout(300);
  // UI: buy from a customer
  await p.click('button[data-kind="local"]'); await p.waitForTimeout(300); await p.screenshot({ path: require('path').join(__dirname, 'out', 'deal-local-form.png') });
  await p.selectOption('select[name=makeName]', 'BMW'); await p.waitForTimeout(100); await p.selectOption('select[name=modelName]', { index: 1 });
  await p.fill('input[name=vin]', 'WBAUSED0000000001'); await p.fill('input[name=mileage]', '42000');
  await p.selectOption('select[name=sellerName]', '__add'); await p.fill('input[data-pick-new=sellerName]', 'Omar Khaled'); await p.click('button[data-act=pick-add][data-name=sellerName]');
  await p.fill('input[name=price]', '1500000'); await p.fill('input[name=commission]', '50000');
  await p.click('.modal-f button.primary, #mform button[type=submit]'); await p.waitForTimeout(500);
  const r = await p.evaluate(() => { const out = [], cash = 'gl:' + S.accounts.find(a => a.code === '1110').id; OVERDRAFT_CONTROL = false;
    const L = S.purchaseOrders.find(x => x.kind === 'local'); out.push('local ' + L.number + ' cur ' + L.currency + ' comm ' + L.commission + ' cust ' + (L.customerId || '-'));
    A.billImportOrder(L.id, { pi_line:[L.lines[0].id], date: todayCairo() });
    const bill = poCycle(poById(L.id)).supInv; out.push('seller owed: ' + invState(bill).open.toFixed(2));
    A.createSettlement('ap', { side:'ap', partnerId: L.supplierId, bankId: cash, date: todayCairo(), amount: invState(bill).open.toFixed(2), currency:'EGP', alloc_inv:[bill.id], alloc_applied:[invState(bill).open.toFixed(2)], alloc_portion:[''] });
    A.sellImportOrder(L.id, { customerName:'Youssef Adel', customerPhone:'01011112222', price:'1700000', currency:'EGP', date: todayCairo() });
    const vL = poVehicle(poById(L.id)), vp = vehicleProfit(vL); out.push('local car: revenue ' + vp.net.toFixed(2) + ' cogs ' + vp.cogs.toFixed(2) + ' other income ' + vp.otherInc.toFixed(2) + ' buyer ' + partnerById('ar', poById(L.id).customerId).legalName);
    // stock import
    const St = A.createImportOrder({ kind:'stock', makeName:'Porsche', modelName:'Cayenne', vin:'WP0STOCK000000001', supplierName:'AMG', price:'80000', currency:'EUR', rate:'60' });
    out.push('stock ' + St.number + ' customer ' + (St.customerId || '-') + ' car customer ' + (poVehicle(St).customerId || '-'));
    A.billImportOrder(St.id, { pi_line:[St.lines[0].id], partnerRef:'AMG-S1', date: todayCairo() });
    A.sellImportOrder(St.id, { customerName:'Sara Ali', price:'5500000', currency:'EGP', date: todayCairo() });
    const vS = poVehicle(poById(St.id)), vp2 = vehicleProfit(vS); out.push('stock car sold to ' + partnerById('ar', poById(St.id).customerId).legalName + ' GP ' + vp2.net.minus(vp2.cogs).toFixed(2));
    const ce = S.entries.filter(e => e.status === 'posted' && e.lines.some(l => (S.accounts.find(a => a.id === l.accountId) || {}).code === '4350'));
    out.push('commission entry: ' + ce.map(e => e.number + ' ' + e.lines.map(l => (D(l.egpDebit||0).gt(0) ? 'Dr ' : 'Cr ') + S.accounts.find(a => a.id === l.accountId).code + ' ' + (D(l.egpDebit||0).gt(0) ? l.egpDebit : l.egpCredit) + (l.vehicle ? ' {' + l.vehicle + '}' : '')).join(' | ')).join(' ; '));
    out.push('integrity: ' + JSON.stringify(integrityChecks().filter(c => c.status === 'ISSUE').map(c => c.name + ': ' + c.detail)));
    window.__L = L.id; return out; });
  console.log(r.join('\n'));
  await p.evaluate(() => { closeModal(); location.hash = '#/pur/import'; render(); setTimeout(() => poView(poById(window.__L)), 50); }); await p.waitForTimeout(400); await p.screenshot({ path: require('path').join(__dirname, 'out', 'deal-local-po.png'), fullPage: true });
  await p.evaluate(() => { closeModal(); location.hash = '#/pur/import'; render(); }); await p.waitForTimeout(300); await p.screenshot({ path: require('path').join(__dirname, 'out', 'deal-list.png') });
  console.log('errors', errs); await b.close();
})();
