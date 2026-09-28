/*
 * WeldWorld: welding systems and brand comparison data
 * ------------------------------------------------------------------
 * One entry per 3D system. Each component has:
 *   role    one-line job of the part
 *   what    how it works / what it is
 *   spec    what buyers compare when choosing it
 *   facts   [label, value] pairs
 *   brands  { brandId: { p: product families, e: positioning } }
 *   makers  non-OEM suppliers when the welding brands don't make it
 *   angle   commercial strategy note
 *
 * Product names are drawn from public catalogs as of 2026 and are
 * marked "(verify)" where uncertain. Prices, shares and consumption
 * figures are indicative. Check them against current catalogs and ESAB
 * market intelligence before external use.
 */
window.WELD_SYSTEMS = {
  brands: [
    { id: "esab", name: "ESAB / EWM", note: "ESAB: global equipment + filler metals + gas control (Victor). EWM: German premium MIG/TIG equipment brand in the ESAB group." },
    { id: "lincoln", name: "Lincoln Electric", note: "Largest welding company; fully integrated equipment, consumables and automation." },
    { id: "miller", name: "Miller (ITW Welding)", note: "Miller equipment, Hobart and Elga fillers, Bernard and Tregaskiss guns and torches." },
    { id: "fronius", name: "Fronius", note: "Austrian, privately held; premium equipment and robotics. No major filler business." },
  ],

  systems: [
    {
      id: "cobot_mig",
      name: "MIG cobot cell",
      sum: "A collaborative robot arm that welds with a standard MIG package. The welder teaches the path by hand, then loads parts while the cobot welds.",
      process: "proc_gmaw",
      automation: "auto_cobot",
      facts: [
        ["Best for", "Batches of ~10–1,000 parts, parts up to ~1.5 m"],
        ["Arc-on time", "Manual 20–30% → cobot 40–70%"],
        ["Package price", "~US$50–100k with welding package, table and fixtures (indicative)"],
        ["Typical payback", "~6–18 months (indicative; depends on shifts and labor cost)"],
        ["Programming", "Hand-guiding + tablet app; minutes per new part"],
      ],
      insight: "Cobots bring automation to shops that could never justify a fenced robot cell. The arm is bought in from robot makers, so the welding brand wins on the welding app, out-of-the-box weld quality, service and the consumables that follow for years.",
      components: [
        {
          id: "power", name: "Power source",
          role: "Turns mains electricity into a precisely controlled welding arc.",
          what: "An inverter switches mains power at high frequency and shapes current and voltage thousands of times a second. For a cobot it also needs a digital link to the robot (arc start and stop, job select, wire inch) and synergic programs, where one setting adjusts many parameters together. Pulse and controlled short-circuit waveforms are the main performance differentiators.",
          spec: ["Output 300–500 A at 60–100% duty cycle", "Pulse and advanced short-circuit waveforms", "Robot interface: plug-and-play cobot integration or fieldbus", "Job memory and synergic lines per wire and gas", "Weld data connectivity"],
          facts: [["Typical rating", "350–500 A"], ["Input", "3-phase 400 / 480 V"], ["Share of cell cost", "~15–25% (indicative)"]],
          brands: {
            esab: { p: "ESAB Aristo, Warrior, Rebel; EWM Titan XQ, Phoenix XQ, Taurus XQ", e: "EWM adds premium German arc processes (forceArc, coldArc, rootArc). ESAB brings global scale and consumables." },
            lincoln: { p: "Power Wave S350 / S500, Flextec, POWER MIG", e: "Waveform Control Technology: STT, Rapid X, Pulse-on-Pulse. Deep automation portfolio." },
            miller: { p: "Invision, Deltaweld, Continuum, XMT", e: "RMD and Accu-Pulse processes; Continuum aimed at advanced MIG and automation." },
            fronius: { p: "TPS/i, iWave, TransSteel", e: "CMT (Cold Metal Transfer), PMC and LSC processes. Premium price, strong robotics reputation." },
          },
          angle: "In cobot deals the power source is chosen together with the arm package. Easy integration and the welding app matter more than peak amps.",
        },
        {
          id: "feeder", name: "Wire feeder",
          role: "Pushes wire at a controlled speed from the drum or spool to the torch.",
          what: "A 2- or 4-roll drive with a closed-loop motor feeds wire at 2–20 m/min. On cobots the feeder sits on the cart, on a boom or on the arm's base to keep the cable package short. Drive rolls, liners and conduit must match the wire diameter and type.",
          spec: ["4-roll drive for stable feeding", "Closed-loop wire speed control", "Compact mounting for cobot base, boom or cart", "Quick-change rolls for solid, cored or aluminum wire", "Wire inch and gas purge from the pendant"],
          facts: [["Wire speed", "~1.5–20 m/min"], ["Wire sizes", "0.8–1.6 mm"]],
          brands: {
            esab: { p: "Aristo, Warrior and RobustFeed feeders (ESAB); drive XQ (EWM) (verify)", e: "Rugged enclosed feeders for industrial shops." },
            lincoln: { p: "Power Feed 84, LN-25X, AutoDrive (robotic)", e: "Wide range from portable to robotic." },
            miller: { p: "ArcReach SuitCase, 74 MPa Plus, Continuum and Auto-Continuum feeders", e: "Strong portable feeder franchise." },
            fronius: { p: "WF 25i, WF 30i, WF 60i Robacta Drive", e: "Push-pull and robot feeders tightly integrated with TPS/i." },
          },
          angle: "Feeding problems cause most cobot downtime. Selling feeder, liner and wire packaging as one tested system is a strong argument.",
        },
        {
          id: "wire", name: "Welding wire (drum)",
          role: "The filler metal that becomes the weld, and the biggest recurring spend in the cell.",
          what: "Cobots mostly run 1.0–1.2 mm ER70S-6 solid wire or E70C-6M metal-cored wire. Busy cells switch from 15–18 kg spools to 250–450 kg drums to avoid changeovers. The wire's cast, helix and surface finish decide how smoothly it feeds.",
          spec: ["Classification: AWS A5.18 ER70S-6 or E70C-6M", "Diameter 0.9–1.2 mm", "Packaging: spool vs drum (changeover time)", "Feedability: cast, helix, surface", "Copper-coated vs bare (fume, contact tip life)"],
          facts: [["Consumption", "~2–5 t per cobot per year (see calculator)"], ["Packaging", "15–18 kg spools; 250–450 kg drums"]],
          brands: {
            esab: { p: "OK Autrod 12.51, Coreweld (metal-cored), Marathon Pac drums. EWM is equipment-focused.", e: "Integrated wire and equipment supplier; Marathon Pac is a well-known bulk format." },
            lincoln: { p: "SuperArc L-56, SuperGlide, Metalshield MC-6 (metal-cored), Accu-Trak drums", e: "Consumables giant, especially strong in North America." },
            miller: { p: "Hobart (ITW): HB-28 solid, FabCOR metal-cored; Elga in Europe", e: "ITW sells filler through the Hobart and Elga brands." },
            fronius: { p: "No major filler business. Customers buy wire from ESAB, Lincoln, voestalpine Böhler and others.", e: "Equipment-only, so the consumables pull-through goes to other suppliers." },
          },
          angle: "Wire is the recurring revenue. Every cobot sold with ESAB equipment is a chance to lock in years of wire volume, which equipment-only rivals like Fronius cannot capture.",
        },
        {
          id: "gas", name: "Shielding gas & regulator",
          role: "Protects the molten weld from the air.",
          what: "For steel MIG the usual gas is argon with 10–20% CO2 (90/10, 82/18; \"C25\" in North America) at 12–18 L/min. Cylinders or bulk supply come from gas companies (Linde, Air Liquide/Airgas, Air Products, Messer). Welding brands supply regulators, flowmeters and, increasingly, digital gas-flow monitoring.",
          spec: ["Gas mix matched to wire and transfer mode", "Flow 12–18 L/min", "Digital flow sensor for alarms and weld data", "Bulk or manifold supply for several cells"],
          facts: [["Typical flow", "12–18 L/min"], ["Common mixes", "Ar/CO2 90/10, 82/18; C25 (75/25)"], ["Cylinder marking (EU)", "Bright green shoulder = argon/CO2 mix (EN 1089-3)"]],
          brands: {
            esab: { p: "Victor regulators, flowmeters and gas control equipment", e: "Victor is a leading gas-control brand inside ESAB." },
            lincoln: { p: "Harris Products Group regulators and gas equipment", e: "Owns a full gas-apparatus brand." },
            miller: { p: "Gas-flow monitoring via Insight and Continuum; regulators via partners (verify)", e: "Focus on monitoring rather than gas hardware." },
            fronius: { p: "Digital gas control option for TPS/i (verify)", e: "Integrated sensing in the power source." },
          },
          angle: "Industrial gas companies are also big welding distributors, so they are both a channel partner and a competitor for the customer relationship.",
        },
        {
          id: "cobot", name: "Cobot arm",
          role: "Moves the torch along the programmed path at a steady speed and angle.",
          what: "A 6-axis collaborative arm (payload ~5–16 kg, reach ~0.9–1.8 m) with force sensing, so it can work near people after a risk assessment. The welder teaches points by hand-guiding the torch. Welding brands usually buy the arm from robot makers and package it with their power source, torch, software and a cart or table.",
          spec: ["Reach 1.3–1.8 m for typical parts", "Payload above torch and cable load", "Repeatability ±0.03–0.1 mm", "Hand-guiding and a welding app", "Weaving, touch sensing and seam tracking options"],
          facts: [["Arm makers", "Universal Robots, FANUC CRX, Yaskawa, Doosan, ABB"], ["Safety standards", "ISO 10218, ISO/TS 15066"]],
          brands: {
            esab: { p: "ESAB cobot welding packages; arm partner varies by region (verify)", e: "Pairs ESAB power sources and torches with bought-in arms." },
            lincoln: { p: "Lincoln Electric cobot welding packages, Universal Robots based (verify other arms)", e: "Early mover with packaged cobot cells in North America." },
            miller: { p: "Copilot collaborative welding system (Universal Robots arm)", e: "Strong distributor-led cobot program." },
            fronius: { p: "Cobot welding packages integrating TPS/i with several arm brands (verify)", e: "Premium welding quality on a range of arms." },
          },
          angle: "The arm is a bought-in commodity. Differentiation is the welding app, ease of teaching, weld quality out of the box and service. Integrators and distributors often decide the brand.",
        },
        {
          id: "torch", name: "Cobot MIG torch & cable",
          role: "Delivers wire, current and gas to the arc.",
          what: "A cobot MIG torch has a swan neck, contact tip, gas diffuser and nozzle, fed by a cable package that runs along the arm. Air-cooled torches cover most cobot work up to ~300–400 A; water-cooled torches handle higher duty. Contact tips and nozzles are wear parts that are replaced often.",
          spec: ["Air- vs water-cooled; rated amps at duty cycle", "Neck angle (22° / 45°) for access to the part", "Quick-change neck for fast maintenance", "Contact tip life and cost per tip", "Cable length and routing on the arm"],
          facts: [["Wear parts", "Contact tips, nozzles, diffusers, liners"], ["Tip change", "Every few hours to days of arc time"]],
          brands: {
            esab: { p: "ESAB and Tweco torches and consumables; EWM robot torches", e: "Tweco is a major North American consumables brand." },
            lincoln: { p: "Magnum PRO guns and robotic torches", e: "Strong semi-auto gun franchise." },
            miller: { p: "Tregaskiss TOUGH GUN (robotic) and Bernard (semi-auto) torches and consumables", e: "Tregaskiss is a leading robotic torch brand." },
            fronius: { p: "Robacta robot and cobot torches", e: "Integrated with Fronius feeders and reamers." },
          },
          makers: "Independent torch specialists: Abicor Binzel, TBi Industries",
          angle: "Contact tips and nozzles are a second recurring revenue stream after wire. Owning the torch front-end design locks in the replacement parts.",
        },
        {
          id: "pendant", name: "Teach pendant & weld software",
          role: "Where the operator programs welds and where weld data is collected.",
          what: "A tablet or teach pendant runs the welding app: set points, choose weld jobs, adjust weave and read errors. Connected power sources stream arc data (amps, volts, wire feed, gas) to monitoring software for traceability and productivity reports.",
          spec: ["Easy welding app in the local language", "Job library linked to the welding procedure (WPS)", "Weld data logging and dashboards", "Remote support and updates"],
          facts: [["Data captured", "Current, voltage, wire feed, gas flow, arc time, faults"]],
          brands: {
            esab: { p: "ESAB WeldCloud; EWM Xnet", e: "Fleet-level weld data and consumables tracking." },
            lincoln: { p: "CheckPoint production monitoring", e: "Cloud monitoring across Power Wave fleets." },
            miller: { p: "Insight weld information systems (Insight Core, Centerpoint)", e: "Operator guidance and part tracking." },
            fronius: { p: "WeldCube weld data; WeldConnect app", e: "Detailed data for premium and automotive users." },
          },
          angle: "Software creates switching costs and the data that proves productivity. It supports ROI-based or as-a-service selling.",
        },
        {
          id: "table", name: "Welding table & fixtures",
          role: "Holds and locates parts so every weld lands in the same place.",
          what: "Modular fixture tables (steel plate with a 16 or 28 mm hole grid) let shops clamp new parts quickly, which matters for high-mix cobot work. Two-station setups let the operator load one side while the cobot welds the other.",
          spec: ["Hole system (16 / 28 mm) and flatness", "Clamps, stops and squares", "Two-station layout for load-while-weld", "Nitrided surface that resists spatter"],
          facts: [["Share of cell cost", "~10–15% incl. fixtures (indicative)"]],
          makers: "Fixture-table makers (not the welding brands): Siegmund, Demmeler, Bluco, Strong Hand Tools. Often bundled into cobot cart packages.",
          angle: "Fixturing limits cobot payback more often than the arm does. Bundling a starter fixture kit lowers the customer's barrier to start.",
        },
        {
          id: "part", name: "Workpiece & weld",
          role: "The part being welded. Its joint decides the settings.",
          what: "Example: a 6 mm steel bracket with fillet welds, welded with 1.2 mm ER70S-6 wire and Ar/18% CO2 using pulsed MIG. The cobot holds torch angle and travel speed constant, which gives more consistent welds than manual work.",
          spec: ["Joint type and position", "Part-to-part fit-up variation", "Weld size and appearance requirements", "Inspection plan"],
          facts: [["Joint", "6 mm fillet, horizontal"], ["Wire", "1.2 mm ER70S-6"], ["Gas", "Ar / 18% CO2, 15 L/min"], ["Wire feed speed", "~8–10 m/min"], ["Arc", "~26–28 V, ~240–270 A (pulse synergic)"], ["Travel speed", "~40–50 cm/min"], ["Inspection", "Visual, fillet gauge, periodic macro-etch"]],
          angle: "Consistent parts are the precondition for any automation. Poor fit-up from cutting and bending is the most common reason cobot projects stall.",
        },
        {
          id: "ground", name: "Ground (return) clamp",
          role: "Completes the electrical circuit back to the power source.",
          what: "A poor ground causes an unstable arc, arc blow and damaged fixtures. Cobot tables are usually grounded through a clamp or a fixed terminal on the table.",
          spec: ["Current rating matching the power source", "Solid contact on clean steel", "Cable cross-section 50–95 mm²"],
          facts: [["Cable", "50–95 mm² copper"]],
          angle: "A small part that causes many service calls. Good setup guidance protects the reputation of the whole package.",
        },
        {
          id: "reamer", name: "Nozzle cleaning station",
          role: "Removes spatter from the nozzle and applies anti-spatter.",
          what: "A reamer spins a cutter inside the nozzle between welds and sprays anti-spatter fluid. Standard on robots, and increasingly used on cobots that run long batches.",
          spec: ["Nozzle size compatibility", "Cycle time", "Anti-spatter sprayer", "Wire cutter option for consistent stick-out"],
          facts: [["Cycle", "A few seconds between parts"]],
          brands: {
            esab: { p: "Available through ESAB automation packages (verify)", e: "" },
            lincoln: { p: "Offered with robotic packages (verify)", e: "" },
            miller: { p: "Tregaskiss TOUGH GUN TT4 reamer", e: "Well-established reamer line." },
            fronius: { p: "Robacta Reamer", e: "Matched to Robacta torches." },
          },
          angle: "An add-on that raises uptime and ties the customer to one torch ecosystem.",
        },
        {
          id: "fume", name: "Fume extraction",
          role: "Captures welding fume at the source.",
          what: "Welding fume, including manganese and hexavalent chromium from stainless steel, faces tighter exposure limits. In 2019 the UK HSE reclassified all welding fume as a carcinogen. Options are an on-torch extraction gun, a flexible arm with a hood, or a hood over the whole cell.",
          spec: ["Capture at source (torch or arm)", "Filter class and self-cleaning", "Airflow vs noise", "Automatic start with the arc"],
          facts: [["Driver", "Tighter fume exposure limits (e.g. UK HSE, OSHA manganese)"]],
          brands: {
            esab: { p: "Fume extraction units and extraction torches (verify)", e: "" },
            lincoln: { p: "Statiflex and Mobiflex units; X-Tractor extraction guns (verify)", e: "" },
            miller: { p: "FILTAIR units; Bernard Clean Air extraction guns", e: "" },
            fronius: { p: "Extraction torches (verify)", e: "" },
          },
          makers: "Specialists: Nederman, Kemper, Plymovent",
          angle: "Regulation is turning fume extraction from optional into required. It's a natural cross-sell with every cell.",
        },
        {
          id: "safety", name: "Weld screens & safety",
          role: "Protects people from arc light, spatter and robot motion.",
          what: "Cobots can work without full guarding only after a risk assessment, and a welding torch is a hazard even on a cobot. Most cells use weld curtains or screens, an area scanner or light curtain, and clear PPE rules.",
          spec: ["Risk assessment to ISO 10218 / ISO/TS 15066", "Weld screens (EN ISO 25980)", "Area scanner or light curtain", "E-stop placement"],
          facts: [["Screens", "Tinted transparent PVC curtains or rigid panels"]],
          angle: "Safety questions slow cobot purchases. A pre-assessed standard cell layout speeds up the sale.",
        },
      ],
    },
  ],
};
