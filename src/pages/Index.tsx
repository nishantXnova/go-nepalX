import { lazy, Suspense, useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import StatsBar from "@/components/StatsBar";
import Categories from "@/components/Categories";
import Destinations from "@/components/Destinations";
import SeasonalHighlights from "@/components/SeasonalHighlights";
import FlightBooking from "@/components/FlightBooking";
import PlanTrip from "@/components/PlanTrip";
import Partners from "@/components/Partners";
import TravelInfo from "@/components/TravelInfo";
import CurrencyConverter from "@/components/CurrencyConverter";
import LanguageTranslator from "@/components/LanguageTranslator";
import Footer from "@/components/Footer";
import NearbyPlaces from "@/components/NearbyPlaces";
import { Loader2, X } from "lucide-react";

// Lazy load heavy components
const AIChatbot = lazy(() => import("@/components/AIChatbot"));

// Skeleton for chatbot loading
const ChatbotSkeleton = () => (
  <div className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary/10 animate-pulse" />
);

const Index = () => {
  const [showBetaBanner, setShowBetaBanner] = useState(true);

  return (
    <div className="min-h-screen">
      <Navbar />
      {showBetaBanner && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">GoNepal is currently in beta.</span>{" "}
            Some features including hotel check-in verification are simulations for demonstration purposes only.{" "}
            <span className="font-medium">Do not enter real passport or sensitive personal data.</span>
            <button 
              onClick={() => setShowBetaBanner(false)} 
              className="ml-3 inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-amber-200 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-3 h-3" />
            </button>
          </p>
        </div>
      )}
      <Hero />
      <Hero />
      <StatsBar />
      <div className="section-divider" />
      <Categories />
      <Destinations />
      <SeasonalHighlights />
      <div className="section-divider" />
      <FlightBooking />
      <CurrencyConverter />
      <LanguageTranslator />
      <PlanTrip />
      <div className="section-divider" />
      <Partners />
      <TravelInfo />
      <NearbyPlaces />
      <Footer />
      <Suspense fallback={<ChatbotSkeleton />}>
        <AIChatbot />
      </Suspense>
    </div>
  );
};

export default Index;
