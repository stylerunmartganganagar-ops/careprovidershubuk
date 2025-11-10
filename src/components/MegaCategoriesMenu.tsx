import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';

export function MegaCategoriesMenu() {
  const { categories, loading, error } = useCategories();
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep a stable list so layout does not jitter
  const topRow = useMemo(() => {
    return (categories || []).slice(0, 10);
  }, [categories]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  // Close on outside hover leave
  const handleMouseLeave = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY;
    if (y < rect.top || y > rect.bottom) {
      setOpen(false);
      setActiveId(null);
    }
  };

  const openCategory = (id: string) => {
    setActiveId(id);
    setOpen(true);
  };

  const goTo = (text: string) => {
    navigate(`/searchresults?service=${encodeURIComponent(text)}`);
    setOpen(false);
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

  if (error || !categories || categories.length === 0) return null;

  const active = categories.find(c => c.id === activeId) || null;

  return (
    <div
      className="relative select-none border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80"
      ref={containerRef}
      onMouseLeave={handleMouseLeave}
    >
      <div className="container mx-auto px-4">
        {/* Top row category strip */}
        <div className="flex items-center gap-6 overflow-x-auto py-3 text-sm">
          {topRow.map((cat) => (
            <button
              key={cat.id}
              className={`inline-flex items-center gap-1 whitespace-nowrap hover:text-blue-700 ${
                activeId === cat.id && open ? 'text-blue-700' : 'text-gray-800'
              }`}
              onMouseEnter={() => openCategory(cat.id)}
              onFocus={() => openCategory(cat.id)}
              onClick={() => goTo(cat.name)}
            >
              {cat.name}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Mega dropdown */}
      {open && active && (
        <div className="absolute left-0 right-0 top-full z-40 border-t bg-white shadow-lg">
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Primary column with category title */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">{active.name}</h4>
                <ul className="space-y-2">
                  {/* Link to whole category */}
                  <li>
                    <button
                      className="text-sm text-blue-700 hover:underline"
                      onClick={() => goTo(active.name)}
                    >
                      Explore all in {active.name}
                    </button>
                  </li>
                </ul>
              </div>

              {/* Spread subcategories across remaining columns */}
              {Array.from({ length: 3 }).map((_, colIdx) => {
                const subs = active.subcategories || [];
                const perCol = Math.ceil(subs.length / 3) || 0;
                const start = colIdx * perCol;
                const end = start + perCol;
                const slice = subs.slice(start, end);
                return (
                  <div key={colIdx}>
                    <h5 className="font-medium text-gray-700 mb-2">Subcategories</h5>
                    <ul className="space-y-2">
                      {slice.map((s) => (
                        <li key={s.id}>
                          <button
                            className="text-sm text-gray-700 hover:text-blue-700 hover:underline"
                            onClick={() => goTo(s.name)}
                          >
                            {s.name}
                          </button>
                        </li>
                      ))}
                      {slice.length === 0 && (
                        <li className="text-sm text-gray-400">No items</li>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
