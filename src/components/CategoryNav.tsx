"use client";

import { useTheme } from "./ThemeContext";
import { CATEGORIES, CATEGORY_DOT_COLORS } from "@/lib/constants";

interface CategoryNavProps {
  currentFilter: string;
  onFilterChange: (category: string) => void;
}

export default function CategoryNav({ currentFilter, onFilterChange }: CategoryNavProps) {
  const { settings } = useTheme();

  // Create a triple loop to ensure smooth infinite scroll even on wide screens
  const marqueeItems = [...CATEGORIES, ...CATEGORIES, ...CATEGORIES];

  return (
    <nav className="w-full z-40 overflow-hidden py-1 bg-transparent transition-all duration-300 relative group select-none">
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); } /* Move 1/3 since we have 3 sets */
        }
        .animate-marquee {
          animation: marquee 45s linear infinite; /* Slower, smoother speed */
          will-change: transform;
        }
        /* Pause on hover to allow easier clicking */
        .group:hover .animate-marquee {
          animation-play-state: paused;
        }
      `}</style>

      {/* Container with mask to fade edges */}
      <div className="relative w-full mask-linear-fade">
        <div className="flex items-center h-[26px] gap-2 animate-marquee w-max px-3">
          {marqueeItems.map((cat, index) => {
            // Use index + key to ensure absolute uniqueness for React rendering
            const uniqueKey = `${cat.key}-${index}`;
            const isActive = currentFilter === cat.key;
            const dotColor = CATEGORY_DOT_COLORS[cat.key] || "bg-gray-400";

            return (
              <button
                key={uniqueKey}
                onClick={() => onFilterChange(cat.key)}
                className={`
                  relative h-full flex items-center gap-1.5 text-[13px] font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 px-2.5 rounded-full
                  ${isActive
                    ? "bg-white dark:bg-card text-gray-900 dark:text-gray-200 shadow-sm dark:shadow-none dark:border dark:border-white/5 scale-105"
                    : "text-gray-500 dark:text-sub hover:text-gray-700 dark:hover:text-main hover:bg-black/5 dark:hover:bg-white/5 active:scale-95"
                  }
                `}
              >
                {/* Dot Indicator */}
                {cat.key !== 'all' && (
                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                )}

                {/* Label */}
                <span>
                  {settings.lang === "sc"
                    ? cat.label
                    : (cat.label === "时政" ? "時政"
                      : cat.label === "军事" ? "軍事"
                      : cat.label === "经济" ? "經濟"
                        : cat.label === "社会" ? "社會"
                          : cat.label === "娱乐" ? "娛樂"
                            : cat.label === "体育" ? "體育"
                              : cat.label)
                  }
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}