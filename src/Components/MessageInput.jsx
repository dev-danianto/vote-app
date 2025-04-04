// src/Components/Chat/MessageInput.jsx
import React, { useState, useRef, useEffect } from "react";
import { IoSend } from "react-icons/io5";

function MessageInput({ onSendMessage, isSending }) {
  const [newMessage, setNewMessage] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    // Auto-resize textarea
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      const sh = ta.scrollHeight;
      ta.style.height = `${Math.min(sh, 120)}px`;
    }
  }, [newMessage]);

  const handleInputChange = (e) => setNewMessage(e.target.value);
  const handleSubmit = (e) => {
    e.preventDefault();
    const msg = newMessage.trim();
    if (msg === "" || isSending) return;
    onSendMessage(msg);
    setNewMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    // White BG, Fixed Height (relative)
    <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 border-t border-gray-200 dark:border-gray-600 shadow-sm flex-shrink-0">
      <form
        onSubmit={handleSubmit}
        className="flex items-end space-x-2 sm:space-x-3"
      >
        <textarea
          ref={textareaRef}
          value={newMessage}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Send a message..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 dark:bg-gray-700 dark:text-white resize-none overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
          rows="1"
          style={{ minHeight: "40px", maxHeight: "120px" }}
          aria-label="Chat message input"
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || isSending}
          aria-label="Send message"
          className={`p-2.5 rounded-xl text-white transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800 flex items-center justify-center self-stretch mb-px ${
            !newMessage.trim() || isSending
              ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-70"
              : "bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 transform hover:scale-105"
          }`}
        >
          {isSending ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <IoSend
              size={18}
              className="transform -rotate-[0deg] translate-x-[1px]"
            />
          )}
        </button>
      </form>
    </div>
  );
}
export default MessageInput;
