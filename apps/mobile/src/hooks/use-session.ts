import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type SessionState =
  | { status: 'loading'; session: null }
  | { status: 'ready'; session: Session | null };

/**
 * Subscribes to the Supabase auth session. Resolves once on mount with the
 * current session from secure storage, then listens for sign-in / sign-out /
 * refresh events. Components can branch on `state.session` once
 * `state.status === 'ready'`.
 */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    status: 'loading',
    session: null,
  });

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setState({ status: 'ready', session: data.session });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setState({ status: 'ready', session });
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
