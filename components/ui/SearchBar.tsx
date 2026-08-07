'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface SearchResult {
  id: string;
  title: string;
  poster_path: string | null;
  release_date: string;
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsSearching(true);
      try {
        const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        if (!TMDB_API_KEY) throw new Error('Missing API key');

        const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1&include_adult=false`);
        if (!res.ok) throw new Error('Search failed');
        
        const data = await res.json();
        // Take top 5 results
        setResults(data.results.slice(0, 5));
        setIsOpen(data.results.length > 0);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        router.push(`/movie/${results[selectedIndex].id}`);
        setIsOpen(false);
        setQuery('');
      } else if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query)}`);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative flex items-center w-full group">
        <div className="absolute left-4 text-text-muted group-focus-within:text-primary transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Search movies..."
          className="w-full bg-surface-light border border-white/10 rounded-full py-2.5 pl-12 pr-10 text-sm text-text focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-text-muted"
        />
        {isSearching && (
          <div className="absolute right-4">
            <div className="w-4 h-4 rounded-full border-2 border-primary-dim border-t-primary animate-spin"></div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-3 left-0 right-0 bg-[#14181F] border border-primary/20 rounded-xl overflow-hidden shadow-2xl z-50 max-h-[400px] overflow-y-auto"
          >
            {results.map((result, index) => (
              <Link 
                key={result.id} 
                href={`/movie/${result.id}`}
                onClick={() => {
                  setIsOpen(false);
                  setQuery('');
                }}
                className={`flex items-center gap-4 p-3 transition-colors ${
                  index === selectedIndex ? 'bg-primary/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="relative w-12 h-16 bg-black rounded overflow-hidden shrink-0 ring-1 ring-white/10">
                  {result.poster_path ? (
                    <Image 
                      src={`https://image.tmdb.org/t/p/w92${result.poster_path}`} 
                      alt={result.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-white/40">No Img</div>
                  )}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium text-white truncate">{result.title}</span>
                  <span className="text-xs text-white/50 mt-1">
                    {result.release_date ? new Date(result.release_date).getFullYear() : 'Unknown Year'}
                  </span>
                </div>
              </Link>
            ))}
            <div 
              className="p-3 text-center border-t border-primary/20 bg-primary/5 text-xs text-primary font-bold cursor-pointer hover:bg-primary/10 transition-colors uppercase tracking-wider"
              onClick={() => {
                router.push(`/search?q=${encodeURIComponent(query)}`);
                setIsOpen(false);
              }}
            >
              View all results for "{query}"
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
