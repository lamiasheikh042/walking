/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

export default function App() {
  const [mode, setMode] = useState<'walking' | 'talking'>('talking');

  return (
    <div className="relative w-full min-h-screen bg-[#e0f7fa] flex flex-col justify-center items-center overflow-hidden font-['Segoe_UI',Tahoma,Geneva,Verdana,sans-serif] m-0 p-0">
      
      {/* Controls */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] flex gap-4 bg-white/90 px-6 py-3 rounded-[30px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] backdrop-blur-sm">
        <button 
          onClick={() => setMode('walking')}
          className={`px-6 py-2.5 border-none rounded-[20px] text-base font-bold cursor-pointer transition-all ${
            mode === 'walking' ? 'bg-[#3498db] text-white shadow-[0_2px_5px_rgba(52,152,219,0.4)] scale-105' : 'bg-[#ccc] text-[#555] hover:-translate-y-0.5'
          }`}
        >
          🚶‍♂️ Walk
        </button>
        <button 
          onClick={() => setMode('talking')}
          className={`px-6 py-2.5 border-none rounded-[20px] text-base font-bold cursor-pointer transition-all ${
            mode === 'talking' ? 'bg-[#3498db] text-white shadow-[0_2px_5px_rgba(52,152,219,0.4)] scale-105' : 'bg-[#ccc] text-[#555] hover:-translate-y-0.5'
          }`}
        >
          🗣️ Talking
        </button>
      </div>

      {/* Scene */}
      <div className={`relative w-full max-w-[800px] h-[450px] overflow-hidden bg-gradient-to-b from-[#b2ebf2] via-[#b2ebf2] to-[#f0f0f0] rounded-2xl shadow-2xl flex items-center justify-center ${mode}`}>
        
        {/* Ground */}
        <div className={`absolute bottom-0 w-[200%] h-[30%] ground-layer ${mode === 'walking' ? 'animate-ground' : ''}`} />
        
        {/* Character Container */}
        <div className={`character-container absolute bottom-[100px] left-1/2 -translate-x-1/2 w-[100px] h-[250px] origin-bottom ${
          mode === 'walking' ? 'char-walking' : 'char-talking'
        }`}>
            
          {/* Head */}
          <div className="layer-wrapper absolute origin-center transition-transform duration-400" id="wrap-head" style={mode === 'talking' ? { transform: 'translate(18px, -5px) rotate(0deg) scaleX(1)' } : { transform: 'translate(10px, 1px) rotate(-2deg)' }}>
            <div className={`head absolute top-[-40px] left-[10px] w-[40px] h-[40px] bg-[#333] rounded-[50%] z-10 origin-bottom ${mode === 'talking' ? 'animate-head-nod' : ''}`} />
          </div>

          {/* Torso */}
          <div className="layer-wrapper absolute origin-center transition-transform duration-400" id="wrap-torso" style={mode === 'talking' ? { transform: 'translate(0px, 0px) rotate(0deg)' } : { transform: 'translate(-6px, 0px) rotate(0deg)' }}>
            <div className="torso absolute top-0 left-[25px] w-[30px] h-[90px] bg-[#333] rounded-[15px] z-10 origin-top">
              <div className="joint absolute w-[10px] h-[10px] bg-red-500 rounded-[50%] z-35 -translate-x-1/2 -translate-y-1/2" style={{ top: '90px', left: '50%' }} />
            </div>
          </div>

          {/* Back Arm (Left Arm) - Purple */}
          <div className="layer-wrapper absolute origin-center transition-transform duration-400" id="wrap-arm-back" style={mode === 'talking' ? { transform: 'translate(50px, -6px) rotate(-5deg) scaleX(-1)' } : { transform: 'translate(10px, 0px) rotate(0deg)' }}>
            <div className="arm arm-back absolute top-[20px] left-[25px] w-[10px] h-[70px] origin-top z-15">
              <div className="upper-arm w-full h-full rounded-[5px] relative bg-[#9b59b6]">
                <div className="joint absolute w-[10px] h-[10px] bg-red-500 rounded-[50%] z-35 -translate-x-1/2 -translate-y-1/2" style={{ top: 0, left: '50%' }} />
                <div className={`lower-arm absolute top-[65px] left-0 w-full h-[60px] rounded-[5px] origin-top bg-[#9b59b6] ${mode === 'talking' ? 'arm-back-talking' : ''}`}>
                  <div className="joint absolute w-[10px] h-[10px] bg-red-500 rounded-[50%] z-35 -translate-x-1/2 -translate-y-1/2" style={{ top: 0, left: '50%' }} />
                  <div className="joint absolute w-[10px] h-[10px] bg-red-500 rounded-[50%] z-35 -translate-x-1/2 -translate-y-1/2" style={{ bottom: 0, left: '50%' }} />
                  <div className="palm absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-[16px] h-[16px] rounded-[50%] z-25 bg-[#9b59b6]" />
                </div>
              </div>
            </div>
          </div>

          {/* Back Leg */}
          <div className="layer-wrapper absolute origin-center transition-transform duration-400" id="wrap-leg-back" style={mode === 'talking' ? { transform: 'translate(-15px, 0px) rotate(-5deg)' } : { transform: 'translate(0px, 0px) rotate(0deg)' }}>
            <div className={`leg leg-back absolute top-[85px] left-[40px] w-[12px] h-[80px] origin-top ${mode === 'walking' ? 'leg-back-anim' : 'z-4'}`}>
              <div className="thigh w-full h-full bg-[#1976d2] rounded-[6px] relative">
                <div className="joint absolute w-[10px] h-[10px] bg-red-500 rounded-[50%] z-35 -translate-x-1/2 -translate-y-1/2" style={{ top: 0, left: '50%' }} />
                <div className={`calf absolute top-[75px] left-0 w-full h-[75px] bg-[#1976d2] rounded-[6px] origin-top ${mode === 'walking' ? 'calf-back-anim' : ''}`}>
                  <div className="joint absolute w-[10px] h-[10px] bg-red-500 rounded-[50%] z-35 -translate-x-1/2 -translate-y-1/2" style={{ top: 0, left: '50%' }} />
                  <div className={`foot absolute bottom-[5px] left-0 w-[30px] h-[10px] bg-[#333] rounded-r-[5px] origin-left ${mode === 'walking' ? 'foot-back-anim' : ''}`}>
                    <div className="joint absolute w-[10px] h-[10px] bg-red-500 rounded-[50%] z-35 -translate-x-1/2 -translate-y-1/2" style={{ top: '50%', left: 0 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Front Leg */}
          <div className="layer-wrapper absolute origin-center transition-transform duration-400" id="wrap-leg-front" style={mode === 'talking' ? { transform: 'translate(15px, 0px) rotate(5deg)' } : { transform: 'translate(2px, 0px) rotate(0deg)' }}>
            <div className={`leg leg-front absolute top-[85px] left-[30px] w-[12px] h-[80px] origin-top ${mode === 'walking' ? 'leg-front-anim' : 'z-6'}`}>
              <div className="thigh w-full h-full bg-[#1976d2] rounded-[6px] relative">
                <div className="joint absolute w-[10px] h-[10px] bg-red-500 rounded-[50%] z-35 -translate-x-1/2 -translate-y-1/2" style={{ top: 0, left: '50%' }} />
                <div className={`calf absolute top-[75px] left-0 w-full h-[75px] bg-[#1976d2] rounded-[6px] origin-top ${mode === 'walking' ? 'calf-front-anim' : ''}`}>
                  <div className="joint absolute w-[10px] h-[10px] bg-red-500 rounded-[50%] z-35 -translate-x-1/2 -translate-y-1/2" style={{ top: 0, left: '50%' }} />
                  <div className={`foot absolute bottom-[5px] left-0 w-[30px] h-[10px] bg-[#333] rounded-r-[5px] origin-left ${mode === 'walking' ? 'foot-front-anim' : ''}`}>
                    <div className="joint absolute w-[10px] h-[10px] bg-red-500 rounded-[50%] z-35 -translate-x-1/2 -translate-y-1/2" style={{ top: '50%', left: 0 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Front Arm (Right Arm) - Green */}
          <div className="layer-wrapper absolute origin-center transition-transform duration-400" id="wrap-arm-front" style={mode === 'talking' ? { transform: 'translate(26px, -26px) rotate(-82deg) scaleX(-1)' } : { transform: 'translate(0px, 0px) rotate(0deg)' }}>
            <div className={`arm arm-front absolute top-[20px] left-[35px] w-[10px] h-[70px] origin-top ${mode === 'walking' ? 'arm-front-anim' : 'z-16 arm-front-talking'}`}>
              <div className="upper-arm w-full h-full rounded-[5px] relative bg-[#2ecc71]">
                <div className="joint absolute w-[10px] h-[10px] bg-red-500 rounded-[50%] z-35 -translate-x-1/2 -translate-y-1/2" style={{ top: 0, left: '50%' }} />
                <div className={`lower-arm absolute top-[65px] left-0 w-full h-[60px] rounded-[5px] origin-top bg-[#2ecc71] ${mode === 'talking' ? 'arm-front-lower-talking' : ''} ${mode === 'walking' ? 'arm-front-lower-walking' : ''}`}>
                  <div className="joint absolute w-[10px] h-[10px] bg-red-500 rounded-[50%] z-35 -translate-x-1/2 -translate-y-1/2" style={{ top: 0, left: '50%' }} />
                  <div className="joint absolute w-[10px] h-[10px] bg-red-500 rounded-[50%] z-35 -translate-x-1/2 -translate-y-1/2" style={{ bottom: 0, left: '50%' }} />
                  <div className="palm absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-[16px] h-[16px] rounded-[50%] z-25 bg-[#2ecc71]" />
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
