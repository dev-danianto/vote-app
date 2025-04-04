// src/Components/AuthContext.jsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
// Import the shared Supabase client
import { supabase } from "../supabaseClient"; // <-- Adjust path if needed

// Create the auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // <-- Add state for profile
  const [loadingAuth, setLoadingAuth] = useState(true); // Renamed for clarity
  const [loadingProfile, setLoadingProfile] = useState(false); // Separate loading for profile

  // --- Function to fetch profile ---
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    console.log("AuthContext: Fetching profile for user:", userId);
    setLoadingProfile(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles") // Your profiles table name
        .select("full_name, avatar_url") // Add any other profile fields needed globally
        .eq("id", userId)
        .single(); // Expect only one profile per user ID

      if (profileError && profileError.code !== "PGRST116") {
        // Ignore 'resource not found' error if profile is optional
        throw profileError;
      }
      console.log("AuthContext: Profile data fetched:", profileData);
      setProfile(profileData || null); // Set profile or null if not found
    } catch (error) {
      console.error("AuthContext: Error fetching profile:", error);
      setProfile(null); // Clear profile on error
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  // --- Effect for Session Check and Auth State Changes ---
  useEffect(() => {
    setLoadingAuth(true);
    // Check for existing session on initial load
    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;

        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id); // Fetch profile immediately if session exists
        } else {
          setProfile(null); // Clear profile if no session
        }
      } catch (error) {
        console.error("AuthContext: Session check error:", error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoadingAuth(false); // Auth check complete
      }
    };
    getSession();

    // Set up listener for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        const currentUserId = user?.id; // Get previous user id
        setUser(currentUser);

        // Fetch profile only if user ID changes or user logs in
        if (currentUser && currentUser.id !== currentUserId) {
          await fetchProfile(currentUser.id);
        } else if (!currentUser) {
          setProfile(null); // Clear profile on logout
        }
        // Optional: Reset loading states if needed, though might cause flickers
        // setLoadingAuth(false);
        // setLoadingProfile(false); // fetchProfile handles its own loading
      }
    );

    // Clean up subscription
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchProfile, user?.id]); // Re-run if fetchProfile changes or user.id changes

  // --- Auth methods remain the same, using the imported 'supabase' ---
  const login = async (email, password) => {
    /* ... */ try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  };
  const loginWithProvider = async (provider) => {
    /* ... */ try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error(`${provider} login error:`, error);
      return { success: false, error: error.message };
    }
  };
  const register = async (email, password) => {
    /* ... */ try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: error.message };
    }
  };
  const logout = async () => {
    /* ... */ try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: error.message };
    }
  };
  const resetPassword = async (email) => {
    /* ... */ try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Password reset error:", error);
      return { success: false, error: error.message };
    }
  };

  // Context value provided, including profile and its loading state
  const value = {
    user,
    profile, // <-- Provide profile data
    loadingAuth, // Initial auth check loading
    loadingProfile, // Profile fetch loading
    login,
    loginWithProvider,
    register,
    logout,
    resetPassword,
    isAuthenticated: !!user && !loadingAuth, // Base on user presence after initial check
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Render children only after the initial auth loading is complete */}
      {!loadingAuth && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
