# WeldWorld Atlas

A study tool for commercial strategy in welding: structured end markets, application workflows, and a 3D model of the actual welding equipment with brand comparisons (ESAB/EWM, Lincoln Electric, Miller/ITW, Fronius).

```
① Markets  →  ② Application  →  ③ Welding system (3D)  →  ④ Gemba walk (3D customer sites)
```

## How to open it

- **Locally:** open `index.html` in Chrome or Edge. Keep `data.js`, `systems.js`, `gemba-data.js` and `gemba-world.js` next to it. It needs internet access to load three.js from jsdelivr.
- **Hosted:** use the private artifact link shared in the Claude session.

## What each step does

| Step | What you see |
| --- | --- |
| **1 · Markets** | 18 segments in 7 market groups, as a sortable table: tier, growth, weld intensity, automation level and top processes. Click a row for buyers, route to market, drivers, codes, a strategy note, the applications inside it (share of segment welding) and the process and automation mix. |
| **2 · Applications** | 41 applications, filterable by market. Each page has materials, the markets it serves, a **weld system recipe** (process, automation, filler, inspection; primary first), the workflow steps and personal notes. Click any recipe item for a definition. |
| **3 · Welding system** | A 3D **MIG cobot cell** with 13 clickable parts: power source, feeder, wire drum, gas, cobot arm, torch, pendant/software, table, workpiece, ground, reamer, fume extraction and safety. Each part shows how it works, what buyers compare, and a **brand comparison**. It also has Explode, Run weld (the arm follows the seam and the bead grows), and a **consumables calculator** (wire, gas and tips per year, cobot vs manual). |
| **4 · Gemba walk** | Six 3D customer sites you walk stop by stop: **wind tower factory, data center campus + prefab shop, job shop with a cobot, pipeline spread, aerospace component shop, shipyard** (40 stops in total). Each stop has *what you'd see*, *who's there and what they care about*, *waste and pain points*, *welding products in use*, *questions to ask* and *where ESAB can win*, plus personal notes. Each site has at-a-glance facts, customer economics and PPE/etiquette. Use Next/Back or the arrow keys; drag to look around. |

Deep links: `#seg_dc` (market), `#app_liquid` (application), `#system`, `#c_wire` (a part), `#g_wind` (a site), `#g_wind.3` (stop 3).

## Editing the content

- `data.js`: markets, applications, processes, automation, fillers, NDT. The header explains the schema. The first item in each application list counts as primary.
- `systems.js`: 3D system components and brand product families. Items marked "(verify)" need checking against current catalogs.
- `gemba-data.js`: Gemba site and stop content (easy to edit text).
- `gemba-world.js`: the 3D kit (halls, cranes, people, arcs, turning rolls, column & boom, vehicles) and one layout per site, with camera positions per stop.

## Project task tracker

### v3 (current): Gemba walks
| # | Task | Status |
| --- | --- | --- |
| 1 | Gemba content: 6 sites, 40 stops | Done |
| 2 | Reusable 3D kit + 6 site layouts with per-stop cameras | Done |
| 3 | Gemba view (site list, stops, 3D stage, briefing panel, notes, arrow keys, deep links) | Done |
| 4 | Cross-links from Markets and Applications to Gemba sites | Done |
| 5 | Test all sites, fix camera and layout issues, publish, push | Done |

### v2: structured markets + 3D equipment
| # | Task | Status |
| --- | --- | --- |
| 1 | Restructure data: market groups, buyers, channel; remove graph tours | Done |
| 2 | Markets table view with expandable segment detail | Done |
| 3 | Application page with weld system recipe and glossary | Done |
| 4 | 3D MIG cobot cell (13 parts, IK-driven arm, explode, run weld) | Done |
| 5 | Brand comparison per part (ESAB/EWM, Lincoln, Miller, Fronius) | Done |
| 6 | Consumables pull-through calculator | Done |
| 7 | Browser test (desktop + mobile), publish, commit, push | Done |
| 8 | Update `LEARNINGS.md` | Done |

### v1: 3D relationship graph (replaced)
Superseded by v2 after feedback that the graph was confusing.

### Backlog
- [ ] More Gemba sites: pressure vessel shop, auto body shop, semiconductor fab hook-up, heavy-equipment robot line, refinery turnaround
- [ ] Gemba "field sales mode": one-page question checklist per site to take on real visits
- [ ] 3D: SAW column & boom with turning rolls and flux recovery
- [ ] 3D: orbital TIG (power supply + enclosed head) for semiconductor and data-center liquid cooling
- [ ] 3D: semi-automatic MIG/FCAW shop setup
- [ ] Verify all "(verify)" product names with the product management team
- [ ] Replace indicative weights with ESAB market-intelligence data
- [ ] Regional view (NA / EU / APAC / LATAM)

## Disclaimer

Weights, shares, prices and consumption figures are indicative estimates for learning and discussion, not market data. Product names come from public catalogs; validate them before external use.
