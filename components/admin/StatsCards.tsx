"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface StatsProps {
  stats: {
    totalMovies: number;
    recentImports: number;
    totalSubtitles: number;
    storageUsed: string;
  };
}

export default function StatsCards({ stats }: StatsProps) {
  const cards = [
    {
      label: "Total Movies",
      value: stats.totalMovies.toLocaleString(),
      icon: <FilmIcon />,
      trend: "+12% this month",
      colSpan: "col-span-1 lg:col-span-2",
      glowColor: "bg-primary/20",
    },
    {
      label: "Recent Imports",
      value: stats.recentImports.toLocaleString(),
      icon: <DownloadCloudIcon />,
      trend: "Last 7 days",
      colSpan: "col-span-1",
      glowColor: "bg-blue-500/10",
    },
    {
      label: "Total Subtitles",
      value: stats.totalSubtitles.toLocaleString(),
      icon: <LanguagesIcon />,
      trend: "Across all movies",
      colSpan: "col-span-1",
      glowColor: "bg-purple-500/10",
    },
    {
      label: "Storage Used",
      value: stats.storageUsed,
      icon: <HardDriveIcon />,
      trend: "Supabase Storage",
      colSpan: "col-span-1 lg:col-span-4",
      glowColor: "bg-primary/5",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
    >
      {cards.map((card, idx) => (
        <motion.div
          key={idx}
          variants={item}
          className={cn(
            "relative overflow-hidden p-6 rounded-[2rem]",
            "bg-surface/30 backdrop-blur-3xl border border-vborder/40",
            "hover:bg-surface/50 transition-all duration-500 group",
            card.colSpan
          )}
        >
          {/* Glowing Orb Background */}
          <div className={cn("absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700", card.glowColor)} />
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-start justify-between mb-8">
              <div className="p-3.5 bg-surface-light rounded-2xl text-vtext-muted group-hover:text-primary border border-vborder/30 group-hover:border-primary/30 transition-all duration-300">
                {card.icon}
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-vtext-muted bg-surface/50 px-3 py-1 rounded-full border border-vborder/30">
                {card.trend}
              </span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-vtext-muted text-sm font-medium tracking-wide uppercase">
                {card.label}
              </h3>
              <div className="text-4xl md:text-5xl font-display font-bold text-vtext tracking-tight group-hover:text-white transition-colors duration-300">
                {card.value}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function FilmIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M7 3v18" />
      <path d="M3 7.5h4" />
      <path d="M3 12h18" />
      <path d="M3 16.5h4" />
      <path d="M17 3v18" />
      <path d="M17 7.5h4" />
      <path d="M17 16.5h4" />
    </svg>
  );
}

function DownloadCloudIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M12 12v9" />
      <path d="m8 17 4 4 4-4" />
    </svg>
  );
}

function LanguagesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 8 6 6" />
      <path d="m4 14 6-6 2-3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="m22 22-5-10-5 10" />
      <path d="M14 18h6" />
    </svg>
  );
}

function HardDriveIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" x2="2" y1="12" y2="12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      <line x1="6" x2="6.01" y1="16" y2="16" />
      <line x1="10" x2="10.01" y1="16" y2="16" />
    </svg>
  );
}
