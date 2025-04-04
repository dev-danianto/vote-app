// src/components/MyVotes.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../supabaseClient"; // Import your initialized Supabase client
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

// --- Helper Components ---

// ** CORRECTED LoadingIndicator Definition **
const LoadingIndicator = ({ message = "Loading..." }) => (
  <div className="flex justify-center items-center py-6">
    <svg
      className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600"
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
    <span className="text-gray-600">{message}</span>
  </div>
);

// ** CORRECTED ErrorDisplay Definition **
const ErrorDisplay = ({ error, sectionName }) => (
  <div
    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative shadow-sm"
    role="alert"
  >
    <strong className="font-bold">Error loading {sectionName}: </strong>
    <span className="block sm:inline">
      {error?.message || "An unknown error occurred."}
    </span>
    {/* Log full error details for debugging */}
    {console.error(`Analytics Error [${sectionName}]:`, error)}
  </div>
);

// Simple Modal for Delete Confirmation
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="mb-6">{children}</div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition duration-150"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-150"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Simple Component to Display Vote Results
const VoteResultsDisplay = ({ resultsData, voteTitle, isLoading }) => {
  const COLORS = useMemo(
    () => ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF6666"],
    []
  );

  if (isLoading) return <LoadingIndicator message="Loading results..." />;
  if (!resultsData || resultsData.length === 0) {
    return (
      <p className="text-gray-500 italic">
        No results available for this poll yet.
      </p>
    );
  }

  return (
    <div className="mt-4 p-4 border rounded bg-gray-50">
      <h4 className="font-semibold text-lg mb-3">Results for: "{voteTitle}"</h4>
      <ResponsiveContainer width="100%" height={200 + resultsData.length * 30}>
        {" "}
        {/* Adjust height based on bars */}
        <BarChart
          data={resultsData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            interval={0}
            tick={{ fontSize: 12 }}
          />{" "}
          {/* Show all labels */}
          <Tooltip formatter={(value) => `${value} votes`} />
          <Bar dataKey="value" name="Votes" barSize={25}>
            {resultsData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- Main MyVotes Component ---

function MyVotes() {
  const [createdVotes, setCreatedVotes] = useState([]);
  const [participatedVotes, setParticipatedVotes] = useState([]); // Store full details
  const [loadingStates, setLoadingStates] = useState({
    created: true,
    participated: true,
    results: false,
    delete: false,
  });
  const [errorStates, setErrorStates] = useState({
    created: null,
    participated: null,
    results: null,
    delete: null,
  });
  const [currentUser, setCurrentUser] = useState(null);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [voteToDelete, setVoteToDelete] = useState(null); // Store {id, title}

  // Results State
  const [resultsData, setResultsData] = useState(null); // Stores array [{name: option_text, value: votes_count}]
  const [selectedVoteForResults, setSelectedVoteForResults] = useState(null); // Store {id, title}

  // Fetch current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
        setErrorStates((prev) => ({
          ...prev,
          created: error,
          participated: error,
        })); // Show error in both sections
      } else if (user) {
        setCurrentUser(user);
      } else {
        // Handle case where user is not logged in (redirect or show message)
        console.log("User not logged in.");
        setErrorStates((prev) => ({
          ...prev,
          created: { message: "Please log in to see your votes." },
          participated: { message: "Please log in to see your votes." },
        }));
        setLoadingStates({
          created: false,
          participated: false,
          results: false,
          delete: false,
        });
      }
    };
    fetchUser();
  }, []);

  // Fetch Created Votes
  const fetchCreatedVotes = useCallback(async (userId) => {
    if (!userId) return;
    setLoadingStates((prev) => ({ ...prev, created: true }));
    setErrorStates((prev) => ({ ...prev, created: null }));
    try {
      const { data, error } = await supabase
        .from("votes")
        .select("id, title, description, created_at, due_date, votes_count") // Select columns needed for display
        .eq("created_by", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCreatedVotes(data || []);
    } catch (error) {
      console.error("Error fetching created votes:", error);
      setErrorStates((prev) => ({ ...prev, created: error }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, created: false }));
    }
  }, []);

  // Fetch Participated Votes
  const fetchParticipatedVotes = useCallback(async (userId) => {
    if (!userId) return;
    setLoadingStates((prev) => ({ ...prev, participated: true }));
    setErrorStates((prev) => ({ ...prev, participated: null }));
    try {
      // Step 1: Get IDs of votes the user responded to
      const { data: responses, error: responsesError } = await supabase
        .from("vote_responses")
        .select("vote_id") // Select only the vote_id
        .eq("user_id", userId);

      if (responsesError) throw responsesError;

      if (!responses || responses.length === 0) {
        setParticipatedVotes([]); // User hasn't voted in any polls
        // Need to set loading to false here too
        setLoadingStates((prev) => ({ ...prev, participated: false }));
        return;
      }

      const uniqueVoteIds = [...new Set(responses.map((r) => r.vote_id))];

      // Step 2: Fetch details for those vote IDs
      const { data: votesData, error: votesError } = await supabase
        .from("votes")
        .select(
          "id, title, description, created_at, due_date, votes_count, created_by, profiles ( full_name )"
        ) // Fetch creator name too
        .in("id", uniqueVoteIds)
        .order("created_at", { ascending: false });

      if (votesError) throw votesError;
      setParticipatedVotes(votesData || []);
    } catch (error) {
      console.error("Error fetching participated votes:", error);
      setErrorStates((prev) => ({ ...prev, participated: error }));
    } finally {
      // Ensure loading is set to false even if there were no responses found earlier
      setLoadingStates((prev) => ({ ...prev, participated: false }));
    }
  }, []);

  // Fetch data when user is available
  useEffect(() => {
    if (currentUser?.id) {
      fetchCreatedVotes(currentUser.id);
      fetchParticipatedVotes(currentUser.id);
    }
  }, [currentUser, fetchCreatedVotes, fetchParticipatedVotes]);

  // --- Event Handlers ---

  const handleDeleteClick = (vote) => {
    setVoteToDelete({ id: vote.id, title: vote.title });
    setErrorStates((prev) => ({ ...prev, delete: null })); // Clear previous delete error
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!voteToDelete || !currentUser?.id) return;

    setLoadingStates((prev) => ({ ...prev, delete: true }));
    setErrorStates((prev) => ({ ...prev, delete: null }));

    try {
      // IMPORTANT: Match both id and created_by for security
      const { error } = await supabase
        .from("votes")
        .delete()
        .match({ id: voteToDelete.id, created_by: currentUser.id });

      if (error) throw error;

      // Remove vote from local state for immediate UI update
      setCreatedVotes((prev) =>
        prev.filter((vote) => vote.id !== voteToDelete.id)
      );
      setShowDeleteModal(false);
      setVoteToDelete(null);
    } catch (error) {
      console.error("Error deleting vote:", error);
      let userMessage = error.message;
      if (error.message.includes("violates row-level security policy")) {
        userMessage = "You do not have permission to delete this vote.";
      } else if (
        error.message.includes("Cannot delete or update a parent row")
      ) {
        userMessage =
          "Cannot delete this vote as it might have related data (like responses or options). Please handle related data first if needed.";
      }
      setErrorStates((prev) => ({
        ...prev,
        delete: { message: `Failed to delete: ${userMessage}` },
      }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, delete: false }));
    }
  };

  const handleViewResults = async (vote) => {
    // If results for this vote are already shown, hide them
    if (selectedVoteForResults?.id === vote.id) {
      setSelectedVoteForResults(null);
      setResultsData(null);
      return;
    }

    setResultsData(null);
    setSelectedVoteForResults({ id: vote.id, title: vote.title });
    setLoadingStates((prev) => ({ ...prev, results: true }));
    setErrorStates((prev) => ({ ...prev, results: null }));

    try {
      const { data: optionsData, error: optionsError } = await supabase
        .from("vote_options")
        .select("id, text, votes")
        .eq("vote_id", vote.id)
        .order("votes", { ascending: false });

      if (optionsError) throw optionsError;

      const formattedResults = (optionsData || []).map((opt) => ({
        name: opt.text,
        value: opt.votes ?? 0,
      }));
      setResultsData(formattedResults);
    } catch (error) {
      console.error(`Error fetching results for vote ${vote.id}:`, error);
      setErrorStates((prev) => ({ ...prev, results: error }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, results: false }));
    }
  };

  // Helper to check if a vote is closed
  const isVoteClosed = (dueDate) => {
    return dueDate && new Date(dueDate) < new Date();
  };

  // --- Render Vote Item ---
  const renderVoteItem = (vote, isOwner) => {
    const closed = isVoteClosed(vote.due_date);
    const showResultsForThis = selectedVoteForResults?.id === vote.id;

    return (
      <div
        key={vote.id}
        className="bg-white p-4 mb-4 rounded-lg shadow transition-shadow hover:shadow-md border border-gray-200"
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {vote.title}
            </h3>
            {vote.description && (
              <p className="text-sm text-gray-600 mt-1">{vote.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Created: {new Date(vote.created_at).toLocaleDateString()}
              {vote.due_date
                ? ` | Due: ${new Date(vote.due_date).toLocaleDateString()}`
                : ""}
              {!isOwner &&
                vote.profiles &&
                ` | By: ${vote.profiles.full_name || "Unknown"}`}
            </p>
          </div>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              closed
                ? "bg-gray-200 text-gray-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {closed ? "Closed" : "Active"}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-end space-x-3 border-t pt-3">
          <button
            onClick={() => handleViewResults(vote)}
            disabled={
              loadingStates.results && selectedVoteForResults?.id === vote.id
            }
            className={`text-sm px-3 py-1 rounded transition duration-150 ease-in-out ${
              loadingStates.results && selectedVoteForResults?.id === vote.id
                ? "bg-blue-200 text-blue-600 cursor-wait"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
            }`}
          >
            {loadingStates.results && selectedVoteForResults?.id === vote.id
              ? "Loading..."
              : showResultsForThis
              ? "Hide Results"
              : "View Results"}
          </button>
          {isOwner && (
            <button
              onClick={() => handleDeleteClick(vote)}
              disabled={loadingStates.delete}
              className="text-sm px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 transition duration-150 ease-in-out disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>

        {showResultsForThis && (
          <VoteResultsDisplay
            resultsData={resultsData}
            voteTitle={vote.title}
            isLoading={loadingStates.results}
          />
        )}
        {showResultsForThis && errorStates.results && (
          <div className="mt-2">
            <ErrorDisplay
              error={errorStates.results}
              sectionName={`Results for ${vote.title}`}
            />
          </div>
        )}
      </div>
    );
  };

  // --- Main Render ---
  return (
    <div className="my-votes-container p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl md:text-3xl font-semibold mb-6 text-gray-800">
        My Votes
      </h1>

      {/* Section: Votes You Created */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
          Polls You Created
        </h2>
        {loadingStates.created ? (
          <LoadingIndicator message="Loading your created polls..." />
        ) : errorStates.created ? (
          <ErrorDisplay
            error={errorStates.created}
            sectionName="Created Polls"
          />
        ) : createdVotes.length > 0 ? (
          createdVotes.map((vote) => renderVoteItem(vote, true)) // Pass true for isOwner
        ) : (
          <p className="text-gray-500 italic">
            You haven't created any polls yet.
          </p>
        )}
      </section>

      {/* Section: Votes You Participated In */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
          Polls You Voted In
        </h2>
        {loadingStates.participated ? (
          <LoadingIndicator message="Loading polls you participated in..." />
        ) : errorStates.participated ? (
          <ErrorDisplay
            error={errorStates.participated}
            sectionName="Participated Polls"
          />
        ) : participatedVotes.length > 0 ? (
          participatedVotes
            // Optionally filter out votes created by the user if you don't want duplicates shown
            // .filter(vote => vote.created_by !== currentUser?.id)
            .map((vote) =>
              renderVoteItem(vote, vote.created_by === currentUser?.id)
            ) // Pass owner status correctly
        ) : (
          <p className="text-gray-500 italic">
            You haven't voted in any polls yet.
          </p>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setVoteToDelete(null);
          setErrorStates((prev) => ({ ...prev, delete: null }));
        }}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
      >
        <p>Are you sure you want to delete the poll titled:</p>
        <p className="font-semibold my-2">"{voteToDelete?.title}"?</p>
        <p className="text-sm text-red-600">This action cannot be undone.</p>
        {loadingStates.delete && <LoadingIndicator message="Deleting..." />}
        {errorStates.delete && (
          <div className="mt-4 text-red-600 bg-red-50 p-3 rounded border border-red-200">
            {errorStates.delete.message}
          </div>
        )}
      </ConfirmationModal>
    </div>
  );
}

export default MyVotes;
