import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building,
  CheckCircle,
  ClipboardList,
  FileText,
  GraduationCap,
  MessageSquare,
  Package,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import regulatoryImg from "@/assets/category-regulatory.jpg";
import consultingImg from "@/assets/category-consulting.jpg";
import softwareImg from "@/assets/category-software.jpg";
import trainingImg from "@/assets/category-training.jpg";
import professionalImg from "@/assets/category-professional.jpg";
import suppliesImg from "@/assets/category-supplies.jpg";
import ctaCareProvidersImg from "@/assets/cta-care-providers.jpg";
import ctaProfessionalsImg from "@/assets/cta-professionals.jpg";
import type { CategoryWithSubcategories } from "@/hooks/useCategories";

const imagePalette = [
  regulatoryImg,
  consultingImg,
  softwareImg,
  trainingImg,
  professionalImg,
  suppliesImg,
  ctaCareProvidersImg,
  ctaProfessionalsImg,
];

const getCategoryIcon = (categoryName: string) => {
  const iconMap: Record<string, LucideIcon> = {
    "Tender & Bid Writing Services": FileText,
    "Legal Consultancy": ShieldCheck,
    "CQC (England) / CI (Scotland) / CIW (Wales)": ShieldCheck,
    "Ofsted Registration": CheckCircle,
    "Non-Regulated Care": Users,
    "Care Client Management": Users,
    "Care Audits / Mock Inspections": CheckCircle,
    "Business Operations Consultancy": Briefcase,
    "Business Finance Consultancy": TrendingUp,
    "Training Providers": GraduationCap,
    "Equipment / Supplies": Package,
    Employment: UserCheck,
    "Business Buying/Selling": Building,
  };

  return iconMap[categoryName] || Briefcase;
};

type ActionableLandingSectionsProps = {
  categories: CategoryWithSubcategories[];
  isAuthenticated: boolean;
  onRequireSignup: (service?: string) => void;
};

type LandingSectionsProps = {
  categories: CategoryWithSubcategories[];
};

export function CategoryHighlights({ categories, isAuthenticated, onRequireSignup }: ActionableLandingSectionsProps) {
  const navigate = useNavigate();
  const featured = categories.slice(0, 8);

  return (
    <section className="relative z-20 -mt-16 px-4">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.12)] sm:p-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {featured.map((category, index) => {
            const Icon = getCategoryIcon(category.name);
            const accentColors = [
              "bg-blue-50 text-blue-600",
              "bg-emerald-50 text-emerald-600",
              "bg-violet-50 text-violet-600",
              "bg-amber-50 text-amber-600",
              "bg-pink-50 text-pink-600",
              "bg-cyan-50 text-cyan-600",
              "bg-indigo-50 text-indigo-600",
              "bg-rose-50 text-rose-600",
            ];
            const handleClick = () => {
              if (isAuthenticated) {
                navigate(`/searchresults?service=${encodeURIComponent(category.name)}`);
              } else {
                onRequireSignup(category.name);
              }
            };
            return (
              <button
                key={category.id}
                type="button"
                className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-100 px-3 py-4 text-center transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                onClick={handleClick}
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${accentColors[index % accentColors.length]}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold leading-snug text-slate-900 sm:text-sm">{category.name}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{category.subcategories.length} services</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function SocialProofSection() {
  const stats = [
    {
      icon: Users,
      value: "1,500+",
      label: "care providers supported across the UK",
      iconClass: "bg-blue-50 text-blue-600",
    },
    {
      icon: BadgeCheck,
      value: "4.8/5",
      label: "average satisfaction from matched buyers",
      iconClass: "bg-amber-50 text-amber-600",
    },
    {
      icon: ShieldCheck,
      value: "100%",
      label: "focused on verified, specialist services",
      iconClass: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <section className="px-4 py-20">
      <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
              <CardContent className="p-8 text-center">
                <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${stat.iconClass}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <p className="text-4xl font-black tracking-tight text-slate-900">{stat.value}</p>
                <p className="mt-2 text-sm text-slate-500">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export function FeaturedProvidersSection({ categories, isAuthenticated, onRequireSignup }: ActionableLandingSectionsProps) {
  const navigate = useNavigate();
  const cards = [
    {
      name: "CQC Compliance Specialists",
      role: categories[0]?.name || "CQC (England) / CI (Scotland) / CIW (Wales)",
      location: "London",
      metric: "From £95/hr",
      image: regulatoryImg,
      service: categories[0]?.name || "CQC (England) / CI (Scotland) / CIW (Wales)",
    },
    {
      name: "Care Ops Advisory",
      role: categories[1]?.name || "Business Operations Consultancy",
      location: "Manchester",
      metric: "Project-based",
      image: consultingImg,
      service: categories[1]?.name || "Business Operations Consultancy",
    },
    {
      name: "Training Partners UK",
      role: categories[2]?.name || "Training Providers",
      location: "Birmingham",
      metric: "Certified teams",
      image: trainingImg,
      service: categories[2]?.name || "Training Providers",
    },
    {
      name: "Supply & Setup Experts",
      role: categories[3]?.name || "Equipment / Supplies",
      location: "Leeds",
      metric: "Nationwide delivery",
      image: suppliesImg,
      service: categories[3]?.name || "Equipment / Supplies",
    },
  ];

  return (
    <section className="bg-slate-50/80 px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col gap-4 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Featured matches</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Trusted specialists for care businesses</h2>
            <p className="mt-3 max-w-2xl text-slate-500">Mock showcase cards for now, styled to support the redesign while still routing users into the live search experience.</p>
          </div>
          <Button
            variant="outline"
            className="rounded-full px-6"
            onClick={() => {
              if (isAuthenticated) {
                navigate("/searchresults");
              } else {
                onRequireSignup();
              }
            }}
          >
            Browse all services
          </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.name} className="overflow-hidden rounded-[1.75rem] border-0 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="relative h-52 overflow-hidden">
                <img src={card.image} alt={card.role} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
                <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900">
                  {card.role}
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{card.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{card.location}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{card.metric}</span>
                </div>
                <Button
                  className="mt-6 w-full rounded-xl"
                  onClick={() => {
                    if (isAuthenticated) {
                      navigate(`/searchresults?service=${encodeURIComponent(card.service)}`);
                    } else {
                      onRequireSignup(card.service);
                    }
                  }}
                >
                  View matches
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorksRedesign() {
  const steps = [
    {
      icon: ClipboardList,
      title: "Describe what you need",
      description: "Search by service and location to tell us what kind of healthcare support your business needs.",
    },
    {
      icon: MessageSquare,
      title: "Compare specialist options",
      description: "Review relevant categories and providers, then connect with the ones that fit your requirements.",
    },
    {
      icon: UserCheck,
      title: "Start with confidence",
      description: "Complete signup only when needed and move straight into your dashboard or matched results.",
    },
  ];

  return (
    <section className="bg-white px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">How it works</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Simple from search to supplier shortlist</h2>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-8 text-center shadow-sm">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <Icon className="h-8 w-8" />
                </div>
                <div className="mb-3 text-sm font-semibold text-blue-600">Step {index + 1}</div>
                <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function TrustSectionRedesign() {
  const items = [
    {
      icon: ShieldCheck,
      title: "Specialist healthcare focus",
      description: "Built around care-sector needs, from compliance and consultancy to staffing, training, and supplies.",
      className: "text-emerald-600 bg-emerald-50",
    },
    {
      icon: BadgeCheck,
      title: "Verified provider experience",
      description: "Presenting vetted service categories and trusted provider pathways to help buyers make better decisions.",
      className: "text-blue-600 bg-blue-50",
    },
    {
      icon: Sparkles,
      title: "Guided buyer journey",
      description: "From predictive search to signup capture, the flow stays focused on helping care businesses act quickly.",
      className: "text-violet-600 bg-violet-50",
    },
  ];

  return (
    <section className="bg-slate-50/80 px-4 py-24">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="rounded-[1.75rem] border-0 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <CardContent className="p-8">
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${item.className}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{item.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export function ProviderCtaSection() {
  return (
    <section className="px-4 py-24">
      <div className="mx-auto grid max-w-6xl gap-8 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-8 text-white shadow-[0_24px_80px_rgba(37,99,235,0.35)] lg:grid-cols-[1.1fr_0.9fr] lg:p-12">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">For providers</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">Grow your presence on CareProviders Hub</h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-blue-50/90">
            Join the marketplace care businesses use to discover compliance partners, consultants, trainers, and operational suppliers.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button asChild className="rounded-full bg-white px-8 text-blue-700 hover:bg-white/90">
              <Link to="/signup/freelancer">Join as a Professional</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-white/30 bg-transparent px-8 text-white hover:bg-white/10 hover:text-white">
              <Link to="/login">Learn more</Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <img src={ctaProfessionalsImg} alt="Professional services" className="h-full min-h-[220px] w-full rounded-[1.75rem] object-cover" />
          <img src={ctaCareProvidersImg} alt="Care providers" className="h-full min-h-[220px] w-full rounded-[1.75rem] object-cover" />
        </div>
      </div>
    </section>
  );
}

export function ExploreCategoriesSection({ categories, isAuthenticated, onRequireSignup }: ActionableLandingSectionsProps) {
  const navigate = useNavigate();
  const topCategories = categories.slice(0, 6);

  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Categories</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Explore services built for the care sector</h2>
            <p className="mt-3 max-w-2xl text-slate-500">Using current image assets with live category data from your existing source.</p>
          </div>
          <Button
            variant="outline"
            className="rounded-full px-6"
            onClick={() => {
              if (isAuthenticated) {
                navigate("/searchresults");
              } else {
                onRequireSignup();
              }
            }}
          >
            See all services
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {topCategories.map((category, index) => {
            const Icon = getCategoryIcon(category.name);
            const image = imagePalette[index % imagePalette.length];
            return (
              <Card key={category.id} className="overflow-hidden rounded-[1.75rem] border-0 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <div className="relative h-56">
                  <img src={image} alt={category.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 to-transparent" />
                  <div className="absolute bottom-5 left-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{category.name}</h3>
                      <p className="mt-2 text-sm text-slate-500">{category.description || "Specialist support for healthcare operators and growing care businesses."}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{category.subcategories.length}</span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {category.subcategories.slice(0, 3).map((subcategory) => (
                      <span key={subcategory.id} className="rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-600">
                        {subcategory.name}
                      </span>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className="mt-6 w-full rounded-xl"
                    onClick={() => {
                      if (isAuthenticated) {
                        navigate(`/searchresults?service=${encodeURIComponent(category.name)}`);
                      } else {
                        onRequireSignup(category.name);
                      }
                    }}
                  >
                    Explore category
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
