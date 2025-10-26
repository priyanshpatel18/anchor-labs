/**
 * Constants for the Program Initialization Wizard
 */

export const FILE_UPLOAD_CONFIG = {
  MAX_SIZE_MB: 5,
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  ACCEPTED_TYPES: ['.json', 'application/json'],
  ACCEPTED_EXTENSIONS: ['.json'],
} as const;

export const TOAST_DURATIONS = {
  ERROR: 4000,
  SUCCESS: 3000,
  WARNING: 5000,
  INFO: 3000,
} as const;

export const WIZARD_STEP_IDS = {
  IDL_CONFIGURATION: 1,
  NETWORK_CONNECTION: 2,
  INITIALIZATION_REVIEW: 3,
} as const;

export const VALIDATION_MESSAGES = {
  INVALID_FILE_TYPE: 'Invalid file type',
  FILE_TOO_LARGE: 'File size exceeds limit',
  INVALID_JSON: 'Invalid JSON format',
  FILE_READ_ERROR: 'File read error',
  WALLET_NOT_CONNECTED: 'Wallet not connected',
  CONFIGURATION_INCOMPLETE: 'Configuration incomplete',
  INITIALIZATION_FAILED: 'Initialization failed',
} as const;

export const SUCCESS_MESSAGES = {
  FILE_UPLOADED: 'IDL file loaded successfully',
  PROGRAM_INITIALIZED: 'Program initialized',
} as const;

export const LOADING_MESSAGES = {
  PROCESSING_JSON: 'Processing JSON file...',
  INITIALIZING_PROGRAM: 'Initializing program...',
} as const;