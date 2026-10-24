/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LayerTransform {
  x: number;
  y: number;
  rot: number;
  elbowRot?: number;
  kneeRot?: number;
  scaleX: number;
}

export interface RigPositions {
  head: LayerTransform;
  torso: LayerTransform;
  armBack: LayerTransform;
  armFront: LayerTransform;
  legBack: LayerTransform;
  legFront: LayerTransform;
}

export interface CustomKeyframe {
  id: string;
  name: string;
  charPos: { x: number; y: number };
  positions: RigPositions;
}

export interface CustomAnimationPreset {
  id: string;
  name: string;
  icon: string;
  duration: number; // in seconds
  keyframes: CustomKeyframe[];
}

export interface RigJointInfo {
  id: number;
  name: string;
  part: string;
}

export const RIG_JOINTS: RigJointInfo[] = [
  { id: 1, name: 'Head & Neck', part: 'Head' },
  { id: 2, name: 'Chest & Spine', part: 'Torso' },
  { id: 3, name: 'Waist & Pelvis', part: 'Torso' },
  { id: 4, name: 'Back Shoulder', part: 'Back Arm' },
  { id: 5, name: 'Back Elbow', part: 'Back Arm' },
  { id: 6, name: 'Back Wrist / Hand', part: 'Back Arm' },
  { id: 7, name: 'Front Shoulder', part: 'Front Arm' },
  { id: 8, name: 'Front Elbow', part: 'Front Arm' },
  { id: 9, name: 'Front Wrist / Hand', part: 'Front Arm' },
  { id: 10, name: 'Back Hip', part: 'Back Leg' },
  { id: 11, name: 'Back Knee', part: 'Back Leg' },
  { id: 12, name: 'Back Ankle / Foot', part: 'Back Leg' },
  { id: 13, name: 'Front Hip', part: 'Front Leg' },
  { id: 14, name: 'Front Knee', part: 'Front Leg' },
  { id: 15, name: 'Front Ankle / Foot', part: 'Front Leg' }
];

export const DEFAULT_WALK_CHAR_POS = { x: -75, y: 1 };

export const DEFAULT_WALK_POSITIONS: RigPositions = {
  head: { x: 0, y: 0, rot: 2, scaleX: -1 },
  torso: { x: 0, y: 0, rot: 0, scaleX: -1 },
  armBack: { x: 8, y: 0, rot: 12, elbowRot: 0, scaleX: -1 },
  armFront: { x: 1, y: 0, rot: -10, elbowRot: 0, scaleX: -1 },
  legBack: { x: 0, y: 0, rot: -4, kneeRot: 0, scaleX: -1 },
  legFront: { x: 0, y: 0, rot: 4, kneeRot: 0, scaleX: -1 }
};

export const DEFAULT_TALK_CHAR_POS = { x: -1, y: 0 };

export const DEFAULT_TALK_POSITIONS: RigPositions = {
  head: { x: 0, y: 0, rot: 2, scaleX: -1 },
  torso: { x: 0, y: 0, rot: 0, scaleX: -1 },
  armBack: { x: 8, y: 0, rot: 12, elbowRot: 0, scaleX: 1 },
  armFront: { x: 1, y: 0, rot: -1, elbowRot: 0, scaleX: 1 },
  legBack: { x: 0, y: 0, rot: -4, kneeRot: 0, scaleX: -1 },
  legFront: { x: 0, y: 0, rot: -1, kneeRot: 0, scaleX: -1 }
};

export const DEFAULT_IDLE_CHAR_POS = { x: -75, y: 1 };

export const DEFAULT_IDLE_POSITIONS: RigPositions = {
  head: { x: 0, y: 0, rot: 0, scaleX: -1 },
  torso: { x: 0, y: 0, rot: 0, scaleX: -1 },
  armBack: { x: 8, y: 0, rot: 6, elbowRot: 0, scaleX: -1 },
  armFront: { x: 1, y: 0, rot: -4, elbowRot: 0, scaleX: -1 },
  legBack: { x: 0, y: 0, rot: -2, kneeRot: 0, scaleX: -1 },
  legFront: { x: 0, y: 0, rot: 2, kneeRot: 0, scaleX: -1 }
};

export function interpolateRig(
  kf1: CustomKeyframe,
  kf2: CustomKeyframe,
  t: number
): { charPos: { x: number; y: number }; positions: RigPositions } {
  const lerp = (a: number, b: number, factor: number) => a + (b - a) * factor;

  const charPos = {
    x: Math.round(lerp(kf1.charPos.x, kf2.charPos.x, t) * 10) / 10,
    y: Math.round(lerp(kf1.charPos.y, kf2.charPos.y, t) * 10) / 10
  };

  const layers: (keyof RigPositions)[] = [
    'head',
    'torso',
    'armBack',
    'armFront',
    'legBack',
    'legFront'
  ];

  const positions = {} as RigPositions;

  for (const layer of layers) {
    const p1 = kf1.positions[layer];
    const p2 = kf2.positions[layer];

    positions[layer] = {
      x: Math.round(lerp(p1.x, p2.x, t) * 10) / 10,
      y: Math.round(lerp(p1.y, p2.y, t) * 10) / 10,
      rot: Math.round(lerp(p1.rot, p2.rot, t) * 10) / 10,
      scaleX: t < 0.5 ? p1.scaleX : p2.scaleX,
      elbowRot:
        p1.elbowRot !== undefined || p2.elbowRot !== undefined
          ? Math.round(lerp(p1.elbowRot || 0, p2.elbowRot || 0, t) * 10) / 10
          : undefined,
      kneeRot:
        p1.kneeRot !== undefined || p2.kneeRot !== undefined
          ? Math.round(lerp(p1.kneeRot || 0, p2.kneeRot || 0, t) * 10) / 10
          : undefined
    };
  }

  return { charPos, positions };
}

export function generateCssAnimation(
  keyframes: CustomKeyframe[],
  duration: number,
  animName = 'customRigAnimation'
): string {
  if (!keyframes.length) return '';
  const total = keyframes.length;
  let css = `/* Generated Custom 2D Character Animation */\n@keyframes ${animName} {\n`;

  keyframes.forEach((kf, idx) => {
    const percent = total === 1 ? 0 : Math.round((idx / (total - 1)) * 100);
    css += `  /* Keyframe ${idx + 1}: ${kf.name} */\n`;
    css += `  ${percent}% {\n`;
    css += `    --char-x: ${kf.charPos.x}px;\n`;
    css += `    --char-y: ${kf.charPos.y}px;\n`;
    css += `    --head-rot: ${kf.positions.head.rot}deg;\n`;
    css += `    --torso-rot: ${kf.positions.torso.rot}deg;\n`;
    css += `    --arm-back-rot: ${kf.positions.armBack.rot}deg;\n`;
    css += `    --arm-front-rot: ${kf.positions.armFront.rot}deg;\n`;
    css += `    --leg-back-rot: ${kf.positions.legBack.rot}deg;\n`;
    css += `    --leg-front-rot: ${kf.positions.legFront.rot}deg;\n`;
    if (kf.positions.armFront.elbowRot !== undefined) {
      css += `    --arm-front-elbow: ${kf.positions.armFront.elbowRot}deg;\n`;
    }
    if (kf.positions.legFront.kneeRot !== undefined) {
      css += `    --leg-front-knee: ${kf.positions.legFront.kneeRot}deg;\n`;
    }
    css += `  }\n`;
  });

  css += `}\n\n`;
  css += `/* Usage on Character */\n`;
  css += `#character {\n  animation: ${animName} ${duration}s infinite ease-in-out;\n}\n`;

  return css;
}

export function formatAnimationDataForExport(
  name: string,
  keyframes: CustomKeyframe[],
  duration: number
): string {
  let output = `/* ========================================================\n   CUSTOM ANIMATION: ${name.toUpperCase()}\n   Total Frames: ${keyframes.length} | Cycle Duration: ${duration}s\n   ======================================================== */\n\n`;

  keyframes.forEach((kf, idx) => {
    output += `/* Frame ${idx + 1}: ${kf.name} */\n`;
    output += `#character {\n  transform: translate(${kf.charPos.x}px, ${kf.charPos.y}px) scale(1);\n}\n`;
    output += `#wrap-head      { transform: translate(${kf.positions.head.x}px, ${kf.positions.head.y}px) rotate(${kf.positions.head.rot}deg) scaleX(${kf.positions.head.scaleX}); }\n`;
    output += `#wrap-torso     { transform: translate(${kf.positions.torso.x}px, ${kf.positions.torso.y}px) rotate(${kf.positions.torso.rot}deg) scaleX(${kf.positions.torso.scaleX}); }\n`;
    output += `#wrap-arm-back  { transform: translate(${kf.positions.armBack.x}px, ${kf.positions.armBack.y}px) rotate(${kf.positions.armBack.rot}deg) scaleX(${kf.positions.armBack.scaleX}); }${kf.positions.armBack.elbowRot ? ` /* elbow: ${kf.positions.armBack.elbowRot}deg */` : ''}\n`;
    output += `#wrap-arm-front { transform: translate(${kf.positions.armFront.x}px, ${kf.positions.armFront.y}px) rotate(${kf.positions.armFront.rot}deg) scaleX(${kf.positions.armFront.scaleX}); }${kf.positions.armFront.elbowRot ? ` /* elbow: ${kf.positions.armFront.elbowRot}deg */` : ''}\n`;
    output += `#wrap-leg-back  { transform: translate(${kf.positions.legBack.x}px, ${kf.positions.legBack.y}px) rotate(${kf.positions.legBack.rot}deg) scaleX(${kf.positions.legBack.scaleX}); }${kf.positions.legBack.kneeRot ? ` /* knee: ${kf.positions.legBack.kneeRot}deg */` : ''}\n`;
    output += `#wrap-leg-front { transform: translate(${kf.positions.legFront.x}px, ${kf.positions.legFront.y}px) rotate(${kf.positions.legFront.rot}deg) scaleX(${kf.positions.legFront.scaleX}); }${kf.positions.legFront.kneeRot ? ` /* knee: ${kf.positions.legFront.kneeRot}deg */` : ''}\n\n`;
  });

  const animSafeName = name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  output += `/* CSS Keyframes */\n` + generateCssAnimation(keyframes, duration, animSafeName) + `\n\n`;
  output += `/* JSON Preset Data */\n` + JSON.stringify({ name, duration, keyframes }, null, 2);

  return output;
}

export const INITIAL_CUSTOM_PRESETS: CustomAnimationPreset[] = [
  {
    id: 'idle',
    name: 'Idle Stance',
    icon: '🧍',
    duration: 2.0,
    keyframes: [
      {
        id: 'i1',
        name: 'Idle Rest',
        charPos: { x: -75, y: 1 },
        positions: {
          head: { x: 0, y: 0, rot: 0, scaleX: -1 },
          torso: { x: 0, y: 0, rot: 0, scaleX: -1 },
          armBack: { x: 8, y: 0, rot: 6, elbowRot: 0, scaleX: -1 },
          armFront: { x: 1, y: 0, rot: -4, elbowRot: 0, scaleX: -1 },
          legBack: { x: 0, y: 0, rot: -2, kneeRot: 0, scaleX: -1 },
          legFront: { x: 0, y: 0, rot: 2, kneeRot: 0, scaleX: -1 }
        }
      },
      {
        id: 'i2',
        name: 'Subtle Breath',
        charPos: { x: -75, y: -2 },
        positions: {
          head: { x: 0, y: 0, rot: 1, scaleX: -1 },
          torso: { x: 0, y: 0, rot: -1, scaleX: -1 },
          armBack: { x: 8, y: 0, rot: 8, elbowRot: 2, scaleX: -1 },
          armFront: { x: 1, y: 0, rot: -6, elbowRot: 2, scaleX: -1 },
          legBack: { x: 0, y: 0, rot: -2, kneeRot: 0, scaleX: -1 },
          legFront: { x: 0, y: 0, rot: 2, kneeRot: 0, scaleX: -1 }
        }
      },
      {
        id: 'i3',
        name: 'Idle Rest',
        charPos: { x: -75, y: 1 },
        positions: {
          head: { x: 0, y: 0, rot: 0, scaleX: -1 },
          torso: { x: 0, y: 0, rot: 0, scaleX: -1 },
          armBack: { x: 8, y: 0, rot: 6, elbowRot: 0, scaleX: -1 },
          armFront: { x: 1, y: 0, rot: -4, elbowRot: 0, scaleX: -1 },
          legBack: { x: 0, y: 0, rot: -2, kneeRot: 0, scaleX: -1 },
          legFront: { x: 0, y: 0, rot: 2, kneeRot: 0, scaleX: -1 }
        }
      }
    ]
  },
  {
    id: 'wave',
    name: 'Wave Hello',
    icon: '👋',
    duration: 1.2,
    keyframes: [
      {
        id: 'f1',
        name: 'Start Pose',
        charPos: { x: -1, y: 0 },
        positions: {
          head: { x: 0, y: 0, rot: 2, scaleX: -1 },
          torso: { x: 0, y: 0, rot: 0, scaleX: -1 },
          armBack: { x: 8, y: 0, rot: 15, elbowRot: 0, scaleX: -1 },
          armFront: { x: 1, y: 0, rot: -115, elbowRot: 15, scaleX: 1 },
          legBack: { x: 0, y: 0, rot: -4, kneeRot: 0, scaleX: -1 },
          legFront: { x: 0, y: 0, rot: 0, kneeRot: 0, scaleX: -1 }
        }
      },
      {
        id: 'f2',
        name: 'Wave Right',
        charPos: { x: -1, y: 0 },
        positions: {
          head: { x: 0, y: 0, rot: -2, scaleX: -1 },
          torso: { x: 0, y: 0, rot: 2, scaleX: -1 },
          armBack: { x: 8, y: 0, rot: 15, elbowRot: 0, scaleX: -1 },
          armFront: { x: 1, y: 0, rot: -130, elbowRot: 65, scaleX: 1 },
          legBack: { x: 0, y: 0, rot: -4, kneeRot: 0, scaleX: -1 },
          legFront: { x: 0, y: 0, rot: 0, kneeRot: 0, scaleX: -1 }
        }
      },
      {
        id: 'f3',
        name: 'Return Pose',
        charPos: { x: -1, y: 0 },
        positions: {
          head: { x: 0, y: 0, rot: 2, scaleX: -1 },
          torso: { x: 0, y: 0, rot: 0, scaleX: -1 },
          armBack: { x: 8, y: 0, rot: 15, elbowRot: 0, scaleX: -1 },
          armFront: { x: 1, y: 0, rot: -115, elbowRot: 15, scaleX: 1 },
          legBack: { x: 0, y: 0, rot: -4, kneeRot: 0, scaleX: -1 },
          legFront: { x: 0, y: 0, rot: 0, kneeRot: 0, scaleX: -1 }
        }
      }
    ]
  },
  {
    id: 'jump',
    name: 'Joy Jump',
    icon: '🤸',
    duration: 1.0,
    keyframes: [
      {
        id: 'j1',
        name: 'Crouch Prep',
        charPos: { x: -75, y: 15 },
        positions: {
          head: { x: 0, y: 0, rot: 5, scaleX: -1 },
          torso: { x: 0, y: 0, rot: 10, scaleX: -1 },
          armBack: { x: 8, y: 0, rot: 40, elbowRot: 30, scaleX: -1 },
          armFront: { x: 1, y: 0, rot: 35, elbowRot: 30, scaleX: -1 },
          legBack: { x: 0, y: 0, rot: 20, kneeRot: 35, scaleX: -1 },
          legFront: { x: 0, y: 0, rot: -15, kneeRot: 30, scaleX: -1 }
        }
      },
      {
        id: 'j2',
        name: 'Air Peak',
        charPos: { x: -75, y: -50 },
        positions: {
          head: { x: 0, y: 0, rot: -10, scaleX: -1 },
          torso: { x: 0, y: 0, rot: -4, scaleX: -1 },
          armBack: { x: 8, y: 0, rot: -140, elbowRot: 20, scaleX: -1 },
          armFront: { x: 1, y: 0, rot: -155, elbowRot: 15, scaleX: -1 },
          legBack: { x: 0, y: 0, rot: -10, kneeRot: 5, scaleX: -1 },
          legFront: { x: 0, y: 0, rot: 15, kneeRot: 5, scaleX: -1 }
        }
      },
      {
        id: 'j3',
        name: 'Landing',
        charPos: { x: -75, y: 15 },
        positions: {
          head: { x: 0, y: 0, rot: 5, scaleX: -1 },
          torso: { x: 0, y: 0, rot: 10, scaleX: -1 },
          armBack: { x: 8, y: 0, rot: 40, elbowRot: 30, scaleX: -1 },
          armFront: { x: 1, y: 0, rot: 35, elbowRot: 30, scaleX: -1 },
          legBack: { x: 0, y: 0, rot: 20, kneeRot: 35, scaleX: -1 },
          legFront: { x: 0, y: 0, rot: -15, kneeRot: 30, scaleX: -1 }
        }
      }
    ]
  },
  {
    id: 'dance',
    name: 'Dance Groove',
    icon: '💃',
    duration: 1.4,
    keyframes: [
      {
        id: 'd1',
        name: 'Sway Left',
        charPos: { x: -90, y: 0 },
        positions: {
          head: { x: 0, y: 0, rot: 8, scaleX: -1 },
          torso: { x: 0, y: 0, rot: -10, scaleX: -1 },
          armBack: { x: 8, y: 0, rot: 35, elbowRot: 40, scaleX: -1 },
          armFront: { x: 1, y: 0, rot: -45, elbowRot: 30, scaleX: 1 },
          legBack: { x: 0, y: 0, rot: -15, kneeRot: 15, scaleX: -1 },
          legFront: { x: 0, y: 0, rot: 10, kneeRot: 5, scaleX: -1 }
        }
      },
      {
        id: 'd2',
        name: 'Sway Right',
        charPos: { x: -55, y: -4 },
        positions: {
          head: { x: 0, y: 0, rot: -8, scaleX: -1 },
          torso: { x: 0, y: 0, rot: 10, scaleX: -1 },
          armBack: { x: 8, y: 0, rot: -40, elbowRot: 25, scaleX: -1 },
          armFront: { x: 1, y: 0, rot: 45, elbowRot: 40, scaleX: 1 },
          legBack: { x: 0, y: 0, rot: 15, kneeRot: 5, scaleX: -1 },
          legFront: { x: 0, y: 0, rot: -10, kneeRot: 15, scaleX: -1 }
        }
      },
      {
        id: 'd3',
        name: 'Return Left',
        charPos: { x: -90, y: 0 },
        positions: {
          head: { x: 0, y: 0, rot: 8, scaleX: -1 },
          torso: { x: 0, y: 0, rot: -10, scaleX: -1 },
          armBack: { x: 8, y: 0, rot: 35, elbowRot: 40, scaleX: -1 },
          armFront: { x: 1, y: 0, rot: -45, elbowRot: 30, scaleX: 1 },
          legBack: { x: 0, y: 0, rot: -15, kneeRot: 15, scaleX: -1 },
          legFront: { x: 0, y: 0, rot: 10, kneeRot: 5, scaleX: -1 }
        }
      }
    ]
  },
  {
    id: 'kick',
    name: 'Martial Kick',
    icon: '🥋',
    duration: 1.1,
    keyframes: [
      {
        id: 'k1',
        name: 'Guard Stance',
        charPos: { x: -75, y: 0 },
        positions: {
          head: { x: 0, y: 0, rot: 2, scaleX: -1 },
          torso: { x: 0, y: 0, rot: 2, scaleX: -1 },
          armBack: { x: 8, y: 0, rot: -30, elbowRot: 60, scaleX: -1 },
          armFront: { x: 1, y: 0, rot: -50, elbowRot: 50, scaleX: -1 },
          legBack: { x: 0, y: 0, rot: -20, kneeRot: 20, scaleX: -1 },
          legFront: { x: 0, y: 0, rot: 15, kneeRot: 40, scaleX: -1 }
        }
      },
      {
        id: 'k2',
        name: 'High Kick Out',
        charPos: { x: -65, y: -8 },
        positions: {
          head: { x: 0, y: 0, rot: -6, scaleX: -1 },
          torso: { x: 0, y: 0, rot: -16, scaleX: -1 },
          armBack: { x: 8, y: 0, rot: 25, elbowRot: 20, scaleX: -1 },
          armFront: { x: 1, y: 0, rot: -80, elbowRot: 15, scaleX: -1 },
          legBack: { x: 0, y: 0, rot: -10, kneeRot: 5, scaleX: -1 },
          legFront: { x: 0, y: 0, rot: 85, kneeRot: 0, scaleX: -1 }
        }
      },
      {
        id: 'k3',
        name: 'Return Guard',
        charPos: { x: -75, y: 0 },
        positions: {
          head: { x: 0, y: 0, rot: 2, scaleX: -1 },
          torso: { x: 0, y: 0, rot: 2, scaleX: -1 },
          armBack: { x: 8, y: 0, rot: -30, elbowRot: 60, scaleX: -1 },
          armFront: { x: 1, y: 0, rot: -50, elbowRot: 50, scaleX: -1 },
          legBack: { x: 0, y: 0, rot: -20, kneeRot: 20, scaleX: -1 },
          legFront: { x: 0, y: 0, rot: 15, kneeRot: 40, scaleX: -1 }
        }
      }
    ]
  }
];
