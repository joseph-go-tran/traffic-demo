import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { JWTPayload } from '../lib/jwtUtils';
import {
    getTokenInfo,
    setTokens,
    clearTokens,
    hasValidAuthentication,
    isAccessTokenExpired,
    willTokenExpireSoon
} from '../lib/tokenUtils';
import { apiService } from '../lib/api';

interface AuthContextType {
    isAuthenticated: boolean;
    user: JWTPayload | null;
    accessToken: string | null;
    refreshToken: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshAccessToken: () => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<JWTPayload | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Check authentication status on mount and update state
    useEffect(() => {
        checkAuthStatus();

        // Listen for storage changes (login/logout in other tabs)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'accessToken' || e.key === 'authToken' || e.key === 'refreshToken') {
                checkAuthStatus();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Auto-refresh token when it's about to expire
    useEffect(() => {
        if (!accessToken || !isAuthenticated) return;

        const checkTokenExpiry = setInterval(() => {
            if (accessToken && willTokenExpireSoon(accessToken, 300)) { // 5 minutes before expiry
                refreshAccessToken().catch((err) => {
                    console.error('Failed to refresh token:', err);
                    handleLogout();
                });
            }
        }, 60000); // Check every minute

        return () => clearInterval(checkTokenExpiry);
    }, [accessToken, isAuthenticated]);

    const checkAuthStatus = () => {
        const tokenInfo = getTokenInfo();

        if (!hasValidAuthentication()) {
            if (tokenInfo.access || tokenInfo.refresh) {
                // Tokens exist but are expired
                clearTokens();
            }
            setIsAuthenticated(false);
            setUser(null);
            setAccessToken(null);
            setRefreshToken(null);
        } else {
            setIsAuthenticated(true);
            setUser(tokenInfo.user || null);
            setAccessToken(tokenInfo.access);
            setRefreshToken(tokenInfo.refresh);
        }

        setIsLoading(false);
    };

    const login = async (email: string, password: string) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await apiService.auth.login({ email, password });
            const { access, refresh, user: userData } = response.data;

            setTokens(access, refresh);

            const tokenInfo = getTokenInfo();
            setIsAuthenticated(true);
            setUser(tokenInfo.user || null);
            setAccessToken(access);
            setRefreshToken(refresh);

            setIsLoading(false);
        } catch (err: any) {
            const errorMessage = err?.response?.data?.detail ||
                                err?.response?.data?.message ||
                                'Login failed. Please check your credentials.';
            setError(errorMessage);
            setIsLoading(false);
            throw err;
        }
    };

    const register = async (email: string, password: string, firstName: string, lastName: string) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await apiService.auth.register({
                email,
                password,
                first_name: firstName,
                last_name: lastName
            });

            const { access, refresh } = response.data;

            setTokens(access, refresh);

            const tokenInfo = getTokenInfo();
            setIsAuthenticated(true);
            setUser(tokenInfo.user || null);
            setAccessToken(access);
            setRefreshToken(refresh);

            setIsLoading(false);
        } catch (err: any) {
            const errorMessage = err?.response?.data?.detail ||
                                err?.response?.data?.message ||
                                'Registration failed. Please try again.';
            setError(errorMessage);
            setIsLoading(false);
            throw err;
        }
    };

    const logout = async () => {
        try {
            setIsLoading(true);
            await apiService.auth.logout();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            handleLogout();
        }
    };

    const handleLogout = () => {
        clearTokens();
        setIsAuthenticated(false);
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        setIsLoading(false);
        navigate('/login');
    };

    const refreshAccessToken = async () => {
        const currentRefreshToken = localStorage.getItem('refreshToken');
        if (!currentRefreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await apiService.auth.refreshToken(currentRefreshToken);
            const { access } = response.data;

            setTokens(access, currentRefreshToken);

            const tokenInfo = getTokenInfo();
            setAccessToken(access);
            setUser(tokenInfo.user || null);
        } catch (err) {
            console.error('Token refresh failed:', err);
            handleLogout();
            throw err;
        }
    };

    const value: AuthContextType = {
        isAuthenticated,
        user,
        accessToken,
        refreshToken,
        login,
        register,
        logout,
        refreshAccessToken,
        isLoading,
        error,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
