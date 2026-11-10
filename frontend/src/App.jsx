import { useEffect, useState } from "react";
import axios from "axios";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";

import { Pie, Bar } from "react-chartjs-2";
import "./App.css";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  // General state
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState("Dashboard");
  const [error, setError] = useState("");

  // Call checker
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callDescription, setCallDescription] = useState("");
  const [callResult, setCallResult] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [callLoading, setCallLoading] = useState(false);

  // SMS checker
  const [messageText, setMessageText] = useState("");
  const [smsResult, setSmsResult] = useState(null);
  const [smsHistory, setSmsHistory] = useState([]);
  const [smsLoading, setSmsLoading] = useState(false);

  // Phone lookup
  const [lookupNumber, setLookupNumber] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupHistory, setLookupHistory] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directorySearch, setDirectorySearch] = useState("");
  const [directoryNumber, setDirectoryNumber] = useState("");
  const [directoryName, setDirectoryName] = useState("");
  const [directoryCategory, setDirectoryCategory] = useState("Unknown");
  const [directoryNotes, setDirectoryNotes] = useState("");
  const [directoryMessage, setDirectoryMessage] = useState("");

  // Quiz analytics
  const [quizAnalytics, setQuizAnalytics] = useState({
    totalAttempts: 0,
    averageScore: 0,
    highestScore: 0,
  });
  const [quizHistory, setQuizHistory] = useState([]);

  useEffect(() => {
    loadDashboard();
    loadQuizAnalytics();
  }, []);

  // URL scanner
  async function scanURL(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await axios.post(`${API}/api/scan`, { url });
      setResult(response.data);
      setUrl("");
      await loadHistory();
      await loadDashboard();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to scan URL. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  // URL scan history
  async function loadHistory() {
    try {
      const response = await axios.get(`${API}/api/history`);
      setHistory(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError("Unable to load URL scan history.");
    }
  }

  // Dashboard statistics
  async function loadDashboard() {
    try {
      const response = await axios.get(`${API}/api/dashboard`);
      setDashboard(response.data);
    } catch (err) {
      console.error("Dashboard loading error:", err);
    }
  }

  // Quiz analytics
 
async function loadQuizAnalytics() {
  try {
    const analyticsResponse = await axios.get(
      `${API}/api/quiz-analytics`
    );

    const data = analyticsResponse.data;

    setQuizAnalytics({
      totalAttempts: Number(data.attempts ?? 0),
      averageScore: Number(data.average_percentage ?? 0),
      highestScore: Number(data.highest_percentage ?? 0),
    });

    const historyResponse = await axios.get(
      `${API}/api/quiz-history`
    );

    setQuizHistory(
      Array.isArray(historyResponse.data)
        ? historyResponse.data
        : []
    );
  } catch (err) {
    console.error("Failed to load quiz analytics:", err);
  }
}

  // Call checker
  async function checkCall(e) {
    e.preventDefault();
    setCallLoading(true);
    setError("");
    setCallResult(null);

    try {
      const response = await axios.post(`${API}/api/check-call`, {
        phoneNumber: phoneNumber.trim(),
        callDescription: callDescription.trim(),
        description: callDescription.trim(),
      });

      setCallResult(response.data);
      await loadCallHistory();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to check this call. Verify the backend and database."
      );
    } finally {
      setCallLoading(false);
    }
  }

  async function loadCallHistory() {
    try {
      const response = await axios.get(`${API}/api/call-history`);

      setCallHistory(
        Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.history)
          ? response.data.history
          : []
      );
    } catch (err) {
      console.error("Call history loading error:", err);
    }
  }

  // SMS checker
  async function checkSMS(e) {
    e.preventDefault();
    setSmsLoading(true);
    setError("");
    setSmsResult(null);

    try {
      const response = await axios.post(`${API}/api/check-sms`, {
        messageText: messageText.trim(),
        message: messageText.trim(),
      });

      setSmsResult(response.data);
      await loadSMSHistory();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to check this SMS. Verify the backend and database."
      );
    } finally {
      setSmsLoading(false);
    }
  }

  async function loadSMSHistory() {
    try {
      const response = await axios.get(`${API}/api/sms-history`);

      setSmsHistory(
        Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.history)
          ? response.data.history
          : []
      );
    } catch (err) {
      console.error("SMS history loading error:", err);
    }
  }

  // PHONE LOOKUP: check a number
  async function lookupPhone(e) {
    e.preventDefault();
    setLookupLoading(true);
    setError("");
    setLookupResult(null);

    try {
      const response = await axios.post(
        `${API}/api/lookup-phone`,
        { phoneNumber: lookupNumber.trim() }
      );

      setLookupResult(response.data);
      await loadPhoneLookupHistory();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to look up this number. Check that the backend is running."
      );
    } finally {
      setLookupLoading(false);
    }
  }

  // Load saved directory
  async function loadPhoneDirectory() {
    setDirectoryLoading(true);

    try {
      const response = await axios.get(`${API}/api/phone-directory`);

      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.directory)
        ? response.data.directory
        : Array.isArray(response.data?.entries)
        ? response.data.entries
        : [];

      setDirectory(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load the saved phone directory."
      );
    } finally {
      setDirectoryLoading(false);
    }
  }

  // Add an entry to the local phone directory
  async function addDirectoryEntry(e) {
    e.preventDefault();
    setDirectoryMessage("");
    setError("");

    try {
      
const response = await axios.post(
  `${API}/api/phone-directory`,
  {
    phoneNumber: directoryNumber.trim(),
    name: directoryName.trim(),
    businessName: directoryName.trim(),
    business_name: directoryName.trim(),
    category: directoryCategory,
    notes: directoryNotes.trim(),
  }
);

      setDirectoryMessage(
        response.data?.message || "Directory entry submitted."
      );

      setDirectoryNumber("");
      setDirectoryName("");
      setDirectoryCategory("Unknown");
      setDirectoryNotes("");

      await loadPhoneDirectory();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to add this directory entry. Check the backend fields."
      );
    }
  }

  // Load phone lookup history
  async function loadPhoneLookupHistory() {
    try {
      const response = await axios.get(
        `${API}/api/phone-lookup-history`
      );

      setLookupHistory(
        Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.history)
          ? response.data.history
          : []
      );
    } catch (err) {
      console.error("Phone lookup history error:", err);
    }
  }

  // Navigation
  async function openPage(name) {
    setPage(name);
    setError("");

    if (name === "Dashboard") {
      await loadDashboard();
      await loadQuizAnalytics();
    }

    if (name === "History") await loadHistory();
    if (name === "Call Checker") await loadCallHistory();
    if (name === "SMS Checker") await loadSMSHistory();

    if (name === "Phone Lookup") {
      await Promise.all([
        loadPhoneDirectory(),
        loadPhoneLookupHistory(),
      ]);
    }
  }

  // Shared helpers
  function getColor(status) {
    const value = String(status || "").toLowerCase();

    if (value.includes("safe")) return "#16a34a";
    if (value.includes("low")) return "#ca8a04";
    if (value.includes("suspicious")) return "#ea580c";
    if (value.includes("insufficient")) return "#94a3b8";
    if (value.includes("directory match")) return "#38bdf8";
    return "#dc2626";
  }

  function showFindings(findings) {
    if (Array.isArray(findings)) return findings;

    if (typeof findings === "string" && findings.trim()) {
      try {
        const parsed = JSON.parse(findings);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return findings.split(/\n|,/).filter(Boolean);
      }
    }

    return [];
  }

  function getRiskScore(data) {
  const score =
    data?.riskScore ??
    data?.risk_score ??
    data?.score;

  if (score === null || score === undefined || score === "") {
    return null;
  }

  const number = Number(score);
  return Number.isFinite(number) ? number : null;
}

  function getStatus(data) {
    return (
      data?.status ||
      data?.riskLevel ||
      data?.risk_level ||
      data?.riskStatus ||
      (data?.directory_match ? "Directory Match" : "Unknown")
    );
  }

  function getRecommendation(data) {
    return (
      data?.recommendation ||
      "Stay cautious. Never share OTPs, passwords, UPI PINs, or banking details."
    );
  }

  function getPhoneValue(item) {
    const business = item?.business;
    return (
      item?.phone_number ||
      item?.phoneNumber ||
      item?.number ||
      item?.phone ||
      business?.phone_number ||
      business?.phoneNumber ||
      "Not provided"
    );
  }

  function getDirectoryName(item) {
    const business = item?.business;
    return (
      business?.business_name ||
      business?.businessName ||
      business?.name ||
      item?.business_name ||
      item?.businessName ||
      item?.name ||
      item?.caller_name ||
      item?.contact_name ||
      "Unknown"
    );
  }

  function getDirectoryCategory(item) {
    return (
      item?.business?.category ||
      item?.category ||
      item?.type ||
      "Unknown"
    );
  }

  function getDirectoryNotes(item) {
    return (
      item?.business?.notes ||
      item?.business?.description ||
      item?.notes ||
      item?.description ||
      ""
    );
  }

  const filteredDirectory = directory.filter((item) => {
    const search = directorySearch.toLowerCase().trim();

    if (!search) return true;

    return [
      getPhoneValue(item),
      getDirectoryName(item),
      getDirectoryCategory(item),
      getDirectoryNotes(item),
    ]
      .join(" ")
      .toLowerCase()
      .includes(search);
  });

  // Dashboard charts
  const chartData = {
    labels: ["Safe", "Low Risk", "Suspicious", "High Risk"],
    datasets: [
      {
        data: [
          Number(dashboard?.safe ?? dashboard?.safeScans ?? 0),
          Number(dashboard?.low_risk ?? dashboard?.lowRiskScans ?? 0),
          Number(dashboard?.suspicious ?? dashboard?.suspiciousScans ?? 0),
          Number(dashboard?.high_risk ?? dashboard?.highRiskScans ?? 0),
        ],
        backgroundColor: [
          "#16a34a",
          "#ca8a04",
          "#ea580c",
          "#dc2626",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom", labels: { color: "#94a3b8", padding: 18 } } },
  };

  const recentQuizHistory = [...quizHistory].reverse().slice(-6);

  const quizChartData = {
    labels: recentQuizHistory.map(
      (_, index) => `Attempt ${index + 1}`
    ),
    datasets: [
      {
        label: "Quiz Score (%)",
        data: recentQuizHistory.map((quiz) =>
          Number(quiz.score_percent || quiz.scorePercent || 0)
        ),
        backgroundColor: "#6366f1",
        borderWidth: 1,
      },
    ],
  };

  const quizChartOptions = {
    responsive: true,
    scales: {
      y: {
        min: 0,
        max: 100,
        title: { display: true, text: "Score (%)" },
      },
    },
    plugins: { legend: { position: "bottom" } },
  };

  const navigation = [
    "Dashboard",
    "Scanner",
    "Call Checker",
    "SMS Checker",
    "Phone Lookup",
    "History",
    "Quiz",
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>🛡 PhishGuard</h2>
        <p className="subtitle">Intelligent Phishing Detection</p>

        {navigation.map((name) => (
          <button
            key={name}
            className={page === name ? "nav active" : "nav"}
            onClick={() => openPage(name)}
          >
            {name === "Call Checker"
              ? "📞  Call Checker"
              : name === "SMS Checker"
              ? "💬  SMS Checker"
              : name === "Phone Lookup"
              ? "📱  Phone Lookup"
              : name}
          </button>
        ))}
      </aside>

      <main className="main">
        <header className="header">
          <h1>{page}</h1>
          <span>Cybersecurity Platform</span>
        </header>

        {error && (
          <div className="error">
            {error}
            <button
              className="dismiss-error"
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}

        {/* DASHBOARD */}
        {page === "Dashboard" && (
          <section>
            <div className="cards">
              <div className="card">
                <h3>Total Scans</h3>
                <h2>{dashboard?.total ?? dashboard?.totalScans ?? 0}</h2>
              </div>
              <div className="card">
                <h3>Safe Scans</h3>
                <h2>{dashboard?.safe ?? dashboard?.safeScans ?? 0}</h2>
              </div>
              <div className="card">
                <h3>Low Risk</h3>
                <h2>{dashboard?.low_risk ?? dashboard?.lowRiskScans ?? 0}</h2>
              </div>
              <div className="card">
                <h3>Suspicious</h3>
                <h2>{dashboard?.suspicious ?? dashboard?.suspiciousScans ?? 0}</h2>
              </div>
              <div className="card">
                <h3>High Risk</h3>
                <h2>{dashboard?.high_risk ?? dashboard?.highRiskScans ?? 0}</h2>
              </div>
            </div>

            <div className="panel">
              <h2>Scan Analytics</h2>
              <p>Distribution of scanned website URLs</p>
              <div className="chart-box">
                {chartData.datasets[0].data.reduce((sum, value) => sum + value, 0) > 0 ? (
                  <Pie data={chartData} options={chartOptions} />
                ) : (
                  <div className="chart-empty">
                    <span className="chart-empty-icon">📊</span>
                    <h3>No scan data yet</h3>
                    <p>Scan a website URL to see your risk distribution here.</p>
                    <button className="primary" onClick={() => openPage("Scanner")}>
                      Scan a URL
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="panel">
              <h2>Quiz Performance Analytics</h2>
              <p>Track your phishing awareness quiz performance.</p>

              <div className="cards quiz-stats">
                <div className="card">
                  <h3>Total Quiz Attempts</h3>
                  <h2>{quizAnalytics.totalAttempts ?? 0}</h2>
                </div>
                <div className="card">
                  <h3>Average Quiz Score</h3>
                  <h2>{quizAnalytics.averageScore ?? 0}%</h2>
                </div>
                <div className="card">
                  <h3>Highest Quiz Score</h3>
                  <h2>{quizAnalytics.highestScore ?? 0}%</h2>
                </div>
              </div>

              <div className="quiz-chart">
                <h3>Recent Quiz Scores</h3>
                {quizHistory.length > 0 ? (
                  <Bar
                    data={quizChartData}
                    options={quizChartOptions}
                  />
                ) : (
                  <p>Complete a quiz to see your performance.</p>
                )}
              </div>
            </div>

            <div className="panel">
              <h2>PhishGuard Protection</h2>
              <p>
                Analyze suspicious URLs, phone calls, SMS messages, and
                phone numbers, and learn how to recognize phishing attempts.
              </p>
              <div className="action-buttons">
                <button
                  className="primary"
                  onClick={() => openPage("Scanner")}
                >
                  Scan a URL
                </button>
                <button
                  className="primary"
                  onClick={() => openPage("Call Checker")}
                >
                  Check a Call
                </button>
                <button
                  className="primary"
                  onClick={() => openPage("SMS Checker")}
                >
                  Check an SMS
                </button>
                <button
                  className="primary"
                  onClick={() => openPage("Phone Lookup")}
                >
                  Phone Lookup
                </button>
              </div>
            </div>
          </section>
        )}

        {/* URL SCANNER */}
        {page === "Scanner" && (
          <section className="panel">
            <h2>URL Phishing Scanner</h2>
            <p>Enter a website URL to analyze suspicious patterns.</p>

            <form onSubmit={scanURL}>
              <input
                type="text"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <button className="primary" disabled={loading}>
                {loading ? "Scanning..." : "Scan URL"}
              </button>
            </form>

            {result && (
              <div className="result">
                <h2>Scan Result</h2>
                <p><strong>URL:</strong> {result.url || url}</p>
                <h1 style={{ color: getColor(getStatus(result)) }}>
                  {getRiskScore(result)}/100
                </h1>
                <h3>{getStatus(result)}</h3>
                <h3>Detection Findings</h3>
                <ul>
                  {showFindings(result.findings).map((finding, index) => (
                    <li key={index}>{finding}</li>
                  ))}
                </ul>
                <p>
                  <strong>Recommendation:</strong>{" "}
                  {getRecommendation(result)}
                </p>
              </div>
            )}
          </section>
        )}

        {/* CALL CHECKER */}
        {page === "Call Checker" && (
          <section className="panel">
            <div className="feature-heading">
              <span className="feature-icon">📞</span>
              <div>
                <h2>Suspicious Call Checker</h2>
                <p>Check a caller's claims for common scam warning signs.</p>
              </div>
            </div>

            <form className="stacked-form" onSubmit={checkCall}>
              <label htmlFor="phoneNumber">Phone number (optional)</label>
              <input
                id="phoneNumber"
                type="tel"
                placeholder="Enter the caller's phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />

              <label htmlFor="callDescription">What did the caller say?</label>
              <textarea
                id="callDescription"
                rows="5"
                placeholder="Example: The caller said my bank account would be blocked and asked me to share an OTP."
                value={callDescription}
                onChange={(e) => setCallDescription(e.target.value)}
                required
              />

              <button className="primary" disabled={callLoading}>
                {callLoading ? "Analyzing call..." : "Analyze Call"}
              </button>
            </form>

            {callResult && (
              <div className="result">
                <h2>Call Analysis Result</h2>
                <p>
                  <strong>Phone number:</strong>{" "}
                  {callResult.phoneNumber ||
                    callResult.phone_number ||
                    phoneNumber ||
                    "Not provided"}
                </p>
                <h1 style={{ color: getColor(getStatus(callResult)) }}>
                  {getRiskScore(callResult)}/100
                </h1>
                <h3 style={{ color: getColor(getStatus(callResult)) }}>
                  {getStatus(callResult)}
                </h3>

                <h3>Warning Signs</h3>
                {showFindings(callResult.findings).length > 0 ? (
                  <ul>
                    {showFindings(callResult.findings).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    No specific warning signs were returned. This does not
                    guarantee that the call is safe.
                  </p>
                )}

                <p>
                  <strong>Recommendation:</strong>{" "}
                  {getRecommendation(callResult)}
                </p>
              </div>
            )}

            <div className="history-section">
              <div className="section-title-row">
                <h3>Recent Call Checks</h3>
                <button
                  className="secondary"
                  onClick={loadCallHistory}
                >
                  Refresh
                </button>
              </div>

              {callHistory.length === 0 ? (
                <p>No call checks recorded yet.</p>
              ) : (
                callHistory.map((item, index) => (
                  <div className="history-item" key={item.id ?? index}>
                    <p>
                      <strong>Number:</strong>{" "}
                      {item.phone_number ||
                        item.phoneNumber ||
                        "Not provided"}
                      <br />
                      <span>
                        {item.call_description ||
                          item.callDescription ||
                          ""}
                      </span>
                    </p>
                    <strong>
                      {Number(item.risk_score ?? item.riskScore ?? 0)}/100
                    </strong>
                    <span>{item.status || "Unknown"}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* SMS CHECKER */}
        {page === "SMS Checker" && (
          <section className="panel">
            <div className="feature-heading">
              <span className="feature-icon">💬</span>
              <div>
                <h2>Suspicious SMS Checker</h2>
                <p>Paste a message to look for phishing and scam indicators.</p>
              </div>
            </div>

            <form className="stacked-form" onSubmit={checkSMS}>
              <label htmlFor="messageText">SMS message</label>
              <textarea
                id="messageText"
                rows="7"
                placeholder="Paste the suspicious SMS here..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                required
              />

              <button className="primary" disabled={smsLoading}>
                {smsLoading ? "Analyzing SMS..." : "Analyze SMS"}
              </button>
            </form>

            {smsResult && (
              <div className="result">
                <h2>SMS Analysis Result</h2>
                <h1 style={{ color: getColor(getStatus(smsResult)) }}>
                  {getRiskScore(smsResult)}/100
                </h1>
                <h3 style={{ color: getColor(getStatus(smsResult)) }}>
                  {getStatus(smsResult)}
                </h3>

                <h3>Detection Findings</h3>
                {showFindings(smsResult.findings).length > 0 ? (
                  <ul>
                    {showFindings(smsResult.findings).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    No specific warning signs were returned. Treat unexpected
                    messages carefully.
                  </p>
                )}

                <p>
                  <strong>Recommendation:</strong>{" "}
                  {getRecommendation(smsResult)}
                </p>
              </div>
            )}

            <div className="history-section">
              <div className="section-title-row">
                <h3>Recent SMS Checks</h3>
                <button
                  className="secondary"
                  onClick={loadSMSHistory}
                >
                  Refresh
                </button>
              </div>

              {smsHistory.length === 0 ? (
                <p>No SMS checks recorded yet.</p>
              ) : (
                smsHistory.map((item, index) => (
                  <div className="history-item" key={item.id ?? index}>
                    <p className="message-preview">
                      {item.message_text ||
                        item.messageText ||
                        "SMS message"}
                    </p>
                    <strong>
                      {Number(item.risk_score ?? item.riskScore ?? 0)}/100
                    </strong>
                    <span>{item.status || "Unknown"}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* PHONE LOOKUP */}
        {page === "Phone Lookup" && (
          <section>
            <div className="panel">
              <div className="feature-heading">
                <span className="feature-icon">📱</span>
                <div>
                  <h2>Phone Number Lookup</h2>
                  <p>
                    Check a number using PhishGuard's rule-based risk
                    assessment and entries saved in your local directory.
                  </p>
                </div>
              </div>

              <form className="stacked-form" onSubmit={lookupPhone}>
                <label htmlFor="lookupNumber">Phone number</label>
                <input
                  id="lookupNumber"
                  type="tel"
                  placeholder="Enter a phone number"
                  value={lookupNumber}
                  onChange={(e) => setLookupNumber(e.target.value)}
                  required
                />

                <button
                  className="primary"
                  disabled={lookupLoading}
                >
                  {lookupLoading ? "Checking number..." : "Check Number"}
                </button>
              </form>

              {lookupResult && (
                <div className="result">
                  <h2>Phone Lookup Result</h2>

                  <p>
                    <strong>Phone number:</strong>{" "}
                    {getPhoneValue(lookupResult) !== "Not provided"
                      ? getPhoneValue(lookupResult)
                      : lookupNumber}
                  </p>

                  <h2
                    className="lookup-status"
                    style={{ color: getColor(getStatus(lookupResult)) }}
                  >
                    {getStatus(lookupResult)}
                  </h2>

                  <h1 style={{ color: getColor(getStatus(lookupResult)) }}>
  {getRiskScore(lookupResult) === null
    ? "Risk Not Verified"
    : `${getRiskScore(lookupResult)}/100`}
</h1>

                  <p>
                    <strong>Directory name:</strong>{" "}
                    {getDirectoryName(lookupResult)}
                  </p>
                  <p>
                    <strong>Category:</strong>{" "}
                    {getDirectoryCategory(lookupResult)}
                  </p>
                  <p>
                    <strong>Official report status:</strong>{" "}
                    {lookupResult.officialReportStatus ||
                      lookupResult.official_report_status ||
                      lookupResult.reportStatus ||
                      "Not checked"}
                  </p>

                  <h3>Findings</h3>
                  {showFindings(lookupResult.findings).length > 0 ? (
                    <ul>
                      {showFindings(lookupResult.findings).map(
                        (item, index) => (
                          <li key={index}>{item}</li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p>
                      No findings were returned. This does not prove the
                      number is safe.
                    </p>
                  )}

                  <p>
                    <strong>Recommendation:</strong>{" "}
                    {getRecommendation(lookupResult)}
                  </p>
                </div>
              )}

              <p className="lookup-notice">
                Important: a low risk score does not guarantee that a phone
                number is safe. This feature uses the checks provided by your
                backend and locally saved directory entries; it does not
                independently verify the identity or reputation of a caller.
              </p>
            </div>

            {/* Add directory entry */}
            <div className="panel">
              <h2>Add to Local Phone Directory</h2>
              <p>
                Save a number and notes in your own PhishGuard database.
                Add only information you have a legitimate reason to record.
              </p>

              <form
                className="stacked-form"
                onSubmit={addDirectoryEntry}
              >
                <label htmlFor="directoryNumber">Phone number</label>
                <input
                  id="directoryNumber"
                  type="tel"
                  placeholder="Enter phone number"
                  value={directoryNumber}
                  onChange={(e) => setDirectoryNumber(e.target.value)}
                  required
                />

                <label htmlFor="directoryName">Name or label</label>
                <input
                  id="directoryName"
                  type="text"
                  placeholder="Example: Reported caller"
                  value={directoryName}
                  onChange={(e) => setDirectoryName(e.target.value)}
                  required
                />

                <label htmlFor="directoryCategory">Category</label>
                <select
                  id="directoryCategory"
                  className="directory-select"
                  value={directoryCategory}
                  onChange={(e) => setDirectoryCategory(e.target.value)}
                >
                  <option value="Unknown">Unknown</option>
                  <option value="Reported Scam">Reported Scam</option>
                  <option value="Business">Business</option>
                  <option value="Personal Contact">Personal Contact</option>
                  <option value="Other">Other</option>
                </select>

                <label htmlFor="directoryNotes">Notes</label>
                <textarea
                  id="directoryNotes"
                  rows="3"
                  placeholder="Optional notes about this entry"
                  value={directoryNotes}
                  onChange={(e) => setDirectoryNotes(e.target.value)}
                />

                <button className="primary">
                  Save Directory Entry
                </button>
              </form>

              {directoryMessage && (
                <p className="success-message">{directoryMessage}</p>
              )}
            </div>

            {/* Saved directory */}
            <div className="panel">
              <div className="section-title-row">
                <h2>Saved Phone Directory</h2>
                <button
                  className="secondary"
                  onClick={loadPhoneDirectory}
                  disabled={directoryLoading}
                >
                  {directoryLoading ? "Loading..." : "Refresh"}
                </button>
              </div>

              <input
                className="directory-search"
                type="text"
                placeholder="Search by number, name, category, or notes"
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
              />

              {filteredDirectory.length === 0 ? (
                <p>
                  {directory.length === 0
                    ? "No saved directory entries were returned."
                    : "No entries match your search."}
                </p>
              ) : (
                filteredDirectory.map((item, index) => (
                  <div
                    className="history-item directory-item"
                    key={item.id ?? index}
                  >
                    <div className="directory-details">
                      <strong>{getDirectoryName(item)}</strong>
                      <p>
                        <strong>Number:</strong> {getPhoneValue(item)}
                      </p>
                      <p>
                        <strong>Category:</strong>{" "}
                        {getDirectoryCategory(item)}
                      </p>
                      {getDirectoryNotes(item) && (
                        <p>
                          <strong>Notes:</strong> {getDirectoryNotes(item)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

{/* Lookup history */}
<div className="panel">
  <div className="section-title-row">
    <h2>Previous Phone Lookups</h2>
    <button
      className="secondary"
      onClick={loadPhoneLookupHistory}
    >
      Refresh History
    </button>
  </div>

  {lookupHistory.length === 0 ? (
    <p>No phone lookup history available.</p>
  ) : (
    lookupHistory.map((item, index) => {
      const score = getRiskScore(item);

      const status =
        item.risk_status ||
        item.riskStatus ||
        item.status ||
        (score === null
          ? "Risk Not Verified"
          : "Unknown");

      return (
        <div
          className="history-item"
          key={item.id ?? index}
        >
          <p>
            <strong>Number:</strong>{" "}
            {getPhoneValue(item)}

            {item.created_at && (
              <>
                <br />
                <span>
                  {new Date(item.created_at).toLocaleString()}
                </span>
              </>
            )}
          </p>

          <strong>
            {score === null
              ? "Risk Not Verified"
              : `${score}/100`}
          </strong>

          <span>{status}</span>
        </div>
      );
    })
  )}
</div>
</section>
)}

        {/* URL SCAN HISTORY */}
        {page === "History" && (
          <section className="panel">
            <div className="section-title-row">
              <h2>Previous URL Scans</h2>
              <button className="secondary" onClick={loadHistory}>
                Refresh History
              </button>
            </div>

            {history.length === 0 && <p>No URL scan history available.</p>}

            {history.map((item, index) => (
              <div className="history-item" key={item.id ?? index}>
                <p>{item.url}</p>
                <strong>
                  {Number(item.risk_score ?? item.riskScore ?? 0)}/100
                </strong>
                <span>{item.status}</span>
              </div>
            ))}
          </section>
        )}

        {/* QUIZ */}
        {page === "Quiz" && (
          <Quiz onQuizCompleted={loadQuizAnalytics} />
        )}
      </main>
    </div>
  );
}

// PHISHING AWARENESS QUIZ
function Quiz({ onQuizCompleted }) {
  const questions = [
    {
      question: "What should you check before opening a website link?",
      options: [
        "The website address",
        "The background color",
        "The number of images",
        "The font style",
      ],
      answer: 0,
    },
    {
      question: "What is phishing?",
      options: [
        "A computer game",
        "A cyber attack to steal information",
        "A programming language",
        "A computer hardware device",
      ],
      answer: 1,
    },
    {
      question: "Should you share your OTP with unknown people?",
      options: ["Yes", "No", "Only sometimes", "Always"],
      answer: 1,
    },
  ];

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function saveQuizResult(finalScore) {
    setSaving(true);
    setMessage("");

    const totalQuestions = questions.length;
    const scorePercent = Math.round(
      (finalScore / totalQuestions) * 100
    );

    try {
      await axios.post(`${API}/api/quiz-history`, {
        totalQuestions,
        correctAnswers: finalScore,
        scorePercent,
      });

      setMessage("Quiz result saved successfully!");

      if (onQuizCompleted) await onQuizCompleted();
    } catch (err) {
      console.error("Quiz save error:", err);
      setMessage("Unable to save quiz result. Please check backend.");
    } finally {
      setSaving(false);
    }
  }

  async function nextQuestion() {
    if (selected === null) {
      setMessage("Please select an answer.");
      return;
    }

    const newScore =
      selected === questions[index].answer ? score + 1 : score;

    setScore(newScore);
    setMessage("");

    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setSelected(null);
    } else {
      setFinished(true);
      await saveQuizResult(newScore);
    }
  }

  function restartQuiz() {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
    setSaving(false);
    setMessage("");
  }

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <section className="panel">
        <h2>Quiz Completed!</h2>
        <h1>{score} / {questions.length}</h1>
        <h2>Score: {percentage}%</h2>
        <p>
          {percentage >= 70
            ? "Great job! You understand phishing awareness."
            : "Keep learning to improve your phishing awareness."}
        </p>
        {saving && <p>Saving quiz result...</p>}
        {message && <p>{message}</p>}
        <button
          className="primary"
          onClick={restartQuiz}
          disabled={saving}
        >
          Restart Quiz
        </button>
      </section>
    );
  }

  const currentQuestion = questions[index];

  return (
    <section className="panel">
      <h2>Phishing Awareness Quiz</h2>
      <p>Question {index + 1} of {questions.length}</p>
      <h3>{currentQuestion.question}</h3>

      <div className="quiz-options">
        {currentQuestion.options.map((option, optionIndex) => (
          <button
            key={optionIndex}
            className={
              selected === optionIndex
                ? "quiz-option selected"
                : "quiz-option"
            }
            onClick={() => setSelected(optionIndex)}
          >
            {option}
          </button>
        ))}
      </div>

      {message && <p>{message}</p>}

      <button className="primary" onClick={nextQuestion}>
        {index === questions.length - 1 ? "Finish Quiz" : "Next Question"}
      </button>
    </section>
  );
}

export default App;