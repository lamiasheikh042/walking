/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// Wood texture gradient definitions used across all mannequin parts
export const WoodenDefs: React.FC = () => (
  <defs>
    <linearGradient id="woodBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#fef3c7" />
      <stop offset="35%" stopColor="#fde68a" />
      <stop offset="70%" stopColor="#d97706" />
      <stop offset="100%" stopColor="#b45309" />
    </linearGradient>

    <radialGradient id="woodBallGrad" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stopColor="#fffbeb" />
      <stop offset="40%" stopColor="#fde68a" />
      <stop offset="85%" stopColor="#d97706" />
      <stop offset="100%" stopColor="#92400e" />
    </radialGradient>

    <linearGradient id="woodCylinderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#b45309" />
      <stop offset="25%" stopColor="#fde68a" />
      <stop offset="60%" stopColor="#f59e0b" />
      <stop offset="100%" stopColor="#78350f" />
    </linearGradient>
  </defs>
);

// Wooden Mannequin Head
export const WoodenHead: React.FC = () => (
  <svg viewBox="0 0 62 62" className="w-full h-full drop-shadow-md overflow-visible">
    <WoodenDefs />
    {/* Neck Ball Socket */}
    <ellipse cx="32" cy="52" rx="7" ry="6" fill="url(#woodBallGrad)" stroke="#78350f" strokeWidth="0.8" />
    {/* Wooden Mannequin Oval Head */}
    <ellipse cx="32" cy="26" rx="14" ry="20" fill="url(#woodBodyGrad)" stroke="#78350f" strokeWidth="1" />
    {/* Lathe Wood Turning Ring Grain Marks */}
    <ellipse cx="32" cy="20" rx="12" ry="4" fill="none" stroke="#b45309" strokeWidth="0.6" opacity="0.4" />
    <ellipse cx="32" cy="32" rx="12.5" ry="4" fill="none" stroke="#b45309" strokeWidth="0.6" opacity="0.4" />
    {/* Center Face Ridge */}
    <path d="M 32 16 L 32 36" stroke="#92400e" strokeWidth="0.8" opacity="0.3" strokeDasharray="2 2" />
  </svg>
);

// Wooden Mannequin Torso
export const WoodenTorso: React.FC = () => (
  <svg viewBox="0 0 50 102" className="w-full h-full drop-shadow-md overflow-visible">
    <WoodenDefs />
    {/* Upper Chest Block */}
    <path
      d="M 12 6 C 20 2 32 2 40 6 L 43 46 C 40 50 12 50 9 46 Z"
      fill="url(#woodBodyGrad)"
      stroke="#78350f"
      strokeWidth="1"
    />
    {/* Chest Pectoral Contour */}
    <path d="M 12 32 Q 26 38 40 32" stroke="#92400e" strokeWidth="0.8" fill="none" opacity="0.5" />
    <line x1="26" y1="8" x2="26" y2="44" stroke="#92400e" strokeWidth="0.8" opacity="0.4" />

    {/* Center Waist Wooden Sphere Ball Joint */}
    <circle cx="26" cy="62" r="14" fill="url(#woodBallGrad)" stroke="#78350f" strokeWidth="1" />

    {/* Lower Pelvis Wooden Block */}
    <path
      d="M 10 74 L 42 74 C 44 88 40 98 36 100 C 28 102 24 102 16 100 C 12 98 8 88 10 74 Z"
      fill="url(#woodBodyGrad)"
      stroke="#78350f"
      strokeWidth="1"
    />
    <ellipse cx="26" cy="74" rx="16" ry="3" fill="#b45309" opacity="0.4" />
  </svg>
);

// Wooden Mannequin Upper Arm (Ball shoulder + wooden cylinder)
export const WoodenUpperArm: React.FC = () => (
  <svg viewBox="0 0 24 64" className="w-full h-full overflow-visible">
    <WoodenDefs />
    {/* Shoulder Sphere Ball */}
    <circle cx="12" cy="10" r="9" fill="url(#woodBallGrad)" stroke="#78350f" strokeWidth="0.8" />
    {/* Upper Arm Cylinder */}
    <path
      d="M 5 18 C 5 12 19 12 19 18 L 18 56 C 18 60 6 60 6 56 Z"
      fill="url(#woodCylinderGrad)"
      stroke="#78350f"
      strokeWidth="0.9"
    />
    {/* Wood rings */}
    <ellipse cx="12" cy="36" rx="6" ry="1.8" fill="none" stroke="#78350f" strokeWidth="0.5" opacity="0.3" />
  </svg>
);

// Wooden Mannequin Forearm & Hand (Ball elbow + cylinder + wooden hand)
export const WoodenLowerArm: React.FC = () => (
  <svg viewBox="0 0 24 74" className="w-full h-full overflow-visible">
    <WoodenDefs />
    {/* Elbow Sphere Ball */}
    <circle cx="12" cy="8" r="7.5" fill="url(#woodBallGrad)" stroke="#78350f" strokeWidth="0.8" />
    {/* Forearm Cylinder */}
    <path
      d="M 6 12 C 6 8 18 8 18 12 L 17 48 C 17 52 7 52 7 48 Z"
      fill="url(#woodCylinderGrad)"
      stroke="#78350f"
      strokeWidth="0.9"
    />
    {/* Wrist Sphere Ball */}
    <circle cx="12" cy="50" r="5" fill="url(#woodBallGrad)" stroke="#78350f" strokeWidth="0.8" />
    {/* Carved Wooden Hand */}
    <path
      d="M 8 52 C 6 58 6 68 12 72 C 18 68 18 58 16 52 Z"
      fill="url(#woodBodyGrad)"
      stroke="#78350f"
      strokeWidth="0.9"
    />
    <line x1="12" y1="56" x2="12" y2="69" stroke="#92400e" strokeWidth="0.6" opacity="0.4" />
  </svg>
);

// Wooden Mannequin Thigh (Ball hip + wooden thigh cylinder)
export const WoodenThigh: React.FC = () => (
  <svg viewBox="0 0 26 76" className="w-full h-full overflow-visible">
    <WoodenDefs />
    {/* Hip Sphere Ball */}
    <circle cx="13" cy="10" r="9.5" fill="url(#woodBallGrad)" stroke="#78350f" strokeWidth="0.8" />
    {/* Thigh Cylinder */}
    <path
      d="M 5 18 C 5 12 21 12 21 18 L 20 68 C 20 72 6 72 6 68 Z"
      fill="url(#woodCylinderGrad)"
      stroke="#78350f"
      strokeWidth="0.9"
    />
    <ellipse cx="13" cy="42" rx="7" ry="2" fill="none" stroke="#78350f" strokeWidth="0.5" opacity="0.3" />
  </svg>
);

// Wooden Mannequin Calf (Ball knee + wooden calf cylinder)
export const WoodenCalf: React.FC = () => (
  <svg viewBox="0 0 26 85" className="w-full h-full overflow-visible">
    <WoodenDefs />
    {/* Knee Sphere Ball */}
    <circle cx="13" cy="8" r="8.5" fill="url(#woodBallGrad)" stroke="#78350f" strokeWidth="0.8" />
    {/* Calf Cylinder */}
    <path
      d="M 6 14 C 6 8 20 8 20 14 L 19 72 C 19 76 7 76 7 72 Z"
      fill="url(#woodCylinderGrad)"
      stroke="#78350f"
      strokeWidth="0.9"
    />
    <ellipse cx="13" cy="45" rx="6.5" ry="2" fill="none" stroke="#78350f" strokeWidth="0.5" opacity="0.3" />
  </svg>
);

// Wooden Mannequin Foot (Ball ankle + wooden wedge foot)
export const WoodenFoot: React.FC = () => (
  <svg viewBox="0 0 46 22" className="w-full h-full overflow-visible drop-shadow-sm">
    <WoodenDefs />
    {/* Ankle Sphere Ball */}
    <circle cx="16" cy="8" r="6.5" fill="url(#woodBallGrad)" stroke="#78350f" strokeWidth="0.8" />
    {/* Wooden Wedge Foot */}
    <path
      d="M 8 10 L 16 4 L 24 4 L 38 12 C 44 14 43 18 38 18 L 8 18 Z"
      fill="url(#woodBodyGrad)"
      stroke="#78350f"
      strokeWidth="0.9"
    />
  </svg>
);
