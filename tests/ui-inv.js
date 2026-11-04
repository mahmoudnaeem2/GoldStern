const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  await p.route(/decimal/, r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(require('path').join(__dirname, 'dec-shim.js'), 'utf8') }));
  await p.route(/googleapis|gstatic|xlsx/, r => r.abort());
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../index.html')); await p.waitForTimeout(300);
  await p.click('button.primary'); await p.waitForTimeout(400); await p.evaluate(() => { OVERDRAFT_CONTROL = false; });
  await p.evaluate(() => { if (!S.accounts.length) A.seedChart();
    const mk = (mkN, m, vin, c, pr) => A.createImportOrder({ makeName:mkN, modelName:m, vin, customerName:c, customerPhone:'010012345' + vin.slice(-2), supplierName:'AMG', price:pr, currency:'EUR', rate:'55' });
    const a = mk('BMW','X5','WBAX5111','Mahmoud Naeem','60000'), b2 = mk('BMW','X3','WBAX3222','Ahmed Hamdy','40000'), c = mk('Porsche','Cayenne','WP0CY333','Sara Ali','90000'), d = mk('Mercedes-Benz','CLE','W1K44444','Kamal','70000');
    for (const po of [a, b2, c]) A.billImportOrder(po.id, { pi_line: [po.lines[0].id], date: todayCairo(), partnerRef: 'AMG-' + po.number, destination:'transit' });
    A.sellImportOrder(a.id, { price:'4000000', currency:'EGP', date: todayCairo() });
    A.sellImportOrder(b2.id, { price:'2600000', currency:'EGP', date: todayCairo(), deliver:'no' });
  });
  for (const [r, f] of [['inv/overview','inv-ov'], ['inv/stock','inv-stock'], ['inv/receipts','inv-rec'], ['inv/deliveries','inv-del'], ['inv/moves','inv-mv']]){
    await p.evaluate(r => { location.hash = '#/' + r; render(); }, r); await p.waitForTimeout(300); await p.screenshot({ path: f + '.png' }); }
  await p.evaluate(() => { location.hash = '#/inv/stock'; render(); }); await p.waitForTimeout(200);
  await p.selectOption('select[data-filter=st_g]', 'brand'); await p.waitForTimeout(300); await p.screenshot({ path: require('path').join(__dirname, 'out', 'inv-stock-g.png') });
  await p.click('button[data-v="all"]'); await p.waitForTimeout(300);
  console.log('rows', await p.$$eval('table.o-list tbody tr', x => x.length), 'errors', errs); await b.close();
})();
