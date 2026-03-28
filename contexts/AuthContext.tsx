/**
 * contexts/AuthContext.tsx
 * Quản lý trạng thái đăng nhập toàn app.
 * Hỗ trợ: Google Sign-In, Dùng Không Đăng Nhập (Guest), Đăng Xuất.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    AuthUser,
    loginWithGoogle as apiLoginWithGoogle,
    getStoredAuth,
    logout as apiLogout,
    isTokenExpired,
} from '../services/authService';

// ── Types ────────────────────────────────────────────────────────────────────

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    isLoggedIn: boolean;
    isGuest: boolean;           // true nếu user chọn "Dùng không đăng nhập"
    isAuthLoading: boolean;     // true khi đang check trạng thái ban đầu
    loginWithGoogle: (googleIdToken: string) => Promise<void>;
    continueAsGuest: () => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    // Load trạng thái auth lúc app khởi động
    useEffect(() => {
        const loadAuth = async () => {
            try {
                const stored = await getStoredAuth();

                if (stored.token && stored.user) {
                    // Kiểm tra token còn hạn không
                    if (!isTokenExpired(stored.token)) {
                        setUser(stored.user);
                        setToken(stored.token);
                    } else {
                        // Token hết hạn → xoá và yêu cầu đăng nhập lại
                        console.log('[Auth] Token expired, clearing...');
                        await apiLogout();
                    }
                }
            } catch (e) {
                console.error('[Auth] Failed to load auth state:', e);
            } finally {
                setIsAuthLoading(false);
            }
        };
        loadAuth();
    }, []);

    const loginWithGoogle = async (googleIdToken: string) => {
        const result = await apiLoginWithGoogle(googleIdToken);
        setUser(result.user);
        setToken(result.token);
        setIsGuest(false);
    };

    const continueAsGuest = () => {
        setIsGuest(true);
        setUser(null);
        setToken(null);
    };

    const logout = async () => {
        await apiLogout();
        setUser(null);
        setToken(null);
        setIsGuest(false);
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isLoggedIn: !!user && !!token,
            isGuest,
            isAuthLoading,
            loginWithGoogle,
            continueAsGuest,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
