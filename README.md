# Carbook

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
node tests/features.js index.html     # every shipped feature is still in the file
node tests/harness.js index.html      # 228 accounting and control tests
node tests/az3.js index.html          # full financial cycle, prints every journal entry
node tests/ui-deals.js                # browser flow: the three ways to buy a car
```

Browser tests write screenshots to `tests/out/`. GitHub runs the feature check and the accounting tests on every push (Actions → Check).

**Before editing `index.html`, always get the latest copy first** (`git pull`, or download it from GitHub). Editing an old copy and pushing it silently removes newer features; the Check workflow fails when that happens.

**Chart of accounts:** the Odoo 6-digit chart is built in. A new company gets it automatically; data on the older 4-digit chart is renumbered to the Odoo codes in place the first time the new version opens (same accounts, so entries and balances do not change; the old code is kept as `prevCode`).

**Settings → Data & Backup → Update data** brings saved data up to date (missing accounts, mappings, journals, categories, permissions) without changing existing records. It also runs automatically when the system opens.

## White-label (selling a branded copy)

The app is a single `index.html`. To deliver it to a customer under their own name:

1. **Fast way (no code):** open the app → Settings → Company → **Branding**. Set the display name, tagline, three colours and upload the full logo and icon. Saved with the customer's data.
2. **Baked-in way:** in `index.html` edit `DEFAULT_BRAND` (name, tagline, colours) and the three `DEFAULT_LOGO_*` images, then host the file on the customer's own server (any static host). Their data stays in their own browser storage/backup file.

The company *legal name* (used on documents and reports) is entered at first-run setup and is separate from the display name.
