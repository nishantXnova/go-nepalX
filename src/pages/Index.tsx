import { lazy, Suspense } from "react";
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
import { Loader2 } from "lucide-react";

// Lazy load heavy components
const AIChatbot = lazy(() => import("@/components/AIChatbot"));

// Skeleton for chatbot loading
const ChatbotSkeleton = () => (
  <div className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary/10 animate-pulse" />
);

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
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
