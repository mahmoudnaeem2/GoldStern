# Goldstern ERP

ERP and accounting system for Goldstern, an Egyptian car importer. It is one self-contained web page: open it at **https://mahmoudnaeem2.github.io/GoldStern/** or open `index.html` in a browser (Chrome or Edge). Data is saved in the browser on that computer; use **Settings → Data & Backup** to export a backup.

## What it covers

- **Car orders** — import for a named customer, import for stock (choose the buyer when you sell), or buy a car from a customer and resell it with a commission from the seller.
- **Cars** — stock, receipts, deliveries, moves history, physical count, closing a car once everything is settled.
- **Car expenses** — freight, customs, clearance, transport…, charged to one or several cars; recoverable VAT goes to input VAT.
- **Sales** — sales orders, customer invoices with VAT, deposits, receipts.
- **Banking** — bank and cash accounts in EGP, EUR, USD; transfers; statements and reconciliation.
- **Accounting** — journal entries, chart of accounts, general ledger, trial balance, financial statements, aging, month-end close checklist and period lock.

Exchange differences on a car's invoices are charged to the car (its cost or its revenue) rather than to FX gain/loss, so each car shows what was actually paid and received in EGP. This is a company policy choice; confirm it with your auditor.

## Tests

Requires Node.js 18+ and Playwright (`npm i playwright`).

```bash
node tests/harness.js index.html      # 228 accounting and control tests
node tests/az3.js index.html          # full financial cycle, prints every journal entry
node tests/ui-deals.js                # browser flow: the three ways to buy a car
```

Browser tests write screenshots to `tests/out/`.
