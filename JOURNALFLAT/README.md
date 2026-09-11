# Malek's Trading Journal

A private, personal trading journal for NQ / ES futures. No accounts, no server —
every trade and screenshot is stored locally in the browser (IndexedDB) on the
device you use it on.

## Structure

- **Home** — four strategy boxes, each with live trade count, net P&L, and win rate.
- **Strategy page** — full trade list with stats (win rate, net P&L, avg R). Strategy
  names are renameable via the pencil icon.
- **Log Trade** — date, symbol (NQ $20/pt · ES $50/pt), side, contracts, entry/exit
  (P&L auto-calculated), optional R multiple, notes, and three screenshots:
  **before / during / after** the trade. Paste from clipboard (Ctrl+V), drag & drop,
  or click to browse.
- **Trade detail** — full review of a trade with a screenshot lightbox.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Static output goes to `dist/` — deployable anywhere (Netlify/Vercel configs included).

> Note: data lives in the browser's IndexedDB, so it's per-device and per-browser.
> Clearing site data clears the journal.
