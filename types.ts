
export type ControllerButton = 
  | 'CROSS' | 'CIRCLE' | 'SQUARE' | 'TRIANGLE' 
  | 'L1' | 'R1' | 'L2' | 'R2' 
  | 'SHARE' | 'OPTIONS' | 'PS' | 'TOUCHPAD'
  | 'L3' | 'R3' | 'DPAD_UP' | 'DPAD_DOWN' | 'DPAD_LEFT' | 'DPAD_RIGHT';

export type ControllerAxis = 'LEFT_STICK_X' | 'LEFT_STICK_Y' | 'RIGHT_STICK_X' | 'RIGHT_STICK_Y';

export type SystemAction = 
  | 'NONE' | 'VOLUME_UP' | 'VOLUME_DOWN' | 'MUTE' 
  | 'SCREENSHOT' | 'RECORD' | 'SLEEP' | 'WAKE' 
  | 'APP_LAUNCHER' | 'NEXT_MONITOR';

export interface MacroStep {
  id: string;
  key: string;
  delay: number;
}

export interface RadialItem {
  id: string;
  label: string;
  icon: 'Sword' | 'Shield' | 'Zap' | 'Mouse';
}

export interface Mapping {
  button: ControllerButton;
  mappedTo: string; // The Key Label (e.g. "Space", "W")
  keyCode: string;  // The actual event code (e.g. "KeyW", "Space")
  type: 'KEYBOARD' | 'MOUSE' | 'MACRO' | 'RADIAL_MENU' | 'SYSTEM_ACTION';
  mouseButton?: 0 | 1 | 2; // Left, Middle, Right
  systemAction?: SystemAction;
  macroSteps?: MacroStep[];
  isToggle?: boolean;
  isTurbo?: boolean;
  turboSpeed?: number;
  burstMode?: boolean;
  burstCount?: number;
  threshold?: number;
  isSticky?: boolean;
}

export interface AxisMapping {
  axis: ControllerAxis;
  mappedTo: 'WASD' | 'MOUSE_MOVEMENT' | 'SCROLL' | 'FLICK_STICK' | 'GYRO_MOUSE' | 'NONE';
  sensitivity: number;
  deadzone: number; // Inner deadzone (0-1)
  deadzoneOuter: number; // Outer deadzone (0-1)
  deadzoneType: 'CIRCULAR' | 'SQUARE' | 'CROSS' | 'AXIAL';
  curve: 'LINEAR' | 'EXPONENTIAL' | 'S_CURVE' | 'INSTANT' | 'CUSTOM';
}

export interface TrainingConfig {
  enabled: boolean;
  maxImages: number;
  minInterval: number; // ms
  confidenceThreshold: number; // 0.60
  probLowConfidence: number; // 0.50
  probHighConfidence: number; // 0.15
  minBrightness: number; // 0-255
  minSharpness: number; // Laplacian variance score
  datasetPath: string;
}

export interface AccessibilitySettings {
  aimStabilizationStrength: number;
  snapToTargetEnabled: boolean;
  aimSlowdownEnabled: boolean;
  stabilizationMode: 'Off' | 'Light' | 'Medium' | 'Heavy' | 'Custom';
  quickReleaseCombo: boolean;
  stickyDurationLimit: number;
  globalTurboRate: number;
  burstMode: boolean;
  burstCount: number;
  highContrastEnabled: boolean;
  indicatorSize: 'small' | 'medium' | 'large';
  audioFeedbackEnabled: boolean;
  audioFeedbackVolume: number;
  soundPack: string;
  hapticFeedbackEnabled: boolean;
  hapticIntensity: number;
  hapticPattern: string;
  antiRecoilEnabled: boolean;
  antiRecoilStrength: number; 
  autoAimEnabled: boolean;
  autoAimStrength: number;
  autoAimTargetSpeed: number;
  rapidFireEnabled: boolean;
  combatHudEnabled: boolean;
  visualIndicatorsEnabled: boolean; 
  yoloEnabled: boolean;
  trainingAutoCapture: boolean;
  yoloConfidence: number;
  yoloTrackingPower: number; 
  neuralModelQuality: 'fast' | 'accurate';
  gyroSmoothing: number;
  gyroInvertX: boolean;
  gyroInvertY: boolean;
  gyroActivationButton: ControllerButton | 'ALWAYS';
  oneHandedShiftButton: ControllerButton;
  hudScale: number;
  hudOpacity: number;
  hudPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  hudVisible: boolean;
  trainingConfig: TrainingConfig;
}

export interface Profile {
  id: string;
  name: string;
  description?: string;
  category?: 'User' | 'Default' | 'Accessibility' | 'Game-Specific';
  targetProcess?: string;
  mappings: Mapping[];
  axisMappings: AxisMapping[];
  radialItems: RadialItem[];
  created: number;
  gyroEnabled: boolean;
  gyroSensitivity: number;
  flickStickEnabled: boolean;
  oneHandedMode: 'NONE' | 'LEFT' | 'RIGHT';
  virtualOutput: 'KB_MOUSE' | 'XBOX' | 'DS4';
  pollingRate: 125 | 250 | 500 | 1000;
  accessibility: AccessibilitySettings;
}

export interface GamepadState {
  connected: boolean;
  id: string | null;
  buttons: Record<number, boolean>;
  axes: number[];
  rawAxes: number[];
  heatmap: Record<string, number>;
  sessionStartTime: Date;
  totalInputs: number;
  turboTicks: Record<string, number>;
  stickyStates: Record<string, boolean>;
  toggleStates: Record<string, boolean>;
  captureTriggered: boolean;
  aiDetectedTarget: { x: number, y: number } | null;
  virtualKeys: Set<string>; // Keys currently "pressed" by the controller
  mousePosition: { x: number, y: number };
  motion?: {
    gyro: { x: number, y: number, z: number };
  };
}

export interface SecurityEvent {
  timestamp: string;
  device: string;
  sourceIp: string;
  destination: string;
  destIp: string;
  protocol: string;
  size: string;
  info: string;
  suspicious: boolean;
}

export interface TrainingDataPayload {
  image: string; // Base64
  labels: string; // YOLO format string
  filename: string;
}

// API definition for the Electron preload script bridge
export interface ICoreApi {
  version: string;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  getRunningProcesses: () => Promise<string[]>;
  openLogsFolder: () => Promise<void>;
  sendKeyEvent: (args: { keyCode: string; type: 'keydown' | 'keyup' }) => void;
  sendMouseMove: (args: { x: number; y: number }) => void;
  sendMouseButtonEvent: (args: { button: 'left' | 'middle' | 'right'; type: 'mousedown' | 'mouseup' }) => void;
  emergencyReset: () => void;
  onKernelLog: (callback: (log: string) => void) => void;
  onGameDetected: (callback: (processName: string | null) => void) => void;
  saveTrainingData: (data: TrainingDataPayload) => Promise<{ success: boolean; reason?: string }>;
}

declare global {
  interface Window {
    icoreBridge: ICoreApi;
  }
}
