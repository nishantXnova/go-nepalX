import { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-everest.jpg";

const PlanMyDay = lazy(() => import("./PlanMyDay"));

const Hero = () => {
  const navigate = useNavigate();
  const [showPlanMyDay, setShowPlanMyDay] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {showPlanMyDay && (
        <Suspense fallback={null}>
          <PlanMyDay isOpen={showPlanMyDay} onClose={() => setShowPlanMyDay(false)} />
        </Suspense>
      )}

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
        {/* Background Image with optimized transition */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Mount Everest"
            className="w-full h-full object-cover opacity-70"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
        </div>

        {/* Content */}
        <div className="relative z-10 container-wide px-4 pt-20">
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-8"
            >
              <span className="px-4 py-1.5 rounded-full border border-white/20 bg-white/20 text-[10px] md:text-xs font-medium uppercase tracking-[0.3em] text-white">
                Beyond the Peaks
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-5xl md:text-8xl lg:text-9xl font-bold text-white mb-8 tracking-tight leading-[0.9] font-sans"
            >
              Nepal. <br />
              <span className="text-white">Soul of the Himalayas.</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-lg md:text-xl text-white/50 mb-12 max-w-2xl font-light leading-relaxed"
            >
              Experience the majestic Himalayas and ancient wonders through a modern lens.
              Your journey begins at the roof of the world.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center gap-6"
            >
              <Button
                size="lg"
                className="bg-[#FB923C] text-white hover:bg-[#E86C35] rounded-full px-10 py-7 text-lg font-medium transition-transform duration-200 hover:scale-105 active:scale-95 shadow-2xl"
                onClick={() => navigate('/experiences')}
              >
                Plan My Trek →
              </Button>

              <Button
                size="lg"
                className="bg-white text-black hover:bg-white/90 rounded-full px-10 py-7 text-lg font-medium transition-transform duration-200 hover:scale-105 active:scale-95 shadow-2xl"
                onClick={() => scrollToSection("destinations")}
              >
                Start Exploring
              </Button>

              <button
                onClick={() => scrollToSection("flights")}
                className="group flex items-center gap-2 text-white text-lg font-medium hover:text-white/80 transition-colors"
              >
                Book Flights
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>

            {/* Premium AI Trigger */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-20"
            >
              <button
                onClick={() => setShowPlanMyDay(true)}
                className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-colors duration-200 group"
              >
                <Sparkles className="w-5 h-5 text-nepal-gold transition-transform group-hover:rotate-12" />
                <span className="text-white/80 font-medium">✨ Design your perfect day with AI</span>
              </button>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;

