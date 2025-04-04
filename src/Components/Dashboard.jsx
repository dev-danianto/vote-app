// Dashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import {
  Clock,
  User,
  ThumbsUp,
  Plus,
  X, // Icon for closing sidebar/removing items
  // Import other icons used in Dashboard layout as needed
  Home, // Example for Home icon
  BarChart2, // Example for Analytics icon
  Edit3, // Example for My Votes icon
  MessageSquare, // Example for Messages icon
  PlusCircle, // Example for Create Vote icon
  User as UserIcon, // Example for Profile icon (alias if User is already used)
  Settings, // Example for Settings icon
  LogOut, // Example for Logout icon
  Menu, // Example for Menu toggle
  Search, // Example for Search icon
  Bell, // Example for Notification icon
  HelpCircle, // Example for Help icon
  Image as ImageIcon, // Placeholder image icon
} from "lucide-react";

// Initialize Supabase client (ensure these are your actual project credentials)
const supabaseUrl = "https://cpzhalbbnvwmmevzzacy.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwemhhbGJibnZ3bW1ldnp6YWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4NzYwNjAsImV4cCI6MjA1NTQ1MjA2MH0.RDAGbKSgcPoMtA7rJRHNa-wnPwdDJzhgwVlxOMZy38A";
const supabase = createClient(supabaseUrl, supabaseKey);

// --- DashboardHome Component ---
// This component shows recent/popular votes on the main dashboard page (`/dashboard`)
const DashboardHome = () => {
  const [recentVotes, setRecentVotes] = useState([]);
  const [popularVotes, setPopularVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch votes data
  const fetchVotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch recent votes (public only)
      const { data: recentData, error: recentError } = await supabase
        .from("votes")
        .select(
          "id, title, description, due_date, image_url, tags, votes_count, profiles(full_name)"
        ) // Select necessary fields + profile name
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(6); // Fetch 6 for a 3-col layout

      if (recentError) throw recentError;
      setRecentVotes(recentData || []);

      // Fetch popular votes (public only, based on 'votes_count')
      // Assumes 'votes_count' is being correctly updated (e.g., via trigger)
      const { data: popularData, error: popularError } = await supabase
        .from("votes")
        .select(
          "id, title, description, due_date, image_url, tags, votes_count, profiles(full_name)"
        )
        .eq("is_public", true)
        .gt("votes_count", 0) // Optionally only show votes with > 0 votes
        .order("votes_count", { ascending: false })
        .limit(6);

      if (popularError) {
        console.warn(
          "Could not fetch popular votes based on 'votes_count':",
          popularError.message
        );
        setPopularVotes([]); // Don't show popular section if error
      } else {
        setPopularVotes(popularData || []);
      }
    } catch (error) {
      console.error("Error fetching votes:", error);
      setError(
        `Failed to load votes: ${error.message}. Please try again later.`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]); // Run fetchVotes on mount

  // Calculate time remaining for a vote
  const getTimeRemaining = (dueDate) => {
    if (!dueDate) return "No deadline";
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due.getTime() - now.getTime();

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days} day${days > 1 ? "s" : ""} left`;

    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} left`;

    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes} min${minutes > 1 ? "s" : ""} left`;
  };

  // --- VoteCard Sub-Component ---
  const VoteCard = React.memo(
    (
      { vote } // Use React.memo for performance if list is long
    ) => (
      <Link to={`/dashboard/votes/${vote.id}`} className="block group h-full">
        <div className="flex flex-col h-full rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg overflow-hidden">
          {/* Image */}
          <div className="h-40 w-full overflow-hidden bg-gray-100 flex-shrink-0">
            {vote.image_url ? (
              <img
                src={vote.image_url}
                alt={vote.title || "Vote image"}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy" // Lazy load images
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-400">
                <ImageIcon className="h-16 w-16 opacity-50" strokeWidth={1} />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 flex flex-col flex-grow">
            <h3 className="mb-2 text-base font-semibold text-gray-800 line-clamp-2 group-hover:text-indigo-600">
              {vote.title || "Untitled Vote"}
            </h3>
            <p className="mb-3 line-clamp-2 text-sm text-gray-600 flex-grow">
              {vote.description || ""} {/* Hide placeholder text */}
            </p>

            {/* Tags */}
            {vote.tags && vote.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {vote.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 whitespace-nowrap"
                  >
                    {tag}
                  </span>
                ))}
                {vote.tags.length > 3 && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 whitespace-nowrap">
                    +{vote.tags.length - 3} more
                  </span>
                )}
              </div>
            )}

            {/* Footer Info */}
            <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 space-x-2">
              <div
                className="flex items-center min-w-0"
                title={`Created by ${vote.profiles?.full_name || "Anonymous"}`}
              >
                <User className="mr-1 h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {vote.profiles?.full_name || "Anonymous"}
                </span>
              </div>
              <div
                className="flex items-center flex-shrink-0"
                title={`Due: ${new Date(vote.due_date).toLocaleString()}`}
              >
                <Clock className="mr-1 h-3 w-3" />
                <span className="whitespace-nowrap">
                  {getTimeRemaining(vote.due_date)}
                </span>
              </div>
              <div
                className="flex items-center flex-shrink-0"
                title={`${vote.votes_count || 0} votes tallied`}
              >
                <ThumbsUp className="mr-1 h-3 w-3" />
                <span>{vote.votes_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  );
  VoteCard.displayName = "VoteCard"; // Add display name for React DevTools

  // --- Loading State ---
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  // --- Main DashboardHome Render ---
  return (
    <div className="space-y-10">
      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Recent Votes Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Recent Votes</h2>
          {/* Link to a page showing all votes (implement later) */}
          <Link
            to="/dashboard/all-votes"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            View All
          </Link>
        </div>
        {recentVotes.length === 0 && !error ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center">
            <p className="text-gray-500">No recent public votes found.</p>
            <p className="text-sm text-gray-400 mt-1">
              Be the first to create one!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recentVotes.map((vote) => (
              <VoteCard key={vote.id} vote={vote} />
            ))}
          </div>
        )}
      </div>

      {/* Popular Votes Section (Only show if there are popular votes) */}
      {popularVotes.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Popular Votes
            </h2>
            <Link
              to="/dashboard/all-votes?sort=popular" // Link to all votes sorted by popularity
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {popularVotes.map((vote) => (
              <VoteCard key={vote.id} vote={vote} />
            ))}
          </div>
        </div>
      )}

      {/* Quick Create Vote Card */}
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white hover:border-indigo-400 transition-colors">
        <Link
          to="/dashboard/create-vote"
          className="block p-6 text-center group"
        >
          <div className="flex flex-col items-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
              <Plus className="h-7 w-7 text-indigo-600" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-gray-800 group-hover:text-indigo-700">
              Create a New Vote
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              Start a new poll and gather opinions easily.
            </p>
            <span className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white group-hover:bg-indigo-700 transition-colors">
              Create Vote Now
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
};

// --- Main Dashboard Component ---
const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const [notifications, setNotifications] = useState(0); // Placeholder notification count
  const [userProfile, setUserProfile] = useState(null);

  // Sidebar navigation items configuration
  const navigation = [
    { name: "Home", href: "/dashboard", icon: Home, current: false }, // Current handled by isActive
    {
      name: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart2,
      current: false,
    },
    {
      name: "My Votes",
      href: "/dashboard/my-votes",
      icon: Edit3,
      current: false,
    },
    {
      name: "Messages",
      href: "/dashboard/messages",
      icon: MessageSquare,
      current: false,
    },
    {
      name: "Create Vote",
      href: "/dashboard/create-vote",
      icon: PlusCircle,
      current: false,
    },
  ];
  const accountNavigation = [
    {
      name: "Profile",
      href: "/dashboard/profile",
      icon: UserIcon,
      current: false,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      current: false,
    },
  ];

  // Fetch user, profile, and check session
  const checkSessionAndFetchData = useCallback(async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session?.user) {
        console.log("No active session, redirecting to login.");
        navigate("/login", { replace: true }); // Use replace to prevent back button issues
        return;
      }

      const currentUser = session.user;
      setUser(currentUser);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, avatar_url") // Select only needed fields
        .eq("id", currentUser.id)
        .maybeSingle(); // Use maybeSingle to handle null profile gracefully

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else if (profileData) {
        setUserProfile(profileData);
        if (profileData.avatar_url) {
          const { data: publicUrlData } = supabase.storage
            .from("avatars") // Ensure 'avatars' is your bucket name
            .getPublicUrl(profileData.avatar_url);

          if (publicUrlData?.publicUrl) {
            setAvatarUrl(
              `${publicUrlData.publicUrl}?t=${new Date().getTime()}`
            ); // Cache bust
          }
        } else {
          setAvatarUrl(null); // Explicitly set to null if no avatar_url
        }
      } else {
        // No profile found, ensure states are null
        setUserProfile(null);
        setAvatarUrl(null);
      }
    } catch (error) {
      console.error("Error during initial check:", error);
      // Consider more robust error handling, maybe redirect to an error page or login
    } finally {
      setLoading(false);
    }
  }, [navigate]); // Add navigate dependency

  useEffect(() => {
    checkSessionAndFetchData();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (_event === "SIGNED_OUT") {
          setUser(null);
          setUserProfile(null);
          setAvatarUrl(null);
          navigate("/login", { replace: true });
        } else if (_event === "SIGNED_IN" || _event === "USER_UPDATED") {
          // Re-fetch data if user signed in or profile might have updated
          setUser(session?.user ?? null);
          if (session?.user) {
            checkSessionAndFetchData(); // Re-run the fetch logic
          }
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [checkSessionAndFetchData, navigate]);

  // --- Logout Handler ---
  const handleLogout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        alert(`Logout failed: ${error.message}`);
        setLoading(false); // Stop loading on error
      }
      // Navigation and state reset is handled by onAuthStateChange listener
    } catch (error) {
      console.error("Unexpected error during logout:", error);
      alert("An unexpected error occurred during logout.");
      setLoading(false); // Stop loading on error
    }
    // setLoading(false) // Might be set too early here, listener handles redirect/state change
  };

  // --- Active Link Check ---
  const isActive = useCallback(
    (path) => {
      // Exact match for root dashboard path
      if (path === "/dashboard") {
        return location.pathname === "/dashboard";
      }
      // StartsWith for nested paths, but not the root itself
      return location.pathname.startsWith(path) && path !== "/dashboard";
    },
    [location.pathname]
  );

  // --- Page Title Logic ---
  const getPageTitle = useCallback(() => {
    const path = location.pathname;
    // Find matching navigation item first for consistent naming
    const mainMatch = navigation.find((item) => isActive(item.href));
    if (mainMatch) return mainMatch.name;
    const accountMatch = accountNavigation.find((item) => isActive(item.href));
    if (accountMatch) return accountMatch.name;

    // Handle dynamic paths or fallbacks
    if (path.startsWith("/dashboard/votes/")) return "Vote Details";
    if (path.startsWith("/dashboard/all-votes")) return "All Votes";
    // Fallback
    return "Dashboard";
  }, [location.pathname, isActive, navigation, accountNavigation]);

  // --- Avatar Display Logic ---
  const getAvatarDisplay = useCallback(
    (sizeClass = "h-10 w-10", textClass = "text-sm") => {
      if (avatarUrl) {
        return (
          <img
            src={avatarUrl}
            alt="Profile Avatar"
            className={`${sizeClass} rounded-full object-cover bg-gray-200`} // Added bg for loading phase
            onError={(e) => {
              // Handle image load errors gracefully
              console.warn("Avatar image failed to load:", avatarUrl);
              e.target.style.display = "none"; // Hide broken image icon
              // Optionally: setAvatarUrl(null); // Fallback to initials if image fails
              // Find the sibling element (initials span) and display it
              const initialsSpan = e.target.nextElementSibling;
              if (initialsSpan) initialsSpan.style.display = "flex";
            }}
            // Style to hide img initially if initials are present as sibling
            style={
              userProfile?.full_name || user?.email ? { display: "block" } : {}
            }
          />
        );
      }

      // Fallback to initials (always render this span, control display via CSS/JS)
      const initials =
        userProfile?.full_name
          ?.split(" ")
          .slice(0, 2) // Max 2 initials
          .map((n) => n[0])
          .join("")
          .toUpperCase() ||
        user?.email?.charAt(0).toUpperCase() ||
        "?"; // Fallback if no name/email

      return (
        <span
          className={`flex items-center justify-center ${sizeClass} rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 font-medium text-white ${textClass}`}
          // Control display based on avatarUrl presence (alternative to onError handler)
          style={avatarUrl ? { display: "none" } : { display: "flex" }}
        >
          {initials}
        </span>
      );
    },
    [avatarUrl, userProfile, user?.email]
  );

  // --- Loading Screen ---
  if (loading && !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600"></div>
          <p className="text-lg font-medium text-gray-700">
            Loading Dashboard...
          </p>
        </div>
      </div>
    );
  }

  // --- Main Dashboard Render ---
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile sidebar toggle button */}
      <div className="fixed bottom-5 right-5 z-50 lg:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform hover:scale-110 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-controls="sidebar"
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-gray-200 bg-white shadow-lg transition-transform duration-300 ease-in-out lg:static lg:inset-auto lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={
          !sidebarOpen &&
          typeof window !== "undefined" &&
          window.innerWidth < 1024
        }
      >
        <div className="flex h-full flex-col overflow-y-auto px-3 py-4">
          {/* Logo and App Name */}
          <div className="mb-6 flex h-16 items-center px-3 flex-shrink-0">
            <Link
              to="/"
              className="flex items-center group focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 rounded-lg"
            >
              {/* Replace with your actual SVG logo if available */}
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md transform transition-transform group-hover:scale-105 flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                VoteApp
              </h1>
            </Link>
          </div>

          {/* User Profile Section */}
          <div className="mb-5 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 p-3 border border-indigo-100 mx-1">
            <div className="flex items-center">
              <Link
                to="/dashboard/profile"
                className="flex-shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {getAvatarDisplay("h-10 w-10", "text-sm")}
              </Link>
              <div className="ml-3 min-w-0 flex-1">
                <h3 className="font-semibold text-sm text-gray-800 truncate">
                  {userProfile?.full_name ||
                    user?.email?.split("@")[0] ||
                    "User"}
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || "No email"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 space-y-6 overflow-y-auto">
            {/* Main Menu */}
            <div>
              <div className="mb-2 px-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Menu
                </h2>
              </div>
              <nav className="space-y-1 px-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => sidebarOpen && setSidebarOpen(false)} // Close sidebar on mobile click
                    className={`group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                      isActive(item.href)
                        ? "bg-indigo-100 text-indigo-800 font-semibold shadow-sm"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive(item.href)
                          ? "text-indigo-600"
                          : "text-gray-400 group-hover:text-gray-500"
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Account Menu */}
            <div>
              <div className="mb-2 px-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Account
                </h2>
              </div>
              <nav className="space-y-1 px-1">
                {accountNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => sidebarOpen && setSidebarOpen(false)}
                    className={`group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                      isActive(item.href)
                        ? "bg-indigo-100 text-indigo-800 font-semibold shadow-sm"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive(item.href)
                          ? "text-indigo-600"
                          : "text-gray-400 group-hover:text-gray-500"
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Logout Button */}
          <div className="mt-auto pt-6 px-1 pb-2 flex-shrink-0">
            <button
              onClick={handleLogout}
              disabled={loading}
              className="flex w-full items-center justify-center rounded-md px-3 py-2.5 text-sm font-medium text-red-700 bg-red-50 transition-colors hover:bg-red-100 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50"
            >
              <LogOut className="mr-2 h-5 w-5" aria-hidden="true" />
              {loading ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-900 bg-opacity-50 transition-opacity duration-300 ease-in-out lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8 shadow-sm">
          {/* Left side: Hamburger (mobile) + Page Title */}
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-3 rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden"
              aria-label="Toggle sidebar"
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 whitespace-nowrap">
              {getPageTitle()}
            </h1>
          </div>

          {/* Right side: Search, Actions, Profile */}
          <div className="flex items-center space-x-3 md:space-x-4">
            {/* Search (Consider implementing search logic) */}
            <div className="hidden md:block">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search
                    className="h-4 w-4 text-gray-400"
                    aria-hidden="true"
                  />
                </span>
                <input
                  type="search"
                  id="desktop-search-vote"
                  placeholder="Search votes..."
                  aria-label="Search votes"
                  className="block w-48 lg:w-64 rounded-md border border-gray-300 bg-white py-1.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Notifications (Implement notification fetching) */}
            <button className="relative rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1">
              <span className="sr-only">View notifications</span>
              <Bell className="h-5 w-5" aria-hidden="true" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white pointer-events-none">
                  {notifications > 9 ? "9+" : notifications}
                </span>
              )}
            </button>

            {/* Quick Create Vote Button */}
            <Link
              to="/dashboard/create-vote"
              className="hidden sm:inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <Plus className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
              New Vote
            </Link>

            {/* User Profile Link/Dropdown Trigger */}
            <div className="relative">
              <Link
                to="/dashboard/profile"
                className="block h-8 w-8 overflow-hidden rounded-full ring-2 ring-offset-1 ring-indigo-200 transition-all hover:ring-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                aria-label="View Profile"
              >
                {getAvatarDisplay("h-full w-full", "text-xs")}
              </Link>
              {/* Potential dropdown menu can be added here */}
            </div>

            {/* Help Button (Optional) */}
            <button className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1">
              <span className="sr-only">Help</span>
              <HelpCircle className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Main scrollable content */}
        <main
          className="flex-1 overflow-y-auto bg-gray-100 focus:outline-none"
          tabIndex={-1}
        >
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              {" "}
              {/* Consistent max-width */}
              {/* Render DashboardHome for the root path, otherwise Outlet for nested routes */}
              {location.pathname === "/dashboard" ? (
                <DashboardHome />
              ) : (
                <Outlet />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
