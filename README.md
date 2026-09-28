# WeldWorld Atlas

An interactive 3D map of welding and NDT workflows, built for commercial strategy work. You can trace any end segment through its applications, weld processes, automation, filler metals and inspection methods, in manual and automated settings.

```
Industry tier → End segment → Application → Weld process → Automation → Filler metal → NDT & QA
   (2)             (18)          (41)           (11)           (13)          (15)          (12)
```

## How to open it

- **Locally:** open `index.html` in Chrome or Edge. `data.js` must sit next to it. It needs internet access once to load three.js from jsdelivr.
- **Hosted:** use the private artifact link shared in the Claude session.

## How to use it

| Action | What happens |
| --- | --- |
| Click a node | Its full chain lights up and animated particles show the direction of flow. The camera frames the chain and the right panel explains the node. |
| Segment panel | Shows each application's share of the segment's weld workload (1–5) plus an indicative mix of processes, automation, fillers and NDT |
| Application panel | Shows a step-by-step workflow, materials and thickness, and the exact process, automation, filler and NDT chain |
| Process, automation, filler and NDT panels | Explain how it works, key facts, trade-offs, and "where it matters most" by segment |
| Filters | Light or heavy tier; manual, mechanized or robotic mode |
| Matrix | Compares segments against processes, automation, fillers or NDT as a heat map |
| Guided tours | Data center, wind tower, pipeline, yellow-goods robot cell, semiconductor UHP, job-shop cobot |
| My notes | Per-node notes saved in your browser (localStorage) |
| Deep links | `index.html#seg_dc` opens with the Data Centers segment selected |

## Editing the content

All content lives in `data.js`. The comment header explains the schema. Common edits:

- **Change a segment's application weights:** edit `apps: [["app_id", weight, "note"]]` on the segment.
- **Add an application:** add a node with `layer: "app"` and list its `processes`, `automation`, `fillers` and `ndt`, primary first. Then reference it from one or more segments.
- **Order matters:** the first item in each application list counts as primary (rank factors 1.0, 0.6, 0.4, 0.3 …) in the mix and matrix scores.

## Project task tracker

| # | Task | Status |
| --- | --- | --- |
| 1 | Scaffold repo (`index.html`, `data.js`, `LEARNINGS.md`, README) | Done |
| 2 | Domain data: tiers, segments, applications, processes, automation, fillers, NDT and links | Done (v1.0) |
| 3 | 3D engine: layered layout, curved links, glow nodes, label de-cluttering | Done |
| 4 | Interaction: trace, detail panel, search, filters, tours, matrix, notes, deep links | Done |
| 5 | Headless browser test (desktop + mobile) | Done |
| 6 | Commit, push, publish as a private artifact | Done |
| 7 | Log logic changes and mistakes in `LEARNINGS.md` | Ongoing |

### Backlog (ideas for v2)

- [ ] Replace indicative weights with ESAB market-intelligence data (tonnage or revenue by segment)
- [ ] Add a cutting layer (plasma, oxy-fuel, laser) and gas and consumable-parts layers
- [ ] Regional view (NA / EU / APAC / LATAM), since process mix varies a lot by region
- [ ] Competitor or brand overlay per node
- [ ] Export the current view or matrix to CSV
- [ ] Shared team notes (needs a shared backend instead of localStorage)

## Disclaimer

Weights (1–5), shares and deposition rates are indicative analyst estimates for learning and discussion, not market data. Validate them before external use.
