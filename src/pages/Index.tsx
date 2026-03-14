import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.tsx';
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import {
  CategoryHighlights,
  ExploreCategoriesSection,
  FeaturedProvidersSection,
  HowItWorksRedesign,
  ProviderCtaSection,
  SocialProofSection,
  TrustSectionRedesign,
} from "@/components/LandingSections";
import { Footer } from "@/components/Footer";
import { useCategories } from "@/hooks/useCategories";
import SignupUser from "@/pages/SignupUser";

const Index = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { categories } = useCategories();
  const [showLandingSignup, setShowLandingSignup] = useState(false);
  const [signupService, setSignupService] = useState<string>("");

  const handleRequireSignup = (service?: string) => {
    if (service) {
      setSignupService(service);
    } else {
      setSignupService("");
    }
    setShowLandingSignup(true);
  };

  useEffect(() => {
    // Redirect authenticated users to their dashboard
    if (isAuthenticated && user) {
      if (user.role === 'provider') {
        navigate(`/home/sellers/${user.id}`, { replace: true });
      } else {
        navigate(`/home/${user.id}`, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <Hero />
      <CategoryHighlights
        categories={categories}
        isAuthenticated={!!(isAuthenticated && user)}
        onRequireSignup={handleRequireSignup}
      />
      <SocialProofSection />
      <ExploreCategoriesSection
        categories={categories}
        isAuthenticated={!!(isAuthenticated && user)}
        onRequireSignup={handleRequireSignup}
      />
      <FeaturedProvidersSection
        categories={categories}
        isAuthenticated={!!(isAuthenticated && user)}
        onRequireSignup={handleRequireSignup}
      />
      <HowItWorksRedesign />
      <TrustSectionRedesign />
      <ProviderCtaSection />
      <Footer />
      <SignupUser
        open={showLandingSignup}
        onOpenChange={setShowLandingSignup}
        initialService={signupService}
        initialLocation=""
      />
    </div>
  );
};

export default Index;
