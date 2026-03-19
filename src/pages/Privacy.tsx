import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container px-4 h-16 flex items-center justify-between mx-auto max-w-5xl">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg tracking-tight">GoNepal Privacy</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container px-4 py-12 md:py-20 mx-auto max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
            Privacy Policy
          </h1>
          <p className="text-xl text-muted-foreground">
            Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section className="bg-muted/30 border border-border/50 rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to GoNepal. We respect your privacy and are deeply committed to protecting your personal data. 
              Please note that <strong>GoNepal is currently in an active testing and demonstration phase.</strong> This privacy policy explains how we collect, use, and safeguard your information when you use our web application, with special provisions regarding simulated data for testing purposes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border/50 pb-2">2. Information We Collect</h2>
            <p className="text-muted-foreground">We collect the following types of information directly from you:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Authentication Data:</strong> Email addresses and passwords (securely hashed) when creating an account.</li>
              <li><strong className="text-foreground">Simulated KYC Data (Digital Tourist ID):</strong> As GoNepal is a prototype, <strong>please DO NOT enter real passport numbers or sensitive identity documents.</strong> Any identity data entered is for testing and demonstration purposes only and is stored temporarily.</li>
              <li><strong className="text-foreground">Location & GPS Data:</strong> We request explicit consent to access your device's location to provide accurate weather forecasts, nearby attractions, and emergency SOS services.</li>
              <li><strong className="text-foreground">User-Generated Content:</strong> Bookmarked locations, AI Trip Planner itineraries, and personal preferences to enhance your experience.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border/50 pb-2">3. How We Use Your Data</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>To provide and manage our services, including offline caching of essential trip details.</li>
              <li>To demonstrate the flow of identity verification for international tourists (simulated KYC).</li>
              <li>To offer emergency assistance services based on your location and provided emergency contacts.</li>
              <li>To personalize AI-generated travel itineraries and localized recommendations.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border/50 pb-2">4. Data Storage and Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures, including SSL encryption and secure database architecture (Supabase), to protect your data. 
              Certain high-priority information required for the <strong>Trekker's Offline Toolkit</strong> is securely cached in your local browser storage to ensure availability during remote Himalayan treks without internet access.
            </p>
          </section>

          <section className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8 space-y-4">
            <h2 className="text-2xl font-bold text-foreground">5. GDPR & International User Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you are visiting from the European Economic Area (EEA), you possess specific rights under the General Data Protection Regulation (GDPR):
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Right to Access:</strong> You can request copies of your personal data.</li>
              <li><strong>Right to Rectification:</strong> You may request correction of inaccurate data.</li>
              <li><strong>Right to Erasure (Right to be Forgotten):</strong> You may request complete deletion of your account and associated KYC documents.</li>
              <li><strong>Right to Data Portability:</strong> You may request your data in a structured, machine-readable format.</li>
            </ul>
            <p className="text-muted-foreground mt-4 text-sm bg-background p-4 rounded-xl border border-border">
              To exercise any of these rights, please contact our Data Protection Officer at privacy@gonepal.app.
            </p>
          </section>
        </div>

        <div className="mt-16 flex justify-center">
          <Link to="/">
            <Button variant="outline" size="lg" className="rounded-full shadow-sm">
              Return to GoNepal
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
