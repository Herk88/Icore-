
import { Profile, AccessibilitySettings } from './types';

const defaultAccessibility: AccessibilitySettings = {
  aimStabilizationStrength: 0,
  snapToTargetEnabled: false,
  aimSlowdownEnabled: false,
  stabilizationMode: 'Off',
  quickReleaseCombo: true,
  stickyDurationLimit: 0,
  globalTurboRate: 10,
  burstMode: false,
  burstCount: 3,
  highContrastEnabled: false,
  indicatorSize: 'medium',
  audioFeedbackEnabled: false,
  audioFeedbackVolume: 50,
  soundPack: 'Click',
  hapticFeedbackEnabled: true,
  hapticIntensity: 80,
  hapticPattern: 'Single Pulse',
  oneHandedShiftButton: 'L3',
};

export const DEFAULT_PROFILES: Profile[] = [
  {
    id: 'fps-competitive',
    name: 'FPS Pro (Gyro + Flick)',
    category: 'Default',
    created: Date.now(),
    gyroEnabled: true,
    gyroSensitivity: 1.5,
    flickStickEnabled: true,
    oneHandedMode: 'NONE',
    virtualOutput: 'KB_MOUSE',
    pollingRate: 1000,
    accessibility: { ...defaultAccessibility },
    mappings: [
      { button: 'CROSS', mappedTo: 'Space', type: 'KEYBOARD' },
      { button: 'CIRCLE', mappedTo: 'C', type: 'KEYBOARD', isTurbo: true, turboSpeed: 10 },
      { button: 'SQUARE', mappedTo: 'R', type: 'KEYBOARD' },
      { button: 'TRIANGLE', mappedTo: 'F', type: 'KEYBOARD' },
      { button: 'L1', mappedTo: 'Q', type: 'KEYBOARD' },
      { button: 'R1', mappedTo: 'E', type: 'KEYBOARD' },
      { button: 'L2', mappedTo: 'Right Click', type: 'MOUSE', threshold: 0.1 },
      { button: 'R2', mappedTo: 'Left Click', type: 'MOUSE', threshold: 0.1 },
      { button: 'OPTIONS', mappedTo: 'Escape', type: 'KEYBOARD' },
      { button: 'SHARE', mappedTo: 'SCREENSHOT', type: 'SYSTEM_ACTION', systemAction: 'SCREENSHOT' },
      { button: 'TOUCHPAD', mappedTo: 'Tab', type: 'KEYBOARD' },
    ],
    axisMappings: [
      { axis: 'LEFT_STICK_X', mappedTo: 'WASD', sensitivity: 1.0, deadzone: 0.1, deadzoneType: 'CIRCULAR', curve: 'LINEAR' },
      { axis: 'LEFT_STICK_Y', mappedTo: 'WASD', sensitivity: 1.0, deadzone: 0.1, deadzoneType: 'CIRCULAR', curve: 'LINEAR' },
      { axis: 'RIGHT_STICK_X', mappedTo: 'FLICK_STICK', sensitivity: 1.0, deadzone: 0.1, deadzoneType: 'CIRCULAR', curve: 'EXPONENTIAL' },
      { axis: 'RIGHT_STICK_Y', mappedTo: 'MOUSE_MOVEMENT', sensitivity: 50, deadzone: 0.1, deadzoneType: 'CIRCULAR', curve: 'EXPONENTIAL' },
    ],
    radialItems: [
      { id: '1', label: 'Heal', action: 'H', icon: 'Zap' },
      { id: '2', label: 'Shield', action: 'B', icon: 'Shield' },
    ],
  },
  {
    id: 'acc-tremor',
    name: 'Accessibility - Tremor Compensation',
    category: 'Accessibility',
    description: 'Large deadzones (30%), heavy smoothing (80%), aim stabilization',
    created: Date.now(),
    gyroEnabled: false,
    gyroSensitivity: 1.0,
    flickStickEnabled: false,
    oneHandedMode: 'NONE',
    virtualOutput: 'KB_MOUSE',
    pollingRate: 250,
    accessibility: { 
      ...defaultAccessibility, 
      aimStabilizationStrength: 80, 
      stabilizationMode: 'Heavy',
      aimSlowdownEnabled: true
    },
    mappings: [],
    axisMappings: [
      { axis: 'LEFT_STICK_X', mappedTo: 'WASD', sensitivity: 0.8, deadzone: 0.3, deadzoneType: 'CIRCULAR', curve: 'EXPONENTIAL', smoothing: 80, smoothingAlgorithm: 'Moving Average' },
      { axis: 'LEFT_STICK_Y', mappedTo: 'WASD', sensitivity: 0.8, deadzone: 0.3, deadzoneType: 'CIRCULAR', curve: 'EXPONENTIAL', smoothing: 80, smoothingAlgorithm: 'Moving Average' },
      { axis: 'RIGHT_STICK_X', mappedTo: 'MOUSE_MOVEMENT', sensitivity: 30, deadzone: 0.3, deadzoneType: 'CIRCULAR', curve: 'EXPONENTIAL', smoothing: 80, smoothingAlgorithm: 'Moving Average' },
      { axis: 'RIGHT_STICK_Y', mappedTo: 'MOUSE_MOVEMENT', sensitivity: 30, deadzone: 0.3, deadzoneType: 'CIRCULAR', curve: 'EXPONENTIAL', smoothing: 80, smoothingAlgorithm: 'Moving Average' },
    ],
    radialItems: [],
  },
  {
    id: 'acc-onehand-left',
    name: 'Accessibility - One Hand (Left)',
    category: 'Accessibility',
    description: 'Complete layout for left hand only',
    created: Date.now(),
    gyroEnabled: false,
    gyroSensitivity: 1.0,
    flickStickEnabled: false,
    oneHandedMode: 'LEFT',
    virtualOutput: 'KB_MOUSE',
    pollingRate: 500,
    accessibility: { ...defaultAccessibility, oneHandedShiftButton: 'L3' },
    mappings: [
      { button: 'L2', mappedTo: 'Right Click', type: 'MOUSE', isSticky: true },
      { button: 'L1', mappedTo: 'Shift', type: 'KEYBOARD' },
      { button: 'TOUCHPAD', mappedTo: 'E', type: 'KEYBOARD' },
    ],
    axisMappings: [
      { axis: 'LEFT_STICK_X', mappedTo: 'WASD', sensitivity: 1.0, deadzone: 0.1, deadzoneType: 'CIRCULAR', curve: 'LINEAR' },
      { axis: 'LEFT_STICK_Y', mappedTo: 'WASD', sensitivity: 1.0, deadzone: 0.1, deadzoneType: 'CIRCULAR', curve: 'LINEAR' },
    ],
    radialItems: [],
  }
];

export const DUALSENSE_INDICES: Record<number, string> = {
  0: 'CROSS', 1: 'CIRCLE', 2: 'SQUARE', 3: 'TRIANGLE',
  4: 'L1', 5: 'R1', 6: 'L2', 7: 'R2',
  8: 'SHARE', 9: 'OPTIONS', 10: 'L3', 11: 'R3',
  12: 'DPAD_UP', 13: 'DPAD_DOWN', 14: 'DPAD_LEFT', 15: 'DPAD_RIGHT',
  16: 'PS', 17: 'TOUCHPAD'
};
