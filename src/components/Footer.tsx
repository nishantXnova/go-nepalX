import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import gonepallogo from "@/assets/gonepallogo.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const footerLinks = {
    explore: [
      { name: "Destinations", href: "/#destinations" },
      { name: "Experiences", href: "/#categories" },
      { name: "Tourist ID", href: "/tourist-id" },
      { name: "Travel Tools", href: "/#travel-info" },
    ],
    company: [
      { name: "About Us", href: "/about" },
      { name: "Blog", href: "/blog" },
      { name: "Careers", href: "/careers" },
      { name: "Press", href: "/press" },
    ],
    support: [
      { name: "FAQ", href: "/faq" },
      { name: "Contact", href: "/contact" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms", href: "/terms" },
    ],
    connect: [
      { name: "Facebook", href: "#", icon: Facebook },
      { name: "Instagram", href: "#", icon: Instagram },
      { name: "Twitter", href: "#", icon: Twitter },
      { name: "YouTube", href: "#", icon: Youtube },
    ],
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Newsletter Section - No border, seamless flow into footer */}
      <div className="container-wide pt-16 pb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-primary-foreground/5 p-8 rounded-2xl">
          <div>
            <h3 className="font-display text-2xl font-semibold mb-2">
              Get Nepal travel tips in your inbox
            </h3>
            <p className="text-primary-foreground/70">
              Subscribe for updates on destinations, travel tips, and special offers.
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 min-w-[250px] focus-visible:ring-accent"
            />
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              Subscribe
            </Button>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-wide py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 pr-0 lg:pr-8">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <img src={gonepallogo} alt="GoNepal" className="h-10 w-auto" />
              <span className="font-display text-2xl font-bold">GoNepal</span>
            </Link>
            <p className="text-white/60 font-light mb-8 max-w-sm leading-relaxed">
              Your gateway to the Himalayas. Discover Nepal's breathtaking mountains,
              rich culture, and warm hospitality with our expert guides.
            </p>
            {/* Contact Info */}
            <div className="space-y-4">
              <a href="mailto:info@gonepal.com" className="flex items-center gap-3 text-primary-foreground/70 hover:text-accent transition-colors">
                <Mail className="h-5 w-5 opacity-80" />
                info@gonepal.com
              </a>
              <a href="tel:+9771234567890" className="flex items-center gap-3 text-primary-foreground/70 hover:text-accent transition-colors">
                <Phone className="h-5 w-5 opacity-80" />
                +977 1-234567890
              </a>
              <p className="flex items-center gap-3 text-primary-foreground/70">
                <MapPin className="h-5 w-5 opacity-80" />
                Kathmandu, Nepal
              </p>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-semibold mb-6 text-lg tracking-wide hidden md:block">Explore</h4>
            <h4 className="font-semibold mb-4 text-lg tracking-wide md:hidden border-b border-primary-foreground/10 pb-2">Explore</h4>
            <ul className="space-y-3">
              {footerLinks.explore.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/70 hover:text-accent hover:translate-x-1 inline-block transition-all text-sm font-medium"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-6 text-lg tracking-wide hidden md:block">Company</h4>
            <h4 className="font-semibold mb-4 text-lg tracking-wide md:hidden border-b border-primary-foreground/10 pb-2 mt-6">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/70 hover:text-accent hover:translate-x-1 inline-block transition-all text-sm font-medium"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-6 text-lg tracking-wide hidden md:block">Support</h4>
            <h4 className="font-semibold mb-4 text-lg tracking-wide md:hidden border-b border-primary-foreground/10 pb-2 mt-6">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/70 hover:text-accent hover:translate-x-1 inline-block transition-all text-sm font-medium"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-semibold mb-6 text-lg tracking-wide hidden md:block">Connect</h4>
            <h4 className="font-semibold mb-4 text-lg tracking-wide md:hidden border-b border-primary-foreground/10 pb-2 mt-6">Connect</h4>
            <ul className="space-y-4">
              {footerLinks.connect.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="group flex items-center gap-3 text-primary-foreground/70 hover:text-accent transition-colors text-sm font-medium"
                    >
                      <div className="p-2.5 rounded-full bg-primary-foreground/5 group-hover:bg-accent/10 group-hover:text-accent transition-all group-hover:-translate-y-1">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span>{link.name}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10 mt-4">
        <div className="container-wide py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-primary-foreground/80 font-semibold text-sm">
              © {currentYear} GoNepal.com. All rights reserved.
            </p>

            {/* Certifications / Payment Methods */}
            <div className="flex items-center gap-6 text-primary-foreground/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-wider uppercase">Certified By</span>
                <span className="font-display font-bold text-primary-foreground/90">Nepal Tourism Board</span>
              </div>
              <div className="h-4 w-px bg-primary-foreground/20 hidden md:block"></div>
              <div className="flex gap-3">
                {/* Placeholders for payment icons */}
                <div className="h-6 w-10 bg-primary-foreground/10 rounded flex items-center justify-center text-[10px] font-bold">VISA</div>
                <div className="h-6 w-10 bg-primary-foreground/10 rounded flex items-center justify-center text-[10px] font-bold">MC</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
