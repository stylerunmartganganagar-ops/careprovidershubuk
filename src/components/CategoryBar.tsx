import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from './ui/button';
import { useCategories } from '../hooks/useCategories';

export function CategoryBar() {
  const { categories, loading, error } = useCategories();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayedCategories = useMemo(() => {
    if (!categories) return [] as typeof categories;
    return categories.slice(0, 16);
  }, [categories]);

  const categoriesPerPage = 8;
  const totalPages = Math.ceil(displayedCategories.length / categoriesPerPage);
  const currentPage = Math.floor(currentIndex / categoriesPerPage);
  
  const visibleCategories = displayedCategories.slice(
    currentIndex, 
    currentIndex + categoriesPerPage
  );

  const canGoLeft = currentIndex > 0;
  const canGoRight = currentIndex + categoriesPerPage < displayedCategories.length;

  const goLeft = () => {
    if (canGoLeft) {
      setCurrentIndex(Math.max(0, currentIndex - categoriesPerPage));
    }
  };

  const goRight = () => {
    if (canGoRight) {
      setCurrentIndex(Math.min(
        displayedCategories.length - categoriesPerPage,
        currentIndex + categoriesPerPage
      ));
    }
  };

  if (loading) {
    return (
      <div className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading categories...
          </div>
        </div>
      </div>
    );
  }

  if (error || displayedCategories.length === 0) {
    return null;
  }

  const handleNavigate = (name: string) => {
    navigate(`/searchresults?service=${encodeURIComponent(name)}`);
  };

  return (
    <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 py-3">
          {/* Left Arrow */}
          {canGoLeft && (
            <Button
              size="sm"
              variant="outline"
              className="flex-shrink-0"
              onClick={goLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          
          {/* Categories - No Scrolling, Single Line */}
          <div className="flex items-center gap-2 flex-1 overflow-hidden">
            {visibleCategories.map((category) => (
              <Button
                key={category.id}
                size="sm"
                variant="secondary"
                className="whitespace-nowrap flex-shrink-0"
                onClick={() => handleNavigate(category.name)}
              >
                {category.name}
              </Button>
            ))}
          </div>
          
          {/* Right Arrow */}
          {canGoRight && (
            <Button
              size="sm"
              variant="outline"
              className="flex-shrink-0"
              onClick={goRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
