# EBXWorld

A study and strategy tool for the welding business: six end markets, who actually does the welding, named US accounts and hotspots, 3D welding systems with ESAB components highlighted, and 3D Gemba walks of typical customer sites.

```
① End markets  →  ② US market map  →  ③ Welding systems (3D)  →  ④ Gemba walk (3D sites)
```

## How to open it

- **To share:** send `dist/EBXWorld-v2.0.html`. It is one self-contained file that opens in Chrome, Edge or Safari by double-clicking, with no install and no internet needed. Rebuild it after edits with `python3 build.py`.
- **Locally:** open `index.html` with the `.js` files next to it (needs internet for three.js).
- **Hosted:** the private artifact link from the Claude session.

## What each step does

| Step | What you see |
| --- | --- |
| **1 · End markets** | Six markets: **Shipbuilding, Wind, Aerospace, Semi & Data Centers, Nuclear, Fabricators**. There is a market × product heat map on the home page. Each market has tabs: **Overview · Applications · Who welds · Products · US accounts · Gemba**. |
| Who welds | A value-chain diagram per application (owner → GC/EPC → fabricator/contractor…) with badges for **Holds the torch**, **Buys equipment** and **Specifies**. Example: data center structural steel is welded by the steel fabricator (shop) and the erector (field); the hyperscaler and GC never weld. |
| Products | A simplified grid: **MIG · TIG · SAW · Flux-cored** × **Manual · Cobot · Automation** (Primary / Common / Niche), with ESAB products per cell, a link to the matching 3D system, and then **NDT**. |
| **2 · US market map** | 63 named US accounts (public information) with 92 sites, 16 geographic hotspots, filters by market, type, tier and "holds the torch", and account detail with outsourcing partners. |
| **3 · Welding systems** | Five 3D systems: **MIG cobot cell, SAW column & boom, orbital TIG, manual MIG/flux-cored station, precision TIG bench**. Each shows an ESAB bill of materials ("ESAB supplies X of Y parts"), a **Highlight ESAB** mode, an ESAB solution card per part, competitor comparison (Lincoln, Miller, Fronius), Explode and Run weld. |
| **4 · Gemba walk** | Seven sites tied to the six markets: wind tower factory, data center campus + prefab, semiconductor fab build, nuclear component shop + outage, aerospace shop, shipyard, job shop. There are 47 briefed stops, animated sparks, moving cranes, green flow arrows on the floor, a walk diagram, and links to the 3D welding systems. |

Deep links: `#mk_wind`, `#mk_semidc.who`, `#map`, `#s.saw_cab`, `#s.saw_cab.head`, `#g_nuclear.3`.

## Editing the content

| File | Content |
| --- | --- |
| `markets.js` | Markets, applications, value chains, product grids, NDT, **accounts**, hotspots, US outline |
| `systems.js` | Welding systems, components, `esabPick`, brand comparisons |
| `systems-world.js` | 3D models for SAW, orbital, manual MIG and TIG systems |
| `gemba-data.js` / `gemba-world.js` | Gemba content / 3D site layouts |
| `data.js` | Glossary of processes, automation, fillers and NDT (definitions) |
| `index.html` | The app (includes the 3D cobot cell) |

## Project task tracker

### v2.0: executive feedback round
| # | Task | Status |
| --- | --- | --- |
| 1 | Refocus on 6 end markets with 3–4 applications each | Done |
| 2 | Who welds: value chain per application (torch / buys / specifies) | Done |
| 3 | Simplified product grid (MIG/TIG/SAW/Flux × Manual/Cobot/Automation → NDT) | Done |
| 4 | US market visibility: 63 named accounts, partners, 16 hotspots, map | Done |
| 5 | 4 new 3D welding systems + ESAB highlighting and bill of materials | Done |
| 6 | Gemba: tie to markets, add nuclear + semi fab, sparks/cranes/flow arrows, walk diagram | Done |
| 7 | Test (desktop + mobile, offline), build v2.0 file, publish, push | Done |

### v1.0 and earlier
See `CHANGELOG.md` and `LEARNINGS.md`.

### Backlog
- [ ] Replace public-info accounts and tiers with ESAB CRM data (spend, share, owner)
- [ ] Confirm all "(verify)" product names with product management
- [ ] Add more accounts per market (target 100+) and contractor lists per owner site
- [ ] Regional views beyond the US (EU, APAC)
- [ ] More Gemba sites: pressure vessel shop, naval module supplier, SMR factory

## Disclaimer

Accounts, partners and sites come from public information. Tiers, shares, levels, prices and volumes are analyst estimates, not ESAB data. Validate them before external use.
