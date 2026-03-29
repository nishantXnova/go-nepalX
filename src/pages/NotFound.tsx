import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { logger } from "@/utils/logger";
import { Home, ArrowLeft, Mountain, MapPin } from "lucide-react";

// Lazy-loaded image component with skeleton placeholder
const LazyImage = ({ src, alt, className, priority = false }: { src: string; alt: string; className?: string; priority?: boolean }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
      {!error ? (
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ display: 'block' }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
          <Mountain className="w-12 h-12 text-slate-400" />
        </div>
      )}
      {!loaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/30 to-transparent bg-[length:200%_100%]" />
      )}
    </div>
  );
};

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    logger.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const suggestedDestinations = [
    { name: "Kathmandu Valley", image: "/kathmandu404.jpg", href: "/destinations/kathmandu" },
    { name: "Pokhara", image: "/pokhara404.jpg", href: "/destinations/pokhara" },
    { name: "Chitwan", image: "/chitwan404.jpg", href: "/destinations/chitwan" },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden">
      {/* Topographic background pattern - CSS only for performance */}
      <div className="absolute inset-0 opacity-[0.03] bg-[repeating-linear-gradient(90deg,transparent,transparent_24px,currentColor_24px,currentColor_25px),repeating-linear-gradient(180deg,transparent,transparent_24px,currentColor_24px,currentColor_25px)]" />

      {/* Mountain gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/40 via-background to-accent/5"></div>
      
      <div className="relative z-10 text-center max-w-2xl mx-auto px-4 py-8">
        {/* Header with Logo - left aligned */}
        <header className="mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <img 
              src="/gonepallogo.png" 
              alt="GoNepal" 
              className="h-14 transition-transform group-hover:scale-105"
            />
            <span className="text-2xl font-bold text-primary tracking-tight">GoNepal</span>
          </Link>
        </header>

        {/* Image card with no background */}
        <div className="relative inline-block mb-10">
          {/* Mountain gradient behind image */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[130%] h-32 bg-gradient-to-t from-primary/15 to-transparent rounded-full blur-2xl"></div>
          
          <div className="relative inline-block bg-[#f5f0e8]/90 rounded-3xl p-5 pb-6 backdrop-blur-sm">
            <LazyImage 
              src="/404pic.png" 
              alt="Lost traveler exploring Nepal" 
              className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 object-cover object-center rounded-2xl shadow-2xl"
              priority={true}
            />
          </div>
        </div>
        
        {/* 404 with brand styling - improved hierarchy */}
        <div className="space-y-4 mb-10">
          <h1 className="text-8xl sm:text-9xl md:text-[10rem] font-bold tracking-tighter text-primary leading-none">
            404
          </h1>
          <p className="text-2xl sm:text-3xl font-semibold text-foreground">
            Looks like this trail doesn&apos;t exist
          </p>
          <p className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
            Even the best trekkers take wrong turns. Let&apos;s get you back on route.
          </p>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link 
            to="/" 
            className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Link>
          <button 
            onClick={() => window.history.back()} 
            className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-primary/30 bg-background/80 text-foreground rounded-xl font-medium hover:bg-secondary hover:border-primary/50 transition-all duration-300 backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            Retrace Steps
          </button>
        </div>

        {/* Suggested destinations with photos */}
        <div className="pt-4">
          <p className="text-sm font-semibold text-foreground/80 mb-6 flex items-center justify-center gap-2">
            <Mountain className="w-4 h-4" />
            Popular destinations to explore
          </p>
          <div className="flex flex-wrap justify-center gap-5">
            {suggestedDestinations.map((dest, index) => (
              <Link
                key={dest.name}
                to={dest.href}
                className="group relative overflow-hidden rounded-xl w-36 sm:w-40 h-36 sm:h-40 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 border border-border/50 hover:border-primary/30"
              >
              <LazyImage
                  key={dest.name}
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                {/* Subtle inner shadow at top */}
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 to-transparent"></div>
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-sm font-semibold text-white text-center truncate drop-shadow-lg">{dest.name}</p>
                </div>
                {/* Location pin icon */}
                <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
