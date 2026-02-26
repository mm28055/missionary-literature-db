import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request) {
    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // Skip auth when Supabase is not configured
        if (!url || !key) {
            if (request.nextUrl.pathname.startsWith('/admin')) {
                const redirectUrl = request.nextUrl.clone();
                redirectUrl.pathname = '/login';
                return NextResponse.redirect(redirectUrl);
            }
            return NextResponse.next();
        }

        let supabaseResponse = NextResponse.next({ request });

        const supabase = createServerClient(url, key, {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        });

        // Refresh the session
        let user = null;
        try {
            const { data } = await supabase.auth.getUser();
            user = data?.user ?? null;
        } catch (e) {
            // Supabase unreachable — continue without auth
        }

        // Protect admin routes
        if (request.nextUrl.pathname.startsWith('/admin') && !user) {
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = '/login';
            redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
            return NextResponse.redirect(redirectUrl);
        }

        return supabaseResponse;
    } catch (e) {
        // If anything fails, just pass through — never crash the middleware
        return NextResponse.next();
    }
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
