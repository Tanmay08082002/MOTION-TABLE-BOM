/* ===================== UI BUILD ===================== */
function choiceButtons(containerId, options, currentKey, fmt) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  options.forEach(opt => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'choice-btn';
    b.textContent = fmt ? fmt(opt) : opt;
    if (String(state[currentKey]) === String(opt)) b.classList.add('active');
    b.addEventListener('click', () => {
      state[currentKey] = opt;
      render();
    });
    el.appendChild(b);
  });
}

/* ===================== PRODUCT HUB ===================== */
function renderProductHub() {
  document.querySelectorAll('.ph-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.product === state.activeProduct);
  });
  // Show/hide panels
  const motionWrap = document.getElementById('motionWrap');
  const hubWrap    = document.getElementById('hubWrap');
  if (motionWrap) motionWrap.style.display = isMotion() ? '' : 'none';
  if (hubWrap)    hubWrap.style.display    = isHub()    ? '' : 'none';
}

/* ===================== RENDER — MOTION TABLE ===================== */
function renderMotion() {
  // Motion sub-type buttons
  const subtypes = ['LINEAR','LTYPE','120DEG'];
  const stEl = document.getElementById('motionSubTypeChoices');
  if (stEl) {
    stEl.innerHTML = '';
    subtypes.forEach(st => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice-btn' + (state.motionSubType === st ? ' active' : '');
      b.textContent = MOTION_SUBTYPE_LABELS[st];
      b.addEventListener('click', () => {
        state.motionSubType = st;
        // Reset wsType to first valid option for new sub-type
        const opts = MOTION_CONFIG_OPTIONS[st];
        if (!opts.includes(state.wsType)) state.wsType = opts[0];
        render();
      });
      stEl.appendChild(b);
    });
  }

  // Config type (Free Standing / Back to Back / Standard)
  const configOpts = MOTION_CONFIG_OPTIONS[state.motionSubType] || ['FREE STANDING WORKSTATION','BACK TO BACK WORKSTATION'];
  const ctEl = document.getElementById('motionConfigChoices');
  if (ctEl) {
    ctEl.innerHTML = '';
    configOpts.forEach(opt => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice-btn' + (state.wsType === opt ? ' active' : '');
      b.textContent = MOTION_CONFIG_LABELS[opt] || opt;
      b.addEventListener('click', () => {
        state.wsType = opt;
        render();
      });
      ctEl.appendChild(b);
    });
  }

  const fs = isFS();

  // BTB does not offer 'NO' as a flap location
  if (!fs && state.accessFlap.toUpperCase() === 'NO') state.accessFlap = 'CENTRE';
  const flapOpts = fs ? OPTIONS.accessFlap : OPTIONS.accessFlapBTB;
  choiceButtons('accessFlapChoices', flapOpts, 'accessFlap');

  const fstFlapNo = fs && state.accessFlap.toUpperCase() === 'NO';
  if (!fs) {
    state.privacy = 'YES';
    const privEl = document.getElementById('privacyChoices');
    privEl.innerHTML = '';
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'choice-btn active'; b.textContent = 'YES';
    b.title = 'Privacy panel is mandatory for Back to Back workstations';
    b.style.cursor = 'default';
    privEl.appendChild(b);
    const noteEl = document.createElement('div');
    noteEl.style.cssText = 'font-size:10.5px;color:var(--warn);margin-top:4px;font-family:var(--sans);font-weight:600;';
    noteEl.textContent = 'Privacy panel is mandatory for Back to Back workstations.';
    privEl.appendChild(noteEl);
  } else if (fstFlapNo) {
    state.privacy = 'NO';
    const privEl = document.getElementById('privacyChoices');
    privEl.innerHTML = '';
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'choice-btn active'; b.textContent = 'NO';
    b.style.cursor = 'default';
    privEl.appendChild(b);
    const noteEl = document.createElement('div');
    noteEl.style.cssText = 'font-size:10.5px;color:var(--warn);margin-top:4px;font-family:var(--sans);font-weight:600;';
    noteEl.textContent = 'Privacy panel not available when Access Flap is No.';
    privEl.appendChild(noteEl);
  } else {
    choiceButtons('privacyChoices', OPTIONS.privacy, 'privacy');
  }

  const privTypeWrap = document.getElementById('privacyTypeWrap');
  if (state.privacy.toLowerCase() === 'no') {
    privTypeWrap.style.opacity = '0.35';
    privTypeWrap.style.pointerEvents = 'none';
  } else {
    privTypeWrap.style.opacity = '1';
    privTypeWrap.style.pointerEvents = '';
  }
  choiceButtons('privacyTypeChoices', OPTIONS.panelType, 'panelType');
  choiceButtons('lengthChoices', OPTIONS.length, 'length', v => v + 'mm');
  choiceButtons('depthChoices', OPTIONS.depth, 'depth', v => v + 'mm');

  const fstNoPriv = fs && state.privacy.toLowerCase() === 'no';
  let heightOpts;
  if (!fs) {
    heightOpts = OPTIONS.height;
    if (state.height === 750) state.height = 1050;
  } else if (fstNoPriv) {
    heightOpts = [750];
    if (state.height !== 750) state.height = 750;
  } else {
    heightOpts = OPTIONS.height;
    if (state.height === 750) state.height = 1050;
  }
  choiceButtons('heightChoices', heightOpts, 'height', v => v + 'mm');
  document.getElementById('heightNote').textContent =
    fstNoPriv ? 'Only 750mm is available without a privacy panel.' : '';

  const personWrap = document.getElementById('personChoices');
  const personNote = document.getElementById('personNote');
  if (fs) {
    personWrap.style.display = 'none';
    personNote.style.display = 'block';
  } else {
    personWrap.style.display = 'flex';
    personNote.style.display = 'none';
    choiceButtons('personChoices', OPTIONS.person, 'person', v => v + ' P');
  }

  document.getElementById('clusterInput').value = state.clusters;

  // KPIs
  document.getElementById('kpiPersons').textContent   = fs ? 'N/A' : state.person;
  document.getElementById('kpiClusters').textContent  = state.clusters;
  document.getElementById('kpiFootprint').textContent = `${state.length}×${state.depth}`;

  // Config label
  const subTypeLabel  = MOTION_SUBTYPE_LABELS[state.motionSubType] || state.motionSubType;
  const configLabel   = MOTION_CONFIG_LABELS[state.wsType] || state.wsType;
  document.getElementById('configLabel').textContent  = `${subTypeLabel} · ${configLabel} · ${buildConfigLabel()}`;

  // Preview panel
  const lk = fs
    ? LOOKUP.find(l => l.type.toLowerCase() === 'free standing workstation')
    : LOOKUP.find(l => l.type.toLowerCase() === 'back to back workstation' && Number(l.option) === Number(state.person));

  document.getElementById('previewTag').textContent   = lk ? lk.image : '—';
  document.getElementById('previewTitle').textContent = `${subTypeLabel} — ${configLabel}`;
  document.getElementById('captionType').textContent  = `${fs ? 'Free Standing' : state.person + '-Person Back to Back'} · ${state.length}×${state.depth} · HT ${state.height}`;
  document.getElementById('captionRef').textContent   = `model file: ${lk ? lk.image + MODEL_EXT : '—'}`;

  drawStage(fs, state.person, state.clusters, lk);

  // BOM table (expanded)
  renderExpandedBOM();
}

/* ===================== EXPANDED BOM TABLE ===================== */
const AUTO_COLS  = new Set([1, 4, 5, 6, 13, 19]);
const YELLOW_COLS = new Set([2, 3, 20, 21, 22]);

const COL_HEADERS = [
  'S.N.','CLST CODE','PRODUCT FLAG','PRODUCT CODE','BILLING CODE',
  'PRODUCT DESCRIPTION','COLOR CODE','COLOR DESCRIPTION','THICKNESS',
  'WIDTH','HEIGHT','DEPTH','QTY','COL2','COL3','COL4','COL5','COL6',
  'DWG NO.','DWG REV','PROJ DWG','PROJ DWG REV','LP','AMOUNT','VENDOR','REMARK'
];

function renderExpandedBOM() {
  const rows  = buildBOM();
  const tbody = document.getElementById('bomBody');
  tbody.innerHTML = '';

  rows.forEach((r, rowIdx) => {
    const tr = document.createElement('tr');
    if (r.na) tr.className = 'na';

    const autoData = {
      1:  rowIdx + 1,
      4:  r.code,
      5:  r.code,
      6:  r.desc,
      13: r.qty,
      19: r.drawing,
    };

    for (let col = 1; col <= 26; col++) {
      const td = document.createElement('td');
      if (AUTO_COLS.has(col)) {
        td.textContent = autoData[col] ?? '';
        td.className = 'bom-auto' + (col === 6 ? ' bom-desc' : col === 1 ? ' bom-sn' : col === 13 ? ' bom-qty' : col === 4 || col === 5 ? ' bom-code' : col === 19 ? ' bom-dwg' : '');
      } else {
        const key = `${rowIdx}-${col}`;
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.value = window.bomUserEdits[key] || '';
        inp.className = 'bom-inp' + (YELLOW_COLS.has(col) ? ' bom-inp-yellow' : '');
        inp.dataset.key = key;
        inp.addEventListener('input', e => { window.bomUserEdits[e.target.dataset.key] = e.target.value; });
        td.appendChild(inp);
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });

  const active = rows.filter(r => !r.na).length;
  document.getElementById('bomMeta').textContent = `${active} ACTIVE / ${rows.length} LINES`;
  document.getElementById('kpiLines').textContent = active;
}

/* ===================== PROJECT INFO FIELDS ===================== */
function renderProjectInfo() {
  // Already rendered in HTML; just bind events once
}

/* ===================== MAIN RENDER ===================== */
function render() {
  renderProductHub();
  if (isMotion()) {
    renderMotion();
  } else {
    renderHubPanel();
  }
}
