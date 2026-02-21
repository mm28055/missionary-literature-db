'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './login.module.css';

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const supabase = createClient();
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError(authError.message);
                setLoading(false);
                return;
            }

            const redirect = searchParams.get('redirect') || '/admin';
            router.push(redirect);
            router.refresh();
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className={`${styles['login-card']} animate-fade-in`}>
            <div className={styles['login-header']}>
                <span className={styles['login-icon']}>🔐</span>
                <h1>Admin Login</h1>
                <p>Sign in to manage the literature database</p>
            </div>

            <form className={styles['login-form']} onSubmit={handleLogin}>
                {error && <div className={styles['login-error']}>{error}</div>}

                <div className="form-group">
                    <label className="form-label" htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        className="form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@example.com"
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        className="form-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className={`btn btn-primary ${styles['login-submit']}`}
                    disabled={loading}
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>

            <div className={styles['login-footer']}>
                <a href="/" style={{ color: 'var(--text-muted)' }}>← Back to home</a>
            </div>
        </div>
    );
}
