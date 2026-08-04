/* ===================== BOM LOOKUP HELPER ===================== */
function lookupByDesc(desc) {
  if (desc === null || desc === undefined) return { code: '--', drawing: '--' };
  const hit = MOTIONDRAWING.find(r => r.desc === desc);
  return hit ? { code: hit.code, drawing: hit.drawing } : { code: '--', drawing: '--' };
}

/* ===================== FORMULA ENGINE (Sheet4 rows 20-34) ===================== */
function buildBOM() {
  const fs        = isFS();
  const flapNo    = state.accessFlap.toLowerCase() === 'no';
  const privNo    = state.privacy.toLowerCase() === 'no';
  const personIs2 = String(state.person) === '2';

  const rows = [];

  // Row 20 — actuator
  {
    const desc = fs
      ? 'MOTION PLUS U/S RECTANGULAR 3 STAGE 2 MOTOR FOR LINEAR ONE SIDED(JC35TF-R13S) JIECANG MAKE'
      : 'MOTION PLUS U/S 3 STAGE 2 MOTOR BACK TO BACK STR WS - HT. ADJ U/S(JC35TF-R13S)(NEW TYPE)JIECANG MAKE';
    const qty = fs ? state.clusters * 1 : (state.person / 2) * state.clusters;
    rows.push(mk(desc, qty));
  }

  // Row 21 — table top
  {
    const desc = `MOTION PLUS ${subWS()} STR TOP 25MM PPB WITH FRONT SIDE CHAMFER EDGE & COR RAD ${state.length}LX${state.depth}D`;
    const qty  = fs ? rows[0].qtyRaw : state.person * state.clusters;
    rows.push(mk(desc, qty));
  }

  // Row 22 — horizontal cross member
  {
    const desc = `MOTION PLUS HORIZONTAL CROSS MEMBER FOR JIECANG MAKE ${subWS()} U/S @${state.length}L`;
    const qty  = fs ? rows[0].qtyRaw : state.person * state.clusters;
    rows.push(mk(desc, qty));
  }

  // Row 23 — top support bracket
  {
    const desc = `MOTION PLUS TOP SUPPORT BRACKET FOR JIECANG MAKE ${subWS()} U/S @${state.depth}D`;
    const qty  = fs ? rows[0].qtyRaw * 2 : (state.person * 2) * state.clusters;
    rows.push(mk(desc, qty));
  }

  // Row 24 — BTB: bottom support cross member · FST: Motion Table Foot (varies by depth)
  {
    const desc = fs
      ? `MOTION PLUS FOOT (SET) FOR JIECANG MAKE ONE SIDED MOTION U/S @${state.depth}D (FOR TOP DEPTH ${state.depth})`
      : `MOTION PLUS BOTTOM SUPPORT CROSS MEMBER FOR JIECANG MAKE ${subWS()} U/S @${state.depth}D`;
    const qty = fs ? rows[0].qtyRaw : (state.person) * state.clusters;
    rows.push(mk(desc, qty));
  }

  // Row 25 — access flap
  {
    const desc = flapNo ? 'Not Applicable' : 'ALUMINIUM ACCESS FLAP WITH SOFT CLOSE DIECASTED 450X145';
    const qty  = flapNo ? null : (fs ? rows[0].qtyRaw : state.person * state.clusters);
    rows.push(mk(desc, qty, flapNo));
  }
  // Row 26 — switch mounting box (cabin)
  {
    const desc = flapNo ? 'Not Applicable' : 'SWITCH MOUNTING BOX CABIN+CONF TBL 450LX212DX125H';
    const qty  = flapNo ? null : (fs ? rows[0].qtyRaw : state.person * state.clusters);
    rows.push(mk(desc, qty, flapNo));
  }
  // Row 27 — switch mounting box (plate)
  {
    const desc = flapNo ? 'Not Applicable' : 'SWITCH MOUNTING BOX SWITCH PLATE 450LX168D';
    const qty  = flapNo ? null : (fs ? rows[0].qtyRaw : state.person * state.clusters);
    rows.push(mk(desc, qty, flapNo));
  }
  // Row 28 — vertibre
  {
    const desc = flapNo ? 'Not Applicable' : 'MOTION PLUS VERTIBRE ( FLOOR TO SWITCH MOUNTING BOX) (BOOKING QTY-2 NO.S)';
    const qty  = flapNo ? null : (fs ? rows[0].qtyRaw : state.person * state.clusters);
    rows.push(mk(desc, qty, flapNo));
  }

  // Row 29 — cable tray (BTB only)
  {
    const desc = fs ? 'Not Applicable' : `MOTION PLUS CABLE TRAY FOR BACK TO BACK 2 P WORKSTATION ${state.length}L`;
    const qty  = fs ? null : (state.person / 2) * state.clusters;
    rows.push(mk(desc, qty, fs));
  }
  // Row 30 — cable tray connector
  {
    const naMath = fs || personIs2;
    const desc   = fs ? 'Not Applicable' : (personIs2 ? 'Not Applicable' : `MOTION PLUS CABLE TRAY CONNECTOR FOR ${subWS()} SHARING JUNCTION`);
    const qty    = naMath ? null : ((state.person / 2) - 1) * state.clusters;
    rows.push(mk(desc, qty, naMath));
  }
  // Row 31 — vertical duct
  {
    const naMath = fs;
    const desc   = fs ? 'Not Applicable' : 'SPL MOTION PLUS VERTICAL DUCT PWCD FOR SHARING WS';
    const qty    = fs ? null : (personIs2 ? rows[9].qtyRaw : rows[10].qtyRaw);
    rows.push(mk(desc, qty, naMath));
  }

  // Row 32 — privacy panel
  let row32qty = null;
  {
    const pType = state.panelType === 'MAGNETIC FAB' ? 'MAGNETIC FAB' : 'FAB';
    const desc  = privNo ? 'Not Applicable' : `MOTION PLUS ${subWS()} 18MM THK ${pType} PRIVACY PNL FOR ${state.length}L TOP (WS ${state.height}HT)`;
    const qty   = privNo ? null : (fs ? state.clusters * 1 : (state.person / 2) * state.clusters);
    row32qty = qty;
    rows.push(mk(desc, qty, privNo));
  }
  // Row 33 — screen bracket LHS / lineo bracket
  {
    let desc, qty;
    if (privNo) { desc = 'Not Applicable'; qty = null; }
    else if (fs) {
      desc = 'LINEO PRIVACY PANEL BRACKET 6MM';
      if (state.length === 1200 || state.length === 1350) qty = state.clusters * 2;
      else if (state.length === 1500 || state.length === 1650) qty = state.clusters * 4;
      else if (state.length === 1800) qty = state.clusters * 4;
      else qty = row32qty * 2;
    } else {
      desc = 'MOTION PLUS SCREEN HOLDING BKTS LHS';
      qty  = row32qty * 2;
    }
    rows.push(mk(desc, qty, privNo));
  }
  // Row 34 — screen bracket RHS (BTB only)
  {
    let desc, qty;
    if (privNo)  { desc = 'Not Applicable'; qty = null; }
    else if (fs) { desc = 'Not Applicable'; qty = null; }
    else         { desc = 'MOTION PLUS SCREEN HOLDING BKTS RHS'; qty = rows[13].qtyRaw; }
    rows.push(mk(desc, qty, fs || privNo));
  }

  return rows;
}

function mk(desc, qty, na) {
  const isNA       = na || desc === 'Not Applicable' || qty === null;
  const lk         = isNA ? { code: '--', drawing: '--' } : lookupByDesc(desc);
  const qtyRounded = isNA ? 0 : Math.round(qty);
  return {
    desc,
    code:    isNA ? '--' : lk.code,
    drawing: isNA ? '--' : lk.drawing,
    qty:     isNA ? '--' : qtyRounded,
    qtyRaw:  qty,
    na:      isNA,
  };
}
