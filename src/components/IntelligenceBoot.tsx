import React, { useEffect, useState } from 'react';
import { VShiroyaLogo } from './VShiroyaLogo';
import { Sparkles, ShieldCheck } from 'lucide-react';

interface IntelligenceBootProps {
  onComplete: () => void;
  forceRun?: boolean;
}

export const IntelligenceBoot: React.FC<IntelligenceBootProps> = ({ onComplete, forceRun = false }) => {
  const [stage, setStage] = useState<'initial' | 'ring' | 'sweep' | 'logo' | 'complete'>('initial');

  useEffect(() => {
    // Check if reduced motion is preferred
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      onComplete();
      return;
    }

    // Sequence stages
    const t1 = setTimeout(() => setStage('ring'), 150);
    const t2 = setTimeout(() => setStage('sweep'), 450);
    const t3 = setTimeout(() => setStage('logo'), 750);
    const t4 = setTimeout(() => {
      setStage('complete');
      onComplete();
    }, 1450);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  if (stage === 'complete') return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden transition-opacity duration-500 ${
        stage === 'complete' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Subtle AI Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />

      {/* Center Glowing Point & Expanding Ring */}
      <div className="relative flex items-center justify-center">
        {/* Tiny Glowing Center Point */}
        <div
          className={`w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_20px_#f59e0b] transition-all duration-300 ${
            stage === 'initial' ? 'scale-100 opacity-100' : 'scale-150 opacity-80'
          }`}
        />

        {/* Expanding Ring */}
        {(stage === 'ring' || stage === 'sweep' || stage === 'logo') && (
          <div className="absolute w-48 h-48 rounded-full border border-amber-500/30 animate-ping opacity-60 pointer-events-none" />
        )}

        {/* Scanning Circular Ring */}
        {(stage === 'sweep' || stage === 'logo') && (
          <div
            className="absolute w-64 h-64 rounded-full border-2 border-indigo-500/40 border-t-amber-400 animate-spin"
            style={{ animationDuration: '3s' }}
          />
        )}

        {/* Horizontal Laser Sweep Line */}
        {(stage === 'sweep' || stage === 'logo') && (
          <div className="absolute w-[90vw] max-w-xl h-[1px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b] animate-pulse" />
        )}

        {/* Center Logo Appearance */}
        {stage === 'logo' && (
          <div className="absolute z-10 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 ease-out">
            <VShiroyaLogo size="xl" showText={false} />
            <div className="mt-4 text-center">
              <span className="font-serif font-black text-xl tracking-[0.2em] bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent uppercase">
                V SHIROYA
              </span>
              <div className="text-[10px] tracking-[0.3em] font-extrabold text-indigo-300 uppercase mt-1 flex items-center gap-1.5 justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                POLICY AI INTELLIGENCE ENGINE ONLINE
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Boot Status Indicator */}
      <div className="absolute bottom-10 flex items-center gap-2 text-xs font-mono text-slate-400">
        <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
        <span>INITIALIZING V SHIROYA NEURAL ENGINE...</span>
      </div>
    </div>
  );
};
