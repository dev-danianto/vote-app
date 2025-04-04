import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Calendar, X, Upload, Plus, Trash2 } from "lucide-react"; // Import needed icons
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // Import datepicker CSS
import { useNavigate } from "react-router-dom";

// Initialize Supabase client
// *** IMPORTANT: Replace with the SAME Supabase URL and Anon Key used in Dashboard.jsx ***
const supabaseUrl = "https://cpzhalbbnvwmmevzzacy.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwemhhbGJibnZ3bW1ldnp6YWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4NzYwNjAsImV4cCI6MjA1NTQ1MjA2MH0.RDAGbKSgcPoMtA7rJRHNa-wnPwdDJzhgwVlxOMZy38A";
const supabase = createClient(supabaseUrl, supabaseKey);

const CreateVotePage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0);
    return tomorrow;
  });
  const [options, setOptions] = useState([
    { text: "", votes: 0 },
    { text: "", votes: 0 },
  ]);
  const [isPublic, setIsPublic] = useState(true);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imageUrlPreview, setImageUrlPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [userId, setUserId] = useState(null);

  // Get current user ID on mount
  useEffect(
    () => {
      const getUser = async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        } else {
          console.error("User not authenticated to create vote.");
          setError("You must be logged in to create a vote.");
          // Optional: Redirect to login if not authenticated
          // navigate('/login');
        }
      };
      getUser();
    },
    [
      /* navigate */
    ]
  ); // Add navigate if using redirect

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id, name")
          .order("name", { ascending: true });

        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        // Don't block form rendering, but maybe show a subtle warning
        // setError('Could not load categories.');
      }
    };
    fetchCategories();
  }, []);

  // --- Form Field Handlers ---

  const addOption = useCallback(() => {
    if (options.length < 10) {
      setOptions((prevOptions) => [...prevOptions, { text: "", votes: 0 }]);
      setError(null); // Clear previous errors if adding succeeds
    } else {
      setError("Maximum of 10 options allowed.");
    }
  }, [options.length]);

  const removeOption = useCallback(
    (index) => {
      if (options.length > 2) {
        setOptions((prevOptions) => prevOptions.filter((_, i) => i !== index));
        setError(null);
      } else {
        setError("A minimum of 2 options is required.");
      }
    },
    [options.length]
  );

  const handleOptionChange = useCallback((index, value) => {
    setOptions((prevOptions) => {
      const newOptions = [...prevOptions];
      newOptions[index] = { ...newOptions[index], text: value };
      return newOptions;
    });
  }, []);

  const handleAddTag = useCallback(() => {
    const trimmedTag = tagInput.trim().toLowerCase(); // Normalize tags
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags((prevTags) => [...prevTags, trimmedTag]);
      setTagInput("");
      setError(null);
    } else if (tags.length >= 10) {
      setError("Maximum of 10 tags allowed.");
    } else if (!trimmedTag) {
      // Do nothing if input is empty
    } else {
      // Tag already exists, maybe give feedback?
      // setError(`Tag "${trimmedTag}" already added.`);
      setTagInput(""); // Clear input even if tag exists
    }
  }, [tagInput, tags]);

  const removeTag = useCallback((tagToRemove) => {
    setTags((prevTags) => prevTags.filter((tag) => tag !== tagToRemove));
  }, []);

  const handleImageChange = useCallback(
    (e) => {
      setError(null); // Clear previous errors
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.size > 5 * 1024 * 1024) {
          setError("Image size must be less than 5MB.");
          setImageFile(null);
          setImageUrlPreview("");
          return;
        }
        if (
          !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
            file.type
          )
        ) {
          setError("Invalid file type. Please upload JPG, PNG, WEBP, or GIF.");
          setImageFile(null);
          setImageUrlPreview("");
          return;
        }

        // Clear previous preview if exists
        if (imageUrlPreview) {
          URL.revokeObjectURL(imageUrlPreview);
        }

        setImageFile(file);
        const previewUrl = URL.createObjectURL(file);
        setImageUrlPreview(previewUrl);
      }
    },
    [imageUrlPreview]
  );

  const removeImage = useCallback(() => {
    setImageFile(null);
    if (imageUrlPreview) {
      URL.revokeObjectURL(imageUrlPreview);
      setImageUrlPreview("");
    }
    const fileInput = document.getElementById("image-upload");
    if (fileInput) fileInput.value = ""; // Reset file input
    setError(null); // Clear any image-related errors
  }, [imageUrlPreview]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (imageUrlPreview) {
        URL.revokeObjectURL(imageUrlPreview);
      }
    };
  }, [imageUrlPreview]);

  // --- Image Upload Logic ---
  const uploadImage = async () => {
    if (!imageFile) return null;
    if (!userId) throw new Error("User ID is not available for image upload.");

    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `vote_images/${fileName}`; // Matches bucket name in SQL

    console.log(`Uploading image to Supabase Storage: ${filePath}`);
    const { data, error: uploadError } = await supabase.storage
      .from("vote_images")
      .upload(filePath, imageFile, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      console.error("Supabase Storage upload error:", uploadError);
      throw new Error(`Image upload failed: ${uploadError.message}`);
    }

    console.log("Supabase Storage upload successful:", data);
    const { data: publicUrlData } = supabase.storage
      .from("vote_images")
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      console.warn(
        "Could not get public URL for uploaded image path:",
        filePath
      );
      throw new Error("Image uploaded, but failed to retrieve its public URL.");
    }

    console.log("Public URL retrieved:", publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  };

  // --- Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess("");

    // Basic Validations
    if (!userId) {
      setError("Cannot create vote: User is not authenticated.");
      return;
    }
    if (!title.trim()) {
      setError("Vote title is required.");
      return;
    }
    if (options.length < 2) {
      setError("At least two vote options are required.");
      return;
    }
    const invalidOption = options.find((option) => !option.text.trim());
    if (invalidOption) {
      setError("All vote options must have text.");
      return;
    }
    if (!dueDate || dueDate <= new Date()) {
      setError("Due date must be in the future.");
      return;
    }

    setLoading(true);
    try {
      let uploadedImageUrl = null;
      if (imageFile) {
        uploadedImageUrl = await uploadImage();
      }

      const voteData = {
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate.toISOString(),
        options: options.map((opt) => ({ text: opt.text.trim(), votes: 0 })), // Ensure clean options array
        is_public: isPublic,
        allow_multiple: allowMultiple,
        allow_comments: allowComments,
        tags: tags.length > 0 ? tags : null,
        image_url: uploadedImageUrl,
        category_id: selectedCategory || null,
        created_by: userId,
        votes_count: 0, // Initialize votes_count
      };

      console.log("Attempting to insert vote:", voteData);
      const { data: insertedVote, error: insertError } = await supabase
        .from("votes")
        .insert(voteData)
        .select("id")
        .single();

      if (insertError) throw insertError; // Let catch block handle Supabase errors

      console.log("Vote inserted successfully, ID:", insertedVote.id);
      setSuccess("Vote created successfully! Redirecting...");

      // Reset form after successful submission
      setTitle("");
      setDescription("");
      setDueDate(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(17, 0, 0, 0);
        return d;
      });
      setOptions([
        { text: "", votes: 0 },
        { text: "", votes: 0 },
      ]);
      setIsPublic(true);
      setAllowMultiple(false);
      setAllowComments(true);
      setTags([]);
      setTagInput("");
      removeImage(); // Clear image state
      setSelectedCategory("");

      // Redirect after delay
      setTimeout(() => {
        navigate(`/dashboard/votes/${insertedVote.id}`); // Redirect to the new vote's detail page
      }, 1500);
    } catch (err) {
      console.error("Error creating vote:", err);
      // Provide more user-friendly error messages
      let userErrorMessage = "Failed to create vote. Please try again.";
      if (err.message?.includes("upload failed")) {
        userErrorMessage = `Image upload failed: ${err.message}. Please try a different image or skip it.`;
      } else if (
        err.message?.includes("duplicate key value violates unique constraint")
      ) {
        userErrorMessage =
          "A vote with this title or identifier might already exist."; // Example
      } else if (err.message) {
        userErrorMessage = `Failed to create vote: ${err.message}`;
      }
      setError(userErrorMessage);
      window.scrollTo(0, 0); // Scroll to top to show error
    } finally {
      setLoading(false);
    }
  };

  // --- Render Form ---
  return (
    // Added pb-10 for bottom padding
    <div className="max-w-3xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-xl border border-gray-200 mb-10">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800 border-b border-gray-200 pb-3">
        Create New Vote
      </h1>

      {/* Error Message Area */}
      {error && (
        <div
          className="mb-5 p-3 bg-red-50 border border-red-200 text-sm text-red-700 rounded-md flex justify-between items-center"
          role="alert"
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="p-1 -m-1 text-red-500 hover:text-red-700 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-full"
            aria-label="Dismiss error"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Success Message Area */}
      {success && (
        <div
          className="mb-5 p-3 bg-green-50 border border-green-200 text-sm text-green-700 rounded-md"
          role="status"
        >
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Vote Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400"
            placeholder="E.g., Best framework for new projects?"
            maxLength={150}
            required
            aria-required="true"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description{" "}
            <span className="text-gray-500 text-xs">(Optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={1000}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400"
            placeholder="Add more context or details about the vote..."
          />
          <p className="mt-1 text-xs text-gray-500">
            {1000 - description.length} characters remaining.
          </p>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Featured Image{" "}
            <span className="text-gray-500 text-xs">(Optional)</span>
          </label>
          <div className="mt-1 flex flex-col sm:flex-row sm:items-start sm:space-x-4 space-y-2 sm:space-y-0">
            {/* Preview Area */}
            {imageUrlPreview ? (
              <div className="relative w-32 h-32 flex-shrink-0">
                <img
                  src={imageUrlPreview}
                  alt="Selected preview"
                  className="w-full h-full object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  aria-label="Remove image"
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              /* Upload Button Placeholder */
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <span className="mt-1 text-xs text-gray-500">Upload Image</span>
                <span className="mt-px text-xs text-gray-400">(Max 5MB)</span>
                <input
                  id="image-upload"
                  name="image-upload"
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  className="sr-only"
                  onChange={handleImageChange}
                />
              </label>
            )}
            <p className="text-xs text-gray-500 pt-1">
              Optional image (JPG, PNG, WEBP, GIF, max 5MB).
              <br />
              Helps your vote stand out.
            </p>
          </div>
        </div>

        {/* Due Date & Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Due Date */}
          <div>
            <label
              htmlFor="due-date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Voting Ends <span className="text-red-500">*</span>
            </label>
            <div className="relative date-picker-wrapper">
              {" "}
              {/* Add wrapper for potential styling */}
              <Calendar className="absolute inset-y-0 left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
              <DatePicker
                id="due-date"
                selected={dueDate}
                required
                aria-required="true"
                onChange={(date) => date && setDueDate(date)} // Ensure date is not null
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm appearance-none"
                minDate={new Date()}
                showTimeSelect
                timeFormat="p" // Use 'p' for locale-aware AM/PM
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                portalId="root-portal" // Helps with potential z-index issues if needed
                wrapperClassName="w-full" // Ensure wrapper takes full width
                placeholderText="Select date and time"
                showPopperArrow={false} // Optional: Hide popper arrow
              />
            </div>
          </div>
          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Category <span className="text-gray-500 text-xs">(Optional)</span>
            </label>
            <select
              id="category"
              name="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-3 pr-10 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-700"
            >
              <option value="">-- Select a category --</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Vote Options */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-1">
            Vote Options <span className="text-red-500">*</span>{" "}
            <span className="text-gray-500 text-xs">(Min 2, Max 10)</span>
          </legend>
          <div className="space-y-3 mt-1">
            {options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={option.text}
                  required
                  aria-required="true"
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400"
                  placeholder={`Option ${index + 1}`}
                  maxLength={100}
                  aria-label={`Vote option ${index + 1}`}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    aria-label={`Remove Option ${index + 1}`}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 10 && (
            <button
              type="button"
              onClick={addOption}
              className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus size={16} className="-ml-0.5 mr-1.5" /> Add Option
            </button>
          )}
        </fieldset>

        {/* Tags */}
        <div>
          <label
            htmlFor="tags-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tags{" "}
            <span className="text-gray-500 text-xs">(Optional, Max 10)</span>
          </label>
          <div className="flex flex-wrap items-center gap-2 mb-2 empty:mb-0">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                  className="-mr-1 ml-1.5 inline-flex text-blue-500 hover:text-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-full p-0.5"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              </span>
            ))}
          </div>
          {tags.length < 10 && (
            <div className="flex">
              <input
                type="text"
                id="tags-input"
                value={tagInput}
                maxLength={25}
                onChange={(e) => setTagInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400"
                placeholder="Add a tag (e.g., tech)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                aria-label="Add a new tag"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 border border-gray-300 border-l-0 rounded-r-md bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                Add
              </button>
            </div>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Helps users find your vote. Press Enter or click Add.
          </p>
        </div>

        {/* Settings Checkboxes */}
        <fieldset className="space-y-4 pt-2">
          <legend className="text-sm font-medium text-gray-700 sr-only">
            Vote Settings
          </legend>
          <div className="relative flex items-start">
            <div className="flex items-center h-5">
              <input
                id="isPublic"
                name="isPublic"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label
                htmlFor="isPublic"
                className="font-medium text-gray-700 cursor-pointer"
              >
                Public Vote
              </label>
              <p className="text-xs text-gray-500">
                Visible to everyone. Uncheck for private (feature requires
                specific implementation).
              </p>
            </div>
          </div>
          <div className="relative flex items-start">
            <div className="flex items-center h-5">
              <input
                id="allowMultiple"
                name="allowMultiple"
                type="checkbox"
                checked={allowMultiple}
                onChange={(e) => setAllowMultiple(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label
                htmlFor="allowMultiple"
                className="font-medium text-gray-700 cursor-pointer"
              >
                Allow Multiple Selections
              </label>
              <p className="text-xs text-gray-500">
                Voters can choose more than one option.
              </p>
            </div>
          </div>
          <div className="relative flex items-start">
            <div className="flex items-center h-5">
              <input
                id="allowComments"
                name="allowComments"
                type="checkbox"
                checked={allowComments}
                onChange={(e) => setAllowComments(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label
                htmlFor="allowComments"
                className="font-medium text-gray-700 cursor-pointer"
              >
                Allow Comments
              </label>
              <p className="text-xs text-gray-500">
                Users can leave comments on this vote.
              </p>
            </div>
          </div>
        </fieldset>

        {/* Submit Button */}
        <div className="pt-5 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading || !userId}
            className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150 ${
              loading || !userId
                ? "bg-indigo-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? (
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
            ) : null}
            {loading ? "Creating Vote..." : "Create Vote"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateVotePage;
