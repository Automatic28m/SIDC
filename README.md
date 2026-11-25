# SIDC: Sustainable Innovation Design Challenge

Working files for our entry in the **Sustainable Innovation Design Challenge**, organised by the RMUTT Engineering Alumni Association.

## The challenge

Proposals follow the format **Problem → Idea → Innovation → Impact**. Judging covers five criteria worth 20 points each:

- Creativity
- Clarity of the problem
- Impact
- Feasibility and scalability
- Presentation

| Milestone | Date |
|---|---|
| Idea submission (Google Form) | 30 November 2026 |
| Shortlist announcement | 30 December 2026 |
| Prototype submission | 30 January 2027 |
| Final pitch (10 minutes + 5 minutes Q&A) | 14 February 2027 |

## Our approach

We are building an **AI web application** that needs no IoT devices or other custom hardware. Two directions are under consideration, and the final choice is still open.

### RiverSafe: toxic river pollution

A risk map and Thai-language chatbot for arsenic contamination in the Kok, Sai, Ruak and Mekong rivers. It draws on Pollution Control Department (PCD) and Mekong River Commission (MRC) data, Sentinel-2 satellite imagery and photos from citizens.

### DC-Lens: data center impact

A map of the water, power and carbon impact of data centers in Thailand, with satellite change detection, reservoir level forecasting and a Thai-language chatbot.

## Repository layout

| Path | Contents |
|---|---|
| `SIDC.pdf` | Competition brief |
| `Environmental Overview/` | Research on environmental crises in Thailand and possible AI solutions |
| `Toxic River/` | RiverSafe and ToxicTrace proposal documents |
| `Toxic River/riversafe-web/` | RiverSafe web app mockup (has its own README) |
| `Toxic River/spike/` | Exploratory data on turbidity, arsenic and satellite readings for the Kok river |
| `Data Center/` | Research on data center problems in Thailand and proposed solutions (in Thai) |

## RiverSafe mockup

A clickable mockup built with Next.js, React, Tailwind CSS and Leaflet. It has three pages: an interactive river map, a chat assistant and a news feed. No API keys are needed.

```bash
cd "Toxic River/riversafe-web"
npm install
npm run dev
```

Then open <http://localhost:3000>.

The map uses real PCD arsenic and turbidity readings. Station positions, live water levels, the rain forecast and the chat answers are simulated, so the mockup must not be used for safety decisions. See the app's own README for details.
