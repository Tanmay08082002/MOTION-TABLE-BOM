/* ===================== BOM CORE (shared) =====================
   Each workstation keeps its own rules + its own code/drawing table:

     Linear     bom-linear.js   buildBOMLinear()   MOTIONDRAWING          (motiondrawing.json)
     L-Type     bom-ltype.js    buildBOMLType()    MOTIONDRAWING_LTYPE    (motiondrawing_ltype.json)
     120°       bom-120deg.js   buildBOM120Deg()   MOTIONDRAWING_120DEG   (motiondrawing_120deg.json)

   buildBOM() below picks the right one from state.motionSubType, so the UI,
   Excel export and summary code do not need to know which workstation is active.
============================================================== */

/* ===================== BOM LOOKUP HELPER ===================== */
function lookupByDesc(desc, table) {
  if (desc === null || desc === undefined) return { code: '--', drawing: '--' };
  const hit = (table || MOTIONDRAWING).find(r => r.desc === desc);
  return hit ? { code: hit.code, drawing: hit.drawing } : { code: '--', drawing: '--' };
}

/* ===================== SHARED VENDOR ITEM =====================
   Jiecang control box — listed straight under the actuator in the L-Type and 120°
   BOMs. Linear does not use it. Description is exactly as supplied; the item code is
   the number at its end and the drawing column is "VENDOR" (as for the other Jiecang parts). */
const CONTROL_BOX_CODE = '9703000007000381';
const CONTROL_BOX_DESC = 'CONTROL BOX (NE3)/CONTROL 3 NOS COLUME 1 NOS POWER CORD 1 NOS 2.5 WIRE/JIECANG MAKE/' + CONTROL_BOX_CODE;

/* ===================== BOM ROW BUILDER ===================== */
function makeRow(desc, qty, na, table) {
  const isNA       = na || desc === 'Not Applicable' || qty === null;
  const lk         = isNA ? { code: '--', drawing: '--' } : lookupByDesc(desc, table);
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

/* Linear's row builder (uses MOTIONDRAWING). */
function mk(desc, qty, na) { return makeRow(desc, qty, na, MOTIONDRAWING); }

/* ===================== DISPATCHER ===================== */
function buildBOM() {
  switch (state.motionSubType) {
    case 'LTYPE':  return buildBOMLType();
    case '120DEG': return buildBOM120Deg();
    default:       return buildBOMLinear();
  }
}
