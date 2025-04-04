// VotesList.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "YOUR URL KEY";
const supabaseKey = "YOUR API KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

const VotesList = () => {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVotes = async () => {
      const { data, error } = await supabase
        .from("votes")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) setVotes(data || []);
      setLoading(false);
    };

    fetchVotes();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Your Votes</h1>

      {loading ? (
        <div>Loading votes...</div>
      ) : (
        <div className="space-y-4">
          {votes.map((vote) => (
            <Link
              key={vote.id}
              to={`/dashboard/votes/${vote.id}`}
              className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium">{vote.title}</h3>
              <p className="text-sm text-gray-500">
                {new Date(vote.created_at).toLocaleDateString()} •{" "}
                {vote.options.length} options
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default VotesList;
