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
  document.getElementById('clusterMinus').addEventListener('click', () => {
    state.clusters = Math.max(1, state.clusters - 1);
    render();
  });
  document.getElementById('clusterPlus').addEventListener('click', () => {
    state.clusters = state.clusters + 1;
    render();
  });
  document.getElementById('clusterInput').addEventListener('change', (e) => {
    const v = parseInt(e.target.value, 10);
    state.clusters = isNaN(v) || v < 1 ? 1 : v;
    render();
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
      if (i >= candidates.length) {
        showToast(`Model file not found: ${primaryModelName}`);
        console.warn('Model lookup failed. Tried:', candidates);
        return;
      }
      const url = candidates[i++];
      fetch(url, { method: 'HEAD' })
        .then(res => {
          if (res.ok) { window.open(url, '_blank'); }
          else { tryNextModel(); }
        })
        .catch(() => {
          window.open(candidates[0], '_blank');
        });
    }
    tryNextModel();
  });

  /* ---- Export BOM (SPWD Template Format with full formatting + logo) ---- */
  document.getElementById('exportBtn').addEventListener('click', async () => {
    showToast('Preparing formatted BOM…');

    try {
      const bomRows = buildBOM().filter(r => !r.na);
      const ExcelJS = window.ExcelJS;
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('SPACE WOOD ITEMWISE BOM');

      /* ── column widths ── */
      ws.columns = [
        {width:5.57},{width:7.14},{width:10.29},{width:19.29},{width:19.71},{width:65.0},
        {width:8.43},{width:18.43},{width:7.86},{width:8.29},{width:8.43},{width:6.43},
        {width:5.57},{width:5.57},{width:5.57},{width:5.57},{width:5.57},{width:5.57},
        {width:16.29},{width:5.57},{width:6.0},{width:6.0},{width:7.71},{width:10.14},
        {width:8.0},{width:32.0}
      ];

      /* ── style helpers ── */
      const arial8Bold  = { name:'Arial', size:8, bold:true };
      const arial10     = { name:'Arial', size:10, bold:false };
      const arial10Bold = { name:'Arial', size:10, bold:true };
      const centerMiddle = { horizontal:'center', vertical:'middle' };
      const leftMiddle   = { horizontal:'left',   vertical:'middle' };

      const MED        = { style:'medium', color:{ argb:'FF000000' } };
      const THN        = { style:'thin',   color:{ argb:'FF000000' } };
      const HAIR       = { style:'hair',   color:{ argb:'FF000000' } };
      const NO_FILL    = { type:'pattern', pattern:'none' };
      const YELLOW_FILL = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFFFFF00' } };
      const RED_FONT8   = { name:'Arial', size:8, bold:true, color:{ argb:'FFFF0000' } };

      /* ── rows 1-2: logo area — match template heights exactly ── */
      ws.getRow(1).height = 37.5;
      ws.getRow(2).height = 6.75;

      /* ── embed logo from sos_logo.png ── */
      /* Template size: Width=6.12cm, Height=1.29cm
         At 96 DPI: width=231px, height=49px
         Using ext (pixel-exact) so the logo is never stretched by column widths */
      try {
        const logoResp = await fetch('./sos_logo.png');
        if (logoResp.ok) {
          const logoBuf = await logoResp.arrayBuffer();
          const logoId  = wb.addImage({ buffer: logoBuf, extension: 'png' });
          ws.addImage(logoId, {
            tl:  { col: 0, row: 0, colOff: 0, rowOff: 0 },
            ext: { width: 231, height: 49 },   // 6.12cm × 1.29cm at 96 DPI
            editAs: 'oneCell'
          });
        }
      } catch(e) { /* logo not found — continue without it */ }

      /* ── rows 3-7: project info header block ── */
      /* Template structure:
         - A3:D3  = label (border left/top/bot medium, right medium)
         - E3:F3  = merged input cell (border medium all)
         - H3     = date label, I3 = 'MMDDYY' (medium border)
         Rows 6-7 have no E:F merge and no H/I date fields
      */
      const projFields = [
        { left:'NAME OF PROJECT :(50)',         mid:'ZERO DATE :(10)',               right:'MMDDYY', mergeEF: true },
        { left:'ZOHO NUMBER. :(14)',             mid:'BOM RELEASE DATE :(10)',        right:'MMDDYY', mergeEF: true },
        { left:'NAME OF DEALER :(50)',           mid:'REVISED BOM RELEASE DATE :(10)',right:'MMDDYY', mergeEF: true },
        { left:'PO NUMBER:(20)',                 mid: null,                           right: null,    mergeEF: true },
        { left:'PO DATE:(10)',                   mid: null,                           right: null,    mergeEF: true },
      ];

      projFields.forEach(({ left, mid, right, mergeEF }, idx) => {
        const r = idx + 3; // rows 3..7
        ws.getRow(r).height = 15;

        /* A3:D3 label — NOT merged in template, but bordered to span visually */
        /* We merge for clean fill matching the exported BOM convention */
        ws.mergeCells(r, 1, r, 4);
        const cA = ws.getCell(r, 1);
        cA.value     = left;
        cA.font      = arial10Bold;
        cA.alignment = leftMiddle;
        cA.border    = { top:MED, bottom:MED, left:MED, right:MED };

        /* E:F merged input cell (rows 3-5 only in template) */
        if (mergeEF) {
          ws.mergeCells(r, 5, r, 6);
          const cEF = ws.getCell(r, 5);
          cEF.border = { top:MED, bottom:MED, left:MED, right:MED };
        }

        /* H = date label, I = 'MMDDYY' (rows 3-5 only) */
        if (mid) {
          const cH = ws.getCell(r, 8);
          cH.value     = mid;
          cH.font      = arial8Bold;
          cH.alignment = leftMiddle;
          cH.border    = { top:MED, bottom:MED, left:MED };

          const cI = ws.getCell(r, 9);
          cI.value     = right;
          cI.font      = arial8Bold;
          cI.alignment = centerMiddle;
          cI.border    = { top:MED, bottom:MED, left:MED, right:MED };
        }
      });

      /* ── row 8: blank spacer ── */
      ws.getRow(8).height = 8;

      /* ── row 9: column headers — match template height 33.75 ── */
      const HDR_LABELS = [
        'S.N.','CLST CODE','PRODUCT FLAG','PRODUCT CODE','BILLING CODE',
        'PRODUCT DESCRIPTION','COLOR CODE','COLOR DESCRIPTION','THICKNES',
        'WIDTH','HEIGHT','DEPTH','QTY','COL2','COL3','COL4','COL5','COL6',
        'DWG NO.','DWG REV','PROJ DWG','PROJ DWG REV','LP','AMOUNT','VENDOR','REMARK'
      ];
      /* Yellow fill + red text for cols B=2, C=3, T=20, U=21, V=22 */
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
      ws.getRow(9).height = 33.75; // matches template exactly

      /* ── rows 10+: BOM data — match template row height 27 ── */
      const YELLOW_DATA_COLS = new Set([2, 3, 20, 21, 22]);
      const firstDataRow = 10;

      bomRows.forEach((r, i) => {
        const rowNum = firstDataRow + i;
        ws.getRow(rowNum).height = 27; // matches template exactly

        for (let col = 1; col <= 26; col++) {
          const cell     = ws.getCell(rowNum, col);
          const isYellow = YELLOW_DATA_COLS.has(col);
          cell.font      = arial10;
          cell.fill      = isYellow ? YELLOW_FILL : NO_FILL;
          cell.alignment = { horizontal:'center', vertical:'middle', wrapText: col === 6 };
          cell.border    = { top:THN, bottom:THN, left:THN, right:THN };
        }

        ws.getCell(rowNum, 1).value  = i + 1;      // S.N.
        ws.getCell(rowNum, 4).value  = r.code;     // PRODUCT CODE
        ws.getCell(rowNum, 5).value  = r.code;     // BILLING CODE
        ws.getCell(rowNum, 6).value  = r.desc;     // PRODUCT DESCRIPTION
        ws.getCell(rowNum, 6).alignment = { horizontal:'left', vertical:'middle', wrapText:true };
        ws.getCell(rowNum, 13).value = r.qty;      // QTY (col M)
        ws.getCell(rowNum, 19).value = r.drawing;  // DWG NO.
      });

      /* ── summary rows — match template: A:D merged, height 17.25 ── */
      const lastDataRow  = firstDataRow + bomRows.length - 1;
      const summaryStart = lastDataRow + 1;

      /* Template formula reference:
         summaryStart+0 = TOTAL BASIC VALUE     → F = SUM(X data range)
         summaryStart+1 = DISCOUNT %            → E = 0 (rate), F = F_total * E_discount
         summaryStart+2 = FINAL BASIC           → F = F_total - F_discount
         summaryStart+3 = GST                   → E = 0.18, F = F_final * E_gst
         summaryStart+4 = INSTALLATION          → E = 0,    F = F_final * E_install
         summaryStart+5 = OCTROI                → (no formula)
         summaryStart+6 = TOTAL ORDER VALUE     → F = SUM(F_final : F_octroi)
      */
      const sR = summaryStart; // shorthand
      const summaryItems = [
        { label:'TOTAL BASIC VALUE',            sideLabel:'Electrical Cut-outs required :(1)', formula:`SUM(X${firstDataRow}:X${lastDataRow})`,      prefillE: null },
        { label:'DISCOUNT % ',                  sideLabel:'Fabric to be supplied by :(8)',     formula:`X${sR}*E${sR+1}`,                            prefillE: 0 },
        { label:'FINAL BASIC (AFTER DISCOUNT)', sideLabel:'Glass to be supplied by :(8)',      formula:`X${sR}-X${sR+1}`,                            prefillE: null },
        { label:'GST',                          sideLabel: null,                              formula:`X${sR+2}*E${sR+3}`,                           prefillE: 0.18 },
        { label:'INSTALLATION & TRANSPORTATION',sideLabel: null,                              formula:`X${sR+2}*E${sR+4}`,                           prefillE: 0 },
        { label:'OCTROI',                       sideLabel: null,                              formula: null,                                          prefillE: null },
        { label:'TOTAL ORDER VALUE (12)',        sideLabel: null,                              formula:`SUM(X${sR+2}:X${sR+5})`,                      prefillE: null },
      ];

      // Use column F (6) for all formulas — matching template column F
      const formulaCol = 6;

      summaryItems.forEach((item, idx) => {
        const rowNum = sR + idx;
        ws.getRow(rowNum).height = 17.25; // matches template exactly

        /* Merge A:D for label — matches template A19:D19 etc. */
        ws.mergeCells(rowNum, 1, rowNum, 4);
        const cLabel = ws.getCell(rowNum, 1);
        cLabel.value     = item.label;
        cLabel.font      = arial10Bold;
        cLabel.alignment = leftMiddle;
        cLabel.border    = { top:THN, bottom:THN, left:THN, right:THN };

        /* E — prefill value if needed */
        if (item.prefillE !== null && item.prefillE !== undefined) {
          const cE = ws.getCell(rowNum, 5);
          cE.value     = item.prefillE;
          cE.font      = arial10;
          cE.alignment = centerMiddle;
          cE.border    = { top:THN, bottom:THN, left:THN, right:THN };
        }

        /* F — formula */
        if (item.formula) {
          const cF = ws.getCell(rowNum, formulaCol);
          cF.value     = { formula: item.formula };
          cF.font      = arial10;
          cF.alignment = centerMiddle;
          cF.border    = { top:THN, bottom:THN, left:THN, right:THN };
        }

        /* G — side label */
        if (item.sideLabel) {
          const cG = ws.getCell(rowNum, 7);
          cG.value     = item.sideLabel;
          cG.font      = arial10Bold;
          cG.alignment = leftMiddle;
          cG.border    = { top:THN, bottom:THN, left:THN, right:THN };
        }
      });

      /* ── sign-off rows — match template height 20.25 ── */
      const signRow = sR + summaryItems.length + 1;
      [
        ['Prepared By :(12)', signRow],
        ['Checked By :(12)',  signRow + 1],
        ['Approved By :(12)', signRow + 2]
      ].forEach(([label, r]) => {
        ws.getRow(r).height = 20.25; // matches template exactly
        const c = ws.getCell(r, 4);
        c.value     = label;
        c.font      = arial10Bold;
        c.alignment = leftMiddle;
      });

      /* ── sheet view: freeze header row, professional display ── */
      ws.views = [{
        state:          'frozen',
        xSplit:         0,
        ySplit:         9,            // freeze rows 1-9 (logo + info + header)
        topLeftCell:    'A10',
        activeCell:     'A10',
        showGridLines:  true,
        zoomScale:      85            // 85% zoom fits the wide sheet nicely
      }];

      /* ── write and download ── */
      const fname   = `BOM_${state.wsType.replace(/\s+/g,'_')}_${state.length}x${state.depth}.xlsx`;
      const buffer  = await wb.xlsx.writeBuffer();
      const blob    = new Blob([buffer], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link    = document.createElement('a');
      link.href     = URL.createObjectURL(blob);
      link.download = fname;
      document.body.appendChild(link);
      link.click();
      link.remove();
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
      .then(res => {
        if (!res.ok) throw new Error('not found');
        return res.blob();
      })
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 5000);
        showToast(`Downloaded ${downloadName}`);
      })
      .catch(() => {
        showToast(`Shop drawing not found: ${url.split('/').pop()}`);
      });
  });
}
