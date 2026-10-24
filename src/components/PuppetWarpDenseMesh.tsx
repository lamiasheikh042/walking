/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// Common styling matching Photoshop Puppet Warp reference image:
// - Dark charcoal/black boundary outline
// - Fine triangulated internal wireframe lines
// - Distinctive purple/magenta starburst spoke lines radiating from each joint pin
const MESH_STROKE = '#1e293b';
const MESH_FILL = 'rgba(255, 255, 255, 0.08)';
const SPOKE_PURPLE = '#a855f7';

// 1. Head Dense Mesh
export const HeadMesh: React.FC = () => {
  const center = { x: 32, y: 28 };
  const boundaryPts = [
    { x: 32, y: 6 },
    { x: 42, y: 10 },
    { x: 47, y: 19 },
    { x: 46, y: 31 },
    { x: 40, y: 41 },
    { x: 32, y: 46 },
    { x: 24, y: 41 },
    { x: 18, y: 31 },
    { x: 17, y: 19 },
    { x: 22, y: 10 }
  ];

  const neckPts = [
    { x: 25, y: 46 },
    { x: 39, y: 46 },
    { x: 38, y: 58 },
    { x: 25, y: 58 }
  ];

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-40 overflow-visible" viewBox="0 0 62 62">
      {/* Outer Contour Outline */}
      <polygon
        points={boundaryPts.map((p) => `${p.x},${p.y}`).join(' ')}
        fill={MESH_FILL}
        stroke={MESH_STROKE}
        strokeWidth="1.4"
      />
      <polygon
        points={neckPts.map((p) => `${p.x},${p.y}`).join(' ')}
        fill={MESH_FILL}
        stroke={MESH_STROKE}
        strokeWidth="1.4"
      />

      {/* Internal Triangulation Ring */}
      {boundaryPts.map((pt, i) => {
        const next = boundaryPts[(i + 1) % boundaryPts.length];
        return (
          <line
            key={`hb-${i}`}
            x1={pt.x}
            y1={pt.y}
            x2={next.x}
            y2={next.y}
            stroke={MESH_STROKE}
            strokeWidth="0.8"
          />
        );
      })}

      {/* Neck Cross Triangulation */}
      <line x1="25" y1="46" x2="38" y2="58" stroke={MESH_STROKE} strokeWidth="0.8" />
      <line x1="39" y1="46" x2="25" y2="58" stroke={MESH_STROKE} strokeWidth="0.8" />

      {/* Purple Starburst Spoke Lines radiating from Pin 1 (matching reference image) */}
      {boundaryPts.map((pt, i) => (
        <line
          key={`spoke-h-${i}`}
          x1={center.x}
          y1={center.y}
          x2={pt.x}
          y2={pt.y}
          stroke={SPOKE_PURPLE}
          strokeWidth="1.1"
          strokeDasharray={i % 2 === 0 ? 'none' : '3 1.5'}
        />
      ))}
      <line x1={center.x} y1={center.y} x2="32" y2="52" stroke={SPOKE_PURPLE} strokeWidth="1.2" />

      {/* Pin 1 Anchor Node */}
      <circle cx={center.x} cy={center.y} r="2.5" fill="#facc15" stroke="#ffffff" strokeWidth="0.8" />
    </svg>
  );
};

// 2. Torso & Pelvis Dense Mesh
export const TorsoMesh: React.FC = () => {
  const pinChest = { x: 26, y: 24 };
  const pinWaist = { x: 26, y: 85 };

  const chestNodes = [
    { x: 10, y: 4 },
    { x: 26, y: 2 },
    { x: 44, y: 4 },
    { x: 8, y: 24 },
    { x: 26, y: 24 },
    { x: 46, y: 24 },
    { x: 8, y: 46 },
    { x: 26, y: 46 },
    { x: 46, y: 46 },
    { x: 9, y: 68 },
    { x: 26, y: 68 },
    { x: 45, y: 68 }
  ];

  const pelvisNodes = [
    { x: 10, y: 82 },
    { x: 26, y: 82 },
    { x: 43, y: 82 },
    { x: 12, y: 100 },
    { x: 26, y: 101 },
    { x: 40, y: 100 }
  ];

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-40 overflow-visible" viewBox="0 0 50 102">
      {/* Outer Torso Contour */}
      <path
        d="M 10 2 C 22 0 36 0 44 4 C 47 24 47 70 43 83 C 34 85 22 85 10 83 C 7 68 7 24 10 2 Z"
        fill={MESH_FILL}
        stroke={MESH_STROKE}
        strokeWidth="1.4"
      />
      {/* Pelvis Contour */}
      <path
        d="M 9 84 L 42 84 C 44 92 42 100 38 101 C 30 102 22 102 14 101 C 10 99 9 92 9 84 Z"
        fill={MESH_FILL}
        stroke={MESH_STROKE}
        strokeWidth="1.4"
      />

      {/* Torso Internal Horizontal Rungs & Cross Diagonals */}
      <line x1="8" y1="24" x2="46" y2="24" stroke={MESH_STROKE} strokeWidth="0.8" />
      <line x1="8" y1="46" x2="46" y2="46" stroke={MESH_STROKE} strokeWidth="0.8" />
      <line x1="9" y1="68" x2="45" y2="68" stroke={MESH_STROKE} strokeWidth="0.8" />
      <line x1="10" y1="82" x2="43" y2="82" stroke={MESH_STROKE} strokeWidth="0.8" />

      {/* Diagonals */}
      <line x1="10" y1="4" x2="26" y2="24" stroke={MESH_STROKE} strokeWidth="0.75" />
      <line x1="44" y1="4" x2="26" y2="24" stroke={MESH_STROKE} strokeWidth="0.75" />
      <line x1="8" y1="24" x2="26" y2="46" stroke={MESH_STROKE} strokeWidth="0.75" />
      <line x1="46" y1="24" x2="26" y2="46" stroke={MESH_STROKE} strokeWidth="0.75" />
      <line x1="26" y1="24" x2="8" y2="46" stroke={MESH_STROKE} strokeWidth="0.75" />
      <line x1="26" y1="24" x2="46" y2="46" stroke={MESH_STROKE} strokeWidth="0.75" />
      <line x1="8" y1="46" x2="26" y2="68" stroke={MESH_STROKE} strokeWidth="0.75" />
      <line x1="46" y1="46" x2="26" y2="68" stroke={MESH_STROKE} strokeWidth="0.75" />
      <line x1="26" y1="46" x2="9" y2="68" stroke={MESH_STROKE} strokeWidth="0.75" />
      <line x1="26" y1="46" x2="45" y2="68" stroke={MESH_STROKE} strokeWidth="0.75" />

      {/* Pelvis Triangles */}
      <line x1="10" y1="82" x2="26" y2="101" stroke={MESH_STROKE} strokeWidth="0.75" />
      <line x1="43" y1="82" x2="26" y2="101" stroke={MESH_STROKE} strokeWidth="0.75" />
      <line x1="26" y1="82" x2="12" y2="100" stroke={MESH_STROKE} strokeWidth="0.75" />
      <line x1="26" y1="82" x2="40" y2="100" stroke={MESH_STROKE} strokeWidth="0.75" />

      {/* Purple Starburst Spokes for Pin 2 (Chest) */}
      {chestNodes.map((pt, i) => (
        <line
          key={`spoke-c-${i}`}
          x1={pinChest.x}
          y1={pinChest.y}
          x2={pt.x}
          y2={pt.y}
          stroke={SPOKE_PURPLE}
          strokeWidth="1.1"
          strokeDasharray={i % 2 === 0 ? 'none' : '3 1.5'}
        />
      ))}

      {/* Purple Starburst Spokes for Pin 3 (Waist) */}
      {pelvisNodes.map((pt, i) => (
        <line
          key={`spoke-w-${i}`}
          x1={pinWaist.x}
          y1={pinWaist.y}
          x2={pt.x}
          y2={pt.y}
          stroke={SPOKE_PURPLE}
          strokeWidth="1.1"
        />
      ))}

      {/* Spoke connection between Chest and Waist */}
      <line x1={pinChest.x} y1={pinChest.y} x2={pinWaist.x} y2={pinWaist.y} stroke={SPOKE_PURPLE} strokeWidth="1.4" />

      <circle cx={pinChest.x} cy={pinChest.y} r="2.5" fill="#facc15" stroke="#ffffff" strokeWidth="0.8" />
      <circle cx={pinWaist.x} cy={pinWaist.y} r="2.5" fill="#facc15" stroke="#ffffff" strokeWidth="0.8" />
    </svg>
  );
};

// 3. Upper Arm Dense Mesh (Shoulder to Elbow)
export const UpperArmMesh: React.FC<{ pinNumber: number }> = ({ pinNumber }) => {
  const pin = { x: 12, y: 10 };
  const rungs = [
    { l: { x: 3, y: 6 }, r: { x: 21, y: 6 } },
    { l: { x: 3, y: 20 }, r: { x: 21, y: 20 } },
    { l: { x: 4, y: 34 }, r: { x: 20, y: 34 } },
    { l: { x: 4, y: 48 }, r: { x: 20, y: 48 } },
    { l: { x: 5, y: 62 }, r: { x: 19, y: 62 } }
  ];

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-40 overflow-visible" viewBox="0 0 24 64">
      {/* Outer Outline */}
      <path
        d="M 3 14 C 3 4 21 4 21 14 L 19 62 L 5 62 Z"
        fill={MESH_FILL}
        stroke={MESH_STROKE}
        strokeWidth="1.4"
      />

      {/* Rungs & Diagonals */}
      {rungs.map((r, i) => (
        <React.Fragment key={`u-arm-${i}`}>
          <line x1={r.l.x} y1={r.l.y} x2={r.r.x} y2={r.r.y} stroke={MESH_STROKE} strokeWidth="0.8" />
          {i < rungs.length - 1 && (
            <>
              <line x1={r.l.x} y1={r.l.y} x2={rungs[i + 1].r.x} y2={rungs[i + 1].r.y} stroke={MESH_STROKE} strokeWidth="0.75" />
              <line x1={r.r.x} y1={r.r.y} x2={rungs[i + 1].l.x} y2={rungs[i + 1].l.y} stroke={MESH_STROKE} strokeWidth="0.75" />
            </>
          )}
        </React.Fragment>
      ))}

      {/* Purple Starburst Spokes for Shoulder Pin */}
      <line x1={pin.x} y1={pin.y} x2="3" y2="6" stroke={SPOKE_PURPLE} strokeWidth="1.1" />
      <line x1={pin.x} y1={pin.y} x2="21" y2="6" stroke={SPOKE_PURPLE} strokeWidth="1.1" />
      <line x1={pin.x} y1={pin.y} x2="3" y2="20" stroke={SPOKE_PURPLE} strokeWidth="1.1" />
      <line x1={pin.x} y1={pin.y} x2="21" y2="20" stroke={SPOKE_PURPLE} strokeWidth="1.1" />
      <line x1={pin.x} y1={pin.y} x2="12" y2="34" stroke={SPOKE_PURPLE} strokeWidth="1.1" />

      <circle cx={pin.x} cy={pin.y} r="2.5" fill="#facc15" stroke="#ffffff" strokeWidth="0.8" />
    </svg>
  );
};

// 4. Forearm & Hand Dense Mesh (Elbow to Hand)
export const ForearmMesh: React.FC<{ elbowPin: number; wristPin: number }> = () => {
  const pinElbow = { x: 12, y: 8 };
  const pinWrist = { x: 12, y: 50 };

  const rungs = [
    { l: { x: 4, y: 6 }, r: { x: 20, y: 6 } },
    { l: { x: 4, y: 18 }, r: { x: 20, y: 18 } },
    { l: { x: 5, y: 30 }, r: { x: 19, y: 30 } },
    { l: { x: 5, y: 42 }, r: { x: 19, y: 42 } },
    { l: { x: 6, y: 52 }, r: { x: 18, y: 52 } }
  ];

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-40 overflow-visible" viewBox="0 0 24 74">
      {/* Outer Outline of Forearm & Hand */}
      <path
        d="M 4 12 C 4 3 20 3 20 12 L 18 48 Q 20 54 18 64 C 16 72 8 72 6 64 Q 4 54 6 48 Z"
        fill={MESH_FILL}
        stroke={MESH_STROKE}
        strokeWidth="1.4"
      />

      {/* Rungs & Cross Diagonals */}
      {rungs.map((r, i) => (
        <React.Fragment key={`fa-r-${i}`}>
          <line x1={r.l.x} y1={r.l.y} x2={r.r.x} y2={r.r.y} stroke={MESH_STROKE} strokeWidth="0.8" />
          {i < rungs.length - 1 && (
            <>
              <line x1={r.l.x} y1={r.l.y} x2={rungs[i + 1].r.x} y2={rungs[i + 1].r.y} stroke={MESH_STROKE} strokeWidth="0.75" />
              <line x1={r.r.x} y1={r.r.y} x2={rungs[i + 1].l.x} y2={rungs[i + 1].l.y} stroke={MESH_STROKE} strokeWidth="0.75" />
            </>
          )}
        </React.Fragment>
      ))}

      {/* Hand Finger Web Triangles */}
      <line x1="6" y1="52" x2="12" y2="70" stroke={MESH_STROKE} strokeWidth="0.8" />
      <line x1="18" y1="52" x2="12" y2="70" stroke={MESH_STROKE} strokeWidth="0.8" />
      <line x1="9" y1="52" x2="9" y2="68" stroke={MESH_STROKE} strokeWidth="0.7" />
      <line x1="15" y1="52" x2="15" y2="68" stroke={MESH_STROKE} strokeWidth="0.7" />

      {/* Purple Starburst Spokes for Elbow Pin */}
      <line x1={pinElbow.x} y1={pinElbow.y} x2="4" y2="6" stroke={SPOKE_PURPLE} strokeWidth="1.1" />
      <line x1={pinElbow.x} y1={pinElbow.y} x2="20" y2="6" stroke={SPOKE_PURPLE} strokeWidth="1.1" />
      <line x1={pinElbow.x} y1={pinElbow.y} x2="4" y2="18" stroke={SPOKE_PURPLE} strokeWidth="1.1" />
      <line x1={pinElbow.x} y1={pinElbow.y} x2="20" y2="18" stroke={SPOKE_PURPLE} strokeWidth="1.1" />
      <line x1={pinElbow.x} y1={pinElbow.y} x2="12" y2="30" stroke={SPOKE_PURPLE} strokeWidth="1.1" />

      {/* Purple Starburst Spokes for Wrist/Hand Pin */}
      <line x1={pinWrist.x} y1={pinWrist.y} x2="5" y2="42" stroke={SPOKE_PURPLE} strokeWidth="1.1" />
      <line x1={pinWrist.x} y1={pinWrist.y} x2="19" y2="42" stroke={SPOKE_PURPLE} strokeWidth="1.1" />
      <line x1={pinWrist.x} y1={pinWrist.y} x2="6" y2="52" stroke={SPOKE_PURPLE} strokeWidth="1.1" />
      <line x1={pinWrist.x} y1={pinWrist.y} x2="18" y2="52" stroke={SPOKE_PURPLE} strokeWidth="1.1" />
      <line x1={pinWrist.x} y1={pinWrist.y} x2="12" y2="70" stroke={SPOKE_PURPLE} strokeWidth="1.1" />

      <circle cx={pinElbow.x} cy={pinElbow.y} r="2.5" fill="#facc15" stroke="#ffffff" strokeWidth="0.8" />
      <circle cx={pinWrist.x} cy={pinWrist.y} r="2.5" fill="#facc15" stroke="#ffffff" strokeWidth="0.8" />
    </svg>
  );
};

// 5. Thigh Dense Mesh (Hip to Knee)
export const ThighMesh: React.FC<{ pinNumber: number }> = () => {
  const pin = { x: 13, y: 10 };
  const rungs = [
    { l: { x: 3, y: 6 }, r: { x: 23, y: 6 } },
    { l: { x: 3, y: 22 }, r: { x: 23, y: 22 } },
    { l: { x: 4, y: 40 }, r: { x: 22, y: 40 } },
    { l: { x: 4, y: 56 }, r: { x: 22, y: 56 } },
    { l: { x: 5, y: 74 }, r: { x: 21, y: 74 } }
  ];

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-40 overflow-visible" viewBox="0 0 26 76">
      {/* Outer Outline */}
      <path
        d="M 3 14 C 3 3 23 3 23 14 L 21 74 L 5 74 Z"
        fill={MESH_FILL}
        stroke={MESH_STROKE}
        strokeWidth="1.4"
      />

      {/* Rungs & Diagonals */}
      {rungs.map((r, i) => (
        <React.Fragment key={`thigh-r-${i}`}>
          <line x1={r.l.x} y1={r.l.y} x2={r.r.x} y2={r.r.y} stroke={MESH_STROKE} strokeWidth="0.8" />
          {i < rungs.length - 1 && (
            <>
              <line x1={r.l.x} y1={r.l.y} x2={rungs[i + 1].r.x} y2={rungs[i + 1].r.y} stroke={MESH_STROKE} strokeWidth="0.75" />
              <line x1={r.r.x} y1={r.r.y} x2={rungs[i + 1].l.x} y2={rungs[i + 1].l.y} stroke={MESH_STROKE} strokeWidth="0.75" />
            </>
          )}
        </React.Fragment>
      ))}

      {/* Purple Starburst Spokes for Hip Pin */}
      <line x1={pin.x} y1={pin.y} x2="3" y2="6" stroke={SPOKE_PURPLE} strokeWidth="1.1" />
      <line x1={pin.x} y1={pin.y} x2="23" y2="6" stroke={SPOKE_PURPLE} strokeWidth="1.1" />
      <line x1={pin.x} y1={pin.y} x2="3" y2="22" stroke={SPOKE_PURPLE} strokeWidth="1.1" />
      <line x1={pin.x} y1={pin.y} x2="23" y2="22" stroke={SPOKE_PURPLE} strokeWidth="1.1" />
      <line x1={pin.x} y1={pin.y} x2="13" y2="40" stroke={SPOKE_PURPLE} strokeWidth="1.1" />

      <circle cx={pin.x} cy={pin.y} r="2.5" fill="#facc15" stroke="#ffffff" strokeWidth="0.8" />
    </svg>
  );
};

// 6. Calf Dense Mesh (Knee to Foot)
export const CalfMesh: React.FC<{ pinNumber: number }> = () => {
  const pin = { x: 13, y: 8 };
  const rungs = [
    { l: { x: 4, y: 6 }, r: { x: 22, y: 6 } },
    { l: { x: 4, y: 22 }, r: { x: 22, y: 22 } },
    { l: { x: 5, y: 40 }, r: { x: 21, y: 40 } },
    { l: { x: 5, y: 58 }, r: { x: 21, y: 58 } },
    { l: { x: 6, y: 74 }, r: { x: 20, y: 74 } }
  ];

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-40 overflow-visible" viewBox="0 0 26 85">
      {/* Outer Outline */}
      <path
        d="M 4 12 C 4 3 22 3 22 12 L 20 74 L 6 74 Z"
        fill={MESH_FILL}
        stroke={MESH_STROKE}
        strokeWidth="1.4"
      />

      {/* Rungs & Diagonals */}
      {rungs.map((r, i) => (
        <React.Fragment key={`calf-r-${i}`}>
          <line x1={r.l.x} y1={r.l.y} x2={r.r.x} y2={r.r.y} stroke={MESH_STROKE} strokeWidth="0.8" />
          {i < rungs.length - 1 && (
            <>
              <line x1={r.l.x} y1={r.l.y} x2={rungs[i + 1].r.x} y2={rungs[i + 1].r.y} stroke={MESH_STROKE} strokeWidth="0.75" />
              <line x1={r.r.x} y1={r.r.y} x2={rungs[i + 1].l.x} y2={rungs[i + 1].l.y} stroke={MESH_STROKE} strokeWidth="0.75" />
            </>
          )}
        </React.Fragment>
      ))}

      {/* Purple Starburst Spokes for Knee Pin */}
      <line x1={pin.x} y1={pin.y} x2="4" y2="6" stroke={SPOKE_PURPLE} strokeWidth="1.1" />
      <line x1={pin.x} y1={pin.y} x2="22" y2="6" stroke={SPOKE_PURPLE} strokeWidth="1.1" />
      <line x1={pin.x} y1={pin.y} x2="4" y2="22" stroke={SPOKE_PURPLE} strokeWidth="1.1" />
      <line x1={pin.x} y1={pin.y} x2="22" y2="22" stroke={SPOKE_PURPLE} strokeWidth="1.1" />
      <line x1={pin.x} y1={pin.y} x2="13" y2="40" stroke={SPOKE_PURPLE} strokeWidth="1.1" />

      <circle cx={pin.x} cy={pin.y} r="2.5" fill="#facc15" stroke="#ffffff" strokeWidth="0.8" />
    </svg>
  );
};

// 7. Foot Dense Mesh
export const FootMesh: React.FC<{ pinNumber: number }> = () => {
  const pin = { x: 16, y: 8 };

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-40 overflow-visible" viewBox="0 0 46 22">
      <path
        d="M 6 14 L 11 5 L 20 5 L 25 8 L 40 11 C 45 12 45 16 41 16 L 6 16 Z"
        fill={MESH_FILL}
        stroke={MESH_STROKE}
        strokeWidth="1.4"
      />
      {/* Triangulation */}
      <line x1="11" y1="5" x2="20" y2="16" stroke={MESH_STROKE} strokeWidth="0.8" />
      <line x1="20" y1="5" x2="30" y2="16" stroke={MESH_STROKE} strokeWidth="0.8" />
      <line x1="25" y1="8" x2="40" y2="16" stroke={MESH_STROKE} strokeWidth="0.8" />
      <line x1="6" y1="14" x2="41" y2="14" stroke={MESH_STROKE} strokeWidth="0.75" />

      {/* Purple Starburst Spokes for Ankle Pin */}
      <line x1={pin.x} y1={pin.y} x2="11" y2="5" stroke={SPOKE_PURPLE} strokeWidth="1.1" />
      <line x1={pin.x} y1={pin.y} x2="20" y2="5" stroke={SPOKE_PURPLE} strokeWidth="1.1" />
      <line x1={pin.x} y1={pin.y} x2="6" y2="16" stroke={SPOKE_PURPLE} strokeWidth="1.1" />
      <line x1={pin.x} y1={pin.y} x2="25" y2="16" stroke={SPOKE_PURPLE} strokeWidth="1.1" />
      <line x1={pin.x} y1={pin.y} x2="40" y2="14" stroke={SPOKE_PURPLE} strokeWidth="1.1" />

      <circle cx={pin.x} cy={pin.y} r="2.5" fill="#facc15" stroke="#ffffff" strokeWidth="0.8" />
    </svg>
  );
};
