/* ===================== TOAST ===================== */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._tm);
  showToast._tm = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ===================== EVENTS ===================== */
function initEvents() {

  /* ---- Product Hub ---- */
  document.querySelectorAll('.ph-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeProduct = btn.dataset.product;
      render();
    });
  });

  /* ---- Cluster +/- ---- */
  document.getElementById('clusterMinus').addEventListener('click', () => {
    state.clusters = Math.max(1, state.clusters - 1); render();
  });
  document.getElementById('clusterPlus').addEventListener('click', () => {
    state.clusters = state.clusters + 1; render();
  });
  document.getElementById('clusterInput').addEventListener('change', (e) => {
    const v = parseInt(e.target.value, 10);
    state.clusters = isNaN(v) || v < 1 ? 1 : v;
    render();
  });

  /* ---- Project Info fields ---- */
  document.querySelectorAll('[data-pi]').forEach(inp => {
    inp.addEventListener('input', e => {
      window.projectInfo[e.target.dataset.pi] = e.target.value;
    });
  });

  /* ---- HUB panel clicks (delegated) ---- */
  document.getElementById('hubGrid').addEventListener('click', e => {
    const hubBtn = e.target.closest('[data-hub]');
    if (hubBtn) {
      state.hubProduct = hubBtn.dataset.hub;
      const prd = HUB_PRODUCTS.find(p => p.id === state.hubProduct);
      state.hubVariant = prd && prd.variants.length > 0 ? prd.variants[0] : null;
      renderHubPanel();
      return;
    }
    const varBtn = e.target.closest('[data-variant]');
    if (varBtn) {
      state.hubVariant = varBtn.dataset.variant;
      renderHubPanel();
    }
  });

  /* ---- View 3D Model ---- */
  document.getElementById('viewModelBtn').addEventListener('click', () => {
    const fs = isFS();
    const lk = fs
      ? LOOKUP.find(l => l.type.toLowerCase() === 'free standing workstation')
      : LOOKUP.find(l => l.type.toLowerCase() === 'back to back workstation' && Number(l.option) === Number(state.person));

    if (!lk) { showToast('No model mapped for this configuration'); return; }

    const candidates = buildModelCandidates(lk);
    if (candidates.length === 0) { showToast('No model mapped for this configuration'); return; }

    const primaryModelName = candidates[0].split('/').pop();
    let i = 0;
    function tryNextModel() {
      if (i >= candidates.length) { showToast(`Model file not found: ${primaryModelName}`); return; }
      const url = candidates[i++];
      fetch(url, { method: 'HEAD' })
        .then(res => { if (res.ok) window.open(url, '_blank'); else tryNextModel(); })
        .catch(() => { window.open(candidates[0], '_blank'); });
    }
    tryNextModel();
  });

  /* ---- Export BOM ---- */
  document.getElementById('exportBtn').addEventListener('click', async () => {
    showToast('Preparing formatted BOM…');
    try {
      const bomRows   = buildBOM().filter(r => !r.na);
      const pi        = window.projectInfo;
      const userEdits = window.bomUserEdits;
      const ExcelJS   = window.ExcelJS;
      const wb        = new ExcelJS.Workbook();
      const ws        = wb.addWorksheet('SPACE WOOD ITEMWISE BOM');

      ws.columns = [
        {width:5.57},{width:7.14},{width:10.29},{width:19.29},{width:19.71},{width:65.0},
        {width:8.43},{width:18.43},{width:7.86},{width:8.29},{width:8.43},{width:6.43},
        {width:5.57},{width:5.57},{width:5.57},{width:5.57},{width:5.57},{width:5.57},
        {width:16.29},{width:5.57},{width:6.0},{width:6.0},{width:7.71},{width:10.14},
        {width:8.0},{width:32.0}
      ];

      const arial8Bold   = { name:'Arial', size:8,  bold:true };
      const arial10      = { name:'Arial', size:10,  bold:false };
      const arial10Bold  = { name:'Arial', size:10,  bold:true };
      const centerMiddle = { horizontal:'center', vertical:'middle' };
      const leftMiddle   = { horizontal:'left',   vertical:'middle' };
      const MED          = { style:'medium', color:{ argb:'FF000000' } };
      const THN          = { style:'thin',   color:{ argb:'FF000000' } };
      const NO_FILL      = { type:'pattern', pattern:'none' };
      const YELLOW_FILL  = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFFFFF00' } };
      const RED_FONT8    = { name:'Arial', size:8, bold:true, color:{ argb:'FFFF0000' } };

      ws.getRow(1).height = 37.5;
      ws.getRow(2).height = 6.75;

      try {
        const logoResp = await fetch('./sos_logo.png');
        if (logoResp.ok) {
          const logoBuf = await logoResp.arrayBuffer();
          const logoId  = wb.addImage({ buffer: logoBuf, extension: 'png' });
          ws.addImage(logoId, { tl:{ col:0, row:0, colOff:0, rowOff:0 }, ext:{ width:231, height:49 }, editAs:'oneCell' });
        }
      } catch(e) {}

      const projFields = [
        { left:`NAME OF PROJECT :(50)`,          value: pi.projectName,       mid:'ZERO DATE :(10)',                right: pi.zeroDate       },
        { left:`ZOHO NUMBER. :(14)`,             value: pi.zohoNumber,        mid:'BOM RELEASE DATE :(10)',         right: pi.bomReleaseDate  },
        { left:`NAME OF DEALER :(50)`,           value: pi.dealerName,        mid:'REVISED BOM RELEASE DATE :(10)', right: pi.revisedBomDate  },
        { left:`PO NUMBER:(20)`,                 value: pi.poNumber,          mid: null,                            right: null               },
        { left:`PO DATE:(10)`,                   value: pi.poDate,            mid: null,                            right: null               },
      ];

      projFields.forEach(({ left, value, mid, right }, idx) => {
        const r = idx + 3;
        ws.getRow(r).height = 15;

        ws.mergeCells(r, 1, r, 4);
        const cA = ws.getCell(r, 1);
        cA.value = left; cA.font = arial10Bold; cA.alignment = leftMiddle;
        cA.border = { top:MED, bottom:MED, left:MED, right:MED };

        // E:F merged — holds user value
        ws.mergeCells(r, 5, r, 6);
        const cEF = ws.getCell(r, 5);
        cEF.value = value || '';
        cEF.font = arial10; cEF.alignment = leftMiddle;
        cEF.border = { top:MED, bottom:MED, left:MED, right:MED };

        if (mid) {
          const cH = ws.getCell(r, 8);
          cH.value = mid; cH.font = arial8Bold; cH.alignment = leftMiddle;
          cH.border = { top:MED, bottom:MED, left:MED };
          const cI = ws.getCell(r, 9);
          cI.value = right || 'MMDDYY'; cI.font = arial8Bold; cI.alignment = centerMiddle;
          cI.border = { top:MED, bottom:MED, left:MED, right:MED };
        }
      });

      ws.getRow(8).height = 8;

      const HDR_LABELS = [
        'S.N.','CLST CODE','PRODUCT FLAG','PRODUCT CODE','BILLING CODE',
        'PRODUCT DESCRIPTION','COLOR CODE','COLOR DESCRIPTION','THICKNES',
        'WIDTH','HEIGHT','DEPTH','QTY','COL2','COL3','COL4','COL5','COL6',
        'DWG NO.','DWG REV','PROJ DWG','PROJ DWG REV','LP','AMOUNT','VENDOR','REMARK'
      ];
      const YELLOW_HDR_COLS = new Set([2, 3, 20, 21, 22]);

      HDR_LABELS.forEach((label, i) => {
        const colIdx = i + 1;
        const cell   = ws.getCell(9, colIdx);
        cell.value     = label;
        cell.font      = YELLOW_HDR_COLS.has(colIdx) ? RED_FONT8 : arial8Bold;
        cell.fill      = YELLOW_HDR_COLS.has(colIdx) ? YELLOW_FILL : NO_FILL;
        cell.alignment = { horizontal:'center', vertical:'middle', wrapText:true };
        cell.border    = { top:THN, bottom:THN, left:THN, right:THN };
      });
      ws.getRow(9).height = 33.75;

      const YELLOW_DATA_COLS = new Set([2, 3, 20, 21, 22]);
      const firstDataRow = 10;

      bomRows.forEach((r, i) => {
        const rowNum = firstDataRow + i;
        ws.getRow(rowNum).height = 27;

        const autoData = { 1: i+1, 4: r.code, 5: r.code, 6: r.desc, 13: r.qty, 19: r.drawing };

        for (let col = 1; col <= 26; col++) {
          const cell     = ws.getCell(rowNum, col);
          const isYellow = YELLOW_DATA_COLS.has(col);
          cell.font      = arial10;
          cell.fill      = isYellow ? YELLOW_FILL : NO_FILL;
          cell.alignment = { horizontal: col === 6 ? 'left' : 'center', vertical:'middle', wrapText: col === 6 };
          cell.border    = { top:THN, bottom:THN, left:THN, right:THN };

          if (col in autoData) {
            cell.value = autoData[col];
          } else {
            const editKey = `${i}-${col}`;
            const editVal = userEdits[editKey] || '';
            if (editVal) cell.value = editVal;
          }
        }
      });

      const lastDataRow  = firstDataRow + bomRows.length - 1;
      const summaryStart = lastDataRow + 1;
      const sR           = summaryStart;

      const summaryItems = [
        { label:'TOTAL BASIC VALUE',             sideLabel:'Electrical Cut-outs required :(1)', formula:`SUM(X${firstDataRow}:X${lastDataRow})`,  prefillE:null },
        { label:'DISCOUNT % ',                   sideLabel:'Fabric to be supplied by :(8)',     formula:`X${sR}*E${sR+1}`,                        prefillE:0    },
        { label:'FINAL BASIC (AFTER DISCOUNT)',  sideLabel:'Glass to be supplied by :(8)',      formula:`X${sR}-X${sR+1}`,                        prefillE:null },
        { label:'GST',                           sideLabel:null,                                formula:`X${sR+2}*E${sR+3}`,                      prefillE:0.18 },
        { label:'INSTALLATION & TRANSPORTATION', sideLabel:null,                                formula:`X${sR+2}*E${sR+4}`,                      prefillE:0    },
        { label:'OCTROI',                        sideLabel:null,                                formula:null,                                      prefillE:null },
        { label:'TOTAL ORDER VALUE (12)',         sideLabel:null,                                formula:`SUM(X${sR+2}:X${sR+5})`,                 prefillE:null },
      ];
      const formulaCol = 6;

      summaryItems.forEach((item, idx) => {
        const rowNum = sR + idx;
        ws.getRow(rowNum).height = 17.25;

        ws.mergeCells(rowNum, 1, rowNum, 4);
        const cLabel = ws.getCell(rowNum, 1);
        cLabel.value = item.label; cLabel.font = arial10Bold; cLabel.alignment = leftMiddle;
        cLabel.border = { top:THN, bottom:THN, left:THN, right:THN };

        if (item.prefillE !== null && item.prefillE !== undefined) {
          const cE = ws.getCell(rowNum, 5);
          cE.value = item.prefillE; cE.font = arial10; cE.alignment = centerMiddle;
          cE.border = { top:THN, bottom:THN, left:THN, right:THN };
        }
        if (item.formula) {
          const cF = ws.getCell(rowNum, formulaCol);
          cF.value = { formula: item.formula }; cF.font = arial10; cF.alignment = centerMiddle;
          cF.border = { top:THN, bottom:THN, left:THN, right:THN };
        }
        if (item.sideLabel) {
          const cG = ws.getCell(rowNum, 7);
          cG.value = item.sideLabel; cG.font = arial10Bold; cG.alignment = leftMiddle;
          cG.border = { top:THN, bottom:THN, left:THN, right:THN };
        }
      });

      const signRow = sR + summaryItems.length + 1;
      [['Prepared By :(12)', signRow],['Checked By :(12)', signRow+1],['Approved By :(12)', signRow+2]].forEach(([label, r]) => {
        ws.getRow(r).height = 20.25;
        const c = ws.getCell(r, 4); c.value = label; c.font = arial10Bold; c.alignment = leftMiddle;
      });

      ws.views = [{ state:'frozen', xSplit:0, ySplit:9, topLeftCell:'A10', activeCell:'A10', showGridLines:true, zoomScale:85 }];

      const subLabel  = MOTION_SUBTYPE_LABELS[state.motionSubType] || 'MOTION';
      const confLabel = (MOTION_CONFIG_LABELS[state.wsType] || state.wsType).replace(/\s+/g,'_');
      const fname     = `BOM_${subLabel.replace(/\s+/g,'_')}_${confLabel}_${state.length}x${state.depth}.xlsx`;

      const buffer = await wb.xlsx.writeBuffer();
      const blob   = new Blob([buffer], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link   = document.createElement('a');
      link.href     = URL.createObjectURL(blob);
      link.download = fname;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 5000);
      showToast('BOM exported — formatted XLSX ✓');

    } catch(err) {
      console.error('Export error:', err);
      showToast('Export failed — check console');
    }
  });

  /* ---- Download Shop Drawing (DXF) ---- */
  document.getElementById('downloadDxfBtn').addEventListener('click', () => {
    const fs = isFS();
    const lk = fs
      ? LOOKUP.find(l => l.type.toLowerCase() === 'free standing workstation')
      : LOOKUP.find(l => l.type.toLowerCase() === 'back to back workstation' && Number(l.option) === Number(state.person));

    if (!lk) { showToast('No shop drawing mapped for this configuration'); return; }
    const candidates = buildDrawingCandidates(lk);
    if (candidates.length === 0) { showToast('No shop drawing mapped for this configuration'); return; }

    const url          = candidates[0];
    const downloadName = buildShopDwgFilename(lk, fs);
    showToast('Preparing shop drawing…');

    fetch(url)
      .then(res => { if (!res.ok) throw new Error('not found'); return res.blob(); })
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = downloadName;
        document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 5000);
        showToast(`Downloaded ${downloadName}`);
      })
      .catch(() => { showToast(`Shop drawing not found: ${url.split('/').pop()}`); });
  });
}
