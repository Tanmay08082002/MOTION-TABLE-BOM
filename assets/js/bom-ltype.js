/* ===================== BOM — L-TYPE WORKSTATION =====================
   Rules for L-Type Workstation:
     L-TYPE FREE STANDING WORKSTATION   1 table
     L-TYPE BACK TO BACK WORKSTATION    2 persons only (fixed — see state.js WS_FIXED_PERSONS)
   Sizes (options.json > workstationSizes.LTYPE): depth 600; length 1200 / 1350 / 1500 / 1650.

   Differences from Linear:
     - Jiecang control box listed directly under the actuator.
     - Horizontal cross member is split into the main and the RETURN cross member.
     - Back to Back lists BOTH the bottom support cross member and the foot;
       Free Standing lists the foot only.
     - Optional hanging privacy panel (state.hangingPanel = 'YES'): appended at the END of
       the BOM, and left out completely when not chosen.
       Free Standing: 1 panel per workstation.  Back to Back: 2 panels (one per person)
       in addition to the single back-to-back privacy panel.
       Panel + bracket quantities follow Linear's Free Standing panel rule
       (brackets: 2 per panel up to 1350 mm, 4 per panel above).

   Codes and drawing numbers are looked up in MOTIONDRAWING_LTYPE
   (motiondrawing_ltype.json) — never in Linear's table. The lookup is an exact match on
   the description, so change a description here => change it in that JSON file too.
   >>> Codes in that file are TEMPORARY, except the control box. <<<
=====================================================================  */

const mkLT = (desc, qty, na) => makeRow(desc, qty, na, MOTIONDRAWING_LTYPE);

function buildBOMLType() {
  const fs        = isFS();
  const flapNo    = state.accessFlap.toLowerCase() === 'no';
  const privNo    = state.privacy.toLowerCase() === 'no';
  const person    = fixedPersons() || state.person;      // 2 for Back to Back
  const personIs2 = person === 2;
  const c         = state.clusters;
  const ws        = subWS();
  const L         = state.length, D = state.depth;

  const rows = [];
  const add  = (desc, qty, na) => { const r = mkLT(desc, qty, na); rows.push(r); return r; };

  // Actuator
  const actuator = add(
    fs ? 'MOTION PLUS U/S RECTANGULAR 3 STAGE 2 MOTOR FOR L-TYPE ONE SIDED(JC35TF-R13S) JIECANG MAKE'
       : 'MOTION PLUS U/S 3 STAGE 2 MOTOR L-TYPE BACK TO BACK WS - HT. ADJ U/S(JC35TF-R13S)(NEW TYPE)JIECANG MAKE',
    fs ? c * 1 : (person / 2) * c);

  // Control box — one per actuator
  add(CONTROL_BOX_DESC, actuator.qtyRaw);

  const perTable = fs ? actuator.qtyRaw : person * c;

  // Table top
  add(`MOTION PLUS ${ws} L TOP 25MM PPB WITH FRONT SIDE CHAMFER EDGE & COR RAD ${L}LX${D}D`, perTable);

  // Horizontal cross member — main + return
  add(`MOTION PLUS HORIZONTAL CROSS MEMBER FOR JIECANG MAKE ${ws} U/S @${L}L`, perTable);
  add(`MOTION PLUS RETURN HORIZONTAL CROSS MEMBER FOR JIECANG MAKE ${ws} U/S @${L}L`, perTable);

  // Top support bracket
  add(`MOTION PLUS TOP SUPPORT BRACKET FOR JIECANG MAKE ${ws} U/S @${D}D`, fs ? actuator.qtyRaw * 3 : (person * 3) * c);

  // Bottom support cross member — Back to Back only
  add(fs ? 'Not Applicable' : `MOTION PLUS BOTTOM SUPPORT CROSS MEMBER FOR JIECANG MAKE ${ws} U/S @${D}D`,
      fs ? null : person * c, fs);

  // Foot — both configurations (one set per actuator)
  add(fs ? `MOTION PLUS FOOT (SET) FOR JIECANG MAKE L-TYPE ONE SIDED MOTION U/S @${D}D (FOR TOP DEPTH ${D})`
         : `MOTION PLUS FOOT (SET) FOR JIECANG MAKE ${ws} U/S @${D}D (FOR TOP DEPTH ${D})`,
      actuator.qtyRaw);

  // Access flap group
  const flapQty = flapNo ? null : (fs ? actuator.qtyRaw : person * c);
  add(flapNo ? 'Not Applicable' : 'ALUMINIUM ACCESS FLAP WITH SOFT CLOSE DIECASTED 450X145', flapQty, flapNo);
  add(flapNo ? 'Not Applicable' : 'SWITCH MOUNTING BOX CABIN+CONF TBL 450LX212DX125H', flapQty, flapNo);
  add(flapNo ? 'Not Applicable' : 'SWITCH MOUNTING BOX SWITCH PLATE 450LX168D', flapQty, flapNo);
  add(flapNo ? 'Not Applicable' : 'MOTION PLUS VERTIBRE ( FLOOR TO SWITCH MOUNTING BOX) (BOOKING QTY-2 NO.S)', flapQty, flapNo);

  // Cable tray / connector / vertical duct — Back to Back only
  const tray = add(fs ? 'Not Applicable' : `MOTION PLUS CABLE TRAY FOR L-TYPE BACK TO BACK 2 P WORKSTATION ${L}L`,
                   fs ? null : (person / 2) * c, fs);
  const naConn = fs || personIs2;
  const connector = add(naConn ? 'Not Applicable' : `MOTION PLUS CABLE TRAY CONNECTOR FOR ${ws} SHARING JUNCTION`,
                        naConn ? null : ((person / 2) - 1) * c, naConn);
  add(fs ? 'Not Applicable' : 'SPL MOTION PLUS VERTICAL DUCT PWCD FOR SHARING WS',
      fs ? null : (personIs2 ? tray.qtyRaw : connector.qtyRaw), fs);

  // Privacy panel (standing / back-to-back panel — one per back-to-back pair)
  const pType = state.panelType === 'MAGNETIC FAB' ? 'MAGNETIC FAB' : 'FAB';
  const panelQty = privNo ? null : (fs ? c * 1 : (person / 2) * c);
  add(privNo ? 'Not Applicable' : `MOTION PLUS ${ws} 18MM THK ${pType} PRIVACY PNL FOR ${L}L TOP (WS ${state.height}HT)`, panelQty, privNo);

  // Privacy panel brackets
  let lhs;
  if (privNo)  lhs = add('Not Applicable', null, true);
  else if (fs) lhs = add('L-TYPE PRIVACY PANEL BRACKET 6MM', (L <= 1350) ? c * 2 : c * 4);
  else         lhs = add('MOTION PLUS L-TYPE SCREEN HOLDING BKTS LHS', panelQty * 2);
  add((fs || privNo) ? 'Not Applicable' : 'MOTION PLUS L-TYPE SCREEN HOLDING BKTS RHS',
      (fs || privNo) ? null : lhs.qtyRaw, fs || privNo);

  // Optional hanging privacy panel — only present when the user chose it
  if (hangingOn()) {
    const hangQty = fs ? c * 1 : person * c;
    add(`MOTION PLUS ${ws} 18MM THK ${pType} HANGING PRIVACY PNL FOR ${L}L TOP`, hangQty);
    add('L-TYPE HANGING PRIVACY PANEL BRACKET 6MM', hangQty * ((L <= 1350) ? 2 : 4));
  }

  // Row position in the full list — used as the key for on-screen edits (see ui.js / events.js)
  rows.forEach((r, idx) => { r.origIdx = idx; });
  return rows;
}
