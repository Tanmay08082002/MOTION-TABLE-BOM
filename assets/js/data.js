/* ===================== DATA LOADER =====================
   Loads all JSON data files and exposes them as globals:
     MOTIONDRAWING  — product catalogue (from motiondrawing.json)
     LOOKUP         — workstation type → image key map (from lookup.json)
     OPTIONS        — all valid option arrays (from options.json)
     CONFIG_TABLE   — MOTION001-MOTION520 config code map (from config_table.json)
     MOTIONDRAWING_LTYPE / _120DEG, CONFIG_TABLE_LTYPE / _120DEG
                    — own code + drawing-number tables for L-Type and 120° (temporary)
   The app waits for this Promise to resolve before calling render().
*/

const BASE = './assets/data/';

async function loadAllData() {
  const get = f => fetch(BASE + f).then(r => r.json());
  const [mdRaw, lookupRaw, optionsRaw, configRaw,
         mdLT, mdD120, cfgLT, cfgD120] = await Promise.all([
    get('motiondrawing.json'),
    get('lookup.json'),
    get('options.json'),
    get('config_table.json'),
    get('motiondrawing_ltype.json'),
    get('motiondrawing_120deg.json'),
    get('config_table_ltype.json'),
    get('config_table_120deg.json'),
  ]);

  window.MOTIONDRAWING = mdRaw;
  window.LOOKUP        = lookupRaw;
  window.OPTIONS       = optionsRaw;
  window.CONFIG_TABLE  = configRaw;

  /* Per-workstation tables (TEMPORARY codes / drawing numbers for L-Type and 120°) */
  window.MOTIONDRAWING_LTYPE  = mdLT;
  window.MOTIONDRAWING_120DEG = mdD120;
  window.CONFIG_TABLE_LTYPE   = cfgLT;
  window.CONFIG_TABLE_120DEG  = cfgD120;
}
