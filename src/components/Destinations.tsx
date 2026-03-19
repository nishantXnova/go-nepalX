import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { destinations } from "@/data/destinations";
import BookmarkButton from "@/components/BookmarkButton";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const Destinations = () => {
  return (
    <section id="destinations" className="section-padding bg-background/50 relative overflow-hidden">
      {/* Subtle decorative background element */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container-wide relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col md:flex-row md:items-end md:justify-between mb-12"
        >
          <div className="max-w-2xl">
            <p className="text-accent uppercase tracking-[0.4em] text-xs font-bold mb-6 flex items-center gap-4">
              <span className="h-[1px] w-8 bg-accent" />
              Curated Escapes
            </p>
            <h2 className="heading-section text-foreground leading-[1.1]">
              Magnificent <span className="italic text-accent">Destinations</span> <br />
              Tailored for Discovery
            </h2>
          </div>
          <div className="mt-8 md:mt-0">
            <p className="text-muted-foreground max-w-sm text-sm leading-relaxed border-l-2 border-accent/20 pl-6">
              Experience the pinnacle of Himalayan adventure through our carefully selected collection of Nepal's most iconic locations.
            </p>
          </div>
        </motion.div>

        {/* Destinations Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"
        >
          {destinations.map((destination) => (
            <motion.div
              key={destination.id}
              variants={cardVariants}
              whileHover={{ y: -15 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="group"
            >
              <Link
                to={`/destination/${destination.id}`}
                className="relative bg-card rounded-3xl overflow-hidden shadow-soft hover:shadow-2xl flex flex-col h-full transition-all duration-500 border border-white/5"
              >
                {/* Image */}
                <div className="relative h-80 overflow-hidden">
                  <motion.img
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-700" />

                  {/* Category Badge */}
                  <motion.span
                    className="absolute top-6 left-6 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-widest"
                  >
                    {destination.category}
                  </motion.span>

                  {/* Rating & Bookmark */}
                  <div className="absolute top-6 right-6 flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                      <Star className="h-3 w-3 fill-nepal-gold text-nepal-gold" />
                      <span className="text-[10px] font-bold text-white">{destination.rating}</span>
                    </div>
                    <BookmarkButton
                      placeName={destination.name}
                      placeData={{
                        description: destination.description,
                        category: destination.category,
                        image_url: destination.image,
                      }}
                      variant="overlay"
                    />
                  </div>

                  {/* Title Overlay */}
                  <div className="absolute bottom-6 left-8 right-8">
                    <h3 className="font-display text-3xl font-bold text-white mb-2 group-hover:text-nepal-gold transition-colors duration-500">
                      {destination.name}
                    </h3>
                    <p className="text-white/70 text-sm font-light leading-snug line-clamp-2 italic">
                      {destination.tagline}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 pb-10 flex-1 flex flex-col">
                  {/* Meta Info */}
                  <div className="flex items-center gap-6 mb-8 border-b border-white/5 pb-6">
                    <div className="flex items-center gap-2 text-muted-foreground/80">
                      <Clock className="h-4 w-4 text-accent/60" />
                      <span className="text-xs uppercase tracking-widest font-medium">{destination.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground/80">
                      <MapPin className="h-4 w-4 text-accent/60" />
                      <span className="text-xs uppercase tracking-widest font-medium">Himalayas</span>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="flex flex-wrap gap-2 mb-10">
                    {destination.highlights.slice(0, 3).map((highlight) => (
                      <span
                        key={highlight}
                        className="bg-secondary/50 text-secondary-foreground/80 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-semibold"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="relative overflow-hidden rounded-full transition-all mt-auto duration-500">
                    <Button className="w-full btn-primary py-7 text-sm uppercase tracking-[0.2em] font-bold group-hover:tracking-[0.3em] transition-all duration-500">
                      Discover Details
                    </Button>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Destinations;
