/* ===================== ROUTER =====================
   Hash-based, so it works on any static host and the browser Back button
   behaves. Each level of the flow has its own URL:

     #/                               Home
     #/motion                         Motion product
     #/motion/<type>                  Workstation type      linear | l-type | 120deg
     #/motion/<type>/<config>         Configurator          free-standing | back-to-back | standard
     #/hub                            HUB product
     #/hub/<product>                  HUB product (variants page, or configurator if it has none)
     #/hub/<product>/<variant>        HUB configurator
=================================================== */

const CONF_BY_SLUG = Object.fromEntries(Object.entries(CONFIG_INFO).map(([k, v]) => [v.slug, k]));

const $ = id => document.getElementById(id);
const crumb = (label, href) => href ? `<a href="${href}">${esc(label)}</a>` : `<span class="here" aria-current="page">${esc(label)}</span>`;

function setCrumbs(items) {
  const el = $('crumbs');
  if (!items.length) { el.innerHTML = ''; return; }
  el.innerHTML = items.map(([l, h]) => crumb(l, h)).join('<span class="sep">/</span>');
}

function showPage(html, opts = {}) {
  $('configView').style.display = 'none';
  const pv = $('pageView');
  pv.style.display = '';
  pv.innerHTML = html;
  if (opts.after) opts.after();
  window.scrollTo(0, 0);
}

function showConfigurator(headHtml) {
  $('pageView').style.display = 'none';
  $('pageView').innerHTML = '';
  const cv = $('configView');
  cv.style.display = '';
  cv.classList.add('route-locked');
  $('cfgHead').innerHTML = headHtml;
  render();
  window.scrollTo(0, 0);
}

function segLinks(items) {
  return `<nav class="seg" aria-label="Switch configuration">${
    items.map(i => `<a href="${i.href}"${i.on ? ' class="on" aria-current="page"' : ''}>${esc(i.label)}</a>`).join('')
  }</nav>`;
}

/* ---------- route handlers ---------- */
function routeHome() {
  document.title = 'SOS — BOM Configurator';
  setCrumbs([]);
  showPage(pageHome());
}

function routeMotion(parts) {
  const [, typeSlug, confSlug] = parts;
  state.activeProduct = 'MOTION';

  if (!typeSlug) {
    document.title = `${MOTION_INFO.name} — SOS`;
    setCrumbs([['Home', '#/'], [MOTION_INFO.name]]);
    return showPage(pageMotion());
  }

  const t = MOTION_TYPES.find(x => x.slug === typeSlug);
  if (!t) return (location.hash = '#/motion');
  const typeLabel = MOTION_SUBTYPE_LABELS[t.key];

  if (!confSlug) {
    document.title = `${typeLabel} — SOS`;
    setCrumbs([['Home', '#/'], [MOTION_INFO.name, '#/motion'], [typeLabel]]);
    return showPage(pageMotionType(t));
  }

  const conf = CONF_BY_SLUG[confSlug];
  const allowed = MOTION_CONFIG_OPTIONS[t.key] || [];
  if (!conf || !allowed.includes(conf)) return (location.hash = `#/motion/${t.slug}`);

  const confLabel = MOTION_CONFIG_LABELS[conf];
  document.title = `${typeLabel} · ${confLabel} — SOS`;
  setCrumbs([['Home', '#/'], [MOTION_INFO.name, '#/motion'], [typeLabel, `#/motion/${t.slug}`], [confLabel]]);

  state.motionSubType = t.key;
  state.wsType = conf;

  showConfigurator(`
    <div class="cfg-head">
      <div><h1>${esc(typeLabel)}</h1><p>${esc(confLabel)} configuration</p></div>
      ${allowed.length > 1 ? segLinks(allowed.map(c => ({
        label: MOTION_CONFIG_LABELS[c], href: `#/motion/${t.slug}/${CONFIG_INFO[c].slug}`, on: c === conf,
      }))) : ''}
    </div>`);
}

function routeHub(parts) {
  const [, id, variantSlug] = parts;
  state.activeProduct = 'HUB';

  if (!id) {
    document.title = 'HUB — SOS';
    setCrumbs([['Home', '#/'], ['HUB']]);
    return showPage(pageHub(), { after: wireHubSearch });
  }

  const p = HUB_PRODUCTS.find(x => x.id === id);
  if (!p) return (location.hash = '#/hub');

  // Products with variants get a page to pick one; the rest go straight to the configurator.
  if (p.variants.length && !variantSlug) {
    document.title = `${p.name} — SOS`;
    setCrumbs([['Home', '#/'], ['HUB', '#/hub'], [p.name]]);
    return showPage(pageHubType(p));
  }

  let variant = null;
  if (p.variants.length) {
    variant = p.variants.find(v => slugify(v) === variantSlug);
    if (!variant) return (location.hash = `#/hub/${p.id}`);
  }

  document.title = `${p.name}${variant ? ' · ' + variant : ''} — SOS`;
  setCrumbs(p.variants.length
    ? [['Home', '#/'], ['HUB', '#/hub'], [p.name, `#/hub/${p.id}`], [variant]]
    : [['Home', '#/'], ['HUB', '#/hub'], [p.name]]);

  state.hubProduct = p.id;
  state.hubVariant = variant;

  showConfigurator(`
    <div class="cfg-head">
      <div><h1>${esc(p.name)}</h1><p>${variant ? esc(variant) + ' variant' : 'Standard configuration'}</p></div>
      ${p.variants.length ? segLinks(p.variants.map(v => ({
        label: v, href: `#/hub/${p.id}/${slugify(v)}`, on: v === variant,
      }))) : ''}
    </div>`);
}

/* ---------- dispatcher ---------- */
function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (parts[0] === 'motion') return routeMotion(parts);
  if (parts[0] === 'hub')    return routeHub(parts);
  return routeHome();
}

function initRouter() {
  window.addEventListener('hashchange', route);
  route();
}
