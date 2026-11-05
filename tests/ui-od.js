const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.route(/decimal/, r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(require('path').join(__dirname, 'dec-shim.js'), 'utf8') }));
  await p.route(/googleapis|gstatic|xlsx/, r => r.abort());
  await p.goto('file://' + require('path').resolve(__dirname, '../index.html')); await p.waitForTimeout(300); await p.click('button.primary'); await p.waitForTimeout(400);
  const r = await p.evaluate(() => { if (!S.accounts.length) A.seedChart(); const out = [];
    const cash = 'gl:' + S.accounts.find(a => a.code === '101100').id, eur = 'gl:' + S.accounts.find(a => a.code === '101220').id;
    const po = A.createImportOrder({ makeName:'BMW', modelName:'X5', vin:'WBAOD000000000001', customerName:'Mahmoud Naeem', customerPhone:'01000000009', supplierName:'AMG', price:'50000', currency:'EUR', rate:'58' });
    const n0 = S.entries.length;
    try { A.createCarExpense({ costTypeName:'Port charges', amount:'1000', currency:'EGP', payMode:'now', bankId: cash, cx_car:[poVehicle(po).id], date: todayCairo() }); out.push('cash overdraft ACCEPTED'); } catch (e){ out.push('cash blocked: ' + e.message); }
    out.push('entries unchanged: ' + (S.entries.length === n0) + ', expenses ' + S.expenses.length);
    A.createSettlement('ar', { side:'ar', partnerId: po.customerId, bankId: cash, date: todayCairo(), amount:'5000', currency:'EGP', poId: po.id });
    A.createCarExpense({ costTypeName:'Port charges', amount:'1000', currency:'EGP', payMode:'now', bankId: cash, cx_car:[poVehicle(po).id], date: todayCairo() }); out.push('after deposit, paid 1000: cash ' + bankBalance(bankById(S.banks.find(x => x.glAccountId === cash.slice(3)).id)).fc.toFixed(2));
    try { A.createCarExpense({ costTypeName:'Port charges', amount:'100', currency:'EUR', rate:'58', payMode:'now', bankId: eur, cx_car:[poVehicle(po).id], date: todayCairo() }); out.push('EUR ACCEPTED'); } catch (e){ out.push('EUR blocked'); }
    const eb = S.banks.find(x => x.glAccountId === eur.slice(3)) || bankById(materializeBank(eur)); eb.allowOverdraft = true;
    A.createCarExpense({ costTypeName:'Port charges', amount:'100', currency:'EUR', rate:'58', payMode:'now', bankId: eur, cx_car:[poVehicle(po).id], date: todayCairo() }); out.push('EUR with overdraft allowed: ' + bankBalance(eb).fc.toFixed(2));
    out.push('integrity: ' + JSON.stringify(integrityChecks().filter(c => c.status === 'ISSUE').map(c => c.name)));
    return out; });
  console.log(r.join('\n')); await b.close();
})();
