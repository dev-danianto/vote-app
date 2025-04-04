// App.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Scrollbar from "smooth-scrollbar";
import "./fonts/fonts.css";

// Import components
import Navbar from "./Components/Navbar";
import HomePage from "./Components/HomePage";
import Login from "./Components/Login";
import Register from "./Components/Register";

// Import Dashboard and its nested components
import Dashboard from "./Components/Dashboard";
import DashboardHome from "./Components/DashboardHome";
import Profile from "./Components/Profile";
import Settings from "./Components/Settings";
import CreateVote from "./Components/CreateVote";
import VoteDetailPage from "./Components/VoteDetailPage";
import VotesList from "./Components/VotesList";
import VotingAnalytics from "./Components/VotingAnalytics";
import MyVotes from "./Components/MyVotes";
// V V V V V V V V V V V V V V V V V V V V V V V V
// Updated Import Path:
import MessagesPage from "./Components/MessagesPage";
// ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^

// Import the ProtectedRoute component
import ProtectedRoute from "./Components/ProtectedRoute";

// Import the AuthProvider
import { AuthProvider } from "./Components/AuthContext"; // Ensure path is correct

const App = () => {
  // ... (rest of your existing state and useEffect logic remains the same) ...
  const [language, setLanguage] = useState("id");
  const location = useLocation();

  const toggleLanguage = () =>
    setLanguage((prev) => (prev === "id" ? "en" : "id"));

  const authPages = ["/login", "/register", "/dashboard"];
  const isAuthPage = authPages.some((page) => location.pathname.includes(page));

  const containerStyle = isAuthPage
    ? { minHeight: "100vh", overflowY: "auto", width: "100%" } // Keep dashboard scroll native
    : { minHeight: "100vh", overflow: "hidden", width: "100%" };

  useEffect(() => {
    let scrollbarInstance = null;
    const container = document.getElementById("scroll-container");

    // Clear previous scrollbar/styles first
    if (container && Scrollbar.get(container)) {
      Scrollbar.get(container).destroy();
    }
    if (container) {
      container.style.overflow = ""; // Reset overflow style
    }

    if (!isAuthPage && container) {
      try {
        scrollbarInstance = Scrollbar.init(container, {
          damping: 0.08,
          // delegateTo: document, // Consider removing if causing issues, default is fine
        });
        // Ensure smooth-scrollbar sets overflow: hidden if it's managing scroll
        // container.style.overflow = 'hidden';
      } catch (error) {
        console.error("Failed to initialize scrollbar:", error);
        container.style.overflowY = "auto"; // Fallback
      }
    } else if (container) {
      // Explicitly set native scroll for auth/dashboard pages
      container.style.overflowY = "auto";
    }

    return () => {
      if (scrollbarInstance) {
        scrollbarInstance.destroy();
      }
      // Reset overflow when component unmounts or isAuthPage changes might be needed
      // if (container) container.style.overflow = '';
    };
  }, [isAuthPage]);

  const hideNavbarRoutes = ["/login", "/register", "/dashboard"];
  const showNavbar = !hideNavbarRoutes.some((route) =>
    location.pathname.includes(route)
  );

  return (
    <AuthProvider>
      {" "}
      {/* Ensure AuthProvider wraps everything */}
      <div id="scroll-container" style={containerStyle}>
        {showNavbar && (
          <Navbar language={language} toggleLanguage={toggleLanguage} />
        )}

        <Routes>
          {/* ... (other routes like HomePage, Login, Register remain the same) ... */}
          <Route path="/" element={<HomePage language={language} />} />
          <Route path="/beranda/*" element={<HomePage language={language} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Dashboard with nested routes */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Dashboard language={language} />
              </ProtectedRoute>
            }
          >
            {/* Nested Dashboard Routes */}
            <Route index element={<DashboardHome />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="create-vote" element={<CreateVote />} />
            <Route path="votes" element={<VotesList />} />
            <Route path="votes/:id" element={<VoteDetailPage />} />
            <Route path="analytics" element={<VotingAnalytics />} />
            <Route path="my-votes" element={<MyVotes />} />
            {/* V V V V V V V V V V V V V V V V V V V V V V V V */}
            {/* Use the imported MessagesPage component */}
            <Route path="messages" element={<MessagesPage />} />
            {/* ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ */}
          </Route>

          {/* ... (other non-dashboard routes remain the same) ... */}
          <Route path="/profil/*" element={<HomePage language={language} />} />
          <Route
            path="/informasi/*"
            element={<HomePage language={language} />}
          />
          <Route path="/layanan/*" element={<HomePage language={language} />} />
          <Route path="/kontak/*" element={<HomePage language={language} />} />
        </Routes>
      </div>
    </AuthProvider>
  );
};

export default App;
