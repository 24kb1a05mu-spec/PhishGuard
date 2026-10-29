
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "phishguard1_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ==================================================
// DATABASE TABLES
// ==================================================

async function initializeDatabase() {
    const queries = [
        `CREATE TABLE IF NOT EXISTS scan_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            url TEXT NOT NULL,
            risk_score INT DEFAULT 0,
            status VARCHAR(50) DEFAULT 'Low Risk',
            findings TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,

        `CREATE TABLE IF NOT EXISTS call_checks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            phone_number VARCHAR(30) NOT NULL,
            call_description TEXT,
            risk_score INT DEFAULT 0,
            status VARCHAR(50) DEFAULT 'Low Risk',
            findings TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,

        `CREATE TABLE IF NOT EXISTS sms_checks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            phone_number VARCHAR(30),
            message_text TEXT NOT NULL,
            risk_score INT DEFAULT 0,
            status VARCHAR(50) DEFAULT 'Low Risk',
            findings TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,

        `CREATE TABLE IF NOT EXISTS quiz_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            score INT DEFAULT 0,
            total_questions INT DEFAULT 0,
            correct_answers INT DEFAULT 0,
            score_percent DECIMAL(5,2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,

        `CREATE TABLE IF NOT EXISTS phone_directory (
            id INT AUTO_INCREMENT PRIMARY KEY,
            phone_number VARCHAR(20) NOT NULL,
            business_name VARCHAR(255) NOT NULL,
            category VARCHAR(100) DEFAULT 'Other',
            city VARCHAR(100),
            source VARCHAR(255) DEFAULT 'Manually verified',
            verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_phone_number (phone_number)
        )`,

        `CREATE TABLE IF NOT EXISTS phone_lookup_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            phone_number VARCHAR(20) NOT NULL,
            directory_match BOOLEAN DEFAULT FALSE,
            scam_report_status VARCHAR(50) DEFAULT 'Not checked',
            risk_score INT DEFAULT 0,
            result_source VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_lookup_phone (phone_number)
        )`
    ];

    for (const query of queries) {
        await pool.query(query);
    }

    // Support existing quiz_history tables created by older versions.
    const [quizColumns] = await pool.query(
        "SHOW COLUMNS FROM quiz_history"
    );

    const existingColumns = new Set(
        quizColumns.map(column => column.Field)
    );

    if (!existingColumns.has("correct_answers")) {
        await pool.query(
            "ALTER TABLE quiz_history ADD COLUMN correct_answers INT DEFAULT 0"
        );
    }

    if (!existingColumns.has("score_percent")) {
        await pool.query(
            "ALTER TABLE quiz_history ADD COLUMN score_percent DECIMAL(5,2) DEFAULT 0"
        );
    }

    console.log("Database tables are ready.");
}

// ==================================================
// COMMON FUNCTIONS
// ==================================================

function normalizePhone(phone) {
    return String(phone || "").replace(/\D/g, "");
}

// Treat a 10-digit Indian number and its +91 version as equivalent.
function normalizeDirectoryPhone(phone) {
    let normalized = normalizePhone(phone);

    if (normalized.startsWith("0091") && normalized.length === 14) {
        normalized = normalized.substring(4);
    } else if (normalized.startsWith("91") && normalized.length === 12) {
        normalized = normalized.substring(2);
    }

    return normalized;
}

function getStatus(score) {
    if (score >= 60) return "High Risk";
    if (score >= 40) return "Suspicious";
    if (score >= 20) return "Low Risk";
    return "Safe";
}

function analyzePhoneRisk(phoneNumber, description = "") {
    const phone = normalizePhone(phoneNumber);
    const text = String(description).toLowerCase();

    let score = 0;
    const findings = [];

    if (phone.length < 7 || phone.length > 15) {
        score += 15;
        findings.push("The phone number length is unusual.");
    }

    if (/^(\d)\1+$/.test(phone)) {
        score += 20;
        findings.push("The number contains repeated digits.");
    }

    const rules = [
        {
            pattern: /\botp\b|one.time password/,
            points: 35,
            message: "The caller mentions an OTP."
        },
        {
            pattern: /\bpin\b|atm pin/,
            points: 35,
            message: "The caller asks for a PIN."
        },
        {
            pattern: /transfer money|send money|urgent payment/,
            points: 25,
            message: "The caller requests an urgent money transfer."
        },
        {
            pattern: /anydesk|remote access|screen sharing/,
            points: 30,
            message: "The caller mentions remote access or screen sharing."
        },
        {
            pattern: /digital arrest|police case|arrest warrant/,
            points: 30,
            message: "The caller may be using police or digital-arrest threats."
        },
        {
            pattern: /prize won|lottery|claim your prize/,
            points: 20,
            message: "The caller mentions a possible prize or lottery scam."
        },
        {
            pattern: /bank account blocked|account will be blocked/,
            points: 25,
            message: "The caller threatens to block a bank account."
        },
        {
            pattern: /password|cvv|card details/,
            points: 35,
            message: "The caller requests sensitive information."
        }
    ];

    for (const rule of rules) {
        if (rule.pattern.test(text)) {
            score += rule.points;
            findings.push(rule.message);
        }
    }

    score = Math.min(score, 100);

    if (findings.length === 0) {
        findings.push(
            "No listed warning pattern was detected. This does not prove the caller is safe."
        );
    }

    return {
        risk_score: score,
        status: getStatus(score),
        findings
    };
}

function analyzeTextRisk(messageText) {
    const text = String(messageText || "").toLowerCase();
    const findings = [];
    let score = 0;

    const rules = [
        {
            pattern: /\botp\b|one.time password/,
            points: 40,
            message: "The message mentions an OTP. Never share an OTP with another person."
        },
        {
            pattern: /password|cvv|bank details|card details|upi pin|banking details/,
            points: 30,
            message: "The message requests or mentions sensitive financial information."
        },
        {
            pattern: /account blocked|account will be blocked|account suspended|account will close|account will be closed/,
            points: 30,
            message: "The message threatens account blocking or suspension."
        },
        {
            pattern: /urgent|immediately|right now|act now|today only|within \d+ (minute|hour)/,
            points: 15,
            message: "The message uses urgency or pressure to prompt quick action."
        },
        {
            pattern: /share your otp|send your otp|provide your otp|enter your otp|tell me your otp/,
            points: 20,
            message: "The message asks you to share or provide an OTP."
        },
        {
            pattern: /prize won|won a prize|you won|you have won|lottery winner|claim your prize|claim your reward|cash prize/,
            points: 25,
            message: "The message uses a possible prize or lottery lure."
        },
        {
            pattern: /processing fee|claim fee|pay a fee|pay .* to claim|send money|transfer money|urgent payment/,
            points: 30,
            message: "The message requests payment or a fee."
        },
        {
            pattern: /verify your account|account verification|confirm your account/,
            points: 20,
            message: "The message asks you to verify or confirm an account."
        },
        {
            pattern: /click here|click the link|open this link|tap the link/,
            points: 15,
            message: "The message encourages you to open a link."
        },
        {
            pattern: /digital arrest|arrest warrant|police case|you will be arrested/,
            points: 35,
            message: "The message uses possible legal or arrest threats."
        },
        {
            pattern: /anydesk|remote access|screen sharing/,
            points: 30,
            message: "The message mentions remote access or screen sharing."
        }
    ];

    for (const rule of rules) {
        if (rule.pattern.test(text)) {
            score += rule.points;
            findings.push(rule.message);
        }
    }

    score = Math.min(score, 100);

    if (findings.length === 0) {
        findings.push(
            "No listed warning pattern was detected. This does not guarantee the message is safe."
        );
    }

    let recommendation;

    if (score >= 60) {
        recommendation =
            "High risk: Do not share OTPs, passwords, UPI PINs, or banking details. Do not pay fees or follow suspicious links. Verify claims using official channels.";
    } else if (score >= 40) {
        recommendation =
            "Suspicious: Do not act on urgent requests. Verify the sender independently before clicking links, sharing information, or making payments.";
    } else if (score >= 20) {
        recommendation =
            "Low risk indicators detected: Stay cautious and verify unexpected requests before taking action.";
    } else {
        recommendation =
            "No listed warning patterns were detected. Stay cautious with unknown senders and never share sensitive information.";
    }

    return {
        risk_score: score,
        status: getStatus(score),
        findings,
        recommendation
    };
}

function analyzeUrlRisk(rawUrl) {
    const findings = [];
    let score = 0;
    let parsedUrl;

    try {
        parsedUrl = new URL(rawUrl);
    } catch {
        return {
            risk_score: 100,
            status: "High Risk",
            findings: ["The URL is invalid."]
        };
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        findings.push("The URL uses an unsupported protocol.");
        score += 30;
    }

    if (parsedUrl.protocol === "http:") {
        findings.push("The URL does not use HTTPS.");
        score += 15;
    }

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(parsedUrl.hostname)) {
        findings.push("The hostname is an IP address.");
        score += 20;
    }

    if (parsedUrl.hostname.includes("xn--")) {
        findings.push("The hostname contains punycode.");
        score += 25;
    }

    const lowerUrl = rawUrl.toLowerCase();

    const keywords = [
        "login", "verify", "account", "password",
        "secure", "update", "wallet", "bank"
    ];

    const matchedKeywords = keywords.filter(keyword =>
        lowerUrl.includes(keyword)
    );

    if (matchedKeywords.length > 0) {
        findings.push(
            "Suspicious keywords: " + matchedKeywords.join(", ") + "."
        );
        score += Math.min(matchedKeywords.length * 10, 30);
    }

    if (parsedUrl.hostname.split(".").length > 4) {
        findings.push("The hostname has many subdomains.");
        score += 10;
    }

    if (rawUrl.length > 100) {
        findings.push("The URL is unusually long.");
        score += 10;
    }

    if (parsedUrl.username || parsedUrl.password) {
        findings.push("The URL contains embedded login credentials.");
        score += 30;
    }

    if (/bit\.ly|tinyurl\.com|t\.co|cutt\.ly/i.test(parsedUrl.hostname)) {
        findings.push("The URL uses a known URL-shortening domain.");
        score += 20;
    }

    score = Math.min(score, 100);

    if (findings.length === 0) {
        findings.push(
            "No listed warning pattern was detected. This does not guarantee the site is safe."
        );
    }

    return {
        risk_score: score,
        status: getStatus(score),
        findings
    };
}

// ==================================================
// BASIC ROUTES
// ==================================================

app.get("/", (req, res) => {
    res.json({
        message: "PhishGuard API is running.",
        status: "success"
    });
});

app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT DATABASE() AS database_name"
        );

        res.json({
            status: "success",
            message: "Database connection successful.",
            database: rows[0].database_name
        });
    } catch (error) {
        console.error("Database test error:", error.message);
        res.status(500).json({
            message: "Database connection failed."
        });
    }
});

// ==================================================
// URL SCANNER
// ==================================================

app.post("/api/scan", async (req, res) => {
    try {
        const { url } = req.body;

        if (!url || typeof url !== "string") {
            return res.status(400).json({
                message: "Please provide a URL."
            });
        }

        let parsedUrl;

        try {
            parsedUrl = new URL(url);
        } catch {
            return res.status(400).json({
                message: "Enter a valid URL, including https:// or http://."
            });
        }

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            return res.status(400).json({
                message: "Only HTTP and HTTPS URLs are supported."
            });
        }

        const result = analyzeUrlRisk(url);

        await pool.query(
            `INSERT INTO scan_history
            (url, risk_score, status, findings)
            VALUES (?, ?, ?, ?)`,
            [
                url,
                result.risk_score,
                result.status,
                JSON.stringify(result.findings)
            ]
        );

        res.json({ url, ...result });
    } catch (error) {
        console.error("URL scan error:", error);
        res.status(500).json({
            message: "Unable to scan the URL."
        });
    }
});

app.get("/api/history", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM scan_history ORDER BY id DESC"
        );

        res.json(rows);
    } catch (error) {
        console.error("Scan history error:", error);
        res.status(500).json({
            message: "Unable to load scan history."
        });
    }
});

// ==================================================
// DASHBOARD
// ==================================================

app.get("/api/dashboard", async (req, res) => {
    try {
        const [scanRows] = await pool.query(`
            SELECT
                COUNT(*) AS total,
                COALESCE(SUM(status = 'Safe'), 0) AS safe,
                COALESCE(SUM(status = 'Low Risk'), 0) AS low_risk,
                COALESCE(SUM(status = 'Suspicious'), 0) AS suspicious,
                COALESCE(SUM(status = 'High Risk'), 0) AS high_risk
            FROM scan_history
        `);

        const [callRows] = await pool.query(
            "SELECT COUNT(*) AS total_calls FROM call_checks"
        );

        const [smsRows] = await pool.query(
            "SELECT COUNT(*) AS total_sms FROM sms_checks"
        );

        res.json({
            total: Number(scanRows[0].total || 0),
            safe: Number(scanRows[0].safe || 0),
            low_risk: Number(scanRows[0].low_risk || 0),
            suspicious: Number(scanRows[0].suspicious || 0),
            high_risk: Number(scanRows[0].high_risk || 0),
            total_calls: Number(callRows[0].total_calls || 0),
            total_sms: Number(smsRows[0].total_sms || 0)
        });
    } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({
            message: "Unable to load dashboard data."
        });
    }
});

// ==================================================
// PHONE CALL CHECKER
// ==================================================

app.post("/api/check-call", async (req, res) => {
    try {
        const { phoneNumber, phone, description } = req.body;
        const number = phoneNumber || phone;

        if (!number || !String(number).trim()) {
            return res.status(400).json({
                message: "Please enter a phone number."
            });
        }

        const result = analyzePhoneRisk(number, description || "");

        await pool.query(
            `INSERT INTO call_checks
            (phone_number, call_description, risk_score, status, findings)
            VALUES (?, ?, ?, ?, ?)`,
            [
                String(number),
                description || "",
                result.risk_score,
                result.status,
                JSON.stringify(result.findings)
            ]
        );

        res.json({
            phone_number: String(number),
            ...result,
            disclaimer:
                "This rule-based result is not proof that the number is fraudulent."
        });
    } catch (error) {
        console.error("Call checker error:", error);
        res.status(500).json({
            message: "Unable to check the phone number."
        });
    }
});

app.get("/api/call-history", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM call_checks ORDER BY id DESC"
        );

        res.json(rows);
    } catch (error) {
        console.error("Call history error:", error);
        res.status(500).json({
            message: "Unable to load call history."
        });
    }
});

// ==================================================
// SMS CHECKER
// ==================================================

app.post("/api/check-sms", async (req, res) => {
    try {
        const {
            phoneNumber,
            phone,
            messageText,
            message
        } = req.body;

        const sms = messageText || message;

        if (!sms || typeof sms !== "string") {
            return res.status(400).json({
                message: "Please enter the SMS message."
            });
        }

        const result = analyzeTextRisk(sms);

        await pool.query(
            `INSERT INTO sms_checks
            (message_text, risk_score, status, findings)
            VALUES (?, ?, ?, ?)`,
            [
                sms,
                result.risk_score,
                result.status,
                JSON.stringify(result.findings)
            ]
        );

        res.json({
            phone_number: phoneNumber || phone || null,
            message: sms,
            ...result
        });
    } catch (error) {
        console.error("SMS checker error:", error);
        res.status(500).json({
            message: "Unable to check the SMS."
        });
    }
});

app.get("/api/sms-history", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM sms_checks ORDER BY id DESC"
        );

        res.json(rows);
    } catch (error) {
        console.error("SMS history error:", error);
        res.status(500).json({
            message: "Unable to load SMS history."
        });
    }
});

// ==================================================
// QUIZ HISTORY
// ==================================================

app.post("/api/quiz-history", async (req, res) => {
    try {
        const correctAnswers = Number(
            req.body.correctAnswers ??
            req.body.correct_answers ??
            req.body.score
        );

        const totalQuestions = Number(
            req.body.totalQuestions ??
            req.body.total_questions
        );

        if (
            !Number.isFinite(correctAnswers) ||
            !Number.isFinite(totalQuestions) ||
            totalQuestions <= 0 ||
            correctAnswers < 0 ||
            correctAnswers > totalQuestions
        ) {
            return res.status(400).json({
                message: "Provide a valid quiz score and question count."
            });
        }

        const scorePercent = Math.round(
            (correctAnswers / totalQuestions) * 100
        );

        await pool.query(
            `INSERT INTO quiz_history
            (total_questions, correct_answers, score_percent)
            VALUES (?, ?, ?)`,
            [totalQuestions, correctAnswers, scorePercent]
        );

        res.status(201).json({
            message: "Quiz result saved successfully.",
            totalQuestions,
            correctAnswers,
            scorePercent
        });
    } catch (error) {
        console.error("Quiz save error:", error);
        res.status(500).json({
            message: "Unable to save quiz result.",
            error: error.message
        });
    }
});

app.get("/api/quiz-analytics", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                COUNT(*) AS attempts,
                COALESCE(SUM(correct_answers), 0) AS total_correct_answers,
                COALESCE(SUM(total_questions), 0) AS total_questions,
                COALESCE(AVG(score_percent), 0) AS average_percentage,
                COALESCE(MAX(score_percent), 0) AS highest_percentage
            FROM quiz_history
        `);

        res.json(rows[0]);
    } catch (error) {
        console.error("Quiz analytics error:", error);
        res.status(500).json({
            message: "Unable to load quiz analytics."
        });
    }
});

// ==================================================
// PHONE DIRECTORY LOOKUP
// ==================================================

app.post("/api/lookup-phone", async (req, res) => {
    try {
        const { phoneNumber, phone } = req.body;
        const number = String(phoneNumber || phone || "").trim();
        const normalized = normalizeDirectoryPhone(number);

        if (
            !normalized ||
            normalized.length < 7 ||
            normalized.length > 15
        ) {
            return res.status(400).json({
                message: "Enter a valid phone number."
            });
        }

        /*
         * Fetch saved directory records and compare normalized values.
         * This handles spaces, +, brackets, hyphens, and common Indian
         * +91 prefixes consistently.
         */
        const [directoryRows] = await pool.query(`
            SELECT
                id,
                phone_number,
                business_name,
                category,
                city,
                source,
                verified,
                created_at
            FROM phone_directory
            ORDER BY verified DESC, id DESC
        `);

        const business = directoryRows.find(entry => {
            return normalizeDirectoryPhone(entry.phone_number) === normalized;
        }) || null;

        const matched = Boolean(business);
        const scamReportStatus = "Not checked";

// A directory match alone cannot establish the number's risk.
const riskScore = null;
const riskStatus = "Risk Not Verified";

        const resultSource = business
            ? (business.source || "Local PhishGuard directory")
            : "No local directory match";

        await pool.query(
            `INSERT INTO phone_lookup_history
            (phone_number, directory_match, scam_report_status,
             risk_score, result_source)
            VALUES (?, ?, ?, ?, ?)`,
            [
                number,
                matched,
                scamReportStatus,
                riskScore,
                resultSource
            ]
        );

       
res.json({
    phone_number: number,
    directory_match: matched,
    business,
    scam_report_status: scamReportStatus,
    risk_score: riskScore,
    risk_status: riskStatus,
    result_source: resultSource,
    message: matched
        ? "A matching entry was found in the local directory."
        : "No matching entry was found in the local directory.",
    disclaimer:
        "A directory match does not prove that a number is safe or fraudulent. Official scam-report status has not been checked."
});

    } catch (error) {
        console.error("Phone lookup error:", error);
        res.status(500).json({
            message: "Unable to look up the phone number."
        });
    }
});

// ==================================================
// ADD A BUSINESS NUMBER TO THE LOCAL DIRECTORY
// ==================================================

app.post("/api/phone-directory", async (req, res) => {
    try {
        const {
            phoneNumber,
            businessName,
            category,
            city,
            source,
            verified
        } = req.body;

        const number = String(phoneNumber || "").trim();
        const normalized = normalizeDirectoryPhone(number);

        if (
            !normalized ||
            normalized.length < 7 ||
            normalized.length > 15
        ) {
            return res.status(400).json({
                message: "Enter a valid phone number."
            });
        }

        if (
            !businessName ||
            typeof businessName !== "string" ||
            !businessName.trim()
        ) {
            return res.status(400).json({
                message: "Business name is required."
            });
        }

        // Do not add the same normalized number a second time.
        const [existingRows] = await pool.query(`
            SELECT id, phone_number, business_name, category, city,
                   source, verified, created_at
            FROM phone_directory
            ORDER BY id DESC
        `);

        const existing = existingRows.find(entry =>
            normalizeDirectoryPhone(entry.phone_number) === normalized
        );

        if (existing) {
            return res.status(409).json({
                message: "This phone number already exists in the local directory.",
                business: existing
            });
        }

        const [insertResult] = await pool.query(
            `INSERT INTO phone_directory
            (phone_number, business_name, category, city, source, verified)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                number,
                businessName.trim(),
                category || "Other",
                city || null,
                source || "Manually entered",
                verified === true
            ]
        );

        const [savedRows] = await pool.query(
            `SELECT id, phone_number, business_name, category, city,
                    source, verified, created_at
             FROM phone_directory
             WHERE id = ?`,
            [insertResult.insertId]
        );

        res.status(201).json({
            message: "Business number added to the local directory.",
            business: savedRows[0],
            verified: verified === true
        });
    } catch (error) {
        console.error("Add directory entry error:", error);
        res.status(500).json({
            message: "Unable to add the directory entry."
        });
    }
});

app.get("/api/phone-directory", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT id, phone_number, business_name, category, city,
                   source, verified, created_at
            FROM phone_directory
            ORDER BY id DESC
        `);

        res.json(rows);
    } catch (error) {
        console.error("Directory error:", error);
        res.status(500).json({
            message: "Unable to load the phone directory."
        });
    }
});

app.get("/api/phone-lookup-history", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM phone_lookup_history ORDER BY id DESC"
        );

        res.json(rows);
    } catch (error) {
        console.error("Phone lookup history error:", error);
        res.status(500).json({
            message: "Unable to load phone lookup history."
        });
    }
});

// ==================================================
// START SERVER
// ==================================================

async function startServer() {
    try {
        await initializeDatabase();

        app.listen(PORT, () => {
            console.log(
                `PhishGuard backend running at http://localhost:${PORT}`
            );
            console.log("Press Ctrl+C to stop the server.");
        });
    } catch (error) {
        console.error("Unable to start PhishGuard:", error.message);
        process.exit(1);
    }
}

startServer();
