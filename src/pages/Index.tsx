import { useEffect } from 'react';
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

const Index = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { categories } = useCategories();

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
      <CategoryHighlights categories={categories} />
      <SocialProofSection />
      <ExploreCategoriesSection categories={categories} />
      <FeaturedProvidersSection categories={categories} />
      <HowItWorksRedesign />
      <TrustSectionRedesign />
      <ProviderCtaSection />
      <Footer />
    </div>
  );
};

export default Index;
