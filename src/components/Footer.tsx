import { Facebook, Twitter, Linkedin } from "lucide-react";

const footerLinks = {
  services: [
    { name: "Regulatory & Legal", href: "/info/regulatory-legal" },
    { name: "Consulting Services", href: "/info/consulting-services" },
    { name: "Care Management", href: "/info/care-management" },
    { name: "Training & Development", href: "/info/training-development" },
    { name: "Professional Services", href: "/info/professional-services" },
    { name: "Supplies & Equipment", href: "/info/supplies-equipment" },
  ],
  forProviders: [
    { name: "How It Works", href: "/info/how-it-works" },
    { name: "Find Services", href: "/info/find-services" },
    { name: "Compare Providers", href: "/info/compare-providers" },
    { name: "Success Stories", href: "/info/success-stories" },
    { name: "Pricing Guide", href: "/info/pricing-guide" },
  ],
  forProfessionals: [
    { name: "Join as Professional", href: "/info/join-as-professional" },
    { name: "Advertise Services", href: "/info/advertise-services" },
    { name: "Provider Resources", href: "/info/provider-resources" },
    { name: "Success Stories", href: "/info/success-stories" },
  ],
  resources: [
    { name: "Blog & Insights", href: "/info/blog-insights" },
    { name: "CQC Guidance", href: "/info/cqc-guidance" },
    { name: "Industry News", href: "/info/industry-news" },
    { name: "Help Center", href: "/info/help-center" },
    { name: "FAQs", href: "/info/faqs" },
  ],
  company: [
    { name: "About Us", href: "/info/about-us" },
    { name: "Contact Us", href: "/info/contact-us" },
    { name: "Careers", href: "/info/careers" },
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Terms of Service", href: "/info/terms-of-service" },
    { name: "Code of Conduct", href: "/code-of-conduct" },
  ],
};

export const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-8">
          {/* Services Column */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Services</h3>
            <ul className="space-y-2">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* For Providers Column */}
          <div>
            <h3 className="font-semibold text-lg mb-4">For Providers</h3>
            <ul className="space-y-2">
              {footerLinks.forProviders.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* For Professionals Column */}
          <div>
            <h3 className="font-semibold text-lg mb-4">For Professionals</h3>
            <ul className="space-y-2">
              {footerLinks.forProfessionals.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-secondary-foreground/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-2xl font-bold mb-2">Providers Hub</p>
              <p className="text-sm text-secondary-foreground/70">
                Connecting Care Providers with Trusted Professionals
              </p>
            </div>

            <div className="flex space-x-6">
              <a
                href="#"
                className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-6 w-6" />
              </a>
              <a
                href="#"
                className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-6 w-6" />
              </a>
              <a
                href="#"
                className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-6 w-6" />
              </a>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-secondary-foreground/70">
              © 2025 Providers Hub. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
