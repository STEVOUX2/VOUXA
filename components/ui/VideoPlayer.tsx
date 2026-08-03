'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Subtitle {
  language: string;
  url: string;
}

interface VideoPlayerProps {
  tmdbId: number;
  title: string;
  subtitles?: Subtitle[];
}

export function VideoPlayer({ tmdbId, title, subtitles = [] }: VideoPlayerProps) {
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);
  const [syncOffset, setSyncOffset] = useState(0);

  const embedUrl = `https://streamvaultsrc.click/embed/movie/${tmdbId}`;

  // Toggle body overflow when in theater mode
  useEffect(() => {
    if (isTheaterMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isTheaterMode]);

  return (
    <>
      {/* Theater Mode Overlay */}
      {isTheaterMode && (
        <div className="fixed inset-0 bg-black/95 z-40 transition-opacity duration-500" />
      )}

      <div className={`relative w-full max-w-6xl mx-auto transition-all duration-500 ${
        isTheaterMode ? 'fixed inset-4 z-50 flex flex-col items-center justify-center max-w-none' : 'mt-8 mb-12'
      }`}>
        {/* Controls Bar */}
        <div className={`flex items-center justify-between mb-4 w-full ${isTheaterMode ? 'max-w-6xl' : ''}`}>
          <h2 className="font-display text-xl text-white font-semibold truncate max-w-[60%]">
            Watching: <span className="text-primary">{title}</span>
          </h2>
          
          <div className="flex items-center gap-4">
            {subtitles.length > 0 && (
              <div className="flex items-center gap-2">
                <select 
                  className="bg-surface border border-white/10 text-white text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-primary/50"
                  value={selectedSubtitle || ''}
                  onChange={(e) => setSelectedSubtitle(e.target.value)}
                >
                  <option value="">No Subtitles</option>
                  {subtitles.map(sub => (
                    <option key={sub.language} value={sub.language}>{sub.language}</option>
                  ))}
                </select>
                
                {selectedSubtitle && (
                  <div className="flex items-center bg-surface border border-white/10 rounded-md overflow-hidden text-sm h-8">
                    <button 
                      onClick={() => setSyncOffset(prev => prev - 0.5)}
                      className="px-2 h-full hover:bg-surface-light hover:text-primary transition-colors text-white border-r border-white/10"
                      title="Delay subtitles (-0.5s)"
                    >
                      -
                    </button>
                    <span className="px-3 text-xs text-white/80 font-mono w-16 text-center">
                      {syncOffset > 0 ? '+' : ''}{syncOffset}s
                    </span>
                    <button 
                      onClick={() => setSyncOffset(prev => prev + 0.5)}
                      className="px-2 h-full hover:bg-surface-light hover:text-primary transition-colors text-white border-l border-white/10"
                      title="Advance subtitles (+0.5s)"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={() => setIsTheaterMode(!isTheaterMode)}
              className="flex items-center gap-2 bg-surface hover:bg-surface-light border border-white/10 text-white px-4 py-1.5 rounded-md transition-colors text-sm font-medium"
            >
              {isTheaterMode ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                  Exit Theater
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                  Theater Mode
                </>
              )}
            </button>
          </div>
        </div>

        {/* Player Container */}
        <div className={`relative w-full aspect-video rounded-xl overflow-hidden shadow-[0_0_40px_rgba(231,200,138,0.1)] ring-1 ring-primary/20 bg-black ${isTheaterMode ? 'max-w-7xl' : ''}`}>
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            className="w-full h-full border-0"
            title={`Watch ${title}`}
          />
            {/* VTT Subtitle Overlay mock implementation */}
            {selectedSubtitle && (
              <div className="absolute bottom-16 left-0 right-0 text-center pointer-events-none z-10">
                <span className="bg-black/60 text-white px-4 py-1 rounded text-lg lg:text-2xl font-medium drop-shadow-md">
                  [Subtitle track selected: {selectedSubtitle}]
                </span>
              </div>
            )}
        </div>
      </div>
    </>
  );
}
