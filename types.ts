
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
  delay: number; // ms
}

export interface Mapping {
  button: ControllerButton;
  mappedTo: string;
  type: 'KEYBOARD' | 'MOUSE' | 'MACRO' | 'RADIAL_MENU' | 'SYSTEM_ACTION';
  systemAction?: SystemAction;
  macroSteps?: MacroStep[];
  isToggle?: boolean;
  isTurbo?: boolean;
  turboSpeed?: number; // clicks per second
  threshold?: number; // For triggers L2/R2 (0.0 to 1.0)
  layer?: number; // Mapping only active in specific layer
  isSticky?: boolean; // For accessibility
}

export interface AxisMapping {
  axis: ControllerAxis;
  mappedTo: 'WASD' | 'MOUSE_MOVEMENT' | 'SCROLL' | 'FLICK_STICK' | 'GYRO_MOUSE';
  sensitivity: number;
  deadzone: number;
  deadzoneType: 'CIRCULAR' | 'SQUARE' | 'CROSS' | 'AXIAL';
  curve: 'LINEAR' | 'EXPONENTIAL' | 'S_CURVE' | 'INSTANT' | 'CUSTOM';
  curvePoints?: { x: number, y: number }[];
  flickThreshold?: number;
  smoothing?: number;
  smoothingAlgorithm?: 'None' | 'Moving Average' | 'Exponential' | 'Kalman Filter';
}

export interface RadialItem {
  id: string;
  label: string;
  action: string;
  icon: string;
}

export interface AccessibilitySettings {
  aimStabilizationStrength: number;
  snapToTargetEnabled: boolean;
  aimSlowdownEnabled: boolean;
  stabilizationMode: 'Off' | 'Light' | 'Medium' | 'Heavy' | 'Custom';
  quickReleaseCombo: boolean;
  stickyDurationLimit: number; // 0 = unlimited, otherwise seconds
  globalTurboRate: number; // presses per second
  burstMode: boolean;
  burstCount: number; // if burst mode enabled
  highContrastEnabled: boolean;
  indicatorSize: 'small' | 'medium' | 'large';
  audioFeedbackEnabled: boolean;
  audioFeedbackVolume: number;
  soundPack: 'Click' | 'Beep' | 'Mechanical' | 'Silent';
  hapticFeedbackEnabled: boolean;
  hapticIntensity: number;
  hapticPattern: 'Single Pulse' | 'Double Pulse' | 'Wave' | 'Custom';
  oneHandedShiftButton: ControllerButton; // Button used to swap primary/secondary sides
}

export interface Profile {
  id: string;
  name: string;
  description?: string;
  category?: 'User' | 'Default' | 'Accessibility' | 'Game-Specific';
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
  heatmap: Record<string, number>;
  sessionStartTime: number;
  totalInputs: number;
  lastInputTime: number;
  isThrottled: boolean;
  activeLayer: number;
  turboTicks: Record<string, number>;
  gyroActive: boolean;
  stickyStates: Record<string, boolean>;
  toggleStates: Record<string, boolean>;
  oneHandedShiftActive: boolean; // Tracks if the user is holding the one-handed swap button
  motion?: {
    gyro: { x: number, y: number, z: number };
    accel: { x: number, y: number, z: number };
  };
}
