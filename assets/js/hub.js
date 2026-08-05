/* ===================== HUB PRODUCT DATA ===================== */
const HUB_PRODUCTS = [
  { id:'hub-express-task',       name:'HUB-Express Task',        variants:[] },
  { id:'hub-express-me-space',   name:'HUB-Express Me-Space',    variants:[] },
  { id:'hub-seat',               name:'HUB-Seat',                variants:[] },
  { id:'hub-solo-cube',          name:'HUB-Solo Cube',           variants:[] },
  { id:'hub-duo-cube',           name:'HUB-Duo Cube',            variants:['Standard','4 Seater 3 Way'] },
  { id:'hub-task',               name:'HUB-Task',                variants:[] },
  { id:'hub-s-curve',            name:'HUB-S Curve',             variants:[] },
  { id:'hub-meeting',            name:'HUB-Meeting',             variants:[] },
  { id:'hub-sofa',               name:'HUB-Sofa',                variants:[] },
  { id:'hub-seat-lounge',        name:'HUB-Seat Lounge',         variants:[] },
  { id:'hub-meet',               name:'HUB-Meet',                variants:[] },
  { id:'hub-hive',               name:'HUB-Hive',                variants:[] },
  { id:'hub-divider',            name:'HUB-Divider',             variants:[] },
  { id:'hub-hanging-pedestal',   name:'HUB-Hanging Pedestal',    variants:[] },
  { id:'hub-work-pod-linear',    name:'HUB-Work POD Linear',     variants:['4 Seater 3 Way','4 Seater 4 Way'] },
  { id:'hub-c-curve',            name:'HUB-C Curve',             variants:[] },
];

/* ===================== HUB PANEL RENDER ===================== */
function renderHubPanel() {
  const panel = document.getElementById('hubPanel');
  if (!panel) return;

  const sel    = state.hubProduct;
  const selPrd = HUB_PRODUCTS.find(p => p.id === sel);

  // Build grid of product buttons
  let gridHtml = '<div class="hub-grid">';
  HUB_PRODUCTS.forEach(p => {
    const active = p.id === sel ? ' active' : '';
    gridHtml += `<button class="hub-btn${active}" data-hub="${p.id}">${p.name}</button>`;
  });
  gridHtml += '</div>';

  // Variant row
  let varHtml = '';
  if (selPrd && selPrd.variants.length > 0) {
    varHtml = `<div class="hub-variant-row">
      <div class="hub-var-label">VARIANT</div>
      <div class="hub-var-choices">`;
    selPrd.variants.forEach(v => {
      const vActive = state.hubVariant === v ? ' active' : '';
      varHtml += `<button class="choice-btn${vActive}" data-variant="${v}">${v}</button>`;
    });
    varHtml += `</div></div>`;
  }

  // Placeholder preview
  const previewHtml = sel
    ? `<div class="hub-placeholder">
         <div class="hub-placeholder-icon">
           <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
             <rect x="8" y="24" width="64" height="36" rx="2" stroke="currentColor" stroke-width="2.5"/>
             <rect x="20" y="32" width="40" height="20" rx="1" stroke="currentColor" stroke-width="2"/>
             <line x1="40" y1="60" x2="40" y2="68" stroke="currentColor" stroke-width="2.5"/>
             <line x1="28" y1="68" x2="52" y2="68" stroke="currentColor" stroke-width="2.5"/>
           </svg>
         </div>
         <div class="hub-placeholder-title">${selPrd ? selPrd.name : ''}</div>
         <div class="hub-placeholder-sub">Configuration data coming soon</div>
       </div>`
    : `<div class="hub-placeholder">
         <div class="hub-placeholder-sub">← Select a HUB product to configure</div>
       </div>`;

  document.getElementById('hubGrid').innerHTML      = gridHtml + varHtml;
  document.getElementById('hubPreview').innerHTML   = previewHtml;

  // Update BOM for HUB (placeholder)
  const tbody = document.getElementById('bomBody');
  tbody.innerHTML = '';
  if (sel) {
    const tr = document.createElement('tr');
    tr.className = 'na';
    tr.innerHTML = `<td colspan="26" style="text-align:center;padding:22px;font-family:var(--mono);font-size:12px;color:#8a98a6;">
      BOM data for <b>${selPrd.name}</b>${state.hubVariant ? ' · ' + state.hubVariant : ''} — coming soon
    </td>`;
    tbody.appendChild(tr);
  }
  document.getElementById('bomMeta').textContent = 'HUB — DATA PENDING';
}
