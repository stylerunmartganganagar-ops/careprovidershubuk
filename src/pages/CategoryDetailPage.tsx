import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Briefcase,
  GraduationCap,
  Building,
  Package,
  FileText,
  Users,
  CheckCircle,
  DollarSign,
  UserCheck,
  TrendingUp,
} from "lucide-react";
import regulatoryImg from "@/assets/category-regulatory.jpg";
import consultingImg from "@/assets/category-consulting.jpg";
import softwareImg from "@/assets/category-software.jpg";
import trainingImg from "@/assets/category-training.jpg";
import professionalImg from "@/assets/category-professional.jpg";
import suppliesImg from "@/assets/category-supplies.jpg";
import { useCategories } from "@/hooks/useCategories";

const getCategoryIcon = (categoryName: string) => {
  const iconMap: Record<string, any> = {
    "Tender & Bid Writing Services": FileText,
    "Legal Consultancy": Shield,
    "CQC (England) / CI (Scotland) / CIW (Wales)": Shield,
    "Ofsted Registration": CheckCircle,
    "Non-Regulated Care": Users,
    "Care Client Management": Users,
    "Care Audits / Mock Inspections": CheckCircle,
    "Business Operations Consultancy": Briefcase,
    "Business Finance Consultancy": DollarSign,
    "Training Providers": GraduationCap,
    "Equipment / Supplies": Package,
    Employment: UserCheck,
    "Business Buying/Selling": TrendingUp,
  };
  return iconMap[categoryName] || Building;
};

const getCategoryImage = (categoryName: string) => {
  const imageMap: Record<string, string> = {
    "Tender & Bid Writing Services": consultingImg,
    "Legal Consultancy": regulatoryImg,
    "CQC (England) / CI (Scotland) / CIW (Wales)": regulatoryImg,
    "Ofsted Registration": regulatoryImg,
    "Non-Regulated Care": consultingImg,
    "Care Client Management": consultingImg,
    "Care Audits / Mock Inspections": consultingImg,
    "Business Operations Consultancy": professionalImg,
    "Business Finance Consultancy": professionalImg,
    "Training Providers": trainingImg,
    "Equipment / Supplies": suppliesImg,
    Employment: professionalImg,
    "Business Buying/Selling": professionalImg,
  };
  return imageMap[categoryName] || consultingImg;
};

const CategoryDetailPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { categories, loading, error } = useCategories();

  const category = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId]
  );

  const Icon = category ? getCategoryIcon(category.name) : Building;
  const image = category ? getCategoryImage(category.name) : consultingImg;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <section className="relative h-64 md:h-80 w-full overflow-hidden">
          <img
            src={image}
            alt={category?.name || "Service category"}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="text-white max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <Icon className="h-10 w-10" />
                  <h1 className="text-3xl md:text-4xl font-bold">
                    {category?.name || "Service category"}
                  </h1>
                </div>
                <p className="text-sm md:text-base text-white/80">
                  {category?.description ||
                    "Explore specialist services and tailored support options within this category, designed to help you run a compliant and efficient care business."}
                </p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-3">
                <Badge className="bg-white text-black">
                  {category?.subcategories.length ?? 0} services
                </Badge>
                <Button asChild variant="outline" className="bg-white/10 border-white/40 text-white hover:bg-white hover:text-black">
                  <Link to="/">Back to all categories</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            {loading && (
              <p className="text-center text-muted-foreground">Loading services...</p>
            )}
            {error && !loading && (
              <p className="text-center text-red-500">{error}</p>
            )}
            {!loading && !category && !error && (
              <p className="text-center text-muted-foreground">Category not found.</p>
            )}

            {!loading && category && (
              <>
                <div className="mb-10 max-w-3xl">
                  <h2 className="text-2xl font-semibold mb-3">About this service category</h2>
                  <p className="text-muted-foreground">
                    {category.description ||
                      "This category brings together specialists and services that support care providers with regulatory compliance, operations, and service quality."}
                  </p>
                </div>

                <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
                  <h3 className="text-xl font-semibold">All services in this category</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse the different specialist areas and sub-services available under this category.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.subcategories.map((sub) => (
                    <Card key={sub.id} className="h-full flex flex-col">
                      <CardContent className="p-5 flex flex-col gap-3 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="text-lg font-semibold text-foreground">
                            {sub.name}
                          </h4>
                          <Badge variant="outline">Sub-service</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex-1">
                          {sub.description ||
                            "Specialist support tailored to this area of care. Ideal for providers who need focused help and practical guidance."}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CategoryDetailPage;
