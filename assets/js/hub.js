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

/* ===================== HUB CONFIGURATOR PANEL =====================
   The product (and variant) is chosen on the pages before this one, so this
   panel only shows the selection and a placeholder until HUB data is added. */
function renderHubPanel() {
  const sel    = state.hubProduct;
  const selPrd = HUB_PRODUCTS.find(p => p.id === sel);
  if (!selPrd) return;

  const label = selPrd.name + (state.hubVariant ? ' · ' + state.hubVariant : '');

  document.getElementById('hubGrid').innerHTML = `
    <div class="hub-note">
      <b>${label}</b><br>
      Configuration options for this product will appear here once its data is added.
    </div>`;

  document.getElementById('hubPreviewTitle').textContent = selPrd.name;
  document.getElementById('hubPreview').innerHTML = `
    <div class="hub-placeholder">
      <div class="hub-placeholder-icon">
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
          <rect x="8" y="24" width="64" height="36" rx="2" stroke="currentColor" stroke-width="2.5"/>
          <rect x="20" y="32" width="40" height="20" rx="1" stroke="currentColor" stroke-width="2"/>
          <line x1="40" y1="60" x2="40" y2="68" stroke="currentColor" stroke-width="2.5"/>
          <line x1="28" y1="68" x2="52" y2="68" stroke="currentColor" stroke-width="2.5"/>
        </svg>
      </div>
      <div class="hub-placeholder-title">${label}</div>
      <div class="hub-placeholder-sub">Configuration data coming soon</div>
    </div>`;

  const tbody = document.getElementById('bomBody');
  tbody.innerHTML = '';
  const tr = document.createElement('tr');
  tr.className = 'na';
  tr.innerHTML = `<td colspan="26" style="text-align:center;padding:22px;font-family:var(--mono);font-size:12px;color:#8a98a6;">
    BOM data for <b>${selPrd.name}</b>${state.hubVariant ? ' · ' + state.hubVariant : ''} — coming soon
  </td>`;
  tbody.appendChild(tr);
  document.getElementById('bomMeta').textContent = 'HUB — DATA PENDING';
}
