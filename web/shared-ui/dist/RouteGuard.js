import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { auth, getJwtToken, setJwtToken } from './api-client';
export const RouteGuard = ({ children, redirectTo = '/login' }) => {
    // const navigate = useNavigate() // Commented out router dependency
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    useEffect(() => {
        const checkAuth = async () => {
            // First check if we have a token in memory
            if (getJwtToken()) {
                setIsAuthenticated(true);
                return;
            }
            // Try to remember (exchange cookie for JWT)
            try {
                const response = await auth.remember();
                if (response && response.token) {
                    setJwtToken(response.token);
                    setIsAuthenticated(true);
                }
                else {
                    setIsAuthenticated(false);
                }
            }
            catch (error) {
                console.warn('Remember me failed:', error);
                setIsAuthenticated(false);
            }
            if (!getJwtToken()) {
                // Redirect to login page
                window.location.href = redirectTo;
            }
        };
        checkAuth();
    }, [redirectTo]);
    // Show loading while checking authentication
    if (isAuthenticated === null) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx("div", { className: "text-lg", children: "Loading..." }) }));
    }
    // Show children if authenticated
    if (isAuthenticated) {
        return _jsx(_Fragment, { children: children });
    }
    // This shouldn't render as we navigate away, but just in case
    return null;
};
