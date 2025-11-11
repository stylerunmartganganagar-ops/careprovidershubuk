import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import heroBackground from "@/assets/hero-background.jpg";
import SignupUser from "@/pages/SignupUser";
import { useAuth } from "@/lib/auth.tsx";
import { useCategories } from "@/hooks/useCategories";

const popularSearches = [];
// Database queries will populate this array; currently empty

export const Hero = () => {
  const [selectedService, setSelectedService] = useState("");
  const [postcode, setPostcode] = useState("");
  const [showSignupModal, setShowSignupModal] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();

  const categoryGroups = useMemo(() => {
    if (!categories) return [];
    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      subcategories: category.subcategories || [],
    }));
  }, [categories]);

  // Close signup modal when user becomes authenticated (e.g., after email confirmation)
  useEffect(() => {
    if (isAuthenticated && showSignupModal) {
      console.log('User authenticated, closing signup modal');
      setShowSignupModal(false);
    }
  }, [isAuthenticated, showSignupModal]);

  const handleSearch = () => {
    if (!isAuthenticated) {
      // Show 4-step signup modal for unauthenticated users
      setShowSignupModal(true);
    } else {
      // Navigate to search results for authenticated users
      const params = new URLSearchParams();
      if (selectedService) params.set('service', selectedService);
      if (postcode) params.set('location', postcode);
      navigate(`/searchresults?${params.toString()}`);
    }
  };

  const handlePopularSearch = (service: string) => {
    if (!isAuthenticated) {
      setSelectedService(service);
      setShowSignupModal(true);
    } else {
      navigate(`/searchresults?service=${encodeURIComponent(service)}`);
    }
  };
  return (
    <>
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBackground})` }}
        >
          <div className="absolute inset-0 bg-secondary/70" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 animate-fade-in">
            Find Trusted Healthcare Professionals
            <br />
            for Your Care Business
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto animate-slide-up">
            Connect with CQC-compliant services, expert consultants, and essential suppliers
          </p>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-3 mb-8 animate-scale-in">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <Select
                  value={selectedService}
                  onValueChange={setSelectedService}
                  disabled={categoriesLoading || categoryGroups.length === 0}
                >
                  <SelectTrigger className="h-14 text-base">
                    <SelectValue
                      placeholder={
                        categoriesLoading
                          ? "Loading categories..."
                          : categoriesError
                            ? "Unable to load categories"
                            : "What service are you looking for?"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryGroups.map((category) => (
                      <SelectGroup key={category.id}>
                        <SelectLabel>{category.name}</SelectLabel>
                        <SelectItem value={category.name}>
                          {`All ${category.name}`}
                        </SelectItem>
                        {category.subcategories.map((sub) => (
                          <SelectItem key={sub.id} value={sub.name}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:w-64">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    placeholder="Enter your postcode"
                    className="h-14 pl-10 text-base"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                  />
                </div>
              </div>
              
              <Button size="lg" className="h-14 px-8 bg-primary hover:bg-primary/90" onClick={handleSearch}>
                <Search className="mr-2 h-5 w-5" />
                Get Started
              </Button>
            </div>
          </div>

          {/* Popular Searches */}
          <div className="flex flex-wrap justify-center gap-2 animate-fade-in">
            <span className="text-white/80 text-sm">Popular:</span>
            {popularSearches.map((search) => (
              <button
                key={search}
                className="px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-full transition-colors duration-200"
                onClick={() => handlePopularSearch(search)}
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4-Step Signup Modal */}
      <SignupUser
        open={showSignupModal}
        onOpenChange={setShowSignupModal}
        initialService={selectedService}
        initialLocation={postcode}
      />
    </>
  );
};
