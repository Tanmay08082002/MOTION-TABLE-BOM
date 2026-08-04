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
    btn.addEventListener('click', () => { state.activeProduct = btn.dataset.product; render(); });
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
      // trigger summary recalc if it's a summary-related field
      if (['discountPct','gstPct','installPct'].includes(e.target.id)) updateSummary();
    });
  });

  /* ---- Summary inputs ---- */
  ['discountPct','gstPct','installPct'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateSummary);
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
    if (varBtn) { state.hubVariant = varBtn.dataset.variant; renderHubPanel(); }
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
      fetch(url, { method:'HEAD' })
        .then(res => { if (res.ok) window.open(url,'_blank'); else tryNextModel(); })
        .catch(() => { window.open(candidates[0],'_blank'); });
    }
    tryNextModel();
  });

  /* ---- Export BOM — exact template format, LP removed ---- */
  document.getElementById('exportBtn').addEventListener('click', async () => {
    showToast('Preparing formatted BOM…');
    try {
      const bomRows   = buildBOM();
      const activeRows = bomRows.filter(r => !r.na);
      const pi        = window.projectInfo;
      const userEdits = window.bomUserEdits;
      const ExcelJS   = window.ExcelJS;
      const wb        = new ExcelJS.Workbook();
      wb.creator = 'SOS BOM Configurator';
      wb.created = new Date();
      const ws = wb.addWorksheet('SPACE WOOD ITEMWISE BOM');

      /* ---- Column widths matching template (LP col removed, col 23 onward shifted) ----
         Template order: A=S.N. B=CLST CODE C=PRODUCT FLAG D=PRODUCT CODE E=BILLING CODE
         F=PRODUCT DESC G=COLOR CODE H=COLOR DESC I=THICKNES J=WIDTH K=HEIGHT L=DEPTH
         M=QTY N=COL2 O=COL3 P=COL4 Q=COL5 R=COL6 S=DWG NO. T=DWG REV U=PROJ DWG
         V=PROJ DWG REV [W=LP REMOVED] W=AMOUNT X=VENDOR Y=REMARK Z=Qty
      */
      ws.columns = [
        {width:5.57},   // A  S.N.
        {width:7.14},   // B  CLST CODE
        {width:10.29},  // C  PRODUCT FLAG
        {width:19.29},  // D  PRODUCT CODE
        {width:19.71},  // E  BILLING CODE
        {width:65.0},   // F  PRODUCT DESCRIPTION
        {width:8.43},   // G  COLOR CODE
        {width:18.43},  // H  COLOR DESCRIPTION
        {width:7.86},   // I  THICKNES
        {width:8.29},   // J  WIDTH
        {width:8.43},   // K  HEIGHT
        {width:6.43},   // L  DEPTH
        {width:5.57},   // M  QTY
        {width:5.57},   // N  COL2
        {width:5.57},   // O  COL3
        {width:5.57},   // P  COL4
        {width:5.57},   // Q  COL5
        {width:5.57},   // R  COL6
        {width:16.29},  // S  DWG NO.
        {width:5.57},   // T  DWG REV
        {width:6.0},    // U  PROJ DWG
        {width:6.0},    // V  PROJ DWG REV
        {width:7.71},   // W  LP       (user-filled)
        {width:10.14},  // X  AMOUNT
        {width:8.0},    // Y  VENDOR
        {width:32.0},   // Z  REMARK
        {width:5.57},   // AA Qty
      ];

      const arial8Bold  = { name:'Arial', size:8,  bold:true  };
      const arial8Red   = { name:'Arial', size:8,  bold:true, color:{argb:'FFFF0000'} };
      const arial10     = { name:'Arial', size:10, bold:false };
      const arial10Bold = { name:'Arial', size:10, bold:true  };
      const centerMid   = { horizontal:'center', vertical:'middle', wrapText:false };
      const leftMid     = { horizontal:'left',   vertical:'middle', wrapText:false  };
      const centerMidW  = { horizontal:'center', vertical:'middle', wrapText:true   };
      const leftMidW    = { horizontal:'left',   vertical:'middle', wrapText:true   };
      const MED = { style:'medium', color:{argb:'FF000000'} };
      const THN = { style:'thin',   color:{argb:'FF000000'} };
      const NO_FILL     = { type:'pattern', pattern:'none' };
      const YELLOW_FILL = { type:'pattern', pattern:'solid', fgColor:{argb:'FFFFFF00'} };

      // ---- ROW 1: Logo / Title ----
      ws.getRow(1).height = 37.5;
      ws.mergeCells('A1:Z1');
      const titleCell = ws.getCell('A1');
      titleCell.value = 'SPACE WOOD ITEMWISE BOM';
      titleCell.font  = { name:'Arial', size:14, bold:true };
      titleCell.alignment = { horizontal:'center', vertical:'middle' };
      titleCell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF1D3040'} };
      titleCell.font = { name:'Arial', size:14, bold:true, color:{argb:'FFFFFFFF'} };

      try {
        const logoResp = await fetch('./sos_logo.png');
        if (logoResp.ok) {
          const logoBuf = await logoResp.arrayBuffer();
          const logoId  = wb.addImage({ buffer:logoBuf, extension:'png' });
          ws.addImage(logoId, { tl:{col:0,row:0,colOff:0,rowOff:0}, ext:{width:231,height:49}, editAs:'oneCell' });
        }
      } catch(e) {}

      // ---- ROW 2: spacer ----
      ws.getRow(2).height = 6.75;

      // ---- ROWS 3-7: Project Info ----
      const projFields = [
        { left:'NAME OF PROJECT :(50)',          value: pi.projectName,    mid:'ZERO DATE :(10)',                right: pi.zeroDate       },
        { left:'ZOHO NUMBER. :(14)',             value: pi.zohoNumber,     mid:'BOM RELEASE DATE :(10)',         right: pi.bomReleaseDate  },
        { left:'NAME OF DEALER :(50)',           value: pi.dealerName,     mid:'REVISED BOM RELEASE DATE :(10)', right: pi.revisedBomDate  },
        { left:'PO NUMBER:(20)',                 value: pi.poNumber,       mid: null,                            right: null               },
        { left:'PO DATE:(10)',                   value: pi.poDate,         mid: null,                            right: null               },
      ];

      projFields.forEach(({ left, value, mid, right }, idx) => {
        const r = idx + 3;
        ws.getRow(r).height = 15;
        ws.mergeCells(r, 1, r, 4);
        const cA = ws.getCell(r, 1);
        cA.value = left; cA.font = arial10Bold; cA.alignment = leftMid;
        cA.border = { top:MED, bottom:MED, left:MED, right:MED };

        ws.mergeCells(r, 5, r, 6);
        const cEF = ws.getCell(r, 5);
        cEF.value = value || ''; cEF.font = arial10; cEF.alignment = leftMid;
        cEF.border = { top:MED, bottom:MED, left:MED, right:MED };

        if (mid) {
          const cH = ws.getCell(r, 8);
          cH.value = mid; cH.font = arial8Bold; cH.alignment = leftMid;
          cH.border = { top:MED, bottom:MED, left:MED };
          const cI = ws.getCell(r, 9);
          cI.value = right || 'MMDDYY'; cI.font = arial8Bold; cI.alignment = centerMid;
          cI.border = { top:MED, bottom:MED, left:MED, right:MED };
        }
      });

      // ---- ROW 8: spacer ----
      ws.getRow(8).height = 8;

      // ---- ROW 9: Header (LP removed — 26 cols) ----
      const HDR_LABELS = [
        'S.N.','CLST CODE','PRODUCT FLAG','PRODUCT CODE','BILLING CODE',
        'PRODUCT DESCRIPTION','COLOR CODE','COLOR DESCRIPTION','THICKNES',
        'WIDTH','HEIGHT','DEPTH','QTY','COL2','COL3','COL4','COL5','COL6',
        'DWG NO.','DWG REV','PROJ DWG','PROJ DWG REV',
        'LP','AMOUNT','VENDOR','REMARK','Qty'
      ];
      // Yellow+red: CLST CODE(2), PRODUCT FLAG(3), COL2-6(14-18), DWG REV(20), PROJ DWG(21), PROJ DWG REV(22)
      const YELLOW_HDR = new Set([2,3,14,15,16,17,18,20,21,22]);

      HDR_LABELS.forEach((label, i) => {
        const colIdx = i + 1;
        const cell   = ws.getCell(9, colIdx);
        cell.value     = label;
        cell.font      = YELLOW_HDR.has(colIdx) ? arial8Red : arial8Bold;
        cell.fill      = YELLOW_HDR.has(colIdx) ? YELLOW_FILL : NO_FILL;
        cell.alignment = centerMidW;
        cell.border    = { top:THN, bottom:THN, left:THN, right:THN };
      });
      ws.getRow(9).height = 33.75;

      // ---- DATA ROWS (start row 10) ----
      const YELLOW_DATA = new Set([2,3,14,15,16,17,18,20,21,22]);
      const firstDataRow = 10;

      activeRows.forEach((r, i) => {
        const rowNum = firstDataRow + i;
        ws.getRow(rowNum).height = 27;

        // Map HTML col positions to xlsx col positions (same, LP already removed)
        // Col 1=SN,4=PROD CODE,5=BILLING CODE,6=DESC,13=QTY,19=DWG NO.,26=Qty
        const autoData = {
          1:  i + 1,
          4:  r.code,
          5:  r.code,
          6:  r.desc,
          13: r.qty,
          19: r.drawing,
          27: r.qty,
        };

        for (let col = 1; col <= 27; col++) {
          const cell     = ws.getCell(rowNum, col);
          const isYellow = YELLOW_DATA.has(col);
          cell.font      = arial10;
          cell.fill      = isYellow ? YELLOW_FILL : NO_FILL;
          cell.alignment = col === 6 ? leftMidW : centerMid;
          cell.border    = { top:THN, bottom:THN, left:THN, right:THN };

          if (col in autoData) {
            cell.value = autoData[col];
          } else {
            // Find original rowIdx in full bomRows array
            const origIdx = bomRows.findIndex((br, bi) => {
              let activeCount = -1;
              for (let k = 0; k <= bi; k++) { if (!bomRows[k].na) activeCount++; }
              return activeCount === i && !br.na;
            });
            const editKey = `${origIdx >= 0 ? origIdx : i}-${col}`;
            const editVal = userEdits[editKey] || '';
            if (editVal) cell.value = editVal;
          }
        }
      });

      const lastDataRow  = firstDataRow + activeRows.length - 1;
      const sR           = lastDataRow + 1;

      // ---- SUMMARY ROWS ----
      // Read live values from UI
      const discPctRaw  = parseFloat(document.getElementById('discountPct')?.value || '0') / 100;
      const gstPctRaw   = parseFloat(document.getElementById('gstPct')?.value || '0.18');
      const instPctRaw  = parseFloat(document.getElementById('installPct')?.value || '0');

      const summaryItems = [
        { label:'TOTAL BASIC VALUE',             sideLabel: pi.electricalCutouts ? `Electrical Cut-outs required :(1) ${pi.electricalCutouts}` : 'Electrical Cut-outs required :(1)', formula:`SUM(X${firstDataRow}:X${lastDataRow})`, prefillE: null },
        { label:'DISCOUNT % ',                   sideLabel: pi.fabricSuppliedBy  ? `Fabric to be supplied by :(8) ${pi.fabricSuppliedBy}`      : 'Fabric to be supplied by :(8)',       formula:`X${sR}*E${sR}`,                     prefillE: discPctRaw },
        { label:'FINAL BASIC (AFTER DISCOUNT)',  sideLabel: pi.glassSuppliedBy   ? `Glass to be supplied by :(8) ${pi.glassSuppliedBy}`        : 'Glass to be supplied by :(8)',        formula:`X${sR}-X${sR+1}`,                   prefillE: null },
        { label:'GST',                           sideLabel: null, formula:`X${sR+2}*E${sR+3}`, prefillE: gstPctRaw  },
        { label:'INSTALLATION & TRANSPORTATION', sideLabel: null, formula:`X${sR+2}*E${sR+4}`, prefillE: instPctRaw },
        { label:'OCTROI',                        sideLabel: null, formula: null,                prefillE: null },
        { label:'TOTAL ORDER VALUE (12)',         sideLabel: null, formula:`SUM(X${sR+2}:X${sR+5})`, prefillE: null },
      ];

      summaryItems.forEach((item, idx) => {
        const rowNum = sR + idx;
        ws.getRow(rowNum).height = 17.25;

        ws.mergeCells(rowNum, 1, rowNum, 4);
        const cLabel = ws.getCell(rowNum, 1);
        cLabel.value = item.label; cLabel.font = arial10Bold; cLabel.alignment = leftMid;
        cLabel.border = { top:THN, bottom:THN, left:THN, right:THN };

        if (item.prefillE !== null && item.prefillE !== undefined) {
          const cE = ws.getCell(rowNum, 5);
          cE.value = item.prefillE; cE.font = arial10; cE.alignment = centerMid;
          cE.border = { top:THN, bottom:THN, left:THN, right:THN };
        }
        if (item.formula) {
          const cW = ws.getCell(rowNum, 24); // AMOUNT col = col 24 (X), LP is col 23 (W)
          cW.value = { formula: item.formula }; cW.font = arial10; cW.alignment = centerMid;
          cW.border = { top:THN, bottom:THN, left:THN, right:THN };
        }
        if (item.sideLabel) {
          const cG = ws.getCell(rowNum, 7);
          cG.value = item.sideLabel; cG.font = arial10Bold; cG.alignment = leftMid;
          cG.border = { top:THN, bottom:THN, left:THN, right:THN };
        }
      });

      // ---- SIGN-OFF ROWS ----
      const signStart = sR + summaryItems.length + 1;
      [
        ['Prepared By :(12)',  pi.preparedBy  || '', signStart    ],
        ['Checked By :(12)',   pi.checkedBy   || '', signStart + 1],
        ['Approved By :(12)',  pi.approvedBy  || '', signStart + 2],
      ].forEach(([label, value, rn]) => {
        ws.getRow(rn).height = 20.25;
        const c = ws.getCell(rn, 4);
        c.value = label + (value ? '  ' + value : '');
        c.font = arial10Bold; c.alignment = leftMid;
      });

      // ---- FREEZE PANE & ZOOM ----
      ws.views = [{ state:'frozen', xSplit:0, ySplit:9, topLeftCell:'A10', activeCell:'A10', showGridLines:true, zoomScale:85 }];

      // ---- DOWNLOAD ----
      const subLabel  = (MOTION_SUBTYPE_LABELS[state.motionSubType] || 'MOTION').replace(/\s+/g,'_');
      const confLabel = (MOTION_CONFIG_LABELS[state.wsType] || state.wsType).replace(/\s+/g,'_');
      const fname     = `BOM_${subLabel}_${confLabel}_${state.length}x${state.depth}.xlsx`;

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

  /* ---- Download Shop Drawing ---- */
  document.getElementById('downloadDxfBtn').addEventListener('click', () => {
    const fs = isFS();
    const lk = fs
      ? LOOKUP.find(l => l.type.toLowerCase() === 'free standing workstation')
      : LOOKUP.find(l => l.type.toLowerCase() === 'back to back workstation' && Number(l.option) === Number(state.person));
    if (!lk) { showToast('No shop drawing mapped for this configuration'); return; }
    const candidates = buildDrawingCandidates(lk);
    if (candidates.length === 0) { showToast('No shop drawing mapped for this configuration'); return; }
    const url = candidates[0];
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
