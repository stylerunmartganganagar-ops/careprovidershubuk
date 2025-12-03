import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Menu, X } from "lucide-react";

const serviceCategories = [
  { name: "Regulatory & Legal", href: "#regulatory" },
  { name: "Consulting", href: "#consulting" },
  { name: "Training & Development", href: "#training" },
  { name: "Care Management", href: "#care-management" },
  { name: "Professional Services", href: "#professional" },
  { name: "Supplies", href: "#supplies" },
];

export const Navigation = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <a href="/" className="text-2xl font-bold text-primary">
            Providers Hub
          </a>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-1">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Service Categories</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                    {serviceCategories.map((category) => (
                      <li key={category.name}>
                        <NavigationMenuLink asChild>
                          <a
                            href={category.href}
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">
                              {category.name}
                            </div>
                          </a>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" className="hidden md:inline-flex" asChild>
            <Link to="/login">Login</Link>
          </Button>
          <Button className="hidden lg:inline-flex bg-primary hover:bg-primary/90" asChild>
            <Link to="/signup/freelancer">Join as a Professional</Link>
          </Button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-foreground lg:hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="lg:hidden border-t bg-background">
          <div className="container mx-auto px-4 py-3 space-y-3">
            <div className="flex flex-wrap gap-2">
              {serviceCategories.map((category) => (
                <a
                  key={category.name}
                  href={category.href}
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  {category.name}
                </a>
              ))}
            </div>
            <div className="flex flex-col space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  Login
                </Link>
              </Button>
              <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                <Link to="/signup/freelancer" onClick={() => setMobileOpen(false)}>
                  Join as a Professional
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
