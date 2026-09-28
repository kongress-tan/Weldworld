/*
 * EBXWorld: end markets, value chain and US market visibility
 * ------------------------------------------------------------------
 * 6 end markets -> applications -> who welds (value chain) ->
 * product grid (MIG / TIG / SAW / Flux-cored x Manual / Cobot / Automation)
 * -> NDT. Plus named US accounts and geographic hotspots.
 *
 * Product grid levels: 0 = not used, 1 = niche, 2 = common, 3 = primary.
 * ndt ids refer to the glossary in data.js.
 *
 * SOURCES: account names, sites and partner relationships come from
 * public information (company sites, press, trade coverage) as of 2026.
 * Tiers (A/B/C) are analyst judgment of welding relevance, NOT ESAB
 * revenue. Items marked "(verify)" need confirming. Replace with ESAB
 * CRM data before external use.
 */
window.EBX_MARKETS = {
  processes: [
    { id: "MIG", name: "MIG", full: "MIG / MAG (GMAW), incl. metal-cored", gloss: "proc_gmaw" },
    { id: "TIG", name: "TIG", full: "TIG (GTAW), incl. orbital", gloss: "proc_gtaw" },
    { id: "SAW", name: "SAW", full: "Submerged arc (SAW)", gloss: "proc_saw" },
    { id: "FLUX", name: "Flux", full: "Flux-cored (FCAW-G / FCAW-S); stick noted where used", gloss: "proc_fcawg" },
  ],
  modes: [
    { id: "manual", name: "Manual", full: "Manual & semi-automatic (handheld)" },
    { id: "cobot", name: "Cobot", full: "Collaborative robot" },
    { id: "auto", name: "Automation", full: "Mechanized & automated: column & boom, orbital, gantry, carriage, robot" },
  ],
  // which 3D system illustrates each process x mode cell
  systemFor: { "MIG|cobot": "cobot_mig", "SAW|auto": "saw_cab", "TIG|auto": "orbital_tig", "MIG|manual": "manual_mig", "FLUX|manual": "manual_mig", "TIG|manual": "manual_tig", "FLUX|auto": "manual_mig" },

  markets: [
    /* =========================== SHIPBUILDING =========================== */
    {
      id: "mk_ship", name: "Shipbuilding", color: "#5B9BD5",
      tagline: "Naval and commercial yards: panels, blocks, hulls and submarines",
      sum: "US shipbuilding is dominated by naval programs: aircraft carriers, submarines, destroyers and frigates. Shipyards weld mostly in-house with their own (often union) workforce, and the submarine build-up is pushing module work out to a growing supplier base.",
      facts: [["US welding demand driver", "Navy shipbuilding plan; submarine industrial base (Columbia and Virginia classes)"], ["Main processes", "Flux-cored (all-position) · SAW on panel lines · MIG · stick for repair"], ["Automation", "Medium: panel lines, gantries, carriages; manual erection"], ["Growth", "High (naval), with a severe skilled-welder shortage"], ["Codes", "NAVSEA Tech Pubs 248/278, MIL-STD, ABS/DNV class rules"]],
      esab: "Rutile and basic flux-cored wire (Dual Shield) and all-position productivity. Railtrac/Miggytrac carriages raise arc-on time in blocks and erection, SAW panel-line packages, and naval-qualified consumables.",
      hotspots: ["hs_hampton", "hs_gulf", "hs_newengland", "hs_socal"],
      gemba: ["ship"],
      apps: [
        {
          id: "sh_panel", name: "Panel line & block assembly", share: 40,
          sum: "Flat plates joined into panels by one-sided SAW, stiffeners fillet-welded by gantries, then panels built into 3D blocks in halls.",
          materials: "Shipbuilding steel (AH36/DH36), HSLA; 8–30 mm",
          grid: { MIG: [2, 1, 2], TIG: [0, 0, 0], SAW: [0, 0, 3], FLUX: [3, 1, 2] },
          auto: "Panel line: one-sided SAW + multi-torch gantry; carriages in blocks",
          esab: { MIG: "Aristo/Warrior + OK Autrod, Coreweld", SAW: "A6 heads, OK Flux + OK Autrod SAW wire", FLUX: "Dual Shield rutile FCAW; Railtrac/Miggytrac carriages" },
          ndt: ["ndt_vt", "ndt_ut", "ndt_rt"],
          chain: [
            { stage: "Owner / program", who: "US Navy (NAVSEA), Coast Guard, commercial owners", role: "Sets class and weld requirements", spec: true },
            { stage: "Prime shipyard", who: "HII (Newport News, Ingalls), GD (Electric Boat, Bath Iron Works, NASSCO), Austal USA, Fincantieri Marinette", role: "Welds in-house on panel lines and in block halls; buys equipment and consumables centrally", torch: true, buys: true, spec: true },
            { stage: "Welding workforce", who: "Yard employees (often union) + labor subcontractors in peaks", role: "Operate the lines and hand-weld blocks", torch: true },
          ],
          torch: "The shipyard itself. Panels and blocks are core in-house work.",
        },
        {
          id: "sh_erect", name: "Hull erection & outfitting", share: 30,
          sum: "Blocks lifted into the dock and joined with out-of-position seams; then piping, foundations and outfitting welds.",
          materials: "Hull steel, HY-80/HY-100 on combatants, CuNi and stainless piping",
          grid: { MIG: [2, 0, 1], TIG: [2, 0, 1], SAW: [0, 0, 0], FLUX: [3, 0, 2] },
          auto: "Carriages (Railtrac), electrogas on verticals",
          esab: { MIG: "Warrior, RobustFeed, Exeor guns", TIG: "Renegade/Rebel for pipe roots, OK Tigrod", FLUX: "Dual Shield all-position FCAW, Railtrac carriages" },
          ndt: ["ndt_ut", "ndt_mt", "ndt_rt", "ndt_vt"],
          chain: [
            { stage: "Prime shipyard", who: "Same yards", role: "Erection welding in dock and on the ways", torch: true, buys: true, spec: true },
            { stage: "Outfitting subcontractors", who: "Pipe, HVAC and electrical subcontractors on the waterfront (verify per yard)", role: "Weld piping and foundations on board", torch: true, buys: true },
          ],
          torch: "Mostly shipyard crews; outfitting trades partly subcontracted.",
        },
        {
          id: "sh_sub", name: "Submarine hull & modules", share: 20,
          sum: "Pressure-hull cylinders and modules in HY-80/HY-100 with strict preheat, heat-input and hydrogen control. Much module work is now outsourced to a supplier network.",
          materials: "HY-80 / HY-100 high-yield steels; thick sections",
          grid: { MIG: [2, 0, 2], TIG: [1, 0, 1], SAW: [0, 0, 2], FLUX: [2, 0, 1] },
          auto: "Mechanized circ seams on hull cylinders; robots in module shops",
          esab: { MIG: "Aristo pulse MIG, high-strength solid and metal-cored wire", SAW: "SAW heads, basic fluxes for high toughness", FLUX: "Low-hydrogen high-strength FCAW (military specs)" },
          ndt: ["ndt_rt", "ndt_ut", "ndt_mt"],
          chain: [
            { stage: "Owner / program", who: "US Navy (Columbia & Virginia classes)", role: "Qualified materials and consumables only", spec: true },
            { stage: "Prime builders", who: "GD Electric Boat (Groton CT, Quonset Point RI), HII Newport News", role: "Final assembly and hull welding", torch: true, buys: true, spec: true },
            { stage: "Module & component suppliers", who: "Austal USA (Mobile AL) and other submarine industrial base suppliers (verify list)", role: "Fabricate modules under prime oversight", torch: true, buys: true },
          ],
          torch: "Primes plus a growing outsourced module base. A key new customer pool.",
        },
        {
          id: "sh_repair", name: "Repair & maintenance yards", share: 10,
          sum: "Navy ship repair and commercial drydocking: cut-outs, inserts and piping repair under time pressure.",
          materials: "All hull and piping materials",
          grid: { MIG: [2, 0, 0], TIG: [2, 0, 0], SAW: [0, 0, 0], FLUX: [3, 0, 1] },
          auto: "Mostly manual",
          esab: { MIG: "Rebel/Warrior portable", TIG: "Renegade", FLUX: "Dual Shield, Coreshield; Arcair gouging" },
          ndt: ["ndt_ut", "ndt_mt", "ndt_pt"],
          chain: [
            { stage: "Owner", who: "Navy (regional maintenance centers), commercial operators", role: "Awards repair availabilities", spec: true },
            { stage: "Repair yards", who: "BAE Systems Ship Repair, Vigor, public naval shipyards (verify)", role: "Weld repairs", torch: true, buys: true },
          ],
          torch: "Repair yards and naval shipyards.",
        },
      ],
    },

    /* =============================== WIND =============================== */
    {
      id: "mk_wind", name: "Wind", color: "#4DD4A6",
      tagline: "Tower and monopile factories: the SAW heartland",
      sum: "Onshore towers are built in dedicated US factories run by independent tower fabricators or turbine OEMs. The offshore foundation build-out slowed sharply after 2025 federal policy changes, so onshore towers carry most US volume today (verify current status).",
      facts: [["US welding demand driver", "Onshore installations; repowering; offshore (paused/uncertain)"], ["Main processes", "Tandem and twin SAW (long and circ seams) · MIG/FCAW for tacks, flanges and internals"], ["Automation", "High: column & boom + turning rolls"], ["Growth", "Moderate, policy-volatile"], ["Codes", "AWS D1.1, EN 1090 / ISO 3834, customer specs"]],
      esab: "Complete SAW chain: CaB column & booms, A6 heads, LAF/TAF power sources, ICE cold-wire, OK Flux + OK Autrod in bulk (Marathon Pac), flux recovery and Arcair gouging.",
      hotspots: ["hs_plains", "hs_midwest", "hs_texas", "hs_front"],
      gemba: ["wind"],
      apps: [
        {
          id: "wi_tower", name: "Onshore tower sections", share: 65,
          sum: "Rolled cans joined into 20–30 m sections by SAW, flanges welded on, then 100% UT.",
          materials: "S355 / A572, 15–50 mm; 4–5 m diameter",
          grid: { MIG: [2, 1, 1], TIG: [0, 0, 0], SAW: [0, 0, 3], FLUX: [2, 0, 1] },
          auto: "Column & boom + turning rolls for all main seams",
          esab: { MIG: "Warrior/Aristo for tacks and internals", SAW: "CaB + A6 tandem/twin, LAF/TAF, OK Flux 10.71/10.72, OK Autrod 12.22", FLUX: "Dual Shield for flanges/out-of-position" },
          ndt: ["ndt_paut", "ndt_ut", "ndt_mt"],
          chain: [
            { stage: "Developer / owner", who: "NextEra, Invenergy, Pattern, utilities", role: "Buys turbines; no welding", spec: false },
            { stage: "Turbine OEM", who: "GE Vernova, Vestas, Siemens Gamesa", role: "Specifies tower design and weld quality; sources towers", spec: true },
            { stage: "Tower fabricator", who: "Arcosa Wind Towers, Broadwind, Marmen, Vestas (Pueblo CO tower plant)", role: "Welds towers; buys SAW equipment and bulk consumables", torch: true, buys: true },
          ],
          torch: "Tower factories, independent or OEM-owned.",
        },
        {
          id: "wi_mono", name: "Offshore monopiles & transition pieces", share: 25,
          sum: "Very thick, large-diameter cans with multi-wire SAW. The US has only a few plants; much supply has come from Europe and Asia.",
          materials: "S355 ML/NL, 60–150 mm; up to 10+ m diameter",
          grid: { MIG: [1, 0, 1], TIG: [0, 0, 0], SAW: [0, 0, 3], FLUX: [2, 0, 0] },
          auto: "Multi-wire SAW column & booms; special machines",
          esab: { SAW: "Multi-wire A6/ICE, basic OK Flux for low-temperature toughness", FLUX: "Dual Shield basic for repairs" },
          ndt: ["ndt_paut", "ndt_tofd", "ndt_ut"],
          chain: [
            { stage: "Offshore developer", who: "Dominion Energy (CVOW), Ørsted, Equinor (projects affected by 2025 policy)", role: "Awards foundation packages", spec: true },
            { stage: "Foundation fabricator", who: "EEW American Offshore Structures (Paulsboro NJ); imports from EEW, Sif, Smulders (EU)", role: "Welds monopiles/TPs", torch: true, buys: true },
          ],
          torch: "A handful of specialist foundation plants.",
        },
        {
          id: "wi_nacelle", name: "Nacelle frames, hubs & internals", share: 10,
          sum: "Welded bedplates and frames (cast parts are cast, not welded), platforms, ladders and cable trays inside towers.",
          materials: "Structural steel and aluminum",
          grid: { MIG: [3, 2, 2], TIG: [1, 0, 0], SAW: [0, 0, 0], FLUX: [1, 0, 0] },
          auto: "Robots for repeat frames; cobots for platforms",
          esab: { MIG: "Aristo + cobot packages, OK Autrod / Coreweld" },
          ndt: ["ndt_vt", "ndt_mt"],
          chain: [
            { stage: "Turbine OEM", who: "GE Vernova, Vestas, Siemens Gamesa", role: "Assembles nacelles; welds some frames in-house", torch: true, buys: true, spec: true },
            { stage: "Component fabricators", who: "Contract fabricators for frames and internals", role: "Weld platforms, ladders, frames", torch: true, buys: true },
          ],
          torch: "OEM plants and contract fabricators.",
        },
      ],
    },

    /* ============================ AEROSPACE ============================ */
    {
      id: "mk_aero", name: "Aerospace", color: "#A48CF7",
      tagline: "Engines, launch vehicles and defense: precision TIG, orbital, automation",
      sum: "Low tonnage, very high value. Welding centers on jet engine components (titanium and nickel alloys), launch vehicles (stainless and aluminum-lithium tanks) and defense systems. Most welding is in-house at OEMs and Tier 1 suppliers under Nadcap control.",
      facts: [["US welding demand driver", "Engine production ramp, launch cadence (SpaceX, Blue Origin, ULA), defense budgets"], ["Main processes", "TIG manual and automated · orbital TIG on tubes · plasma, EB, laser, FSW (non-arc)"], ["Automation", "Medium–high"], ["Growth", "High (space and defense)"], ["Codes", "AWS D17.1, Nadcap, customer specs"]],
      esab: "Precision TIG (Renegade, Rebel, EWM Tetrix) with fine low-amp control, OK Tigrod titanium/nickel fillers, and automated TIG/plasma cells. Space: stainless MIG/TIG at high volume, where launch-vehicle builders buy like industrial fabricators.",
      hotspots: ["hs_newengland", "hs_ohio", "hs_texas", "hs_tennessee", "hs_pnw", "hs_socal", "hs_front"],
      gemba: ["aero"],
      apps: [
        {
          id: "ae_engine", name: "Jet engine components", share: 40,
          sum: "Combustors, casings, ducts and seals in titanium and nickel superalloys; manual and automated TIG, plasma, EB and laser.",
          materials: "Ti-6Al-4V, Inconel 718/625, Waspaloy",
          grid: { MIG: [0, 0, 0], TIG: [3, 1, 3], SAW: [0, 0, 0], FLUX: [0, 0, 0] },
          auto: "Automated TIG/plasma cells, orbital heads on tubes",
          esab: { TIG: "Renegade / Rebel / EWM Tetrix; OK Tigrod Ti & Ni rods" },
          ndt: ["ndt_pt", "ndt_rt", "ndt_et", "ndt_ut"],
          chain: [
            { stage: "Engine OEM", who: "GE Aerospace, Pratt & Whitney (RTX), Rolls-Royce (Indianapolis)", role: "Welds critical parts in-house; approves suppliers", torch: true, buys: true, spec: true },
            { stage: "Tier 1/2 suppliers", who: "Howmet, Precision Castparts (PCC), other fabricators (verify)", role: "Weld casings, rings, ducts", torch: true, buys: true },
            { stage: "MRO shops", who: "OEM service centers, independent repair stations", role: "Repair welding on returned parts", torch: true, buys: true },
          ],
          torch: "OEM plants and qualified Tier suppliers.",
        },
        {
          id: "ae_space", name: "Launch vehicles & tanks", share: 35,
          sum: "Stainless (Starship) and aluminum-lithium tanks and domes. SpaceX welds huge volumes of stainless at Starbase, closer to heavy fabrication than classic aerospace.",
          materials: "300-series stainless, Al-Li, Inconel",
          grid: { MIG: [2, 1, 2], TIG: [3, 1, 3], SAW: [0, 0, 1], FLUX: [0, 0, 0] },
          auto: "Automated circ-seam welders, orbital, robotic; FSW on aluminum",
          esab: { MIG: "Pulse MIG for stainless, OK Autrod stainless", TIG: "Automated TIG, OK Tigrod stainless" },
          ndt: ["ndt_rt", "ndt_pt", "ndt_leak", "ndt_ut"],
          chain: [
            { stage: "Launch provider", who: "SpaceX, Blue Origin, United Launch Alliance, Rocket Lab", role: "Design, fabricate and weld in-house; vertically integrated", torch: true, buys: true, spec: true },
            { stage: "Suppliers", who: "Tank, dome and structure suppliers (verify)", role: "Some structures outsourced", torch: true, buys: true },
          ],
          torch: "The launch companies themselves: fast-moving, high-volume buyers.",
        },
        {
          id: "ae_defense", name: "Defense systems & ground vehicles", share: 25,
          sum: "Missiles, hypersonics, launchers and armored vehicles: from precision TIG to heavy MIG on armor.",
          materials: "Armor steel, aluminum, titanium, nickel alloys",
          grid: { MIG: [3, 1, 2], TIG: [2, 0, 1], SAW: [0, 0, 0], FLUX: [2, 0, 0] },
          auto: "Robotic MIG on hulls; automated TIG on motor cases",
          esab: { MIG: "Aristo robotic packages, high-strength wire", TIG: "Renegade/Rebel", FLUX: "Military-spec FCAW" },
          ndt: ["ndt_ut", "ndt_rt", "ndt_mt"],
          chain: [
            { stage: "Government", who: "DoD program offices", role: "Specs and qualification", spec: true },
            { stage: "Defense primes", who: "Lockheed Martin, RTX, General Dynamics Land Systems, BAE Systems", role: "Weld in-house and via suppliers", torch: true, buys: true, spec: true },
            { stage: "Fabrication suppliers", who: "Qualified defense fabricators", role: "Weldments and structures", torch: true, buys: true },
          ],
          torch: "Primes and their qualified suppliers.",
        },
      ],
    },

    /* ======================== SEMI & DATA CENTERS ======================== */
    {
      id: "mk_semidc", name: "Semi & Data Centers", color: "#58C4F5",
      tagline: "AI build-out: fabs, hyperscale campuses and the power behind them",
      sum: "The biggest construction wave in US industry. Owners (chipmakers, hyperscalers) never weld themselves. Welding is done by the steel fabricators, erectors, mechanical contractors, UHP piping specialists and equipment OEMs that general contractors and EPCs hire.",
      facts: [["US welding demand driver", "CHIPS Act fabs; AI data centers; on-site power"], ["Main processes", "Flux-cored and stick (field structural and pipe) · MIG and cobots (prefab, equipment) · orbital TIG (UHP, liquid cooling)"], ["Automation", "Low–medium, rising in prefab"], ["Growth", "Very high"], ["Codes", "AWS D1.1, ASME B31.3/B31.9, SEMI F78/F81, ASME BPE"]],
      esab: "Win the contractors, not the owners. Field FCAW-S and engine drives for erectors, prefab productivity (positioners, pulse MIG, cobots) for mechanical and skid shops, TIG/orbital consumables for UHP, and WeldCloud documentation for turnover.",
      hotspots: ["hs_nova", "hs_phoenix", "hs_texas", "hs_ohio", "hs_upstateny", "hs_southeast", "hs_midwest"],
      gemba: ["dc", "semi"],
      apps: [
        {
          id: "dc_struct", name: "Structural steel (fabs & data halls)", share: 30,
          sum: "Building frames, pipe racks, mezzanines. Shop-fabricated by steel fabricators, then field-erected and welded by ironworkers.",
          materials: "A992 / A572 structural steel, 6–50 mm",
          grid: { MIG: [2, 1, 2], TIG: [0, 0, 0], SAW: [0, 0, 1], FLUX: [3, 0, 0] },
          auto: "Robotic beam assembly lines in large shops",
          esab: { MIG: "Warrior/Aristo; cobots for fittings", SAW: "Beam-line SAW", FLUX: "Coreshield E71T-8 (seismic), Dual Shield; engine-driven welders; Atom Arc 7018" },
          ndt: ["ndt_ut", "ndt_mt", "ndt_vt"],
          chain: [
            { stage: "Owner", who: "Microsoft, Google, AWS, Meta, Oracle/OpenAI; TSMC, Intel, Samsung, Micron", role: "Funds and sets design standards; never welds", spec: true },
            { stage: "General contractor / EPC", who: "Turner, DPR, Holder, Clayco, Mortenson, Whiting-Turner; fab EPCs Exyte, Jacobs, Bechtel, Kiewit", role: "Manages site; subcontracts steel; does not weld", spec: true },
            { stage: "Steel fabricator", who: "W&W|AFCO Steel, Schuff Steel (DBM Global), regional AISC-certified fabricators", role: "Shop welding of beams, columns, connections", torch: true, buys: true },
            { stage: "Steel erector", who: "Erection divisions of fabricators or independent erectors (ironworkers)", role: "Field welding of splices and moment connections", torch: true, buys: true },
          ],
          torch: "Steel fabricators (shop) and erectors (field). The GC and owner do not weld.",
        },
        {
          id: "dc_mech", name: "Mechanical piping (chilled water, process cooling)", share: 30,
          sum: "Large-bore carbon-steel chilled-water and condenser piping, process cooling water and exhaust in fabs. Increasingly prefabricated off site.",
          materials: "A53/A106 carbon steel, stainless; 2–48 in",
          grid: { MIG: [2, 1, 2], TIG: [2, 0, 1], SAW: [0, 0, 1], FLUX: [3, 0, 1] },
          auto: "Pipe positioners, orbital open heads in prefab shops",
          esab: { MIG: "Rebel/Warrior, advanced waveform root", TIG: "Renegade + OK Tigrod roots", FLUX: "Dual Shield fill & cap; stick E6010/E7018 in field" },
          ndt: ["ndt_rt", "ndt_paut", "ndt_vt"],
          chain: [
            { stage: "GC / EPC", who: "Turner, DPR, Holder, Exyte, Jacobs…", role: "Awards mechanical package", spec: true },
            { stage: "Mechanical contractor", who: "EMCOR, Comfort Systems USA, MMC Contractors, Southland Industries, Limbach, TDIndustries", role: "Prefab shops + field pipefitter-welders; buys equipment and consumables", torch: true, buys: true },
          ],
          torch: "Mechanical contractors, in their prefab shops and on site (union pipefitters, UA).",
        },
        {
          id: "dc_liquid", name: "Liquid cooling & UHP / specialty piping", share: 15,
          sum: "Stainless TCS loops and CDU manifolds for AI racks; ultra-high-purity gas and chemical lines in fabs. Orbital TIG territory.",
          materials: "304L/316L, EP 316L tube",
          grid: { MIG: [0, 0, 0], TIG: [2, 0, 3], SAW: [0, 0, 0], FLUX: [0, 0, 0] },
          auto: "Orbital TIG (enclosed and open heads)",
          esab: { TIG: "OK Tigrod 316L, Victor gas control; orbital power supplies are a white space (specialists dominate)" },
          ndt: ["ndt_vt", "ndt_leak", "ndt_monitor"],
          chain: [
            { stage: "Owner / EPC", who: "Chipmakers, hyperscalers; Exyte and others", role: "Set cleanliness and weld-log requirements", spec: true },
            { stage: "Specialty contractors", who: "UHP piping specialists (e.g. Kinetics, part of Exyte), mechanical contractors' process groups (verify)", role: "Orbital welding in cleanrooms and prefab", torch: true, buys: true },
            { stage: "Cooling OEMs", who: "Vertiv, Schneider (Motivair), CoolIT, nVent (verify)", role: "Weld CDUs and manifolds in factories", torch: true, buys: true },
          ],
          torch: "Specialty contractors and cooling-equipment OEMs.",
        },
        {
          id: "dc_power", name: "Power & electrical equipment", share: 25,
          sum: "Switchgear, busway, UPS, transformers, gensets, e-houses and skids built in OEM factories. Long lead times, rapid factory expansion.",
          materials: "Sheet steel, stainless, aluminum, copper bus",
          grid: { MIG: [3, 2, 2], TIG: [2, 1, 1], SAW: [0, 0, 1], FLUX: [1, 0, 0] },
          auto: "Robotic cells and cobots in OEM factories",
          esab: { MIG: "Aristo/Warrior + cobot packages, OK Autrod", TIG: "Rebel/Renegade for stainless and aluminum" },
          ndt: ["ndt_vt", "ndt_leak"],
          chain: [
            { stage: "Owner / GC", who: "Hyperscalers and GCs", role: "Procure equipment (often owner-direct)", spec: true },
            { stage: "Equipment OEMs", who: "Eaton, Schneider Electric, Siemens, ABB, Vertiv, GE Vernova, Caterpillar, Cummins", role: "Weld enclosures, skids and tanks in US plants", torch: true, buys: true },
            { stage: "Contract fabricators", who: "Enclosure and skid fabricators serving the OEMs", role: "Overflow welding capacity", torch: true, buys: true },
          ],
          torch: "Equipment OEM factories and their contract fabricators.",
        },
      ],
    },

    /* ============================== NUCLEAR ============================== */
    {
      id: "mk_nuclear", name: "Nuclear", color: "#F2A93B",
      tagline: "Restarts, SMRs, naval reactors and fuel storage",
      sum: "Nuclear is re-accelerating: plant restarts, life extensions, SMR first-of-a-kind builds and naval reactor components for the submarine program. Welding is concentrated in a small number of qualified (NQA-1 / ASME III N-stamp) fabricators plus outage service contractors.",
      facts: [["US welding demand driver", "Naval reactors, SMR demos (TVA, TerraPower, X-energy, Kairos), restarts, data-center power deals"], ["Main processes", "TIG (orbital, narrow-gap, hot-wire) · SAW on vessels · strip cladding · stick"], ["Automation", "High for critical welds"], ["Growth", "High"], ["Codes", "ASME III, NQA-1, 10 CFR 50 App. B"]],
      esab: "Nuclear-grade traceable consumables (OK Tigrod, OK Autrod, nickel alloys, strip cladding), SAW for heavy sections, and documentation. Qualification cycles are long but very sticky.",
      hotspots: ["hs_tennessee", "hs_ohio", "hs_southeast", "hs_mountain", "hs_hampton", "hs_texas"],
      gemba: ["nuclear"],
      apps: [
        {
          id: "nu_vessel", name: "Reactor vessels & heavy components", share: 35,
          sum: "Pressure vessels, steam generators and heads: narrow-gap SAW and TIG, stainless and nickel strip cladding.",
          materials: "SA-508/533 low-alloy steel, stainless and Alloy 52/82 overlays",
          grid: { MIG: [0, 0, 1], TIG: [2, 0, 3], SAW: [0, 0, 3], FLUX: [0, 0, 0] },
          auto: "Narrow-gap SAW on column & boom, strip cladding, hot-wire TIG",
          esab: { TIG: "Nuclear-grade OK Tigrod and nickel wires", SAW: "SAW heads, OK Flux, strip cladding (OK Band)" },
          ndt: ["ndt_ut", "ndt_paut", "ndt_rt", "ndt_pt"],
          chain: [
            { stage: "Reactor vendor", who: "Westinghouse, GE Vernova Hitachi, NuScale, X-energy, TerraPower, Kairos", role: "Designs and specifies components", spec: true },
            { stage: "N-stamp fabricator", who: "BWX Technologies, Curtiss-Wright, Holtec; overseas: Doosan, Framatome (verify per program)", role: "Welds vessels and components", torch: true, buys: true },
          ],
          torch: "A few ASME N-stamp fabricators.",
        },
        {
          id: "nu_piping", name: "Primary & safety piping", share: 25,
          sum: "Heavy-wall stainless and alloy piping: orbital narrow-gap TIG with full records.",
          materials: "Austenitic stainless, carbon steel, dissimilar metal welds",
          grid: { MIG: [0, 0, 0], TIG: [2, 0, 3], SAW: [0, 0, 0], FLUX: [1, 0, 0] },
          auto: "Orbital open-head TIG",
          esab: { TIG: "OK Tigrod stainless and nickel; TIG power sources for manual roots" },
          ndt: ["ndt_rt", "ndt_paut", "ndt_pt"],
          chain: [
            { stage: "Owner / constructor", who: "Utilities; constructors such as Bechtel (verify per project)", role: "Construction and piping installation", spec: true },
            { stage: "Nuclear piping fabricators", who: "Qualified pipe shops (verify)", role: "Shop spools", torch: true, buys: true },
          ],
          torch: "Qualified piping fabricators and constructors.",
        },
        {
          id: "nu_outage", name: "Outages, restarts & life extension", share: 25,
          sum: "Repair and replacement welding during refueling outages and restarts (Palisades, Crane/TMI-1): steam generator work, weld overlays, piping replacement.",
          materials: "All plant materials",
          grid: { MIG: [1, 0, 0], TIG: [3, 0, 2], SAW: [0, 0, 0], FLUX: [1, 0, 0] },
          auto: "Remote and mechanized overlay welding",
          esab: { TIG: "Portable TIG (Renegade), nuclear-grade fillers" },
          ndt: ["ndt_ut", "ndt_paut", "ndt_et", "ndt_ettube"],
          chain: [
            { stage: "Utility", who: "Constellation, Southern Nuclear, Duke, TVA, Holtec (Palisades)", role: "Plans outages", spec: true },
            { stage: "Outage service contractors", who: "Day & Zimmermann, Westinghouse field services, Framatome", role: "Supply welders and machines during outages", torch: true, buys: true },
          ],
          torch: "Outage service contractors bringing traveling welders.",
        },
        {
          id: "nu_fuel", name: "Fuel handling & dry cask storage", share: 15,
          sum: "Stainless canisters and casks for spent fuel: long seams and lid closure welds.",
          materials: "Stainless steel, carbon steel overpacks",
          grid: { MIG: [1, 0, 1], TIG: [2, 0, 2], SAW: [0, 0, 1], FLUX: [0, 0, 0] },
          auto: "Automated lid-closure welding systems",
          esab: { TIG: "OK Tigrod stainless", SAW: "SAW for canister shells" },
          ndt: ["ndt_pt", "ndt_ut", "ndt_leak"],
          chain: [
            { stage: "Cask vendor", who: "Holtec, Orano TN, NAC International", role: "Fabricates canisters; closes lids on site", torch: true, buys: true, spec: true },
          ],
          torch: "Cask vendors (shop and site).",
        },
      ],
    },

    /* ============================ FABRICATORS ============================ */
    {
      id: "mk_fab", name: "Fabricators", color: "#E8795A",
      tagline: "The contract fabrication backbone serving every other market",
      sum: "Tens of thousands of US fabricators, from 10-person job shops to large contract manufacturers. They are the ones actually welding for OEMs, GCs and energy projects, and they buy mostly through distributors.",
      facts: [["US welding demand driver", "Reshoring, infrastructure, OEM outsourcing, welder shortage"], ["Main processes", "MIG (dominant) · Flux-cored · TIG · SAW in heavy shops"], ["Automation", "Low → medium; cobots fastest growing"], ["Growth", "Moderate"], ["Channel", "Distributors: Airgas, Linde, Matheson and independents"]],
      esab: "Largest unit pool for equipment and consumables. Cobot packages and pulse MIG for productivity, distributor programs, and consumables pull-through (Coreweld, Dual Shield, OK Autrod).",
      hotspots: ["hs_midwest", "hs_texas", "hs_southeast", "hs_ohio", "hs_gulf"],
      gemba: ["jobshop"],
      apps: [
        {
          id: "fb_job", name: "Job shops & OEM contract fab", share: 45,
          sum: "Brackets, frames, weldments for OEMs in batches of 5–5,000.",
          materials: "Mild steel 1–25 mm, some stainless and aluminum",
          grid: { MIG: [3, 3, 2], TIG: [2, 1, 0], SAW: [0, 0, 0], FLUX: [2, 0, 0] },
          auto: "Robots for volume; cobots for high-mix",
          esab: { MIG: "Rebel/Warrior/Aristo, ESAB cobot packages, OK Autrod, Coreweld", TIG: "Rebel EMP, Renegade", FLUX: "Dual Shield" },
          ndt: ["ndt_vt", "ndt_mt"],
          chain: [
            { stage: "OEM customer", who: "Caterpillar, Deere, PACCAR, and thousands of machine builders", role: "Outsources weldments; sets quality", spec: true },
            { stage: "Contract fabricator", who: "Mayville Engineering Co. (MEC) and thousands of regional shops", role: "Welds and buys equipment", torch: true, buys: true },
            { stage: "Distributor", who: "Airgas (Air Liquide), Linde, Matheson, independents (IWDC members)", role: "Sells gas, wire and equipment; strongly influences brand", spec: true },
          ],
          torch: "The fabricator. The distributor often chooses the brand.",
        },
        {
          id: "fb_struct", name: "Structural & miscellaneous steel", share: 25,
          sum: "Beams, columns, stairs, rails and joists for buildings: shop MIG/FCAW plus field welding.",
          materials: "Structural steel",
          grid: { MIG: [3, 2, 2], TIG: [0, 0, 0], SAW: [0, 0, 2], FLUX: [3, 0, 1] },
          auto: "Beam lines, robotic assembly (e.g. Peddinghaus, Voortman)",
          esab: { MIG: "Warrior/Aristo, cobots", SAW: "Beam-line SAW", FLUX: "Dual Shield, Coreshield" },
          ndt: ["ndt_ut", "ndt_mt", "ndt_vt"],
          chain: [
            { stage: "GC", who: "Commercial and industrial GCs", role: "Awards steel package", spec: true },
            { stage: "Structural fabricator", who: "W&W|AFCO, Schuff, Nucor (Vulcraft joists), regional AISC shops", role: "Shop welding", torch: true, buys: true },
          ],
          torch: "Structural fabricators and erectors.",
        },
        {
          id: "fb_heavy", name: "Heavy fabrication: vessels, tanks, skids", share: 30,
          sum: "Pressure vessels, storage tanks, cryogenic equipment and process skids for energy and industrial customers.",
          materials: "Carbon, stainless, 9% Ni, aluminum; 6–100 mm",
          grid: { MIG: [2, 1, 1], TIG: [2, 0, 1], SAW: [0, 0, 3], FLUX: [3, 0, 1] },
          auto: "Column & boom, positioners, turning rolls",
          esab: { MIG: "Aristo", TIG: "Renegade", SAW: "CaB + A6, OK Flux", FLUX: "Dual Shield, OK electrodes" },
          ndt: ["ndt_rt", "ndt_paut", "ndt_ut", "ndt_pt"],
          chain: [
            { stage: "Owner / EPC", who: "Energy, chemical and LNG owners; EPCs", role: "Specify ASME codes", spec: true },
            { stage: "Heavy fabricator", who: "Chart Industries, Worthington Enterprises, Trinity (tank cars), regional vessel shops", role: "Weld vessels and tanks", torch: true, buys: true },
          ],
          torch: "Heavy fabricators with ASME stamps.",
        },
      ],
    },
  ],

  /* ============================== ACCOUNTS ============================== */
  // type: Owner | OEM | Shipyard | GC/EPC | Contractor | Fabricator | Distributor
  // welds: does this organisation hold the torch itself?
  accounts: [
    // Shipbuilding
    { name: "HII – Newport News Shipbuilding", market: "mk_ship", type: "Shipyard", tier: "A", welds: true, sites: [["Newport News, VA", 36.98, -76.43]], partners: "Submarine & carrier supplier base; co-builds Virginia class with Electric Boat", note: "Carriers and submarines; largest US shipyard" },
    { name: "HII – Ingalls Shipbuilding", market: "mk_ship", type: "Shipyard", tier: "A", welds: true, sites: [["Pascagoula, MS", 30.35, -88.56]], partners: "Module suppliers along the Gulf Coast (verify)", note: "Destroyers, amphibious ships" },
    { name: "General Dynamics Electric Boat", market: "mk_ship", type: "Shipyard", tier: "A", welds: true, sites: [["Groton, CT", 41.35, -72.08], ["Quonset Point, RI", 41.59, -71.42]], partners: "Austal USA and other module suppliers; HII Newport News", note: "Columbia & Virginia class submarines" },
    { name: "General Dynamics Bath Iron Works", market: "mk_ship", type: "Shipyard", tier: "A", welds: true, sites: [["Bath, ME", 43.91, -69.81]], partners: "", note: "Arleigh Burke destroyers" },
    { name: "General Dynamics NASSCO", market: "mk_ship", type: "Shipyard", tier: "A", welds: true, sites: [["San Diego, CA", 32.69, -117.14]], partners: "", note: "Auxiliaries, commercial ships, repair" },
    { name: "Austal USA", market: "mk_ship", type: "Shipyard", tier: "B", welds: true, sites: [["Mobile, AL", 30.68, -88.04]], partners: "Submarine modules for Electric Boat", note: "Steel and aluminum ships; submarine modules" },
    { name: "Fincantieri Marinette Marine", market: "mk_ship", type: "Shipyard", tier: "B", welds: true, sites: [["Marinette, WI", 45.10, -87.62]], partners: "", note: "Constellation-class frigate (program status: verify)" },
    { name: "Bollinger Shipyards", market: "mk_ship", type: "Shipyard", tier: "B", welds: true, sites: [["Lockport, LA", 29.64, -90.54], ["Pascagoula, MS", 30.36, -88.55]], partners: "", note: "Coast Guard cutters; polar security cutter" },
    { name: "Hanwha Philly Shipyard", market: "mk_ship", type: "Shipyard", tier: "B", welds: true, sites: [["Philadelphia, PA", 39.89, -75.18]], partners: "", note: "Commercial ships; Korean ownership since 2024" },
    { name: "BAE Systems Ship Repair", market: "mk_ship", type: "Shipyard", tier: "C", welds: true, sites: [["Norfolk, VA", 36.85, -76.29], ["San Diego, CA", 32.70, -117.15]], partners: "", note: "Navy repair and modernization" },
    // Wind
    { name: "Arcosa Wind Towers", market: "mk_wind", type: "Fabricator", tier: "A", welds: true, sites: [["Newton, IA", 41.70, -93.05], ["Belen, NM", 34.66, -106.78]], partners: "Supplies towers to turbine OEMs (plant list: verify)", note: "Largest US independent tower maker" },
    { name: "Broadwind (Heavy Fabrications)", market: "mk_wind", type: "Fabricator", tier: "B", welds: true, sites: [["Manitowoc, WI", 44.09, -87.66], ["Abilene, TX", 32.45, -99.73]], partners: "", note: "Towers and heavy fabrications" },
    { name: "Marmen", market: "mk_wind", type: "Fabricator", tier: "B", welds: true, sites: [["Brandon, SD", 43.59, -96.57]], partners: "", note: "Tower plant (Canadian parent)" },
    { name: "Vestas (Pueblo towers)", market: "mk_wind", type: "OEM", tier: "A", welds: true, sites: [["Pueblo, CO", 38.25, -104.61], ["Portland, OR (HQ NA)", 45.52, -122.68]], partners: "Also sources towers from independent fabricators", note: "OEM-owned tower factory" },
    { name: "GE Vernova (Onshore Wind)", market: "mk_wind", type: "OEM", tier: "A", welds: false, sites: [["Schenectady, NY", 42.81, -73.94], ["Pensacola, FL", 30.42, -87.22]], partners: "Towers from Arcosa, Broadwind, Marmen and others", note: "Specifier; nacelle assembly" },
    { name: "EEW American Offshore Structures", market: "mk_wind", type: "Fabricator", tier: "C", welds: true, sites: [["Paulsboro, NJ", 39.83, -75.24]], partners: "", note: "Monopile plant; offshore status uncertain (verify)" },
    { name: "Dominion Energy (CVOW)", market: "mk_wind", type: "Owner", tier: "C", welds: false, sites: [["Portsmouth / Chesapeake, VA", 36.83, -76.33]], partners: "Foundations from EEW and Smulders (EU)", note: "Largest US offshore wind project" },
    // Aerospace
    { name: "GE Aerospace", market: "mk_aero", type: "OEM", tier: "A", welds: true, sites: [["Evendale, OH", 39.25, -84.42], ["Lafayette, IN", 40.42, -86.88]], partners: "Tier suppliers incl. Howmet, PCC", note: "LEAP and military engines" },
    { name: "Pratt & Whitney (RTX)", market: "mk_aero", type: "OEM", tier: "A", welds: true, sites: [["East Hartford, CT", 41.76, -72.64], ["Middletown, CT", 41.56, -72.65]], partners: "", note: "GTF and F135 engines" },
    { name: "Rolls-Royce North America", market: "mk_aero", type: "OEM", tier: "B", welds: true, sites: [["Indianapolis, IN", 39.77, -86.17]], partners: "", note: "Engines, defense" },
    { name: "SpaceX", market: "mk_aero", type: "OEM", tier: "A", welds: true, sites: [["Starbase, TX", 25.99, -97.16], ["Hawthorne, CA", 33.92, -118.33], ["Cape Canaveral, FL", 28.49, -80.58]], partners: "Largely in-house", note: "Stainless Starship: very high weld volume" },
    { name: "Blue Origin", market: "mk_aero", type: "OEM", tier: "A", welds: true, sites: [["Kent, WA", 47.39, -122.23], ["Huntsville, AL", 34.73, -86.59], ["Cape Canaveral, FL", 28.52, -80.65]], partners: "", note: "New Glenn, BE-4 engines" },
    { name: "United Launch Alliance", market: "mk_aero", type: "OEM", tier: "B", welds: true, sites: [["Decatur, AL", 34.64, -87.00]], partners: "", note: "Vulcan rockets" },
    { name: "Howmet Aerospace", market: "mk_aero", type: "Fabricator", tier: "B", welds: true, sites: [["Pittsburgh, PA (HQ)", 40.44, -80.00]], partners: "", note: "Engine components (many US plants)" },
    { name: "Precision Castparts (PCC)", market: "mk_aero", type: "Fabricator", tier: "B", welds: true, sites: [["Portland, OR", 45.47, -122.66]], partners: "", note: "Castings, forgings, fabricated engine parts" },
    { name: "Lockheed Martin", market: "mk_aero", type: "OEM", tier: "B", welds: true, sites: [["Littleton, CO", 39.59, -105.02], ["Troy, AL", 31.81, -85.97], ["Grand Prairie, TX", 32.75, -97.00]], partners: "Qualified fabrication suppliers", note: "Space, missiles" },
    { name: "General Dynamics Land Systems", market: "mk_aero", type: "OEM", tier: "B", welds: true, sites: [["Lima, OH", 40.74, -84.11]], partners: "", note: "Abrams, armored vehicles (Joint Systems Manufacturing Center)" },
    // Semi & Data Centers
    { name: "TSMC Arizona", market: "mk_semidc", type: "Owner", tier: "A", welds: false, sites: [["Phoenix, AZ", 33.78, -112.13]], partners: "EPC/GC and UHP contractors (verify per phase)", note: "Multi-fab campus" },
    { name: "Intel", market: "mk_semidc", type: "Owner", tier: "A", welds: false, sites: [["Chandler, AZ", 33.27, -111.88], ["New Albany, OH", 40.08, -82.80]], partners: "EPCs and mechanical contractors (verify)", note: "Ohio timeline extended (verify)" },
    { name: "Samsung Austin Semiconductor", market: "mk_semidc", type: "Owner", tier: "A", welds: false, sites: [["Taylor, TX", 30.57, -97.41], ["Austin, TX", 30.40, -97.62]], partners: "EPC and specialty contractors (verify)", note: "Taylor fab" },
    { name: "Micron", market: "mk_semidc", type: "Owner", tier: "A", welds: false, sites: [["Boise, ID", 43.53, -116.15], ["Clay, NY", 43.17, -76.19]], partners: "EPC and specialty contractors (verify)", note: "Memory megafabs" },
    { name: "Texas Instruments", market: "mk_semidc", type: "Owner", tier: "B", welds: false, sites: [["Sherman, TX", 33.64, -96.61], ["Lehi, UT", 40.39, -111.85]], partners: "", note: "300 mm analog fabs" },
    { name: "Microsoft (data centers)", market: "mk_semidc", type: "Owner", tier: "A", welds: false, sites: [["Mount Pleasant, WI", 42.69, -87.92], ["San Antonio, TX", 29.42, -98.49]], partners: "GCs per campus (verify)", note: "AI campuses" },
    { name: "Meta (data centers)", market: "mk_semidc", type: "Owner", tier: "A", welds: false, sites: [["Richland Parish, LA", 32.42, -91.77], ["New Albany, OH", 40.08, -82.81]], partners: "GCs per campus (verify)", note: "Hyperion AI campus in Louisiana" },
    { name: "Amazon Web Services", market: "mk_semidc", type: "Owner", tier: "A", welds: false, sites: [["Loudoun / Prince William, VA", 39.00, -77.50], ["New Carlisle, IN", 41.70, -86.51]], partners: "GCs per campus (verify)", note: "Largest cloud builder" },
    { name: "Google (data centers)", market: "mk_semidc", type: "Owner", tier: "A", welds: false, sites: [["Council Bluffs, IA", 41.26, -95.86], ["New Albany, OH", 40.09, -82.79]], partners: "GCs per campus (verify)", note: "" },
    { name: "Oracle / OpenAI (Stargate)", market: "mk_semidc", type: "Owner", tier: "A", welds: false, sites: [["Abilene, TX", 32.45, -99.73]], partners: "Developer Crusoe; GC per campus (verify)", note: "Stargate AI campus" },
    { name: "Turner Construction", market: "mk_semidc", type: "GC/EPC", tier: "A", welds: false, sites: [["New York, NY (HQ)", 40.75, -73.99]], partners: "Subcontracts steel & mechanical", note: "Leading data center GC" },
    { name: "DPR Construction", market: "mk_semidc", type: "GC/EPC", tier: "A", welds: false, sites: [["Redwood City, CA (HQ)", 37.49, -122.23]], partners: "Self-performs some trades", note: "Data centers, fabs" },
    { name: "Exyte", market: "mk_semidc", type: "GC/EPC", tier: "A", welds: true, sites: [["Phoenix, AZ", 33.45, -112.07]], partners: "Kinetics (UHP piping) within group (verify)", note: "Fab EPC, cleanroom and UHP systems" },
    { name: "EMCOR Group", market: "mk_semidc", type: "Contractor", tier: "A", welds: true, sites: [["Norwalk, CT (HQ)", 41.12, -73.41]], partners: "", note: "Mechanical & electrical contractor; prefab shops" },
    { name: "Comfort Systems USA", market: "mk_semidc", type: "Contractor", tier: "A", welds: true, sites: [["Houston, TX (HQ)", 29.76, -95.37]], partners: "", note: "Mechanical contractor; modular prefab" },
    { name: "W&W|AFCO Steel", market: "mk_semidc", type: "Fabricator", tier: "A", welds: true, sites: [["Oklahoma City, OK", 35.47, -97.52]], partners: "", note: "Structural steel for data centers, fabs" },
    { name: "Schuff Steel (DBM Global)", market: "mk_semidc", type: "Fabricator", tier: "B", welds: true, sites: [["Phoenix, AZ", 33.45, -112.07]], partners: "", note: "Structural steel fabricator/erector" },
    { name: "Vertiv", market: "mk_semidc", type: "OEM", tier: "A", welds: true, sites: [["Westerville, OH", 40.13, -82.93]], partners: "", note: "Power and liquid cooling equipment" },
    { name: "Eaton (electrical)", market: "mk_semidc", type: "OEM", tier: "B", welds: true, sites: [["Moon Township, PA", 40.52, -80.22]], partners: "", note: "Switchgear, UPS: US plant expansions" },
    // Nuclear
    { name: "BWX Technologies", market: "mk_nuclear", type: "Fabricator", tier: "A", welds: true, sites: [["Lynchburg, VA", 37.41, -79.14], ["Barberton, OH", 41.01, -81.60], ["Mount Vernon, IN", 37.93, -87.90]], partners: "", note: "Naval reactors, commercial components" },
    { name: "Westinghouse Electric", market: "mk_nuclear", type: "OEM", tier: "A", welds: true, sites: [["Cranberry Twp, PA", 40.69, -80.10]], partners: "Component fabricators; field services welds in outages", note: "AP1000, outage services" },
    { name: "Southern Nuclear (Vogtle)", market: "mk_nuclear", type: "Owner", tier: "B", welds: false, sites: [["Waynesboro, GA", 33.14, -81.76]], partners: "", note: "Vogtle 3&4 operating" },
    { name: "TVA (Clinch River SMR)", market: "mk_nuclear", type: "Owner", tier: "B", welds: false, sites: [["Oak Ridge, TN", 35.93, -84.39]], partners: "GE Vernova Hitachi BWRX-300", note: "First US grid-scale SMR (planned)" },
    { name: "TerraPower (Natrium)", market: "mk_nuclear", type: "OEM", tier: "B", welds: false, sites: [["Kemmerer, WY", 41.79, -110.54]], partners: "Constructor Bechtel (verify)", note: "Sodium fast reactor demo" },
    { name: "Holtec International", market: "mk_nuclear", type: "Fabricator", tier: "B", welds: true, sites: [["Camden, NJ", 39.94, -75.12], ["Palisades, MI", 42.32, -86.31]], partners: "", note: "Casks, SMR-300, Palisades restart" },
    { name: "Day & Zimmermann", market: "mk_nuclear", type: "Contractor", tier: "B", welds: true, sites: [["Philadelphia, PA", 39.95, -75.17]], partners: "", note: "Outage and maintenance welding services" },
    { name: "Curtiss-Wright (nuclear)", market: "mk_nuclear", type: "Fabricator", tier: "C", welds: true, sites: [["Cheswick, PA", 40.54, -79.80]], partners: "", note: "Reactor coolant pumps, naval components" },
    { name: "Kairos Power", market: "mk_nuclear", type: "OEM", tier: "C", welds: true, sites: [["Oak Ridge, TN", 35.96, -84.30], ["Albuquerque, NM", 35.08, -106.65]], partners: "", note: "Hermes demo reactor; in-house fabrication" },
    // Fabricators
    { name: "Chart Industries", market: "mk_fab", type: "Fabricator", tier: "A", welds: true, sites: [["Ball Ground, GA", 34.34, -84.37], ["New Prague, MN", 44.54, -93.58]], partners: "", note: "Cryogenic tanks, LNG/H2 equipment" },
    { name: "Valmont Industries", market: "mk_fab", type: "Fabricator", tier: "A", welds: true, sites: [["Omaha, NE", 41.26, -95.94]], partners: "", note: "Utility poles, structures (heavy MIG/SAW)" },
    { name: "Nucor (Vulcraft & structures)", market: "mk_fab", type: "Fabricator", tier: "A", welds: true, sites: [["Charlotte, NC (HQ)", 35.23, -80.84], ["Norfolk, NE", 42.03, -97.42]], partners: "", note: "Joists, deck, towers and structures" },
    { name: "Mayville Engineering Co. (MEC)", market: "mk_fab", type: "Fabricator", tier: "B", welds: true, sites: [["Mayville, WI", 43.49, -88.55]], partners: "", note: "Large US contract fabricator for OEMs" },
    { name: "Worthington Enterprises", market: "mk_fab", type: "Fabricator", tier: "B", welds: true, sites: [["Columbus, OH", 39.96, -83.00]], partners: "", note: "Pressure cylinders" },
    { name: "Trinity Industries", market: "mk_fab", type: "Fabricator", tier: "B", welds: true, sites: [["Dallas, TX", 32.78, -96.80]], partners: "", note: "Railcars and tank cars" },
    { name: "Airgas (Air Liquide)", market: "mk_fab", type: "Distributor", tier: "A", welds: false, sites: [["Radnor, PA (HQ)", 40.04, -75.36]], partners: "", note: "Largest welding distributor: channel to fabricators" },
    { name: "Linde (US distribution)", market: "mk_fab", type: "Distributor", tier: "B", welds: false, sites: [["Danbury, CT", 41.39, -73.45]], partners: "", note: "Gas and welding supply channel" },
  ],

  /* ============================== HOTSPOTS ============================== */
  hotspots: [
    { id: "hs_hampton", name: "Hampton Roads, VA", lat: 36.9, lon: -76.4, markets: ["mk_ship", "mk_nuclear", "mk_wind"], note: "Newport News (carriers, subs, naval nuclear), Norfolk repair yards, offshore wind staging for CVOW." },
    { id: "hs_nova", name: "Northern Virginia data center alley", lat: 39.0, lon: -77.5, markets: ["mk_semidc"], note: "World's largest data center cluster (Loudoun, Prince William). Mechanical and steel contractors in constant demand." },
    { id: "hs_newengland", name: "Southern New England & Maine", lat: 41.8, lon: -71.8, markets: ["mk_ship", "mk_aero"], note: "Electric Boat (Groton, Quonset Point), Bath Iron Works, Pratt & Whitney engines." },
    { id: "hs_gulf", name: "Gulf Coast (MS–AL–LA)", lat: 30.4, lon: -89.3, markets: ["mk_ship", "mk_fab", "mk_semidc"], note: "Ingalls, Austal, Bollinger; offshore and LNG fabrication yards; Meta's Louisiana AI campus." },
    { id: "hs_phoenix", name: "Phoenix, AZ", lat: 33.5, lon: -112.0, markets: ["mk_semidc"], note: "TSMC and Intel fabs plus a major data center market. Exyte and Schuff are based here." },
    { id: "hs_texas", name: "Texas Triangle & West Texas", lat: 31.5, lon: -97.8, markets: ["mk_semidc", "mk_aero", "mk_wind", "mk_fab", "mk_nuclear"], note: "Samsung Taylor, TI Sherman, Stargate Abilene, SpaceX Starbase, wind towers, Houston/Dallas fabricators, X-energy/Dow Seadrift." },
    { id: "hs_ohio", name: "Ohio corridor", lat: 40.0, lon: -83.0, markets: ["mk_semidc", "mk_aero", "mk_nuclear", "mk_fab"], note: "Intel New Albany, AWS/Google/Meta data centers, GE Aerospace (Evendale), BWXT Barberton, GDLS Lima." },
    { id: "hs_upstateny", name: "Upstate New York", lat: 43.0, lon: -75.0, markets: ["mk_semidc", "mk_wind"], note: "Micron Clay megafab, GlobalFoundries Malta, GE Vernova Schenectady." },
    { id: "hs_southeast", name: "Georgia & Carolinas", lat: 33.8, lon: -82.5, markets: ["mk_nuclear", "mk_semidc", "mk_fab"], note: "Vogtle, Atlanta data centers, Nucor HQ, Chart; strong fabrication base." },
    { id: "hs_tennessee", name: "Tennessee Valley & North Alabama", lat: 35.2, lon: -85.8, markets: ["mk_nuclear", "mk_aero"], note: "Oak Ridge (TVA SMR, Kairos), Huntsville/Decatur (ULA, Blue Origin engines)." },
    { id: "hs_midwest", name: "Upper Midwest fabrication belt", lat: 43.2, lon: -89.5, markets: ["mk_fab", "mk_wind", "mk_semidc", "mk_ship"], note: "Wisconsin fabricators (MEC, Broadwind, Marinette), Microsoft Mount Pleasant, OEM supply chains." },
    { id: "hs_plains", name: "Great Plains wind belt", lat: 41.5, lon: -96.0, markets: ["mk_wind", "mk_fab"], note: "Iowa, Nebraska, South Dakota tower plants (Arcosa Newton, Marmen Brandon), Valmont Omaha." },
    { id: "hs_front", name: "Colorado Front Range", lat: 39.2, lon: -104.9, markets: ["mk_wind", "mk_aero"], note: "Vestas Pueblo towers, Lockheed Martin Space (Littleton)." },
    { id: "hs_mountain", name: "Mountain West nuclear", lat: 42.8, lon: -111.5, markets: ["mk_nuclear"], note: "TerraPower Kemmerer (WY), Idaho National Laboratory." },
    { id: "hs_pnw", name: "Pacific Northwest", lat: 46.5, lon: -121.5, markets: ["mk_aero", "mk_semidc"], note: "Boeing, Blue Origin (Kent), PCC (Portland), Micron Boise, Oregon data centers." },
    { id: "hs_socal", name: "Southern California", lat: 33.3, lon: -117.8, markets: ["mk_ship", "mk_aero"], note: "NASSCO San Diego, SpaceX Hawthorne, aerospace supply chain." },
  ],

  // Simplified outline of the contiguous US (lat, lon), schematic only.
  usOutline: [
    [48.4, -124.7], [46.2, -124.0], [43.0, -124.5], [40.4, -124.4], [38.0, -123.0], [36.6, -121.9], [34.5, -120.6], [34.0, -118.5], [32.6, -117.1],
    [32.7, -114.7], [31.3, -111.0], [31.3, -108.2], [31.8, -106.5], [29.6, -104.4], [29.2, -103.2], [29.8, -102.4], [29.4, -101.0], [27.5, -99.5], [26.0, -97.2],
    [27.8, -97.4], [28.9, -95.3], [29.7, -94.0], [29.6, -92.2], [29.1, -90.2], [29.2, -89.2], [30.2, -89.6], [30.4, -88.0], [30.2, -86.5], [29.7, -85.0],
    [30.1, -84.0], [29.1, -83.0], [27.8, -82.7], [26.1, -81.7], [25.2, -81.0], [25.3, -80.4], [26.8, -80.0], [29.0, -80.9], [30.7, -81.4], [32.0, -80.9],
    [32.8, -79.9], [33.9, -78.0], [34.7, -76.7], [35.2, -75.5], [36.9, -76.0], [38.0, -75.3], [38.9, -74.9], [40.5, -74.0], [41.1, -71.9], [41.7, -70.0],
    [42.0, -70.6], [42.6, -70.7], [43.6, -70.2], [44.4, -68.3], [44.8, -67.0], [47.1, -67.8], [47.4, -69.2], [46.4, -70.0], [45.3, -71.1], [45.0, -74.7],
    [43.6, -76.5], [43.3, -79.1], [42.3, -81.5], [41.9, -83.1], [42.3, -83.1], [43.0, -82.4], [45.3, -82.5], [46.0, -83.5], [46.5, -84.4], [47.5, -87.5],
    [48.0, -89.5], [48.6, -93.0], [49.0, -95.2], [49.0, -123.0], [48.4, -124.7],
  ],
};
