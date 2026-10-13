/* ===================== CONFIG CODE HELPERS =====================
   CONFIG_TABLE maps MOTION001-MOTION520 keys to product codes.
   Key format: TYPE-PERSON-FLAP-PRIV[-PANEL]-L{length}-D{depth}-H{height}
     TYPE   : BTB | FST
     PERSON : 01 (FST) | 02 | 04 | 06 | 08 | 10
     FLAP   : FLAP | NOFLAP
     PRIV   : NOP | PNL-FAB | PNL-MFB
*/

function buildConfigLabel() {
  const fs    = isFS();
  const cfgName = MOTION_CONFIG_LABELS[state.wsType] || state.wsType;
  const type  = (fs || fixedPersons()) ? cfgName : `${cfgName} ${state.person} Person`;
  const flapLabelMap = { LHS: 'LHS Access Flap', RHS: 'RHS Access Flap', CENTRE: 'Centre Access Flap', NO: 'No Access Flap' };
  const flap  = flapLabelMap[state.accessFlap.toUpperCase()] || state.accessFlap;
  const privNo = state.privacy.toLowerCase() === 'no';
  const priv  = privNo ? 'No Privacy Panel' : `${state.panelType} Privacy Panel`;
  return `${type} · ${flap} · ${priv}`;
}
