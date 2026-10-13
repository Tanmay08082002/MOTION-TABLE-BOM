/* ===================== ASSET CANDIDATE BUILDERS =====================
   Given base name "WS_3", flap=LHS, privacy=NO, the order tried is:
     WS_3_LHS_NOPRIV  →  WS_3_LHS  →  WS_3_NOPRIV  →  WS_3
   Only files that actually exist are opened; everything else is skipped.
*/
function buildVariants(base) {
  const flap    = state.accessFlap.toUpperCase();
  const flapOff = flap === 'NO';
  const privOff = state.privacy.toLowerCase() === 'no';
  const variants = [];

  if (!flapOff) {
    if (privOff) variants.push(`${base}_${flap}_NOPRIV`);
    variants.push(`${base}_${flap}`);
  } else {
    if (privOff) variants.push(`${base}_NOFLAP_NOPRIV`);
    variants.push(`${base}_NOFLAP`);
  }

  if (privOff) variants.push(`${base}_NOPRIV`);
  variants.push(base);
  return variants;
}

function buildImageCandidates(lk) {
  if (!lk) return [];
  return buildVariants(lk.image).map(n => `${IMAGE_DIR}${n}${IMAGE_EXT}`);
}

function buildModelCandidates(lk) {
  if (!lk) return [];
  return buildVariants(lk.image).map(n => `${MODEL_DIR}${n}${MODEL_EXT}`);
}

function buildDrawingCandidates(lk) {
  if (!lk) return [];
  return buildVariants(lk.image).map(n => `${DRAWING_DIR}${n}${DRAWING_EXT}`);
}

function loadPreviewImage(lk, onSuccess, onFail) {
  const candidates = buildImageCandidates(lk);
  if (candidates.length === 0) { onFail(); return; }

  let i = 0;
  function tryNext() {
    if (i >= candidates.length) { onFail(); return; }
    const src = candidates[i++];
    fetch(src, { method: 'HEAD' })
      .then(res => { if (res.ok) { onSuccess(src); } else { tryNext(); } })
      .catch(() => {
        // file:// protocol blocks HEAD requests; assume file present and let embed handle it
        onSuccess(src);
      });
  }
  tryNext();
}

/* ===================== STAGE ILLUSTRATION ===================== */
function drawStage(fs, person, clusters, lk) {
  const stage = document.getElementById('stage');

  loadPreviewImage(lk,
    (src) => {
      stage.innerHTML = `<embed src="${src}" type="application/pdf" style="width:100%;height:100%;position:absolute;top:0;left:0;border:none;" title="${lk ? lk.image : 'preview'}">`;
    },
    () => {
      drawProceduralStage(stage, fs, person, clusters);
    }
  );
}

function drawProceduralStage(stage, fs, person, clusters) {
  const n = fs ? 1 : Math.max(2, Math.min(6, person));
  const w = 640, h = 420;
  let tops = '';
  const topW = 130, topH = 56, gapY = fs ? 0 : 14;
  const startX = w / 2 - topW / 2;
  const colCount = fs ? 1 : 2;
  const rowCount = fs ? 1 : Math.ceil(n / 2);
  const totalH = rowCount * topH + (rowCount - 1) * gapY;
  let startY = h / 2 - totalH / 2;

  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < colCount; c++) {
      const idx = r * colCount + c;
      if (idx >= n) continue;
      const x = c === 0 ? startX - 110 : startX + 110;
      const y = startY + r * (topH + gapY);
      tops += `
        <g transform="translate(${x},${y})">
          <rect x="0" y="0" width="${topW}" height="${topH}" rx="3" fill="#caa06a" stroke="#8a6a3e" stroke-width="2"/>
          <rect x="0" y="0" width="${topW}" height="10" fill="#dcb784" opacity=".6"/>
          <rect x="${topW / 2 - 3}" y="${topH}" width="6" height="34" fill="#6b7680"/>
          <rect x="6" y="${topH + 30}" width="${topW - 12}" height="8" rx="2" fill="#3a4a5c"/>
        </g>`;
    }
    if (!fs) {
      tops += `<rect x="${startX - 4}" y="${startY + r * (topH + gapY) - 4}" width="${topW + 8}" height="${topH + 8}" fill="none" stroke="#0f6e6a" stroke-width="1.5" stroke-dasharray="3 3" opacity=".35"/>`;
    }
  }

  let spine = '';
  if (!fs) {
    spine = `<rect x="${w / 2 - 6}" y="${startY - 10}" width="12" height="${totalH + 20}" fill="#1b2430" opacity=".15"/>`;
  }

  stage.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#d8dee4" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#grid)"/>
      ${spine}
      ${tops}
      <text x="16" y="${h - 16}" font-family="JetBrains Mono, monospace" font-size="11" fill="#8a98a6">
        ${fs ? 'FREE STANDING — 1 UNIT' : person + '-PERSON BACK TO BACK — ' + clusters + ' CLUSTER(S)'}
      </text>
    </svg>
  `;
}

/* ===================== SHOP DRAWING FILENAME BUILDER ===================== */
function buildShopDwgFilename(lk, fs) {
  let typeTag     = fs ? 'FST' : 'BTB';
  let personTag   = fs ? '' : `_${state.person}P`;
  if (state.motionSubType === 'LTYPE') typeTag = 'LT_' + typeTag;          // Linear names stay as they were
  if (state.motionSubType === '120DEG') { typeTag = '120DEG'; personTag = `_${state.person}P`; }
  const flap      = state.accessFlap.toUpperCase();
  const flapTag   = flap === 'NO' ? 'NOFLAP' : flap;
  const privTag   = state.privacy.toLowerCase() === 'no' ? 'NOPRIV' : 'PRIV';
  return `SHOP_DWG_${typeTag}${personTag}_${flapTag}_${privTag}` +
         `_L${state.length}_D${state.depth}_H${state.height}.dxf`;
}
