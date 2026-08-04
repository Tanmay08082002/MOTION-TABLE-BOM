/* ===================== DATA LOADER =====================
   Loads all JSON data files and exposes them as globals:
     MOTIONDRAWING  — product catalogue (from motiondrawing.json)
     LOOKUP         — workstation type → image key map (from lookup.json)
     OPTIONS        — all valid option arrays (from options.json)
     CONFIG_TABLE   — MOTION001-MOTION520 config code map (from config_table.json)
   The app waits for this Promise to resolve before calling render().
*/

const BASE = './assets/data/';

async function loadAllData() {
  const [mdRaw, lookupRaw, optionsRaw, configRaw] = await Promise.all([
    fetch(BASE + 'motiondrawing.json').then(r => r.json()),
    fetch(BASE + 'lookup.json').then(r => r.json()),
    fetch(BASE + 'options.json').then(r => r.json()),
    fetch(BASE + 'config_table.json').then(r => r.json()),
  ]);

  window.MOTIONDRAWING = mdRaw;
  window.LOOKUP        = lookupRaw;
  window.OPTIONS       = optionsRaw;
  window.CONFIG_TABLE  = configRaw;
}
