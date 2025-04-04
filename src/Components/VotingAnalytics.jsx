// src/components/Analytics.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../supabaseClient"; // Import your initialized Supabase client
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sector,
} from "recharts"; // Assuming you use recharts

// --- Helper Components (StatCard, LoadingIndicator, ErrorDisplay, renderActiveShape) ---

// Simple card for displaying key statistics
const StatCard = ({ title, value, isLoading, icon, color = "blue" }) => {
  const colorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    red: "text-red-600",
    yellow: "text-yellow-600",
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow-md flex items-center space-x-4 transition-shadow hover:shadow-lg">
      {icon && <div className={`text-3xl ${colorClasses[color]}`}>{icon}</div>}
      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          {title}
        </h3>
        {isLoading ? (
          <div className="h-8 mt-1 bg-gray-200 rounded w-20 animate-pulse"></div>
        ) : (
          <p className={`text-3xl font-bold ${colorClasses[color]}`}>
            {value ?? "N/A"}
          </p>
        )}
      </div>
    </div>
  );
};

// Placeholder for a loading spinner or skeleton
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

// Component to display errors
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

// Active Shape for Pie Chart (Example customization from Recharts docs)
const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        fill="none"
      />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="#333"
      >{`${value} Votes`}</text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={18}
        textAnchor={textAnchor}
        fill="#999"
      >
        {`(Rate ${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

// --- Main Analytics Component ---

function Analytics() {
  // State for different data sets
  const [summaryStats, setSummaryStats] = useState({
    totalResponses: null,
    activeVotes: null,
    totalVotes: null,
    contributingUsers: null,
  });
  const [responsesOverTime, setResponsesOverTime] = useState([]);
  const [topVotes, setTopVotes] = useState([]); // Represents top "Polls" by responses
  const [voteStatusDistribution, setVoteStatusDistribution] = useState([]);
  const [recentResponses, setRecentResponses] = useState([]);
  const [optionDistributionForVote, setOptionDistributionForVote] = useState(
    []
  );
  const [selectedVoteForDistribution, setSelectedVoteForDistribution] =
    useState(""); // Store the ID of the VOTE (poll)

  // Loading states for different sections
  const [loadingStates, setLoadingStates] = useState({
    summary: true,
    overTime: true,
    topPolls: true,
    statusDist: true,
    recentVotes: true,
    voteDist: false,
  });

  // Error states for different sections
  const [errorStates, setErrorStates] = useState({
    summary: null,
    overTime: null,
    topPolls: null,
    statusDist: null,
    recentVotes: null,
    voteDist: null,
  });

  // State for Pie Chart active index
  const [activeIndex, setActiveIndex] = useState(0);
  const onPieEnter = useCallback(
    (_, index) => {
      setActiveIndex(index);
    },
    [setActiveIndex]
  );

  // --- Data Fetching Functions (Using existing table names) ---

  // Fetch summary statistics
  const fetchSummaryStats = useCallback(async () => {
    setLoadingStates((prev) => ({ ...prev, summary: true }));
    setErrorStates((prev) => ({ ...prev, summary: null }));
    try {
      const [
        { count: totalResponses, error: responsesError },
        { count: activeVotesCount, error: activeVotesError },
        { count: totalVotes, error: totalVotesError },
      ] = await Promise.all([
        supabase
          .from("vote_responses")
          .select("*", { count: "exact", head: true }), // Count votes cast
        supabase
          .from("votes")
          .select("id", { count: "exact" })
          .or("due_date.is.null,due_date.gt.now"), // Count active polls
        supabase.from("votes").select("*", { count: "exact", head: true }), // Count total polls
      ]);

      if (responsesError) throw responsesError;
      if (activeVotesError) throw activeVotesError;
      if (totalVotesError) throw totalVotesError;

      // Fetch distinct users separately
      const { data: allVoters, error: allVotersError } = await supabase
        .from("vote_responses")
        .select("user_id");
      if (allVotersError) throw allVotersError;
      const distinctUserCount = allVoters
        ? new Set(allVoters.map((v) => v.user_id)).size
        : 0;

      setSummaryStats({
        totalResponses: totalResponses ?? 0,
        activeVotes: activeVotesCount ?? 0,
        totalVotes: totalVotes ?? 0,
        contributingUsers: distinctUserCount ?? 0,
      });
    } catch (error) {
      console.error("Error fetching summary stats:", error);
      setErrorStates((prev) => ({ ...prev, summary: error }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, summary: false }));
    }
  }, []);

  // Fetch vote responses grouped by time (e.g., daily)
  const fetchVotesOverTime = useCallback(async () => {
    setLoadingStates((prev) => ({ ...prev, overTime: true }));
    setErrorStates((prev) => ({ ...prev, overTime: null }));
    try {
      // Client-side grouping: Fetch from vote_responses
      const { data: responsesData, error } = await supabase
        .from("vote_responses") // Query the responses table
        .select("created_at")
        .order("created_at", { ascending: true });

      if (error) throw error;

      const responsesByDay = (responsesData || []).reduce((acc, response) => {
        const date = new Date(response.created_at).toLocaleDateString("en-CA");
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const formattedData = Object.entries(responsesByDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      setResponsesOverTime(formattedData);
    } catch (error) {
      console.error("Error fetching responses over time:", error);
      setErrorStates((prev) => ({ ...prev, overTime: error }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, overTime: false }));
    }
  }, []);

  // Fetch top voted polls (based on response count or votes.votes_count)
  const fetchTopVotes = useCallback(async (limit = 5) => {
    setLoadingStates((prev) => ({ ...prev, topPolls: true }));
    setErrorStates((prev) => ({ ...prev, topPolls: null }));
    try {
      // Using the votes_count column (Assumes trigger is set up and reliable)
      const { data, error } = await supabase
        .from("votes")
        .select("id, title, votes_count")
        .order("votes_count", { ascending: false, nullsFirst: false }) // Handle potential nulls
        .limit(limit);
      // NOTE: If votes_count is unreliable, use an RPC function to count responses per vote

      if (error) throw error;

      const formattedData = (data || []).map((v) => ({
        ...v,
        vote_count: v.votes_count ?? 0,
      }));
      setTopVotes(formattedData);
    } catch (error) {
      console.error("Error fetching top votes (polls):", error);
      setErrorStates((prev) => ({ ...prev, topPolls: error }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, topPolls: false }));
    }
  }, []);

  // Fetch distribution of vote statuses (active vs closed)
  const fetchVoteStatusDistribution = useCallback(async () => {
    setLoadingStates((prev) => ({ ...prev, statusDist: true }));
    setErrorStates((prev) => ({ ...prev, statusDist: null }));
    try {
      const { count: activeCount, error: activeError } = await supabase
        .from("votes")
        .select("*", { count: "exact", head: true })
        .or("due_date.is.null,due_date.gt.now");

      const { count: closedCount, error: closedError } = await supabase
        .from("votes")
        .select("*", { count: "exact", head: true })
        .not("due_date", "is", null)
        .lte("due_date", new Date().toISOString());

      if (activeError) throw activeError;
      if (closedError) throw closedError;

      const distributionData = [
        { name: "Active Polls", value: activeCount ?? 0 }, // Changed label
        { name: "Closed Polls", value: closedCount ?? 0 }, // Changed label
      ];
      setVoteStatusDistribution(distributionData);
    } catch (error) {
      console.error("Error fetching vote status distribution:", error);
      setErrorStates((prev) => ({ ...prev, statusDist: error }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, statusDist: false }));
    }
  }, []);

  // Fetch recent vote responses with user and poll info
  // THIS FUNCTION CONTAINS THE FIX
  const fetchRecentResponses = useCallback(async (limit = 10) => {
    setLoadingStates((prev) => ({ ...prev, recentVotes: true }));
    setErrorStates((prev) => ({ ...prev, recentVotes: null }));
    try {
      // Fetch recent RESPONSES, joining related data
      const { data, error } = await supabase
        .from("vote_responses")
        // --- CORRECTED .select() string (no comments) ---
        .select(
          `
                    id,
                    created_at,
                    user_id,
                    profiles ( full_name ),
                    vote_options (
                        text,
                        votes ( id, title )
                    )
                `
        )
        // --- End of corrected string ---
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Process data for easier display
      const formattedResponses = (data || []).map((response) => ({
        id: response.id,
        votedAt: new Date(response.created_at).toLocaleString(),
        userName:
          response.profiles?.full_name ||
          response.user_id?.substring(0, 8) + "..." ||
          "Unknown User",
        pollTitle: response.vote_options?.votes?.title || "Unknown Poll",
        optionText: response.vote_options?.text || "Unknown Option",
        pollId: response.vote_options?.votes?.id,
      }));

      setRecentResponses(formattedResponses);
    } catch (error) {
      console.error("Error fetching recent responses:", error);
      setErrorStates((prev) => ({ ...prev, recentVotes: error }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, recentVotes: false }));
    }
  }, []);

  // Fetch vote distribution for a specific VOTE (poll)
  const fetchVoteDistributionForVote = useCallback(async (voteId) => {
    if (!voteId) {
      setOptionDistributionForVote([]);
      return;
    }
    setLoadingStates((prev) => ({ ...prev, voteDist: true }));
    setErrorStates((prev) => ({ ...prev, voteDist: null }));
    setSelectedVoteForDistribution(voteId);

    try {
      // Using the pre-calculated 'votes' count from vote_options table
      // Assumes trigger is set up and reliable
      const { data: optionsData, error: optionsError } = await supabase
        .from("vote_options")
        .select("id, text, votes") // Select text and pre-calculated count
        .eq("vote_id", voteId);
      // NOTE: If vote_options.votes is unreliable, count responses per option instead (slower)

      if (optionsError) throw optionsError;

      if (!optionsData || optionsData.length === 0) {
        setOptionDistributionForVote([]);
        return;
      }

      const distribution = optionsData.map((option) => ({
        name: option.text,
        value: option.votes ?? 0,
      }));

      setOptionDistributionForVote(distribution.filter((d) => d !== null));
    } catch (error) {
      console.error(
        `Error fetching vote distribution for vote ${voteId}:`,
        error
      );
      setErrorStates((prev) => ({ ...prev, voteDist: error }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, voteDist: false }));
    }
  }, []);

  // --- useEffect to Fetch All Data on Mount ---
  useEffect(() => {
    fetchSummaryStats();
    fetchVotesOverTime();
    fetchTopVotes();
    fetchVoteStatusDistribution();
    fetchRecentResponses();
  }, [
    fetchSummaryStats,
    fetchVotesOverTime,
    fetchTopVotes,
    fetchVoteStatusDistribution,
    fetchRecentResponses,
  ]);

  // --- Memos for Chart Colors ---
  const PIE_COLORS = useMemo(
    () => ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"],
    []
  );
  const LINE_COLORS = useMemo(() => ["#8884d8", "#82ca9d", "#ffc658"], []);

  // --- Render Logic (Uses state updated from existing tables) ---
  return (
    <div className="analytics-container p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl md:text-3xl font-semibold mb-6 text-gray-800">
        Voting Analytics
      </h1>

      {/* Section 1: Summary Statistics */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Overview</h2>
        {errorStates.summary ? (
          <ErrorDisplay
            error={errorStates.summary}
            sectionName="Summary Stats"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Votes Cast"
              value={summaryStats.totalResponses}
              isLoading={loadingStates.summary}
              icon="🗳️"
              color="blue"
            />
            <StatCard
              title="Active Polls"
              value={summaryStats.activeVotes}
              isLoading={loadingStates.summary}
              icon="📊"
              color="green"
            />
            <StatCard
              title="Total Polls"
              value={summaryStats.totalVotes}
              isLoading={loadingStates.summary}
              icon="📋"
              color="purple"
            />
            <StatCard
              title="Contributing Users"
              value={summaryStats.contributingUsers}
              isLoading={loadingStates.summary}
              icon="👥"
              color="yellow"
            />
          </div>
        )}
      </section>

      {/* Section 2: Votes Cast Over Time */}
      <section className="mb-8 p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Votes Cast Over Time
        </h2>
        {loadingStates.overTime ? (
          <LoadingIndicator message="Loading time series data..." />
        ) : errorStates.overTime ? (
          <ErrorDisplay
            error={errorStates.overTime}
            sectionName="Votes Over Time"
          />
        ) : responsesOverTime.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={responsesOverTime}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke={LINE_COLORS[0]}
                strokeWidth={2}
                activeDot={{ r: 8 }}
                name="Votes Cast per Day"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-4">
            No time series data available.
          </p>
        )}
      </section>

      {/* Section 3: Poll Status Distribution & Top Polls */}
      <section className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Poll Status Pie Chart */}
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Poll Status
          </h2>
          {loadingStates.statusDist ? (
            <LoadingIndicator message="Loading poll status..." />
          ) : errorStates.statusDist ? (
            <ErrorDisplay
              error={errorStates.statusDist}
              sectionName="Poll Status"
            />
          ) : voteStatusDistribution.length > 0 &&
            (voteStatusDistribution[0].value > 0 ||
              voteStatusDistribution[1].value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={voteStatusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {voteStatusDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} polls`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No poll status data available.
            </p>
          )}
        </div>

        {/* Top Polls List/Table */}
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Most Popular Polls
          </h2>
          {loadingStates.topPolls ? (
            <LoadingIndicator message="Loading top polls..." />
          ) : errorStates.topPolls ? (
            <ErrorDisplay
              error={errorStates.topPolls}
              sectionName="Top Polls"
            />
          ) : topVotes.length > 0 ? (
            <ul className="space-y-3">
              {topVotes.map((vote, index) => (
                <li
                  key={vote.id}
                  className="flex justify-between items-center border-b pb-2 last:border-b-0"
                >
                  <span
                    className="text-gray-800 truncate pr-2"
                    title={vote.title}
                  >
                    {index + 1}. {vote.title}
                  </span>
                  <span className="font-semibold text-blue-600">
                    {vote.vote_count?.toLocaleString() ?? "N/A"} Votes
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No poll data available to rank.
            </p>
          )}
        </div>
      </section>

      {/* Section 4: Recent Vote Activity */}
      <section className="mb-8 p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Recent Votes Cast (Last {recentResponses.length})
        </h2>
        {loadingStates.recentVotes ? (
          <LoadingIndicator message="Loading recent votes..." />
        ) : errorStates.recentVotes ? (
          <ErrorDisplay
            error={errorStates.recentVotes}
            sectionName="Recent Votes"
          />
        ) : recentResponses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Time
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    User
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Poll
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Voted For Option
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentResponses.map((response) => (
                  <tr key={response.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {response.votedAt}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {response.userName}
                    </td>
                    <td
                      className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 truncate max-w-xs"
                      title={response.pollTitle}
                    >
                      {response.pollTitle}
                    </td>
                    <td
                      className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 truncate max-w-xs"
                      title={response.optionText}
                    >
                      {response.optionText}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <button
                        onClick={() =>
                          fetchVoteDistributionForVote(response.pollId)
                        }
                        disabled={!response.pollId || loadingStates.voteDist}
                        className={`text-indigo-600 hover:text-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed transition duration-150 ease-in-out ${
                          loadingStates.voteDist &&
                          selectedVoteForDistribution === response.pollId
                            ? "animate-pulse"
                            : ""
                        }`}
                        title={
                          !response.pollId
                            ? "Poll details unavailable"
                            : "View vote distribution for this poll"
                        }
                      >
                        {loadingStates.voteDist &&
                        selectedVoteForDistribution === response.pollId
                          ? "Loading..."
                          : "Details"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            No recent vote activity found.
          </p>
        )}
      </section>

      {/* Section 5: Vote Distribution for Selected Poll */}
      <section className="mb-8 p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Option Distribution{" "}
          {selectedVoteForDistribution
            ? `for Poll`
            : "(Select a poll from Recent Activity)"}
        </h2>
        {loadingStates.voteDist ? (
          <LoadingIndicator message="Loading vote distribution..." />
        ) : errorStates.voteDist ? (
          <ErrorDisplay
            error={errorStates.voteDist}
            sectionName="Vote Distribution"
          />
        ) : optionDistributionForVote.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={optionDistributionForVote}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                fill="#8884d8"
                dataKey="value"
                onMouseEnter={onPieEnter}
              >
                {optionDistributionForVote.map((entry, index) => (
                  <Cell
                    key={`cell-dist-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} votes`, name]} />
            </PieChart>
          </ResponsiveContainer>
        ) : selectedVoteForDistribution ? (
          <p className="text-gray-500 text-center py-4">
            No votes found or options unavailable for the selected poll.
          </p>
        ) : (
          <p className="text-gray-500 text-center py-4">
            Click 'Details' on a vote in the Recent Activity table to see the
            distribution for its poll.
          </p>
        )}
      </section>
    </div>
  );
}

export default Analytics;
