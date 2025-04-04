import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "YOUR URL KEY";
const supabaseKey = "YOUR API KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get the current session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth check error:", error);
          setAuthenticated(false);
        } else {
          setAuthenticated(!!session); // Set to true if session exists, false otherwise
        }
      } catch (error) {
        console.error("Unexpected auth error:", error);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Set up listener for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthenticated(!!session); // Update authentication state when it changes
      }
    );

    // Clean up the subscription
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Show a loading indicator while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render the protected content if authenticated
  return children;
};

export default ProtectedRoute;
