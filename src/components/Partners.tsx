import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Hotel, Mountain, Package, Plane, FileText, Compass, MapPin, Users, Zap, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const partnerCategories = [
  {
    icon: Plane,
    title: "Flights",
    emoji: "✈️",
    description: "Search and compare travel options to Kathmandu and within Nepal.",
    cta: "Find Flights",
    url: "/#flights",
    internal: true,
  },
  {
    icon: Hotel,
    title: "Hotels",
    emoji: "🏨",
    description: "Find the best accommodation deals across Nepal.",
    cta: "Find Hotels",
    url: "/#nearby-places",
    internal: true,
  },
  {
    icon: Compass,
    title: "Hotels Near You",
    emoji: "🧭",
    description: "Discover the best places to stay right where you are.",
    cta: "Find Hotels Near You",
    url: "/#nearby-places",
    internal: true,
  },
  {
    icon: Package,
    title: "Experiences",
    emoji: "📦",
    description: "Book tours, activities, and curated experiences.",
    cta: "Explore Experiences",
    url: "/#experiences",
    internal: true,
  },
  {
    icon: Mountain,
    title: "Trekking Permits",
    emoji: "🏔️",
    badge: "Nepal Exclusive",
    description: "TIMS, Annapurna & Everest permits available here.",
    cta: "Tourism Board",
    url: "https://tourism.gov.np/",
    internal: false,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const Partners = () => {
  const navigate = useNavigate();

  const handleLinkClick = (url: string, internal: boolean) => {
    if (!internal) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    if (url.startsWith("/#")) {
      const sectionId = url.substring(2);
      if (window.location.pathname === "/") {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        navigate(url);
      }
    } else {
      navigate(url);
    }
  };

  return (
    <section id="experiences" className="section-padding" style={{ background: 'linear-gradient(180deg, #FFFDF9 0%, #F5EDD8 100%)' }}>
      <div className="container-wide">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <h2 className="heading-section text-foreground mb-4">
            Book With <span className="italic text-accent">Confidence</span>
          </h2>
          <p className="text-body-large text-muted-foreground max-w-2xl mx-auto">
            Best ways to plan and book your Nepal adventure — handpicked by our team.
          </p>
        </motion.div>

        {/* Trust Badges - Centered below subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-3 mb-10"
        >
          {[
            { icon: MapPin, text: "Local Knowledge" },
            { icon: Users, text: "Nepal-Based Team" },
            { icon: CheckCircle, text: "Traveler Verified" },
            { icon: Zap, text: "Free to Use" },
          ].map((item) => (
            <span
              key={item.text}
              className="bg-[#FFF4E8] text-orange-700 border border-orange-200 px-4 py-2 rounded-full text-[13px] font-medium flex items-center gap-2"
            >
              <item.icon className="w-4 h-4" />
              {item.text}
            </span>
          ))}
        </motion.div>

        {/* Partner Categories - Uniform Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-wrap justify-center gap-6"
        >
          {partnerCategories.map((category) => (
            <motion.div
              key={category.title}
              variants={itemVariants}
              className="relative w-full md:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-1.5rem)] max-w-sm bg-card rounded-2xl p-6 border border-border transition-all duration-300 flex flex-col h-full min-h-[300px] group hover:shadow-lg hover:-translate-y-6"
            >
              {/* Top border that appears on hover */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px] bg-[#FB923C] rounded-t-2xl transition-all duration-300 opacity-0 group-hover:opacity-100"
              />

              {/* Badge if present - Top Right Corner */}
              {category.badge && (
                <span
                  className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 text-xs font-semibold z-10"
                  style={{ borderRadius: '100px' }}
                >
                  {category.badge}
                </span>
              )}

              {/* Icon on Top - Lucide Icon */}
              <div className="text-[#FB923C] mb-4">
                <category.icon className="w-8 h-8" />
              </div>

              {/* Bold Title */}
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                {category.title}
              </h3>

              {/* One-line Description */}
              <p className="text-muted-foreground text-sm mb-4 flex-grow">
                {category.description}
              </p>

              {/* CTA Button at Bottom */}
              <Button
                variant="outline"
                size="sm"
                className="bg-[#FB923C] text-white border-[#FB923C] hover:bg-[#E86C35] hover:text-white transition-all duration-300 mt-auto w-full rounded-[8px]"
                style={{ borderRadius: '8px' }}
                onClick={() => handleLinkClick(category.url, category.internal)}
              >
                {category.cta}
                {category.internal ? <ArrowRight className="ml-2 h-4 w-4" /> : <ExternalLink className="ml-2 h-4 w-4" />}
              </Button>
            </motion.div>
          ))}
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="border-t border-gray-200 mt-8" style={{ marginTop: '32px' }} />
          <p className="text-center text-gray-600 text-xs mt-8">
            GoNepal curates these links for convenience. We are not affiliated with or responsible for third-party platforms.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Partners;
