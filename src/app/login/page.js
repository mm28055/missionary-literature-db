'use client';

import { Suspense } from 'react';
import LoginForm from './LoginForm';
import styles from './login.module.css';

export default function LoginPage() {
    return (
        <div className={`page-content ${styles['login-page']}`}>
            <Suspense fallback={
                <div className={`${styles['login-card']} animate-fade-in`}>
                    <div className={styles['login-header']}>
                        <span className={styles['login-icon']}>🔐</span>
                        <h1>Admin Login</h1>
                        <p>Loading...</p>
                    </div>
                </div>
            }>
                <LoginForm />
            </Suspense>
        </div>
    );
}
