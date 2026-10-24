/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CustomKeyframe,
  CustomAnimationPreset,
  formatAnimationDataForExport,
  RIG_JOINTS
} from '../types/rig';

interface CustomAnimStudioProps {
  presets: CustomAnimationPreset[];
  activePresetId: string;
  onSelectPreset: (presetId: string) => void;
  keyframes: CustomKeyframe[];
  activeFrameIndex: number;
  onSelectFrame: (index: number) => void;
  onUpdateActiveKeyframe: (updated: CustomKeyframe) => void;
  onAddKeyframe: () => void;
  onSaveCurrentPoseToActiveFrame: () => void;
  onDeleteKeyframe: (index: number) => void;
  duration: number;
  onChangeDuration: (dur: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
  onResetPreset: () => void;
  savedCustomList: CustomAnimationPreset[];
  onSaveCustomAnimation: (customName: string) => void;
  onDeleteCustomAnimation: (id: string) => void;
  onSelectJoint: (jointId: number) => void;
}

export const CustomAnimStudio: React.FC<CustomAnimStudioProps> = ({
  presets,
  activePresetId,
  onSelectPreset,
  keyframes,
  activeFrameIndex,
  onSelectFrame,
  onUpdateActiveKeyframe,
  onAddKeyframe,
  onSaveCurrentPoseToActiveFrame,
  onDeleteKeyframe,
  duration,
  onChangeDuration,
  isPlaying,
  onTogglePlay,
  onClose,
  onResetPreset,
  savedCustomList,
  onSaveCustomAnimation,
  onDeleteCustomAnimation,
  onSelectJoint
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [copiedData, setCopiedData] = useState<boolean>(false);
  const [customAnimName, setCustomAnimName] = useState<string>(
    `Custom Animation ${savedCustomList.length + 1}`
  );
  const [showSavedList, setShowSavedList] = useState<boolean>(true);

  const currentFrame = keyframes[activeFrameIndex] || keyframes[0];
  const activePreset =
    [...presets, ...savedCustomList].find((p) => p.id === activePresetId) ||
    presets[0];

  const handleCopyAllData = () => {
    const textData = formatAnimationDataForExport(
      activePreset?.name || 'Custom Animation',
      keyframes,
      duration
    );
    navigator.clipboard.writeText(textData).then(() => {
      setCopiedData(true);
      setTimeout(() => setCopiedData(false), 2500);
    });
  };

  const handleSaveAnimation = () => {
    const name = customAnimName.trim() || `Custom Animation ${savedCustomList.length + 1}`;
    onSaveCustomAnimation(name);
    setCustomAnimName(`Custom Animation ${savedCustomList.length + 2}`);
  };

  const updateProp = (
    layer: 'head' | 'torso' | 'armBack' | 'armFront' | 'legBack' | 'legFront',
    field: 'rot' | 'elbowRot' | 'kneeRot' | 'x' | 'y' | 'scaleX',
    value: number
  ) => {
    if (!currentFrame) return;
    const updatedPositions = {
      ...currentFrame.positions,
      [layer]: {
        ...currentFrame.positions[layer],
        [field]: value
      }
    };
    onUpdateActiveKeyframe({
      ...currentFrame,
      positions: updatedPositions
    });
  };

  const updateCharPos = (axis: 'x' | 'y', val: number) => {
    if (!currentFrame) return;
    onUpdateActiveKeyframe({
      ...currentFrame,
      charPos: {
        ...currentFrame.charPos,
        [axis]: val
      }
    });
  };

  return (
    <div className="fixed right-3 top-3 bottom-3 z-[100] w-[275px] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col text-slate-100 overflow-hidden font-sans select-none animate-in fade-in slide-in-from-right-3">
      {/* Studio Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/70">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎬</span>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Custom Animation Studio
            </h2>
            <p className="text-[10px] text-emerald-400 font-semibold">
              Frame Animator & Joint Rig Manager
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
            title={isMinimized ? 'Expand Studio' : 'Minimize Studio'}
          >
            {isMinimized ? '◻' : '─'}
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-950/50 hover:bg-rose-900/80 text-rose-300 text-xs transition cursor-pointer"
            title="Exit Custom Mode"
          >
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-3 text-xs">
          {/* Preset Selector */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Animation Presets</span>
              <button
                onClick={onResetPreset}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                title="Reset active preset to default"
              >
                Reset Preset
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset.id)}
                  className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                    activePresetId === preset.id
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                      : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                >
                  <span>{preset.icon}</span>
                  <span className="truncate">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* User's Saved Custom Animations List */}
          {savedCustomList.length > 0 && (
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-purple-500/30 space-y-1.5">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowSavedList(!showSavedList)}
              >
                <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                  <span>💾</span>
                  <span>My Saved Animations ({savedCustomList.length})</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {showSavedList ? '▲ Hide' : '▼ View'}
                </span>
              </div>

              {showSavedList && (
                <div className="space-y-1 pt-1 max-h-28 overflow-y-auto custom-scrollbar">
                  {savedCustomList.map((anim) => (
                    <div
                      key={anim.id}
                      className={`flex items-center justify-between px-2 py-1 rounded-lg border text-[11px] transition ${
                        activePresetId === anim.id
                          ? 'bg-purple-900/60 border-purple-500 text-white'
                          : 'bg-slate-850 hover:bg-slate-800 border-slate-800 text-slate-300'
                      }`}
                    >
                      <button
                        onClick={() => onSelectPreset(anim.id)}
                        className="flex-1 text-left font-semibold truncate cursor-pointer flex items-center gap-1.5"
                      >
                        <span>✨</span>
                        <span className="truncate">{anim.name}</span>
                        <span className="text-[9px] text-slate-400 font-normal">
                          ({anim.keyframes.length} frames)
                        </span>
                      </button>
                      <button
                        onClick={() => onDeleteCustomAnimation(anim.id)}
                        className="text-slate-500 hover:text-rose-400 px-1 text-xs transition cursor-pointer"
                        title="Delete saved animation"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Playback Controls & Speed */}
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={onTogglePlay}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm ${
                  isPlaying
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <span>{isPlaying ? '⏸️' : '▶️'}</span>
                <span>{isPlaying ? 'Pause Motion' : 'Play Live Motion'}</span>
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Cycle Duration:</span>
                <span className="font-mono font-bold text-indigo-400">
                  {duration.toFixed(1)}s / loop
                </span>
              </div>
              <input
                type="range"
                min="0.4"
                max="3.5"
                step="0.1"
                value={duration}
                onChange={(e) => onChangeDuration(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          </div>

          {/* ========================================================
              Frame-by-Frame Timeline & Capture
             ======================================================== */}
          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              <span>Timeline Keyframes</span>
              <span className="text-[10px] text-emerald-400 lowercase font-normal">
                frame {activeFrameIndex + 1} of {keyframes.length}
              </span>
            </div>

            {/* Frame Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {keyframes.map((kf, idx) => (
                <button
                  key={kf.id}
                  onClick={() => onSelectFrame(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition cursor-pointer border ${
                    activeFrameIndex === idx
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                  title={`Switch to Frame ${idx + 1}`}
                >
                  Frame {idx + 1}
                </button>
              ))}
            </div>

            {/* Frame Actions: Save Pose to Active Frame OR Add New Frame */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={onSaveCurrentPoseToActiveFrame}
                className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                title="Save currently adjusted joint points into this keyframe"
              >
                <span>💾</span>
                <span>Save to Frame {activeFrameIndex + 1}</span>
              </button>

              <button
                onClick={onAddKeyframe}
                className="py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                title="Create next frame using current pose"
              >
                <span>➕</span>
                <span>+ Save as Frame {keyframes.length + 1}</span>
              </button>
            </div>
          </div>

          {/* Quick Joint Selector Chips (1 to 15) */}
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Jump to Control Joint</span>
              <span className="text-[10px] text-slate-500">click joint to edit</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {RIG_JOINTS.map((j) => (
                <button
                  key={j.id}
                  onClick={() => onSelectJoint(j.id)}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 text-[10px] font-bold transition cursor-pointer border border-slate-700 flex items-center justify-center"
                  title={`Select Joint ${j.id}: ${j.name}`}
                >
                  {j.id}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Keyframe Sliders */}
          {currentFrame && (
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-[11px] font-bold text-emerald-400">
                  Editing Frame {activeFrameIndex + 1} Positions:
                </span>
                {keyframes.length > 2 && (
                  <button
                    onClick={() => onDeleteKeyframe(activeFrameIndex)}
                    className="text-[10px] text-rose-400 hover:text-rose-300 transition cursor-pointer"
                    title="Delete this keyframe"
                  >
                    🗑️ Remove Frame
                  </button>
                )}
              </div>

              {/* Joint 1: Head */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-300">
                    <span className="w-4 h-4 rounded-full bg-red-600 text-white font-mono font-bold text-[8px] flex items-center justify-center">
                      1
                    </span>
                    <span>Head Rotation:</span>
                  </span>
                  <span className="font-mono text-emerald-400">
                    {currentFrame.positions.head.rot}°
                  </span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  value={currentFrame.positions.head.rot}
                  onChange={(e) =>
                    updateProp('head', 'rot', parseInt(e.target.value))
                  }
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Joint 2 & 3: Torso */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-300">
                    <span className="w-4 h-4 rounded-full bg-red-600 text-white font-mono font-bold text-[8px] flex items-center justify-center">
                      2
                    </span>
                    <span className="w-4 h-4 rounded-full bg-red-600 text-white font-mono font-bold text-[8px] flex items-center justify-center">
                      3
                    </span>
                    <span>Torso Angle:</span>
                  </span>
                  <span className="font-mono text-emerald-400">
                    {currentFrame.positions.torso.rot}°
                  </span>
                </div>
                <input
                  type="range"
                  min="-35"
                  max="35"
                  value={currentFrame.positions.torso.rot}
                  onChange={(e) =>
                    updateProp('torso', 'rot', parseInt(e.target.value))
                  }
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Joint 7, 8: Front Arm & Elbow */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-300">
                    <span className="w-4 h-4 rounded-full bg-red-600 text-white font-mono font-bold text-[8px] flex items-center justify-center">
                      7
                    </span>
                    <span>Front Shoulder:</span>
                  </span>
                  <span className="font-mono text-emerald-400">
                    {currentFrame.positions.armFront.rot}°
                  </span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={currentFrame.positions.armFront.rot}
                  onChange={(e) =>
                    updateProp('armFront', 'rot', parseInt(e.target.value))
                  }
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-300">
                    <span className="w-4 h-4 rounded-full bg-red-600 text-white font-mono font-bold text-[8px] flex items-center justify-center">
                      8
                    </span>
                    <span>Front Elbow:</span>
                  </span>
                  <span className="font-mono text-emerald-400">
                    {currentFrame.positions.armFront.elbowRot || 0}°
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="135"
                  value={currentFrame.positions.armFront.elbowRot || 0}
                  onChange={(e) =>
                    updateProp('armFront', 'elbowRot', parseInt(e.target.value))
                  }
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Joint 4, 5: Back Arm & Elbow */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-300">
                    <span className="w-4 h-4 rounded-full bg-red-600 text-white font-mono font-bold text-[8px] flex items-center justify-center">
                      4
                    </span>
                    <span>Back Shoulder:</span>
                  </span>
                  <span className="font-mono text-emerald-400">
                    {currentFrame.positions.armBack.rot}°
                  </span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={currentFrame.positions.armBack.rot}
                  onChange={(e) =>
                    updateProp('armBack', 'rot', parseInt(e.target.value))
                  }
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-300">
                    <span className="w-4 h-4 rounded-full bg-red-600 text-white font-mono font-bold text-[8px] flex items-center justify-center">
                      5
                    </span>
                    <span>Back Elbow:</span>
                  </span>
                  <span className="font-mono text-emerald-400">
                    {currentFrame.positions.armBack.elbowRot || 0}°
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="135"
                  value={currentFrame.positions.armBack.elbowRot || 0}
                  onChange={(e) =>
                    updateProp('armBack', 'elbowRot', parseInt(e.target.value))
                  }
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Joint 13, 14: Front Leg & Knee */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-300">
                    <span className="w-4 h-4 rounded-full bg-red-600 text-white font-mono font-bold text-[8px] flex items-center justify-center">
                      13
                    </span>
                    <span>Front Leg Hip:</span>
                  </span>
                  <span className="font-mono text-emerald-400">
                    {currentFrame.positions.legFront.rot}°
                  </span>
                </div>
                <input
                  type="range"
                  min="-80"
                  max="95"
                  value={currentFrame.positions.legFront.rot}
                  onChange={(e) =>
                    updateProp('legFront', 'rot', parseInt(e.target.value))
                  }
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-300">
                    <span className="w-4 h-4 rounded-full bg-red-600 text-white font-mono font-bold text-[8px] flex items-center justify-center">
                      14
                    </span>
                    <span>Front Knee:</span>
                  </span>
                  <span className="font-mono text-emerald-400">
                    {currentFrame.positions.legFront.kneeRot || 0}°
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="110"
                  value={currentFrame.positions.legFront.kneeRot || 0}
                  onChange={(e) =>
                    updateProp('legFront', 'kneeRot', parseInt(e.target.value))
                  }
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Joint 10, 11: Back Leg & Knee */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-300">
                    <span className="w-4 h-4 rounded-full bg-red-600 text-white font-mono font-bold text-[8px] flex items-center justify-center">
                      10
                    </span>
                    <span>Back Leg Hip:</span>
                  </span>
                  <span className="font-mono text-emerald-400">
                    {currentFrame.positions.legBack.rot}°
                  </span>
                </div>
                <input
                  type="range"
                  min="-80"
                  max="95"
                  value={currentFrame.positions.legBack.rot}
                  onChange={(e) =>
                    updateProp('legBack', 'rot', parseInt(e.target.value))
                  }
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-300">
                    <span className="w-4 h-4 rounded-full bg-red-600 text-white font-mono font-bold text-[8px] flex items-center justify-center">
                      11
                    </span>
                    <span>Back Knee:</span>
                  </span>
                  <span className="font-mono text-emerald-400">
                    {currentFrame.positions.legBack.kneeRot || 0}°
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="110"
                  value={currentFrame.positions.legBack.kneeRot || 0}
                  onChange={(e) =>
                    updateProp('legBack', 'kneeRot', parseInt(e.target.value))
                  }
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Character Height (Y) */}
              <div className="space-y-1 pt-1 border-t border-slate-800">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300">Character Y (Height):</span>
                  <span className="font-mono text-emerald-400">
                    {currentFrame.charPos.y}px
                  </span>
                </div>
                <input
                  type="range"
                  min="-70"
                  max="40"
                  value={currentFrame.charPos.y}
                  onChange={(e) =>
                    updateCharPos('y', parseInt(e.target.value))
                  }
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* ========================================================
              Save Custom Animation & Copy Position Buttons
             ======================================================== */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-purple-500/40 space-y-2">
            <div className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
              Save Animation To Library
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={customAnimName}
                onChange={(e) => setCustomAnimName(e.target.value)}
                placeholder="e.g. Custom Animation 1"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
              />
              <button
                onClick={handleSaveAnimation}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-md shrink-0 flex items-center gap-1"
                title="Save current keyframes as a new custom animation"
              >
                <span>💾</span>
                <span>Save</span>
              </button>
            </div>

            {/* Prominent Copy Custom Character Positions Button */}
            <button
              onClick={handleCopyAllData}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg mt-1"
              title="Copy all character position numbers and keyframes to clipboard"
            >
              <span>{copiedData ? '✓' : '📋'}</span>
              <span>
                {copiedData
                  ? 'Copied Position Numbers to Clipboard!'
                  : 'Copy Custom Character Positions'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
