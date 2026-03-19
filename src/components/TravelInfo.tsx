import { FileText, Shield, AlertCircle, Thermometer } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const travelInfo = [
  {
    icon: FileText,
    title: "Permits & Visas",
    items: [
      {
        question: "Do I need a visa to visit Nepal?",
        answer: "Most nationalities can obtain a visa on arrival at Tribhuvan International Airport or land border crossings. Tourist visas are available for 15, 30, or 90 days. Bring passport photos and USD cash for visa fees.",
      },
      {
        question: "What trekking permits do I need?",
        answer: "For popular treks, you'll need a TIMS card (Trekkers' Information Management System) and area-specific permits like ACAP (Annapurna), SMNP (Sagarmatha/Everest), or Langtang permits. Your guide or agency can arrange these.",
      },
      {
        question: "How do I get a trekking permit?",
        answer: "Permits can be obtained at the Nepal Tourism Board office in Kathmandu or Pokhara. Bring your passport, photos, and permit fees. Most trekking agencies include permit arrangements in their packages.",
      },
    ],
  },
  {
    icon: Shield,
    title: "Safety Tips",
    items: [
      {
        question: "Is Nepal safe for tourists?",
        answer: "Nepal is generally very safe for tourists. Nepali people are known for their hospitality. Take normal precautions with valuables, and be mindful of altitude sickness when trekking at high elevations.",
      },
      {
        question: "How do I avoid altitude sickness?",
        answer: "Ascend gradually (no more than 300-500m per day above 3,000m), stay hydrated, avoid alcohol, and consider carrying Diamox. Watch for symptoms like headache, nausea, and dizziness. Descend immediately if symptoms worsen.",
      },
      {
        question: "Do I need travel insurance?",
        answer: "Yes, comprehensive travel insurance is essential, especially for trekking. Ensure your policy covers emergency helicopter evacuation (crucial for high-altitude treks), medical treatment, and trip cancellation.",
      },
    ],
  },
  {
    icon: Thermometer,
    title: "Weather & Packing",
    items: [
      {
        question: "What should I pack for Nepal?",
        answer: "Pack layers for varying temperatures, comfortable walking shoes, rain gear (especially in monsoon), sunscreen, and a good camera. For trekking, add technical gear like hiking boots, a sleeping bag, and warm clothing.",
      },
      {
        question: "What's the weather like in Nepal?",
        answer: "Nepal has four seasons: Spring (Mar-May) is warm with blooming flowers; Monsoon (Jun-Aug) brings rain but lush greenery; Autumn (Sep-Nov) offers clear skies and festivals; Winter (Dec-Feb) is cold but sunny.",
      },
    ],
  },
  {
    icon: AlertCircle,
    title: "Practical Info",
    items: [
      {
        question: "What currency is used in Nepal?",
        answer: "The Nepalese Rupee (NPR). ATMs are available in cities and major towns. Carry cash for remote areas. US dollars are widely accepted for tourist services. Credit cards work in larger hotels and restaurants.",
      },
      {
        question: "What about internet and phone?",
        answer: "Local SIM cards (Ncell, Nepal Telecom) are affordable and easy to get with your passport. WiFi is available in most hotels and cafes in cities. Trekking routes have variable connectivity—many teahouses offer WiFi for a fee.",
      },
      {
        question: "What languages are spoken?",
        answer: "Nepali is the official language, but English is widely spoken in tourist areas. Many guides speak multiple languages. Learning a few Nepali phrases like 'Namaste' (hello) is appreciated.",
      },
    ],
  },
];

const TravelInfo = () => {
  return (
    <section className="section-padding bg-secondary">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center mb-10">
          <p className="text-accent uppercase tracking-widest text-sm font-medium mb-4">
            Travel Essentials
          </p>
          <h2 className="heading-section text-foreground mb-4">
            Everything You <span className="italic text-accent">Need to Know</span>
          </h2>
          <p className="text-body-large text-muted-foreground max-w-2xl mx-auto">
            Practical information to help you prepare for your Nepal adventure.
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {travelInfo.map((category) => (
            <div
              key={category.title}
              className="bg-card rounded-2xl p-6 md:p-8"
            >
              {/* Category Header */}
              <div className="flex items-center gap-4 mb-6">
                <category.icon className="w-8 h-8 text-orange-400" />
                <h3 className="font-display text-xl font-semibold text-foreground">
                  {category.title}
                </h3>
              </div>

              {/* Accordion */}
              <Accordion type="single" collapsible className="space-y-2">
                {category.items.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`${category.title}-${index}`}
                    className="border border-border rounded-lg px-4"
                  >
                    <AccordionTrigger className="text-left py-3 text-foreground hover:text-accent hover:no-underline font-medium">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-3 text-sm leading-relaxed">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TravelInfo;
