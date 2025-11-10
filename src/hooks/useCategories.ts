import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface CategoryWithSubcategories {
  id: string;
  name: string;
  description?: string;
  subcategories: {
    id: string;
    name: string;
    description?: string;
  }[];
}

export interface SimpleCategory {
  id: string;
  name: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<CategoryWithSubcategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        
        // Fetch categories with their subcategories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select(`
            id,
            name,
            description,
            subcategories (
              id,
              name,
              description
            )
          `)
          .order('name');

        if (categoriesError) throw categoriesError;

        setCategories(categoriesData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return { categories, loading, error };
}

export function useSimpleCategories() {
  const [categories, setCategories] = useState<SimpleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .order('name');

        if (categoriesError) throw categoriesError;

        setCategories(categoriesData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return { categories, loading, error };
}

export function useSubcategoriesByCategory(categoryId: string | null) {
  const [subcategories, setSubcategories] = useState<SimpleCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }

    async function fetchSubcategories() {
      try {
        setLoading(true);
        setError(null);
        
        const { data: subcategoriesData, error: subcategoriesError } = await supabase
          .from('subcategories')
          .select('id, name')
          .eq('category_id', categoryId)
          .order('name');

        if (subcategoriesError) throw subcategoriesError;

        setSubcategories(subcategoriesData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch subcategories');
      } finally {
        setLoading(false);
      }
    }

    fetchSubcategories();
  }, [categoryId]);

  return { subcategories, loading, error };
}
