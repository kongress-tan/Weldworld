# LEARNINGS: master log of key decisions, logic changes and mistakes

This file records how the tool's logic evolved: what I assumed, what I changed and why, and mistakes I made and fixed. Newest entries go at the top of each section.

---

## Session 3 (2026-09-28): v3 Gemba walks

### Request
> "Spend more time describing, and potentially showing, a 3D world of the welding application so I can go to Gemba without actually going, and experience what the typical customer application looks like."

### Approach and logic
1. **Walk in the order the work flows.** Each site is a sequence of stops that follows the material (plate → can → section → inspection → paint), because that is how a real Gemba walk is done and how the value chain makes sense.
2. **Same six questions at every stop:** what you'd see; who's here and what they care about; waste and pain points; welding products in use; questions to ask; where ESAB can win. A fixed structure makes sites comparable and turns the tool into visit prep.
3. **A reusable 3D kit instead of six hand-built scenes.** Halls, cranes, people, arcs, turning rolls, column & booms, vehicles and booths are functions; each site is a layout that calls them. Adding site #7 is mostly content work.
4. **Cameras are part of the layout.** Each builder returns a target and camera position per stop id, so the text (gemba-data.js) and the world (gemba-world.js) stay separate but linked by id.
5. **Composite sites, labeled as such.** Every site is a typical composite, not a specific customer, and volumes are marked indicative.

### Mistakes and fixes
- **G1. The new view was never shown.** I added the Gemba section but forgot to register it in the list of views the navigation toggles, so it stayed hidden. The browser test caught it immediately. *Lesson:* when adding a view, grep for every place the existing views are listed.
- **G2. Welders hidden inside the ship hull.** I put the dry-dock erection crew in the gap between two hull blocks, so the camera sat inside a red wall. *Fix:* weld the seam from staging on the outside of the shell, as happens in a real dock. *Lesson:* check each camera stop visually; 3D layout bugs don't show up in automated tests.
- **G3. Signs blocking the view.** Pipeline signs stood between the camera and the work. *Fix:* moved behind the spoil pile.
- **G4. Wrong bold text.** The list formatter bolded anything before a colon, which turned "Who owns the welding machines:" into a fake role. *Fix:* only bold roles in the "who's here" list.
- **G5. Stray objects from draft code.** Two leftover lines would have placed a power source and extra cans at wrong coordinates. I found them by re-reading before running. *Lesson:* re-read generated geometry code for leftovers before testing.
- **G6. Breadcrumb mismatch.** While walking a site, the top bar still showed an unrelated application. *Fix:* in Gemba, show only the current site.

## Session 2 (2026-09-28): v2 redesign after feedback

### Feedback received
> "The 3D is pretty confusing. I wanted 3D to understand the actual welding system / cobot / wire for the product, with Lincoln, Miller, Fronius, ESAB/EWM brands. I need more structure in end markets. The navigation seems complicated."

### Biggest mistake: 3D was used for the wrong thing
- **What I did in v1:** used 3D to draw an abstract *relationship graph* (111 floating nodes and links).
- **Why that was wrong:** relationships read better in tables and lists. 3D earns its place when the subject is a *physical object*. The user wanted to see the product (power source, feeder, wire, torch, cobot) the way a customer sees it.
- **Analogy:** I built a subway map when you asked to look inside the train.
- **Lesson:** before choosing a visual form, ask "what would a person point at?" If the answer is a machine, model the machine. If it's a relationship, use a table.

### Logic changes in v2
1. **Navigation became a 3-step drill-down** (Markets → Application → Welding system) with numbered tabs, plus a breadcrumb showing the current market and application. It replaced 7 layers, filters, tours and a matrix all shown at once.
2. **Markets got real structure:** 7 market groups; each segment now has *buyers* and *route to market* in addition to growth, weld intensity and automation. The table sorts by group, growth, intensity or automation.
3. **Applications now show a "weld system recipe"**: 4 cards (process, automation, filler, inspection) with the primary choice first, instead of a lit-up chain.
4. **The 3D cobot cell uses inverse kinematics**: the arm calculates its joint angles from where the torch tip must be. "Run weld" moves the tip along the seam and the arm follows naturally. Hand-posing the joints would have looked wrong as soon as anything moved.
5. **Brand comparison lives on each part**, so the comparison is concrete (Lincoln Power Wave vs Fronius TPS/i vs ESAB Aristo / EWM Titan XQ). Uncertain names are marked "(verify)" instead of guessed.
6. **Added a consumables calculator.** Commercial insight: wire, gas and contact tips are the recurring revenue after the equipment sale, and equipment-only brands (Fronius) can't capture it.

### Bugs found in testing and fixed
- **B1. Invisible overlay blocked all clicks (local file only).** The glossary overlay used `display: grid`, which overrides the HTML `hidden` attribute. The artifact wrapper adds a rule that hides it, so the published page looked fine, but opening `index.html` locally was broken. *Fix:* my own `[hidden] { display: none !important; }`. *Lesson:* test the file the way the user will open it, not only in the hosted wrapper.
- **B2. Weld seam faced away from the camera.** I first put the fillet on the back side of the plate. *Fix:* moved the seam to the camera side and aimed the torch direction to match.
- **B3. The torch nozzle taper was reversed** (wide at the tip). *Fix:* orient the cylinder from the neck toward the tip.
- **B4. A memory leak in click detection:** each animation frame added a new cable mesh to the pickable list. *Fix:* raycast the component groups directly.
- **B5. The selected-part highlight was too strong** and washed out labels (e.g. the wire drum text). *Fix:* a softer highlight.
- **B6. Tool failures:** in session 1 the command-safety check failed repeatedly, so testing and git push were delayed. *Lesson:* publish or save deliverables early, and say clearly what is untested.

## Session 1 (2026-09-28): v1.0 build

### Approach (as confirmed at the start)
1. Model the industry as a **7-layer directed graph**: tier → segment → application → process → automation → filler → NDT.
2. Put **all content in `data.js`** so it can be edited without touching the 3D code.
3. Render with three.js: one column per layer, curved links, and click-to-trace.
4. Add study aids: detail panels, guided tours, a segment × layer matrix, and notes.

### Key logic decisions

**D1. Link applications directly to automation, filler and NDT, not only to processes.**
- *First idea:* chain everything strictly: application → process → automation → filler → NDT.
- *Problem:* clicking "Data Centers" would then light up every automation type GTAW can use (robots, cobots, special machines), which is wrong for that segment.
- *Fix:* each application lists its own automation, fillers and NDT (**specific** links). Processes keep **generic** links (what the process can do in general), and those are only followed when you select a process-side node.
- *Analogy:* a subway map where each train line (application) lists its own stops, instead of assuming every line stops everywhere the track goes.

**D2. Trace rules that stop over-highlighting.**
- Downstream from a segment or application: follow structural and specific links only.
- Upstream from a filler or NDT node: take one hop to its processes (generic), but do not keep climbing from those processes. Otherwise "metal-cored wire" would light up every GMAW application in the world.

**D3. Quantity is shown as weights, not fake precision.**
- Each segment → application link carries a 1–5 weight for the share of that segment's welding workload.
- The "mix" and matrix scores use Σ (weight × rank factor), where rank factor = 1.0, 0.6, 0.4, 0.3 for the 1st, 2nd, 3rd and later items in an application's list.
- These are labeled **indicative** everywhere. They are a thinking tool, not market data.

**D4. Added a "Manual (handheld)" and a "Semi-automatic" node to the automation layer.**
- This keeps every chain complete (manual work is still a workflow choice), and it makes the manual vs automated filter a simple rule on the automation node's `mode`.

### Domain corrections (things worth remembering)

**C1. Data centers are not mainly orbital TIG.** (The original prompt suggested they were.)
- By weld volume, data-center builds are led by **large-bore carbon-steel chilled-water piping** (TIG or stick root, FCAW or GMAW fill), **structural steel** (FCAW-S and stick in the field), and **off-site prefab** (skids, genset bases, switchgear and e-house enclosures).
- **Orbital GTAW** is real but concentrated in **stainless liquid-cooling loops (TCS/CDU)**. It is smaller today and the fastest-growing slice as direct-to-chip cooling scales.
- Grooved and press-fit mechanical couplings compete with welding on smaller pipe sizes.
- The upstream power build (gas turbines, HRSGs, substations) shows up under Power Generation.

**C2. Automotive body-in-white is mostly resistance spot welding, not arc welding.**
Arc welding in autos concentrates in chassis and suspension, exhaust, and EV battery trays.

**C3. Metal-cored wire is classified under GMAW (AWS A5.18 E70C), not FCAW.**
It is linked to the GMAW process node, even though it is tubular like flux-cored wire.

**C4. HVAC copper coils are brazed, not arc welded.**
This is noted in the segment so it doesn't overstate arc-welding volume.

### Build mistakes and fixes

**M1. The CDN was blocked in the build container.**
jsdelivr and cdnjs returned 403 from the sandbox. The page still loads three.js from jsdelivr (allowed in the artifact viewer and in normal browsers). For testing I pulled three@0.147.0 from npm and routed the CDN URLs to the local copy. *Lesson:* test offline-capable, and give the page a fallback message. The page shows "3D view unavailable" and opens the Matrix view if three.js fails to load.

**M2. Label overlap.**
With 111 nodes, drawing every label makes an unreadable wall of text. *Fix:* a per-frame collision pass places labels in priority order (selected > highlighted > layer importance > size > closeness) and skips any that would overlap. Dimmed labels are hidden while a chain is selected.

---

## How to add to this log
For each future change, add:
- **What changed** (one line)
- **Why** (the assumption that was wrong or the user feedback)
- **Lesson** (what to check next time)
