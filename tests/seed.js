module.exports = async function seed(p){
  await p.evaluate(() => { if (!S.accounts.length) A.seedChart();
    const eur = 'gl:' + S.accounts.find(a => a.code === '101220').id, cash = 'gl:' + S.accounts.find(a => a.code === '101100').id;
    const mk = (mkN, m, vin, c, pr, rate) => A.createImportOrder({ makeName:mkN, modelName:m, vin, customerName:c, customerPhone:'010012345' + vin.slice(-2), supplierName:'AMG', price:pr, currency:'EUR', rate });
    const a = mk('BMW','X5','WBAX5111','Mahmoud Naeem','60000','55'), b = mk('BMW','X3','WBAX3222','Ahmed Hamdy','40000','55'), c = mk('Porsche','Cayenne','WP0CY333','Sara Ali','90000','56'), d = mk('Mercedes-Benz','CLE','W1K44444','Kamal','70000','57');
    A.createSettlement('ar', { side:'ar', partnerId: a.customerId, bankId: cash, date: todayCairo(), amount:'500000', currency:'EGP', poId: a.id });
    for (const po of [a, b, c]) A.billImportOrder(po.id, { pi_line: [po.lines[0].id], date: todayCairo(), partnerRef: 'AMG-' + po.number, destination:'transit' });
    A.createCarExpense({ costTypeName:'International shipping', amount:'3000', currency:'EUR', rate:'56', payMode:'now', bankId: eur, cx_car:[poVehicle(a).id, poVehicle(poById(b.id)).id, poVehicle(poById(c.id)).id], date: todayCairo() });
    A.createCarExpense({ costTypeName:'Customs duties (non-recoverable)', amount:'250000', currency:'EGP', payMode:'credit', supplierName:'Customs Authority', cx_car:[poVehicle(poById(c.id)).id], date: todayCairo() });
    A.sellImportOrder(a.id, { price:'4000000', currency:'EGP', date: todayCairo() });
    A.sellImportOrder(b.id, { price:'2600000', currency:'EGP', date: todayCairo(), deliver:'no' });
    const binv = poCycle(poById(a.id)).supInv; A.createSettlement('ap', { side:'ap', partnerId: a.supplierId, bankId: eur, date: todayCairo(), amount:'30000', currency:'EUR', rate:'56', alloc_inv:[binv.id], alloc_applied:['30000'], alloc_portion:[''] });
  });
};
