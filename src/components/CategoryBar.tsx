import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { Button } from './ui/button';
import { useCategories } from '../hooks/useCategories';

export function CategoryBar() {
  const { categories, loading, error } = useCategories();
  const navigate = useNavigate();

  const displayedCategories = useMemo(() => {
    if (!categories) return [] as typeof categories;
    return categories.slice(0, 16);
  }, [categories]);

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
        <div className="flex items-center gap-2 overflow-x-auto py-3">
          {displayedCategories.map((category) => (
            <Button
              key={category.id}
              size="sm"
              variant="secondary"
              className="whitespace-nowrap"
              onClick={() => handleNavigate(category.name)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
}
