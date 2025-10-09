// Token management utilities
import { decodeJWT, getUserFromToken, JWTPayload } from "./jwtUtils";

export interface TokenInfo {
    access: string | null;
    refresh: string | null;
    isAuthenticated: boolean;
    user?: JWTPayload | null;
}

/**
 * Get current token information from localStorage
 */
export const getTokenInfo = (): TokenInfo => {
    const access =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("authToken");
    const refresh = localStorage.getItem("refreshToken");

    const user = access ? getUserFromToken(access) : null;

    return {
        access,
        refresh,
        isAuthenticated: !!access,
        user,
    };
};

/**
 * Set tokens in localStorage
 */
export const setTokens = (access: string, refresh?: string): void => {
    localStorage.setItem("accessToken", access);
    localStorage.setItem("authToken", access); // backward compatibility

    if (refresh) {
        localStorage.setItem("refreshToken", refresh);
    }
};

/**
 * Clear all tokens from localStorage
 */
export const clearTokens = (): void => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
    return getTokenInfo().isAuthenticated;
};

/**
 * Get the access token
 */
export const getAccessToken = (): string | null => {
    return (
        localStorage.getItem("accessToken") || localStorage.getItem("authToken")
    );
};

/**
 * Get the refresh token
 */
export const getRefreshToken = (): string | null => {
    return localStorage.getItem("refreshToken");
};

/**
 * Check if a JWT token is expired
 */
export const isTokenExpired = (token: string): boolean => {
    const decoded = decodeJWT(token);
    return decoded.isExpired;
};

/**
 * Check if access token is expired
 */
export const isAccessTokenExpired = (): boolean => {
    const accessToken = getAccessToken();
    return accessToken ? isTokenExpired(accessToken) : true;
};

/**
 * Check if refresh token is expired
 */
export const isRefreshTokenExpired = (): boolean => {
    const refreshToken = getRefreshToken();
    return refreshToken ? isTokenExpired(refreshToken) : true;
};

/**
 * Check if user has valid authentication (access token or valid refresh token)
 */
export const hasValidAuthentication = (): boolean => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    // If no tokens at all, not authenticated
    if (!accessToken && !refreshToken) {
        return false;
    }

    // If access token exists and is not expired, authenticated
    if (accessToken && !isTokenExpired(accessToken)) {
        return true;
    }

    // If access token is expired but refresh token is valid, still authenticated
    // (the API interceptor will handle refreshing)
    if (refreshToken && !isTokenExpired(refreshToken)) {
        return true;
    }

    // Both tokens are expired or invalid
    return false;
};
