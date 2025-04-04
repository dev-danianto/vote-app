// src/Components/Chat/ChatHeader.jsx
import React from "react";
import { FiHash, FiSettings, FiLogOut } from "react-icons/fi";

function ChatHeader({ roomName, onSettingsClick, onLogoutClick }) {
  return (
    // White BG, Fixed Height
    <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shadow-sm flex-shrink-0 h-16">
      <div className="flex items-center space-x-3 overflow-hidden">
        <FiHash className="text-gray-400 dark:text-gray-500 text-xl flex-shrink-0" />
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
          {roomName || "Chat Room"}
        </h2>
      </div>
      <div className="flex items-center space-x-2 flex-shrink-0">
        <button
          onClick={onSettingsClick}
          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800 transition-colors"
          aria-label="Settings"
        >
          {" "}
          <FiSettings size={18} />{" "}
        </button>
        <button
          onClick={onLogoutClick}
          className="p-2 rounded-full text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800 transition-colors"
          aria-label="Logout"
        >
          {" "}
          <FiLogOut size={18} />{" "}
        </button>
      </div>
    </div>
  );
}
export default ChatHeader;
