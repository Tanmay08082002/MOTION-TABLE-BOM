/* ===================== ASSET PATHS =====================
   Drop your real files next to this HTML file in these folders:
     ./Images/    — PDF previews,   named by base image key + suffix + .pdf
     ./Models/    — HTML 3D models, named by base image key + suffix + .html
     ./Drawings/  — DXF shop drawings, named by base image key + suffix + .dxf

   PDFs, models AND shop drawings all share the SAME base name from the
   LOOKUP table (the "image" field, e.g. WS_1, WS_2 …).  Suffix variants
   are built automatically from the current Access Flap + Privacy Panel
   state. Only add the files you actually have — missing variants are
   skipped and the app falls back gracefully to the next candidate.
*/
const IMAGE_DIR   = './Images/';
const MODEL_DIR   = './Models/';
const DRAWING_DIR = './Drawings/';
const IMAGE_EXT   = '.pdf';
const MODEL_EXT   = '.html';
const DRAWING_EXT = '.dxf';

/* ===================== APP STATE (mirrors Sheet4 inputs) ===================== */
const state = {
  wsType:     'BACK TO BACK WORKSTATION',  // D4
  accessFlap: 'CENTRE',                    // E4
  person:     2,                           // F4
  length:     1200,                        // D6
  depth:      600,                         // D8
  height:     1050,                        // D10  (1050 or 1200)
  privacy:    'YES',                       // E10
  panelType:  'MAGNETIC FAB',             // panel material type
  clusters:   1,                           // F10
};

const isFS = () => state.wsType.toLowerCase() === 'free standing workstation';

/* substitute "WITH" -> "" and collapse double spaces, like SUBSTITUTE(D4,"WITH","") */
function subWS() {
  return state.wsType.replace(/WITH/g, '').replace(/\s+/g, ' ').trim();
}
