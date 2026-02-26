import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        // Return a chainable mock client when Supabase is not configured (e.g. during SSR prerender)
        const createChainable = () => {
            const result = { data: [], error: null };
            const handler = {
                get(target, prop) {
                    if (prop === 'then') {
                        return (resolve) => resolve(result);
                    }
                    if (prop === 'data') return [];
                    if (prop === 'error') return null;
                    // Any method call returns the proxy itself for chaining
                    return (...args) => new Proxy({}, handler);
                }
            };
            return new Proxy({}, handler);
        };

        return {
            auth: {
                getUser: async () => ({ data: { user: null }, error: null }),
                signInWithPassword: async () => ({
                    data: null,
                    error: { message: 'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local' },
                }),
                signOut: async () => ({}),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            },
            from: () => createChainable(),
        };
    }

    return createBrowserClient(url, key);
}
