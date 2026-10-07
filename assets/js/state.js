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
/* Configurations that are a single table (no person-count selector, privacy optional,
   access flap can be "No"). Linear's 'FREE STANDING WORKSTATION' is unchanged. */
const WS_SINGLE  = ['free standing workstation', 'l-type free standing workstation', '120 deg 1p'];
const isFS       = () => WS_SINGLE.includes(state.wsType.toLowerCase());

/* Configurations whose person count is fixed by the configuration itself. */
const WS_FIXED_PERSONS = { '120 deg 1p': 1, '120 deg 3p': 3 };
const fixedPersons = () => WS_FIXED_PERSONS[state.wsType.toLowerCase()] || null;

/* Table sizes allowed for the selected workstation. Linear keeps using the global
   OPTIONS.length / OPTIONS.depth; L-Type and 120° are limited in options.json. */
function sizeOptions() {
  const o = (OPTIONS.workstationSizes || {})[state.motionSubType];
  return { length: (o && o.length) || OPTIONS.length, depth: (o && o.depth) || OPTIONS.depth };
}

/* Lookup row (preview image / model / drawing base name) for the current configuration.
   Rows without a "workstation" field belong to LINEAR. */
function getLookupEntry() {
  const type = state.wsType.toLowerCase();
  const single = isFS();
  return LOOKUP.find(l =>
    (l.workstation || 'LINEAR') === state.motionSubType &&
    l.type.toLowerCase() === type &&
    (single || Number(l.option) === Number(state.person)));
}
const isMotion  = () => state.activeProduct === 'MOTION';
const isHub     = () => state.activeProduct === 'HUB';

function subWS() {
  return state.wsType.replace(/WITH/g, '').replace(/\s+/g, ' ').trim();
}

/* Motion sub-type config options */
const MOTION_CONFIG_OPTIONS = {
  LINEAR:  ['FREE STANDING WORKSTATION', 'BACK TO BACK WORKSTATION'],
  LTYPE:   ['L-TYPE FREE STANDING WORKSTATION', 'L-TYPE BACK TO BACK WORKSTATION'],
  '120DEG': ['120 DEG 1P', '120 DEG 3P'],
};

const MOTION_SUBTYPE_LABELS = {
  LINEAR:   'Linear Workstation',
  LTYPE:    'L-Type Workstation',
  '120DEG': '120° Workstation',
};

const MOTION_CONFIG_LABELS = {
  'FREE STANDING WORKSTATION':          'Free Standing',
  'BACK TO BACK WORKSTATION':           'Back to Back',
  'L-TYPE FREE STANDING WORKSTATION':   'L-Type Free Standing',
  'L-TYPE BACK TO BACK WORKSTATION':    'L-Type Back to Back',
  '120 DEG 1P':                         '120 DEG 1P',
  '120 DEG 3P':                         '120 DEG 3P',
};

/* ===================== BOM USER EDITS ===================== */
window.bomUserEdits = {};   // key: `${rowIdx}-${colIdx}` → string value
window.projectInfo  = {
  projectName: '', zohoNumber: '', dealerName: '', poNumber: '', poDate: '',
  zeroDate: '', bomReleaseDate: '', revisedBomDate: '',
};
