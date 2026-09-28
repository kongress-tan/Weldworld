/*
 * WeldWorld: Gemba 3D worlds
 * ------------------------------------------------------------------
 * A small kit of low-poly building blocks (halls, cranes, people,
 * arcs, turning rolls, column & booms, pipe, vehicles...) and one
 * builder per site. Units are metres. Each builder returns camera
 * stops keyed by the stop ids in gemba-data.js:
 *   { outdoor, overview: {t, c}, stops: { id: {t:[x,y,z], c:[x,y,z]} } }
 */
(function () {
  "use strict";

  function createGembaWorld(stage, pinsEl, onPin) {
    const reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    stage.insertBefore(renderer.domElement, pinsEl);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI * 0.495; controls.minDistance = 2; controls.maxDistance = 400;
    const hemi = new THREE.HemisphereLight(0xdfeeff, 0x2a3036, 0.85); scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(40, 80, 50); scene.add(sun);
    const fill = new THREE.DirectionalLight(0x9fbfe0, 0.35); fill.position.set(-50, 30, -40); scene.add(fill);

    // shared arc glow texture
    const gc = document.createElement("canvas"); gc.width = gc.height = 64;
    const g2 = gc.getContext("2d"), gr = g2.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.18, "rgba(210,238,255,.8)"); gr.addColorStop(0.5, "rgba(140,200,255,.18)"); gr.addColorStop(1, "rgba(120,190,255,0)");
    g2.fillStyle = gr; g2.fillRect(0, 0, 64, 64);
    const glowTex = new THREE.CanvasTexture(gc);

    let root = null, arcs = [], spinners = [], env = null, pinEls = [];

    /* ---------------- kit ---------------- */
    function makeKit(G) {
      const cache = new Map();
      const mat = (color, o = {}) => {
        const k = color + JSON.stringify(o);
        if (!cache.has(k)) cache.set(k, new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.75, metalness: 0.15 }, o)));
        return cache.get(k);
      };
      const place = (m, x, y, z, o) => { m.position.set(x, y, z); if (o.ry) m.rotation.y = o.ry; if (o.rx) m.rotation.x = o.rx; if (o.rz) m.rotation.z = o.rz; (o.parent || G).add(m); return m; };
      const K = {
        mat,
        // box with its base at y
        box(w, h, d, x, y, z, color, o = {}) { return place(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), o.m || mat(color, o.mo)), x, y + h / 2, z, o); },
        // cylinder: axis y -> base at y; axis x/z -> centred at y
        cyl(r, h, x, y, z, color, o = {}) {
          const geo = new THREE.CylinderGeometry(o.r2 != null ? o.r2 : r, r, h, o.seg || 20, 1, !!o.open);
          const m = new THREE.Mesh(geo, o.m || mat(color, Object.assign({ side: o.open ? THREE.DoubleSide : THREE.FrontSide }, o.mo)));
          if (o.axis === "x") { m.rotation.z = Math.PI / 2; } else if (o.axis === "z") { m.rotation.x = Math.PI / 2; }
          const yy = o.axis ? y : y + h / 2;
          m.position.set(x, yy, z); (o.parent || G).add(m);
          if (o.ry) { const w = new THREE.Group(); w.position.set(x, 0, z); w.rotation.y = o.ry; (o.parent || G).add(w); m.position.set(0, yy, 0); w.add(m); }
          return m;
        },
        torus(R, r, x, y, z, color, o = {}) { const m = new THREE.Mesh(new THREE.TorusGeometry(R, r, 10, 40), o.m || mat(color, o.mo)); if (o.axis === "x") m.rotation.y = Math.PI / 2; else if (o.axis !== "z") m.rotation.x = Math.PI / 2; return place(m, x, y, z, o); },
        group(x = 0, y = 0, z = 0, ry = 0, parent) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; (parent || G).add(g); return g; },
        ground(w, d, color, x = 0, z = 0, y = 0) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color, { roughness: 1 })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); G.add(m); return m; },
        stripe(x, z, w, d, color = 0xd9a92b) { return K.box(w, 0.02, d, x, 0.005, z, color, { mo: { roughness: 0.9 } }); },
        sign(text, x, y, z, ry = 0, w = 6, o = {}) {
          const c = document.createElement("canvas"); c.width = 512; c.height = 96;
          const g = c.getContext("2d"); g.fillStyle = o.bg || "#10202a"; g.fillRect(0, 0, 512, 96);
          g.fillStyle = o.fg || "#f2a93b"; g.font = "bold 44px 'Barlow Condensed', 'Arial Narrow', sans-serif"; g.textBaseline = "middle";
          g.fillText(text, 20, 50, 472);
          const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
          const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 96 / 512), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }));
          return place(m, x, y, z, { ry });
        },
        // person ~1.75 m. kind: welder | hivis | office | clean | orange
        person(x, z, ry = 0, kind = "hivis", o = {}) {
          const g = K.group(x, o.y || 0, z, ry, o.parent);
          const C = { welder: [0x3b3f45, 0x2c3a4a, 0x22272b], hivis: [0x2f4a6b, 0xf2c230, 0xf4f4f0], orange: [0x2f4a6b, 0xf28a30, 0xf4f4f0], office: [0x2b3440, 0x6e8fb5, null], clean: [0xe9edf0, 0xe9edf0, 0xd8e6f0] }[kind] || [0x333, 0x888, 0xfff];
          const legs = mat(C[0]), torso = mat(C[1]), skin = mat(0xc99a78);
          const kneel = !!o.kneel;
          if (!kneel) { K.box(0.14, 0.85, 0.16, -0.1, 0, 0, 0, { m: legs, parent: g }); K.box(0.14, 0.85, 0.16, 0.1, 0, 0, 0, { m: legs, parent: g }); }
          else { K.box(0.36, 0.42, 0.5, 0, 0, 0.05, 0, { m: legs, parent: g }); }
          const ty = kneel ? 0.42 : 0.85;
          K.box(0.44, 0.6, 0.26, 0, ty, 0, 0, { m: torso, parent: g });
          K.box(0.1, 0.5, 0.12, -0.28, ty + 0.05, 0.08, 0, { m: torso, parent: g, rx: -0.6 });
          K.box(0.1, 0.5, 0.12, 0.28, ty + 0.05, 0.08, 0, { m: torso, parent: g, rx: -0.6 });
          const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), skin); head.position.set(0, ty + 0.76, 0); g.add(head);
          if (kind === "welder") { K.box(0.27, 0.3, 0.2, 0, ty + 0.62, 0.05, 0, { m: mat(0x1b1f22, { roughness: 0.4 }), parent: g }); }
          else if (C[2] != null) { const hat = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(C[2])); hat.position.set(0, ty + 0.8, 0); g.add(hat); }
          return g;
        },
        // welding arc: glowing sprite (+ optional point light)
        arc(x, y, z, o = {}) {
          const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: o.color || 0xcfeaff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
          const size = o.size || 0.9; s.scale.setScalar(size); s.position.set(x, y, z); G.add(s);
          let light = null;
          if (o.light !== false && arcs.filter((a) => a.light).length < 6) { light = new THREE.PointLight(o.color || 0x9fd8ff, 0, o.range || 9, 2); light.position.set(x, y + 0.3, z); G.add(light); }
          arcs.push({ s, light, size, phase: Math.random() * 10, on: o.duty || 0.8 });
          return s;
        },
        spin(obj, axis, speed) { spinners.push({ obj, axis, speed }); },
        // open-front industrial hall; long axis along x
        hall(x, z, w, d, h, o = {}) {
          const steel = mat(o.frame || 0x46525c, { metalness: 0.4 });
          K.box(w, 0.1, d, x, -0.1, z, o.floor || 0x5b646b, { mo: { roughness: 0.95 } });
          const bays = Math.max(2, Math.round(w / (o.bay || 10)));
          for (let i = 0; i <= bays; i++) {
            const xx = x - w / 2 + (w / bays) * i;
            K.box(0.5, h, 0.5, xx, 0, z - d / 2, 0, { m: steel });
            K.box(0.5, h, 0.5, xx, 0, z + d / 2, 0, { m: steel });
            K.box(0.3, 0.8, d, xx, h, z, 0, { m: steel }); // roof truss
          }
          K.box(w, 0.35, 0.35, x, h - 2.2, z - d / 2 + 0.4, 0, { m: steel }); // crane rails
          K.box(w, 0.35, 0.35, x, h - 2.2, z + d / 2 - 0.4, 0, { m: steel });
          K.box(w, 0.3, 0.3, x, h + 0.8, z - d / 2, 0, { m: steel });
          K.box(w, 0.3, 0.3, x, h + 0.8, z + d / 2, 0, { m: steel });
          const wall = mat(o.wall || 0x2b363e, { transparent: true, opacity: 0.85, side: THREE.DoubleSide });
          if (o.backWall !== false) K.box(w, h, 0.15, x, 0, z - d / 2 - 0.3, 0, { m: wall });
          if (o.endWall) K.box(0.15, h, d, x - w / 2 - 0.3, 0, z, 0, { m: wall });
          return { x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, h };
        },
        bridgeCrane(x, z, d, h, color = 0xe0a526) {
          const c = mat(color, { metalness: 0.3 });
          K.box(0.9, 1.1, d - 1, x, h - 2.0, z, 0, { m: c });
          K.box(1.6, 0.8, 1.6, x, h - 2.8, z + 1, 0, { m: mat(0x3a444c) });
          K.cyl(0.03, 3.5, x, h - 6.3, z + 1, 0x222222);
          K.box(0.8, 0.25, 0.5, x, h - 6.6, z + 1, 0x333a40);
        },
        plates(x, z, w, d, n, color = 0x6b5a4c) { for (let i = 0; i < n; i++) K.box(w, 0.12, d, x + (i % 2) * 0.08, i * 0.13, z, color, { mo: { metalness: 0.5, roughness: 0.6 } }); },
        rollStand(x, z, dz = 1.5) {
          const base = mat(0x2e5f8a, { metalness: 0.3 });
          K.box(0.8, 0.4, dz * 2 + 0.8, x, 0, z, 0, { m: base });
          [-dz, dz].forEach((s) => K.cyl(0.32, 0.35, x, 0.55, z + s, 0x1d2226, { axis: "x" }));
        },
        can(x, y, z, r, len, color = 0x5f6c75) {
          const m = K.cyl(r, len, x, y, z, color, { axis: "x", open: true, seg: 40, mo: { metalness: 0.55, roughness: 0.5 } });
          return m;
        },
        columnBoom(x, z, ry, h, boomLen) {
          const g = K.group(x, 0, z, ry);
          const c = mat(0x2c6fa3, { metalness: 0.35 }), dk = mat(0x2a3137, { metalness: 0.4 });
          K.box(1.6, 0.4, 1.6, 0, 0, 0, 0, { m: dk, parent: g });
          K.box(0.7, h, 0.7, 0, 0.4, 0, 0, { m: c, parent: g });
          K.box(boomLen, 0.55, 0.55, boomLen / 2 - 0.4, h - 1.0, 0, 0, { m: c, parent: g });
          K.box(0.4, 1.1, 0.4, boomLen - 0.6, h - 2.1, 0, 0, { m: dk, parent: g }); // head
          K.cyl(0.35, 0.6, boomLen - 0.6, h - 0.45, 0, 0xd9a92b, { parent: g, r2: 0.28 }); // flux hopper
          K.cyl(0.4, 0.3, -0.8, h - 1.4, 0, 0x8a6a44, { parent: g, axis: "z" }); // wire coil
          g.updateMatrixWorld(true);
          return g.localToWorld(new THREE.Vector3(boomLen - 0.6, h - 2.2, 0));
        },
        powerSource(x, z, ry = 0, color = 0x33414b) { const g = K.group(x, 0, z, ry); K.box(0.5, 0.75, 0.8, 0, 0, 0, color, { parent: g, mo: { metalness: 0.4 } }); K.box(0.02, 0.14, 0.24, 0.26, 0.5, 0, 0x58c4f5, { parent: g, mo: { emissive: 0x1d5c7a } }); return g; },
        cylinderGas(x, z) { K.cyl(0.11, 1.35, x, 0, z, 0x5b6770, { mo: { metalness: 0.5 } }); K.cyl(0.11, 0.12, x, 1.35, z, 0x42c86a); },
        engineDrive(x, z, ry = 0, color = 0xb33a2a) { const g = K.group(x, 0, z, ry); K.box(1.3, 0.9, 0.7, 0, 0, 0, color, { parent: g, mo: { metalness: 0.3 } }); K.cyl(0.05, 0.4, 0.4, 0.9, 0.15, 0x222222, { parent: g }); return g; },
        truck(x, z, ry = 0, o = {}) {
          const g = K.group(x, 0, z, ry);
          K.box(2.4, 2.6, 2.5, 0, 0.5, 0, o.cab || 0xd8dde0, { parent: g });
          K.box(o.bed || 12, 0.3, 2.5, -(o.bed || 12) / 2 - 1.3, 1.0, 0, 0x2a3036, { parent: g });
          [[0.3], [-4], [-(o.bed || 12) + 1.5]].forEach(([px]) => { K.cyl(0.5, 2.3, px, 0.5, 0, 0x151515, { parent: g, axis: "z" }); });
          return g;
        },
        pickup(x, z, ry = 0, color = 0xeeeeee) { const g = K.group(x, 0, z, ry); K.box(5.2, 0.9, 1.9, 0, 0.45, 0, color, { parent: g }); K.box(2, 0.8, 1.8, 1.2, 1.35, 0, color, { parent: g }); K.box(1.2, 0.8, 0.9, -1.4, 1.35, 0, 0xb33a2a, { parent: g }); [1.8, -1.6].forEach((px) => K.cyl(0.42, 2.0, px, 0.42, 0, 0x151515, { parent: g, axis: "z" })); return g; },
        forklift(x, z, ry = 0) { const g = K.group(x, 0, z, ry); K.box(2.2, 1.1, 1.2, 0, 0.2, 0, 0xf2a93b, { parent: g }); K.box(0.9, 1.2, 1.1, -0.5, 1.3, 0, 0x222a30, { parent: g, mo: { transparent: true, opacity: 0.6 } }); K.box(0.15, 2.6, 1.0, 1.2, 0, 0, 0x2a2f33, { parent: g }); K.box(1.1, 0.06, 0.9, 1.8, 0.15, 0, 0x2a2f33, { parent: g }); return g; },
        sideboom(x, z, ry = 0, reach = 5) {
          const g = K.group(x, 0, z, ry), y = mat(0xe8b21e, { metalness: 0.2 });
          K.box(4.2, 0.8, 3.0, 0, 0, 0, 0x222222, { parent: g });
          K.box(3.2, 1.6, 2.4, -0.2, 0.8, 0, 0, { m: y, parent: g });
          K.box(1.3, 1.2, 1.3, -0.6, 2.4, -0.3, 0, { m: y, parent: g });
          const boom = K.box(0.35, 0.35, reach + 2, 0, 0, 0, 0, { m: y, parent: g }); boom.position.set(0, 2.6, (reach + 2) / 2 * 0.72 + 1.2); boom.rotation.x = -0.75;
          return g;
        },
        tent(x, z, ry = 0, color = 0xd9d2b3) { const g = K.group(x, 0, z, ry); const m = mat(color, { side: THREE.DoubleSide, transparent: true, opacity: 0.92 }); K.box(3.4, 2.6, 0.08, 0, 0, -1.6, 0, { m, parent: g }); K.box(0.08, 2.6, 3.2, -1.7, 0, 0, 0, { m, parent: g }); K.box(0.08, 2.6, 3.2, 1.7, 0, 0, 0, { m, parent: g }); K.box(3.5, 0.08, 3.3, 0, 2.6, 0, 0, { m, parent: g }); return g; },
        booth(x, z, ry = 0) {
          const g = K.group(x, 0, z, ry), cur = mat(0xc4442a, { transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });
          K.box(3.2, 2.0, 0.05, 0, 0, -1.6, 0, { m: cur, parent: g }); K.box(0.05, 2.0, 3.2, -1.6, 0, 0, 0, { m: cur, parent: g }); K.box(0.05, 2.0, 3.2, 1.6, 0, 0, 0, { m: cur, parent: g });
          K.box(1.4, 0.85, 0.8, 0, 0, -0.6, 0x4b555c, { parent: g, mo: { metalness: 0.5 } });
          K.box(0.6, 0.12, 0.4, 0.1, 0.85, -0.6, 0x7b8791, { parent: g });
          K.person(0.1, 0.25, Math.PI, "welder", { parent: g });
          const ps = K.group(-1.1, 0, 0.6, 0, g); K.box(0.45, 0.7, 0.7, 0, 0, 0, 0x33414b, { parent: ps }); K.box(0.3, 0.25, 0.45, 0, 0.7, 0, 0x39474f, { parent: ps });
          K.cyl(0.1, 1.3, -1.35, 0, 1.1, 0x5b6770, { parent: g }); K.cyl(0.1, 0.1, -1.35, 1.3, 1.1, 0x42c86a, { parent: g });
          // fume arm
          K.cyl(0.07, 1.8, 1.3, 0, -1.3, 0x9aa6ae, { parent: g }); K.box(0.12, 0.12, 1.2, 1.3, 1.8, -0.8, 0x9aa6ae, { parent: g }); K.cyl(0.25, 0.25, 1.3, 1.45, -0.25, 0x9aa6ae, { parent: g, r2: 0.1 });
          g.updateMatrixWorld(true);
          const p = g.localToWorld(new THREE.Vector3(0.1, 0.98, -0.55)); K.arc(p.x, p.y, p.z, { size: 0.6, range: 5 });
          return g;
        },
        cobotCell(x, z, ry = 0) {
          const g = K.group(x, 0, z, ry), white = mat(0xdfe4e8, { roughness: 0.35 }), cap = mat(0x4f86a8);
          K.box(2.4, 0.05, 1.2, 0, 0.85, 0, 0x59636b, { parent: g, mo: { metalness: 0.4 } });
          [[-1.1, -0.5], [1.1, -0.5], [-1.1, 0.5], [1.1, 0.5]].forEach(([a, b]) => K.box(0.08, 0.85, 0.08, a, 0, b, 0x3b454d, { parent: g }));
          K.box(0.05, 0.4, 1.2, 0, 0.9, 0, 0xc4442a, { parent: g, mo: { transparent: true, opacity: 0.5 } }); // centre divider screen
          K.cyl(0.09, 0.25, 0, 0.9, -0.45, 0, { m: white, parent: g });
          const up = K.box(0.1, 0.7, 0.1, 0, 1.1, -0.3, 0, { m: white, parent: g }); up.rotation.x = 0.5;
          const fo = K.box(0.08, 0.6, 0.08, 0.35, 1.45, -0.05, 0, { m: white, parent: g }); fo.rotation.z = 1.2;
          K.box(0.14, 0.14, 0.14, 0, 1.63, -0.2, 0, { m: cap, parent: g });
          K.box(0.3, 0.1, 0.25, 0.7, 0.9, 0.1, 0x7b8791, { parent: g });
          K.box(0.3, 0.1, 0.25, -0.7, 0.9, 0.1, 0x7b8791, { parent: g });
          K.person(-0.8, 0.95, Math.PI, "hivis", { parent: g });
          K.cyl(0.3, 0.8, 1.6, 0, -0.4, 0x8a6a44, { parent: g, seg: 8 });
          g.updateMatrixWorld(true);
          const p = g.localToWorld(new THREE.Vector3(0.68, 1.02, 0.1)); K.arc(p.x, p.y, p.z, { size: 0.5, range: 4 });
          return g;
        },
        gantry(x, z, span, h, len, color = 0x2c6fa3) {
          const c = mat(color, { metalness: 0.35 });
          K.box(0.6, h, 0.6, x, 0, z - span / 2, 0, { m: c }); K.box(0.6, h, 0.6, x, 0, z + span / 2, 0, { m: c });
          K.box(len, 0.9, span + 0.6, x, h, z, 0, { m: c });
        },
        rack(x, z, len, ry = 0, color = 0x2c6fa3) { const g = K.group(x, 0, z, ry); for (let i = 0; i <= len; i += 3) { K.box(0.2, 3.5, 0.2, i - len / 2, 0, -0.6, color, { parent: g }); K.box(0.2, 3.5, 0.2, i - len / 2, 0, 0.6, color, { parent: g }); } [1.2, 2.4, 3.4].forEach((y) => K.box(len, 0.12, 1.4, 0, y, 0, color, { parent: g })); return g; },
      };
      return K;
    }

    /* ---------------- site builders ---------------- */
    const BUILD = {
      wind(K) {
        K.ground(400, 400, 0x1d262c);
        const H = K.hall(0, 0, 124, 34, 18, { bay: 12, floor: 0x59616a });
        K.stripe(0, 7, 124, 0.15); K.stripe(0, -5.5, 124, 0.15);
        K.bridgeCrane(-46, 0, 34, 18); K.bridgeCrane(18, 0, 34, 18);
        K.sign("1  PLATE & CUTTING", -56, 12, -16.6, 0, 9); K.sign("2  ROLLING", -30, 12, -16.6, 0, 7); K.sign("3  LONG SEAM", -12, 12, -16.6, 0, 7);
        K.sign("4  CIRC SEAMS", 16, 12, -16.6, 0, 8); K.sign("5  FLANGES", 44, 12, -16.6, 0, 7); K.sign("6  NDT  ·  7  PAINT", 38, 12, -16.6, 0, 9);
        // 1 plate yard + cutting
        K.plates(-56, -9, 12, 3, 8); K.plates(-56, -3, 12, 3, 5); K.plates(-56, 3, 12, 3, 6, 0x5d534a);
        K.box(14, 0.4, 5, -44, 0, 3, 0x2e3a42); // cutting table
        K.box(0.4, 1.6, 6, -47, 0.4, 3, 0x2c6fa3); K.box(0.4, 1.6, 6, -41, 0.4, 3, 0x2c6fa3); K.box(6.4, 0.5, 0.6, -44, 2.0, 3, 0x2c6fa3);
        K.box(10, 0.1, 3.4, -44, 0.4, 3, 0x6b5a4c);
        K.arc(-45, 0.6, 3, { color: 0xffd9a0, size: 1.4 }); K.person(-44, 7, 0, "hivis");
        // 2 rolling
        K.box(7, 1.6, 4, -30, 0, 0, 0x2c6fa3); [-1.1, 0, 1.1].forEach((dx, i) => K.cyl(0.45, 4.6, -30 + dx, 1.9 + (i === 1 ? -0.5 : 0), 0, 0x9aa6ae, { axis: "z", mo: { metalness: 0.7 } }));
        K.cyl(2.2, 3.4, -30, 4.2, 0, 0x5f6c75, { axis: "z", open: true, seg: 40, mo: { metalness: 0.55 } });
        K.person(-26, 3.5, -0.8, "welder"); K.arc(-27.9, 4.4, 1.6, { size: 0.5, light: false });
        // 3 long seam: can on stands + column & boom entering along x
        K.rollStand(-11, 0); K.rollStand(-8, 0);
        const ls = K.can(-9.5, 2.9, 0, 2.2, 3.6);
        const tip = K.columnBoom(-18, 0, 0, 5.2, 10.5);
        K.arc(tip.x, tip.y - 0.1, 0, { size: 0.8 });
        K.person(-19.5, 2, 0.3, "hivis"); K.person(-7, 3.4, -0.5, "hivis");
        // 4 circ seams: section of cans on stands, 2 column & booms from -z side
        const sec = K.group(18, 2.9, 0);
        for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 3.55, 40, 1, true), K.mat(i % 2 ? 0x5a6771 : 0x62707a, { metalness: 0.55, roughness: 0.5, side: THREE.DoubleSide })); m.rotation.z = Math.PI / 2; m.position.set(-9 + i * 3.6 + 1.8, 0, 0); sec.add(m); }
        K.spin(sec, "x", 0.06);
        [9.5, 15, 21, 26.5].forEach((x) => K.rollStand(x, 0));
        [16.2, 23.4].forEach((x) => { const t = K.columnBoom(x, -6.6, -Math.PI / 2, 7.2, 7.3); K.arc(t.x, 5.2, t.z, { size: 0.9 }); });
        K.person(12, 4.5, 0.2, "hivis"); K.person(24, -3.5, 2.6, "hivis");
        // 5 flange: short section with flange ring
        K.rollStand(41, 0); K.rollStand(45, 0);
        K.can(43, 2.9, 0, 2.2, 5.5); K.torus(2.25, 0.18, 45.8, 2.9, 0, 0x7d8a93, { axis: "x", mo: { metalness: 0.7 } });
        K.box(2, 2.2, 2, 48.5, 0, 3, 0x33414b); K.person(47.4, 3.2, -1.4, "welder", { y: 2.2 }); K.arc(46, 4.8, 1.6, { size: 0.6 });
        // 6 NDT lane at z = -11
        K.rollStand(27, -11); K.rollStand(33, -11); K.can(30, 2.9, -11, 2.2, 9, 0x6d7a82);
        K.box(0.5, 0.3, 0.4, 30.3, 5.1, -11, 0xf2a93b); K.person(31.2, -11, 0, "hivis", { y: 4.9, kneel: true });
        K.box(0.9, 1.0, 0.6, 30, 0, -7.2, 0x2a3036); K.box(0.6, 0.4, 0.05, 30, 1.1, -7.2, 0x58c4f5, { mo: { emissive: 0x1d5c7a } }); K.person(29, -6.6, 2.8, "hivis");
        // 7 paint booth
        K.box(14, 8, 9, 52, 0, -11, 0, { m: K.mat(0x44525c, { transparent: true, opacity: 0.35, depthWrite: false }) });
        K.rollStand(49, -11); K.rollStand(55, -11); K.can(52, 2.9, -11, 2.2, 9, 0x3f6b8c);
        K.truck(58, 11, Math.PI, { bed: 16 });
        K.forklift(-36, 9, 0.4);
        return {
          overview: { t: [0, 2, 0], c: [-55, 55, 80] },
          stops: {
            plate: { t: [-47, 1, 0], c: [-34, 12, 22] },
            roll: { t: [-30, 2.5, 0], c: [-21, 8, 15] },
            longseam: { t: [-11, 2.8, 0], c: [-3, 8, 13] },
            circ: { t: [18, 3, 0], c: [24, 12, 22] },
            flange: { t: [45, 3, 0], c: [53, 8, 12] },
            ndt: { t: [30, 4, -11], c: [37, 11, 4] },
            paint: { t: [52, 3, -11], c: [60, 11, 6] },
          },
        };
      },

      dc(K) {
        K.ground(500, 500, 0x6a6150); // dirt
        K.box(260, 0.05, 8, 0, 0, 20, 0x3a3d40); K.box(8, 0.05, 140, -8, 0, 50, 0x3a3d40); // roads
        // Hall 1: finished shell, cutaway to show white space
        const hx = -42, hz = -30;
        K.box(50, 0.3, 30, hx, 0, hz, 0xb9bec2);
        K.box(50, 8, 0.4, hx, 0, hz - 15, 0x8d959b); K.box(0.4, 8, 30, hx - 25, 0, hz, 0x8d959b);
        K.box(0.4, 3, 30, hx + 25, 0, hz, 0x8d959b, { mo: { transparent: true, opacity: 0.4 } });
        K.sign("DATA HALL 1 (LIVE)", hx - 10, 9, hz - 14.6, 0, 12, { bg: "#16303c", fg: "#58c4f5" });
        for (let r = 0; r < 6; r++) for (let i = 0; i < 9; i++) K.box(0.6, 2.2, 1.1, hx - 18 + i * 4.3, 0.3, hz - 9 + r * 3.4, 0x1c2227);
        for (let r = 0; r < 6; r++) K.cyl(0.12, 40, hx, 3.1, hz - 9 + r * 3.4 + 0.9, 0xc9d1d6, { axis: "x", mo: { metalness: 0.8, roughness: 0.25 } });
        [[-60, -40], [-24, -40], [-60, -20], [-24, -20]].forEach(([x, z]) => K.box(1.2, 2.0, 2.4, x, 0.3, z, 0x5f7f96));
        K.cyl(0.06, 1.2, hx - 3, 2.3, hz - 5.1, 0x333333); K.person(hx - 3.6, hz - 4.3, 0, "hivis"); K.arc(hx - 3, 3.0, hz - 5.2, { size: 0.5, color: 0xd8f0ff });
        K.person(hx - 1.5, hz - 3.2, -0.6, "orange"); K.cyl(0.12, 0.55, hx - 1.1, 0, hz - 3.4, 0xc0392b);
        // Hall 2: steel frame under construction
        const fx = 32, fz = -30, steel = K.mat(0x8a4b2a, { metalness: 0.4 });
        for (let i = 0; i <= 5; i++) for (let j = 0; j <= 3; j++) K.box(0.5, 14, 0.5, fx - 25 + i * 10, 0, fz - 15 + j * 10, 0, { m: steel });
        [7, 14].forEach((y) => { for (let i = 0; i <= 5; i++) K.box(0.4, 0.7, 30, fx - 25 + i * 10, y - 0.7, fz, 0, { m: steel }); for (let j = 0; j <= 3; j++) K.box(50, 0.7, 0.4, fx, y - 0.7, fz - 15 + j * 10, 0, { m: steel }); });
        K.box(50, 0.25, 30, fx, 6.3, fz - 0, 0x9aa1a6, { mo: { transparent: true, opacity: 0.35 } });
        // crawler crane
        const cc = K.group(fx + 32, 0, fz + 4); K.box(8, 1.2, 6, 0, 0, 0, 0x222222, { parent: cc }); K.box(6, 3, 4, 0, 1.2, 0, 0xd33b2c, { parent: cc });
        const boom = K.box(0.9, 44, 0.9, 0, 0, 0, 0xd33b2c, { parent: cc }); boom.position.set(-8, 22, 0); boom.rotation.z = 0.4;
        // boom lift + welders at splice
        K.box(2.4, 1.0, 1.2, fx - 15, 0, fz + 15.8, 0xf2a93b); K.box(0.6, 11.5, 0.6, fx - 15, 1, fz + 15.8, 0x9aa1a6); K.box(2.2, 0.15, 1.4, fx - 15, 12.4, fz + 15.8, 0xf2a93b);
        K.person(fx - 15.3, fz + 15.9, Math.PI, "welder", { y: 12.55 }); K.arc(fx - 15, 13.6, fz + 15.2, { size: 0.7 });
        K.engineDrive(fx - 12, fz + 19, 0.3); K.person(fx - 10, fz + 18, -0.4, "hivis");
        // central plant: chillers + headers
        const px = -40, pz = 14;
        for (let i = 0; i < 4; i++) { K.box(10, 2.6, 3, px - 15 + i * 0.1, 0, pz - 7 + i * 4.2, 0x9aa6ae); for (let f = 0; f < 4; f++) K.cyl(0.9, 0.3, px - 19 + f * 2.6, 2.6, pz - 7 + i * 4.2, 0x2a3036); }
        K.cyl(0.6, 36, px + 2, 1.4, pz - 2, 0x2a5f8a, { axis: "x", mo: { metalness: 0.5 } }); K.cyl(0.6, 36, px + 2, 1.4, pz + 1.6, 0x2a5f8a, { axis: "x", mo: { metalness: 0.5 } });
        for (let i = 0; i < 7; i++) K.box(0.3, 0.8, 5, px - 14 + i * 5.5, 0, pz, 0x555e66);
        K.torus(0.62, 0.05, px + 6, 1.4, pz + 1.6, 0x444444, { axis: "x" });
        K.person(px + 6, pz + 2.9, Math.PI, "welder", { kneel: true }); K.arc(px + 6, 1.2, pz + 2.25, { size: 0.6 });
        K.engineDrive(px + 9, pz + 5, 0); K.sign("CENTRAL PLANT", px - 6, 4, pz - 10, 0, 7);
        // QA / hydro test
        K.box(1.6, 1.0, 1.0, px + 14, 0, pz + 4, 0x2c6fa3); K.cyl(0.05, 1.2, px + 14, 1.0, pz + 4, 0x333333); K.person(px + 15.5, pz + 4.5, -1, "hivis"); K.person(px + 12.6, pz + 5.2, 0.5, "office");
        // generator yard
        for (let i = 0; i < 6; i++) { K.box(12, 3.2, 3, 44, 0, 28 + i * 4.4, 0x3d4a3f); K.cyl(0.25, 1.2, 40, 3.2, 28 + i * 4.4, 0x333333); }
        K.cyl(1.4, 8, 60, 1.4, 34, 0xc6cbce, { axis: "x" }); K.box(4, 3.5, 3, 62, 0, 44, 0x5b6770); K.box(4, 3.5, 3, 62, 0, 50, 0x5b6770);
        K.sign("GENERATOR YARD", 44, 5, 24, 0, 8);
        // laydown yard
        for (let i = 0; i < 5; i++) K.box(14, 0.5, 0.4, 10, i * 0.5, 34 + i * 0.02, 0x8a4b2a);
        for (let i = 0; i < 4; i++) K.box(12, 0.5, 0.4, 10, i * 0.5, 38, 0x8a4b2a);
        for (let i = 0; i < 5; i++) K.cyl(0.35, 8, 10, 0.4 + (i % 2) * 0.6, 43 + i * 0.75, 0x2a5f8a, { axis: "x" });
        K.truck(22, 20, 0, { bed: 14 });
        // off-site prefab shop (separate zone)
        const sx = -10, sz = 96;
        K.box(70, 0.05, 50, sx, 0, sz, 0x2a2f33);
        K.sign("OFF-SITE PREFAB SHOP (typically 10–100 km away)", sx - 6, 12, sz - 17.2, 0, 22, { bg: "#16303c", fg: "#f2a93b" });
        K.hall(sx, sz, 44, 30, 11, { bay: 11, floor: 0x5b646b });
        for (let i = 0; i < 3; i++) { const x = sx - 16 + i * 7; K.box(1.2, 1.2, 1.2, x - 2.2, 0, sz - 7, 0x2c6fa3); K.cyl(0.4, 5, x + 0.5, 1.0, sz - 7, 0x3d6f94, { axis: "x" }); K.box(0.5, 0.9, 0.8, x + 3, 0, sz - 7, 0x2c6fa3); K.person(x + 0.5, sz - 5.6, Math.PI, "welder"); K.arc(x + 0.5, 1.3, sz - 6.6, { size: 0.6 }); }
        K.box(3, 0.9, 1.4, sx + 6, 0, sz - 7, 0x4b555c); K.cyl(0.08, 2.6, sx + 6, 1.0, sz - 7, 0xc9d1d6, { axis: "x" }); K.box(0.4, 0.4, 0.4, sx + 6, 1.0, sz - 7.2, 0x2f3a42); K.person(sx + 6, sz - 5.8, Math.PI, "hivis"); K.box(0.6, 0.9, 0.5, sx + 8.2, 0, sz - 6, 0x33414b);
        K.cobotCell(sx + 14, sz - 6, 0);
        K.box(8, 2.2, 3, sx - 8, 0, sz + 6, 0x3f6b8c); for (let i = 0; i < 3; i++) K.cyl(0.35, 7, sx - 8, 2.6 + i * 0.1, sz + 5 + i * 0.9, 0x9aa6ae, { axis: "x" });
        K.box(1.0, 1.1, 0.8, sx + 3, 0, sz + 6, 0x2a3036); K.person(sx + 4, sz + 6.8, 2.5, "office");
        K.truck(sx + 30, sz + 22, Math.PI, { bed: 14 }); K.box(7, 2.2, 2.4, sx + 22, 1.3, sz + 22, 0x3f6b8c);
        K.forklift(sx + 16, sz + 10, 1.2);
        return {
          outdoor: true,
          overview: { t: [0, 0, 20], c: [-95, 95, 150] },
          stops: {
            overview: { t: [10, 1, 36], c: [-20, 28, 78] },
            steel: { t: [fx - 15, 10, fz + 15], c: [fx + 4, 18, fz + 38] },
            plant: { t: [px + 2, 1.5, pz], c: [px + 16, 10, pz + 22] },
            hall: { t: [hx - 3, 2, hz - 5], c: [hx + 14, 16, hz + 16] },
            power: { t: [48, 2, 38], c: [78, 18, 64] },
            prefab: { t: [sx + 2, 1.5, sz - 4], c: [sx + 14, 17, sz + 26] },
            qa: { t: [px + 14, 1, pz + 4], c: [px + 22, 6, pz + 14] },
          },
        };
      },

      jobshop(K) {
        K.ground(300, 300, 0x1d262c);
        K.hall(0, 0, 64, 30, 9, { bay: 8, floor: 0x60676d, endWall: true });
        K.stripe(0, 2.5, 64, 0.12); K.stripe(0, -1.2, 64, 0.12);
        // office (glass box)
        K.box(8, 3, 7, -27, 0, -10, 0, { m: K.mat(0x9fc6dd, { transparent: true, opacity: 0.22, depthWrite: false }) });
        K.box(2.4, 0.75, 1.0, -28, 0, -10.5, 0x8a6a44); K.box(0.8, 0.5, 0.05, -28, 0.75, -11, 0x58c4f5, { mo: { emissive: 0x1d5c7a } }); K.person(-28, -9.6, Math.PI, "office"); K.person(-25.5, -8.5, -2.2, "office");
        K.box(3, 1.6, 0.05, -27, 1.0, -13.3, 0xf4f4f0); K.sign("OFFICE & QUOTING", -27, 3.6, -6.4, 0, 5);
        // cutting: fiber laser + plasma table
        K.box(9, 2.2, 3.4, -16, 0, -10, 0xe8e8e4); K.box(5, 0.9, 0.05, -16, 1.0, -8.28, 0x2a3036, { mo: { transparent: true, opacity: 0.7 } });
        K.box(6, 0.8, 3, -16, 0, -3.5, 0x2e3a42); K.box(0.3, 1.2, 3.4, -18, 0.8, -3.5, 0x2c6fa3); K.box(0.3, 0.4, 3.4, -18, 2.0, -3.5, 0x2c6fa3);
        K.arc(-18, 0.95, -3.2, { color: 0xffd9a0, size: 0.8 }); K.person(-14, -1.2, Math.PI, "hivis");
        K.sign("CUTTING", -16, 4, -12.2, 0, 4);
        // press brake
        K.box(4.4, 2.8, 1.2, -6, 0, -10, 0x2c6fa3); K.box(4.2, 0.3, 0.3, -6, 1.0, -9.3, 0x9aa6ae); K.person(-6, -8.4, Math.PI, "hivis"); K.sign("FORMING", -6, 4, -12.2, 0, 4);
        // fit-up tables
        [0, 4].forEach((dx) => { K.box(2.4, 0.9, 1.2, 1.5 + dx, 0, -9.5, 0x59636b, { mo: { metalness: 0.4 } }); K.box(0.8, 0.15, 0.6, 1.5 + dx, 0.9, -9.5, 0x7b8791); });
        K.person(1.5, -8.2, Math.PI, "welder"); K.arc(1.5, 1.1, -9.3, { size: 0.45, light: false }); K.sign("FIT-UP", 3.5, 4, -12.2, 0, 4);
        // manual MIG bays
        for (let i = 0; i < 4; i++) K.booth(12 + i * 3.6, -10.5, 0);
        K.sign("MIG BAYS", 17.4, 4, -12.2, 0, 5);
        // cobot cell
        K.cobotCell(15, 7, Math.PI); K.sign("COBOT CELL", 15, 3.2, 9.2, Math.PI, 4);
        // finish, QC, paint, shipping
        K.box(1.8, 0.9, 1.0, 26, 0, -9, 0x4b555c); K.person(26, -8, Math.PI, "hivis"); K.arc(26.3, 1.0, -9, { color: 0xffc070, size: 0.4, light: false });
        K.box(7, 3.5, 4, 27.5, 0, 6, 0, { m: K.mat(0x3f6b8c, { transparent: true, opacity: 0.5, depthWrite: false }) });
        for (let i = 0; i < 3; i++) K.box(1.2, 0.8, 1.0, 22 + i * 1.6, 0, 11, 0x8a6a44);
        K.sign("FINISH & SHIP", 27, 4, -12.2, 0, 5);
        // stock racks + forklift
        K.rack(-20, 10, 12, 0); K.forklift(-8, 5, 0.3);
        K.box(3, 0.3, 1.2, 4, 0, 7, 0x6b5a4c); K.box(3, 0.3, 1.2, 4, 0.3, 7.1, 0x6b5a4c);
        return {
          overview: { t: [0, 1, 0], c: [-34, 30, 40] },
          stops: {
            office: { t: [-27, 1.2, -10], c: [-22, 6, 0] },
            cut: { t: [-16, 1, -6], c: [-9, 7, 6] },
            bend: { t: [-6, 1.5, -9.5], c: [-2, 5, -1] },
            fit: { t: [3.5, 1, -9.5], c: [5, 5, -2] },
            manual: { t: [17.4, 1.2, -10.5], c: [18, 6, 0] },
            cobot: { t: [15, 1.2, 7], c: [21, 5, 1.5] },
            finish: { t: [26, 1.5, 3], c: [18, 7, 14] },
          },
        };
      },

      pipeline(K) {
        K.ground(700, 400, 0x5f6b45); // grass
        K.box(260, 0.02, 22, 0, 0, 2, 0x7a6848); // right-of-way (graded dirt)
        K.box(200, 0.05, 2.2, 10, -0.02, -2, 0x2c2419); // trench (dark strip)
        K.box(200, 1.6, 4, 10, 0, -6.5, 0x6d5a3c); // spoil pile
        const pipeC = 0x3f5a4a, jl = 12.2;
        // strung pipe (not yet welded) on skids
        for (let i = 0; i < 5; i++) { const x = -96 + i * 13; K.cyl(0.6, jl, x, 0.9, 3.5, pipeC, { axis: "x", mo: { metalness: 0.4 } }); K.box(0.3, 0.3, 1.4, x - 4, 0, 3.5, 0x8a6a44); K.box(0.3, 0.3, 1.4, x + 4, 0, 3.5, 0x8a6a44); }
        K.truck(-86, 12, Math.PI, { bed: 13 }); for (let i = 0; i < 3; i++) K.cyl(0.6, 12, -93, 2.0 + i * 0.1, 11.2 + i * 1.25, pipeC, { axis: "x" });
        K.box(5, 2.2, 3, -72, 0, 11, 0xe8b21e); K.sign("STRINGING & BENDING", -84, 4.2, -9.2, 0, 10);
        // welded string from x=-50 to 80
        const joints = []; for (let x = -52; x < 45; x += jl) joints.push(x);
        joints.forEach((x) => K.cyl(0.6, jl - 0.05, x + jl / 2, 0.9, 3.5, pipeC, { axis: "x", mo: { metalness: 0.4 } }));
        for (let x = -50; x < 45; x += 6) K.box(0.3, 0.3, 1.4, x, 0, 3.5, 0x8a6a44);
        // line-up: sidebooms + root welders at x=-52
        K.sideboom(-58, 9.5, Math.PI, 4); K.sideboom(-50, 9.5, Math.PI, 4);
        [[-52.6, 2.4], [-52.6, 4.6], [-51.4, 2.4]].forEach(([x, z], i) => { K.person(x, z, i === 1 ? Math.PI : 0, "welder", { kneel: i === 2 }); });
        K.arc(-52, 1.0, 2.8, { size: 0.7 }); K.arc(-52, 1.2, 4.1, { size: 0.6 });
        K.sign("LINE-UP & ROOT", -56, 4.2, -9.2, 0, 7);
        // firing line: tents over joints with rigs
        [-39.8, -27.6, -15.4, -3.2].forEach((x, i) => { K.tent(x, 3.5, 0); K.person(x - 0.6, 5.0, Math.PI, "welder"); K.arc(x - 0.4, 1.3, 4.1, { size: 0.6, light: i < 2 }); K.pickup(x + 1, 11, 0); });
        K.sign("FIRING LINE: FILL & CAP", -22, 4.2, -9.2, 0, 11);
        // AUT shack
        K.box(3, 2.4, 2.6, 9, 0, 9, 0xf4f4f0); K.torus(0.68, 0.1, 9, 0.9, 3.5, 0xf2a93b, { axis: "x" }); K.person(9.8, 5.2, Math.PI, "hivis"); K.box(5, 2.2, 2.2, 15, 0, 11, 0xdddddd);
        K.sign("AUT INSPECTION", 9, 4.2, -9.2, 0, 6);
        // coating
        K.box(1.6, 1.4, 1.6, 26.3, 0.2, 3.5, 0x8c9aa3, { mo: { transparent: true, opacity: 0.7 } }); K.person(25, 5, Math.PI, "orange"); K.person(28, 5.2, Math.PI, "orange"); K.box(3, 1.6, 2, 27, 0, 10, 0x5b6770);
        K.sign("FIELD JOINT COATING", 27, 4.2, -9.2, 0, 8);
        // lowering-in: string descends into trench
        for (let i = 0; i < 4; i++) { const x = 48 + i * 11, y = 0.5 - i * 0.9, z = 3.5 - i * 1.6; K.cyl(0.6, 11, x, y, z, pipeC, { axis: "x", mo: { metalness: 0.4 } }); }
        [52, 63, 74].forEach((x, i) => K.sideboom(x, 8 - i * 0.5, Math.PI, 5));
        K.box(4, 0.1, 3, 88, -1.8, -2, 0x2c2419); K.person(88, -2.5, 0, "welder", { y: -1.9 }); K.arc(88.3, -1.3, -2, { size: 0.6 });
        K.sign("LOWERING-IN & TIE-INS", 70, 4.2, -9.2, 0, 10);
        return {
          outdoor: true,
          overview: { t: [0, 0, 2], c: [-70, 60, 95] },
          stops: {
            row: { t: [-80, 1, 5], c: [-66, 10, 26] },
            lineup: { t: [-52, 1, 4], c: [-44, 6, 17] },
            firing: { t: [-22, 1.5, 5], c: [-14, 12, 28] },
            aut: { t: [10, 1.2, 5], c: [17, 7, 20] },
            coat: { t: [26, 1, 4], c: [32, 6, 17] },
            lower: { t: [68, -0.5, 1], c: [78, 12, 26] },
          },
        };
      },

      aero(K) {
        K.ground(300, 300, 0x1d262c);
        K.hall(0, 0, 56, 32, 8, { bay: 8, floor: 0xb7c2c4, frame: 0x8d99a2, wall: 0xcfd6da, endWall: true });
        K.stripe(0, 1.5, 56, 0.12, 0x3f86b8);
        // chemical clean tanks
        for (let i = 0; i < 5; i++) K.box(1.8, 1.1, 1.4, -24 + i * 2.1, 0, -11, [0x3f6b8c, 0x6b8f3f, 0x3f6b8c, 0x8c6b3f, 0x3f6b8c][i]);
        K.person(-19, -9.3, Math.PI, "clean"); K.sign("CLEAN LINE", -19.8, 3.5, -16.2, 0, 5);
        // manual TIG benches with purge chamber
        for (let i = 0; i < 3; i++) {
          const x = -10 + i * 3.4;
          K.box(1.8, 0.9, 0.9, x, 0, -11, 0x7b8791, { mo: { metalness: 0.5 } });
          K.box(1.2, 0.6, 0.7, x, 0.9, -11.1, 0x9fc6dd, { mo: { transparent: true, opacity: 0.35 } });
          K.person(x, -9.9, Math.PI, "welder"); K.arc(x, 1.2, -11.1, { size: 0.35, light: i === 1 });
          K.box(0.35, 0.5, 0.45, x + 0.7, 0.9, -10.9, 0x2f3a42);
        }
        K.sign("MANUAL TIG", -6.6, 3.5, -16.2, 0, 5);
        // automated cell: glass enclosure, positioner with ring
        K.box(7, 2.6, 6, 8, 0, -10.5, 0, { m: K.mat(0x9fc6dd, { transparent: true, opacity: 0.18, depthWrite: false }) });
        K.box(1.2, 0.9, 1.2, 8, 0, -10.5, 0x2c6fa3);
        const ringG = K.group(8, 1.6, -10.5); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.12, 12, 40), K.mat(0xa9b3b9, { metalness: 0.8, roughness: 0.3 })); ringG.add(ring); K.spin(ringG, "y", 0.4);
        K.box(0.3, 1.6, 0.3, 10, 0, -10.5, 0xe8e8e4); const ra = K.box(0.2, 1.2, 0.2, 9.4, 1.5, -10.5, 0xe8e8e4); ra.rotation.z = 0.9;
        K.arc(8.7, 1.65, -10.5, { size: 0.4 }); K.person(11.8, -7, 2.4, "clean"); K.sign("AUTOMATED TIG / PLASMA", 8, 3.5, -16.2, 0, 7);
        // EB chamber
        K.cyl(1.6, 5, 19, 1.7, -11, 0x9aa6ae, { axis: "x", mo: { metalness: 0.6 } }); K.cyl(1.62, 0.2, 21.6, 1.7, -11, 0x5b6770, { axis: "x" });
        K.box(1.4, 1.2, 0.8, 19, 0, -7.8, 0x33414b); K.box(0.9, 0.5, 0.05, 19, 1.2, -7.8, 0x58c4f5, { mo: { emissive: 0x1d5c7a } }); K.person(19, -7, Math.PI, "clean");
        K.sign("ELECTRON BEAM", 19, 4.2, -16.2, 0, 5);
        // heat treat
        K.cyl(1.5, 3.4, 23.5, 0, 8, 0x6b747b, { mo: { metalness: 0.5 } }); K.box(2, 1.6, 1, 21, 0, 10.5, 0x33414b); K.sign("HEAT TREAT", 23.5, 4.2, 12.6, Math.PI, 4);
        // NDT: FPI line + X-ray vault
        for (let i = 0; i < 4; i++) K.box(1.5, 1.0, 1.1, 2 + i * 1.8, 0, 9, [0x2e7d4f, 0x3f6b8c, 0x2e7d4f, 0x22272b][i]);
        K.box(2.4, 2.4, 2, 10.5, 0, 9, 0x1a1330); K.person(6, 7.5, 0, "clean");
        K.box(6, 3.2, 5, 15.5, 0, 9, 0x8d959b); K.box(1.4, 0.6, 0.05, 15.5, 2.2, 6.47, 0xf2c230);
        K.sign("NDT: FPI · X-RAY", 9, 4.2, 12.6, Math.PI, 6);
        // records office
        K.box(7, 2.8, 5, -20, 0, 9, 0, { m: K.mat(0x9fc6dd, { transparent: true, opacity: 0.2, depthWrite: false }) });
        for (let i = 0; i < 3; i++) K.box(0.5, 1.8, 0.6, -22.5 + i * 0.6, 0, 10.8, 0x5b6770);
        K.box(1.6, 0.75, 0.8, -19, 0, 8.6, 0x8a6a44); K.person(-19, 7.8, 0, "office"); K.sign("QUALITY RECORDS", -20, 3.6, 12.6, Math.PI, 5);
        return {
          overview: { t: [0, 1, -1], c: [-30, 28, 36] },
          stops: {
            clean: { t: [-20, 1, -11], c: [-17, 5, -3] },
            bench: { t: [-6.6, 1.1, -11], c: [-5, 4, -5] },
            auto: { t: [8, 1.4, -10.5], c: [12, 4.5, -3] },
            eb: { t: [19, 1.6, -11], c: [23, 5, -3] },
            ht: { t: [23, 1.5, 8], c: [18, 5, 2] },
            ndt: { t: [10, 1.2, 9], c: [9, 5, 1] },
            records: { t: [-20, 1.2, 9], c: [-15, 5, 2] },
          },
        };
      },

      ship(K) {
        K.ground(900, 700, 0x1f2a30);
        K.box(900, 0.05, 300, 0, -0.5, -330, 0x1d3b52); // water behind yard
        // stockyard + cutting
        K.plates(-110, -8, 14, 3, 7); K.plates(-110, 0, 14, 3, 5); K.plates(-110, 8, 14, 3, 6);
        K.box(16, 0.4, 5, -90, 0, 0, 0x2e3a42); K.box(0.4, 1.6, 6, -92, 0.4, 0, 0x2c6fa3); K.box(6.4, 0.5, 0.6, -90, 2.0, 0, 0x2c6fa3); K.arc(-92, 0.6, 0, { color: 0xffd9a0, size: 1.3 });
        K.sign("STEEL STOCKYARD & CUTTING", -100, 5, -16, 0, 12);
        // panel line hall
        K.hall(-55, 0, 44, 26, 14, { bay: 11 });
        K.box(34, 0.8, 12, -58, 0, 0, 0x2a3137);
        K.box(22, 0.15, 10, -62, 0.8, 0, 0x6b5a4c, { mo: { metalness: 0.4 } });
        for (let i = 0; i < 6; i++) K.box(22, 0.5, 0.12, -62, 0.95, -4 + i * 1.6, 0x6b5a4c);
        K.gantry(-56, 0, 13, 6, 3); K.arc(-56, 1.2, -2.4, { size: 0.8 }); K.arc(-56, 1.2, 0.8, { size: 0.8 }); K.arc(-56, 1.2, 4, { size: 0.8, light: false });
        K.gantry(-70, 0, 13, 5, 2, 0xe0a526); K.arc(-70, 1.0, 0, { size: 1.0, color: 0xffd9a0 });
        K.person(-50, 7.5, Math.PI, "hivis"); K.sign("PANEL LINE", -55, 12, -13.4, 0, 7);
        // block assembly hall
        K.hall(0, 0, 48, 30, 18, { bay: 12 });
        const block = (x, z, w, h, d) => {
          const c = K.mat(0x7f6a58, { metalness: 0.4, roughness: 0.6 });
          K.box(w, 0.2, d, x, 0, z, 0, { m: c }); K.box(w, h, 0.2, x, 0, z - d / 2, 0, { m: c }); K.box(0.2, h, d, x - w / 2, 0, z, 0, { m: c });
          for (let i = 1; i < 4; i++) K.box(0.15, h, d, x - w / 2 + (w / 4) * i, 0, z, 0, { m: c });
          for (let i = 1; i < 3; i++) K.box(w, 0.15, d * 0.9, x, (h / 3) * i, z, 0, { m: K.mat(0x7f6a58, { metalness: 0.4, transparent: true, opacity: 0.8 }) });
        };
        block(-9, -2, 14, 7, 12); block(10, 0, 12, 6, 10);
        [[-12, 0.5], [-7, -3], [-4, 2], [7, 1], [12, -2]].forEach(([x, z], i) => { K.person(x, z, i, "welder", { y: 0.2 + (i % 2) * 2.4 }); K.arc(x + 0.3, 1.2 + (i % 2) * 2.4, z - 0.4, { size: 0.6, light: i < 3 }); });
        K.cyl(0.2, 14, -2, 5, 3, 0xd9a92b, { axis: "x" });
        K.box(0.8, 0.3, 0.5, 9, 0.2, 5, 0x3a4a55); K.arc(9.4, 0.4, 5, { size: 0.5, light: false });
        K.sign("BLOCK ASSEMBLY", 0, 15, -15.4, 0, 8);
        // outfitting & paint hall
        K.box(26, 14, 22, 42, 0, 0, 0x4a5a66); K.sign("OUTFITTING & PAINT", 42, 15.5, 11.2, 0, 9);
        // dry dock with hull
        const dx = 110, dz = 40;
        K.box(140, 0.1, 44, dx, -8, dz, 0x2c353c); // dock floor
        K.box(140, 8, 1, dx, -8, dz - 22.5, 0x3a444c); K.box(140, 8, 1, dx, -8, dz + 22.5, 0x3a444c); K.box(1, 8, 44, dx - 70.5, -8, dz, 0x3a444c);
        const hull = K.mat(0x7a3530, { metalness: 0.3 }), hullTop = K.mat(0x5a646b, { metalness: 0.3 });
        for (let i = 0; i < 7; i++) { const x = dx - 50 + i * 14; K.box(13.6, 14, 30, x, -7.8, dz, 0, { m: hull }); K.box(13.6, 0.4, 30, x, 6.2, dz, 0, { m: hullTop }); }
        K.box(12, 14, 30, dx + 47.1, -7.8, dz, 0, { m: hull }); K.box(12, 0.4, 30, dx + 47.1, 6.2, dz, 0, { m: hullTop });
        // erection seam between the last two blocks, welded from staging on the outside of the shell
        const seamX = dx + 40.9, sideZ = dz + 15;
        K.box(0.35, 14, 0.12, seamX, -7.8, sideZ + 0.02, 0xd9d2b3); // seam line (bare steel)
        const stg = K.mat(0x8a6a44);
        for (let y = -6; y <= 4; y += 2.5) K.box(8, 0.1, 1.4, seamX, y, sideZ + 0.9, 0, { m: stg });
        [-7.6, 7.6].forEach((dxs) => K.box(0.12, 12, 0.12, seamX + dxs / 2, -7.8, sideZ + 1.55, 0x555555));
        [[-6, -0.8], [-3.5, 0.6], [1.5, -0.4], [4, 0.9]].forEach(([y, ox], i) => { K.person(seamX + ox + 0.4, sideZ + 0.9, Math.PI, "welder", { y: y + 0.1 }); K.arc(seamX, y + 1.2, sideZ + 0.25, { size: 0.9, light: i < 3 }); });
        K.box(0.6, 1.2, 0.5, seamX - 0.1, -1.0, sideZ + 0.4, 0xf2a93b); // electrogas machine climbing the seam
        K.person(seamX + 3, sideZ + 0.9, Math.PI, "office", { y: -3.9 }); K.box(0.4, 0.3, 0.3, seamX + 2.4, -2.7, sideZ + 0.3, 0xf2a93b); // UT tech on staging
        K.person(seamX + 6, sideZ + 5, 2.6, "hivis", { y: -7.8 }); // class surveyor on the dock floor
        // goliath crane spanning the dock, lifting a block
        const gc = K.mat(0xd33b2c, { metalness: 0.3 });
        [dz - 30, dz + 30].forEach((z) => { K.box(3, 62, 3, dx + 62, 0, z, 0, { m: gc }); K.box(3, 62, 3, dx + 38, 0, z, 0, { m: gc }); });
        K.box(28, 5, 64, dx + 50, 62, dz, 0, { m: gc });
        K.cyl(0.08, 26, dx + 58, 36, dz, 0x222222); K.box(12, 10, 26, dx + 58, 26, dz, 0, { m: hull });
        K.sign("DRY DOCK: ERECTION", dx + 20, 3, dz - 24, 0, 12);
        return {
          outdoor: true,
          overview: { t: [40, 0, 18], c: [-40, 185, 300] },
          stops: {
            stock: { t: [-98, 1, 0], c: [-84, 14, 30] },
            panel: { t: [-60, 1, 0], c: [-46, 14, 26] },
            block: { t: [0, 2, 0], c: [14, 16, 30] },
            outfit: { t: [42, 5, 0], c: [60, 22, 40] },
            dock: { t: [seamX, 0, sideZ], c: [seamX + 16, 8, sideZ + 30] },
            qa: { t: [seamX + 3, -4, sideZ + 1], c: [seamX + 12, 0, sideZ + 15] },
          },
        };
      },
    };

    /* ---------------- lifecycle ---------------- */
    function dispose(obj) {
      obj.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m) => { if (m.map && m.map !== glowTex) m.map.dispose(); m.dispose(); }); }
      });
    }
    let stopList = [];
    function load(site) {
      if (root) { scene.remove(root); dispose(root); }
      arcs = []; spinners = [];
      root = new THREE.Group(); scene.add(root);
      env = BUILD[site.id](makeKit(root));
      const outdoor = !!env.outdoor;
      scene.background = new THREE.Color(outdoor ? 0x8fa6b5 : 0x0f171c);
      scene.fog = new THREE.Fog(outdoor ? 0x8fa6b5 : 0x0f171c, outdoor ? 180 : 90, outdoor ? 700 : 260);
      hemi.intensity = outdoor ? 1.0 : 0.8; sun.intensity = outdoor ? 1.1 : 0.7;
      stopList = site.stops.map((s) => ({ id: s.id, name: s.name, cam: env.stops[s.id] }));
      stopList.forEach((s) => { if (!s.cam) console.warn("Gemba: no camera stop for", site.id, s.id); });
      pinsEl.innerHTML = stopList.map((s, i) => `<button class="pin gpin" data-stop="${i}" aria-label="Stop ${i + 1}: ${s.name.replace(/"/g, "&quot;")}"><span class="num">${i + 1}</span><span class="pl">${s.name.replace(/</g, "&lt;")}</span></button>`).join("");
      pinEls = [...pinsEl.querySelectorAll(".gpin")];
      const o = env.overview;
      controls.target.set(...o.t); camera.position.set(...o.c); anim = null;
    }
    let anim = null, current = -1;
    function fly(t, c) {
      const T = new THREE.Vector3(...t), C = new THREE.Vector3(...c);
      if (reduceMotion) { controls.target.copy(T); camera.position.copy(C); return; }
      anim = { t0: performance.now(), dur: 1200, sT: controls.target.clone(), sP: camera.position.clone(), eT: T, eP: C };
    }
    function goStop(i) {
      current = i;
      const s = i < 0 ? env.overview : stopList[i] && stopList[i].cam;
      if (s) fly(s.t, s.c);
      pinEls.forEach((p, k) => p.classList.toggle("on", k === i));
    }
    pinsEl.addEventListener("click", (e) => { const b = e.target.closest(".gpin"); if (b) onPin(+b.dataset.stop); });

    let W = 1, H = 1;
    function resize() { W = Math.max(1, stage.clientWidth); H = Math.max(1, stage.clientHeight); renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); }
    new ResizeObserver(resize).observe(stage); resize();
    renderer.domElement.addEventListener("pointerdown", () => { anim = null; });

    const clock = new THREE.Clock(), v = new THREE.Vector3();
    function loop() {
      requestAnimationFrame(loop);
      if (!root || stage.offsetParent === null) return;
      const dt = Math.min(clock.getDelta(), 0.05), t = performance.now() / 1000;
      if (anim) {
        const k = Math.min(1, (performance.now() - anim.t0) / anim.dur), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        controls.target.lerpVectors(anim.sT, anim.eT, e); camera.position.lerpVectors(anim.sP, anim.eP, e);
        if (k >= 1) anim = null;
      }
      controls.update();
      if (!reduceMotion) {
        arcs.forEach((a) => {
          const on = ((t * 0.25 + a.phase) % 1) < a.on;
          const f = on ? 0.75 + Math.random() * 0.5 : 0;
          a.s.visible = f > 0; a.s.scale.setScalar(a.size * (0.8 + 0.4 * f));
          if (a.light) a.light.intensity = f * 3;
        });
        spinners.forEach((s) => (s.obj.rotation[s.axis] += s.speed * dt));
      } else arcs.forEach((a) => { if (a.light) a.light.intensity = 2; });
      renderer.render(scene, camera);
      if (stopList.length) stopList.forEach((s, i) => {
        const p = pinEls[i]; if (!p || !s.cam) return;
        v.set(s.cam.t[0], s.cam.t[1] + 2.5, s.cam.t[2]).project(camera);
        if (v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05) { p.style.visibility = "hidden"; return; }
        p.style.visibility = "";
        p.style.transform = `translate3d(${((v.x * 0.5 + 0.5) * W - 10).toFixed(1)}px,${((-v.y * 0.5 + 0.5) * H - 10).toFixed(1)}px,0)`;
      });
    }
    loop();
    return { load, goStop, resize, reset() { goStop(current); } };
  }

  window.createGembaWorld = createGembaWorld;
})();
