/* ===================== BOM — 120° WORKSTATION =====================
   Rules for the 120° Workstation:
     120 DEG 1P   one user  — behaves like a single table (privacy optional, flap can be "No")
     120 DEG 3P   three users — privacy panel always included
   Sizes (options.json > workstationSizes.120DEG): depth 600; length 1200 / 1350 / 1500.

   Every code / drawing number comes from MOTIONDRAWING_120DEG
   (motiondrawing_120deg.json), never from Linear's table.

   >>> TEMPORARY LOGIC AND DATA <<<
   The quantity rules below are a first draft built from the Linear rules
   (one actuator, top, cross member, support brackets and foot per table).
   The 3P-only rows (centre junction, cable tray) are placeholders until the
   real 120° BOM is confirmed. Edit this file for the rules and
   motiondrawing_120deg.json for the codes — descriptions must match exactly.
=====================================================================  */

const mk120 = (desc, qty, na) => makeRow(desc, qty, na, MOTIONDRAWING_120DEG);

function buildBOM120Deg() {
  const persons = fixedPersons() || 1;          // 1 or 3
  const single  = persons === 1;                // 120 DEG 1P
  const ws      = state.wsType;                 // '120 DEG 1P' | '120 DEG 3P'
  const flapNo  = state.accessFlap.toLowerCase() === 'no';
  const privNo  = state.privacy.toLowerCase() === 'no';
  const tables  = persons * state.clusters;     // one table per person

  const rows = [];

  // 1 — actuator (one per table)
  rows.push(mk120(`MOTION PLUS U/S 3 STAGE 2 MOTOR ${ws} WS - HT. ADJ U/S(JC35TF-R13S) JIECANG MAKE`, tables));

  // 2 — table top
  rows.push(mk120(`MOTION PLUS ${ws} 120 DEG TOP 25MM PPB WITH FRONT SIDE CHAMFER EDGE & COR RAD ${state.length}LX${state.depth}D`, tables));

  // 3 — horizontal cross member
  rows.push(mk120(`MOTION PLUS HORIZONTAL CROSS MEMBER FOR JIECANG MAKE ${ws} U/S @${state.length}L`, tables));

  // 4 — top support bracket (2 per table)
  rows.push(mk120(`MOTION PLUS TOP SUPPORT BRACKET FOR JIECANG MAKE ${ws} U/S @${state.depth}D`, tables * 2));

  // 5 — foot (set)
  rows.push(mk120(`MOTION PLUS FOOT (SET) FOR JIECANG MAKE ${ws} MOTION U/S @${state.depth}D (FOR TOP DEPTH ${state.depth})`, tables));

  // 6-9 — access flap group (one set per table; N/A when flap = No)
  rows.push(mk120(flapNo ? 'Not Applicable' : 'ALUMINIUM ACCESS FLAP WITH SOFT CLOSE DIECASTED 450X145', flapNo ? null : tables, flapNo));
  rows.push(mk120(flapNo ? 'Not Applicable' : 'SWITCH MOUNTING BOX CABIN+CONF TBL 450LX212DX125H',        flapNo ? null : tables, flapNo));
  rows.push(mk120(flapNo ? 'Not Applicable' : 'SWITCH MOUNTING BOX SWITCH PLATE 450LX168D',              flapNo ? null : tables, flapNo));
  rows.push(mk120(flapNo ? 'Not Applicable' : 'MOTION PLUS VERTIBRE ( FLOOR TO SWITCH MOUNTING BOX) (BOOKING QTY-2 NO.S)', flapNo ? null : tables, flapNo));

  // 10 — centre junction (3P only, one per cluster)
  rows.push(mk120(single ? 'Not Applicable' : 'MOTION PLUS 120 DEG CENTRE JUNCTION FOR 120 DEG 3P WORKSTATION',
                  single ? null : state.clusters, single));

  // 11 — cable tray (3P only, one per table)
  rows.push(mk120(single ? 'Not Applicable' : `MOTION PLUS CABLE TRAY FOR 120 DEG 3P WORKSTATION ${state.length}L`,
                  single ? null : tables, single));

  // 12 — privacy panel (one per table; always present on 3P)
  let panelQty = null;
  {
    const pType = state.panelType === 'MAGNETIC FAB' ? 'MAGNETIC FAB' : 'FAB';
    const desc  = privNo ? 'Not Applicable' : `MOTION PLUS ${ws} 18MM THK ${pType} PRIVACY PNL FOR ${state.length}L TOP (WS ${state.height}HT)`;
    panelQty    = privNo ? null : tables;
    rows.push(mk120(desc, panelQty, privNo));
  }

  // 13 — privacy panel bracket LHS
  {
    let desc, qty;
    if (privNo) { desc = 'Not Applicable'; qty = null; }
    else if (single) {
      desc = '120 DEG PRIVACY PANEL BRACKET 6MM';
      qty  = (state.length === 1200 || state.length === 1350) ? state.clusters * 2 : state.clusters * 4;
    } else {
      desc = 'MOTION PLUS 120 DEG SCREEN HOLDING BKTS LHS';
      qty  = panelQty * 2;
    }
    rows.push(mk120(desc, qty, privNo));
  }

  // 14 — privacy panel bracket RHS (3P only)
  {
    const na = privNo || single;
    rows.push(mk120(na ? 'Not Applicable' : 'MOTION PLUS 120 DEG SCREEN HOLDING BKTS RHS', na ? null : panelQty * 2, na));
  }

  // Row position in the full list — used as the key for on-screen edits (see ui.js / events.js)
  rows.forEach((r, idx) => { r.origIdx = idx; });
  return rows;
}
