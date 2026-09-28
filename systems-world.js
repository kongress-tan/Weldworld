/*
 * EBXWorld: 3D viewer for welding systems (all except the cobot cell,
 * which has its own IK-driven model in index.html).
 * ------------------------------------------------------------------
 * createSystemWorld(stage, pinsEl, { onPick, isEsab }) returns
 *   { load(system), focus(compId), setExplode(bool), setRun(bool),
 *     setEsab(bool), reset(), resize() }
 * Each builder gets a kit K and a component-group factory C(id), and
 * returns { home: {t, c}, anchors: {id: [x,y,z]}, explode: {id: [dx,dy,dz]},
 * tick(dt, t, running) }. Units are metres.
 */
(function () {
  "use strict";

  function createSystemWorld(stage, pinsEl, opts) {
    const reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    stage.insertBefore(renderer.domElement, pinsEl);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0E161B");
    scene.fog = new THREE.Fog("#0E161B", 18, 60);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.02, 200);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxPolarAngle = Math.PI * 0.495;
    scene.add(new THREE.HemisphereLight(0xdfeeff, 0x1a2228, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0); sun.position.set(6, 12, 8); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 }); scene.add(sun);
    const fillL = new THREE.DirectionalLight(0x88b4ff, 0.3); fillL.position.set(-6, 4, -5); scene.add(fillL);

    const gc = document.createElement("canvas"); gc.width = gc.height = 64;
    const g2 = gc.getContext("2d"), gr = g2.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.2, "rgba(210,238,255,.75)"); gr.addColorStop(1, "rgba(120,190,255,0)");
    g2.fillStyle = gr; g2.fillRect(0, 0, 64, 64);
    const glowTex = new THREE.CanvasTexture(gc);

    let root = null, def = null, env = null, groups = {}, mats = {}, pinEls = {}, sys = null;
    let ex = 0, exTarget = 0, running = false, esabOn = false, sel = null, hover = null;
    const arcs = [];
    let curC = null;
    const C = (id) => curC(id); // component-group factory used by builders

    function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; }

    function kit(C) {
      const place = (m, g, x, y, z, o) => { m.position.set(x, y, z); if (o.rx) m.rotation.x = o.rx; if (o.ry) m.rotation.y = o.ry; if (o.rz) m.rotation.z = o.rz; m.castShadow = o.shadow !== false; m.receiveShadow = true; g.add(m); return m; };
      const mat = (comp, color, o = {}) => { const m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.55, metalness: 0.2, transparent: true }, o)); (mats[comp] = mats[comp] || []).push(m); return m; };
      const K = {
        mat,
        box(comp, w, h, d, x, y, z, color, o = {}) { return place(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), o.m || mat(comp, color, o.mo)), o.parent || C(comp), x, y + h / 2, z, o); },
        cyl(comp, r, h, x, y, z, color, o = {}) {
          const m = new THREE.Mesh(new THREE.CylinderGeometry(o.r2 != null ? o.r2 : r, r, h, o.seg || 24, 1, !!o.open), o.m || mat(comp, color, Object.assign({ side: o.open ? THREE.DoubleSide : THREE.FrontSide }, o.mo)));
          if (o.axis === "x") m.rotation.z = Math.PI / 2; else if (o.axis === "z") m.rotation.x = Math.PI / 2;
          return place(m, o.parent || C(comp), x, o.axis ? y : y + h / 2, z, Object.assign({}, o, { rx: o.axis === "z" ? Math.PI / 2 : o.rx, rz: o.axis === "x" ? Math.PI / 2 : o.rz }));
        },
        torus(comp, R, r, x, y, z, color, o = {}) { const m = new THREE.Mesh(new THREE.TorusGeometry(R, r, 12, 48, o.arc || Math.PI * 2), o.m || mat(comp, color, o.mo)); return place(m, o.parent || C(comp), x, y, z, Object.assign({ ry: o.axis === "x" ? Math.PI / 2 : 0, rx: o.axis === "y" ? Math.PI / 2 : 0 }, o)); },
        tube(comp, pts, r, color, o = {}) { const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))); return place(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, r, 8), o.m || mat(comp, color, Object.assign({ roughness: 0.8 }, o.mo))), o.parent || C(comp), 0, 0, 0, o); },
        screen(comp, w, h, x, y, z, ry, draw) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: canvasTex(256, Math.round(256 * h / w), draw) })); return place(m, C(comp), x, y, z, { ry, shadow: false }); },
        person(comp, x, z, ry, o = {}) {
          const g = new THREE.Group(); g.position.set(x, o.y || 0, z); g.rotation.y = ry; C(comp).add(g);
          const suit = mat(comp, o.suit || 0x3b3f45), skin = mat(comp, 0xc99a78);
          const kneel = !!o.kneel;
          if (!kneel) { K.box(comp, 0.15, 0.85, 0.17, -0.1, 0, 0, 0, { m: suit, parent: g }); K.box(comp, 0.15, 0.85, 0.17, 0.1, 0, 0, 0, { m: suit, parent: g }); }
          else K.box(comp, 0.38, 0.42, 0.5, 0, 0, 0.05, 0, { m: suit, parent: g });
          const ty = kneel ? 0.42 : 0.85;
          K.box(comp, 0.46, 0.62, 0.27, 0, ty, 0, 0, { m: suit, parent: g });
          K.box(comp, 0.11, 0.52, 0.13, -0.29, ty + 0.05, 0.12, 0, { m: suit, parent: g, rx: -0.9 });
          K.box(comp, 0.11, 0.52, 0.13, 0.29, ty + 0.05, 0.12, 0, { m: suit, parent: g, rx: -0.9 });
          const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), skin); head.position.set(0, ty + 0.78, 0); g.add(head);
          if (o.helmet !== false) K.box(comp, 0.28, 0.32, 0.22, 0, ty + 0.63, 0.05, o.helmetColor || 0x1b1f22, { parent: g, mo: { roughness: 0.35 } });
          return g;
        },
        arc(x, y, z, o = {}) {
          const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: o.color || 0xcfeaff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
          s.scale.setScalar(o.size || 0.12); s.position.set(x, y, z); s.visible = false; root.add(s);
          const light = new THREE.PointLight(o.color || 0x9fd8ff, 0, o.range || 3, 2); light.position.set(x, y + 0.05, z); root.add(light);
          const a = { s, light, size: o.size || 0.12, pos: new THREE.Vector3(x, y, z), sparks: !!o.sparks }; arcs.push(a); return a;
        },
      };
      return K;
    }

    /* ---------------- builders ---------------- */
    const floorTex = canvasTex(512, 512, (g, w, h) => { g.fillStyle = "#1a242b"; g.fillRect(0, 0, w, h); g.strokeStyle = "#223038"; for (let i = 0; i <= w; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); } });
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(12, 12);
    function floor(size) { const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.95 })); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; root.add(m); }

    const BUILD = {
      saw_cab(K) {
        floor(60);
        const R = 2.2, CY = 2.83, L = 6;
        // turning rolls
        [-2, 2].forEach((x) => { K.box("rolls", 0.7, 0.35, 2.6, x, 0, 0, 0x2e5f8a); [-0.9, 0.9].forEach((z) => K.cyl("rolls", 0.3, 0.4, x, 0.5, z, 0x1d2226, { axis: "x" })); K.box("rolls", 0.3, 0.4, 0.4, x - 0.45, 0.35, 0.9, 0x3a444c); });
        // part: rotating can with circ seam
        const can = new THREE.Group(); can.position.set(0, CY, 0); C("part").add(can);
        const shell = K.cyl("part", R, L, 0, 0, 0, 0x5f6c75, { axis: "x", open: true, seg: 48, parent: can, mo: { metalness: 0.6, roughness: 0.45 } });
        K.torus("part", R + 0.01, 0.03, 0, 0, 0, 0xb9c2c8, { axis: "x", parent: can, mo: { metalness: 0.8 } });
        K.box("part", L, 0.03, 0.06, 0, R, 0, 0xb9c2c8, { parent: can });
        // column & boom
        const colZ = -4.8;
        K.box("col", 1.5, 0.4, 1.5, 0, 0, colZ, 0x2a3137);
        K.box("col", 0.6, 6.2, 0.6, 0, 0.4, colZ, 0x2c6fa3);
        K.box("col", 0.5, 0.5, 6.3, 0, 6.0, colZ + 2.75, 0x2c6fa3);
        K.box("col", 1.0, 0.25, 1.0, 0, 5.8, colZ + 0.6, 0x3a444c);
        K.person("col", 0.2, colZ + 0.9, Math.PI, { y: 6.05, suit: 0x2f4a6b, helmet: false });
        // head + controller
        K.box("head", 0.4, 0.55, 0.4, 0, 5.45, 0, 0x2a3137);
        K.cyl("head", 0.05, 0.4, 0, 5.08, 0, 0xc9803e, { mo: { metalness: 0.8 } });
        K.box("head", 0.18, 0.5, 0.18, 0.28, 5.25, 0, 0x9aa6ae);
        K.box("head", 0.35, 0.45, 0.2, 0.45, 1.3, colZ + 0.42, 0x3a444c);
        K.screen("head", 0.26, 0.18, 0.45, 1.6, colZ + 0.53, 0, (g, w, h) => { g.fillStyle = "#0b1a22"; g.fillRect(0, 0, w, h); g.fillStyle = "#58c4f5"; g.font = "bold 40px monospace"; g.fillText("750A", 12, 60); g.fillText("32V", 12, 120); g.fillStyle = "#f2a93b"; g.font = "22px monospace"; g.fillText("TANDEM", 140, 30); });
        // SAW power sources
        [-2.6, -1.7].forEach((x, i) => { K.box("power", 0.8, 1.4, 0.8, x, 0, colZ - 0.4, 0x33414b, { mo: { metalness: 0.4 } }); K.box("power", 0.02, 0.2, 0.4, x + 0.41, 1.0, colZ - 0.4, 0x58c4f5, { mo: { emissive: 0x1d5c7a } }); });
        K.tube("power", [[-1.7, 0.2, colZ], [-0.8, 0.05, colZ], [-0.2, 0.4, colZ + 0.2], [-0.2, 5.9, colZ + 0.3], [0, 6.3, colZ + 2], [0, 5.9, -0.2]], 0.035, 0x151a1e);
        // wire drum + conduit
        K.cyl("wire", 0.35, 0.8, 1.4, 0, colZ, 0x8a6a44, { seg: 8, mo: { metalness: 0 } });
        K.cyl("wire", 0.08, 0.2, 1.4, 0.8, colZ, 0x6f5332, { seg: 8, r2: 0.3 });
        K.tube("wire", [[1.4, 1.0, colZ], [1.1, 3.5, colZ], [0.35, 6.4, colZ], [0.15, 6.4, colZ + 3], [0.05, 5.8, -0.1]], 0.02, 0x222a30);
        // flux hopper + recovery
        K.cyl("flux", 0.28, 0.5, 0, 6.3, -0.3, 0xd9a92b, { r2: 0.35 });
        K.cyl("flux", 0.22, 0.9, 0.55, 6.25, colZ + 1.4, 0x9aa6ae, { r2: 0.3 });
        K.tube("flux", [[0.55, 6.6, colZ + 1.4], [0.5, 6.7, colZ + 3], [0.15, 6.5, -0.2]], 0.04, 0x2a2f33);
        K.tube("flux", [[0.12, 5.08, 0.25], [0.3, 5.4, 0.5], [0.6, 6.4, 0], [0.55, 6.3, colZ + 1.6]], 0.03, 0x2a2f33);
        const mound = K.cyl("flux", 0.05, 0.05, 0, R + CY, 0.05, 0x8a7446, { r2: 0.18, seg: 16 }); mound.scale.set(1, 1, 1.6);
        // tracking sensor + camera + monitor
        K.box("track", 0.1, 0.12, 0.14, 0, 5.2, -0.3, 0xf2a93b);
        K.box("track", 0.12, 0.1, 0.1, -0.22, 5.35, 0.1, 0x1d2226);
        K.box("track", 0.45, 0.3, 0.05, -0.5, 1.5, colZ + 0.45, 0x1d2226);
        // gouging cart
        K.box("gouge", 0.6, 0.8, 0.5, 3.8, 0, 2.2, 0x6b747b);
        K.cyl("gouge", 0.02, 0.35, 3.8, 0.8, 2.3, 0x222222, { rz: 0.8 });
        K.tube("gouge", [[3.8, 0.4, 2.2], [3.3, 0.05, 2.6], [2.8, 0.05, 3.4]], 0.02, 0x2e3a42);
        // NDT
        K.box("ndt", 0.35, 0.18, 0.3, 0.5, CY, R + 0.08, 0xf2a93b, { rx: 0 });
        K.box("ndt", 0.9, 0.9, 0.6, 3.6, 0, 3.2, 0x2a3036); K.screen("ndt", 0.5, 0.32, 3.6, 1.05, 3.51, 0, (g, w, h) => { g.fillStyle = "#081018"; g.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { g.fillStyle = `hsl(${200 - i * 3},80%,50%)`; g.fillRect(i * 4, h / 2 - Math.sin(i / 5) * 30, 4, 20); } });
        K.person("ndt", 3.9, 3.8, Math.PI + 0.3, { suit: 0x2f4a6b, helmet: false });
        const arc = K.arc(0, R + CY + 0.02, 0.02, { size: 0.35, color: 0xffb070, range: 4 });
        return {
          home: { t: [0, 2.8, -0.8], c: [8.5, 6.5, 9.5] },
          anchors: { col: [0, 4.2, colZ + 0.3], head: [0.3, 5.6, 0.25], power: [-2.2, 1.5, colZ - 0.1], wire: [1.4, 1.0, colZ + 0.3], flux: [0.3, 6.6, -0.3], rolls: [2, 0.8, 1.3], track: [-0.25, 5.3, 0.2], gouge: [3.8, 1.0, 2.2], part: [2.6, CY + 1.6, 1.4], ndt: [0.5, CY + 0.2, R + 0.2] },
          explode: { col: [0, 0.6, -2.2], head: [0, 1.6, 0.8], power: [-1.8, 0, -1], wire: [1.8, 0, -1.2], flux: [1.2, 2.4, -0.6], rolls: [0, -0.2, 1.8], track: [-1.4, 1.2, 1.2], gouge: [1.6, 0, 1.4], part: [0, 0, 2.6], ndt: [1.8, 0.4, 2] },
          tick(dt, t, run) {
            if (run) can.rotation.x += dt * 0.25;
            const f = run ? 0.7 + Math.random() * 0.5 : 0;
            arc.s.visible = run; arc.s.scale.setScalar(0.3 + 0.15 * f); arc.light.intensity = f * 2.5;
          },
        };
      },

      orbital_tig(K) {
        floor(30);
        const TY = 1.06, TR = 0.03;
        // clean bench
        K.box("tube", 2.2, 0.05, 0.9, 0, 0.9, 0, 0xc9d1d6, { mo: { metalness: 0.5 } });
        [[-1, -0.4], [1, -0.4], [-1, 0.4], [1, 0.4]].forEach(([x, z]) => K.box("tube", 0.05, 0.9, 0.05, x, 0, z, 0x8d99a2));
        // tube + weld ring + stands
        K.cyl("tube", TR, 1.7, 0, TY, 0, 0xd7dde1, { axis: "x", mo: { metalness: 0.9, roughness: 0.18 } });
        [-0.7, 0.7].forEach((x) => K.box("tube", 0.06, 0.12, 0.08, x, 0.95, 0, 0x5b6770));
        K.torus("tube", TR + 0.002, 0.004, 0, TY, 0, 0xc2a36a, { axis: "x" });
        [0.35, 0.5].forEach((x) => K.cyl("tube", TR, 0.08, x, 0.955, 0.3, 0xd7dde1, { axis: "x", mo: { metalness: 0.9 } }));
        // weld head
        K.box("head", 0.12, 0.2, 0.13, 0, TY - 0.01, 0, 0x2f3a42);
        K.torus("head", 0.07, 0.022, 0, TY, 0, 0x2f3a42, { axis: "x" });
        K.box("head", 0.05, 0.22, 0.05, 0, TY - 0.2, 0.02, 0x1d2226);
        K.tube("head", [[0, TY - 0.3, 0.02], [-0.3, 0.93, 0.25], [-0.9, 0.7, 0.3], [-1.35, 0.95, 0.1]], 0.015, 0x151a1e);
        // power supply on cart
        K.box("psu", 0.6, 0.05, 0.5, -1.45, 0.55, 0.1, 0x2a3137); [0.2, 0.8].forEach((y) => K.box("psu", 0.04, 0.55, 0.04, -1.72, 0, 0.32 - y * 0.35, 0x2a3137));
        K.box("psu", 0.5, 0.45, 0.45, -1.45, 0.6, 0.1, 0x3a4a55, { mo: { metalness: 0.4 } });
        K.screen("psu", 0.22, 0.14, -1.45, 0.88, 0.328, 0, (g, w, h) => { g.fillStyle = "#0b1a22"; g.fillRect(0, 0, w, h); g.fillStyle = "#58c4f5"; g.font = "bold 28px monospace"; g.fillText("PRG 12", 10, 40); g.font = "20px monospace"; g.fillText("316L 1/2in", 10, 80); g.fillStyle = "#4dd4a6"; g.fillText("LVL 1-4 OK", 10, 116); });
        // weld log printer / tablet
        K.box("log", 0.18, 0.06, 0.14, -1.3, 1.05, 0.05, 0xdfe4e8); K.box("log", 0.08, 0.002, 0.18, -1.3, 1.08, 0.18, 0xffffff);
        K.screen("log", 0.2, 0.14, -1.62, 1.12, 0.05, 0.3, (g, w, h) => { g.fillStyle = "#f4f6f7"; g.fillRect(0, 0, w, h); g.fillStyle = "#333"; g.font = "14px monospace"; ["WELD #0418  PASS", "Amps 38.2/12.1", "RPM 7.4  Purge OK", "O2 8 ppm", "Op: J.S."].forEach((l, i) => g.fillText(l, 8, 22 + i * 20)); });
        // prep tools
        K.cyl("prep", 0.05, 0.22, 0.75, 0.93, -0.25, 0x3f6b8c, { axis: "x" }); K.box("prep", 0.06, 0.15, 0.06, 0.8, 0.93, -0.18, 0x2a3137);
        K.box("prep", 0.22, 0.14, 0.2, 0.45, 0.925, -0.28, 0xe8795a);
        // purge: argon cylinder + regulator + analyzer + hose
        K.cyl("purge", 0.11, 1.35, -2.1, 0, -0.35, 0x5b6770, { mo: { metalness: 0.5 } }); K.cyl("purge", 0.11, 0.12, -2.1, 1.35, -0.35, 0x2e6fb0);
        K.box("purge", 0.1, 0.08, 0.08, -2.02, 1.5, -0.35, 0x2a2f33); K.cyl("purge", 0.012, 0.1, -1.96, 1.55, -0.35, 0xbfe6ff, { mo: { transparent: true, opacity: 0.7 } });
        K.box("purge", 0.2, 0.12, 0.16, -0.55, 0.925, -0.3, 0x2c6fa3); K.screen("purge", 0.14, 0.06, -0.55, 1.0, -0.219, 0, (g, w, h) => { g.fillStyle = "#081018"; g.fillRect(0, 0, w, h); g.fillStyle = "#4dd4a6"; g.font = "bold 44px monospace"; g.fillText("8 ppm", 20, 78); });
        K.tube("purge", [[-2.0, 1.5, -0.35], [-1.3, 1.3, -0.4], [-0.6, 0.95, -0.3], [-0.85, TY, -0.02], [-0.86, TY, 0]], 0.008, 0x2e6fb0);
        // tungsten box
        K.box("tungsten", 0.16, 0.03, 0.08, 0.15, 0.925, -0.3, 0x4b555c); [0, 1, 2, 3].forEach((i) => K.cyl("tungsten", 0.003, 0.14, 0.1 + i * 0.03, 0.96, -0.3, 0xb8c2c8, { axis: "x" }));
        // borescope
        K.box("scope", 0.08, 0.18, 0.06, 0.85, 0.925, 0.25, 0x1d2226); K.tube("scope", [[0.85, 1.1, 0.25], [0.95, 1.2, 0.1], [0.86, TY, 0.01]], 0.004, 0x333333);
        // operator in cleanroom suit
        K.person("tube", 0.15, -0.8, 0, { suit: 0xe9edf0, helmet: false });
        const arc = K.arc(0, TY + TR + 0.004, 0, { size: 0.06, range: 1.2 });
        return {
          home: { t: [-0.3, 1.0, 0], c: [1.3, 1.75, 2.1] },
          anchors: { psu: [-1.45, 0.95, 0.35], head: [0, TY + 0.12, 0.04], prep: [0.7, 1.0, -0.25], purge: [-0.55, 1.05, -0.3], tungsten: [0.15, 1.0, -0.3], tube: [0.55, TY + 0.02, 0], log: [-1.3, 1.15, 0.12], scope: [0.85, 1.1, 0.25] },
          explode: { psu: [-0.6, 0.1, 0.3], head: [0, 0.35, 0.25], prep: [0.4, 0.2, -0.4], purge: [-0.4, 0.2, -0.5], tungsten: [0.1, 0.25, -0.45], tube: [0, -0.05, 0.35], log: [-0.5, 0.35, 0.4], scope: [0.45, 0.2, 0.35] },
          tick(dt, t, run) {
            const a = t * 2.2;
            arc.s.position.set(0, TY + Math.cos(a) * (TR + 0.004), Math.sin(a) * (TR + 0.004));
            arc.light.position.copy(arc.s.position);
            const f = run ? 0.8 + Math.random() * 0.3 : 0;
            arc.s.visible = run; arc.light.intensity = f * 1.5;
          },
        };
      },

      manual_mig(K) {
        floor(40);
        // ship block: deck plate, bulkhead, stiffeners
        K.box("part", 4, 0.03, 2.4, 0, 0, 0, 0x6f5d4e, { mo: { metalness: 0.45 } });
        K.box("part", 4, 1.6, 0.03, 0, 0, -1.2, 0x6f5d4e, { mo: { metalness: 0.45 } });
        [-0.2, 0.6].forEach((z) => K.box("part", 3.8, 0.15, 0.015, 0, 0.03, z, 0x7f6a58));
        K.box("part", 4, 0.012, 0.012, 0, 0.03, -1.17, 0xb9c2c8);
        // carriage on rail along the deck-bulkhead fillet
        K.box("carriage", 3.6, 0.03, 0.12, 0, 0.03, -0.85, 0x9aa6ae);
        const car = new THREE.Group(); C("carriage").add(car);
        K.box("carriage", 0.28, 0.16, 0.22, 0, 0.06, -0.85, 0x2c6fa3, { parent: car });
        K.box("carriage", 0.05, 0.05, 0.25, 0, 0.22, -0.98, 0x3a444c, { parent: car });
        K.cyl("carriage", 0.02, 0.28, 0, 0.14, -1.06, 0x1c2226, { parent: car, rx: 0.7 });
        // welder at the stiffener with gun
        K.person("helmet", 0.9, 0.95, Math.PI, { kneel: true, suit: 0x3b3f45 });
        K.cyl("gun", 0.022, 0.3, 0.9, 0.35, 0.72, 0x1c2226, { rx: 1.1 });
        K.cyl("gun", 0.013, 0.08, 0.9, 0.22, 0.6, 0xc9803e, { rx: 1.1, mo: { metalness: 0.8 } });
        // power source, feeder, wire, gas
        K.box("power", 0.45, 0.7, 0.75, -2.9, 0, 1.4, 0x33414b, { mo: { metalness: 0.4 } }); K.box("power", 0.02, 0.12, 0.3, -2.67, 0.5, 1.4, 0x58c4f5, { mo: { emissive: 0x1d5c7a } });
        K.box("feeder", 0.3, 0.45, 0.62, 0.1, 0, 1.35, 0x39474f, { mo: { metalness: 0.4 } }); K.box("feeder", 0.02, 0.06, 0.2, 0.26, 0.35, 1.35, 0xf2a93b);
        K.tube("gun", [[0.1, 0.4, 1.1], [0.5, 0.25, 1.0], [0.85, 0.35, 0.85], [0.9, 0.45, 0.8]], 0.018, 0x151a1e);
        K.tube("feeder", [[-2.7, 0.2, 1.4], [-1.4, 0.03, 1.8], [-0.1, 0.1, 1.5]], 0.02, 0x151a1e);
        K.tube("carriage", [[0.1, 0.3, 1.1], [0, 0.05, 0.3], [0, 0.2, -0.85]], 0.015, 0x151a1e);
        K.box("wire", 0.9, 0.12, 0.9, -1.8, 0, 1.9, 0x8a6a44); for (let i = 0; i < 6; i++) K.box("wire", 0.3, 0.3, 0.3, -2.05 + (i % 3) * 0.3, 0.12 + Math.floor(i / 3) * 0.3, 1.9, 0x2c5f7f);
        K.cyl("wire", 0.15, 0.1, -1.1, 0.02, 1.9, 0x9a7a4a, { axis: "z" });
        K.cyl("gas", 0.11, 1.35, -2.3, 0, 0.9, 0x5b6770, { mo: { metalness: 0.5 } }); K.cyl("gas", 0.11, 0.12, -2.3, 1.35, 0.9, 0x7a7a7a);
        K.box("gas", 0.1, 0.08, 0.08, -2.22, 1.5, 0.9, 0x2a2f33); K.tube("gas", [[-2.2, 1.5, 0.9], [-1.4, 0.4, 1.3], [0.05, 0.3, 1.35]], 0.006, 0x2e5d3b);
        // gouging stand
        K.box("gouge", 0.05, 1.1, 0.05, 2.5, 0, 1.0, 0x6b747b); K.cyl("gouge", 0.02, 0.3, 2.5, 1.1, 1.05, 0x222222, { rz: 1.0 });
        K.box("gouge", 0.25, 0.15, 0.15, 2.3, 0, 1.25, 0x3a4a55); K.tube("gouge", [[2.5, 1.0, 1.0], [2.8, 0.05, 1.4], [3.4, 0.05, 2]], 0.015, 0x2e3a42);
        // ground clamp
        K.box("ground", 0.08, 0.04, 0.06, 1.7, 0.03, 1.1, 0xc9803e, { mo: { metalness: 0.7 } }); K.tube("ground", [[1.7, 0.06, 1.1], [0.5, 0.02, 1.9], [-2.7, 0.15, 1.6]], 0.015, 0x1f2a30);
        const arcA = K.arc(0, 0.06, -1.14, { size: 0.16, range: 3, sparks: true });
        const arcB = K.arc(0.9, 0.18, 0.55, { size: 0.16, range: 3, sparks: true });
        return {
          home: { t: [-0.3, 0.5, 0.2], c: [3.6, 2.9, 4.4] },
          anchors: { power: [-2.9, 0.85, 1.4], feeder: [0.1, 0.6, 1.35], gun: [0.9, 0.45, 0.72], wire: [-1.8, 0.8, 1.9], gas: [-2.3, 1.6, 0.9], carriage: [0, 0.35, -0.85], helmet: [0.9, 1.35, 0.95], gouge: [2.5, 1.25, 1.0], ground: [1.7, 0.2, 1.1], part: [-1.2, 1.0, -1.15] },
          explode: { power: [-0.9, 0, 0.5], feeder: [0, 0.5, 0.6], gun: [0.4, 0.6, 0.3], wire: [-0.6, 0, 0.8], gas: [-0.8, 0, -0.3], carriage: [0, 0.6, 0.2], helmet: [0.6, 0, 0.8], gouge: [0.8, 0, 0.3], ground: [0.6, 0.2, 0.5], part: [0, -0.1, -0.6] },
          tick(dt, t, run) {
            if (run) car.position.x = ((t * 0.15) % 3.2) - 1.6;
            arcA.pos.set(car.position.x, 0.06, -1.14); arcA.s.position.copy(arcA.pos); arcA.light.position.copy(arcA.pos);
            [arcA, arcB].forEach((a, i) => { const on = run && ((t * 0.3 + i * 0.4) % 1) < 0.8; const f = on ? 0.8 + Math.random() * 0.4 : 0; a.s.visible = on; a.s.scale.setScalar(a.size * (0.8 + 0.4 * f)); a.light.intensity = f * 2.2; a.lit = on; });
          },
        };
      },

      manual_tig(K) {
        floor(30);
        K.box("part", 1.8, 0.05, 0.9, 0, 0.9, 0, 0x7b8791, { mo: { metalness: 0.5 } });
        [[-0.85, -0.4], [0.85, -0.4], [-0.85, 0.4], [0.85, 0.4]].forEach(([x, z]) => K.box("part", 0.05, 0.9, 0.05, x, 0, z, 0x4b555c));
        // purge chamber with titanium duct
        K.box("purge", 0.7, 0.42, 0.45, 0, 0.95, -0.15, 0x9fc6dd, { mo: { transparent: true, opacity: 0.22, depthWrite: false, metalness: 0 } });
        [-0.15, 0.15].forEach((x) => K.torus("purge", 0.07, 0.015, x, 1.12, 0.08, 0x2a3036, {}));
        K.cyl("part", 0.06, 0.34, 0, 1.08, -0.15, 0xb0a79a, { axis: "x", mo: { metalness: 0.8, roughness: 0.3 } });
        K.torus("part", 0.061, 0.004, 0, 1.08, -0.15, 0xd8d0b8, { axis: "x" });
        // welder
        K.person("helmet", 0, 0.62, Math.PI, { suit: 0x2f3a4a });
        K.cyl("torch", 0.014, 0.16, 0.05, 1.18, 0.02, 0x1c2226, { rx: 0.9 }); K.cyl("torch", 0.02, 0.05, 0.05, 1.13, -0.03, 0xd9d2c0, { rx: 0.9 });
        K.tube("torch", [[0.05, 1.25, 0.1], [0.3, 1.0, 0.5], [-0.6, 0.7, 0.5], [-1.25, 0.5, 0.1]], 0.012, 0x151a1e);
        K.cyl("filler", 0.003, 0.5, -0.15, 1.12, 0.1, 0xc9c9c9, { rz: 1.2 });
        K.cyl("filler", 0.03, 0.9, 0.6, 0.95, 0.2, 0x3a4a55, { rz: 1.57 }); K.box("filler", 0.12, 0.05, 0.05, 0.62, 0.95, 0.28, 0xf2a93b);
        // power source + cooler on cart
        K.box("tig", 0.32, 0.45, 0.6, -1.3, 0.5, -0.1, 0x3a4a55, { mo: { metalness: 0.4 } }); K.box("tig", 0.02, 0.1, 0.3, -1.13, 0.8, -0.1, 0x58c4f5, { mo: { emissive: 0x1d5c7a } });
        K.box("cooler", 0.32, 0.35, 0.6, -1.3, 0.1, -0.1, 0x2e3a42); K.box("cooler", 0.02, 0.1, 0.1, -1.13, 0.3, 0.1, 0x3f86b8);
        K.box("tig", 0.4, 0.04, 0.7, -1.3, 0.05, -0.1, 0x222a30);
        // pedal
        K.box("pedal", 0.2, 0.06, 0.3, 0.3, 0, 0.85, 0x1d2226, { rx: -0.2 }); K.tube("pedal", [[0.3, 0.05, 0.75], [-0.5, 0.02, 0.5], [-1.15, 0.2, 0.0]], 0.006, 0x222222);
        // tungsten tray
        K.box("tungsten", 0.12, 0.02, 0.08, 0.45, 0.925, -0.3, 0x4b555c); [0, 1, 2].forEach((i) => K.cyl("tungsten", 0.002, 0.1, 0.42 + i * 0.03, 0.945, -0.3, 0xb8c2c8, { axis: "x" }));
        // argon cylinder + dual flowmeter
        K.cyl("gas", 0.11, 1.35, -1.9, 0, -0.45, 0x5b6770, { mo: { metalness: 0.5 } }); K.cyl("gas", 0.11, 0.12, -1.9, 1.35, -0.45, 0x2e6fb0);
        [0, 0.06].forEach((dz) => K.cyl("gas", 0.012, 0.1, -1.82, 1.55, -0.48 + dz, 0xbfe6ff, { mo: { transparent: true, opacity: 0.7 } }));
        K.tube("gas", [[-1.8, 1.5, -0.45], [-1.5, 0.9, -0.3], [-1.3, 0.55, -0.2]], 0.006, 0x2e6fb0); K.tube("purge", [[-1.8, 1.5, -0.42], [-0.9, 1.1, -0.5], [-0.35, 1.0, -0.2]], 0.006, 0x2e6fb0);
        const arc = K.arc(0.02, 1.14, -0.09, { size: 0.08, range: 1.5, sparks: false });
        return {
          home: { t: [-0.5, 0.95, 0], c: [1.0, 2.1, -2.3] },
          anchors: { tig: [-1.3, 1.0, 0.1], cooler: [-1.3, 0.45, 0.2], torch: [0.1, 1.28, 0.05], pedal: [0.3, 0.1, 0.85], filler: [0.6, 1.02, 0.2], gas: [-1.9, 1.6, -0.45], purge: [0.3, 1.3, -0.15], helmet: [0, 1.5, 0.62], tungsten: [0.45, 0.98, -0.3], part: [-0.2, 1.1, -0.15] },
          explode: { tig: [-0.5, 0.3, 0.2], cooler: [-0.5, -0.1, 0.4], torch: [0.2, 0.4, 0.3], pedal: [0.3, 0, 0.4], filler: [0.4, 0.2, 0.2], gas: [-0.5, 0, -0.3], purge: [0, 0.35, -0.35], helmet: [0.2, 0, 0.6], tungsten: [0.3, 0.2, -0.3], part: [0, 0.6, -0.1] },
          tick(dt, t, run) { const f = run ? 0.8 + Math.random() * 0.3 : 0; arc.s.visible = run; arc.s.scale.setScalar(0.07 + 0.03 * f); arc.light.intensity = f * 1.8; },
        };
      },
    };

    /* ---------------- sparks ---------------- */
    const SP = 60; let spk = null;
    function buildSparks() {
      const em = arcs.filter((a) => a.sparks); if (!em.length) { spk = null; return; }
      const n = em.length * SP, pos = new Float32Array(n * 3).fill(-99), vel = new Float32Array(n * 3), life = new Float32Array(n);
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.025, map: glowTex, color: 0xffc46b, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
      pts.frustumCulled = false; root.add(pts); spk = { pts, pos, vel, life, em };
    }
    function tickSparks(dt) {
      if (!spk) return; const { pos, vel, life, em } = spk;
      for (let i = 0; i < life.length; i++) {
        const e = em[(i / SP) | 0], k = i * 3;
        if (life[i] <= 0) { if (!e.lit || Math.random() > 0.3) { pos[k + 1] = -99; continue; } pos[k] = e.pos.x; pos[k + 1] = e.pos.y; pos[k + 2] = e.pos.z; vel[k] = (Math.random() - 0.5) * 1.6; vel[k + 1] = Math.random() * 1.6 + 0.2; vel[k + 2] = (Math.random() - 0.5) * 1.6; life[i] = 0.2 + Math.random() * 0.5; }
        else { vel[k + 1] -= 9.8 * dt; pos[k] += vel[k] * dt; pos[k + 1] += vel[k + 1] * dt; pos[k + 2] += vel[k + 2] * dt; if (pos[k + 1] < 0.01) { pos[k + 1] = 0.01; vel[k + 1] *= -0.3; } life[i] -= dt; if (life[i] <= 0) pos[k + 1] = -99; }
      }
      spk.pts.geometry.attributes.position.needsUpdate = true;
    }

    /* ---------------- lifecycle ---------------- */
    function dispose(o) { o.traverse((x) => { if (x.geometry) x.geometry.dispose(); if (x.material) { (Array.isArray(x.material) ? x.material : [x.material]).forEach((m) => { if (m.map && m.map !== glowTex && m.map !== floorTex) m.map.dispose(); m.dispose(); }); } }); }
    function load(system) {
      if (root) { scene.remove(root); dispose(root); }
      root = new THREE.Group(); scene.add(root);
      groups = {}; mats = {}; arcs.length = 0; sys = system; sel = null; hover = null; ex = exTarget;
      curC = (id) => { if (!groups[id]) { const g = new THREE.Group(); g.userData.comp = id; groups[id] = g; root.add(g); } return groups[id]; };
      system.components.forEach((c) => C(c.id));
      env = BUILD[system.id](kit(C));
      Object.values(groups).forEach((g) => g.traverse((o) => (o.userData.comp = g.userData.comp)));
      buildSparks();
      pinsEl.innerHTML = system.components.map((c, i) => `<button class="pin${opts.isEsab(c) ? " esab" : ""}" data-comp="${c.id}" aria-label="${c.name.replace(/"/g, "&quot;")}"><span class="num">${i + 1}</span><span class="pl">${c.name.replace(/</g, "&lt;")}</span></button>`).join("");
      pinEls = {}; pinsEl.querySelectorAll(".pin").forEach((p) => (pinEls[p.dataset.comp] = p));
      applyExplode(); paint();
      controls.target.set(...env.home.t); camera.position.set(...env.home.c); anim = null;
    }
    function applyExplode() { Object.entries(groups).forEach(([id, g]) => { const o = (env.explode && env.explode[id]) || [0, 0, 0]; g.position.set(o[0] * ex, o[1] * ex, o[2] * ex); }); }
    function anchorOf(id) { const a = env.anchors[id] || [0, 1, 0], o = (env.explode && env.explode[id]) || [0, 0, 0]; return new THREE.Vector3(a[0] + o[0] * ex, a[1] + o[1] * ex, a[2] + o[2] * ex); }
    function paint() {
      Object.entries(mats).forEach(([id, list]) => {
        const comp = sys.components.find((c) => c.id === id), esab = comp && opts.isEsab(comp);
        list.forEach((m) => {
          if (!m.userData.b) m.userData.b = { op: m.opacity, em: m.emissive.getHex(), ei: m.emissiveIntensity };
          const b = m.userData.b, on = sel === id, hov = hover === id && !on;
          let em = b.em, ei = b.ei, op = b.op;
          if (esabOn) { if (esab) { em = 0x1f6d96; ei = 0.55; } else op = Math.min(b.op, 0.35); }
          if (sel && !on) op = Math.min(op, 0.28);
          if (on) { em = 0x14506d; ei = 0.6; } else if (hov) { em = 0x10384a; ei = 0.5; }
          m.emissive.setHex(em); m.emissiveIntensity = ei; m.opacity = op; m.depthWrite = op > 0.9;
        });
      });
      Object.entries(pinEls).forEach(([id, p]) => p.classList.toggle("on", id === sel));
    }

    let anim = null;
    function fly(t, c) { if (reduceMotion) { controls.target.copy(t); camera.position.copy(c); return; } anim = { t0: performance.now(), dur: 800, sT: controls.target.clone(), sP: camera.position.clone(), eT: t, eP: c }; }
    const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
    function pick(cx, cy) {
      const r = renderer.domElement.getBoundingClientRect();
      mouse.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(mouse, camera);
      const h = ray.intersectObjects(Object.values(groups), true).find((x) => x.object.visible && (!x.object.material || x.object.material.opacity > 0.3));
      return h ? h.object.userData.comp : null;
    }
    let down = null;
    renderer.domElement.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; anim = null; });
    renderer.domElement.addEventListener("pointerup", (e) => { if (!down) return; const mv = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null; if (mv > 5 || e.button !== 0) return; opts.onPick(pick(e.clientX, e.clientY)); });
    let hRaf = 0, lastEv = null;
    renderer.domElement.addEventListener("pointermove", (e) => { lastEv = e; if (hRaf || e.pointerType === "touch") return; hRaf = requestAnimationFrame(() => { hRaf = 0; if (down || !sys) return; const id = pick(lastEv.clientX, lastEv.clientY); if (id !== hover) { hover = id; paint(); } renderer.domElement.style.cursor = id ? "pointer" : ""; }); });
    renderer.domElement.addEventListener("pointerleave", () => { hover = null; if (sys) paint(); });

    let W = 1, H = 1;
    function resize() { W = Math.max(1, stage.clientWidth); H = Math.max(1, stage.clientHeight); renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); }
    new ResizeObserver(resize).observe(stage); resize();
    const clock = new THREE.Clock(), v = new THREE.Vector3();
    function loop() {
      requestAnimationFrame(loop);
      if (!root || stage.offsetParent === null) { clock.getDelta(); return; }
      const dt = Math.min(clock.getDelta(), 0.05), t = performance.now() / 1000;
      if (Math.abs(ex - exTarget) > 0.001) { ex += (exTarget - ex) * (reduceMotion ? 1 : Math.min(1, dt * 5)); if (Math.abs(ex - exTarget) < 0.002) ex = exTarget; applyExplode(); }
      env.tick(dt, t, running && !reduceMotion);
      arcs.forEach((a) => { if (a.lit === undefined || !a.sparks) a.lit = a.s.visible; });
      if (!reduceMotion) tickSparks(dt);
      if (anim) { const k = Math.min(1, (performance.now() - anim.t0) / anim.dur), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; controls.target.lerpVectors(anim.sT, anim.eT, e); camera.position.lerpVectors(anim.sP, anim.eP, e); if (k >= 1) anim = null; }
      controls.update(); renderer.render(scene, camera);
      sys.components.forEach((c) => {
        const p = pinEls[c.id]; if (!p) return; v.copy(anchorOf(c.id)).project(camera);
        if (v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05) { p.style.visibility = "hidden"; return; }
        p.style.visibility = ""; p.style.transform = `translate3d(${((v.x * 0.5 + 0.5) * W - 10).toFixed(1)}px,${((-v.y * 0.5 + 0.5) * H - 10).toFixed(1)}px,0)`;
      });
    }
    loop();
    function homeDist() { return camera.aspect < 0.9 ? 1.45 : 1; }
    return {
      load, resize,
      focus(id) {
        sel = id || null; paint();
        const T = new THREE.Vector3(...env.home.t), P = new THREE.Vector3(...env.home.c);
        if (!id) { fly(T, T.clone().add(P.clone().sub(T).multiplyScalar(homeDist()))); return; }
        const a = anchorOf(id), dir = camera.position.clone().sub(controls.target).normalize();
        const scale = P.distanceTo(T) * 0.45 * homeDist();
        fly(a, a.clone().addScaledVector(dir, scale));
      },
      setExplode(on) { exTarget = on ? 1 : 0; },
      setRun(on) { running = on; },
      setEsab(on) { esabOn = on; if (sys) paint(); },
      reset() { sel = null; paint(); const T = new THREE.Vector3(...env.home.t), P = new THREE.Vector3(...env.home.c); fly(T, T.clone().add(P.clone().sub(T).multiplyScalar(homeDist()))); },
    };
  }
  window.createSystemWorld = createSystemWorld;
})();
