import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { translateText } from '@/lib/translationService';

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

const stats: Stat[] = [
  { value: 8849, suffix: 'm', label: "World's Highest Peak" },
  { value: 3500, suffix: '+', label: 'Trekking Trails' },
  { value: 10, suffix: '', label: 'UNESCO Heritage Sites' },
  { value: 1400, suffix: '+', label: 'Bird Species' },
];

const StatsBar: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [counts, setCounts] = useState<number[]>(stats.map(s => s.value));
  const [translatedLabels, setTranslatedLabels] = useState<string[]>(stats.map(s => s.label));
  const [animationStarted, setAnimationStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || animationStarted) return;

    setAnimationStarted(true);

    const duration = 2000;
    const frameRate = 60;
    const totalFrames = (duration / 1000) * frameRate;

    const counters = stats.map((stat) => {
      return {
        target: stat.value,
        increment: stat.value / totalFrames,
        current: 0,
      };
    });

    const animate = () => {
      setCounts((prevCounts) => {
        const newCounts = [...prevCounts];
        counters.forEach((counter, index) => {
          if (counter.current < counter.target) {
            counter.current += counter.increment;
            newCounts[index] = Math.min(
              Math.round(counter.current),
              counters[index].target
            );
          }
        });
        return newCounts;
      });
    };

    const interval = setInterval(animate, 1000 / frameRate);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setCounts(stats.map((stat) => stat.value));
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isVisible, animationStarted]);

  // Translate labels when language changes
  useEffect(() => {
    const updateTranslations = async () => {
      if (currentLanguage.code === 'en') {
        setTranslatedLabels(stats.map(s => s.label));
        return;
      }

      // Translate each label
      const translated = await Promise.all(
        stats.map(async (stat) => {
          try {
            const result = await translateText(stat.label, 'en', currentLanguage.code);
            return result || stat.label;
          } catch (e) {
            console.error('Translation error:', e);
            return stat.label;
          }
        })
      );
      setTranslatedLabels(translated);
    };

    updateTranslations();
  }, [currentLanguage]);

  const formatNumber = (num: number, suffix: string): string => {
    const formatted = num.toLocaleString();
    return `${formatted}${suffix}`;
  };

  return (
    <div className="relative">
      {/* Smooth transition gradient from Hero (black) to StatsBar (cream) */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black to-[#F5F0E8] pointer-events-none" style={{ marginTop: '-1px' }} />

      <div
        ref={ref}
        className="w-full py-16 md:py-20 px-4 relative z-10"
        style={{ backgroundColor: '#F5F0E8' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-0">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`flex flex-col items-center transition-all duration-700 ease-out relative w-full md:w-auto ${isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
                  }`}
                style={{
                  transitionDelay: isVisible ? `${index * 150}ms` : '0ms',
                }}
              >
                {/* Container with padding for divider */}
                <div className="px-4 md:px-8 lg:px-10 w-full">
                  {/* Number */}
                  <span
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif tracking-tight block text-center"
                    style={{ color: '#C2692A' }}
                  >
                    {formatNumber(counts[index], stat.suffix)}
                  </span>

                  {/* Label */}
                  <span
                    className="mt-2 text-xs sm:text-sm md:text-base font-medium tracking-wide uppercase whitespace-nowrap block text-center"
                    style={{ color: '#1C2B3A' }}
                  >
                    {translatedLabels[index]}
                  </span>
                </div>

                {/* Vertical Divider (hidden on last item and on mobile) */}
                {index < stats.length - 1 && (
                  <div
                    className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 h-10 md:h-12 w-px"
                    style={{
                      backgroundColor: '#1C2B3A',
                      opacity: 0.15,
                    }}
                  />
                )}

                {/* Horizontal Divider (visible only on mobile between items) */}
                {index < stats.length - 1 && (
                  <div
                    className="md:hidden w-16 h-px my-6"
                    style={{
                      backgroundColor: '#1C2B3A',
                      opacity: 0.15,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsBar;
