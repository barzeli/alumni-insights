import { createContext, useState, useContext, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useGoogleLogin } from "@react-oauth/google";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [googleAccessToken, setGoogleAccessToken] = useState(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("auth_user");
    const savedToken = localStorage.getItem("google_access_token");
    const savedExpiresAt = localStorage.getItem("google_token_expires_at");

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        if (savedToken) {
          setGoogleAccessToken(savedToken);
        }
        if (savedExpiresAt) {
          setTokenExpiresAt(parseInt(savedExpiresAt, 10));
        }
      } catch {
        localStorage.removeItem("auth_user");
        localStorage.removeItem("google_access_token");
        localStorage.removeItem("google_token_expires_at");
      }
    }
    setIsLoadingAuth(false);
  }, []);

  const loginWithToken = (tokenResponse) => {
    console.log("Logged in with token response:", tokenResponse);

    // Calculate expiration
    const expiresAt = Date.now() + tokenResponse.expires_in * 1000;
    setGoogleAccessToken(tokenResponse.access_token);
    setTokenExpiresAt(expiresAt);

    localStorage.setItem("google_access_token", tokenResponse.access_token);
    localStorage.setItem("google_token_expires_at", expiresAt.toString());

    // Fetch user info using the access token since we don't have an ID token here
    fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
    })
      .then((res) => res.json())
      .then((userData) => {
        const user = {
          id: userData.sub,
          name: userData.name,
          email: userData.email,
          picture: userData.picture,
        };
        setUser(user);
        setIsAuthenticated(true);
        localStorage.setItem("auth_user", JSON.stringify(user));
      })
      .catch((err) => {
        console.error("Failed to fetch user info", err);
        setAuthError({
          type: "user_info_failed",
          message: "Failed to fetch user info",
        });
      });
  };

  const login = (credential) => {
    try {
      const decoded = jwtDecode(credential);
      const userData = {
        id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
      };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem("auth_user", JSON.stringify(userData));
    } catch {
      setAuthError({
        type: "login_failed",
        message: "Failed to decode google token",
      });
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: loginWithToken,
    onError: (error) => console.log("Login Failed:", error),
    scope:
      "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets.readonly",
  });

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setGoogleAccessToken(null);
    setTokenExpiresAt(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("google_access_token");
    localStorage.removeItem("google_token_expires_at");
  };

  const isTokenExpired = () => {
    if (!googleAccessToken || !tokenExpiresAt) return true;
    // Buffer of 5 minutes before actual expiration
    return Date.now() > tokenExpiresAt - 5 * 60 * 1000;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        authError,
        googleAccessToken,
        tokenExpiresAt,
        isTokenExpired,
        login,
        googleLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
