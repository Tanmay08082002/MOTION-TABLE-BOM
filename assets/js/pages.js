/* ===================== PAGES =====================
   Renders the pages that come BEFORE the configurator:
     #/                       Home           (choose a product)
     #/motion                 Motion product (choose a workstation type)
     #/motion/linear          Workstation type (choose a configuration)
     #/hub                    HUB product    (choose one of 16 products)
     #/hub/hub-duo-cube       HUB product with variants (choose a variant)
   Editable copy and product data is at the top of this file.
==================================================== */

/* ---------- EDITABLE CONTENT ---------- */
const MOTION_INFO = {
  name: 'Motion Height Adjustable',
  blurb: 'Height-adjustable workstations on two-motor, three-stage actuators. Choose a layout, then set the size, privacy panel and access flap.',
};

const MOTION_TYPES = [
  { slug: 'linear', key: 'LINEAR', glyph: 'linear',
    blurb: 'Tables in a straight run. Use them free standing, or pair them back to back across a shared spine.' },
  { slug: 'l-type', key: 'LTYPE', glyph: 'ltype',
    blurb: 'A main table with a return, giving each user a corner of work surface.' },
  { slug: '120deg', key: '120DEG', glyph: 'deg120',
    blurb: 'Tables joined at a 120° angle, for layouts that turn a corner without a right angle.' },
];

const CONFIG_INFO = {
  'FREE STANDING WORKSTATION': {
    slug: 'free-standing', glyph: 'fs',
    blurb: 'One table on its own actuator. The privacy panel is optional.',
  },
  'BACK TO BACK WORKSTATION': {
    slug: 'back-to-back', glyph: 'btb',
    blurb: 'Tables paired across a shared spine with cable tray and vertical duct. The privacy panel is always included.',
  },
  'L-TYPE FREE STANDING WORKSTATION': {
    slug: 'l-type-free-standing', glyph: 'ltype',
    blurb: 'One L-shaped table on its own actuator. The privacy panel is optional.',
  },
  'L-TYPE BACK TO BACK WORKSTATION': {
    slug: 'l-type-back-to-back', glyph: 'ltypeBtb',
    blurb: 'L-shaped tables paired back to back with cable tray and vertical duct. The privacy panel is always included.',
  },
  '120 DEG 1P': {
    slug: '120-deg-1p', glyph: 'deg1p',
    blurb: 'A single-user 120° workstation. The privacy panel is optional.',
  },
  '120 DEG 3P': {
    slug: '120-deg-3p', glyph: 'deg3p',
    blurb: 'A three-user 120° workstation. The privacy panel is always included.',
  },
};

/* Set to true once BOM data exists for the HUB range. */
const HUB_READY = false;

/* Card art for HUB products: which drawing to use for each id. */
const HUB_GLYPH = {
  'hub-express-task': 'fs',           'hub-express-me-space': 'mespace',
  'hub-seat': 'seat',                 'hub-solo-cube': 'solocube',
  'hub-duo-cube': 'duocube',          'hub-task': 'fs',
  'hub-s-curve': 'scurve',            'hub-meeting': 'meeting',
  'hub-sofa': 'sofa',                 'hub-seat-lounge': 'lounge',
  'hub-meet': 'meet',                 'hub-hive': 'hive',
  'hub-divider': 'divider',           'hub-hanging-pedestal': 'pedestal',
  'hub-work-pod-linear': 'pod',       'hub-c-curve': 'ccurve',
};

/* ---------- helpers ---------- */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const slugify = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const flapName = v => ({ NO: 'None', CENTRE: 'Centre' }[v] || v);
const range = (arr, unit) => `${Math.min(...arr)}–${Math.max(...arr)}${unit || ''}`;

/* ---------- plan-view drawings (viewBox 240 x 150) ----------
   Classes: d = table/body, c = chair, s = spine (dashed), f = open line, t = tinted body. */
const desk  = (x, y, w, h, cls = 'd') => `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="2" pathLength="1"/>`;
const chair = (x, y, r = 8) => `<circle class="c" cx="${x}" cy="${y}" r="${r}" pathLength="1"/>`;

const GLYPHS = {
  fs:      () => desk(60, 42, 120, 52) + chair(120, 118),
  btb:     () => desk(30, 20, 90, 44) + desk(120, 20, 90, 44) + desk(30, 86, 90, 44) + desk(120, 86, 90, 44) +
                 `<rect class="s" x="30" y="68" width="180" height="14" pathLength="1"/>` +
                 chair(75, 8) + chair(165, 8) + chair(75, 142) + chair(165, 142),
  linear:  () => desk(14, 46, 64, 44) + desk(88, 46, 64, 44) + desk(162, 46, 64, 44) +
                 chair(46, 110) + chair(120, 110) + chair(194, 110),
  ltype:   () => desk(40, 26, 150, 44) + desk(40, 70, 50, 56) + chair(150, 100),
  deg120:  () => `<g transform="translate(118 36)"><rect class="d" x="-96" y="0" width="96" height="38" rx="2" pathLength="1"/>` +
                 `<rect class="d" transform="rotate(60)" x="0" y="0" width="96" height="38" rx="2" pathLength="1"/></g>` + chair(66, 100),
  ltypeBtb:() => desk(40, 14, 140, 34) + desk(40, 48, 44, 26) + desk(40, 102, 140, 34) + desk(40, 76, 44, 26) +
                 `<rect class="s" x="92" y="68" width="88" height="14" pathLength="1"/>` + chair(140, 3) + chair(140, 147),
  deg1p:   () => `<g transform="translate(128 40)"><rect class="d" x="-84" y="0" width="84" height="36" rx="2" pathLength="1"/>` +
                 `<rect class="d" transform="rotate(60)" x="0" y="0" width="52" height="36" rx="2" pathLength="1"/></g>` + chair(84, 98),
  deg3p:   () => `<g transform="translate(120 75)">` +
                 [0, 120, 240].map(a => `<rect class="d" transform="rotate(${a})" x="10" y="-16" width="62" height="32" rx="2" pathLength="1"/>`).join('') +
                 `<circle class="s" cx="0" cy="0" r="9" pathLength="1"/></g>`,
  mespace: () => `<path class="f" d="M70 128V24h100v104" pathLength="1"/>` + desk(86, 34, 68, 24) + chair(120, 92, 11),
  seat:    () => desk(86, 42, 68, 62, 't') + `<rect class="d" x="86" y="42" width="68" height="18" rx="6" pathLength="1"/>`,
  solocube:() => desk(72, 22, 96, 100, 't') + desk(88, 38, 64, 24) + chair(120, 96, 10),
  duocube: () => desk(28, 24, 88, 100, 't') + desk(124, 24, 88, 100, 't') + desk(42, 38, 60, 22) + desk(138, 38, 60, 22) + chair(72, 98) + chair(168, 98),
  scurve:  () => `<path class="t" d="M30 108C80 108 90 62 120 62S160 32 210 32V62C170 62 160 92 120 92S90 138 30 138Z" pathLength="1"/>`,
  meeting: () => `<ellipse class="d" cx="120" cy="75" rx="70" ry="28" pathLength="1"/>` +
                 chair(78, 38) + chair(120, 28) + chair(162, 38) + chair(78, 112) + chair(120, 122) + chair(162, 112),
  sofa:    () => desk(40, 38, 160, 22) + desk(40, 60, 160, 54) + desk(40, 60, 16, 54, 't') + desk(184, 60, 16, 54, 't') +
                 `<path class="f" d="M93 60v54M147 60v54" pathLength="1"/>`,
  lounge:  () => `<circle class="d" cx="120" cy="84" r="36" pathLength="1"/><path class="f" d="M76 62A52 52 0 0 1 164 62" pathLength="1"/>`,
  meet:    () => `<circle class="d" cx="120" cy="75" r="28" pathLength="1"/>` + chair(120, 28) + chair(168, 75) + chair(120, 122) + chair(72, 75),
  hive:    () => `<polygon class="d" points="175,75 147.5,122.6 92.5,122.6 65,75 92.5,27.4 147.5,27.4" pathLength="1"/>` +
                 `<polygon class="t" points="150,75 135,101 105,101 90,75 105,49 135,49" pathLength="1"/>`,
  divider: () => `<path class="f" d="M24 96L64 62L104 96L144 62L184 96L216 74" pathLength="1"/><path class="f" d="M24 104L64 70L104 104L144 70L184 104L216 82" pathLength="1"/>`,
  pedestal:() => desk(86, 32, 68, 86) + `<path class="f" d="M86 60h68M86 89h68M112 46h16M112 75h16M112 104h16" pathLength="1"/>`,
  pod:     () => desk(30, 44, 180, 62, 't') + `<path class="f" d="M120 44v62M30 75h180" pathLength="1"/>` +
                 chair(75, 28) + chair(165, 28) + chair(75, 124) + chair(165, 124),
  ccurve:  () => `<path class="t" d="M180 24A58 58 0 1 0 180 126L180 100A33 33 0 1 1 180 50Z" pathLength="1"/>`,
};

function art(name, opts = {}) {
  const g = (GLYPHS[name] || GLYPHS.fs)();
  const img = opts.img
    ? `<img src="${esc(opts.img)}" alt="" loading="lazy" onerror="this.remove()">` : '';
  return `<div class="sheet-art">
    <svg viewBox="0 0 240 150" role="img" aria-label="${esc(opts.label || 'Plan view')}" preserveAspectRatio="xMidYMid meet">${g}</svg>${img}
  </div>`;
}

/* ---------- reusable card ---------- */
function sheetCard({ href, glyph, img, title, text, cellLabel, cellValue, cellSmall, cta, large }) {
  return `<a class="sheet${large ? ' lg' : ''}" href="${href}" data-name="${esc(title.toLowerCase())}">
    ${art(glyph, { img, label: title + ' plan view' })}
    <div class="sheet-tb">
      <div class="tb-main"><h3>${esc(title)}</h3>${text ? `<p>${esc(text)}</p>` : ''}</div>
      <div class="tb-cell"><span>${esc(cellLabel)}</span><b${cellSmall ? ' class="small"' : ''}>${esc(cellValue)}</b></div>
      ${cta ? `<div class="sheet-cta">${esc(cta)}</div>` : ''}
    </div>
  </a>`;
}

/* ---------- HOME ---------- */
function pageHome() {
  return `
  <section class="home-intro">
    <h1>Configure a workstation</h1>
    <p>Pick a product line, then a workstation type and configuration. The bill of materials, shop drawing and 3D model follow from what you choose.</p>
    <div class="home-flow"><div>Product</div><div>Workstation type</div><div>Configuration</div><div>BOM and drawings</div></div>
  </section>
  <div class="sheet-grid g2 hero-draw">
    ${sheetCard({
      href: '#/motion', glyph: 'btb', large: true,
      img: './assets/img/cards/motion.jpg',
      title: MOTION_INFO.name, text: MOTION_INFO.blurb,
      cellLabel: 'Workstation types', cellValue: String(MOTION_TYPES.length),
      cta: 'Open Motion range',
    })}
    ${sheetCard({
      href: '#/hub', glyph: 'duocube', large: true,
      img: './assets/img/cards/hub.jpg',
      title: 'HUB', text: 'Cubes, pods, seating, meeting and storage products. Choose one to open its configuration.',
      cellLabel: 'Products', cellValue: String(HUB_PRODUCTS.length),
      cta: 'Open HUB range',
    })}
  </div>`;
}

/* ---------- MOTION: product page ---------- */
function pageMotion() {
  const cards = MOTION_TYPES.map(t => {
    const n = (MOTION_CONFIG_OPTIONS[t.key] || []).length;
    return sheetCard({
      href: `#/motion/${t.slug}`, glyph: t.glyph, img: `./assets/img/cards/motion-${t.slug}.jpg`,
      title: MOTION_SUBTYPE_LABELS[t.key], text: t.blurb,
      cellLabel: 'Configurations', cellValue: String(n),
    });
  }).join('');
  return `
  <div class="pg-head">
    <div><h1>${esc(MOTION_INFO.name)}</h1><p>${esc(MOTION_INFO.blurb)}</p></div>
    <div class="pg-facts">
      <div><b>${MOTION_TYPES.length}</b><span>Workstation types</span></div>
      <div><b>${range(OPTIONS.length)}</b><span>Table length, mm</span></div>
      <div><b>${range(OPTIONS.depth)}</b><span>Table depth, mm</span></div>
    </div>
  </div>
  <div class="sheet-grid g3">${cards}</div>`;
}

/* ---------- MOTION: workstation type page (its configurations) ---------- */
function motionSizes(key) {
  const o = (OPTIONS.workstationSizes || {})[key] || {};
  return { length: o.length || OPTIONS.length, depth: o.depth || OPTIONS.depth };
}

function motionSpecs(t, conf) {
  const rows = [];
  const single = /FREE STANDING|1P$/.test(conf);
  if (conf === '120 DEG 1P')      rows.push(['Persons', '1']);
  else if (conf === '120 DEG 3P') rows.push(['Persons', '3']);
  else if (single)                rows.push(['Persons', '1 per table']);
  else                            rows.push(['Persons', OPTIONS.person.join(', ')]);
  rows.push(['Access flap', (single ? OPTIONS.accessFlap : OPTIONS.accessFlapBTB).map(flapName).join(', ')]);
  rows.push(['Privacy panel', single ? 'Optional' : 'Always included']);
  const sz = motionSizes(t.key);
  const dim = arr => arr.length > 1 ? range(arr, ' mm') : `${arr[0]} mm`;
  rows.push(['Table length', dim(sz.length)]);
  rows.push(['Table depth',  dim(sz.depth)]);
  return rows;
}

function pageMotionType(t) {
  const label = MOTION_SUBTYPE_LABELS[t.key];
  const cards = (MOTION_CONFIG_OPTIONS[t.key] || []).map(conf => {
    const ci = CONFIG_INFO[conf];
    const specs = motionSpecs(t, conf).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
    return `<a class="cfg-card" href="#/motion/${t.slug}/${ci.slug}">
      ${art(ci.glyph, { img: `./assets/img/cards/motion-${t.slug}-${ci.slug}.jpg`, label: MOTION_CONFIG_LABELS[conf] + ' plan view' })}
      <div class="cfg-body">
        <h3>${esc(MOTION_CONFIG_LABELS[conf])}</h3>
        <p>${esc(ci.blurb)}</p>
        <dl class="specs">${specs}</dl>
      </div>
      <span class="cfg-go">Configure</span>
    </a>`;
  }).join('');

  return `
  <div class="pg-head">
    <div><h1>${esc(label)}</h1><p>${esc(t.blurb)}</p></div>
  </div>
  <div class="type-layout">
    <aside class="type-aside">
      <div class="sheet">${art(t.glyph, { img: `./assets/img/cards/motion-${t.slug}.jpg`, label: label + ' plan view' })}</div>
    </aside>
    <div class="cfg-list">${cards}</div>
  </div>`;
}

/* ---------- HUB: product page ---------- */
function pageHub() {
  const cards = HUB_PRODUCTS.map(p => {
    const nv = p.variants.length;
    return sheetCard({
      href: `#/hub/${p.id}`, glyph: HUB_GLYPH[p.id] || 'fs', img: `./assets/img/cards/${p.id}.jpg`,
      title: p.name,
      cellLabel: nv ? 'Variants' : 'Configuration',
      cellValue: nv ? String(nv) : (HUB_READY ? 'Standard' : 'Pending'),
      cellSmall: !nv,
    });
  }).join('');
  return `
  <div class="pg-head">
    <div><h1>HUB</h1><p>${HUB_PRODUCTS.length} products. Open one to see its configuration${HUB_READY ? '' : '. BOM data for the HUB range is still being added'}.</p></div>
  </div>
  <div class="tool-row">
    <label class="search">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="9" cy="9" r="6"/><path d="M14 14l4 4"/></svg>
      <input id="hubSearch" type="search" placeholder="Search HUB products" aria-label="Search HUB products" autocomplete="off">
    </label>
    <span class="count" id="hubCount">${HUB_PRODUCTS.length} products</span>
  </div>
  <div class="sheet-grid g4" id="hubCards">${cards}</div>
  <div class="empty-note" id="hubEmpty" style="display:none;">No HUB product matches that search. Clear the search to see all ${HUB_PRODUCTS.length}.</div>`;
}

function wireHubSearch() {
  const input = document.getElementById('hubSearch');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    let shown = 0;
    document.querySelectorAll('#hubCards .sheet').forEach(c => {
      const hit = !q || c.dataset.name.includes(q);
      c.style.display = hit ? '' : 'none';
      if (hit) shown++;
    });
    document.getElementById('hubCount').textContent = `${shown} of ${HUB_PRODUCTS.length} products`;
    document.getElementById('hubEmpty').style.display = shown ? 'none' : '';
  });
}

/* ---------- HUB: product with variants ---------- */
function pageHubType(p) {
  const glyph = HUB_GLYPH[p.id] || 'fs';
  const cards = p.variants.map(v => `
    <a class="cfg-card" href="#/hub/${p.id}/${slugify(v)}">
      ${art(glyph, { img: `./assets/img/cards/${p.id}-${slugify(v)}.jpg`, label: `${p.name} ${v} plan view` })}
      <div class="cfg-body">
        <h3>${esc(v)}</h3>
        <p>${HUB_READY ? '' : 'BOM data for this variant is still being added.'}</p>
      </div>
      <span class="cfg-go">Configure</span>
    </a>`).join('');
  return `
  <div class="pg-head">
    <div><h1>${esc(p.name)}</h1><p>${p.variants.length} variants. Choose one to open its configuration.</p></div>
  </div>
  <div class="type-layout">
    <aside class="type-aside"><div class="sheet">${art(glyph, { img: `./assets/img/cards/${p.id}.jpg`, label: p.name + ' plan view' })}</div></aside>
    <div class="cfg-list">${cards}</div>
  </div>`;
}
