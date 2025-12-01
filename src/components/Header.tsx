"use client";

import { useTheme } from "./ThemeContext";
import { Settings, Info, Heart } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface HeaderProps {
  onOpenFav: () => void;
  onOpenAbout: () => void;
  onOpenSettings: () => void;
  onRefresh?: () => void;
  favCount: number;
  children?: React.ReactNode;
}

export default function Header({
  onOpenFav,
  onOpenAbout,
  onOpenSettings,
  onRefresh,
  favCount,
  children
}: HeaderProps) {
  const { settings } = useTheme();
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    // Check if we should show the badge
    const today = new Date().toDateString();
    const lastClicked = localStorage.getItem("about_badge_date");
    if (lastClicked !== today) {
      setShowBadge(true);
    }
  }, []);

  const handleAboutClick = () => {
    // Save today's date to hide badge until tomorrow
    const today = new Date().toDateString();
    localStorage.setItem("about_badge_date", today);
    setShowBadge(false);
    onOpenAbout();
  };

  const fontStyleObj = {
    fontFamily: settings.fontStyle === "serif"
      ? "var(--font-noto-serif-tc), var(--font-noto-serif-sc), serif"
      : "var(--font-noto-sans-tc), var(--font-noto-sans-sc), sans-serif",
  };

  return (
    <header className="w-full bg-white dark:bg-[#121212] z-50 shadow-sm">
      <div className="max-w-[600px] mx-auto px-4 pt-3 pb-2">
        {/* Top Row: Logo & Icons */}
        <div className="flex items-center justify-between mb-3">
          {/* Logo & Titles - Click to Refresh */}
          <button
            onClick={onRefresh}
            className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity active:scale-95 duration-200"
            title={settings.lang === "sc" ? "点击刷新" : "點擊刷新"}
          >
            <div className="relative w-10 h-10 rounded-lg overflow-hidden shadow-md">
              <Image
                src="/logo.png"
                alt="Logo"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col justify-center" style={{ width: 'fit-content' }}>
              <h1
                style={{
                  ...fontStyleObj,
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
                className="text-lg font-bold tracking-wide text-[var(--text-main)] leading-tight"
              >
                {settings.lang === "sc" ? "从日本看中国" : "從日本看中國"}
              </h1>
              <span
                className="text-gray-400 font-medium uppercase select-none block"
                style={{
                  fontSize: '7.5px',
                  lineHeight: '1.2',
                  textShadow: '0 0.5px 1px rgba(0,0,0,0.08)',
                  letterSpacing: '0.42em',
                  width: '100%',
                  textAlign: 'left'
                }}
              >
                China News From Japan
              </span>
            </div>
          </button>

          {/* Right Icons */}
          <div className="flex items-center gap-1">
            {/* Favorites */}
            <button
              onClick={onOpenFav}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-90 duration-200 relative group"
              title={settings.lang === "sc" ? "收藏" : "收藏"}
              style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}
            >
              <Heart className="w-5 h-5 text-[var(--text-main)]" />
              {favCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#121212]" />
              )}
            </button>

            {/* About */}
            <button
              onClick={handleAboutClick}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-90 duration-200 relative"
              title={settings.lang === "sc" ? "关于本站" : "關於本站"}
              style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}
            >
              <Info className="w-5 h-5 text-[var(--text-main)]" />
              {/* Exclamation badge for new users */}
              {showBadge && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 pointer-events-none">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500 text-[8px] text-white justify-center items-center font-bold">!</span>
                </span>
              )}
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-90 duration-200"
              title={settings.lang === "sc" ? "设置" : "設置"}
              style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}
            >
              <Settings className="w-5 h-5 text-[var(--text-main)]" />
            </button>
          </div>
        </div>

        {/* Utility Bar (Search & Archive) - Passed as children */}
        {children}
      </div>
    </header>
  );
}