import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  location: string;
  setLocation: (location: string) => void;
  suggestions: string[];
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  performSearch: (searchTerm?: string) => void;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

const staticSuggestions = [
  'CQC Registration',
  'Healthcare Compliance Audit',
  'Care Home Licensing',
  'Regulatory Documentation',
  'Compliance Consulting',
  'CQC Inspection Preparation',
  'Healthcare Setup Consulting',
  'Nursing Home Registration',
  'Medical Compliance Services',
  'Healthcare Regulatory Support',
  'Care Quality Commission',
  'Nursing Home Compliance',
  'Healthcare Documentation',
  'Regulatory Compliance',
  'Care Home Setup'
];

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allSuggestions, setAllSuggestions] = useState<string[]>(staticSuggestions);
  const navigate = useNavigate();

  // Load categories and subcategories for suggestions
  useEffect(() => {
    let isMounted = true;

    const loadSuggestions = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('name, subcategories(name)')
          .order('name');

        if (error) throw error;

        const collected = new Set<string>(staticSuggestions);

        (data || []).forEach((category: any) => {
          if (category?.name) {
            collected.add(category.name);
          }

          const subs = category?.subcategories || [];
          subs.forEach((sub: any) => {
            if (sub?.name) {
              collected.add(sub.name);
            }
          });
        });

        if (isMounted) {
          setAllSuggestions(Array.from(collected));
        }
      } catch (err) {
        console.error('Failed to load search suggestions', err);
      }
    };

    loadSuggestions();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter suggestions based on search query
  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = allSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5)); // Limit to 5 suggestions
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, allSuggestions]);

  const performSearch = (searchTerm?: string) => {
    const termToUse = searchTerm || searchQuery;
    if (termToUse.trim()) {
      const params = new URLSearchParams();
      params.set('service', termToUse.trim());
      if (location.trim()) {
        params.set('location', location.trim());
      }
      navigate(`/searchresults?${params.toString()}`);
      setShowSuggestions(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setLocation('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSetSearchQuery = (query: string) => {
    setSearchQuery(query);
  };

  const handleSetLocation = (loc: string) => {
    setLocation(loc);
  };

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery: handleSetSearchQuery,
        location,
        setLocation: handleSetLocation,
        suggestions,
        showSuggestions,
        setShowSuggestions,
        performSearch,
        clearSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
