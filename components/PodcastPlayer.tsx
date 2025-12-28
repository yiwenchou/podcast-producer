
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PodcastContent } from '../types';

interface PodcastPlayerProps {
  content: PodcastContent;
}

interface LineTiming {
  index: number;
  startTime: number;
  endTime: number;
}

const PodcastPlayer: React.FC<PodcastPlayerProps> = ({ content }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const requestRef = useRef<number>(undefined);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Calculate estimated timing for each line based on character count
  const lineTimings = useMemo(() => {
    if (!content.audioBuffer) return [];
    
    const totalDuration = content.audioBuffer.duration;
    const lines = content.script.map(line => ({
      text: line.speaker + line.text,
      length: (line.speaker + line.text).length
    }));
    
    const totalChars = lines.reduce((acc, line) => acc + line.length, 0);
    
    let elapsedChars = 0;
    return lines.map((line, index) => {
      const startPercent = elapsedChars / totalChars;
      elapsedChars += line.length;
      const endPercent = elapsedChars / totalChars;
      
      return {
        index,
        startTime: startPercent * totalDuration,
        endTime: endPercent * totalDuration
      };
    });
  }, [content.script, content.audioBuffer]);

  // Update active index based on current time
  useEffect(() => {
    const activeLine = lineTimings.find(
      timing => currentTime >= timing.startTime && currentTime < timing.endTime
    );
    if (activeLine && activeLine.index !== activeIndex) {
      setActiveIndex(activeLine.index);
    } else if (currentTime === 0) {
      setActiveIndex(-1);
    }
  }, [currentTime, lineTimings, activeIndex]);

  // Handle auto-scrolling to active line
  useEffect(() => {
    if (activeIndex !== -1 && lineRefs.current[activeIndex] && scrollContainerRef.current) {
      const activeElement = lineRefs.current[activeIndex];
      const container = scrollContainerRef.current;
      
      const elementOffset = activeElement!.offsetTop;
      const elementHeight = activeElement!.offsetHeight;
      const containerHeight = container.offsetHeight;
      const containerScroll = container.scrollTop;

      // Center the active line in the scroll view
      const targetScroll = elementOffset - (containerHeight / 2) + (elementHeight / 2);
      
      container.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    }
  }, [activeIndex]);

  const startPlayback = () => {
    if (!content.audioBuffer) return;
    
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = content.audioBuffer;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
        setIsPlaying(false);
        // Don't reset currentTime here to allow the UI to finish at the end
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };

    const offset = currentTime > 0 && currentTime < content.audioBuffer.duration ? currentTime : 0;
    source.start(0, offset);
    sourceRef.current = source;
    startTimeRef.current = audioContextRef.current.currentTime - offset;
    setIsPlaying(true);

    const updateProgress = () => {
        if (audioContextRef.current && sourceRef.current) {
            const now = audioContextRef.current.currentTime - startTimeRef.current;
            setCurrentTime(now);
            requestRef.current = requestAnimationFrame(updateProgress);
        }
    };
    requestRef.current = requestAnimationFrame(updateProgress);
  };

  const stopPlayback = () => {
    if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current = null;
    }
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      if (currentTime >= (content.audioBuffer?.duration || 0)) {
        setCurrentTime(0);
        setTimeout(startPlayback, 0);
      } else {
        startPlayback();
      }
    }
  };

  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  const progress = content.audioBuffer ? (currentTime / content.audioBuffer.duration) * 100 : 0;

  return (
    <div className="mt-12 bg-[#fffaf0] border-4 border-[#8b5e3c] p-8 rounded-lg shadow-2xl max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className={`w-32 h-32 bg-[#5d4037] rounded-full flex items-center justify-center flex-shrink-0 ${isPlaying ? 'animate-pulse-slow' : ''}`}>
            <svg className={`w-16 h-16 text-[#fdf6e3] ${isPlaying ? 'opacity-100' : 'opacity-60'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828a1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
        </div>
        
        <div className="flex-1 w-full">
          <h4 className="text-2xl font-bold text-[#5d4037] mb-2">{content.event.title} 歷史專題對談</h4>
          <p className="text-[#8b5e3c] mb-6 font-serif">主持人：老張（專家）× 小美（學生）</p>
          
          <div className="bg-[#e6ccb2] h-2 w-full rounded-full overflow-hidden mb-4 cursor-pointer relative" 
               onClick={(e) => {
                 if (!content.audioBuffer) return;
                 const rect = e.currentTarget.getBoundingClientRect();
                 const x = e.clientX - rect.left;
                 const clickedTime = (x / rect.width) * content.audioBuffer.duration;
                 setCurrentTime(clickedTime);
                 if (isPlaying) {
                   stopPlayback();
                   // Wait for state to update
                   setTimeout(() => {
                    const source = audioContextRef.current!.createBufferSource();
                    source.buffer = content.audioBuffer;
                    source.connect(audioContextRef.current!.destination);
                    source.onended = () => { setIsPlaying(false); if (requestRef.current) cancelAnimationFrame(requestRef.current); };
                    source.start(0, clickedTime);
                    sourceRef.current = source;
                    startTimeRef.current = audioContextRef.current!.currentTime - clickedTime;
                    setIsPlaying(true);
                   }, 10);
                 }
               }}>
            <div 
              className="bg-[#5d4037] h-full transition-all duration-100 ease-linear relative" 
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#5d4037] border-2 border-[#fffaf0] rounded-full shadow-md"></div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <button 
              onClick={togglePlay}
              className="bg-[#5d4037] hover:bg-[#3e2723] text-[#fdf6e3] px-8 py-3 rounded-full flex items-center gap-3 transition-colors font-bold shadow-lg"
            >
              {isPlaying ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  暫停播放
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                  {currentTime > 0 && currentTime < (content.audioBuffer?.duration || 0) ? '繼續播放' : '開始聆聽'}
                </>
              )}
            </button>
            <span className="text-[#8b5e3c] font-mono text-sm">
              {Math.floor(currentTime / 60)}:{(Math.max(0, currentTime % 60)).toFixed(0).padStart(2, '0')} / 
              {content.audioBuffer ? ` ${Math.floor(content.audioBuffer.duration / 60)}:${(content.audioBuffer.duration % 60).toFixed(0).padStart(2, '0')}` : ' --:--'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-[#d2b48c] pt-8">
        <h5 className="text-lg font-bold text-[#5d4037] mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          對話實錄 (同步滾動)
        </h5>
        <div 
          ref={scrollContainerRef}
          className="space-y-2 h-72 overflow-y-auto pr-4 custom-scrollbar bg-[#fdf6e3] p-6 rounded-lg border border-[#d2b48c] shadow-inner relative"
        >
          {content.script.map((line, idx) => {
            const isActive = idx === activeIndex;
            return (
              <div 
                key={idx} 
                ref={el => lineRefs.current[idx] = el}
                className={`
                  flex gap-3 p-3 rounded transition-all duration-300 transform
                  ${isActive ? 'bg-[#fff] shadow-md scale-[1.02] border-l-4 border-[#8b5e3c]' : 'opacity-60 grayscale-[0.5]'}
                `}
              >
                <div className="flex-shrink-0 pt-1">
                    {isActive && (
                        <div className="flex gap-0.5 items-end h-4">
                            <div className="w-1 bg-[#8b5e3c] animate-[bounce_0.6s_infinite]"></div>
                            <div className="w-1 bg-[#8b5e3c] animate-[bounce_0.8s_infinite_0.1s]"></div>
                            <div className="w-1 bg-[#8b5e3c] animate-[bounce_0.7s_infinite_0.2s]"></div>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                  <span className={`font-bold min-w-[60px] whitespace-nowrap ${line.speaker === '老張' ? 'text-blue-800' : 'text-emerald-800'}`}>
                    {line.speaker}：
                  </span>
                  <span className={`text-[#5d4037] leading-relaxed transition-colors ${isActive ? 'font-medium' : ''}`}>
                    {line.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PodcastPlayer;
