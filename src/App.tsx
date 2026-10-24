/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  RigPositions,
  CustomKeyframe,
  CustomAnimationPreset,
  DEFAULT_WALK_CHAR_POS,
  DEFAULT_WALK_POSITIONS,
  DEFAULT_TALK_CHAR_POS,
  DEFAULT_TALK_POSITIONS,
  DEFAULT_IDLE_CHAR_POS,
  DEFAULT_IDLE_POSITIONS,
  INITIAL_CUSTOM_PRESETS,
  RIG_JOINTS,
  interpolateRig
} from './types/rig';
import { CustomAnimStudio } from './components/CustomAnimStudio';
import { ActiveJointControlBar } from './components/ActiveJointControlBar';
import { PuppetWarpMesh } from './components/PuppetWarpMesh';
import {
  HeadMesh,
  TorsoMesh,
  UpperArmMesh,
  ForearmMesh,
  ThighMesh,
  CalfMesh,
  FootMesh
} from './components/PuppetWarpDenseMesh';
import {
  WoodenHead,
  WoodenTorso,
  WoodenUpperArm,
  WoodenLowerArm,
  WoodenThigh,
  WoodenCalf,
  WoodenFoot
} from './components/WoodenMannequin';

// Helper component to render circular joint indicator with internal number or Puppet Warp pushpin
const JointDot: React.FC<{
  number: number;
  top: string;
  left: string;
  title: string;
  isFlipped?: boolean;
  isSelected?: boolean;
  isPuppetMode?: boolean;
  isDragging?: boolean;
  puppetColor?: 'gold' | 'cyan' | 'purple';
  hasSelectedJoint?: boolean;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}> = ({
  number,
  top,
  left,
  title,
  isFlipped = false,
  isSelected = false,
  isPuppetMode = false,
  isDragging = false,
  puppetColor = 'gold',
  hasSelectedJoint = false,
  onClick,
  onPointerDown,
  onMouseEnter,
  onMouseLeave
}) => {
  if (isPuppetMode) {
    const colorClass =
      puppetColor === 'cyan'
        ? 'puppet-pin-cyan'
        : puppetColor === 'purple'
        ? 'puppet-pin-purple'
        : 'puppet-pin-gold';

    const isStopped = hasSelectedJoint && !isSelected;

    return (
      <div
        className={`puppet-pin ${colorClass} ${isDragging ? 'dragging' : ''} ${
          isSelected
            ? 'active-selected ring-4 ring-emerald-400 scale-125'
            : isStopped
            ? 'stopped-pin'
            : ''
        }`}
        style={{ top, left }}
        title={
          isSelected
            ? `Joint ${number}: ACTIVE (Moving this point only)`
            : isStopped
            ? `Joint ${number}: 🔒 STOPPED / ANCHORED (Click to select & move)`
            : `${title} (Click to select & move only this point)`
        }
        onPointerDown={(e) => {
          e.stopPropagation();
          if (onPointerDown) onPointerDown(e);
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (onClick) onClick();
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <span
          style={{
            display: 'inline-block',
            transform: isFlipped ? 'scaleX(-1)' : undefined,
            letterSpacing: number >= 10 ? '-0.5px' : 'normal'
          }}
        >
          {number}
        </span>
        {/* Tiny Stopped Padlock Icon if stopped */}
        {isStopped && (
          <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-slate-900/90 text-amber-300 rounded-full w-3.5 h-3.5 flex items-center justify-center border border-slate-600 shadow-sm pointer-events-none">
            🔒
          </span>
        )}
        {/* Green checkmark badge if selected */}
        {isSelected && (
          <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-emerald-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center shadow-md animate-pulse pointer-events-none">
            ✓
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`joint ${isSelected ? 'selected-green' : ''}`}
      style={{
        top,
        left,
        pointerEvents: 'auto',
        cursor: 'pointer'
      }}
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
    >
      <span
        style={{
          display: 'inline-block',
          transform: isFlipped ? 'scaleX(-1)' : undefined,
          letterSpacing: number >= 10 ? '-0.5px' : 'normal'
        }}
      >
        {number}
      </span>
    </div>
  );
};

export default function App() {
  const [mode, setMode] = useState<'walking' | 'talking' | 'custom'>('walking');
  const [isAnimationPaused, setIsAnimationPaused] = useState<boolean>(false);
  const [isMoveToolActive, setIsMoveToolActive] = useState<boolean>(false);
  const [showJoints, setShowJoints] = useState<boolean>(false);
  const [onlyJoints, setOnlyJoints] = useState<boolean>(false);
  const [showBones, setShowBones] = useState<boolean>(true);

  // Puppet Warp Mode States
  const [avatarSkin, setAvatarSkin] = useState<'mannequin' | 'cartoon'>('mannequin');
  const [isPuppetWarpActive, setIsPuppetWarpActive] = useState<boolean>(false);
  const [showPuppetMesh, setShowPuppetMesh] = useState<boolean>(true);
  const [puppetMeshColor, setPuppetMeshColor] = useState<'gold' | 'cyan' | 'purple'>('gold');
  const [puppetWarpIK, setPuppetWarpIK] = useState<boolean>(true);
  const [draggingPinId, setDraggingPinId] = useState<number | null>(null);
  const [hoveredPinId, setHoveredPinId] = useState<number | null>(null);
  const [dragFeedback, setDragFeedback] = useState<{
    pinId: number;
    name: string;
    info: string;
  } | null>(null);

  // Active selected joint (turns green on click)
  const [selectedJoint, setSelectedJoint] = useState<number | null>(null);

  // Character position & scale
  const [charPos, setCharPos] = useState<{ x: number; y: number }>(DEFAULT_WALK_CHAR_POS);
  const [charScale] = useState<number>(1);

  // Active rig positions state
  const [positions, setPositions] = useState<RigPositions>(DEFAULT_WALK_POSITIONS);

  // Custom Animation States (Starts in Idle Stance)
  const [customPresets, setCustomPresets] = useState<CustomAnimationPreset[]>(INITIAL_CUSTOM_PRESETS);
  const [activePresetId, setActivePresetId] = useState<string>('idle');
  const [customKeyframes, setCustomKeyframes] = useState<CustomKeyframe[]>(
    INITIAL_CUSTOM_PRESETS[0].keyframes
  );
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);
  const [customDuration, setCustomDuration] = useState<number>(
    INITIAL_CUSTOM_PRESETS[0].duration
  );
  const [isCustomPlaying, setIsCustomPlaying] = useState<boolean>(false);
  const [isCustomStudioOpen, setIsCustomStudioOpen] = useState<boolean>(true);

  // User-created Saved Custom Animations Library (persists to localStorage)
  const [savedCustomList, setSavedCustomList] = useState<CustomAnimationPreset[]>(() => {
    try {
      const local = localStorage.getItem('rig_saved_custom_animations');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });

  // Drag state for moving character container freely with Hand Move
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Drag state for Puppet Warp pin manipulation
  const pinDragRef = useRef<{
    pinId: number;
    startX: number;
    startY: number;
    startPositions: RigPositions;
  } | null>(null);

  useEffect(() => {
    document.body.className = `${mode} ${isAnimationPaused ? 'anim-paused' : ''} ${
      isPuppetWarpActive ? 'puppet-warp-active' : ''
    }`;
  }, [mode, isAnimationPaused, isPuppetWarpActive]);

  // Select Preset Handler (searches both built-in and user saved animations)
  const handleSelectPreset = (presetId: string) => {
    const allPresets = [...customPresets, ...savedCustomList];
    const found = allPresets.find((p) => p.id === presetId);
    if (!found) return;
    setActivePresetId(presetId);
    setCustomKeyframes(JSON.parse(JSON.stringify(found.keyframes)));
    setCustomDuration(found.duration);
    setActiveFrameIndex(0);
    setIsCustomPlaying(false);
    setPositions(found.keyframes[0].positions);
    setCharPos(found.keyframes[0].charPos);
  };

  // Reset Active Preset
  const handleResetPreset = () => {
    const original = INITIAL_CUSTOM_PRESETS.find((p) => p.id === activePresetId);
    if (!original) return;
    setCustomKeyframes(JSON.parse(JSON.stringify(original.keyframes)));
    setCustomDuration(original.duration);
    setActiveFrameIndex(0);
    setIsCustomPlaying(false);
    setPositions(original.keyframes[0].positions);
    setCharPos(original.keyframes[0].charPos);
  };

  // Reset Puppet Warp to default neutral pose
  const handleResetPuppetWarpPose = () => {
    if (mode === 'walking') {
      setPositions(DEFAULT_WALK_POSITIONS);
    } else if (mode === 'talking') {
      setPositions(DEFAULT_TALK_POSITIONS);
    } else {
      setPositions(DEFAULT_IDLE_POSITIONS);
    }
  };

  // Save new custom animation to library
  const handleSaveCustomAnimation = (customName: string) => {
    const newAnim: CustomAnimationPreset = {
      id: `custom_${Date.now()}`,
      name: customName,
      icon: '✨',
      duration: customDuration,
      keyframes: JSON.parse(JSON.stringify(customKeyframes))
    };
    const nextList = [...savedCustomList, newAnim];
    setSavedCustomList(nextList);
    try {
      localStorage.setItem('rig_saved_custom_animations', JSON.stringify(nextList));
    } catch {}
    setActivePresetId(newAnim.id);
  };

  // Delete custom animation from library
  const handleDeleteCustomAnimation = (id: string) => {
    const nextList = savedCustomList.filter((a) => a.id !== id);
    setSavedCustomList(nextList);
    try {
      localStorage.setItem('rig_saved_custom_animations', JSON.stringify(nextList));
    } catch {}
    if (activePresetId === id) {
      handleSelectPreset('idle');
    }
  };

  // Select keyframe in Custom Mode
  const handleSelectKeyframe = (index: number) => {
    setActiveFrameIndex(index);
    setIsCustomPlaying(false);
    const kf = customKeyframes[index];
    if (kf) {
      setCharPos(kf.charPos);
      setPositions(kf.positions);
    }
  };

  // Update active keyframe
  const handleUpdateActiveKeyframe = (updated: CustomKeyframe) => {
    const nextKeyframes = [...customKeyframes];
    nextKeyframes[activeFrameIndex] = updated;
    setCustomKeyframes(nextKeyframes);
    setCharPos(updated.charPos);
    setPositions(updated.positions);
  };

  // Save Current Pose to Active Frame (Frame 1, Frame 2, etc.)
  const handleSaveCurrentPoseToActiveFrame = () => {
    const nextKeyframes = [...customKeyframes];
    nextKeyframes[activeFrameIndex] = {
      ...nextKeyframes[activeFrameIndex],
      charPos: { ...charPos },
      positions: JSON.parse(JSON.stringify(positions))
    };
    setCustomKeyframes(nextKeyframes);
  };

  // Add Keyframe (captures current live pose into Frame N+1)
  const handleAddKeyframe = () => {
    const newKf: CustomKeyframe = {
      id: `frame_${Date.now()}`,
      name: `Frame ${customKeyframes.length + 1}`,
      charPos: { ...charPos },
      positions: JSON.parse(JSON.stringify(positions))
    };
    const nextKeyframes = [...customKeyframes, newKf];
    setCustomKeyframes(nextKeyframes);
    setActiveFrameIndex(nextKeyframes.length - 1);
    setIsCustomPlaying(false);
  };

  // When positions change from the active joint control bar
  const handleChangePositionsFromBar = (newPositions: RigPositions) => {
    setPositions(newPositions);
    if (mode === 'custom' && !isCustomPlaying && customKeyframes[activeFrameIndex]) {
      const nextKeyframes = [...customKeyframes];
      nextKeyframes[activeFrameIndex] = {
        ...nextKeyframes[activeFrameIndex],
        positions: JSON.parse(JSON.stringify(newPositions))
      };
      setCustomKeyframes(nextKeyframes);
    }
  };

  // Delete Keyframe
  const handleDeleteKeyframe = (index: number) => {
    if (customKeyframes.length <= 2) return;
    const nextKeyframes = customKeyframes.filter((_, idx) => idx !== index);
    setCustomKeyframes(nextKeyframes);
    const nextIndex = Math.max(0, index - 1);
    setActiveFrameIndex(nextIndex);
    const kf = nextKeyframes[nextIndex];
    if (kf) {
      setCharPos(kf.charPos);
      setPositions(kf.positions);
    }
  };

  // Live requestAnimationFrame loop for Custom Animation
  useEffect(() => {
    if (mode !== 'custom' || !isCustomPlaying || isAnimationPaused || isPuppetWarpActive) return;

    let animId: number;
    let startTime: number | null = null;

    const loop = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsedSeconds = (timestamp - startTime) / 1000;
      const cycleProgress = (elapsedSeconds % customDuration) / customDuration;

      const totalFrames = customKeyframes.length;
      if (totalFrames >= 2) {
        const totalSegments = totalFrames - 1;
        const segmentFloat = cycleProgress * totalSegments;
        const segmentIndex = Math.min(Math.floor(segmentFloat), totalSegments - 1);
        const segmentT = segmentFloat - segmentIndex;

        const kf1 = customKeyframes[segmentIndex];
        const kf2 = customKeyframes[segmentIndex + 1];

        if (kf1 && kf2) {
          const interpolated = interpolateRig(kf1, kf2, segmentT);
          setCharPos(interpolated.charPos);
          setPositions(interpolated.positions);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [mode, isCustomPlaying, isAnimationPaused, isPuppetWarpActive, customDuration, customKeyframes]);

  // Hand tool drag handlers
  const handleDragStart = (clientX: number, clientY: number) => {
    if (!isMoveToolActive) return;
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      startX: charPos.x,
      startY: charPos.y
    };
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const deltaX = clientX - dragStartRef.current.mouseX;
    const deltaY = clientY - dragStartRef.current.mouseY;
    const nextX = Math.round(dragStartRef.current.startX + deltaX);
    const nextY = Math.round(dragStartRef.current.startY + deltaY);

    setCharPos({ x: nextX, y: nextY });

    if (mode === 'custom' && !isCustomPlaying && customKeyframes[activeFrameIndex]) {
      const updated = {
        ...customKeyframes[activeFrameIndex],
        charPos: { x: nextX, y: nextY }
      };
      const nextKeyframes = [...customKeyframes];
      nextKeyframes[activeFrameIndex] = updated;
      setCustomKeyframes(nextKeyframes);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
    const onMouseUp = () => handleDragEnd();
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) {
        handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => handleDragEnd();

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, activeFrameIndex, mode, isCustomPlaying, customKeyframes]);

  // =========================================================================
  // PUPPET WARP: Precise 2D Kinematics & Direct Pin Dragging
  // =========================================================================
  const handlePinPointerDown = useCallback((jointId: number, e: React.PointerEvent) => {
    if (!isPuppetWarpActive) return;
    e.preventDefault();
    e.stopPropagation();

    // Freeze all looping animations immediately so all other joints remain stopped
    setIsAnimationPaused(true);

    // Set this clicked pin as the single active moving joint
    setSelectedJoint(jointId);

    pinDragRef.current = {
      pinId: jointId,
      startX: e.clientX,
      startY: e.clientY,
      startPositions: JSON.parse(JSON.stringify(positions))
    };
    setDraggingPinId(jointId);
  }, [isPuppetWarpActive, positions]);

  useEffect(() => {
    if (!draggingPinId || !pinDragRef.current) return;

    const onPointerMove = (e: PointerEvent) => {
      if (!pinDragRef.current) return;
      const { pinId, startX, startY, startPositions } = pinDragRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      // Start from exact pristine snapshot: ONLY the selected pin's joint will be modified!
      const updated = JSON.parse(JSON.stringify(startPositions)) as RigPositions;
      let infoText = '';

      switch (pinId) {
        // Joint 1: Head & Neck (Only Head moves, dragging left tilts to the left/front)
        case 1: {
          const deltaRot = -Math.round(dx * 0.85);
          updated.head.rot = Math.max(-60, Math.min(60, startPositions.head.rot + deltaRot));
          updated.head.x = Math.round(startPositions.head.x + dx * 0.25);
          updated.head.y = Math.round(startPositions.head.y + dy * 0.25);
          infoText = `Head: ${updated.head.rot}°`;
          break;
        }

        // Joint 2: Chest & Spine (Dragging left leans chest towards the left/front)
        case 2: {
          const deltaRot = -Math.round(dx * 0.6);
          updated.torso.rot = Math.max(-45, Math.min(45, startPositions.torso.rot + deltaRot));
          updated.torso.x = Math.round(startPositions.torso.x + dx * 0.35);
          updated.torso.y = Math.round(startPositions.torso.y + dy * 0.35);
          infoText = `Chest Spine: ${updated.torso.rot}°`;
          break;
        }

        // Joint 3: Waist & Pelvis (Dragging left tilts waist towards the left/front)
        case 3: {
          const deltaRot = Math.round(dx * 0.5);
          updated.torso.rot = Math.max(-45, Math.min(45, startPositions.torso.rot + deltaRot));
          updated.torso.y = Math.round(startPositions.torso.y + dy * 0.4);
          infoText = `Waist: ${updated.torso.rot}°`;
          break;
        }

        // Joint 4: Back Shoulder (Dragging left swings arm towards the left/front)
        case 4: {
          const deltaRot = -Math.round(dx * 0.85 + dy * 0.3);
          updated.armBack.rot = Math.max(-180, Math.min(180, startPositions.armBack.rot + deltaRot));
          updated.armBack.x = Math.round(startPositions.armBack.x + dx * 0.3);
          updated.armBack.y = Math.round(startPositions.armBack.y + dy * 0.3);
          updated.armBack.elbowRot = startPositions.armBack.elbowRot; // strictly stopped
          infoText = `Back Shoulder: ${updated.armBack.rot}°`;
          break;
        }

        // Joint 5: Back Elbow (Dragging left bends elbow towards the left/front)
        case 5: {
          const deltaElbow = -Math.round(dx * 0.9 - dy * 0.4);
          updated.armBack.elbowRot = Math.max(0, Math.min(145, (startPositions.armBack.elbowRot || 0) + deltaElbow));
          updated.armBack.rot = startPositions.armBack.rot; // Shoulder strictly stopped
          updated.armBack.x = startPositions.armBack.x;
          updated.armBack.y = startPositions.armBack.y;
          infoText = `Back Elbow: ${updated.armBack.elbowRot}° (Shoulder Stopped)`;
          break;
        }

        // Joint 6: Back Wrist / Hand (Dragging left bends wrist towards the left/front)
        case 6: {
          const deltaElbow = -Math.round(dx * 0.95 - dy * 0.4);
          updated.armBack.elbowRot = Math.max(0, Math.min(145, (startPositions.armBack.elbowRot || 0) + deltaElbow));
          updated.armBack.rot = startPositions.armBack.rot; // Shoulder strictly stopped
          updated.armBack.x = startPositions.armBack.x;
          updated.armBack.y = startPositions.armBack.y;
          infoText = `Back Wrist: ${updated.armBack.elbowRot}° (Shoulder Stopped)`;
          break;
        }

        // Joint 7: Front Shoulder (Dragging left swings arm towards the left/front)
        case 7: {
          const deltaRot = -Math.round(dx * 0.85 + dy * 0.3);
          updated.armFront.rot = Math.max(-180, Math.min(180, startPositions.armFront.rot + deltaRot));
          updated.armFront.x = Math.round(startPositions.armFront.x + dx * 0.3);
          updated.armFront.y = Math.round(startPositions.armFront.y + dy * 0.3);
          updated.armFront.elbowRot = startPositions.armFront.elbowRot; // strictly stopped
          infoText = `Front Shoulder: ${updated.armFront.rot}°`;
          break;
        }

        // Joint 8: Front Elbow (Dragging left bends elbow towards the left/front)
        case 8: {
          const deltaElbow = -Math.round(dx * 0.9 - dy * 0.4);
          updated.armFront.elbowRot = Math.max(0, Math.min(145, (startPositions.armFront.elbowRot || 0) + deltaElbow));
          updated.armFront.rot = startPositions.armFront.rot; // Shoulder strictly stopped
          updated.armFront.x = startPositions.armFront.x;
          updated.armFront.y = startPositions.armFront.y;
          infoText = `Front Elbow: ${updated.armFront.elbowRot}° (Shoulder Stopped)`;
          break;
        }

        // Joint 9: Front Wrist / Hand (Dragging left bends wrist towards the left/front)
        case 9: {
          const deltaElbow = -Math.round(dx * 0.95 - dy * 0.4);
          updated.armFront.elbowRot = Math.max(0, Math.min(145, (startPositions.armFront.elbowRot || 0) + deltaElbow));
          updated.armFront.rot = startPositions.armFront.rot; // Shoulder strictly stopped
          updated.armFront.x = startPositions.armFront.x;
          updated.armFront.y = startPositions.armFront.y;
          infoText = `Front Wrist: ${updated.armFront.elbowRot}° (Shoulder Stopped)`;
          break;
        }

        // Joint 10: Back Hip (Dragging left swings leg towards the left/front)
        case 10: {
          const deltaRot = -Math.round(dx * 0.85 + dy * 0.3);
          updated.legBack.rot = Math.max(-85, Math.min(95, startPositions.legBack.rot + deltaRot));
          updated.legBack.x = Math.round(startPositions.legBack.x + dx * 0.3);
          updated.legBack.y = Math.round(startPositions.legBack.y + dy * 0.3);
          updated.legBack.kneeRot = startPositions.legBack.kneeRot; // strictly stopped
          infoText = `Back Hip: ${updated.legBack.rot}°`;
          break;
        }

        // Joint 11: Back Knee (Dragging left bends knee towards the left/front)
        case 11: {
          const deltaKnee = -Math.round(dx * 0.85 - dy * 0.3);
          updated.legBack.kneeRot = Math.max(0, Math.min(130, (startPositions.legBack.kneeRot || 0) + deltaKnee));
          updated.legBack.rot = startPositions.legBack.rot; // Hip strictly stopped
          updated.legBack.x = startPositions.legBack.x;
          updated.legBack.y = startPositions.legBack.y;
          infoText = `Back Knee: ${updated.legBack.kneeRot}° (Hip Stopped)`;
          break;
        }

        // Joint 12: Back Ankle / Foot (Dragging left bends foot towards the left/front)
        case 12: {
          const deltaKnee = -Math.round(dx * 0.85 - dy * 0.3);
          updated.legBack.kneeRot = Math.max(0, Math.min(130, (startPositions.legBack.kneeRot || 0) + deltaKnee));
          updated.legBack.rot = startPositions.legBack.rot; // Hip strictly stopped
          updated.legBack.x = startPositions.legBack.x;
          updated.legBack.y = startPositions.legBack.y;
          infoText = `Back Foot: ${updated.legBack.kneeRot}° (Hip Stopped)`;
          break;
        }

        // Joint 13: Front Hip (Dragging left swings leg towards the left/front)
        case 13: {
          const deltaRot = -Math.round(dx * 0.85 + dy * 0.3);
          updated.legFront.rot = Math.max(-85, Math.min(95, startPositions.legFront.rot + deltaRot));
          updated.legFront.x = Math.round(startPositions.legFront.x + dx * 0.3);
          updated.legFront.y = Math.round(startPositions.legFront.y + dy * 0.3);
          updated.legFront.kneeRot = startPositions.legFront.kneeRot; // strictly stopped
          infoText = `Front Hip: ${updated.legFront.rot}°`;
          break;
        }

        // Joint 14: Front Knee (Dragging left bends knee towards the left/front)
        case 14: {
          const deltaKnee = -Math.round(dx * 0.85 - dy * 0.3);
          updated.legFront.kneeRot = Math.max(0, Math.min(130, (startPositions.legFront.kneeRot || 0) + deltaKnee));
          updated.legFront.rot = startPositions.legFront.rot; // Hip strictly stopped
          updated.legFront.x = startPositions.legFront.x;
          updated.legFront.y = startPositions.legFront.y;
          infoText = `Front Knee: ${updated.legFront.kneeRot}° (Hip Stopped)`;
          break;
        }

        // Joint 15: Front Ankle / Foot (Dragging left bends foot towards the left/front)
        case 15: {
          const deltaKnee = -Math.round(dx * 0.85 - dy * 0.3);
          updated.legFront.kneeRot = Math.max(0, Math.min(130, (startPositions.legFront.kneeRot || 0) + deltaKnee));
          updated.legFront.rot = startPositions.legFront.rot; // Hip strictly stopped
          updated.legFront.x = startPositions.legFront.x;
          updated.legFront.y = startPositions.legFront.y;
          infoText = `Front Foot: ${updated.legFront.kneeRot}° (Hip Stopped)`;
          break;
        }

        default:
          break;
      }

      setPositions(updated);
      const jointObj = RIG_JOINTS.find((j) => j.id === pinId);
      setDragFeedback({
        pinId,
        name: jointObj ? jointObj.name : `Joint ${pinId}`,
        info: infoText || `Δx: ${Math.round(dx)}px, Δy: ${Math.round(dy)}px`
      });

      // If in custom mode, sync to active keyframe
      if (mode === 'custom' && !isCustomPlaying && customKeyframes[activeFrameIndex]) {
        const nextKeyframes = [...customKeyframes];
        nextKeyframes[activeFrameIndex] = {
          ...nextKeyframes[activeFrameIndex],
          positions: JSON.parse(JSON.stringify(updated))
        };
        setCustomKeyframes(nextKeyframes);
      }
    };

    const onPointerUp = () => {
      setDraggingPinId(null);
      pinDragRef.current = null;
      setDragFeedback(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [draggingPinId, puppetWarpIK, mode, isCustomPlaying, customKeyframes, activeFrameIndex]);

  // Dynamically calculate screen/viewBox (120 x 300) coordinates for all 15 pins for the mesh
  const pinScreenPositions = useMemo(() => {
    const pts: { [id: number]: { x: number; y: number } } = {};

    // 1. Head
    const headRotRad = (positions.head.rot * Math.PI) / 180;
    pts[1] = {
      x: 62 + positions.head.x + Math.sin(headRotRad) * 4,
      y: 12 + positions.head.y - Math.cos(headRotRad) * 2
    };

    // 2. Chest & Spine
    const torsoRotRad = (positions.torso.rot * Math.PI) / 180;
    pts[2] = {
      x: 62 + positions.torso.x,
      y: 36 + positions.torso.y
    };

    // 3. Waist & Pelvis
    pts[3] = {
      x: 62 + positions.torso.x + Math.sin(torsoRotRad) * 60,
      y: 97 + positions.torso.y + (Math.cos(torsoRotRad) - 1) * 60
    };

    // Front Arm (7, 8, 9)
    const faRad = ((positions.armFront.rot + 90) * Math.PI) / 180;
    pts[7] = {
      x: 66 + positions.armFront.x,
      y: 26 + positions.armFront.y
    };
    pts[8] = {
      x: pts[7].x + Math.cos(faRad) * 56,
      y: pts[7].y + Math.sin(faRad) * 56
    };
    const feRad = ((positions.armFront.rot + 90 + (positions.armFront.elbowRot || 0)) * Math.PI) / 180;
    pts[9] = {
      x: pts[8].x + Math.cos(feRad) * 44,
      y: pts[8].y + Math.sin(feRad) * 44
    };

    // Back Arm (4, 5, 6)
    const baRad = ((positions.armBack.rot + 90) * Math.PI) / 180;
    pts[4] = {
      x: 40 + positions.armBack.x,
      y: 22 + positions.armBack.y
    };
    pts[5] = {
      x: pts[4].x + Math.cos(baRad) * 56,
      y: pts[4].y + Math.sin(baRad) * 56
    };
    const beRad = ((positions.armBack.rot + 90 + (positions.armBack.elbowRot || 0)) * Math.PI) / 180;
    pts[6] = {
      x: pts[5].x + Math.cos(beRad) * 44,
      y: pts[5].y + Math.sin(beRad) * 44
    };

    // Front Leg (13, 14, 15)
    const flRad = ((positions.legFront.rot + 90) * Math.PI) / 180;
    pts[13] = {
      x: 59 + positions.legFront.x,
      y: 102 + positions.legFront.y
    };
    pts[14] = {
      x: pts[13].x + Math.cos(flRad) * 64,
      y: pts[13].y + Math.sin(flRad) * 64
    };
    const fkRad = ((positions.legFront.rot + 90 + (positions.legFront.kneeRot || 0)) * Math.PI) / 180;
    pts[15] = {
      x: pts[14].x + Math.cos(fkRad) * 68,
      y: pts[14].y + Math.sin(fkRad) * 68
    };

    // Back Leg (10, 11, 12)
    const blRad = ((positions.legBack.rot + 90) * Math.PI) / 180;
    pts[10] = {
      x: 49 + positions.legBack.x,
      y: 100 + positions.legBack.y
    };
    pts[11] = {
      x: pts[10].x + Math.cos(blRad) * 64,
      y: pts[10].y + Math.sin(blRad) * 64
    };
    const bkRad = ((positions.legBack.rot + 90 + (positions.legBack.kneeRot || 0)) * Math.PI) / 180;
    pts[12] = {
      x: pts[11].x + Math.cos(bkRad) * 68,
      y: pts[11].y + Math.sin(bkRad) * 68
    };

    return pts;
  }, [positions]);

  const getLayerStyle = (layerKey: keyof RigPositions) => {
    const p = positions[layerKey];
    return {
      transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg) scaleX(${p.scaleX})`,
      zIndex:
        layerKey === 'armFront'
          ? 32
          : layerKey === 'head'
          ? 28
          : layerKey === 'torso'
          ? 20
          : layerKey === 'legFront'
          ? 16
          : layerKey === 'legBack'
          ? 12
          : 10
    };
  };

  return (
    <div className={`scene ${mode} ${isAnimationPaused ? 'anim-paused' : ''}`}>
      {/* ========================================================
          Top Puppet Warp HUD Toolbar (When Puppet Warp is Active)
         ======================================================== */}
      {isPuppetWarpActive ? (
        <div className="fixed top-3.5 left-1/2 -translate-x-1/2 z-[120] bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-2xl border-2 border-amber-500/80 flex items-center gap-3 select-none max-w-[95vw] overflow-x-auto custom-scrollbar animate-in fade-in slide-in-from-top-3">
          {/* Status Badge */}
          <div className="flex items-center gap-2 pr-2 border-r border-slate-700 shrink-0">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-[0_0_12px_#f59e0b]">
              📌
            </span>
            <div>
              <div className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>Puppet Warp Mode</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <div className="text-[10px] text-slate-300 font-semibold">
                Select a point to move it (all other points stay stopped)
              </div>
            </div>
          </div>

          {/* Active Point Selector & Anchoring Status */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-1.5 rounded-xl border border-slate-800 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 pr-0.5">Points:</span>
            <div className="flex items-center gap-1">
              {RIG_JOINTS.map((joint) => {
                const isActive = selectedJoint === joint.id;
                return (
                  <button
                    key={joint.id}
                    onClick={() => {
                      setSelectedJoint(isActive ? null : joint.id);
                      setIsAnimationPaused(true);
                    }}
                    className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center transition cursor-pointer border ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 border-emerald-300 font-black shadow-[0_0_10px_#22c55e] scale-110'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
                    }`}
                    title={`Point #${joint.id}: ${joint.name} - Click to select & move ONLY this point`}
                  >
                    {joint.id}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Status Badge */}
          {selectedJoint !== null ? (
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-950/80 border border-emerald-500/70 rounded-xl shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-300">
                #{selectedJoint} {RIG_JOINTS.find((j) => j.id === selectedJoint)?.name}: Moving
              </span>
              <span className="text-[10px] font-semibold text-emerald-200 bg-emerald-900/90 px-1.5 py-0.5 rounded border border-emerald-700/50">
                🔒 Other 14 Points Stopped
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-950/60 border border-amber-600/50 rounded-xl shrink-0 text-amber-300 text-xs font-bold">
              <span>👆 Select a point to move it</span>
            </div>
          )}

          {/* Avatar Model Toggle (Wooden Mannequin vs Cartoon) */}
          <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setAvatarSkin('mannequin')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                avatarSkin === 'mannequin'
                  ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Wooden Artist Mannequin (From reference image)"
            >
              <span>🪵</span>
              <span>Wooden</span>
            </button>
            <button
              onClick={() => setAvatarSkin('cartoon')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                avatarSkin === 'cartoon'
                  ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="2D Cartoon Rig Character"
            >
              <span>🎨</span>
              <span>Cartoon</span>
            </button>
          </div>

          {/* Wireframe Mesh Toggle */}
          <button
            onClick={() => setShowPuppetMesh(!showPuppetMesh)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border shrink-0 ${
              showPuppetMesh
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle Triangular Warp Mesh wireframe"
          >
            <span>🕸️</span>
            <span>Mesh: {showPuppetMesh ? 'ON' : 'OFF'}</span>
          </button>

          {/* Mesh Color Theme Selector */}
          <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setPuppetMeshColor('gold')}
              className={`w-6 h-6 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center justify-center ${
                puppetMeshColor === 'gold'
                  ? 'bg-amber-500 text-slate-950 shadow-sm ring-1 ring-white'
                  : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
              }`}
              title="Gold Mesh"
            >
              🟡
            </button>
            <button
              onClick={() => setPuppetMeshColor('cyan')}
              className={`w-6 h-6 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center justify-center ${
                puppetMeshColor === 'cyan'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm ring-1 ring-white'
                  : 'bg-slate-800 text-cyan-300 hover:bg-slate-700'
              }`}
              title="Cyan Mesh"
            >
              🔵
            </button>
            <button
              onClick={() => setPuppetMeshColor('purple')}
              className={`w-6 h-6 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center justify-center ${
                puppetMeshColor === 'purple'
                  ? 'bg-purple-500 text-white shadow-sm ring-1 ring-white'
                  : 'bg-slate-800 text-purple-300 hover:bg-slate-700'
              }`}
              title="Purple Mesh"
            >
              🟣
            </button>
          </div>

          {/* Reset Pose Button */}
          <button
            onClick={handleResetPuppetWarpPose}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer border border-slate-700 flex items-center gap-1 shrink-0"
            title="Reset character pose to default"
          >
            <span>↺</span>
            <span>Reset Pose</span>
          </button>

          {/* Save Pose to Custom Keyframe (if custom mode active) */}
          {mode === 'custom' && (
            <button
              onClick={handleSaveCurrentPoseToActiveFrame}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1 shrink-0"
              title="Save this warped pose to active frame"
            >
              <span>💾</span>
              <span>Save Pose (Frame {activeFrameIndex + 1})</span>
            </button>
          )}

          {/* Done / Exit Puppet Warp Button */}
          <button
            onClick={() => setIsPuppetWarpActive(false)}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1 shrink-0 ml-auto"
            title="Exit Puppet Warp Mode"
          >
            <span>✓</span>
            <span>Done / Exit</span>
          </button>
        </div>
      ) : (
        /* ========================================================
            Standard Numbered Joint Button Ribbon (1 to 15 in one row)
           ======================================================== */
        <div className="fixed top-3.5 left-1/2 -translate-x-1/2 z-[110] bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-2 select-none max-w-[95vw] overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 pr-1 shrink-0">
            <span className="text-emerald-400 text-sm">🎯</span>
            <span>Joints:</span>
          </div>

          {/* Side-by-side buttons 1 to 15 in a single row */}
          <div className="flex items-center gap-1 shrink-0">
            {RIG_JOINTS.map((joint) => {
              const isActive = selectedJoint === joint.id;
              return (
                <button
                  key={joint.id}
                  onClick={() => {
                    const next = isActive ? null : joint.id;
                    setSelectedJoint(next);
                    if (next !== null && !showJoints && !onlyJoints) {
                      setShowJoints(true);
                    }
                  }}
                  className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.9)] scale-110 font-black'
                      : 'bg-slate-800/90 hover:bg-slate-700 hover:text-white border-slate-700 text-slate-300'
                  }`}
                  title={`Joint ${joint.id}: ${joint.name} (${joint.part}) - Click to Highlight Green`}
                >
                  {joint.id}
                </button>
              );
            })}
          </div>

          {/* Selected Joint Name Tag & Clear Button */}
          {selectedJoint !== null && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700 shrink-0">
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#22c55e] animate-ping"></span>
                <span>
                  #{selectedJoint}: {RIG_JOINTS.find((j) => j.id === selectedJoint)?.name}
                </span>
              </span>
              <button
                onClick={() => setSelectedJoint(null)}
                className="w-5 h-5 rounded-full bg-slate-800 hover:bg-rose-900/70 hover:text-rose-200 text-slate-400 text-[10px] flex items-center justify-center transition cursor-pointer"
                title="Deselect Joint"
              >
                ✕
              </button>
            </div>
          )}

          {/* Skeleton Mode Toggle if Only Joints is Active */}
          {onlyJoints && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700 shrink-0">
              <button
                onClick={() => setShowBones(!showBones)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  showBones
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Toggle skeleton connector lines between joints"
              >
                {showBones ? '🦴 Bones: ON' : '🔴 Pure Dots'}
              </button>
              <button
                onClick={() => setOnlyJoints(false)}
                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                title="Exit Only Joints Mode"
              >
                Exit Joint Mode ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Joint Controller Widget (slim vertical bar docked on the right side) */}
      {selectedJoint !== null && (
        <ActiveJointControlBar
          selectedJoint={selectedJoint}
          positions={positions}
          onChangePositions={handleChangePositionsFromBar}
          onSelectJoint={setSelectedJoint}
          onSaveToActiveFrame={mode === 'custom' ? handleSaveCurrentPoseToActiveFrame : undefined}
          activeFrameName={`Frame ${activeFrameIndex + 1}`}
          onOpenStudio={() => setSelectedJoint(null)}
          isCustomMode={mode === 'custom'}
        />
      )}

      {/* ========================================================
          Left-Side Vertical Controls Toolbar
         ======================================================== */}
      <div className="controls">
        <div className="controls-title">Controls</div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-bold text-emerald-800 shadow-sm"
          title="The green dot on the torso shows the front side of the character"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)] shrink-0"></span>
          <span>Green Dot = Front</span>
        </div>

        {/* 1. Puppet Warp Button (New Prominent Feature) */}
        <button
          className={`btn btn-puppet-warp ${isPuppetWarpActive ? 'active' : ''}`}
          id="btn-puppet-warp"
          onClick={() => {
            const next = !isPuppetWarpActive;
            setIsPuppetWarpActive(next);
            if (next) {
              setIsAnimationPaused(true);
              setShowJoints(true);
            }
          }}
          title="Puppet Warp Mode - Click & drag any pin directly on the character to pose freely"
        >
          <span className="text-base">📌</span>
          <span>{isPuppetWarpActive ? 'Warp: Active' : 'Puppet Warp'}</span>
        </button>

        {/* Model Skin Switcher: Mannequin vs Cartoon */}
        <button
          className="btn-toggle flex items-center justify-between"
          onClick={() => setAvatarSkin(avatarSkin === 'mannequin' ? 'cartoon' : 'mannequin')}
          title="Switch between Wooden Mannequin (from image) and 2D Cartoon"
        >
          <span className="flex items-center gap-1.5 font-bold">
            <span>{avatarSkin === 'mannequin' ? '🪵' : '🎨'}</span>
            <span>{avatarSkin === 'mannequin' ? 'Mannequin' : 'Cartoon'}</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">⇄</span>
        </button>

        {/* 2. Walk Button */}
        <button
          className={`btn ${mode === 'walking' && !isPuppetWarpActive ? 'active' : ''}`}
          id="btn-walk"
          onClick={() => {
            setIsPuppetWarpActive(false);
            setMode('walking');
            setPositions(DEFAULT_WALK_POSITIONS);
            setCharPos(DEFAULT_WALK_CHAR_POS);
          }}
          title="Switch to Walking Mode"
        >
          <span>🚶‍♂️</span>
          <span>Walk Mode</span>
        </button>

        {/* 3. Talking Button */}
        <button
          className={`btn ${mode === 'talking' && !isPuppetWarpActive ? 'active' : ''}`}
          id="btn-talking"
          onClick={() => {
            setIsPuppetWarpActive(false);
            setMode('talking');
            setPositions(DEFAULT_TALK_POSITIONS);
            setCharPos(DEFAULT_TALK_CHAR_POS);
          }}
          title="Switch to Talking Mode"
        >
          <span>🗣️</span>
          <span>Talking Mode</span>
        </button>

        {/* 4. Custom Animation Mode Button */}
        <button
          className={`btn ${
            mode === 'custom' && !isPuppetWarpActive
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_4px_14px_rgba(147,51,234,0.45)]'
              : ''
          }`}
          onClick={() => {
            setMode('custom');
            setIsCustomStudioOpen(true);
            setActivePresetId('idle');
            const idlePreset = customPresets.find((p) => p.id === 'idle') || customPresets[0];
            setCustomKeyframes(JSON.parse(JSON.stringify(idlePreset.keyframes)));
            setCustomDuration(idlePreset.duration);
            setActiveFrameIndex(0);
            setIsCustomPlaying(false);
            setPositions(DEFAULT_IDLE_POSITIONS);
            setCharPos(DEFAULT_IDLE_CHAR_POS);
          }}
          title="Switch to Custom Animation Mode (Character starts in Idle Stance)"
        >
          <span>✨</span>
          <span>Custom Anim</span>
        </button>

        {/* 5. Pause / Play Toggle */}
        <button
          className={`btn ${isAnimationPaused ? 'bg-amber-600 text-white' : ''}`}
          onClick={() => setIsAnimationPaused(!isAnimationPaused)}
          title="Play or Pause Animation"
        >
          <span>{isAnimationPaused ? '▶️' : '⏸️'}</span>
          <span>{isAnimationPaused ? 'Play Anim' : 'Pause Anim'}</span>
        </button>

        {/* 6. Hand Move Tool */}
        <button
          className={`btn ${
            isMoveToolActive
              ? 'bg-amber-500 text-white shadow-[0_4px_14px_rgba(245,158,11,0.5)]'
              : ''
          }`}
          onClick={() => setIsMoveToolActive(!isMoveToolActive)}
          title="Move character freely anywhere on screen (Drag & Drop)"
        >
          <span>✋</span>
          <span>{isMoveToolActive ? 'Hand: Active' : 'Hand Move'}</span>
        </button>

        {/* 7. Joint Marker Toggle */}
        <button
          className={`btn-toggle ${showJoints && !onlyJoints ? 'active' : ''}`}
          onClick={() => {
            if (onlyJoints) {
              setOnlyJoints(false);
            }
            setShowJoints(!showJoints);
          }}
          title="Toggle Numbered Joint Marker Badges (Joints 1 to 15)"
        >
          <span>{showJoints ? '🔴' : '⚪'}</span>
          <span>{showJoints ? 'Joints: ON' : 'Joints: OFF'}</span>
        </button>

        {/* 8. Only Joints Mode Button */}
        <button
          className={`btn-toggle ${
            onlyJoints
              ? 'active bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400/50'
              : 'hover:bg-slate-100'
          }`}
          onClick={() => {
            const next = !onlyJoints;
            setOnlyJoints(next);
            if (next) {
              setShowJoints(true);
            }
          }}
          title="Show Only Joints (Hides character body artwork and displays numbered skeleton joints)"
        >
          <span>🦴</span>
          <span>{onlyJoints ? 'Only Joints: ON' : 'Only Joints'}</span>
        </button>
      </div>

      {/* Custom Animation Studio Panel */}
      {mode === 'custom' && isCustomStudioOpen && !isPuppetWarpActive && (
        <CustomAnimStudio
          presets={customPresets}
          activePresetId={activePresetId}
          onSelectPreset={handleSelectPreset}
          keyframes={customKeyframes}
          activeFrameIndex={activeFrameIndex}
          onSelectFrame={handleSelectKeyframe}
          onUpdateActiveKeyframe={handleUpdateActiveKeyframe}
          onAddKeyframe={handleAddKeyframe}
          onSaveCurrentPoseToActiveFrame={handleSaveCurrentPoseToActiveFrame}
          onDeleteKeyframe={handleDeleteKeyframe}
          duration={customDuration}
          onChangeDuration={(dur) => setCustomDuration(dur)}
          isPlaying={isCustomPlaying}
          onTogglePlay={() => setIsCustomPlaying(!isCustomPlaying)}
          onClose={() => {
            setMode('walking');
            setPositions(DEFAULT_WALK_POSITIONS);
            setCharPos(DEFAULT_WALK_CHAR_POS);
          }}
          onResetPreset={handleResetPreset}
          savedCustomList={savedCustomList}
          onSaveCustomAnimation={handleSaveCustomAnimation}
          onDeleteCustomAnimation={handleDeleteCustomAnimation}
          onSelectJoint={(id) => {
            setSelectedJoint(id);
            if (!showJoints && !onlyJoints) setShowJoints(true);
          }}
        />
      )}

      {/* Character Container - Draggable with Hand Tool */}
      <div
        className={`character-container transition-shadow ${
          onlyJoints ? 'only-joints-mode' : ''
        } ${
          isMoveToolActive
            ? isDragging
              ? 'cursor-grabbing ring-4 ring-amber-400/80 rounded-3xl shadow-2xl'
              : 'cursor-grab hover:ring-2 hover:ring-amber-400/60 rounded-3xl'
            : ''
        }`}
        id="character"
        style={{
          transform: `translate(${charPos.x}px, ${charPos.y}px) scale(${charScale})`
        }}
        onMouseDown={(e) => {
          if (isMoveToolActive) {
            handleDragStart(e.clientX, e.clientY);
          }
        }}
        onTouchStart={(e) => {
          if (isMoveToolActive && e.touches[0]) {
            handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
      >
        {/* Floating Hand Move Indicator */}
        {isMoveToolActive && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse select-none z-50">
            <span>✋</span>
            <span>{isDragging ? 'Dragging...' : 'Drag to Move Here'}</span>
          </div>
        )}

        {/* Live Drag Feedback HUD for Puppet Warp */}
        {isPuppetWarpActive && dragFeedback && (
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/95 text-amber-300 border border-amber-400/80 text-[11px] font-mono font-bold px-3 py-1 rounded-full shadow-2xl flex items-center gap-1.5 z-[130] pointer-events-none animate-in fade-in">
            <span>📌</span>
            <span>{dragFeedback.name}:</span>
            <span className="text-white">{dragFeedback.info}</span>
          </div>
        )}

        {/* Dynamic Contact Shadow */}
        <div className="char-shadow"></div>

        {/* Puppet Warp Triangular Wireframe Mesh Overlay */}
        {isPuppetWarpActive && showPuppetMesh && (
          <PuppetWarpMesh
            positions={positions}
            meshColor={puppetMeshColor}
            activePinId={draggingPinId || selectedJoint}
            hoveredPinId={hoveredPinId}
            pinScreenPositions={pinScreenPositions}
          />
        )}

        {/* Vertical Walking Bobbing Container */}
        <div className="character-bob w-full h-full relative">
          {/* ==========================================================
              1. HEAD LAYER (Joint 1: Head & Neck)
              ========================================================== */}
          <div
            className="layer-wrapper"
            id="wrap-head"
            style={getLayerStyle('head')}
          >
            <div className="head w-full h-full relative" style={{ background: 'transparent' }}>
              {avatarSkin === 'mannequin' ? (
                <WoodenHead />
              ) : (
                <svg viewBox="0 0 62 62" className="w-full h-full drop-shadow-md overflow-visible">
                  <defs>
                    <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffedd5" />
                      <stop offset="70%" stopColor="#fed7aa" />
                      <stop offset="100%" stopColor="#fba76b" />
                    </linearGradient>
                    <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3f3f46" />
                      <stop offset="50%" stopColor="#27272a" />
                      <stop offset="100%" stopColor="#18181b" />
                    </linearGradient>
                    <linearGradient id="neckGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#fed7aa" />
                      <stop offset="100%" stopColor="#fba76b" />
                    </linearGradient>
                  </defs>

                  {/* Neck */}
                  <path d="M 25 38 L 25 58 L 39 58 L 38 38 Z" fill="url(#neckGrad)" />
                  <path d="M 25 40 Q 32 46 39 40" stroke="#ea580c" strokeWidth="0.8" opacity="0.3" fill="none" />

                  {/* Face contour */}
                  <path
                    d="M 18 16 Q 16 28 20 38 Q 24 45 32 45 Q 40 44 43 36 Q 47 25 43 16 Q 39 8 28 9 Q 20 10 18 16 Z"
                    fill="url(#skinGrad)"
                    stroke="#ea580c"
                    strokeWidth="0.5"
                  />

                  {/* Ear */}
                  <path d="M 20 26 C 17 26 16 32 19 35 C 21 37 23 35 23 31 Z" fill="#fed7aa" stroke="#ea580c" strokeWidth="0.6" />
                  <path d="M 20 28 Q 18 31 20 33" stroke="#c2410c" strokeWidth="0.8" fill="none" />

                  {/* Eye */}
                  <g id="char-eye">
                    <path d="M 30 21 Q 36 19 40 22" stroke="#18181b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                    <ellipse cx="35" cy="26" rx="4" ry="3" fill="#ffffff" stroke="#71717a" strokeWidth="0.4" />
                    <circle cx="36" cy="26" r="2.2" fill="#0284c7" />
                    <circle cx="36.5" cy="25.8" r="1.1" fill="#0f172a" />
                    <circle cx="37" cy="25.2" r="0.6" fill="#ffffff" />
                    <path d="M 31 24 Q 36 22 39 25" stroke="#27272a" strokeWidth="0.8" fill="none" />
                  </g>

                  {/* Nose */}
                  <path d="M 41 24 L 45 30 L 41 32" stroke="#ea580c" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

                  {/* Mouth */}
                  <path
                    className="mouth-shape"
                    d="M 36 37 Q 40 39 42 36"
                    stroke="#be185d"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* Hair */}
                  <path
                    d="M 15 16 C 14 4 28 1 39 4 C 47 6 49 14 48 21 C 47 24 45 25 44 21 C 43 16 39 12 30 12 C 24 12 20 16 18 24 C 16 24 15 20 15 16 Z"
                    fill="url(#hairGrad)"
                  />
                  <path d="M 25 7 Q 31 14 30 21" stroke="#27272a" strokeWidth="3" strokeLinecap="round" fill="none" />
                  <path d="M 31 7 Q 38 15 40 20" stroke="#3f3f46" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                  <path d="M 17 19 Q 16 27 19 29" stroke="#27272a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </svg>
              )}

              {/* Exact Photoshop Puppet Warp Dense Mesh for Head */}
              {isPuppetWarpActive && showPuppetMesh && <HeadMesh />}

              {/* Joint 1: Head & Neck Pin */}
              {(showJoints || onlyJoints || isPuppetWarpActive || selectedJoint === 1) && (
                <>
                  {onlyJoints && showBones && (
                    <svg className="skeleton-bones overflow-visible" viewBox="0 0 62 62">
                      <line x1="32" y1="50" x2="32" y2="24" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="3 2" />
                      <circle cx="32" cy="24" r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                    </svg>
                  )}
                  <JointDot
                    number={1}
                    top="50px"
                    left="32px"
                    title="Joint 1: Head & Neck Pivot"
                    isFlipped={positions.head.scaleX === -1}
                    isSelected={selectedJoint === 1}
                    isPuppetMode={isPuppetWarpActive}
                    isDragging={draggingPinId === 1}
                    puppetColor={puppetMeshColor}
                      hasSelectedJoint={selectedJoint !== null}
                    onPointerDown={(e) => handlePinPointerDown(1, e)}
                    onClick={() => setSelectedJoint(selectedJoint === 1 ? null : 1)}
                    onMouseEnter={() => setHoveredPinId(1)}
                    onMouseLeave={() => setHoveredPinId(null)}
                  />
                </>
              )}
            </div>
          </div>

          {/* ==========================================================
              2. BACK ARM LAYER (Joints 4, 5, 6)
              ========================================================== */}
          <div
            className="layer-wrapper"
            id="wrap-arm-back"
            style={getLayerStyle('armBack')}
          >
            <div className="arm arm-back w-full h-full relative" style={{ background: 'transparent' }}>
              <div className="upper-arm w-full h-[64px] relative" style={{ background: 'transparent' }}>
                {avatarSkin === 'mannequin' ? (
                  <WoodenUpperArm />
                ) : (
                  <svg viewBox="0 0 24 64" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="backSleeveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="100%" stopColor="#334155" />
                      </linearGradient>
                    </defs>
                    {/* Shoulder Deltoid Cap */}
                    <path d="M 3 14 C 3 4 21 4 21 14 L 19 62 L 5 62 Z" fill="url(#backSleeveGrad)" stroke="#0f172a" strokeWidth="0.8" />
                    <path d="M 5 42 Q 12 47 18 43" stroke="#0f172a" strokeWidth="0.8" fill="none" />
                    <rect x="4" y="56" width="16" height="7" rx="2" fill="#1e293b" />
                  </svg>
                )}

                {/* Dense Puppet Warp Triangular Mesh for Upper Arm */}
                {isPuppetWarpActive && showPuppetMesh && <UpperArmMesh pinNumber={4} />}

                {/* Joint 4: Back Shoulder Pin */}
                {(showJoints || onlyJoints || isPuppetWarpActive || selectedJoint === 4) && (
                  <>
                    {onlyJoints && showBones && (
                      <svg className="skeleton-bones overflow-visible" viewBox="0 0 24 64">
                        <line x1="12" y1="10" x2="12" y2="60" stroke="#818cf8" strokeWidth="2.5" strokeDasharray="3 2" />
                      </svg>
                    )}
                    <JointDot
                      number={4}
                      top="10px"
                      left="12px"
                      title="Joint 4: Back Shoulder Joint"
                      isFlipped={positions.armBack.scaleX === -1}
                      isSelected={selectedJoint === 4}
                      isPuppetMode={isPuppetWarpActive}
                      isDragging={draggingPinId === 4}
                      puppetColor={puppetMeshColor}
                      hasSelectedJoint={selectedJoint !== null}
                      onPointerDown={(e) => handlePinPointerDown(4, e)}
                      onClick={() => setSelectedJoint(selectedJoint === 4 ? null : 4)}
                      onMouseEnter={() => setHoveredPinId(4)}
                      onMouseLeave={() => setHoveredPinId(null)}
                    />
                  </>
                )}

                {/* Lower Arm & Hand */}
                <div
                  className="lower-arm absolute top-[56px] left-0 w-full h-[74px]"
                  style={{
                    background: 'transparent',
                    transform: positions.armBack.elbowRot ? `rotate(${-positions.armBack.elbowRot}deg)` : undefined
                  }}
                >
                  {avatarSkin === 'mannequin' ? (
                    <WoodenLowerArm />
                  ) : (
                    <svg viewBox="0 0 24 74" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="backArmSkin" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#fed7aa" />
                          <stop offset="100%" stopColor="#fdba74" />
                        </linearGradient>
                      </defs>
                      {/* Elbow Socket Cap */}
                      <path d="M 4 12 C 4 3 20 3 20 12 L 18 46 Q 18 50 15 52 L 9 52 Q 6 50 6 46 Z" fill="url(#backArmSkin)" stroke="#ea580c" strokeWidth="0.5" />
                      
                      {/* Back Hand Fingers */}
                      <g id="back-hand-fingers" transform="translate(5, 50)">
                        <path d="M 3 2 C 0 8 2 16 5 20 C 8 21 12 18 12 14 C 13 8 11 2 8 0 Z" fill="#fed7aa" stroke="#ea580c" strokeWidth="0.5" />
                        <path d="M 6 12 C 5 16 6 21 8 21 C 10 21 11 17 10 13" stroke="#ea580c" strokeWidth="0.8" fill="none" />
                        <path d="M 4 8 C 2 12 2 16 4 17" stroke="#ea580c" strokeWidth="0.7" fill="none" />
                      </g>
                    </svg>
                  )}

                  {/* Dense Puppet Warp Triangular Mesh for Forearm & Hand */}
                  {isPuppetWarpActive && showPuppetMesh && (
                    <ForearmMesh elbowPin={5} wristPin={6} />
                  )}

                  {/* Joint 5: Back Elbow & Joint 6: Back Wrist Pin */}
                  {(showJoints || onlyJoints || isPuppetWarpActive || selectedJoint === 5 || selectedJoint === 6) && (
                    <>
                      {onlyJoints && showBones && (
                        <svg className="skeleton-bones overflow-visible" viewBox="0 0 24 74">
                          <line x1="12" y1="8" x2="12" y2="50" stroke="#818cf8" strokeWidth="2.5" strokeDasharray="3 2" />
                        </svg>
                      )}
                      {(showJoints || onlyJoints || isPuppetWarpActive || selectedJoint === 5) && (
                        <JointDot
                          number={5}
                          top="8px"
                          left="12px"
                          title="Joint 5: Back Elbow Joint"
                          isFlipped={positions.armBack.scaleX === -1}
                          isSelected={selectedJoint === 5}
                          isPuppetMode={isPuppetWarpActive}
                          isDragging={draggingPinId === 5}
                          puppetColor={puppetMeshColor}
                      hasSelectedJoint={selectedJoint !== null}
                          onPointerDown={(e) => handlePinPointerDown(5, e)}
                          onClick={() => setSelectedJoint(selectedJoint === 5 ? null : 5)}
                          onMouseEnter={() => setHoveredPinId(5)}
                          onMouseLeave={() => setHoveredPinId(null)}
                        />
                      )}
                      {(showJoints || onlyJoints || isPuppetWarpActive || selectedJoint === 6) && (
                        <JointDot
                          number={6}
                          top="50px"
                          left="12px"
                          title="Joint 6: Back Wrist / Hand"
                          isFlipped={positions.armBack.scaleX === -1}
                          isSelected={selectedJoint === 6}
                          isPuppetMode={isPuppetWarpActive}
                          isDragging={draggingPinId === 6}
                          puppetColor={puppetMeshColor}
                      hasSelectedJoint={selectedJoint !== null}
                          onPointerDown={(e) => handlePinPointerDown(6, e)}
                          onClick={() => setSelectedJoint(selectedJoint === 6 ? null : 6)}
                          onMouseEnter={() => setHoveredPinId(6)}
                          onMouseLeave={() => setHoveredPinId(null)}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ==========================================================
              3. BACK LEG LAYER (Joints 10, 11, 12)
              ========================================================== */}
          <div
            className="layer-wrapper"
            id="wrap-leg-back"
            style={getLayerStyle('legBack')}
          >
            <div className="leg leg-back w-full h-full relative" style={{ background: 'transparent' }}>
              <div className="thigh w-full h-[76px] relative" style={{ background: 'transparent' }}>
                {avatarSkin === 'mannequin' ? (
                  <WoodenThigh />
                ) : (
                  <svg viewBox="0 0 26 76" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="denimBackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#1e3a8a" />
                        <stop offset="60%" stopColor="#1d4ed8" />
                        <stop offset="100%" stopColor="#2563eb" />
                      </linearGradient>
                    </defs>
                    {/* Femur Head Cap */}
                    <path d="M 3 14 C 3 3 23 3 23 14 L 21 74 L 5 74 Z" fill="url(#denimBackGrad)" stroke="#172554" strokeWidth="0.8" />
                    <line x1="14" y1="4" x2="13" y2="74" stroke="#fbbf24" strokeWidth="0.6" strokeDasharray="3 1.5" opacity="0.7" />
                  </svg>
                )}

                {/* Dense Puppet Warp Triangular Mesh for Thigh */}
                {isPuppetWarpActive && showPuppetMesh && <ThighMesh pinNumber={10} />}

                {/* Joint 10: Back Hip Pin */}
                {(showJoints || onlyJoints || isPuppetWarpActive || selectedJoint === 10) && (
                  <>
                    {onlyJoints && showBones && (
                      <svg className="skeleton-bones overflow-visible" viewBox="0 0 26 76">
                        <line x1="13" y1="10" x2="13" y2="72" stroke="#818cf8" strokeWidth="2.5" strokeDasharray="3 2" />
                      </svg>
                    )}
                    <JointDot
                      number={10}
                      top="10px"
                      left="13px"
                      title="Joint 10: Back Hip Joint"
                      isFlipped={positions.legBack.scaleX === -1}
                      isSelected={selectedJoint === 10}
                      isPuppetMode={isPuppetWarpActive}
                      isDragging={draggingPinId === 10}
                      puppetColor={puppetMeshColor}
                      hasSelectedJoint={selectedJoint !== null}
                      onPointerDown={(e) => handlePinPointerDown(10, e)}
                      onClick={() => setSelectedJoint(selectedJoint === 10 ? null : 10)}
                      onMouseEnter={() => setHoveredPinId(10)}
                      onMouseLeave={() => setHoveredPinId(null)}
                    />
                  </>
                )}

                {/* Lower Leg Calf & Foot */}
                <div
                  className="calf absolute top-[68px] left-0 w-full h-[85px]"
                  style={{
                    background: 'transparent',
                    transform: positions.legBack.kneeRot ? `rotate(${positions.legBack.kneeRot}deg)` : undefined
                  }}
                >
                  {avatarSkin === 'mannequin' ? (
                    <WoodenCalf />
                  ) : (
                    <svg viewBox="0 0 26 85" className="w-full h-full overflow-visible">
                      <path d="M 4 12 C 4 3 22 3 22 12 L 20 74 L 6 74 Z" fill="url(#denimBackGrad)" stroke="#172554" strokeWidth="0.8" />
                      <line x1="13" y1="2" x2="13" y2="74" stroke="#fbbf24" strokeWidth="0.6" strokeDasharray="3 1.5" opacity="0.7" />
                      <rect x="5.5" y="68" width="15" height="7" rx="1.5" fill="#1e40af" stroke="#172554" strokeWidth="0.6" />
                    </svg>
                  )}

                  {/* Dense Puppet Warp Triangular Mesh for Calf */}
                  {isPuppetWarpActive && showPuppetMesh && <CalfMesh pinNumber={11} />}

                  {/* Joint 11: Back Knee Pin */}
                  {(showJoints || onlyJoints || isPuppetWarpActive || selectedJoint === 11) && (
                    <>
                      {onlyJoints && showBones && (
                        <svg className="skeleton-bones overflow-visible" viewBox="0 0 26 85">
                          <line x1="13" y1="8" x2="16" y2="74" stroke="#818cf8" strokeWidth="2.5" strokeDasharray="3 2" />
                        </svg>
                      )}
                      <JointDot
                        number={11}
                        top="8px"
                        left="13px"
                        title="Joint 11: Back Knee Joint"
                        isFlipped={positions.legBack.scaleX === -1}
                        isSelected={selectedJoint === 11}
                        isPuppetMode={isPuppetWarpActive}
                        isDragging={draggingPinId === 11}
                        puppetColor={puppetMeshColor}
                      hasSelectedJoint={selectedJoint !== null}
                        onPointerDown={(e) => handlePinPointerDown(11, e)}
                        onClick={() => setSelectedJoint(selectedJoint === 11 ? null : 11)}
                        onMouseEnter={() => setHoveredPinId(11)}
                        onMouseLeave={() => setHoveredPinId(null)}
                      />
                    </>
                  )}

                  {/* Foot & Shoe */}
                  <div className="foot absolute top-[70px] -left-[6px] w-[46px] h-[22px]" style={{ background: 'transparent' }}>
                    {avatarSkin === 'mannequin' ? (
                      <WoodenFoot />
                    ) : (
                      <svg viewBox="0 0 46 22" className="w-full h-full overflow-visible drop-shadow-sm">
                        <path
                          d="M 6 14 L 11 5 L 20 5 L 25 8 L 40 11 C 45 12 45 16 41 16 L 6 16 Z"
                          fill="#0f172a"
                          stroke="#334155"
                          strokeWidth="0.6"
                        />
                        <path d="M 36 11 Q 44 12 41 16 L 35 16 Z" fill="#e2e8f0" />
                        <rect x="5" y="15" width="39" height="5" rx="1.5" fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.6" />
                        <line x1="10" y1="18.5" x2="40" y2="18.5" stroke="#cbd5e1" strokeWidth="0.8" />
                        <line x1="17" y1="6" x2="22" y2="8" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                        <line x1="19" y1="8" x2="24" y2="10" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    )}

                    {/* Dense Puppet Warp Triangular Mesh for Foot */}
                    {isPuppetWarpActive && showPuppetMesh && <FootMesh pinNumber={12} />}

                    {/* Joint 12: Back Ankle Pin */}
                    {(showJoints || onlyJoints || isPuppetWarpActive || selectedJoint === 12) && (
                      <>
                        {onlyJoints && showBones && (
                          <svg className="skeleton-bones overflow-visible" viewBox="0 0 46 22">
                            <line x1="16" y1="8" x2="38" y2="12" stroke="#818cf8" strokeWidth="2" strokeDasharray="2 2" />
                            <circle cx="38" cy="12" r="3.5" fill="#818cf8" stroke="#ffffff" strokeWidth="1" />
                          </svg>
                        )}
                        <JointDot
                          number={12}
                          top="8px"
                          left="16px"
                          title="Joint 12: Back Ankle / Foot"
                          isFlipped={positions.legBack.scaleX === -1}
                          isSelected={selectedJoint === 12}
                          isPuppetMode={isPuppetWarpActive}
                          isDragging={draggingPinId === 12}
                          puppetColor={puppetMeshColor}
                      hasSelectedJoint={selectedJoint !== null}
                          onPointerDown={(e) => handlePinPointerDown(12, e)}
                          onClick={() => setSelectedJoint(selectedJoint === 12 ? null : 12)}
                          onMouseEnter={() => setHoveredPinId(12)}
                          onMouseLeave={() => setHoveredPinId(null)}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ==========================================================
              4. FRONT LEG LAYER (Joints 13, 14, 15)
              ========================================================== */}
          <div
            className="layer-wrapper"
            id="wrap-leg-front"
            style={getLayerStyle('legFront')}
          >
            <div className="leg leg-front w-full h-full relative" style={{ background: 'transparent' }}>
              <div className="thigh w-full h-[76px] relative" style={{ background: 'transparent' }}>
                {avatarSkin === 'mannequin' ? (
                  <WoodenThigh />
                ) : (
                  <svg viewBox="0 0 26 76" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="denimFrontGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#1d4ed8" />
                        <stop offset="50%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#2563eb" />
                      </linearGradient>
                    </defs>
                    {/* Femur Head Cap */}
                    <path d="M 3 14 C 3 3 23 3 23 14 L 21 74 L 5 74 Z" fill="url(#denimFrontGrad)" stroke="#1e3a8a" strokeWidth="0.8" />
                    <line x1="13" y1="4" x2="12" y2="74" stroke="#fbbf24" strokeWidth="0.7" strokeDasharray="3 1.5" opacity="0.85" />
                    <path d="M 7 60 Q 13 65 19 61" stroke="#60a5fa" strokeWidth="0.8" fill="none" opacity="0.6" />
                  </svg>
                )}

                {/* Dense Puppet Warp Triangular Mesh for Front Thigh */}
                {isPuppetWarpActive && showPuppetMesh && <ThighMesh pinNumber={13} />}

                {/* Joint 13: Front Hip Pin */}
                {(showJoints || onlyJoints || isPuppetWarpActive || selectedJoint === 13) && (
                  <>
                    {onlyJoints && showBones && (
                      <svg className="skeleton-bones overflow-visible" viewBox="0 0 26 76">
                        <line x1="13" y1="10" x2="13" y2="72" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="3 2" />
                      </svg>
                    )}
                    <JointDot
                      number={13}
                      top="10px"
                      left="13px"
                      title="Joint 13: Front Hip Joint"
                      isFlipped={positions.legFront.scaleX === -1}
                      isSelected={selectedJoint === 13}
                      isPuppetMode={isPuppetWarpActive}
                      isDragging={draggingPinId === 13}
                      puppetColor={puppetMeshColor}
                      hasSelectedJoint={selectedJoint !== null}
                      onPointerDown={(e) => handlePinPointerDown(13, e)}
                      onClick={() => setSelectedJoint(selectedJoint === 13 ? null : 13)}
                      onMouseEnter={() => setHoveredPinId(13)}
                      onMouseLeave={() => setHoveredPinId(null)}
                    />
                  </>
                )}

                {/* Lower Leg Calf & Foot */}
                <div
                  className="calf absolute top-[68px] left-0 w-full h-[85px]"
                  style={{
                    background: 'transparent',
                    transform: positions.legFront.kneeRot ? `rotate(${positions.legFront.kneeRot}deg)` : undefined
                  }}
                >
                  {avatarSkin === 'mannequin' ? (
                    <WoodenCalf />
                  ) : (
                    <svg viewBox="0 0 26 85" className="w-full h-full overflow-visible">
                      <path d="M 4 12 C 4 3 22 3 22 12 L 20 74 L 6 74 Z" fill="url(#denimFrontGrad)" stroke="#1e3a8a" strokeWidth="0.8" />
                      <line x1="12" y1="2" x2="12" y2="74" stroke="#fbbf24" strokeWidth="0.7" strokeDasharray="3 1.5" opacity="0.85" />
                      <rect x="5.5" y="68" width="15" height="7" rx="1.5" fill="#2563eb" stroke="#1e3a8a" strokeWidth="0.6" />
                    </svg>
                  )}

                  {/* Dense Puppet Warp Triangular Mesh for Front Calf */}
                  {isPuppetWarpActive && showPuppetMesh && <CalfMesh pinNumber={14} />}

                  {/* Joint 14: Front Knee Pin */}
                  {(showJoints || onlyJoints || isPuppetWarpActive || selectedJoint === 14) && (
                    <>
                      {onlyJoints && showBones && (
                        <svg className="skeleton-bones overflow-visible" viewBox="0 0 26 85">
                          <line x1="13" y1="8" x2="16" y2="74" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="3 2" />
                        </svg>
                      )}
                      <JointDot
                        number={14}
                        top="8px"
                        left="13px"
                        title="Joint 14: Front Knee Joint"
                        isFlipped={positions.legFront.scaleX === -1}
                        isSelected={selectedJoint === 14}
                        isPuppetMode={isPuppetWarpActive}
                        isDragging={draggingPinId === 14}
                        puppetColor={puppetMeshColor}
                      hasSelectedJoint={selectedJoint !== null}
                        onPointerDown={(e) => handlePinPointerDown(14, e)}
                        onClick={() => setSelectedJoint(selectedJoint === 14 ? null : 14)}
                        onMouseEnter={() => setHoveredPinId(14)}
                        onMouseLeave={() => setHoveredPinId(null)}
                      />
                    </>
                  )}

                  {/* Front Foot & Sneaker */}
                  <div className="foot absolute top-[70px] -left-[6px] w-[46px] h-[22px]" style={{ background: 'transparent' }}>
                    {avatarSkin === 'mannequin' ? (
                      <WoodenFoot />
                    ) : (
                      <svg viewBox="0 0 46 22" className="w-full h-full overflow-visible drop-shadow-sm">
                        <path
                          d="M 6 14 L 11 5 L 20 5 L 25 8 L 40 11 C 45 12 45 16 41 16 L 6 16 Z"
                          fill="#0284c7"
                          stroke="#0369a1"
                          strokeWidth="0.6"
                        />
                        <path d="M 36 11 Q 44 12 41 16 L 35 16 Z" fill="#ffffff" />
                        <rect x="5" y="15" width="39" height="5" rx="1.5" fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.6" />
                        <line x1="10" y1="18.5" x2="40" y2="18.5" stroke="#cbd5e1" strokeWidth="0.8" />
                        <line x1="17" y1="6" x2="22" y2="8" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                        <line x1="19" y1="8" x2="24" y2="10" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                        <path d="M 14 13 Q 22 14 30 10" stroke="#ffffff" strokeWidth="1.4" fill="none" opacity="0.9" />
                      </svg>
                    )}

                    {/* Dense Puppet Warp Triangular Mesh for Front Foot */}
                    {isPuppetWarpActive && showPuppetMesh && <FootMesh pinNumber={15} />}

                    {/* Joint 15: Front Ankle Pin */}
                    {(showJoints || onlyJoints || isPuppetWarpActive || selectedJoint === 15) && (
                      <>
                        {onlyJoints && showBones && (
                          <svg className="skeleton-bones overflow-visible" viewBox="0 0 46 22">
                            <line x1="16" y1="8" x2="38" y2="12" stroke="#38bdf8" strokeWidth="2" strokeDasharray="2 2" />
                            <circle cx="38" cy="12" r="3.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
                          </svg>
                        )}
                        <JointDot
                          number={15}
                          top="8px"
                          left="16px"
                          title="Joint 15: Front Ankle / Foot"
                          isFlipped={positions.legFront.scaleX === -1}
                          isSelected={selectedJoint === 15}
                          isPuppetMode={isPuppetWarpActive}
                          isDragging={draggingPinId === 15}
                          puppetColor={puppetMeshColor}
                      hasSelectedJoint={selectedJoint !== null}
                          onPointerDown={(e) => handlePinPointerDown(15, e)}
                          onClick={() => setSelectedJoint(selectedJoint === 15 ? null : 15)}
                          onMouseEnter={() => setHoveredPinId(15)}
                          onMouseLeave={() => setHoveredPinId(null)}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ==========================================================
              5. TORSO & PELVIS LAYER (Joint 2: Chest & Joint 3: Waist)
              ========================================================== */}
          <div
            className="layer-wrapper"
            id="wrap-torso"
            style={getLayerStyle('torso')}
          >
            <div className="torso w-full h-full relative" style={{ background: 'transparent' }}>
              {avatarSkin === 'mannequin' ? (
                <WoodenTorso />
              ) : (
                <svg viewBox="0 0 50 102" className="w-full h-full drop-shadow-md overflow-visible">
                  <defs>
                    <linearGradient id="jacketGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#1e293b" />
                      <stop offset="60%" stopColor="#334155" />
                      <stop offset="100%" stopColor="#475569" />
                    </linearGradient>
                    <linearGradient id="innerShirt" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#f8fafc" />
                      <stop offset="100%" stopColor="#e2e8f0" />
                    </linearGradient>
                    <linearGradient id="pelvisDenim" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#172554" />
                      <stop offset="50%" stopColor="#1e3a8a" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                  </defs>

                  {/* Jacket Body */}
                  <path
                    d="M 10 2 C 22 0 36 0 44 6 C 46 26 46 70 43 83 C 34 85 22 85 10 83 C 7 68 7 26 10 2 Z"
                    fill="url(#jacketGrad)"
                    stroke="#0f172a"
                    strokeWidth="0.8"
                  />

                  {/* Inner T-Shirt V-Neck */}
                  <path d="M 22 2 L 28 2 L 31 18 L 20 18 Z" fill="url(#innerShirt)" />
                  <path d="M 22 2 Q 26 15 29 2" stroke="#cbd5e1" strokeWidth="1" fill="none" />

                  {/* Collar / Lapel */}
                  <path d="M 13 2 L 21 18 L 23 42 L 19 38 L 17 12 Z" fill="#475569" />
                  <path d="M 40 4 L 31 18 L 29 42 L 33 38 L 38 12 Z" fill="#1e293b" />

                  {/* Zipper */}
                  <line x1="26" y1="20" x2="26" y2="80" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="2 1" />
                  <path d="M 15 55 Q 23 58 25 53" stroke="#0f172a" strokeWidth="1" opacity="0.6" fill="none" />
                  <path d="M 37 60 Q 29 64 27 58" stroke="#0f172a" strokeWidth="1" opacity="0.6" fill="none" />

                  {/* 🟢 Green Dot: Front Side Indicator */}
                  <g id="front-indicator">
                    <circle cx="36" cy="36" r="6" fill="#22c55e" opacity="0.3" />
                    <circle cx="36" cy="36" r="4.2" fill="#22c55e" stroke="#14532d" strokeWidth="1.2" />
                    <circle cx="34.8" cy="34.8" r="1.3" fill="#ffffff" opacity="0.9" />
                  </g>

                  {/* Belt */}
                  <rect x="9" y="80" width="33" height="7" rx="1.5" fill="#18181b" />
                  <rect x="22" y="79.5" width="8" height="8" rx="1" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />

                  {/* Pelvis & Hips Connector */}
                  <path
                    d="M 9 85 L 41 85 C 43 92 40 99 37 102 C 30 102 20 102 13 102 C 10 99 9 92 9 85 Z"
                    fill="url(#pelvisDenim)"
                    stroke="#172554"
                    strokeWidth="0.8"
                  />
                  {/* Crotch Seam */}
                  <path d="M 25 86 L 25 96 Q 25 101 29 101" stroke="#fbbf24" strokeWidth="0.7" fill="none" opacity="0.85" />
                  {/* Pocket Rivets */}
                  <circle cx="12" cy="88" r="1.2" fill="#fbbf24" />
                  <circle cx="38" cy="88" r="1.2" fill="#fbbf24" />
                </svg>
              )}

              {/* Exact Photoshop Puppet Warp Dense Mesh for Torso & Pelvis */}
              {isPuppetWarpActive && showPuppetMesh && <TorsoMesh />}

              {/* Joint 2 (Chest & Spine) and Joint 3 (Waist & Pelvis) Pins */}
              {(showJoints || onlyJoints || isPuppetWarpActive || selectedJoint === 2 || selectedJoint === 3) && (
                <>
                  {onlyJoints && showBones && (
                    <svg className="skeleton-bones overflow-visible" viewBox="0 0 50 102">
                      <line x1="26" y1="24" x2="26" y2="85" stroke="#a855f7" strokeWidth="3" strokeDasharray="3 2" />
                      <line x1="26" y1="24" x2="4" y2="10" stroke="#a855f7" strokeWidth="2.5" strokeDasharray="3 2" />
                      <line x1="26" y1="24" x2="30" y2="14" stroke="#a855f7" strokeWidth="2.5" strokeDasharray="3 2" />
                      <line x1="26" y1="85" x2="13" y2="88" stroke="#a855f7" strokeWidth="2.5" strokeDasharray="3 2" />
                      <line x1="26" y1="85" x2="23" y2="90" stroke="#a855f7" strokeWidth="2.5" strokeDasharray="3 2" />
                    </svg>
                  )}
                  {(showJoints || onlyJoints || isPuppetWarpActive || selectedJoint === 2) && (
                    <JointDot
                      number={2}
                      top="24px"
                      left="26px"
                      title="Joint 2: Chest & Spine"
                      isFlipped={positions.torso.scaleX === -1}
                      isSelected={selectedJoint === 2}
                      isPuppetMode={isPuppetWarpActive}
                      isDragging={draggingPinId === 2}
                      puppetColor={puppetMeshColor}
                      hasSelectedJoint={selectedJoint !== null}
                      onPointerDown={(e) => handlePinPointerDown(2, e)}
                      onClick={() => setSelectedJoint(selectedJoint === 2 ? null : 2)}
                      onMouseEnter={() => setHoveredPinId(2)}
                      onMouseLeave={() => setHoveredPinId(null)}
                    />
                  )}
                  {(showJoints || onlyJoints || isPuppetWarpActive || selectedJoint === 3) && (
                    <JointDot
                      number={3}
                      top="85px"
                      left="26px"
                      title="Joint 3: Waist & Pelvis"
                      isFlipped={positions.torso.scaleX === -1}
                      isSelected={selectedJoint === 3}
                      isPuppetMode={isPuppetWarpActive}
                      isDragging={draggingPinId === 3}
                      puppetColor={puppetMeshColor}
                      hasSelectedJoint={selectedJoint !== null}
                      onPointerDown={(e) => handlePinPointerDown(3, e)}
                      onClick={() => setSelectedJoint(selectedJoint === 3 ? null : 3)}
                      onMouseEnter={() => setHoveredPinId(3)}
                      onMouseLeave={() => setHoveredPinId(null)}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* ==========================================================
              6. FRONT ARM LAYER (Joints 7, 8, 9)
              ========================================================== */}
          <div
            className="layer-wrapper"
            id="wrap-arm-front"
            style={getLayerStyle('armFront')}
          >
            <div className="arm arm-front w-full h-full relative" style={{ background: 'transparent' }}>
              <div className="upper-arm w-full h-[64px] relative" style={{ background: 'transparent' }}>
                {avatarSkin === 'mannequin' ? (
                  <WoodenUpperArm />
                ) : (
                  <svg viewBox="0 0 24 64" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="frontSleeveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#334155" />
                        <stop offset="60%" stopColor="#475569" />
                        <stop offset="100%" stopColor="#64748b" />
                      </linearGradient>
                    </defs>
                    {/* Shoulder Deltoid Cap */}
                    <path d="M 3 14 C 3 4 21 4 21 14 L 19 62 L 5 62 Z" fill="url(#frontSleeveGrad)" stroke="#1e293b" strokeWidth="0.8" />
                    <path d="M 5 44 Q 12 49 18 45" stroke="#1e293b" strokeWidth="0.9" fill="none" />
                    <rect x="4" y="56" width="16" height="7" rx="2" fill="#334155" stroke="#1e293b" strokeWidth="0.6" />
                  </svg>
                )}

                {/* Dense Puppet Warp Triangular Mesh for Front Upper Arm */}
                {isPuppetWarpActive && showPuppetMesh && <UpperArmMesh pinNumber={7} />}

                {/* Joint 7: Front Shoulder Pin */}
                {(showJoints || onlyJoints || isPuppetWarpActive || selectedJoint === 7) && (
                  <>
                    {onlyJoints && showBones && (
                      <svg className="skeleton-bones overflow-visible" viewBox="0 0 24 64">
                        <line x1="12" y1="10" x2="12" y2="60" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="3 2" />
                      </svg>
                    )}
                    <JointDot
                      number={7}
                      top="10px"
                      left="12px"
                      title="Joint 7: Front Shoulder Joint"
                      isFlipped={positions.armFront.scaleX === -1}
                      isSelected={selectedJoint === 7}
                      isPuppetMode={isPuppetWarpActive}
                      isDragging={draggingPinId === 7}
                      puppetColor={puppetMeshColor}
                      hasSelectedJoint={selectedJoint !== null}
                      onPointerDown={(e) => handlePinPointerDown(7, e)}
                      onClick={() => setSelectedJoint(selectedJoint === 7 ? null : 7)}
                      onMouseEnter={() => setHoveredPinId(7)}
                      onMouseLeave={() => setHoveredPinId(null)}
                    />
                  </>
                )}

                {/* Lower Forearm & Hand */}
                <div
                  className="lower-arm absolute top-[56px] left-0 w-full h-[74px]"
                  style={{
                    background: 'transparent',
                    transform: positions.armFront.elbowRot ? `rotate(${-positions.armFront.elbowRot}deg)` : undefined
                  }}
                >
                  {avatarSkin === 'mannequin' ? (
                    <WoodenLowerArm />
                  ) : (
                    <svg viewBox="0 0 24 74" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="frontArmSkin" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ffedd5" />
                          <stop offset="60%" stopColor="#fed7aa" />
                          <stop offset="100%" stopColor="#fdba74" />
                        </linearGradient>
                      </defs>

                      {/* Forearm Shape */}
                      <path d="M 4 12 C 4 3 20 3 20 12 L 18 46 Q 18 50 15 52 L 9 52 Q 6 50 6 46 Z" fill="url(#frontArmSkin)" stroke="#ea580c" strokeWidth="0.5" />
                      
                      {/* Wristband & Watch */}
                      <rect x="5" y="42" width="14" height="5" rx="1.5" fill="#0f172a" />
                      <rect x="9" y="41" width="6" height="7" rx="1" fill="#38bdf8" />

                      {/* Front Hand & Fingers */}
                      <g id="front-hand-fingers" transform="translate(5, 50)">
                        <path
                          d="M 4 2 C 0 8 1 15 4 20 C 7 22 12 20 13 15 C 14 9 12 2 9 0 Z"
                          fill="url(#frontArmSkin)"
                          stroke="#ea580c"
                          strokeWidth="0.5"
                        />
                        <path d="M 5 12 C 4 16 5 21 7 21 C 9 21 10 17 9 13" stroke="#c2410c" strokeWidth="0.8" fill="none" />
                        <path d="M 8 13 C 8 17 9 22 11 22 C 12 22 13 18 12 14" stroke="#c2410c" strokeWidth="0.75" fill="none" />
                        <path d="M 3 6 Q 0 10 2 13" stroke="#ea580c" strokeWidth="0.8" fill="none" />
                      </g>
                    </svg>
                  )}

                  {/* Dense Puppet Warp Triangular Mesh for Front Forearm & Hand */}
                  {isPuppetWarpActive && showPuppetMesh && (
                    <ForearmMesh elbowPin={8} wristPin={9} />
                  )}

                  {/* Joint 8: Front Elbow & Joint 9: Front Wrist Pins */}
                  {(showJoints || onlyJoints || isPuppetWarpActive || selectedJoint === 8 || selectedJoint === 9) && (
                    <>
                      {onlyJoints && showBones && (
                        <svg className="skeleton-bones overflow-visible" viewBox="0 0 24 74">
                          <line x1="12" y1="8" x2="12" y2="50" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="3 2" />
                        </svg>
                      )}
                      {(showJoints || onlyJoints || isPuppetWarpActive || selectedJoint === 8) && (
                        <JointDot
                          number={8}
                          top="8px"
                          left="12px"
                          title="Joint 8: Front Elbow Joint"
                          isFlipped={positions.armFront.scaleX === -1}
                          isSelected={selectedJoint === 8}
                          isPuppetMode={isPuppetWarpActive}
                          isDragging={draggingPinId === 8}
                          puppetColor={puppetMeshColor}
                      hasSelectedJoint={selectedJoint !== null}
                          onPointerDown={(e) => handlePinPointerDown(8, e)}
                          onClick={() => setSelectedJoint(selectedJoint === 8 ? null : 8)}
                          onMouseEnter={() => setHoveredPinId(8)}
                          onMouseLeave={() => setHoveredPinId(null)}
                        />
                      )}
                      {(showJoints || onlyJoints || isPuppetWarpActive || selectedJoint === 9) && (
                        <JointDot
                          number={9}
                          top="50px"
                          left="12px"
                          title="Joint 9: Front Wrist / Hand"
                          isFlipped={positions.armFront.scaleX === -1}
                          isSelected={selectedJoint === 9}
                          isPuppetMode={isPuppetWarpActive}
                          isDragging={draggingPinId === 9}
                          puppetColor={puppetMeshColor}
                      hasSelectedJoint={selectedJoint !== null}
                          onPointerDown={(e) => handlePinPointerDown(9, e)}
                          onClick={() => setSelectedJoint(selectedJoint === 9 ? null : 9)}
                          onMouseEnter={() => setHoveredPinId(9)}
                          onMouseLeave={() => setHoveredPinId(null)}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div> {/* End character-bob */}
      </div>
    </div>
  );
}
