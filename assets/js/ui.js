/* ===================== UI BUILD ===================== */
function choiceButtons(containerId, options, currentKey, fmt) {
  const el = document.getElementById(containerId);
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

/* ===================== RENDER ===================== */
function render() {
  const fs = isFS();

  choiceButtons('wsTypeChoices', OPTIONS.wsType, 'wsType', v => v.replace(/ WORKSTATION$/, ''));

  // BTB does not offer 'NO' as a flap location — auto-correct state if needed
  if (!fs && state.accessFlap.toUpperCase() === 'NO') state.accessFlap = 'CENTRE';
  const flapOpts = fs ? OPTIONS.accessFlap : OPTIONS.accessFlapBTB;
  choiceButtons('accessFlapChoices', flapOpts, 'accessFlap');

  // FREE STANDING + Access Flap = NO → Privacy Panel must be NO (only option)
  // BACK TO BACK → Privacy Panel must be YES (only option)
  const fstFlapNo = fs && state.accessFlap.toUpperCase() === 'NO';
  if (!fs) {
    state.privacy = 'YES';
    const privEl = document.getElementById('privacyChoices');
    privEl.innerHTML = '';
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'choice-btn active';
    b.textContent = 'YES';
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
    b.type = 'button';
    b.className = 'choice-btn active';
    b.textContent = 'NO';
    b.title = 'Privacy panel not available when Access Flap is No';
    b.style.cursor = 'default';
    privEl.appendChild(b);
    const noteEl = document.createElement('div');
    noteEl.style.cssText = 'font-size:10.5px;color:var(--warn);margin-top:4px;font-family:var(--sans);font-weight:600;';
    noteEl.textContent = 'Privacy panel not available when Access Flap is No.';
    privEl.appendChild(noteEl);
  } else {
    choiceButtons('privacyChoices', OPTIONS.privacy, 'privacy');
  }

  // Show panel type selector only when privacy panel is YES
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

  // Height options depend on workstation type AND privacy
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

  // BOM table
  const rows  = buildBOM();
  const tbody = document.getElementById('bomBody');
  tbody.innerHTML = '';
  rows.forEach((r, i) => {
    const tr = document.createElement('tr');
    if (r.na) tr.className = 'na';
    tr.innerHTML = `
      <td class="sr">${i + 1}</td>
      <td class="code">${r.code}</td>
      <td>${r.desc}</td>
      <td class="drawing">${r.drawing}</td>
      <td class="qty">${r.qty}</td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById('bomMeta').textContent = `${rows.filter(r => !r.na).length} ACTIVE / ${rows.length} LINES`;

  // KPIs
  document.getElementById('kpiPersons').textContent   = fs ? 'N/A' : state.person;
  document.getElementById('kpiClusters').textContent  = state.clusters;
  document.getElementById('kpiFootprint').textContent = `${state.length}×${state.depth}`;
  document.getElementById('kpiLines').textContent     = rows.filter(r => !r.na).length;

  // Configuration name
  document.getElementById('configLabel').textContent = buildConfigLabel();

  // Preview panel
  const lk = fs
    ? LOOKUP.find(l => l.type.toLowerCase() === 'free standing workstation')
    : LOOKUP.find(l => l.type.toLowerCase() === 'back to back workstation' && Number(l.option) === Number(state.person));

  document.getElementById('previewTag').textContent   = lk ? lk.image : '—';
  document.getElementById('previewTitle').textContent = `MOTION PLUS ${state.wsType}`;
  document.getElementById('captionType').textContent  = `${fs ? 'Free Standing' : state.person + '-Person Back to Back'} · ${state.length}×${state.depth} · HT ${state.height}`;
  document.getElementById('captionRef').textContent   = `model file: ${lk ? lk.image + MODEL_EXT : '—'}`;

  drawStage(fs, state.person, state.clusters, lk);
}
