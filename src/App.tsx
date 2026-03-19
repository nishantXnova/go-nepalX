import { lazy, Suspense, useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AutoTranslator from "./components/AutoTranslator";
import WeatherForecast from "./components/WeatherForecast";
import TestAuth from "./components/TestAuth";
import { WeatherProvider } from "./contexts/WeatherContext";
import PageTransition from "./components/PageTransition";
import OfflineIndicator from "./components/OfflineIndicator";
import FloatingSOS from "./components/FloatingSOS";
import OnboardingModal from "./components/OnboardingModal";
import { Loader2 } from "lucide-react";

// Lazy load all pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const DestinationDetail = lazy(() => import("./pages/DestinationDetail"));
const Auth = lazy(() => import("./pages/Auth"));
const SignupSuccess = lazy(() => import("./pages/SignupSuccess"));
const Profile = lazy(() => import("./pages/Profile"));
const SavedPlaces = lazy(() => import("./pages/SavedPlaces"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const DigitalTouristID = lazy(() => import("./pages/DigitalTouristID"));
const Trails = lazy(() => import("./pages/Trails"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const SharedItinerary = lazy(() => import("./pages/SharedItinerary"));
import GuideSignup from "./pages/GuideSignup";
import Admin from "./pages/Admin";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Loading component for suspense
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Inner component so useLocation works inside BrowserRouter
const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <PageTransition>
      <Suspense fallback={<PageLoader />}>
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/success" element={<SignupSuccess />} />
          <Route path="/destination/:id" element={<DestinationDetail />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved-places"
            element={
              <ProtectedRoute>
                <SavedPlaces />
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="/test-auth" element={<TestAuth />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/tourist-id" element={<DigitalTouristID />} />
          <Route path="/trails" element={<Trails />} />
          <Route path="/guide-signup" element={<GuideSignup />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/itinerary/:id" element={<SharedItinerary />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </PageTransition>
  );
};

import PerformanceMonitor from "./components/PerformanceMonitor";

// Lazy load PerformanceMonitor - only load after initial page render
const LazyPerformanceMonitor = () => {
  const [Monitor, setMonitor] = useState<typeof PerformanceMonitor | null>(null);

  useEffect(() => {
    // Delay loading PerformanceMonitor by 2 seconds to prioritize initial render
    const timer = setTimeout(() => {
      import('./components/PerformanceMonitor').then((mod) => {
        setMonitor(() => mod.default);
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!Monitor) return null;
  return <Monitor />;
};

const App = () => (
  <OfflineIndicator>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <AutoTranslator />
          <LazyPerformanceMonitor />
          <WeatherProvider>
            <WeatherForecast />
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AnimatedRoutes />
                <FloatingSOS />
                <OnboardingModal />
              </BrowserRouter>
            </TooltipProvider>
          </WeatherProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  </OfflineIndicator>
);

export default App;
