import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import regulatoryImg from "@/assets/category-regulatory.jpg";
import softwareImg from "@/assets/category-software.jpg";
import professionalImg from "@/assets/category-professional.jpg";

const articles = [
  {
    title: "Complete Guide to CQC Registration 2025",
    category: "Regulatory",
    readTime: "12 min read",
    excerpt: "Everything you need to know about registering your care service with the CQC in 2025. Step-by-step guidance and expert tips.",
    author: "Sarah Jenkins",
    image: regulatoryImg,
  },
  {
    title: "Choosing the Right Care Management Software",
    category: "Technology",
    readTime: "8 min read",
    excerpt: "A comprehensive comparison of leading care management systems. Find the perfect software solution for your care business.",
    author: "Michael Chen",
    image: softwareImg,
  },
  {
    title: "Sponsor Visa Requirements for Care Homes Explained",
    category: "Immigration",
    readTime: "10 min read",
    excerpt: "Navigate the complex world of sponsor visas for care workers. Latest updates and compliance requirements for 2025.",
    author: "David Patel",
    image: professionalImg,
  },
];

export const Insights = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Care Industry Insights & Guides
          </h2>
          <p className="text-xl text-muted-foreground">
            Stay informed with the latest guidance and best practices
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <Card
              key={index}
              className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
            >
              <div className="h-48 relative overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
              </div>
              
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary">{article.category}</Badge>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    {article.readTime}
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors">
                  {article.title}
                </h3>

                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {article.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {article.author.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {article.author}
                    </span>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="group-hover:text-primary">
                    Read <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
