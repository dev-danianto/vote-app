// src/Components/Chat/MessagesPage.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../supabaseClient"; // Adjust path if needed
import { useAuth } from "./AuthContext"; // Adjust path if needed

import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { MessageSquare, HelpCircle } from "lucide-react"; // Icons for states

function MessagesPage() {
  // --- State ---
  const [messages, setMessages] = useState([]);
  const [currentUserIdentifier, setCurrentUserIdentifier] = useState(null); // Will store Full Name
  const [currentRoomId, setCurrentRoomId] = useState("general"); // Default room
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const { user, profile, logout, loadingAuth, loadingProfile } = useAuth(); // Get profile too
  const subscriptionRef = useRef(null);

  // --- Set Current User Identifier (Full Name Preferred) ---
  useEffect(() => {
    if (!loadingAuth && !loadingProfile) {
      // Wait for both
      if (user && profile?.full_name) {
        const fullName = profile.full_name;
        if (currentUserIdentifier !== fullName) {
          setCurrentUserIdentifier(fullName);
          setError(null);
        }
      } else if (user && user.email) {
        // Fallback
        const emailName = user.email;
        if (currentUserIdentifier !== emailName) {
          setCurrentUserIdentifier(emailName);
          if (!error?.message.includes("profile")) {
            setError(new Error("Using email. Update profile?"));
          }
        }
      } else if (user) {
        // No name/email
        setError(new Error("Cannot determine chat name."));
        setCurrentUserIdentifier(null);
      } else {
        // No user
        setCurrentUserIdentifier(null);
      }
    }
  }, [
    user,
    profile,
    loadingAuth,
    loadingProfile,
    currentUserIdentifier,
    error,
  ]);

  // --- Fetch Initial Messages ---
  const fetchMessages = useCallback(async (roomId) => {
    console.log(`Workspaceing messages for room: ${roomId}`);
    setIsLoadingMessages(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("timestamp", { ascending: true })
        .limit(150);
      if (fetchError) throw fetchError;
      setMessages(data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(new Error(`Msg Load Fail: ${err.message}`));
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // --- Setup Real-time Subscription (Handles Auto Updates) ---
  const setupSubscription = useCallback((roomId) => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current).catch(console.error);
      subscriptionRef.current = null;
    }
    console.log(`Subscribing RT: ${roomId}`);
    try {
      const channel = supabase
        .channel(`room_${roomId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            console.log("RT: New message:", payload.new); // AUTO UPDATE HERE
            setMessages((current) =>
              current.some((msg) => msg.id === payload.new.id)
                ? current
                : [...current, payload.new]
            );
          }
        )
        .subscribe((status, err) => {
          if (status === "SUBSCRIBED") console.log(`RT: Subscribed: ${roomId}`);
          if (status === "CHANNEL_ERROR") {
            console.error(`RT Error ${roomId}:`, err);
            setError(new Error("Chat connection lost."));
          }
          if (status === "TIMED_OUT") console.warn(`RT Timeout ${roomId}.`);
        });
      subscriptionRef.current = channel;
    } catch (subError) {
      console.error("RT Sub Error:", subError);
      setError(new Error("Cannot connect to RT chat."));
    }
    return () => {
      if (subscriptionRef.current) {
        console.log(`RT Unsub: ${roomId}`);
        supabase.removeChannel(subscriptionRef.current).catch(console.error);
        subscriptionRef.current = null;
      }
    };
  }, []);

  // --- Effect to Fetch/Subscribe ---
  useEffect(() => {
    let cleanup = () => {};
    if (
      !loadingAuth &&
      !loadingProfile &&
      currentUserIdentifier &&
      currentRoomId
    ) {
      fetchMessages(currentRoomId);
      cleanup = setupSubscription(currentRoomId);
    } else {
      setMessages([]);
      setIsLoadingMessages(loadingAuth || loadingProfile);
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current).catch(console.error);
        subscriptionRef.current = null;
      }
    }
    return cleanup;
  }, [
    currentRoomId,
    currentUserIdentifier,
    loadingAuth,
    loadingProfile,
    fetchMessages,
    setupSubscription,
  ]);

  // --- Handle Sending Message (Uses Full Name if available) ---
  const handleSendMessage = async (content) => {
    if (!currentUserIdentifier) {
      setError(new Error("Cannot send: User name unavailable."));
      return;
    }
    if (!currentRoomId) {
      /* Handle no room */ return;
    }
    const trimmedContent = content.trim();
    if (trimmedContent === "") return;
    const messageData = {
      sender_name: currentUserIdentifier,
      content: trimmedContent,
      room_id: currentRoomId,
    };
    setIsSending(true);
    setError(null);
    try {
      const { error: insertError } = await supabase
        .from("chat_messages")
        .insert([messageData]);
      if (insertError) throw insertError;
      console.log("Message sent as:", currentUserIdentifier);
    } catch (err) {
      console.error("Send Error:", err);
      let friendlyError = "Failed to send.";
      /* ... specific errors ... */ setError(new Error(friendlyError));
    } finally {
      setIsSending(false);
    }
  };

  // --- Handle Logout ---
  const handleLogout = async () => {
    await logout();
  };

  // --- Render Logic ---
  if (loadingAuth || loadingProfile) {
    /* Loading State */
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-6 bg-white dark:bg-gray-900 h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500 mb-3"></div>
        <p className="text-gray-500 dark:text-gray-400">
          {loadingAuth ? "Authenticating..." : "Loading profile..."}
        </p>
      </div>
    );
  }
  if (!user) {
    /* Not Logged In */
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-6 bg-white dark:bg-gray-900 h-full">
        <MessageSquare
          className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4"
          strokeWidth={1}
        />
        <p className="text-gray-500 dark:text-gray-400">
          Please log in to chat.
        </p>
      </div>
    );
  }
  if (!currentUserIdentifier) {
    /* Cannot Get Identifier */
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-6 text-center bg-yellow-50 dark:bg-gray-800/50 h-full">
        <HelpCircle
          className="h-12 w-12 text-yellow-500 mb-3"
          strokeWidth={1.5}
        />
        <h3 className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">
          Cannot Init Chat
        </h3>
        <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400 max-w-sm">
          Cannot determine display name.{" "}
          {error ? ` Error: ${error.message}` : ""}
        </p>
      </div>
    );
  }

  // --- Main Chat Layout (White Background, Fills Layout) ---
  return (
    <div className="flex flex-col flex-1 w-full h-full max-h-full overflow-hidden bg-white dark:bg-gray-900 shadow-inner">
      <ChatHeader
        roomName={currentRoomId}
        onSettingsClick={() => console.log("Chat settings")}
        onLogoutClick={handleLogout}
      />
      <MessageList
        messages={messages}
        currentUserIdentifier={currentUserIdentifier}
        isLoading={isLoadingMessages}
        error={error}
      />
      <MessageInput onSendMessage={handleSendMessage} isSending={isSending} />
    </div>
  );
}
export default MessagesPage;
