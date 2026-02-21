import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        // Return a mock client when Supabase is not configured
        const noopQuery = () => ({
            order: function () { return this; },
            eq: function () { return this; },
            single: function () { return this; },
            select: function () { return this; },
            data: [],
            error: null,
            then: (resolve) => resolve({ data: [], error: null }),
        });
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
            from: () => ({
                select: noopQuery,
                insert: noopQuery,
                update: noopQuery,
                delete: noopQuery,
            }),
        };
    }

    return createBrowserClient(url, key);
}
