/* ===================== ASSET PATHS ===================== */
const IMAGE_DIR   = './Images/';
const MODEL_DIR   = './Models/';
const DRAWING_DIR = './Drawings/';
const IMAGE_EXT   = '.pdf';
const MODEL_EXT   = '.html';
const DRAWING_EXT = '.dxf';

/* ===================== APP STATE ===================== */
const state = {
  // Product selector
  activeProduct: 'MOTION',          // 'MOTION' | 'HUB'

  // Motion Table sub-type
  motionSubType: 'LINEAR',          // 'LINEAR' | 'LTYPE' | '120DEG'

  // Existing motion state
  wsType:     'BACK TO BACK WORKSTATION',
  accessFlap: 'CENTRE',
  person:     2,
  length:     1200,
  depth:      600,
  height:     1050,
  privacy:    'YES',
  panelType:  'MAGNETIC FAB',
  clusters:   1,

  // HUB state
  hubProduct:  null,   // selected HUB product id
  hubVariant:  null,   // selected variant (if any)
};

/* helpers */
const isFS      = () => state.wsType.toLowerCase() === 'free standing workstation';
const isMotion  = () => state.activeProduct === 'MOTION';
const isHub     = () => state.activeProduct === 'HUB';

function subWS() {
  return state.wsType.replace(/WITH/g, '').replace(/\s+/g, ' ').trim();
}

/* Motion sub-type config options */
const MOTION_CONFIG_OPTIONS = {
  LINEAR:  ['FREE STANDING WORKSTATION', 'BACK TO BACK WORKSTATION'],
  LTYPE:   ['L-TYPE FREE STANDING WORKSTATION', 'L-TYPE BACK TO BACK WORKSTATION'],
  '120DEG': ['120DEG FREE STANDING WORKSTATION', '120DEG 3P WORKSTATION'],
};

const MOTION_SUBTYPE_LABELS = {
  LINEAR:   'Linear Workstation',
  LTYPE:    'L-Type Workstation',
  '120DEG': '120° Workstation',
};

const MOTION_CONFIG_LABELS = {
  'FREE STANDING WORKSTATION':  'Free Standing',
  'BACK TO BACK WORKSTATION':   'Back to Back',
  '3P WORKSTATION':       '3P',
};

/* ===================== BOM USER EDITS ===================== */
window.bomUserEdits = {};   // key: `${rowIdx}-${colIdx}` → string value
window.projectInfo  = {
  projectName: '', zohoNumber: '', dealerName: '', poNumber: '', poDate: '',
  zeroDate: '', bomReleaseDate: '', revisedBomDate: '',
};
