import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BadgeCheck, MapPin, Search, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import heroBackground from "@/assets/hero-background.jpg";
import SignupUser from "@/pages/SignupUser";
import { useAuth } from "@/lib/auth.tsx";
import { useCategories } from "@/hooks/useCategories";

const popularSearches = ["CQC Support", "Training Providers", "Care Audits", "Equipment / Supplies"];

export const Hero = () => {
  const [selectedService, setSelectedService] = useState("");
  const [postcode, setPostcode] = useState("");
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const suggestionContainerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const entries = categories.flatMap((category) => {
      const categoryEntry = {
        id: `category-${category.id}`,
        name: category.name,
        type: "Category",
      };

      const subcategoryEntries = (category.subcategories || []).map((subcategory) => ({
        id: `subcategory-${subcategory.id}`,
        name: subcategory.name,
        type: category.name,
      }));

      return [categoryEntry, ...subcategoryEntries];
    });

    return entries.filter(
      (entry, index, array) => array.findIndex((item) => item.name.toLowerCase() === entry.name.toLowerCase()) === index,
    );
  }, [categories]);

  const filteredSuggestions = useMemo(() => {
    const query = selectedService.trim().toLowerCase();
    if (!query) return suggestions.slice(0, 8);
    return suggestions.filter((suggestion) => suggestion.name.toLowerCase().includes(query)).slice(0, 8);
  }, [selectedService, suggestions]);

  const hasQuery = selectedService.trim().length > 0;

  useEffect(() => {
    if (isAuthenticated && showSignupModal) {
      setShowSignupModal(false);
    }
  }, [isAuthenticated, showSignupModal]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!suggestionContainerRef.current?.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    const normalizedService = selectedService.trim();
    if (!isAuthenticated) {
      setShowSignupModal(true);
    } else {
      const params = new URLSearchParams();
      if (normalizedService) params.set('service', normalizedService);
      if (postcode) params.set('location', postcode);
      navigate(`/searchresults?${params.toString()}`);
    }
  };

  const handleSuggestionSelect = (value: string) => {
    setSelectedService(value);
    setShowSuggestions(false);
  };

  const handlePopularSearch = (service: string) => {
    if (!isAuthenticated) {
      setSelectedService(service);
      setShowSignupModal(true);
    } else {
      navigate(`/searchresults?service=${encodeURIComponent(service)}`);
    }
  };

  const stats = [
    { icon: Users, value: "1,500+", label: "care providers across the UK" },
    { icon: BadgeCheck, value: "4.8/5", label: "average buyer satisfaction" },
    { icon: ShieldCheck, value: "Trusted", label: "specialist healthcare services" },
  ];

  return (
    <>
      <section className="relative flex min-h-[680px] items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBackground})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/65 to-slate-950/80" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-24 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl text-center lg:text-left">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Matching care businesses with specialist providers
            </div>

            <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-7xl">
              Find the <span className="text-blue-400">right healthcare service</span> for your business
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75 sm:text-xl">
              Discover compliance experts, consultants, trainers, suppliers, and operational partners built for care providers across the UK.
            </p>

            <div className="mt-10 max-w-4xl rounded-[1.75rem] border border-white/10 bg-white p-3 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1" ref={suggestionContainerRef}>
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder={
                      categoriesLoading
                        ? "Loading services..."
                        : categoriesError
                          ? "Unable to load services"
                          : "Search compliance, consultancy, training, supplies..."
                    }
                    className="h-14 rounded-2xl border-0 bg-transparent pl-12 pr-4 text-base text-slate-900 shadow-none focus-visible:ring-0"
                    value={selectedService}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedService(value);
                      setShowSuggestions(value.trim().length > 0);
                    }}
                    onFocus={() => {
                      if (hasQuery) {
                        setShowSuggestions(true);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                  />
                  {showSuggestions && hasQuery && !categoriesLoading && filteredSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-44 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
                      {filteredSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50"
                          onClick={() => handleSuggestionSelect(suggestion.name)}
                        >
                          <span className="font-medium text-slate-900">{suggestion.name}</span>
                          <span className="text-xs text-slate-500">{suggestion.type}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative lg:w-64">
                  <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Enter your postcode"
                    className="h-14 rounded-2xl border-0 bg-slate-50 pl-12 text-base shadow-none focus-visible:ring-2"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                  />
                </div>

                <Button size="lg" className="h-14 rounded-2xl px-8" onClick={handleSearch}>
                  <Search className="mr-2 h-5 w-5" />
                  Get Started
                </Button>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <span className="text-sm font-medium text-white/70">Popular:</span>
              {popularSearches.map((search) => (
                <button
                  key={search}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20"
                  onClick={() => handlePopularSearch(search)}
                >
                  {search}
                </button>
              ))}
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">{stat.value}</p>
                        <p className="text-sm text-white/70">{stat.label}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="hidden lg:block lg:w-[360px]">
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] backdrop-blur-xl">
              <div className="rounded-[1.5rem] bg-white p-4 text-slate-900">
                <img src={heroBackground} alt="Care providers" className="h-52 w-full rounded-[1.25rem] object-cover" />
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">CareProviders Hub</p>
                    <h3 className="text-lg font-bold">Built for specialist healthcare procurement</h3>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-500">
                  Search categories from the live database, capture buyer intent, and keep the existing signup flow intact.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SignupUser
        open={showSignupModal}
        onOpenChange={setShowSignupModal}
        initialService={selectedService}
        initialLocation={postcode}
      />
    </>
  );
};
