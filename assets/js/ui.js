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
    b.addEventListener('click', () => { state[currentKey] = opt; render(); });
    el.appendChild(b);
  });
}

/* ===================== PRODUCT HUB ===================== */
function renderProductHub() {
  document.querySelectorAll('.ph-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.product === state.activeProduct);
  });
  const motionWrap = document.getElementById('motionWrap');
  const hubWrap    = document.getElementById('hubWrap');
  if (motionWrap) motionWrap.style.display = isMotion() ? '' : 'none';
  if (hubWrap)    hubWrap.style.display    = isHub()    ? '' : 'none';
}

/* ===================== RENDER — MOTION TABLE ===================== */
function renderMotion() {
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
        const opts = MOTION_CONFIG_OPTIONS[st];
        if (!opts.includes(state.wsType)) state.wsType = opts[0];
        render();
      });
      stEl.appendChild(b);
    });
  }

  const configOpts = MOTION_CONFIG_OPTIONS[state.motionSubType] || ['FREE STANDING WORKSTATION','BACK TO BACK WORKSTATION'];
  const ctEl = document.getElementById('motionConfigChoices');
  if (ctEl) {
    ctEl.innerHTML = '';
    configOpts.forEach(opt => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice-btn' + (state.wsType === opt ? ' active' : '');
      b.textContent = MOTION_CONFIG_LABELS[opt] || opt;
      b.addEventListener('click', () => { state.wsType = opt; render(); });
      ctEl.appendChild(b);
    });
  }

  const fs = isFS();
  if (!fs && state.accessFlap.toUpperCase() === 'NO') state.accessFlap = 'CENTRE';
  const flapOpts = fs ? OPTIONS.accessFlap : OPTIONS.accessFlapBTB;
  choiceButtons('accessFlapChoices', flapOpts, 'accessFlap');

  const fstFlapNo = fs && state.accessFlap.toUpperCase() === 'NO';
  if (!fs) {
    state.privacy = 'YES';
    const privEl = document.getElementById('privacyChoices');
    privEl.innerHTML = '';
    const b = document.createElement('button');
    b.type='button'; b.className='choice-btn active'; b.textContent='YES';
    b.style.cursor='default';
    privEl.appendChild(b);
    const noteEl = document.createElement('div');
    noteEl.style.cssText='font-size:10.5px;color:var(--warn);margin-top:4px;font-family:var(--sans);font-weight:600;';
    noteEl.textContent='Privacy panel is mandatory for Back to Back workstations.';
    privEl.appendChild(noteEl);
  } else if (fstFlapNo) {
    state.privacy = 'NO';
    const privEl = document.getElementById('privacyChoices');
    privEl.innerHTML = '';
    const b = document.createElement('button');
    b.type='button'; b.className='choice-btn active'; b.textContent='NO';
    b.style.cursor='default';
    privEl.appendChild(b);
    const noteEl = document.createElement('div');
    noteEl.style.cssText='font-size:10.5px;color:var(--warn);margin-top:4px;font-family:var(--sans);font-weight:600;';
    noteEl.textContent='Privacy panel not available when Access Flap is No.';
    privEl.appendChild(noteEl);
  } else {
    choiceButtons('privacyChoices', OPTIONS.privacy, 'privacy');
  }

  const privTypeWrap = document.getElementById('privacyTypeWrap');
  if (state.privacy.toLowerCase() === 'no') {
    privTypeWrap.style.opacity='0.35'; privTypeWrap.style.pointerEvents='none';
  } else {
    privTypeWrap.style.opacity='1'; privTypeWrap.style.pointerEvents='';
  }
  choiceButtons('privacyTypeChoices', OPTIONS.panelType, 'panelType');
  choiceButtons('lengthChoices', OPTIONS.length, 'length', v => v+'mm');
  choiceButtons('depthChoices', OPTIONS.depth, 'depth', v => v+'mm');

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
  choiceButtons('heightChoices', heightOpts, 'height', v => v+'mm');
  document.getElementById('heightNote').textContent =
    fstNoPriv ? 'Only 750mm is available without a privacy panel.' : '';

  const personWrap = document.getElementById('personChoices');
  const personNote = document.getElementById('personNote');
  if (fs) {
    personWrap.style.display='none'; personNote.style.display='block';
  } else {
    personWrap.style.display='flex'; personNote.style.display='none';
    choiceButtons('personChoices', OPTIONS.person, 'person', v => v+' P');
  }

  document.getElementById('clusterInput').value = state.clusters;

  document.getElementById('kpiPersons').textContent   = fs ? 'N/A' : state.person;
  document.getElementById('kpiClusters').textContent  = state.clusters;
  document.getElementById('kpiFootprint').textContent = `${state.length}×${state.depth}`;

  const subTypeLabel = MOTION_SUBTYPE_LABELS[state.motionSubType] || state.motionSubType;
  const configLabel  = MOTION_CONFIG_LABELS[state.wsType] || state.wsType;
  document.getElementById('configLabel').textContent = `${subTypeLabel} · ${configLabel} · ${buildConfigLabel()}`;

  const lk = fs
    ? LOOKUP.find(l => l.type.toLowerCase() === 'free standing workstation')
    : LOOKUP.find(l => l.type.toLowerCase() === 'back to back workstation' && Number(l.option) === Number(state.person));

  document.getElementById('previewTag').textContent   = lk ? lk.image : '—';
  document.getElementById('previewTitle').textContent = `${subTypeLabel} — ${configLabel}`;
  document.getElementById('captionType').textContent  = `${fs ? 'Free Standing' : state.person+'-Person Back to Back'} · ${state.length}×${state.depth} · HT ${state.height}`;
  document.getElementById('captionRef').textContent   = `model file: ${lk ? lk.image+MODEL_EXT : '—'}`;

  drawStage(fs, state.person, state.clusters, lk);
  renderExpandedBOM();
}

/* ===================== BOM COLUMN DEFINITIONS (LP removed) =====================
   Template cols: 1=S.N. 2=CLST CODE 3=PRODUCT FLAG 4=PRODUCT CODE 5=BILLING CODE
   6=PRODUCT DESCRIPTION 7=COLOR CODE 8=COLOR DESCRIPTION 9=THICKNES 10=WIDTH
   11=HEIGHT 12=DEPTH 13=QTY 14=COL2 15=COL3 16=COL4 17=COL5 18=COL6
   19=DWG NO. 20=DWG REV 21=PROJ DWG 22=PROJ DWG REV [23=LP REMOVED]
   23=AMOUNT 24=VENDOR 25=REMARK 26=Qty
   In HTML table we have 26 columns (template's 26, LP col 23 skipped)
================================================================ */

// AUTO_COLS: columns auto-filled by BOM engine (1-indexed matching HTML th order)
// Col 1=SN, 4=PROD CODE, 5=BILLING CODE, 6=DESC, 13=QTY, 19=DWG NO., 26=Qty
const AUTO_COLS   = new Set([1, 4, 5, 6, 13, 19]);
// YELLOW_COLS: 2=CLST CODE, 3=PRODUCT FLAG, 14=COL2,15=COL3,16=COL4,17=COL5,18=COL6, 20=DWG REV,21=PROJ DWG,22=PROJ DWG REV
const YELLOW_COLS = new Set([2, 3, 14, 15, 16, 17, 18, 20, 21, 22]);
const TOTAL_COLS  = 26;

function renderExpandedBOM() {
  const rows  = buildBOM();
  const tbody = document.getElementById('bomBody');
  tbody.innerHTML = '';

  rows.forEach((r, rowIdx) => {
    const tr = document.createElement('tr');
    if (r.na) tr.className = 'na';

    // auto data mapped to HTML column positions (1-indexed)
    const autoData = {
      1:  rowIdx + 1,   // S.N.
      4:  r.code,       // PRODUCT CODE
      5:  r.code,       // BILLING CODE
      6:  r.desc,       // PRODUCT DESCRIPTION
      13: r.qty,        // QTY
      19: r.drawing,    // DWG NO.

    };

    for (let col = 1; col <= TOTAL_COLS; col++) {
      const td = document.createElement('td');
      if (AUTO_COLS.has(col)) {
        td.textContent = autoData[col] ?? '';
        if (col === 6)  td.className = 'bom-auto bom-desc';
        else if (col === 1)  td.className = 'bom-auto bom-sn';
        else if (col === 13 || col === 26) td.className = 'bom-auto bom-qty';
        else if (col === 4 || col === 5)   td.className = 'bom-auto bom-code';
        else if (col === 19) td.className = 'bom-auto bom-dwg';
        else td.className = 'bom-auto';
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
  const hidden = rows.length - active;
  document.getElementById('bomMeta').textContent =
    `${active} ACTIVE / ${rows.length} LINES` + (hidden > 0 ? ` · ${hidden} HIDDEN` : '');
  document.getElementById('kpiLines').textContent = active;

  // Sync toggle button label to current table state
  const table = document.querySelector('table.bom');
  const btn   = document.getElementById('naToggleBtn');
  const lbl   = document.getElementById('naToggleLabel');
  if (btn && table) {
    const showing = table.classList.contains('show-na');
    btn.classList.toggle('active', showing);
    if (lbl) lbl.textContent = showing ? 'Hide N/A rows' : 'Show N/A rows';
    const eye = btn.querySelector('.na-eye');
    if (eye) eye.textContent = showing ? '👁️' : '🙈';
    // Hide button entirely when there are no NA rows
    btn.style.display = hidden > 0 ? '' : 'none';
  }

  updateSummary();
}

/* ===================== SUMMARY CALCULATIONS ===================== */
function updateSummary() {
  const discountPctEl = document.getElementById('discountPct');
  const gstPctEl      = document.getElementById('gstPct');
  const installPctEl  = document.getElementById('installPct');
  if (!discountPctEl) return;

  // Total basic = sum of AMOUNT col (col 23 in template = col 23 in our 26-col HTML)
  // For now AMOUNT is user-entered; read from bomUserEdits col=23
  const rows = buildBOM().filter(r => !r.na);
  let totalBasic = 0;
  rows.forEach((r, rowIdx) => {
    const key = `${rowIdx}-24`;
    const v = parseFloat(window.bomUserEdits[key] || '0');
    if (!isNaN(v)) totalBasic += v;
  });

  const discPct   = parseFloat(discountPctEl.value || '0') / 100;
  const gstPct    = parseFloat(gstPctEl.value || '0.18');
  const instPct   = parseFloat(installPctEl.value || '0');
  const discount  = totalBasic * discPct;
  const finalBasic = totalBasic - discount;
  const gst       = finalBasic * gstPct;
  const install   = finalBasic * instPct;
  const total     = finalBasic + gst + install;

  const fmt = v => v === 0 ? '0.00' : v.toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 });
  document.getElementById('sumTotalBasic').textContent  = fmt(totalBasic);
  document.getElementById('sumDiscount').textContent    = fmt(discount);
  document.getElementById('sumFinalBasic').textContent  = fmt(finalBasic);
  document.getElementById('sumGst').textContent         = fmt(gst);
  document.getElementById('sumInstall').textContent     = fmt(install);
  document.getElementById('sumTotal').textContent       = fmt(total);
}

/* ===================== NA ROW TOGGLE ===================== */
function toggleNaRows() {
  const table = document.querySelector('table.bom');
  if (!table) return;
  table.classList.toggle('show-na');
  // Re-sync button label without rebuilding BOM
  const showing = table.classList.contains('show-na');
  const btn = document.getElementById('naToggleBtn');
  const lbl = document.getElementById('naToggleLabel');
  if (btn) btn.classList.toggle('active', showing);
  if (lbl) lbl.textContent = showing ? 'Hide N/A rows' : 'Show N/A rows';
  const eye = btn ? btn.querySelector('.na-eye') : null;
  if (eye) eye.textContent = showing ? '👁️' : '🙈';
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
