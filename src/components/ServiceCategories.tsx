import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Briefcase,
  Laptop,
  GraduationCap,
  Building,
  Package,
  FileText,
  Users,
  CheckCircle,
  DollarSign,
  UserCheck,
  TrendingUp,
  Loader2
} from "lucide-react";
import regulatoryImg from "@/assets/category-regulatory.jpg";
import consultingImg from "@/assets/category-consulting.jpg";
import softwareImg from "@/assets/category-software.jpg";
import trainingImg from "@/assets/category-training.jpg";
import professionalImg from "@/assets/category-professional.jpg";
import suppliesImg from "@/assets/category-supplies.jpg";
import ctaCareProvidersImg from "@/assets/cta-care-providers.jpg";
import ctaProfessionalsImg from "@/assets/cta-professionals.jpg";
import heroBackgroundImg from "@/assets/hero-background.jpg";
import { useCategories } from "@/hooks/useCategories";
import { Link } from "react-router-dom";

export const ServiceCategories = () => {
  const { categories, loading, error } = useCategories();

  // Map category names to icons and provide a palette of unique images
  const getCategoryIcon = (categoryName: string) => {
    const iconMap: Record<string, any> = {
      'Tender & Bid Writing Services': FileText,
      'Legal Consultancy': Shield,
      'CQC (England) / CI (Scotland) / CIW (Wales)': Shield,
      'Ofsted Registration': CheckCircle,
      'Non-Regulated Care': Users,
      'Care Client Management': Users,
      'Care Audits / Mock Inspections': CheckCircle,
      'Business Operations Consultancy': Briefcase,
      'Business Finance Consultancy': DollarSign,
      'Training Providers': GraduationCap,
      'Equipment / Supplies': Package,
      'Employment': UserCheck,
      'Business Buying/Selling': TrendingUp,
    };
    return iconMap[categoryName] || Building;
  };

  const categoryImages = [
    regulatoryImg,
    consultingImg,
    softwareImg,
    trainingImg,
    professionalImg,
    suppliesImg,
    ctaCareProvidersImg,
    ctaProfessionalsImg,
    heroBackgroundImg,
  ];

  if (loading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center text-red-500">
            Failed to load categories: {error}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Explore Our Services
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to run a compliant care business
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category, index) => {
            const Icon = getCategoryIcon(category.name);
            const image = categoryImages[index % categoryImages.length];
            return (
              <Card
                key={category.id}
                className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <Icon className="h-10 w-10 text-white" />
                  </div>
                  <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground">
                    {category.subcategories.length} services
                  </Badge>
                </div>
                
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-foreground">
                    {category.name}
                  </h3>
                  
                  <ul className="space-y-2 mb-6">
                    {category.subcategories.slice(0, 5).map((subcategory) => (
                      <li
                        key={subcategory.id}
                        className="text-sm text-muted-foreground flex items-start"
                      >
                        <span className="mr-2 text-accent">•</span>
                        {subcategory.name}
                      </li>
                    ))}
                    {category.subcategories.length > 5 && (
                      <li className="text-sm text-muted-foreground">
                        +{category.subcategories.length - 5} more services
                      </li>
                    )}
                  </ul>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    <Link to={`/categories/${category.id}`}>
                      Explore
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
