# RiverSafe: web app mockup

Clickable mockup of the RiverSafe web app (Next.js App Router, JavaScript, Tailwind).
No API keys are needed: the AI chat, live water levels and video news are simulated in the browser.

## Run

```bash
npm install
npm run dev          # http://localhost:3000
# or: npm run build && npm start
```

## Pages

| Route | Feature | What is real, what is mocked |
|---|---|---|
| `/` | Interactive river map | **Real:** PCD arsenic and turbidity per station (`spike/` CSVs), Sentinel-2 NDTI matches, OpenStreetMap tiles, NASA GIBS daily imagery. **Mocked:** station positions (spaced along a hand-drawn Kok line), ThaiWater water levels (random walk every 5 s), rain forecast. |
| `/chat` | AI RAG chat, web + LINE preview | **Mocked:** keyword router and template answers in `lib/mockChat.js`. Citations link to real articles (`lib/sources.js`). The side panel shows router → tools → RAG steps; the LINE tab shows the same chat as a LINE OA. |
| `/news` | Today's news, AI summaries | Article cards summarise real reports and link to them. Video cards are format examples (simulated channel and clip). |

`/chat?q=...` pre-fills and sends a question; the map and news pages link to it.

## Data

`lib/data/pcd.json` is generated from `../spike/kok_turbidity_arsenic.csv` and `../spike/kok_satellite_vs_pcd.csv`:

```bash
node scripts/build-pcd-data.mjs
```

The fixed "today" for the mockup is `MOCK_NOW` in `lib/risk.js`.

## Risk rules (lib/risk.js)

- Arsenic above 0.010 mg/L in the latest round → **high**
- At the standard, or above it in an earlier round → **watch**
- Data older than 60 days raises **low** to **watch**
- The app never says "safe", and always shows the data date and source

## Next steps toward the real app

- Replace `lib/mockChat.js` with an LLM tool-use route handler (`app/api/chat`) and a LINE webhook (`app/api/line`)
- Replace the simulated water levels with a cron job that polls the ThaiWater API
- Replace `lib/news.js` with the news pipeline (RSS + web search + YouTube transcripts → summaries)
- Survey real station coordinates (KK01–KK15) and river geometry
