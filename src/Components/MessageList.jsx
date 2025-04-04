// src/Components/Chat/MessageList.jsx
import React, { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import { ScaleLoader } from "react-spinners";
import { MessageSquare, AlertTriangle } from "lucide-react";

function MessageList({ messages, currentUserIdentifier, isLoading, error }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Scroll down smoothly
    if (!isLoading) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages, isLoading]);

  if (isLoading) {
    /* Loading State (White BG) */
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900">
        <ScaleLoader
          color="#4f46e5"
          loading={isLoading}
          height={25}
          width={4}
          radius={2}
          margin={2}
        />
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Loading...
        </p>
      </div>
    );
  }
  if (error) {
    /* Error State (White/Red BG) */
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-red-50 dark:bg-gray-900">
        <AlertTriangle
          className="h-10 w-10 text-red-400 mb-3"
          strokeWidth={1.5}
        />
        <p className="text-red-700 dark:text-red-300 font-medium">Chat Error</p>
        <p className="mt-1 text-sm text-red-500 dark:text-red-400 max-w-md">
          {error.message || "Error."}
        </p>
      </div>
    );
  }
  if (!messages || messages.length === 0) {
    /* Empty State (White BG) */
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-gray-900">
        <MessageSquare
          className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4"
          strokeWidth={1}
        />
        <p className="text-lg text-gray-500 dark:text-gray-400">
          It's quiet...
        </p>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          Send a message!
        </p>
      </div>
    );
  }

  // Message List Rendering (White BG, Scrolls)
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-white dark:bg-gray-900 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
      {messages.map((msg) => (
        <ChatMessage
          key={msg.id}
          message={msg}
          isSender={msg.sender_name === currentUserIdentifier}
        />
      ))}
      <div ref={messagesEndRef} className="h-1" />
    </div>
  );
}
export default React.memo(MessageList);
