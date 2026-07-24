'use client';
import { useEffect, useRef, useState } from 'react';
import { Video, VideoOff, Minimize2, Maximize2, Clock } from 'lucide-react';

interface VideoFloatingBoxProps {
  stream: MediaStream | null;
  isRecording: boolean;
  recordingDuration: number;
}

export default function VideoFloatingBox({ stream, isRecording, recordingDuration }: VideoFloatingBoxProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => {
        console.warn("Autoplay was prevented on the stream: ", e);
      });
    }
  }, [stream, isMinimized]);

  const formatDuration = (seconds: number) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  if (!stream) return null;

  return (
    <div
      id="proctor-floating-box"
      className={`fixed bottom-6 right-6 bg-slate-900/95 backdrop-blur border-2 ${
        isRecording ? 'border-emerald-500/80' : 'border-slate-700'
      } rounded-2xl shadow-2xl transition-all duration-300 z-[9999] overflow-hidden flex flex-col ${
        isMinimized ? 'w-56 h-12' : 'w-72 h-56'
      }`}
      dir="rtl"
    >
      {/* Header bar */}
      <div className="flex justify-between items-center px-3.5 py-2.5 bg-slate-950 border-b border-slate-800/80 select-none shrink-0">
        <div className="flex items-center gap-1.5">
          {isRecording ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] text-emerald-400 font-extrabold tracking-wide">بث نشط</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-rose-500"></span>
              <span className="text-[10px] text-rose-400 font-extrabold">متوقف</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2.5">
          {/* Timer Display */}
          <div className="flex items-center gap-1 text-[11px] text-slate-300 font-mono font-bold bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-800">
            <Clock className="h-3 w-3 text-indigo-400" />
            <span>{formatDuration(recordingDuration)}</span>
          </div>

          {/* Minimize/Maximize button */}
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-slate-400 hover:text-white hover:bg-slate-800/80 p-1 rounded-md transition-all cursor-pointer"
            title={isMinimized ? "تكبير النافذة" : "تصغير النافذة"}
          >
            {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Video Content */}
      {!isMinimized && (
        <div className="flex-1 bg-slate-950 relative flex items-center justify-center group">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover rounded-b-2xl pointer-events-none"
          />
          {/* Overlay Tag */}
          <div className="absolute top-2.5 right-2.5 bg-slate-950/80 text-[9px] text-indigo-300 font-bold px-2 py-0.5 rounded-md border border-slate-800/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            كاميرا + شاشة
          </div>
        </div>
      )}
    </div>
  );
}
