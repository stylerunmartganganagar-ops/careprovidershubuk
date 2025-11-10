import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useIsPro(buyerId?: string) {
  const [isPro, setIsPro] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        if (!buyerId) {
          setIsPro(false);
          return;
        }
        const { data, error } = await supabase
          .from('buyer_subscriptions')
          .select('status')
          .eq('buyer_id', buyerId)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        if (active) setIsPro(!!data);
      } catch (e) {
        if (active) setIsPro(false);
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [buyerId]);

  return useMemo(() => ({ isPro, loading }), [isPro, loading]);
}
