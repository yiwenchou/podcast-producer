
import React, { useState } from 'react';
import Header from './components/Header';
import EventCard from './components/EventCard';
import PodcastPlayer from './components/PodcastPlayer';
import { HISTORICAL_EVENTS } from './constants';
import { AppState, HistoricalEvent, PodcastContent } from './types';
import { generateScript, generatePodcastAudio } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [content, setContent] = useState<PodcastContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectEvent = async (event: HistoricalEvent) => {
    try {
      setState(AppState.GENERATING_SCRIPT);
      setError(null);

      // 1. Generate the script
      const script = await generateScript(event);

      setState(AppState.GENERATING_AUDIO);

      // 2. Generate the audio
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const audioBuffer = await generatePodcastAudio(script, audioContext);

      setContent({
        event,
        script,
        audioBuffer
      });

      setState(AppState.PLAYING);
    } catch (err: unknown) {
      console.error(err);
      let errorMessage = '請稍後再試。';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError('生成 Podcast 時發生錯誤：' + errorMessage);
      setState(AppState.ERROR);
    }
  };

  const getLoadingMessage = () => {
    switch (state) {
      case AppState.GENERATING_SCRIPT:
        return '正在編寫歷史對談腳本，考究歷史文獻中...';
      case AppState.GENERATING_AUDIO:
        return '正在模擬主持人聲音，錄製廣播節目中...';
      default:
        return '請稍候...';
    }
  };

  return (
    <div className="min-h-screen pb-20 px-4 md:px-8 max-w-7xl mx-auto">
      <Header />

      <main>
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-[#5d4037] mb-4">選擇一段歷史</h2>
          <p className="text-[#8b5e3c]">點選下方事件，AI 將立即為你生成雙人對談 Podcast 教材</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {HISTORICAL_EVENTS.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onSelect={handleSelectEvent}
              disabled={state !== AppState.IDLE && state !== AppState.PLAYING && state !== AppState.ERROR}
            />
          ))}
        </div>

        {/* Loading Overlay */}
        {(state === AppState.GENERATING_SCRIPT || state === AppState.GENERATING_AUDIO) && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#fdf6e3] p-10 rounded-lg border-4 border-[#8b5e3c] max-w-md w-full text-center shadow-2xl">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 border-4 border-[#8b5e3c] border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-xl font-bold text-[#5d4037] mb-2">{getLoadingMessage()}</h3>
              <p className="text-sm text-[#8b5e3c]">這可能需要約 30-60 秒，請喝杯茶稍作等待</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {state === AppState.ERROR && error && (
          <div className="mt-12 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <p className="font-bold">{error}</p>
              <button
                onClick={() => setState(AppState.IDLE)}
                className="ml-auto underline font-bold"
              >
                重試
              </button>
            </div>
          </div>
        )}

        {/* Player Section */}
        {state === AppState.PLAYING && content && (
          <div id="player-section" className="animate-fade-in">
            <PodcastPlayer content={content} />
          </div>
        )}
      </main>

      <footer className="mt-20 text-center text-[#8b5e3c] text-sm italic">
        <p>© 2024 時光留聲機 - 基於 Gemini API 驅動的高中歷史學習輔助工具</p>
      </footer>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .8; transform: scale(1.05); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #fdf6e3;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d2b48c;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #8b5e3c;
        }
      `}</style>
    </div>
  );
};

export default App;
