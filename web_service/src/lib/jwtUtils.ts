// JWT Utilities for decoding and validating JWT tokens

export interface JWTPayload {
    token_type: string;
    exp: number;
    iat: number;
    jti: string;
    user_id: number;
    email: string;
    first_name: string;
    last_name: string;
    username: string;
    is_staff: boolean;
}

export interface DecodedToken {
    payload: JWTPayload | null;
    isValid: boolean;
    isExpired: boolean;
    expiresAt?: Date;
    issuedAt?: Date;
}

/**
 * Decode a JWT token (client-side only - not for verification)
 * Note: This only decodes the token, it does NOT verify the signature
 */
export const decodeJWT = (token: string): DecodedToken => {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) {
            return {
                payload: null,
                isValid: false,
                isExpired: true,
            };
        }

        // Decode the payload (middle part)
        const payload = JSON.parse(atob(parts[1])) as JWTPayload;
        const currentTime = Math.floor(Date.now() / 1000);
        const isExpired = payload.exp < currentTime;

        return {
            payload,
            isValid: true,
            isExpired,
            expiresAt: new Date(payload.exp * 1000),
            issuedAt: new Date(payload.iat * 1000),
        };
    } catch (error) {
        console.error("Error decoding JWT:", error);
        return {
            payload: null,
            isValid: false,
            isExpired: true,
        };
    }
};

/**
 * Get user information from JWT token
 */
export const getUserFromToken = (token: string): JWTPayload | null => {
    const decoded = decodeJWT(token);
    return decoded.isValid ? decoded.payload : null;
};

/**
 * Check if token is expired
 */
export const isTokenExpiredJWT = (token: string): boolean => {
    const decoded = decodeJWT(token);
    return decoded.isExpired;
};

/**
 * Get time until token expiration in seconds
 */
export const getTokenTimeToExpire = (token: string): number => {
    const decoded = decodeJWT(token);
    if (!decoded.isValid || !decoded.payload) {
        return 0;
    }
    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, decoded.payload.exp - currentTime);
};

/**
 * Check if token will expire soon (within next 5 minutes)
 */
export const willTokenExpireSoon = (
    token: string,
    withinSeconds: number = 300
): boolean => {
    const timeToExpire = getTokenTimeToExpire(token);
    return timeToExpire > 0 && timeToExpire < withinSeconds;
};

/**
 * Format token expiration time as a readable string
 */
export const formatTokenExpiration = (token: string): string => {
    const decoded = decodeJWT(token);
    if (!decoded.isValid || !decoded.expiresAt) {
        return "Invalid token";
    }

    if (decoded.isExpired) {
        return "Expired";
    }

    const timeToExpire = getTokenTimeToExpire(token);
    const hours = Math.floor(timeToExpire / 3600);
    const minutes = Math.floor((timeToExpire % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};
