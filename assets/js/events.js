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

  /* ---- Export BOM — loads actual template, writes data into it ---- */
  document.getElementById('exportBtn').addEventListener('click', async () => {
    showToast('Preparing formatted BOM…');
    try {
      const bomRows    = buildBOM();
      const activeRows = bomRows.filter(r => !r.na);
      const pi         = window.projectInfo;
      const userEdits  = window.bomUserEdits;
      const ExcelJS    = window.ExcelJS;

      /* ---- Load the real template from disk ---- */
      const tmplResp = await fetch('./assets/template/Bill_of_Material_Template.xlsx');
      if (!tmplResp.ok) throw new Error('Template file not found');
      const tmplBuf  = await tmplResp.arrayBuffer();

      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(tmplBuf);
      const ws = wb.getWorksheet('SPACE WOOD ITEMWISE BOM');
      if (!ws) throw new Error('Sheet not found in template');

      /* --------------------------------------------------------
         TEMPLATE STRUCTURE (from inspection):
         Row  1  : Logo / Title bar  (already in template)
         Row  2  : Spacer
         Rows 3-7: Project info fields  A1:D = label, E:F = value, H = date label, I = date value
         Row  8  : Spacer
         Row  9  : Column headers  (A–AA, 27 cols; AA = Qty)
         Rows 10–18: 9 sample data rows  → we CLEAR & REWRITE from row 10
         Row 19  : "TOTAL BASIC VALUE" summary row
         Rows 20-25: More summary rows
         --------------------------------------------------------

         Our strategy:
         1. Write project info into rows 3-7 (preserving border/fill of label cells).
         2. Clear rows 10–18 (the 9 template sample rows).
         3. Insert our data rows starting at row 10, copying style from template row 10.
         4. Move/rewrite the summary rows (19+) to immediately follow the last data row.
         5. Preserve everything else (logo cell in row 1, column widths, etc.)
      -------------------------------------------------------- */

      /* Helper: copy cell style from source cell to dest cell (same worksheet, different row) */
      function copyCellStyle(srcCell, dstCell) {
        if (srcCell.style) {
          dstCell.style = JSON.parse(JSON.stringify(srcCell.style));
        }
      }

      /* ---- STEP 1: Fill project info rows 3-7 ---- */
      // Row 3: NAME OF PROJECT / ZERO DATE
      const r3valCell = ws.getCell('E3');
      r3valCell.value = pi.projectName || '';
      const r3dateCell = ws.getCell('I3');
      r3dateCell.value = pi.zeroDate || 'MMDDYY';

      // Row 4: ZOHO NUMBER / BOM RELEASE DATE
      ws.getCell('E4').value = pi.zohoNumber || '';
      ws.getCell('I4').value = pi.bomReleaseDate || 'MMDDYY';

      // Row 5: NAME OF DEALER / REVISED BOM RELEASE DATE
      ws.getCell('E5').value = pi.dealerName || '';
      ws.getCell('I5').value = pi.revisedBomDate || 'MMDDYY';

      // Row 6: PO NUMBER
      ws.getCell('E6').value = pi.poNumber || '';

      // Row 7: PO DATE
      ws.getCell('E7').value = pi.poDate || '';

      /* ---- STEP 2: Snapshot template row 10 style (data row prototype) ---- */
      // We'll use this as the style reference for new data rows
      const templateDataRow = 10;  // first data row in template

      /* ---- STEP 3: Clear template data rows 10-18 ---- */
      // Template has 9 sample rows (rows 10-18). We clear their values.
      // Keep styles intact for the rows we will reuse; clear extra rows.
      for (let r = templateDataRow; r <= 18; r++) {
        ws.getRow(r).eachCell({ includeEmpty: false }, cell => {
          cell.value = null;
        });
      }

      /* ---- STEP 4: Determine how many data rows we need ---- */
      const numDataRows  = activeRows.length;
      const firstDataRow = templateDataRow;  // always starts at row 10
      const lastDataRow  = firstDataRow + numDataRows - 1;

      /* ---- STEP 5: If we have MORE rows than template (>9), insert new rows ---- */
      // ExcelJS spliceRows inserts empty rows; we copy style from row 10.
      if (numDataRows > 9) {
        // Insert (numDataRows - 9) rows after row 18
        const extraRows = numDataRows - 9;
        ws.spliceRows(19, 0, ...Array(extraRows).fill([]));
        // Apply data row style to the newly inserted rows
        for (let r = 19; r <= firstDataRow + numDataRows - 1; r++) {
          const srcRow = ws.getRow(templateDataRow);
          ws.getRow(r).height = 27;
          // Copy cell-by-cell from template row 10 pattern
          for (let c = 1; c <= 27; c++) {
            const srcCell = srcRow.getCell(c);
            const dstCell = ws.getRow(r).getCell(c);
            copyCellStyle(srcCell, dstCell);
          }
        }
      } else if (numDataRows < 9) {
        // We have fewer rows than template — delete surplus template rows
        const surplus = 9 - numDataRows;
        ws.spliceRows(firstDataRow + numDataRows, surplus);
      }

      /* ---- STEP 6: Write data into rows 10..lastDataRow ---- */
      /*
        Template column mapping (from inspection of template row 9 headers):
        Col A(1)  = S.N.
        Col B(2)  = CLST CODE       (yellow fill, red font)
        Col C(3)  = PRODUCT FLAG    (yellow fill, red font)
        Col D(4)  = PRODUCT CODE
        Col E(5)  = BILLING CODE
        Col F(6)  = PRODUCT DESCRIPTION
        Col G(7)  = COLOR CODE
        Col H(8)  = COLOR DESCRIPTION
        Col I(9)  = THICKNES
        Col J(10) = WIDTH
        Col K(11) = HEIGHT
        Col L(12) = DEPTH
        Col M(13) = QTY
        Col N(14) = COL2
        Col O(15) = COL3
        Col P(16) = COL4
        Col Q(17) = COL5
        Col R(18) = COL6
        Col S(19) = DWG NO.
        Col T(20) = DWG REV         (yellow fill, red font)
        Col U(21) = PROJ DWG        (yellow fill, red font)
        Col V(22) = PROJ DWG REV    (yellow fill, red font)
        Col W(23) = LP
        Col X(24) = AMOUNT
        Col Y(25) = VENDOR
        Col Z(26) = REMARK
        Col AA(27)= Qty
      */
      activeRows.forEach((r, i) => {
        const rowNum = firstDataRow + i;
        const row = ws.getRow(rowNum);
        row.height = 27;

        // S.N.
        row.getCell(1).value = i + 1;
        // PRODUCT CODE (col D=4) — from BOM
        row.getCell(4).value = r.code;
        // BILLING CODE (col E=5) — same as product code in template
        row.getCell(5).value = r.code;
        // PRODUCT DESCRIPTION (col F=6)
        row.getCell(6).value = r.desc;
        // QTY (col M=13)
        row.getCell(13).value = r.qty;
        // DWG NO. (col S=19)
        row.getCell(19).value = r.drawing;
        // VENDOR (col Y=25) — default from template
        if (!row.getCell(25).value) row.getCell(25).value = '';
        // Qty (col AA=27) — from template default
        row.getCell(27).value = 1;

        // Apply user edits (keyed by original bomRows index + col)
        const origIdx = bomRows.findIndex((br, bi) => {
          let activeCount = -1;
          for (let k = 0; k <= bi; k++) { if (!bomRows[k].na) activeCount++; }
          return activeCount === i && !br.na;
        });
        for (let col = 1; col <= 27; col++) {
          const editKey = `${origIdx >= 0 ? origIdx : i}-${col}`;
          const editVal = userEdits[editKey];
          if (editVal) row.getCell(col).value = editVal;
        }
      });

      /* ---- STEP 7: Update summary rows which are now shifted ---- */
      // After our data rows, summary rows start at lastDataRow + 1
      // In the template these start at row 19. After splicing they are at correct positions.
      // We only need to update formulas that reference data row ranges, and fill in values.
      const sR = lastDataRow + 1;  // first summary row

      // Update TOTAL BASIC VALUE row: its F col formula and G col label
      const summaryRow0 = ws.getRow(sR);
      // Column F(6) in summary: total basic value formula
      // The template has F19 = =SUM(val_rng) — update to use actual range
      const totalCell = summaryRow0.getCell(6);
      totalCell.value = { formula: `SUM(X${firstDataRow}:X${lastDataRow})` };

      // Column G(7): Electrical cut-outs label
      const elecLabel = pi.electricalCutouts
        ? `Electrical Cut-outs required :(1) ${pi.electricalCutouts}`
        : 'Electrical Cut-outs required :(1)';
      summaryRow0.getCell(7).value = elecLabel;

      // Summary rows 2-7 (discount, final basic, GST, install, octroi, total)
      // These are at rows sR+1 through sR+6 in the shifted sheet
      // Update their formulas to reference correct row numbers
      const discPctRaw = parseFloat(document.getElementById('discountPct')?.value || '0') / 100;
      const gstPctRaw  = parseFloat(document.getElementById('gstPct')?.value || '0') || 0.18;
      const instPctRaw = parseFloat(document.getElementById('installPct')?.value || '0') / 100;

      // Row sR+1: DISCOUNT — col E = discount %, col X = formula
      const discRow = ws.getRow(sR + 1);
      discRow.getCell(5).value  = discPctRaw;
      discRow.getCell(24).value = { formula: `X${sR}*E${sR+1}` };
      const fabricLabel = pi.fabricSuppliedBy
        ? `Fabric to be supplied by :(8) ${pi.fabricSuppliedBy}`
        : 'Fabric to be supplied by :(8)';
      discRow.getCell(7).value = fabricLabel;

      // Row sR+2: FINAL BASIC
      const finalRow = ws.getRow(sR + 2);
      finalRow.getCell(24).value = { formula: `X${sR}-X${sR+1}` };
      const glassLabel = pi.glassSuppliedBy
        ? `Glass to be supplied by :(8) ${pi.glassSuppliedBy}`
        : 'Glass to be supplied by :(8)';
      finalRow.getCell(7).value = glassLabel;

      // Row sR+3: GST
      const gstRow = ws.getRow(sR + 3);
      gstRow.getCell(5).value  = gstPctRaw;
      gstRow.getCell(24).value = { formula: `X${sR+2}*E${sR+3}` };

      // Row sR+4: INSTALLATION & TRANSPORTATION
      const instRow = ws.getRow(sR + 4);
      instRow.getCell(5).value  = instPctRaw;
      instRow.getCell(24).value = { formula: `X${sR+2}*E${sR+4}` };

      // Row sR+6: TOTAL ORDER VALUE
      const totRow = ws.getRow(sR + 6);
      totRow.getCell(24).value = { formula: `SUM(X${sR+2}:X${sR+5})` };

      /* ---- STEP 8: Sign-off rows ---- */
      const signStart = sR + 8;  // template has 1 blank row after summary rows
      const signRows = [
        ['Prepared By :(12)', pi.preparedBy  || ''],
        ['Checked By :(12)',  pi.checkedBy   || ''],
        ['Approved By :(12)', pi.approvedBy  || ''],
      ];
      signRows.forEach(([label, val], idx) => {
        const rn = signStart + idx;
        ws.getRow(rn).height = 20.25;
        const c = ws.getRow(rn).getCell(4);
        c.value = label + (val ? '  ' + val : '');
        if (!c.font) c.font = { name:'Arial', size:10, bold:true };
        if (!c.alignment) c.alignment = { horizontal:'left', vertical:'middle' };
      });

      /* ---- STEP 9: Freeze panes ---- */
      ws.views = [{ state:'frozen', xSplit:0, ySplit:9, topLeftCell:'A10', activeCell:'A10', showGridLines:true, zoomScale:85 }];

      /* ---- STEP 10: Download ---- */
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
