const { chromium } = require('playwright'); const fs = require('fs'); const seed = require(require('path').join(__dirname, 'seed.js'));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.route(/decimal/, r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(require('path').join(__dirname, 'dec-shim.js'), 'utf8') }));
  await p.route(/googleapis|gstatic|xlsx/, r => r.abort());
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../index.html')); await p.waitForTimeout(300);
  await p.click('button.primary'); await p.waitForTimeout(400); await p.evaluate(() => { OVERDRAFT_CONTROL = false; }); await seed(p);
  await p.evaluate(() => { location.hash = '#/sal/orders'; render(); }); await p.waitForTimeout(300); await p.screenshot({ path: require('path').join(__dirname, 'out', 'so-list.png') });
  await p.click('table.o-list tbody tr:nth-child(1) td:nth-child(3)'); await p.waitForTimeout(400); await p.screenshot({ path: require('path').join(__dirname, 'out', 'so-view.png') });
  const btns = await p.$$eval('.o-bar .btns button', x => x.map(b => b.textContent.trim())); console.log('actions', btns);
  if (btns.includes('Deliver car')){ await p.click('.o-bar button:has-text("Deliver car")'); await p.waitForTimeout(300); await p.click('.modal-f button.primary, #mform button[type=submit]'); await p.waitForTimeout(500);
    console.log('after deliver', await p.$eval('.o-head .pill', e => e.textContent), await p.$$eval('.o-bar .btns button', x => x.map(b => b.textContent.trim()))); await p.screenshot({ path: require('path').join(__dirname, 'out', 'so-view2.png') }); }
  // customers row click
  await p.evaluate(() => { closeModal(); location.hash = '#/partners/customers'; render(); }); await p.waitForTimeout(300);
  await p.click('main tbody tr:nth-child(1) td:nth-child(2)'); await p.waitForTimeout(300); console.log('cust row ->', await p.evaluate(() => location.hash));
  await p.evaluate(() => { location.hash = '#/acc/journals'; render(); }); await p.waitForTimeout(300);
  await p.click('main tbody tr:nth-child(1) td:nth-child(4)'); await p.waitForTimeout(300); await p.screenshot({ path: require('path').join(__dirname, 'out', 'je-row.png') }); console.log('je row ->', await p.evaluate(() => document.title + ' ' + (document.querySelector('[class*=modal]') ? document.querySelector('[class*=modal]').className : 'none')));
  console.log('errors', errs); await b.close();
})();
