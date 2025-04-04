// src/Components/Chat/ChatMessage.jsx
import React from "react";
import { formatDistanceToNow, format } from "date-fns"; // Ensure installed

const formatTimestamp = (timestamp) => {
  // Formats time nicely
  if (!timestamp) return "";
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "Invalid date";
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) return formatDistanceToNow(date, { addSuffix: true });
    else if (diffHours < 48) return `Yesterday at ${format(date, "p")}`;
    else return format(date, "MMM d, yyyy 'at' p");
  } catch (error) {
    console.error("Timestamp Error:", error);
    return "Invalid date";
  }
};

function ChatMessage({ message, isSender }) {
  if (!message || !message.content || !message.sender_name) return null; // Basic validation

  const { content, sender_name, timestamp } = message;
  const bubbleBase =
    "max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg px-4 py-2.5 rounded-xl shadow-md transition-shadow duration-200";
  const timeBase = "text-xs mt-1.5 text-right";
  const alignment = isSender ? "justify-end" : "justify-start";
  const bubbleStyle = isSender
    ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-none hover:shadow-lg"
    : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none hover:shadow-md border border-gray-100 dark:border-gray-600";
  const timeStyle = isSender
    ? "text-indigo-100 opacity-90"
    : "text-gray-400 dark:text-gray-500";
  const animClass = "animate-fade-in"; // Ensure defined in CSS

  return (
    <div className={`flex ${alignment} mb-3 ${animClass}`}>
      {/* Receiver Avatar */}
      {!isSender && (
        <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 mr-2 mt-0.5 flex-shrink-0 flex items-center justify-center text-[10px] font-semibold text-gray-500 dark:text-gray-300 uppercase">
          {sender_name ? sender_name.charAt(0) : "?"}
        </div>
      )}
      {/* Bubble */}
      <div className={`${bubbleBase} ${bubbleStyle}`}>
        {/* Sender Name (Receiver side only) - Displays FULL NAME now */}
        {!isSender && (
          <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-0.5 break-words">
            {sender_name}
          </p>
        )}
        {/* Content */}
        <p className="text-sm break-words leading-snug">{content}</p>
        {/* Timestamp */}
        <p className={`${timeBase} ${timeStyle}`}>
          {formatTimestamp(timestamp)}
        </p>
      </div>
      {/* Sender Avatar */}
      {isSender && (
        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 ml-2 mt-0.5 flex-shrink-0 flex items-center justify-center text-[10px] font-semibold text-indigo-600 dark:text-indigo-300">
          ME
        </div>
      )}
    </div>
  );
}
export default React.memo(ChatMessage);
