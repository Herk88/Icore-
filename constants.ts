
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
  antiRecoilEnabled: false,
  antiRecoilStrength: 20,
  autoAimEnabled: false,
  autoAimStrength: 15,
  autoAimTargetSpeed: 5,
  rapidFireEnabled: false,
  combatHudEnabled: true,
  yoloEnabled: false,
  trainingAutoCapture: false,
  yoloConfidence: 0.75,
  yoloTrackingPower: 35, // Default tracking strength
  gyroSmoothing: 20,
  gyroInvertX: false,
  gyroInvertY: false,
  gyroActivationButton: 'L2',
};

export const DEFAULT_PROFILES: Profile[] = [
  {
    id: 'warzone-ultra',
    name: 'Warzone: Slide Cancel Pro',
    category: 'Game-Specific',
    description: 'Auto-Slide cancel on O-tap + Optimized Anti-Recoil for ARs.',
    targetProcess: 'cod.exe',
    created: Date.now(),
    gyroEnabled: false,
    gyroSensitivity: 1.0,
    flickStickEnabled: false,
    oneHandedMode: 'NONE',
    virtualOutput: 'DS4',
    pollingRate: 1000,
    accessibility: { 
      ...defaultAccessibility,
      antiRecoilEnabled: true,
      antiRecoilStrength: 32,
      rapidFireEnabled: true,
      yoloEnabled: true,
      trainingAutoCapture: true,
      yoloTrackingPower: 50
    },
    mappings: [
      { button: 'CIRCLE', mappedTo: 'Slide/Crouch', type: 'KEYBOARD', isTurbo: true, turboSpeed: 15 },
      { button: 'SQUARE', mappedTo: 'Reload', type: 'KEYBOARD' },
      { button: 'CROSS', mappedTo: 'Jump', type: 'KEYBOARD' },
      { button: 'L2', mappedTo: 'ADS', type: 'MOUSE', threshold: 0.1 },
      { button: 'R2', mappedTo: 'FIRE', type: 'MOUSE', threshold: 0.1 },
    ],
    axisMappings: [
      { axis: 'RIGHT_STICK_X', mappedTo: 'MOUSE_MOVEMENT', sensitivity: 45, deadzone: 0.05, deadzoneType: 'CIRCULAR', curve: 'EXPONENTIAL' },
    ],
    radialItems: [],
  },
  {
    id: 'r6-siege-sticky',
    name: 'R6 Siege: Tactical Lean',
    category: 'Game-Specific',
    description: 'Sticky lean toggles on L3/R3. ADS stabilization active.',
    targetProcess: 'RainbowSix.exe',
    created: Date.now(),
    gyroEnabled: false,
    gyroSensitivity: 1.0,
    flickStickEnabled: false,
    oneHandedMode: 'NONE',
    virtualOutput: 'DS4',
    pollingRate: 1000,
    accessibility: { 
      ...defaultAccessibility,
      aimStabilizationStrength: 45,
      stabilizationMode: 'Medium'
    },
    mappings: [
      { button: 'L3', mappedTo: 'Lean Left', type: 'KEYBOARD', isSticky: true },
      { button: 'R3', mappedTo: 'Lean Right', type: 'KEYBOARD', isSticky: true },
      { button: 'CIRCLE', mappedTo: 'Crouch', type: 'KEYBOARD' },
    ],
    axisMappings: [],
    radialItems: [],
  },
  {
    id: 'fortnite-build-god',
    name: 'Fortnite: Builder Turbo',
    category: 'Game-Specific',
    description: 'Turbo build on R2 hold. Instant edit reset macro.',
    targetProcess: 'FortniteClient-Win64-Shipping.exe',
    created: Date.now(),
    gyroEnabled: true,
    gyroSensitivity: 1.4,
    flickStickEnabled: true,
    oneHandedMode: 'NONE',
    virtualOutput: 'KB_MOUSE',
    pollingRate: 1000,
    accessibility: { 
      ...defaultAccessibility,
      rapidFireEnabled: true,
      globalTurboRate: 20
    },
    mappings: [
      { button: 'R2', mappedTo: 'Build/Fire', type: 'MOUSE', isTurbo: true, turboSpeed: 20 },
      { button: 'TRIANGLE', mappedTo: 'Pickaxe', type: 'KEYBOARD' },
      { button: 'TOUCHPAD', mappedTo: 'Edit', type: 'KEYBOARD' },
    ],
    axisMappings: [],
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
    ],
    axisMappings: [],
    radialItems: [],
  },
  {
    id: 'fps-competitive',
    name: 'Universal FPS Stack',
    category: 'Default',
    description: 'Zero-latency standard mapping.',
    created: Date.now(),
    gyroEnabled: false,
    gyroSensitivity: 1.0,
    flickStickEnabled: false,
    oneHandedMode: 'NONE',
    virtualOutput: 'XBOX',
    pollingRate: 1000,
    accessibility: { ...defaultAccessibility },
    mappings: [],
    axisMappings: [],
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

export const NAME_TO_INDEX: Record<string, number> = Object.entries(DUALSENSE_INDICES).reduce((acc, [idx, name]) => {
  acc[name] = parseInt(idx);
  return acc;
}, {} as Record<string, number>);
