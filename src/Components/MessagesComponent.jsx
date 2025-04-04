import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../supabaseClient"; // Ensure path is correct
import { v4 as uuidv4 } from "uuid";

// ---==! IMPORTANT: REPLACE MOCK DATA !==---
const MOCK_CURRENT_USER = {
  id: uuidv4(),
  email: `test-${Date.now()}@example.com`,
};
const MOCK_CONVERSATION_ID = "ui-improvements";
// ---==! ---

// --- SVG Icons (Inline for simplicity) ---
const PaperAirplaneIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
  </svg>
);

const PaperClipIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
    />
  </svg>
);

const DocumentDownloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 mr-1 flex-shrink-0"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
      clipRule="evenodd"
    />
  </svg>
);

const XCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
      clipRule="evenodd"
    />
  </svg>
);
// --- End Icons ---

function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser] = useState(MOCK_CURRENT_USER);
  const [conversationId] = useState(MOCK_CONVERSATION_ID);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- Scroll to Bottom ---
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(scrollToBottom, [messages]);

  // --- Fetch Initial Messages ---
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (fetchError) throw fetchError;
      setMessages(data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(`Failed to load messages: ${err.message}`);
      setMessages([]);
    }
  }, [conversationId]);

  // --- Real-time Subscription ---
  useEffect(() => {
    if (!conversationId) return;
    fetchMessages(); // Initial fetch

    const channel = supabase
      .channel(`realtime-messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.some((msg) => msg.id === payload.new.id)
              ? prev
              : [...prev, payload.new]
          );
        }
      )
      .subscribe((status, err) => {
        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          console.error(`Realtime subscription issue: ${status}`, err || "");
          setError(
            "Chat connection issue. Real-time updates may be interrupted."
          );
        } else if (status === "SUBSCRIBED") {
          console.log(
            `Realtime subscribed successfully for ${conversationId}!`
          );
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchMessages]);

  // --- Handle Text Message Sending ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage || !currentUser?.id || !conversationId || isUploading)
      return;
    setError(null);
    try {
      const messageData = {
        content: trimmedMessage,
        user_id: currentUser.id,
        conversation_id: conversationId,
        file_url: null,
        file_name: null,
      };
      const { error: insertError } = await supabase
        .from("messages")
        .insert(messageData);
      if (insertError) throw insertError;
      setNewMessage("");
    } catch (err) {
      console.error("Error sending text message:", err);
      setError(`Failed to send message: ${err.message}`);
    }
  };

  // --- Handle File Selection ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Handle File Upload and Message Sending ---
  const handleSendFile = async () => {
    if (!selectedFile || !currentUser?.id || !conversationId || isUploading)
      return;
    setIsUploading(true);
    setError(null);
    try {
      const fileExt = selectedFile.name.split(".").pop();
      const uniqueFileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${conversationId}/${currentUser.id}/${uniqueFileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("chat_files")
        .upload(filePath, selectedFile); // <<< YOUR BUCKET NAME
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("chat_files")
        .getPublicUrl(filePath); // <<< YOUR BUCKET NAME
      if (!urlData?.publicUrl) throw new Error("Could not get public URL.");
      const messageData = {
        user_id: currentUser.id,
        conversation_id: conversationId,
        content: null,
        file_url: urlData.publicUrl,
        file_name: selectedFile.name,
      };
      const { error: insertError } = await supabase
        .from("messages")
        .insert(messageData);
      if (insertError) throw insertError;
      setSelectedFile(null);
    } catch (err) {
      console.error("Error sending file:", err);
      setError(`Failed to send file: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // --- Render Helper for Message Content (Text or File Link) ---
  const renderMessageContent = (message) => {
    if (message.file_url) {
      return (
        <a
          href={message.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-blue-100 hover:text-white underline bg-blue-700/80 px-3 py-1.5 rounded-lg shadow-sm hover:bg-blue-700 transition-colors duration-150"
          title={`Download ${message.file_name || "file"}`}
        >
          <DocumentDownloadIcon />
          <span className="truncate ml-1">
            {message.file_name || "Shared File"}
          </span>
        </a>
      );
    }
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    return (
      <p className="text-sm break-words whitespace-pre-wrap">
        {message.content?.split(linkRegex).map((part, index) =>
          linkRegex.test(part) ? (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 dark:text-blue-300 hover:underline"
            >
              {part}
            </a>
          ) : (
            part
          )
        ) || ""}
      </p>
    );
  };

  // --- Component Render ---
  return (
    // Use h-full if parent controls height, or h-screen for full viewport height demo
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 p-4 text-center font-semibold shadow-sm border-b border-gray-200 dark:border-gray-700">
        <span className="text-gray-800 dark:text-gray-100">Conversation:</span>{" "}
        <span className="text-indigo-600 dark:text-indigo-400">
          {conversationId || "None Selected"}
        </span>
      </div>

      {/* Message Display Area */}
      {/* Add 'custom-scrollbar' class here if using the CSS method for styling */}
      <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4 bg-white dark:bg-gray-800 custom-scrollbar">
        {!conversationId && (
          <p className="text-center text-gray-500 dark:text-gray-400 italic mt-10">
            Select a conversation.
          </p>
        )}
        {conversationId && messages.length === 0 && !error && !isUploading && (
          <p className="text-center text-gray-400 dark:text-gray-500 italic mt-10">
            No messages yet...
          </p>
        )}
        {conversationId &&
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.user_id === currentUser?.id
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              {/* Message Bubble */}
              <div
                className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl shadow-md ${
                  message.user_id === currentUser?.id
                    ? "bg-blue-500 text-white rounded-br-none" // User's messages
                    : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none" // Others' messages
                }`}
              >
                {/* Render actual content (text or file link) */}
                {renderMessageContent(message)}
                {/* Timestamp */}
                <p
                  className={`text-xs text-right mt-1 ${
                    message.user_id === currentUser?.id
                      ? "text-blue-100"
                      : "text-gray-500 dark:text-gray-400"
                  } opacity-80`}
                >
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
        {/* Scroll anchor */}
        <div ref={messagesEndRef} className="h-px" />
      </div>

      {/* Error Display Area */}
      {error && (
        <div
          className="flex-shrink-0 bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-3 text-sm"
          role="alert"
        >
          <p>
            <strong className="font-bold">Error: </strong> {error}
          </p>
        </div>
      )}

      {/* Uploading Indicator / File Preview Area */}
      {isUploading && (
        <div className="flex-shrink-0 p-2 text-sm text-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50 border-t border-b border-gray-200 dark:border-gray-700 animate-pulse">
          Uploading file...
        </div>
      )}
      {selectedFile && !isUploading && (
        <div className="flex-shrink-0 p-3 flex justify-between items-center text-sm bg-gray-100 dark:bg-gray-700 border-t border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center min-w-0">
            {" "}
            {/* Ensure truncation works */}
            <PaperClipIcon />
            <span className="ml-2 truncate text-gray-700 dark:text-gray-200">
              {selectedFile.name}
            </span>
          </div>
          <div className="flex-shrink-0 flex items-center space-x-2 ml-2">
            <button
              onClick={handleSendFile}
              disabled={isUploading}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded-md text-xs disabled:opacity-50 transition-colors duration-150"
            >
              Send File
            </button>
            <button
              onClick={() => setSelectedFile(null)}
              disabled={isUploading}
              className="text-red-500 hover:text-red-700 disabled:opacity-50 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors duration-150"
              title="Cancel selection"
            >
              <XCircleIcon />
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 bg-gray-100 dark:bg-gray-900 p-3 border-t border-gray-200 dark:border-gray-700">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center space-x-2"
        >
          {/* File Input Button */}
          <label
            htmlFor="file-upload"
            className={`flex-shrink-0 cursor-pointer p-2 rounded-full ${
              isUploading
                ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700"
            } transition-colors duration-150`}
            title="Attach file"
          >
            <PaperClipIcon />
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>

          {/* Text Input */}
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isUploading}
            className="flex-grow p-2 px-3 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-200 dark:disabled:bg-gray-700"
          />

          {/* Send Text Button */}
          <button
            type="submit"
            disabled={!newMessage.trim() || isUploading}
            className="flex-shrink-0 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-colors duration-150"
            aria-label="Send message"
          >
            <PaperAirplaneIcon />
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
