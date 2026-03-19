import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const Terms = () => {
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
            <FileText className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg tracking-tight">GoNepal Terms</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container px-4 py-12 md:py-20 mx-auto max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
            Terms of Service
          </h1>
          <p className="text-xl text-muted-foreground">
            Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section className="bg-muted/30 border border-border/50 rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using GoNepal (the "Service"), you agree to be bound by these Terms of Service. 
              If you disagree with any part of these terms, you may not use our services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border/50 pb-2">2. Use of the Service</h2>
            <p className="text-muted-foreground">
              GoNepal provides tourism resources, AI-assisted trip planning, identity verification tools, and navigation aides for travelers in Nepal. 
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Beta Testing Notice:</strong> GoNepal is currently in a testing/demonstration phase. You agree <strong>NOT</strong> to provide real passport numbers, accurate citizenship documents, or real sensitive Personal Identifiable Information (PII) into our systems.</li>
              <li>You are strictly prohibited from using the platform for any illegal activities or violations of Nepali law.</li>
              <li>You agree not to attempt to breach the security or authentication layers of the Service.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border/50 pb-2">3. Disclaimers of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>AI Services:</strong> Our AI Trip Planner generates suggestions based on artificial intelligence. While we strive for accuracy, we cannot guarantee that all travel suggestions are currently open, structurally safe, or legally accessible. Always verify trekking routes locally.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Currency & Weather:</strong> Exchange rates and weather forecasts, particularly those cached in the Trekker's Offline Toolkit, are provided for convenience and are subject to change. GoNepal is not liable for financial loss or travel delays resulting from reliance on this data. 
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border/50 pb-2">4. Real-World Risk Assessment</h2>
            <p className="text-muted-foreground leading-relaxed">
              Trekking and tourism in Nepal involve inherent geographical and altitude-related risks. While GoNepal provides emergency offline phrases and an SOS interface, our application does not replace satellite communication devices or professional local guides. You assume all risks associated with your physical travel.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border/50 pb-2">5. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed and construed in accordance with the laws of the Federal Democratic Republic of Nepal, without regard to its conflict of law provisions. Additionally, we respect international standards such as GDPR for our international users where applicable.
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

export default Terms;
