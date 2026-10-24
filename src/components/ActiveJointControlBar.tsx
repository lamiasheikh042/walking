/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RigPositions, RIG_JOINTS } from '../types/rig';

interface ActiveJointControlBarProps {
  selectedJoint: number;
  positions: RigPositions;
  onChangePositions: (newPositions: RigPositions) => void;
  onSelectJoint: (jointId: number | null) => void;
  onSaveToActiveFrame?: () => void;
  activeFrameName?: string;
  onOpenStudio?: () => void;
  isCustomMode?: boolean;
}

export const ActiveJointControlBar: React.FC<ActiveJointControlBarProps> = ({
  selectedJoint,
  positions,
  onChangePositions,
  onSelectJoint,
  onSaveToActiveFrame,
  activeFrameName,
  onOpenStudio,
  isCustomMode = false
}) => {
  const jointInfo = RIG_JOINTS.find((j) => j.id === selectedJoint);
  if (!jointInfo) return null;

  const isElbow = selectedJoint === 5 || selectedJoint === 8;
  const isKnee = selectedJoint === 11 || selectedJoint === 14;

  const getTargetLayer = (): keyof RigPositions => {
    switch (selectedJoint) {
      case 1:
        return 'head';
      case 2:
      case 3:
        return 'torso';
      case 4:
      case 5:
      case 6:
        return 'armBack';
      case 7:
      case 8:
      case 9:
        return 'armFront';
      case 10:
      case 11:
      case 12:
        return 'legBack';
      case 13:
      case 14:
      case 15:
        return 'legFront';
      default:
        return 'head';
    }
  };

  const targetLayer = getTargetLayer();
  const currentTransform = positions[targetLayer];

  const getCurrentAngle = (): number => {
    if (isElbow) return currentTransform.elbowRot || 0;
    if (isKnee) return currentTransform.kneeRot || 0;
    return currentTransform.rot;
  };

  const currentAngle = getCurrentAngle();

  const handleAngleChange = (newVal: number) => {
    const updated = { ...positions };
    if (isElbow) {
      updated[targetLayer] = { ...currentTransform, elbowRot: newVal };
    } else if (isKnee) {
      updated[targetLayer] = { ...currentTransform, kneeRot: newVal };
    } else {
      updated[targetLayer] = { ...currentTransform, rot: newVal };
    }
    onChangePositions(updated);
  };

  const handleNudgeOffset = (axis: 'x' | 'y', delta: number) => {
    const updated = {
      ...positions,
      [targetLayer]: {
        ...currentTransform,
        [axis]: currentTransform[axis] + delta
      }
    };
    onChangePositions(updated);
  };

  const handleToggleFlip = () => {
    const updated = {
      ...positions,
      [targetLayer]: {
        ...currentTransform,
        scaleX: currentTransform.scaleX === 1 ? -1 : 1
      }
    };
    onChangePositions(updated);
  };

  const handleResetJoint = () => {
    const updated = { ...positions };
    if (isElbow) {
      updated[targetLayer] = { ...currentTransform, elbowRot: 0 };
    } else if (isKnee) {
      updated[targetLayer] = { ...currentTransform, kneeRot: 0 };
    } else {
      updated[targetLayer] = { ...currentTransform, rot: 0, x: 0, y: 0 };
    }
    onChangePositions(updated);
  };

  const minAngle = isElbow || isKnee ? 0 : -180;
  const maxAngle = isElbow || isKnee ? 140 : 180;

  const quickPresets =
    isElbow || isKnee
      ? [0, 30, 60, 90, 120]
      : [-90, -45, 0, 45, 90];

  return (
    <div className="fixed right-3 top-3 bottom-3 z-[115] w-[275px] bg-slate-900/95 backdrop-blur-xl border border-emerald-500/50 rounded-2xl shadow-2xl p-3.5 flex flex-col gap-2.5 text-white text-xs select-none overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-right-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 bg-slate-950/40 -mx-3.5 -mt-3.5 p-3 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-[0_0_8px_#22c55e]">
            {jointInfo.id}
          </span>
          <div>
            <div className="font-extrabold text-emerald-400 text-xs">
              {jointInfo.name}
            </div>
            <div className="text-[10px] text-slate-400">
              {jointInfo.part} ({isElbow ? 'Elbow' : isKnee ? 'Knee' : 'Pivot'})
            </div>
          </div>
        </div>

        <button
          onClick={() => onSelectJoint(null)}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-rose-900/60 hover:text-rose-200 text-slate-400 text-xs transition cursor-pointer"
          title="Close Joint Controller"
        >
          ✕
        </button>
      </div>

      {/* Orientation Indicator */}
      <div className="bg-emerald-950/70 border border-emerald-500/50 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-emerald-300 flex items-center justify-between shadow-sm">
        <span className="flex items-center gap-1">
          <span>👈</span>
          <span>সামনের দিক (Left/Front)</span>
        </span>
        <span className="flex items-center gap-1 text-slate-400">
          <span>পেছনের দিক (Right/Back)</span>
          <span>👉</span>
        </span>
      </div>

      {/* Prev / Next Steppers */}
      <div className="flex items-center justify-between bg-slate-950/60 px-2 py-1.5 rounded-xl border border-slate-800 text-[11px]">
        <button
          onClick={() =>
            onSelectJoint(selectedJoint === 1 ? 15 : selectedJoint - 1)
          }
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer flex items-center gap-1"
          title="Previous Joint"
        >
          <span>◀</span>
          <span>Joint {selectedJoint === 1 ? 15 : selectedJoint - 1}</span>
        </button>

        <span className="text-slate-500 font-bold">|</span>

        <button
          onClick={() =>
            onSelectJoint(selectedJoint === 15 ? 1 : selectedJoint + 1)
          }
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer flex items-center gap-1"
          title="Next Joint"
        >
          <span>Joint {selectedJoint === 15 ? 1 : selectedJoint + 1}</span>
          <span>▶</span>
        </button>
      </div>

      {/* Angle Control Card */}
      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            {isElbow || isKnee ? 'Bend Angle' : 'Rotation Angle'}
          </span>
          <span className="font-mono font-black text-emerald-400 text-sm bg-slate-900 px-2 py-0.5 rounded border border-emerald-500/40 shadow-sm">
            {currentAngle}°
          </span>
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min={minAngle}
          max={maxAngle}
          value={currentAngle}
          onChange={(e) => handleAngleChange(parseInt(e.target.value))}
          className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
        />

        {/* Stepper Buttons */}
        <div className="grid grid-cols-4 gap-1 pt-1">
          <button
            onClick={() => handleAngleChange(Math.max(minAngle, currentAngle - 5))}
            className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] font-bold cursor-pointer transition text-center"
            title="Tilt back towards right 5 degrees"
          >
            -5° (Back 👉)
          </button>
          <button
            onClick={() => handleAngleChange(Math.max(minAngle, currentAngle - 1))}
            className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] font-bold cursor-pointer transition text-center"
            title="Tilt back towards right 1 degree"
          >
            -1°
          </button>
          <button
            onClick={() => handleAngleChange(Math.min(maxAngle, currentAngle + 1))}
            className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] font-bold cursor-pointer transition text-center"
            title="Tilt forward towards left 1 degree"
          >
            +1°
          </button>
          <button
            onClick={() => handleAngleChange(Math.min(maxAngle, currentAngle + 5))}
            className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono text-[10px] font-bold cursor-pointer transition text-center"
            title="Tilt forward towards left 5 degrees"
          >
            +5° (👈 Front)
          </button>
        </div>

        {/* Quick Angle Preset Chips */}
        <div className="pt-1">
          <div className="text-[10px] text-slate-400 font-bold mb-1">Quick Presets:</div>
          <div className="grid grid-cols-5 gap-1">
            {quickPresets.map((deg) => (
              <button
                key={deg}
                onClick={() => handleAngleChange(deg)}
                className={`py-1 rounded text-[10px] font-mono font-bold cursor-pointer transition text-center border ${
                  currentAngle === deg
                    ? 'bg-emerald-500 text-slate-950 font-black border-emerald-300'
                    : 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
              >
                {deg > 0 ? `+${deg}°` : `${deg}°`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Position Nudge (X & Y) & Flip */}
      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
        <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
          Position Nudge
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => handleNudgeOffset('x', -2)}
            className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[11px] cursor-pointer font-bold flex items-center justify-center gap-1 border border-emerald-500/30"
            title="Nudge Left (Front Direction)"
          >
            <span>←</span>
            <span>Left / Front (-2px)</span>
          </button>
          <button
            onClick={() => handleNudgeOffset('x', 2)}
            className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer font-bold flex items-center justify-center gap-1 border border-slate-700"
            title="Nudge Right (Back Direction)"
          >
            <span>Right / Back (+2px)</span>
            <span>→</span>
          </button>
          <button
            onClick={() => handleNudgeOffset('y', -2)}
            className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer font-bold flex items-center justify-center gap-1"
            title="Nudge Up"
          >
            <span>↑</span>
            <span>Up (-2px)</span>
          </button>
          <button
            onClick={() => handleNudgeOffset('y', 2)}
            className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer font-bold flex items-center justify-center gap-1"
            title="Nudge Down"
          >
            <span>Down (+2px)</span>
            <span>↓</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button
            onClick={handleToggleFlip}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer border flex items-center justify-center gap-1 ${
              currentTransform.scaleX === 1
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle Horizontal Mirror (scaleX)"
          >
            <span>↔</span>
            <span>Flip Direction</span>
          </button>

          <button
            onClick={handleResetJoint}
            className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[11px] font-bold transition cursor-pointer border border-slate-700 flex items-center justify-center gap-1"
            title="Reset Joint to 0"
          >
            <span>↺</span>
            <span>Reset Joint</span>
          </button>
        </div>
      </div>

      {/* Save to Keyframe Button (if in Custom Mode) */}
      {onSaveToActiveFrame && (
        <button
          onClick={onSaveToActiveFrame}
          className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
          title="Save this pose into current keyframe"
        >
          <span>💾</span>
          <span>Save Pose to {activeFrameName || 'Frame'}</span>
        </button>
      )}

      {/* Switch to Timeline / Presets button if in Custom Mode */}
      {isCustomMode && onOpenStudio && (
        <button
          onClick={onOpenStudio}
          className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white rounded-xl text-[11px] font-semibold transition cursor-pointer border border-slate-700 flex items-center justify-center gap-1.5"
          title="Open Custom Animation Timeline & Presets"
        >
          <span>🎬</span>
          <span>Open Keyframe Timeline</span>
        </button>
      )}

      {/* Quick All Joints Selector Grid (1 to 15) */}
      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 space-y-1.5 mt-auto">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>All Rig Joints (1-15)</span>
          <span className="text-[9px] text-slate-500">click to jump</span>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {RIG_JOINTS.map((j) => (
            <button
              key={j.id}
              onClick={() => onSelectJoint(j.id)}
              className={`py-1 rounded text-[10px] font-bold transition cursor-pointer border flex items-center justify-center ${
                selectedJoint === j.id
                  ? 'bg-emerald-500 border-emerald-300 text-slate-950 font-black'
                  : 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title={`Joint ${j.id}: ${j.name}`}
            >
              {j.id}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
