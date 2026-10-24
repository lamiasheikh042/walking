/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RigPositions } from '../types/rig';

interface PuppetWarpMeshProps {
  positions: RigPositions;
  meshColor: 'gold' | 'cyan' | 'purple';
  activePinId: number | null;
  hoveredPinId: number | null;
  pinScreenPositions: { [pinId: number]: { x: number; y: number } };
}

export const PuppetWarpMesh: React.FC<PuppetWarpMeshProps> = ({
  meshColor,
  activePinId,
  hoveredPinId,
  pinScreenPositions
}) => {
  const lineClass =
    meshColor === 'cyan'
      ? 'puppet-mesh-line-cyan'
      : meshColor === 'purple'
      ? 'puppet-mesh-line-purple'
      : 'puppet-mesh-line-gold';

  const triClass =
    meshColor === 'cyan'
      ? 'puppet-mesh-tri-cyan'
      : meshColor === 'purple'
      ? 'puppet-mesh-tri-purple'
      : 'puppet-mesh-tri-gold';

  const p = (id: number) => pinScreenPositions[id];

  // Triangular face definitions by Joint ID
  const triangles: [number, number, number][] = [
    // Head & Torso
    [1, 4, 2], // Head - Back Shoulder - Chest
    [1, 7, 2], // Head - Front Shoulder - Chest
    [4, 7, 2], // Back Shoulder - Front Shoulder - Chest
    [4, 2, 3], // Back Shoulder - Chest - Waist
    [7, 2, 3], // Front Shoulder - Chest - Waist

    // Back Arm
    [4, 5, 2], // Back Shoulder - Back Elbow - Chest
    [5, 6, 4], // Back Elbow - Back Wrist - Back Shoulder

    // Front Arm
    [7, 8, 2], // Front Shoulder - Front Elbow - Chest
    [8, 9, 7], // Front Elbow - Front Wrist - Front Shoulder

    // Pelvis & Legs
    [3, 10, 13], // Waist - Back Hip - Front Hip
    [10, 11, 3], // Back Hip - Back Knee - Waist
    [13, 14, 3], // Front Hip - Front Knee - Waist
    [11, 12, 10], // Back Knee - Back Ankle - Back Hip
    [14, 15, 13], // Front Knee - Front Ankle - Front Hip
    [10, 13, 14], // Cross-lattice
    [10, 11, 13]
  ];

  // Mesh connection lines
  const lines: [number, number][] = [
    // Spine
    [1, 2],
    [2, 3],
    // Shoulder bridge
    [4, 7],
    [4, 2],
    [7, 2],
    [1, 4],
    [1, 7],
    // Back Arm
    [4, 5],
    [5, 6],
    // Front Arm
    [7, 8],
    [8, 9],
    // Hips
    [3, 10],
    [3, 13],
    [10, 13],
    // Back Leg
    [10, 11],
    [11, 12],
    // Front Leg
    [13, 14],
    [14, 15],
    // Diagonal cross supports for authentic triangulation
    [4, 3],
    [7, 3],
    [10, 14],
    [13, 11]
  ];

  const nodeColor =
    meshColor === 'cyan'
      ? '#22d3ee'
      : meshColor === 'purple'
      ? '#c084fc'
      : '#facc15';

  return (
    <svg className="puppet-warp-mesh-svg" viewBox="0 0 120 300">
      <defs>
        <filter id="meshGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Triangular Faces */}
      <g className="mesh-triangles">
        {triangles.map(([id1, id2, id3], idx) => {
          const pt1 = p(id1);
          const pt2 = p(id2);
          const pt3 = p(id3);
          if (!pt1 || !pt2 || !pt3) return null;

          const isHighlighted =
            activePinId === id1 ||
            activePinId === id2 ||
            activePinId === id3 ||
            hoveredPinId === id1 ||
            hoveredPinId === id2 ||
            hoveredPinId === id3;

          return (
            <polygon
              key={`tri-${idx}`}
              points={`${pt1.x},${pt1.y} ${pt2.x},${pt2.y} ${pt3.x},${pt3.y}`}
              className={triClass}
              style={{
                fillOpacity: isHighlighted ? 0.22 : 0.08,
                strokeOpacity: isHighlighted ? 0.9 : 0.45,
                transition: 'fill-opacity 0.2s, stroke-opacity 0.2s'
              }}
            />
          );
        })}
      </g>

      {/* Wireframe Mesh Lines */}
      <g className="mesh-lines">
        {lines.map(([id1, id2], idx) => {
          const pt1 = p(id1);
          const pt2 = p(id2);
          if (!pt1 || !pt2) return null;

          const isLineActive =
            activePinId === id1 ||
            activePinId === id2 ||
            hoveredPinId === id1 ||
            hoveredPinId === id2;

          return (
            <line
              key={`line-${idx}`}
              x1={pt1.x}
              y1={pt1.y}
              x2={pt2.x}
              y2={pt2.y}
              className={lineClass}
              style={{
                strokeWidth: isLineActive ? 2.2 : 1.4,
                strokeOpacity: isLineActive ? 1 : 0.65,
                filter: isLineActive ? 'url(#meshGlow)' : undefined
              }}
            />
          );
        })}
      </g>

      {/* Mesh Intermediate Vertex Nodes */}
      <g className="mesh-nodes">
        {Object.entries(pinScreenPositions).map(([idStr, pt]) => {
          const id = parseInt(idStr);
          const isSelected = activePinId === id;
          return (
            <circle
              key={`node-${id}`}
              cx={pt.x}
              cy={pt.y}
              r={isSelected ? 3.5 : 2}
              fill={nodeColor}
              stroke="#ffffff"
              strokeWidth={0.8}
              opacity={0.85}
            />
          );
        })}
      </g>
    </svg>
  );
};
