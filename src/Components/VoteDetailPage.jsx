// VoteDetailPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  Check,
  LogIn,
  AlertCircle,
} from "lucide-react"; // Added LogIn, AlertCircle

const supabaseUrl = "YOUR URL KEY";
const supabaseKey = "YOUR API KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

const VoteDetailPage = () => {
  const { id: voteId } = useParams(); // Use voteId for clarity
  const navigate = useNavigate();

  // --- Component State ---
  const [vote, setVote] = useState(null); // Details of the current poll
  const [loadingVote, setLoadingVote] = useState(true); // Loading state for vote details
  const [checkingVoteStatus, setCheckingVoteStatus] = useState(true); // Loading state for checking if user voted
  const [currentUser, setCurrentUser] = useState(undefined); // Current logged-in user object (undefined initially, null if not logged in)
  const [hasVoted, setHasVoted] = useState(false); // Has the current user voted on this poll (from DB)?
  const [previousSelectionIndex, setPreviousSelectionIndex] = useState(null); // Which option index did they previously select?
  const [selectedOptions, setSelectedOptions] = useState([]); // Option index(es) currently selected in UI (for submission)
  const [error, setError] = useState(""); // Stores error messages for display
  const [submitted, setSubmitted] = useState(false); // Visual state during/after submission attempt

  // --- Authentication Handling ---
  useEffect(() => {
    console.log("Setting up auth listener and fetching initial user...");
    // Fetch initial user session
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        console.log("Initial user fetch:", user);
        setCurrentUser(user ?? null); // Set to user object or null
        setCheckingVoteStatus(true); // Trigger vote status check after getting user info
      })
      .catch((err) => {
        console.error("Error fetching initial user:", err);
        setCurrentUser(null); // Assume not logged in on error
        setCheckingVoteStatus(false); // Stop checking status if user fetch failed
      });

    // Listen for changes in authentication state (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log("Auth state changed, new session:", session);
        const user = session?.user ?? null;
        setCurrentUser(user);
        setHasVoted(false); // Reset vote status when auth changes
        setPreviousSelectionIndex(null);
        setCheckingVoteStatus(true); // Re-check vote status for the new user/logged-out state
        console.log(
          `Auth change: User is now ${
            user ? user.id : "null"
          }. Resetting vote status check.`
        );
      }
    );

    // Cleanup the listener when the component unmounts
    return () => {
      console.log("Cleaning up auth listener.");
      authListener?.subscription.unsubscribe();
    };
  }, []); // Run only once on mount

  // --- Fetch Vote Details ---
  useEffect(() => {
    if (!voteId) {
      setError("No vote ID provided.");
      setLoadingVote(false);
      return; // Don't fetch if no ID
    }

    console.log(`Workspaceing vote details for id: ${voteId}`);
    const fetchVoteDetails = async () => {
      setLoadingVote(true);
      setError(""); // Clear previous errors
      try {
        const { data, error: fetchError } = await supabase
          .from("votes") // Your votes table name
          .select("*")
          .eq("id", voteId) // Ensure 'id' is your primary key column
          .single();

        console.log("Vote details fetch response:", { data, fetchError });

        if (fetchError) throw fetchError;
        if (!data) throw new Error("Vote not found in database.");

        setVote(data);
      } catch (err) {
        if (
          err.code === "PGRST116" ||
          err.message === "Vote not found in database."
        ) {
          console.warn(`Vote with id ${voteId} not found.`);
          setError("Vote tidak ditemukan."); // Vote not found
        } else {
          console.error("Error fetching vote details:", err);
          setError("Gagal memuat detail vote."); // Failed to load vote details
        }
        setVote(null); // Ensure vote is null on error/not found
      } finally {
        setLoadingVote(false);
      }
    };

    fetchVoteDetails();
  }, [voteId]); // Re-run if voteId changes

  // --- Check User's Vote Status (Database Query) ---
  useEffect(() => {
    // Skip if we don't have user info yet, or if vote isn't loaded, or if no voteId
    if (currentUser === undefined || !vote || !voteId) {
      console.log("Skipping vote status check:", {
        currentUser_is_undefined: currentUser === undefined,
        vote_exists: !!vote,
        voteId_exists: !!voteId,
      });
      setCheckingVoteStatus(currentUser === undefined); // Keep checking if user is still undefined
      return;
    }

    // Skip if user is not logged in (currentUser is null)
    if (currentUser === null) {
      console.log("User not logged in, skipping vote status check.");
      setHasVoted(false);
      setPreviousSelectionIndex(null);
      setCheckingVoteStatus(false);
      return;
    }

    console.log(
      `Checking DB vote status for user ${currentUser.id} on vote ${voteId}`
    );
    setCheckingVoteStatus(true);
    setHasVoted(false); // Reset before check
    setPreviousSelectionIndex(null);

    const checkStatus = async () => {
      try {
        const {
          data: userVoteData,
          error: checkError,
          count,
        } = await supabase
          .from("user_poll_votes") // Your table linking users and votes
          .select("selected_option_index", { count: "exact", head: false }) // Fetch the chosen option index
          .eq("user_id", currentUser.id)
          .eq("vote_id", voteId)
          .maybeSingle(); // Expect 0 or 1 result

        console.log("DB Check response:", { userVoteData, checkError, count });

        if (checkError) {
          // Don't block UI, show warning in console
          console.error("Error checking user vote status in DB:", checkError);
          setError("Tidak dapat memverifikasi status vote sebelumnya."); // Couldn't verify previous vote status
        } else if (userVoteData) {
          // User HAS voted on this poll
          console.log("DB Check: User has voted.");
          setHasVoted(true);
          setPreviousSelectionIndex(userVoteData.selected_option_index);
        } else {
          // User has NOT voted on this poll
          console.log("DB Check: User has not voted.");
          setHasVoted(false);
          setPreviousSelectionIndex(null);
        }
      } catch (err) {
        console.error("Exception during DB vote status check:", err);
        setError("Kesalahan saat memeriksa status vote."); // Error checking vote status
      } finally {
        setCheckingVoteStatus(false);
        console.log("Finished checking DB vote status.");
      }
    };

    checkStatus();
  }, [currentUser, vote, voteId]); // Re-check when user or vote data changes

  // --- Handle Vote Submission ---
  const handleVoteSubmit = async () => {
    console.log("handleVoteSubmit initiated.");
    setError(""); // Clear previous errors

    // 1. Check Login Status
    if (!currentUser) {
      console.warn("Submit prevented: User not logged in.");
      setError("Silakan login terlebih dahulu untuk memberikan suara.");
      // navigate('/login'); // Optional: redirect to login
      return;
    }

    // 2. Basic Validation
    const isExpired = vote ? new Date(vote.due_date) < new Date() : true;
    if (
      !selectedOptions.length ||
      hasVoted ||
      isExpired ||
      submitted ||
      !vote ||
      !vote.options
    ) {
      console.warn("Submit prevented:", {
        selectedOptions: selectedOptions.length,
        hasVoted,
        isExpired,
        submitted,
        vote_exists: !!vote,
        options_exist: !!vote?.options,
      });
      return;
    }

    setSubmitted(true); // Show submitting state visually

    // Assuming single choice based on DB structure (use selectedOptions[0])
    // If multiple choices allowed, DB schema & logic here needs adjustment
    const chosenOptionIndex = selectedOptions[0];

    console.log(
      `Attempting vote: User=${currentUser.id}, Vote=${voteId}, OptionIndex=${chosenOptionIndex}`
    );

    try {
      // --- Step 1: Insert into user_poll_votes ---
      console.log("Step 1: Inserting into user_poll_votes...");
      const { error: insertError } = await supabase
        .from("user_poll_votes")
        .insert({
          user_id: currentUser.id,
          vote_id: voteId,
          selected_option_index: chosenOptionIndex,
        });

      // Handle Insert Error (e.g., unique constraint violation)
      if (insertError) {
        console.error("Error inserting user vote record:", insertError);
        if (insertError.code === "23505") {
          // Unique violation (already voted)
          setError("Anda sudah pernah memberikan suara untuk polling ini.");
          setHasVoted(true); // Correct state if it was out of sync
          setPreviousSelectionIndex(chosenOptionIndex); // Update previous selection display if needed
        } else {
          setError(`Gagal menyimpan suara Anda: ${insertError.message}`);
        }
        setSubmitted(false); // Allow retry? Or just show error? Resetting seems better.
        return; // Stop processing
      }
      console.log("Step 1: Successfully inserted user vote record.");

      // --- Step 2: Update aggregate counts in 'votes' table ---
      console.log("Step 2: Updating aggregate counts in 'votes' table...");
      // Recalculate options array with incremented count
      const updatedOptions = vote.options.map((option, index) => ({
        ...option,
        votes:
          index === chosenOptionIndex
            ? (Number(option.votes) || 0) + 1 // Increment chosen option
            : Number(option.votes) || 0, // Keep others same
      }));
      // Increment total votes count
      const updatedVoteCount = (Number(vote.votes_count) || 0) + 1;

      const { error: updateCountsError } = await supabase
        .from("votes")
        .update({
          options: updatedOptions,
          votes_count: updatedVoteCount,
        })
        .eq("id", voteId);

      // Handle Aggregate Update Error
      if (updateCountsError) {
        // Log this critical error - user vote recorded but aggregates didn't update
        console.error(
          "CRITICAL: Failed to update aggregate counts after user vote insert:",
          updateCountsError
        );
        // Inform user their vote is counted, but totals might be delayed
        setError(
          "Suara Anda telah dicatat, tetapi pembaruan total suara mungkin tertunda."
        );
        // Proceed to update UI optimistically based on successful user vote insert
      } else {
        console.log("Step 2: Successfully updated aggregate counts.");
      }

      // --- Step 3: Update UI state after successful vote recording ---
      console.log("Step 3: Updating UI state...");
      setHasVoted(true); // Mark as voted based on successful insert
      setPreviousSelectionIndex(chosenOptionIndex); // Store the choice they made
      setVote((prev) => ({
        // Update local state with new counts for immediate display
        ...prev,
        options: updatedOptions,
        votes_count: updatedVoteCount,
      }));
      setSelectedOptions([]); // Clear the temporary UI selection

      console.log("Vote submission process completed.");
      // Reset visual submitting state after a short delay
      setTimeout(() => setSubmitted(false), 2000);
    } catch (err) {
      // Catch any unexpected errors during the process
      console.error("Unexpected error during handleVoteSubmit try block:", err);
      setError("Terjadi kesalahan tak terduga. Silakan coba lagi.");
      setSubmitted(false); // Reset submitting state on unexpected error
    }
  };

  // --- Helper functions (Assume implementations from previous examples) ---
  const getTotalVotes = () => {
    if (!vote || !vote.options) return 0;
    return vote.options.reduce(
      (sum, option) => sum + (Number(option.votes) || 0),
      0
    );
  };
  const getPercentage = (votes) => {
    const total = getTotalVotes();
    return total === 0 ? 0 : Math.round(((Number(votes) || 0) / total) * 100);
  };
  const formatDate = (dateString) => {
    /* ... implementation ... */
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (e) {
      return "Invalid Date";
    }
  };
  const getTimeRemaining = (dateString) => {
    /* ... implementation ... */
    if (!dateString) return "No deadline";
    try {
      const endDate = new Date(dateString);
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();
      if (diff <= 0) return "Telah berakhir";
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      if (days > 0) return `${days}h ${hours}j tersisa`;
      if (hours > 0) return `${hours}j ${minutes}m tersisa`;
      if (minutes > 0) return `${minutes}m tersisa`;
      return "Segera berakhir";
    } catch (e) {
      return "Invalid Date";
    }
  };

  // --- Render Logic ---
  const isLoading =
    loadingVote || checkingVoteStatus || currentUser === undefined;
  const isExpired = vote ? new Date(vote.due_date) < new Date() : false;
  // Determine if the user interaction (selecting options, submitting) should be disabled
  const isInteractionDisabled =
    isLoading || isExpired || hasVoted || !currentUser || submitted;
  // Determine if the submit button specifically should be enabled
  const canSubmit =
    currentUser &&
    !isExpired &&
    !hasVoted &&
    !submitted &&
    selectedOptions.length > 0 &&
    !isLoading;

  // Loading state for the whole page initially
  if (loadingVote && currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500 text-lg">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Login Prompt */}
        {!isLoading && !currentUser && (
          <div className="mb-6 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative shadow-md flex items-center justify-between">
            <span>Anda harus login untuk dapat memberikan suara.</span>
            <button
              onClick={() => navigate("/login")} // Adjust '/login' as needed
              className="ml-4 px-4 py-1.5 bg-blue-500 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors flex items-center"
            >
              <LogIn size={16} className="mr-1.5" /> Login
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div
            className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative shadow-md flex items-center gap-2"
            role="alert"
          >
            <AlertCircle size={20} className="flex-shrink-0" />
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Loading Indicator while checking vote status or loading vote */}
        {isLoading && !error && (
          <p className="text-center text-gray-500 my-4">Memuat data vote...</p>
        )}

        {/* Main Content (Render only if vote data is available) */}
        {vote && !loadingVote ? (
          <>
            {/* Header: Back Button & Status Tags */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-indigo-700 hover:text-indigo-900 transition-colors font-medium"
              >
                <ArrowLeft size={20} className="mr-1" /> Kembali
              </button>
              <div className="flex items-center space-x-2 flex-wrap justify-center">
                {/* Tags: Public/Private, Active/Ended, Voted/Checking */}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    vote.is_public
                      ? "bg-green-100 text-green-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {vote.is_public ? "Publik" : "Privat"}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isExpired
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {isExpired ? "Berakhir" : "Aktif"}
                </span>
                {checkingVoteStatus && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 animate-pulse">
                    Memeriksa...
                  </span>
                )}
                {!checkingVoteStatus && hasVoted && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                    Telah Memilih
                  </span>
                )}
                {!checkingVoteStatus &&
                  !hasVoted &&
                  currentUser &&
                  !isExpired && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      Bisa Memilih
                    </span>
                  )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* === Left Column: Vote Info, Options, Submit === */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  {/* Image Header */}
                  {vote.image_url && (
                    <div className="relative h-56 sm:h-64 w-full overflow-hidden">
                      <img
                        src={vote.image_url}
                        alt={vote.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent"></div>
                      <h1 className="absolute bottom-4 left-6 text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                        {vote.title}
                      </h1>
                    </div>
                  )}
                  <div className="p-5 sm:p-6 lg:p-8">
                    {/* Title */}
                    {!vote.image_url && (
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                        {vote.title}
                      </h1>
                    )}
                    {/* Description */}
                    {vote.description && (
                      <div className="mb-6 text-gray-700 prose prose-indigo max-w-none">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2 border-b pb-2">
                          Tentang vote ini
                        </h3>
                        <p>{vote.description}</p>
                      </div>
                    )}

                    {/* Options Section */}
                    <div className="border-t border-gray-200 pt-6 mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                          <Check size={20} className="mr-2 text-indigo-600" />
                          {vote.allow_multiple
                            ? "Pilih satu atau lebih opsi"
                            : "Pilih satu opsi"}
                        </h3>
                        {/* Message if voting disabled */}
                        {isInteractionDisabled && !checkingVoteStatus && (
                          <span className="text-sm font-medium text-gray-500">
                            {isExpired
                              ? "Voting telah berakhir."
                              : hasVoted
                              ? "Anda sudah memilih."
                              : !currentUser
                              ? "Login untuk memilih."
                              : ""}
                          </span>
                        )}
                      </div>
                      {/* Options List */}
                      <div className="space-y-3">
                        {vote.options && vote.options.length > 0 ? (
                          vote.options.map((option, index) => {
                            const percentage = getPercentage(option.votes);
                            const isCurrentlySelected =
                              selectedOptions.includes(index); // UI selection
                            const wasPreviouslySelected =
                              hasVoted && index === previousSelectionIndex; // Stored vote
                            const isHighlighted =
                              (isCurrentlySelected &&
                                !isInteractionDisabled &&
                                !hasVoted) ||
                              wasPreviouslySelected;
                            const optionIsDisabled = isInteractionDisabled;

                            return (
                              <div
                                key={index}
                                className={`
                                                    relative p-4 border rounded-lg transition-all duration-200 ease-in-out
                                                    ${
                                                      optionIsDisabled
                                                        ? `border-gray-200 ${
                                                            isHighlighted
                                                              ? "bg-indigo-50"
                                                              : "bg-gray-50/70"
                                                          } cursor-not-allowed opacity-80`
                                                        : `border-gray-300 ${
                                                            isCurrentlySelected
                                                              ? "border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50"
                                                              : "hover:border-indigo-400 hover:bg-gray-50"
                                                          } cursor-pointer`
                                                    }
                                                `}
                                onClick={() => {
                                  if (!optionIsDisabled) {
                                    /* Handle selection logic */
                                    if (vote.allow_multiple) {
                                      /* Add logic if multiple allowed */
                                    } else {
                                      setSelectedOptions([index]);
                                    }
                                  }
                                }}
                                role="button"
                                aria-pressed={isHighlighted}
                                aria-disabled={optionIsDisabled}
                              >
                                {/* Option Text & Stats */}
                                <div className="flex justify-between items-center mb-2 gap-2">
                                  <span
                                    className={`font-medium text-gray-800 ${
                                      isHighlighted
                                        ? "text-indigo-900 font-semibold"
                                        : ""
                                    }`}
                                  >
                                    {option.text || `Opsi ${index + 1}`}
                                  </span>
                                  <span className="text-sm text-gray-600 font-medium flex-shrink-0">
                                    {Number(option.votes) || 0} suara ·{" "}
                                    {percentage}%
                                  </span>
                                </div>
                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden mt-1">
                                  <div
                                    className={`h-2.5 rounded-full transition-width duration-500 ease-out ${
                                      isHighlighted
                                        ? "bg-indigo-600"
                                        : "bg-indigo-400"
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                {/* Selection Checkmark */}
                                {isHighlighted && (
                                  <div
                                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center shadow ${
                                      optionIsDisabled
                                        ? "bg-indigo-400"
                                        : "bg-indigo-600"
                                    }`}
                                  >
                                    <Check size={14} className="text-white" />
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-gray-500 italic">
                            Tidak ada opsi tersedia.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Submit Button Area */}
                    {currentUser &&
                      !isExpired &&
                      !hasVoted &&
                      !checkingVoteStatus && ( // Show button if logged in, can vote, and status checked
                        <div className="mt-8 flex justify-end">
                          <button
                            onClick={handleVoteSubmit}
                            disabled={!canSubmit} // Use derived state for clarity
                            className={`
                                                px-6 py-3 rounded-lg transition-all duration-300 flex items-center justify-center min-w-[160px] text-base font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                                                ${
                                                  submitted
                                                    ? "bg-yellow-500 text-white cursor-wait"
                                                    : canSubmit
                                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md"
                                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                }
                                            `}
                          >
                            {submitted ? (
                              <>
                                {" "}
                                <svg
                                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" /* spinner */
                                >
                                  ...
                                </svg>{" "}
                                Memproses...
                              </>
                            ) : (
                              "Kirim Suara Saya"
                            )}
                          </button>
                        </div>
                      )}
                    {/* Message if cannot vote */}
                    {(isInteractionDisabled || !currentUser) &&
                      !checkingVoteStatus && (
                        <div className="mt-8 text-center text-gray-600 p-4 bg-gray-100 rounded-lg border border-gray-200">
                          {isExpired
                            ? "Periode voting telah berakhir."
                            : hasVoted
                            ? "Anda sudah memberikan suara."
                            : !currentUser
                            ? "Silakan login untuk memberikan suara."
                            : "Memuat status..."}
                        </div>
                      )}
                  </div>
                </div>
              </div>
              {/* === Right Column: Details & Stats === */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
                  {/* Right column content from previous examples... */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-5 border-b border-gray-200 pb-3">
                    Detail Vote
                  </h3>
                  <div className="space-y-5">
                    {/* Deadline */}
                    <div className="flex items-start">
                      <Calendar
                        size={20}
                        className="text-indigo-500 mt-1 mr-4 flex-shrink-0"
                      />
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 mb-0.5 uppercase tracking-wider">
                          Batas Waktu
                        </h4>
                        <p className="text-gray-800 font-medium text-base">
                          {formatDate(vote.due_date)}
                        </p>
                        {!isExpired && (
                          <p className="text-sm font-medium text-indigo-600 mt-1">
                            {getTimeRemaining(vote.due_date)}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Participation */}
                    <div className="flex items-start">
                      <Users
                        size={20}
                        className="text-indigo-500 mt-1 mr-4 flex-shrink-0"
                      />
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 mb-0.5 uppercase tracking-wider">
                          Total Suara Masuk
                        </h4>
                        <p className="text-gray-800 font-medium text-base">
                          {getTotalVotes()}
                        </p>
                      </div>
                    </div>
                    {/* Status */}
                    <div className="flex items-start">
                      <Clock
                        size={20}
                        className="text-indigo-500 mt-1 mr-4 flex-shrink-0"
                      />
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 mb-0.5 uppercase tracking-wider">
                          Status
                        </h4>
                        <p
                          className={`font-semibold text-base ${
                            isExpired ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {isExpired ? "Voting Ditutup" : "Voting Dibuka"}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Quick Stats */}
                  {vote.options && vote.options.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        Statistik Cepat
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-indigo-50 rounded-lg p-4 text-center shadow-sm">
                          <p className="text-xs text-indigo-700 font-semibold mb-1 uppercase tracking-wider">
                            Suara Tertinggi
                          </p>
                          <p className="text-2xl font-bold text-indigo-900">
                            {vote.options.reduce(
                              (max, opt) =>
                                Math.max(max, Number(opt.votes) || 0),
                              0
                            )}
                          </p>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-4 text-center shadow-sm">
                          <p className="text-xs text-indigo-700 font-semibold mb-1 uppercase tracking-wider">
                            Rata2 Suara/Opsi
                          </p>
                          <p className="text-2xl font-bold text-indigo-900">
                            {(
                              getTotalVotes() / (vote.options.length || 1)
                            ).toFixed(1)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>{" "}
              {/* End Right Column */}
            </div>
          </>
        ) : (
          // Render message if vote not found after loading completed
          !isLoading && (
            <p className="text-center text-red-500 my-4">
              {error || "Vote tidak dapat ditampilkan."}
            </p>
          )
        )}
      </div>
    </div>
  );
};

export default VoteDetailPage;
