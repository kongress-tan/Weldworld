# EBXWorld changelog

## v2.0 (2026-09-28): executive feedback round
Rebuilt around the executive feedback.

- **Six end markets:** Shipbuilding, Wind, Aerospace, Semi & Data Centers, Nuclear, Fabricators. The 18 segments and 41 applications of v1.0 are replaced by 21 focused applications.
- **Who welds:** a value chain per application showing who holds the torch, who buys equipment and who specifies (owner → GC/EPC → fabricator, contractor or OEM)
- **Simplified products:** MIG / TIG / SAW / Flux-cored × Manual / Cobot / Automation, then NDT, with ESAB products per cell
- **US market map:** 63 named accounts (public information), 92 sites, outsourcing partners, 16 hotspots, filters
- **Welding systems:** four new 3D systems (SAW column & boom, orbital TIG, manual MIG/flux-cored, precision TIG), Highlight ESAB mode, ESAB bill of materials per system, and an ESAB solution card per part
- **Gemba:** sites tied to markets, new Nuclear and Semiconductor fab sites, pipeline removed, plus sparks, moving cranes, animated flow arrows, a walk diagram and links to the 3D systems

### Shareable file
- `dist/EBXWorld-v2.0.html` (built by `build.py`, works offline)

### Known limitations
- Accounts and partners come from public information; tiers, levels and shares are analyst estimates. Replace with CRM data.
- Product names marked "(verify)" need confirming.
- The orbital TIG equipment is shown as an ESAB white space (verify with product management).

## v1.0 (2026-09-28): first release for executive review
First shareable version, renamed from the working title "WeldWorld".

- **① Markets:** 18 end segments in 7 market groups, with buyers, route to market, growth, weld intensity, automation level and process mix
- **② Applications:** 41 applications, each with a weld system recipe (process, automation, filler, inspection) and workflow steps
- **③ Welding system:** a 3D MIG cobot cell with 13 parts, a brand comparison per part (ESAB/EWM, Lincoln, Miller, Fronius) and a consumables calculator
- **④ Gemba walk:** six 3D customer sites (wind tower, data center, job shop, pipeline, aerospace, shipyard), 40 briefed stops

Internal build history before the release (see `LEARNINGS.md`):
- build 1: 3D relationship graph (replaced)
- build 2: markets table, applications, 3D cobot cell
- build 3: Gemba walks

### Shareable file
- `dist/EBXWorld-v1.0.html`: a single self-contained HTML file with three.js (MIT, see `vendor/three-LICENSE.txt`) and all data inlined. It works offline. Built by `build.py`.

### Known limitations
- Weights, shares, prices and volumes are indicative estimates, not ESAB market data
- Product names marked "(verify)" still need confirming with product management
