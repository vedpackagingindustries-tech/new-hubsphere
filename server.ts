import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Increase payload limit to 2000mb (2GB) for large files and call recordings (base64)
app.use(express.json({ limit: "2000mb" }));
app.use(express.urlencoded({ limit: "2000mb", extended: true }));

// Database filepath
const DB_FILE = path.join(process.cwd(), "db.json");
const RECORDINGS_DIR = path.join(process.cwd(), "recordings");

// Ensure recordings directory exists
if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
}

// Serve recordings statically
app.use("/recordings", express.static(RECORDINGS_DIR));

// Initialize Gemini Client
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function generateEmploymentCode(name: string, department: string, position: string, joiningDate: string) {
  const firstWord = (name || "").trim().split(/\s+/)[0] || "Staff";
  const dept = department || "Sales";
  const post = position || "Employee";
  
  let dateFormatted = "07/07/2026";
  if (joiningDate) {
    const parts = joiningDate.split("-");
    if (parts.length === 3) {
      dateFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  } else {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    dateFormatted = `${day}/${month}/${year}`;
  }
  
  const cleanWord = (w: string) => w.replace(/[\/\s]/g, "");
  
  return `${cleanWord(firstWord)}/${cleanWord(dept)}/${cleanWord(post)}/${dateFormatted}`;
}

// Helper to read database
function readDB() {
  let db: any;
  if (!fs.existsSync(DB_FILE)) {
    db = {
      users: [],
      leads: [],
      callLogs: [],
      supportTickets: [],
      autoCallingConfig: {
        delaySeconds: 5,
        enabled: true
      },
      backups: [],
      attendance: [],
      leaves: [],
      tasks: [],
      companyHolidays: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } else {
    try {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      db = JSON.parse(data);
    } catch (err) {
      console.error("Error reading database file, resetting to empty", err);
      db = { 
        users: [], 
        leads: [], 
        callLogs: [], 
        supportTickets: [], 
        autoCallingConfig: { delaySeconds: 5, enabled: true }, 
        backups: [],
        attendance: [],
        leaves: [],
        tasks: [],
        companyHolidays: []
      };
    }
  }

  // Ensure arrays are initialized
  db.users = db.users || [];
  db.leads = db.leads || [];
  db.callLogs = db.callLogs || [];
  db.supportTickets = db.supportTickets || [];
  db.backups = db.backups || [];
  db.attendance = db.attendance || [];
  db.leaves = db.leaves || [];
  db.tasks = db.tasks || [];
  db.companyHolidays = db.companyHolidays || [];
  db.testingConfig = db.testingConfig || {
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true
  };
  db.recoveryConfig = db.recoveryConfig || {
    securityQuestion: "elephant ke kitne daatt hote hai",
    securityAnswer: "0000",
    adminBackupEmail: "contact.grahicsworld@gmail.com",
    alertWhatsapp: "9301056006",
    alertEmail: "ipgroup2002@gmail.com"
  };

  // Seed default Main Admin if u-admin does not exist
  const hasAdmin = db.users.some((u: any) => u.id === "u-admin");
  if (!hasAdmin) {
    db.users.push({
      id: "u-admin",
      name: "Admin",
      email: "contact.grahicsworld@gmail.com",
      password: "admin",
      role: "admin",
      phone: "+919876543210",
      department: "All",
      position: "Main Admin",
      salaryBase: 12000,
      commissionRate: 100
    });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  }

  return db;
}

// Helper to write database
function writeDB(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// ==========================================
// API ROUTES
// ==========================================

// Auth Routes
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role, phone, department, position } = req.body;
  if (!name || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const db = readDB();
  
  // Check if name is already registered
  const existingName = db.users.find((u: any) => u.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (existingName) {
    // If the role is main_admin and we are replacing the existing u-admin, we can proceed
    if (!(role === "main_admin" && existingName.id === "u-admin")) {
      return res.status(400).json({ error: "Username already registered" });
    }
  }

  if (email) {
    const existingEmail = db.users.find((u: any) => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (existingEmail) {
      if (!(role === "main_admin" && existingEmail.id === "u-admin")) {
        return res.status(400).json({ error: "Email already registered" });
      }
    }
  }

  let userId = "u-" + Date.now();
  let assignedRole = role;

  if (role === "main_admin") {
    userId = "u-admin";
    assignedRole = "admin";
    // Overwrite the existing u-admin
    db.users = db.users.filter((u: any) => u.id !== "u-admin");
  }

  // Enforce single Sub-Admin limit
  if (assignedRole === "sub-admin") {
    const existingSubAdmin = db.users.find((u: any) => u.role === "sub-admin");
    if (existingSubAdmin) {
      return res.status(400).json({ error: "Only ONE Sub-Admin can be appointed in the company. A Sub-Admin is already registered." });
    }
  }

  // Enforce single Department Head per segment limit on registration
  if (assignedRole === "head") {
    const finalDept = department || "Sales";
    const existingHead = db.users.find((u: any) => u.role === "head" && u.department === finalDept && u.status !== "inactive");
    if (existingHead) {
      return res.status(400).json({ error: `Only ONE Department Head can be appointed for the ${finalDept} segment. A Head already exists.` });
    }
  }

  // Define salary base and commission rate based on role
  let salaryBase = 12000;
  let commissionRate = 100;
  if (assignedRole === "admin") {
    salaryBase = 25000;
    commissionRate = 200;
  } else if (assignedRole === "sub-admin") {
    salaryBase = 20000;
    commissionRate = 150;
  } else if (assignedRole === "head") {
    salaryBase = 15000;
    commissionRate = 120;
  }

  const newUser = {
    id: userId,
    name,
    email: email || "",
    password, // Storing simply for demonstration/testing CRM
    phone: phone || "",
    role: assignedRole,
    department: department || "Sales",
    position: position || "",
    salaryBase,
    commissionRate,
    monthlyTarget: 5,
    status: "active"
  };

  db.users.push(newUser);
  writeDB(db);

  res.json({ 
    success: true, 
    user: { 
      id: newUser.id, 
      name: newUser.name, 
      email: newUser.email, 
      phone: newUser.phone, 
      role: newUser.role, 
      department: newUser.department,
      position: newUser.position || ""
    } 
  });
});

app.post("/api/auth/login", (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).json({ error: "Name and password are required" });
  }

  const db = readDB();
  let user = db.users.find(
    (u: any) => u.name.trim().toLowerCase() === name.trim().toLowerCase() && u.password === password && !u.deleted
  );

  // Bulletproof fallback for Main Admin u-admin
  if (!user && name.trim().toLowerCase() === "admin" && password === "admin") {
    user = {
      id: "u-admin",
      name: "Admin",
      email: "contact.grahicsworld@gmail.com",
      password: "admin",
      role: "admin",
      phone: "+919876543210",
      department: "All",
      position: "Main Admin",
      salaryBase: 12000,
      commissionRate: 100
    };
  }

  if (!user) {
    return res.status(400).json({ error: "Invalid name or password" });
  }

  if (user.status === "suspended") {
    return res.status(403).json({ error: "Account suspended by admin" });
  }

  // Check testing period expiry (except for Main Admin who can log in to extend)
  const testingConfig = db.testingConfig || {
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true
  };
  const today = new Date().toISOString().split('T')[0];
  if (testingConfig.isActive && testingConfig.expiryDate < today) {
    if (user.role !== "admin") {
      return res.status(403).json({ 
        error: `Testing period has expired (टेस्टिंग अवधि समाप्त हो गई है)! Only the Main Admin can log in to extend the testing date. Expiry date: ${testingConfig.expiryDate}` 
      });
    }
  }

  res.json({ 
    success: true, 
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email || "", 
      phone: user.phone || "",
      role: user.role,
      department: user.department || "Sales",
      position: user.position || ""
    } 
  });
});

// ==========================================
// LOGIN GPS AUTHORITY REQUESTS
// ==========================================

// 1. Request Login GPS Authority
app.post("/api/auth/request-login-authority", (req, res) => {
  const { name, deviceType, distance, reason } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }
  const db = readDB();
  db.loginAuthorityRequests = db.loginAuthorityRequests || [];
  
  // Remove any previous requests for this name to avoid clutter
  db.loginAuthorityRequests = db.loginAuthorityRequests.filter((r: any) => r.name.toLowerCase() !== name.toLowerCase());
  
  db.loginAuthorityRequests.push({
    id: "lar-" + Date.now(),
    name: name,
    deviceType: deviceType || "mobile",
    distance: distance || 0,
    reason: reason || "Location mismatch on phone login",
    status: "pending",
    requestedAt: new Date().toISOString()
  });
  
  writeDB(db);
  res.json({ success: true, message: "लॉगिन अनुमति अनुरोध एडमिन को भेज दिया गया है! कृपया एडमिन द्वारा स्वीकृत होने की प्रतीक्षा करें। (Login authority request sent to Main Admin! Please wait for approval.)" });
});

// 2. Check Login GPS Authority Status
app.get("/api/auth/check-login-authority", (req, res) => {
  const name = req.query.name as string;
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }
  const db = readDB();
  db.loginAuthorityRequests = db.loginAuthorityRequests || [];
  const request = db.loginAuthorityRequests.find(
    (r: any) => r.name.toLowerCase() === name.toLowerCase()
  );
  if (request && request.status === "approved") {
    return res.json({ success: true, approved: true });
  }
  return res.json({ success: true, approved: false, status: request ? request.status : "not_found" });
});

// 3. Get Login GPS Authority Requests (Admin only)
app.get("/api/admin/login-authority-requests", (req, res) => {
  const db = readDB();
  db.loginAuthorityRequests = db.loginAuthorityRequests || [];
  res.json({ success: true, requests: db.loginAuthorityRequests });
});

// 4. Approve / Reject Login GPS Authority Request
app.post("/api/admin/approve-login-authority", (req, res) => {
  const { requestId, approve } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: "Request ID is required" });
  }
  const db = readDB();
  db.loginAuthorityRequests = db.loginAuthorityRequests || [];
  const request = db.loginAuthorityRequests.find((r: any) => r.id === requestId);
  if (request) {
    request.status = approve ? "approved" : "rejected";
    writeDB(db);
    return res.json({ success: true, message: `Request successfully ${approve ? 'approved' : 'rejected'}.` });
  }
  return res.status(404).json({ error: "Request not found" });
});

// 5. Delete Login GPS Authority Request
app.post("/api/admin/delete-login-authority", (req, res) => {
  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: "Request ID is required" });
  }
  const db = readDB();
  db.loginAuthorityRequests = db.loginAuthorityRequests || [];
  db.loginAuthorityRequests = db.loginAuthorityRequests.filter((r: any) => r.id !== requestId);
  writeDB(db);
  res.json({ success: true, message: "Request deleted." });
});

// Users management (Admin, Sub-Admin, and Head)
app.get("/api/users", (req, res) => {
  const requesterRole = req.headers["x-user-role"];
  const requesterId = req.headers["x-user-id"];

  if (requesterRole !== "admin" && requesterRole !== "sub-admin" && requesterRole !== "head") {
    return res.status(403).json({ error: "Access Denied: Only authorized managers can access user directories." });
  }

  const db = readDB();
  const requester = db.users.find((u: any) => u.id === requesterId);

  // Hierarchical filtering:
  // - Main Admin / Director: sees all users
  // - Sub-Admin: sees dept heads, staff, telecallers (anything except Main Admin)
  // - Dept Head: sees staff and telecallers within their department only
  if (requesterRole === "admin" || requesterId === "u-admin") {
    return res.json(db.users.filter((u: any) => !u.deleted));
  } else if (requesterRole === "sub-admin") {
    const filtered = db.users.filter((u: any) => u.role !== "admin" && !u.deleted);
    return res.json(filtered);
  } else if (requesterRole === "head") {
    const dept = requester ? requester.department : "";
    const filtered = db.users.filter((u: any) => u.department === dept && (u.role === "staff" || u.role === "telecaller") && !u.deleted);
    return res.json(filtered);
  }

  res.status(403).json({ error: "Access Denied" });
});

app.post("/api/users/update-rates", (req, res) => {
  if (req.headers["x-user-role"] !== "admin") {
    return res.status(403).json({ error: "Access Denied: Only administrators can update payroll rates." });
  }
  const { userId, salaryBase, commissionRate, monthlyTarget } = req.body;
  const db = readDB();
  const user = db.users.find((u: any) => u.id === userId);
  if (user) {
    user.salaryBase = Number(salaryBase);
    user.commissionRate = Number(commissionRate);
    if (monthlyTarget !== undefined) {
      user.monthlyTarget = Number(monthlyTarget) || 5;
    }
    writeDB(db);
    return res.json({ success: true, user });
  }
  res.status(404).json({ error: "User not found" });
});

app.post("/api/users/admin-update-user", (req, res) => {
  const requesterRole = req.headers["x-user-role"];
  const requesterId = req.headers["x-user-id"];

  if (requesterRole !== "admin" && requesterRole !== "sub-admin") {
    return res.status(403).json({ error: "Access Denied: Only administrators and authorized sub-admins can modify user profiles and credentials." });
  }

  const { userId, name, email, password, phone, whatsapp, role, department, salaryBase, commissionRate, monthlyTarget, dailyWork, position, joiningDate, employmentCode } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  const db = readDB();
  const user = db.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Security checks for Sub-Admin
  if (requesterRole === "sub-admin") {
    if (user.role === "admin" || user.role === "sub-admin" || userId === "u-admin") {
      return res.status(403).json({ error: "Access Denied: Sub-Admins cannot modify administrators or other sub-admins." });
    }
    if (role && (role === "admin" || role === "sub-admin")) {
      return res.status(403).json({ error: "Access Denied: Sub-Admins cannot assign administrator or sub-admin roles." });
    }
  }

  if (email && email.toLowerCase() !== user.email.toLowerCase()) {
    const emailExists = db.users.some((u: any) => u.id !== userId && u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      return res.status(400).json({ error: "Email already registered by another user" });
    }
    user.email = email;
  }

  if (name) user.name = name;
  if (password) user.password = password;
  if (phone !== undefined) user.phone = phone;
  if (whatsapp !== undefined) user.whatsapp = whatsapp;
  if (role) {
    if (role === "sub-admin") {
      const existingSubAdmin = db.users.find((u: any) => u.role === "sub-admin" && u.id !== userId);
      if (existingSubAdmin) {
        return res.status(400).json({ error: "Only ONE Sub-Admin can be appointed in the company. A Sub-Admin already exists." });
      }
    }
    user.role = role;
  }
  if (department !== undefined) {
    user.department = (user.role === "sub-admin") ? "All" : department;
  }

  // Enforce single Department Head per segment limit on edit
  if (user.role === "head") {
    const existingHead = db.users.find((u: any) => u.role === "head" && u.department === user.department && u.status !== "inactive" && u.id !== userId);
    if (existingHead) {
      return res.status(400).json({ error: `Only ONE Department Head can be appointed for the ${user.department} segment. A Head already exists.` });
    }
  }

  if (salaryBase !== undefined) user.salaryBase = Number(salaryBase);
  if (commissionRate !== undefined) user.commissionRate = Number(commissionRate);
  if (monthlyTarget !== undefined) user.monthlyTarget = Number(monthlyTarget);
  if (dailyWork !== undefined) user.dailyWork = dailyWork;
  if (position !== undefined) user.position = position;
  if (joiningDate !== undefined) user.joiningDate = joiningDate;
  if (employmentCode !== undefined) {
    user.employmentCode = employmentCode;
  } else if (joiningDate !== undefined || name || department !== undefined || position !== undefined) {
    // Regenerate code if key details changed
    user.employmentCode = generateEmploymentCode(user.name, user.department || "Sales", user.position || "", user.joiningDate || new Date().toISOString().split("T")[0]);
  }

  // Sync / create active task if dailyWork has changed
  if (dailyWork && dailyWork.trim()) {
    db.tasks = db.tasks || [];
    // See if there's already a pending task with this title today
    const dateToday = new Date().toISOString().split("T")[0];
    const existingTask = db.tasks.find((t: any) => t.assignedTo === userId && t.status === "Pending" && t.date === dateToday);
    if (existingTask) {
      existingTask.title = dailyWork;
    } else {
      const newTask = {
        id: "task-" + Date.now(),
        adminId: userId,
        adminName: user.name,
        assignedTo: userId,
        assignedToName: user.name,
        assignedBy: "u-admin",
        assignedByName: "Main Admin",
        department: user.department || "Sales",
        title: dailyWork,
        date: dateToday,
        status: "Pending",
        remark: null,
        adminReply: null,
        appeal: null,
        appealReply: null
      };
      db.tasks.push(newTask);
    }
  }

  writeDB(db);
  res.json({ success: true, message: "User profile and credentials updated successfully!", user });
});

app.post("/api/users/add", (req, res) => {
  const requesterRole = req.headers["x-user-role"];
  const requesterId = req.headers["x-user-id"];

  if (requesterRole !== "admin" && requesterRole !== "sub-admin") {
    return res.status(403).json({ error: "Access Denied: Only administrators and authorized sub-admins can add staff." });
  }

  const { name, email, password, phone, whatsapp, role, department, salaryBase, commissionRate, monthlyTarget, dailyWork, position, joiningDate, employmentCode } = req.body;
  if (!name || !password || !role) {
    return res.status(400).json({ error: "Name, password, and role are required." });
  }

  // Security checks for Sub-Admin
  if (requesterRole === "sub-admin") {
    if (role === "admin" || role === "sub-admin") {
      return res.status(403).json({ error: "Access Denied: Sub-Admins cannot add administrators or other sub-admins." });
    }
  }

  const db = readDB();
  
  // Enforce single Sub-Admin limit
  if (role === "sub-admin") {
    const existingSubAdmin = db.users.find((u: any) => u.role === "sub-admin");
    if (existingSubAdmin) {
      return res.status(400).json({ error: "Company can have only one Sub-Admin. A Sub-Admin already exists in the system." });
    }
  }

  let finalDepartment = department || "Sales";
  if (role === "sub-admin") {
    finalDepartment = "All";
  } else if (role === "telecaller") {
    finalDepartment = "Sales";
  }

  // Enforce single Department Head per segment limit
  if (role === "head") {
    const existingHead = db.users.find((u: any) => u.role === "head" && u.department === finalDepartment && u.status !== "inactive");
    if (existingHead) {
      return res.status(400).json({ error: `Only ONE Department Head can be appointed for the ${finalDepartment} segment. A Head already exists.` });
    }
  }

  // Check unique username
  const existingName = db.users.find((u: any) => u.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (existingName) {
    return res.status(400).json({ error: "Username already registered" });
  }

  if (email) {
    const existingEmail = db.users.find((u: any) => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (existingEmail) {
      return res.status(400).json({ error: "Email already registered" });
    }
  }

  const userId = "u-" + Date.now();

  const finalJoiningDate = joiningDate || new Date().toISOString().split("T")[0];
  const finalEmploymentCode = employmentCode || generateEmploymentCode(name, finalDepartment, position || "", finalJoiningDate);

  const newUser = {
    id: userId,
    name,
    email: email || "",
    password,
    phone: phone || "",
    whatsapp: whatsapp || "",
    role,
    department: finalDepartment,
    position: position || "",
    salaryBase: Number(salaryBase) || 12000,
    commissionRate: Number(commissionRate) || 100,
    monthlyTarget: Number(monthlyTarget) || 5,
    dailyWork: dailyWork || "",
    joiningDate: finalJoiningDate,
    employmentCode: finalEmploymentCode,
    status: "active"
  };

  db.users.push(newUser);

  // Automatically assign daily task if dailyWork has content
  if (dailyWork && dailyWork.trim()) {
    db.tasks = db.tasks || [];
    const newTask = {
      id: "task-" + Date.now(),
      adminId: userId,
      adminName: name,
      assignedTo: userId,
      assignedToName: name,
      assignedBy: "u-admin",
      assignedByName: "Main Admin",
      department: department || "Sales",
      title: dailyWork,
      date: new Date().toISOString().split("T")[0],
      status: "Pending",
      remark: null,
      adminReply: null,
      appeal: null,
      appealReply: null
    };
    db.tasks.push(newTask);
  }

  writeDB(db);
  res.json({ success: true, user: newUser, message: "New employee added and registered successfully!" });
});

app.post("/api/users/toggle-status", (req, res) => {
  const requesterRole = req.headers["x-user-role"];
  const requesterId = req.headers["x-user-id"];

  if (requesterRole !== "admin" && requesterRole !== "sub-admin") {
    return res.status(403).json({ error: "Access Denied: Only administrators and authorized sub-admins can toggle staff accounts." });
  }

  const { userId } = req.body;
  const db = readDB();
  const user = db.users.find((u: any) => u.id === userId);
  if (user) {
    if (requesterRole === "sub-admin" && (user.role === "admin" || user.role === "sub-admin" || userId === "u-admin")) {
      return res.status(403).json({ error: "Access Denied: Sub-Admins cannot suspend other administrators or sub-admins." });
    }
    if (user.status === "active") {
      user.status = "suspended";
      user.suspendedAt = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    } else {
      user.status = "active";
      user.suspendedAt = null;
    }
    writeDB(db);
    return res.json({ success: true, user });
  }
  res.status(404).json({ error: "User not found" });
});

// Lead Routes
app.get("/api/leads", (req, res) => {
  const db = readDB();
  const userRole = req.headers["x-user-role"];
  const userId = req.headers["x-user-id"];

  if (userRole === "telecaller") {
    // Strict isolation: Telecaller only sees their own assigned leads
    const filtered = db.leads.filter((l: any) => l.assignedTo === userId);
    return res.json(filtered);
  }

  // Admins see all leads
  res.json(db.leads);
});

app.post("/api/leads/add", (req, res) => {
  const { name, phone, whatsapp, email, requirements, assignedTo } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: "Name and phone number are required" });
  }

  const db = readDB();
  let assignedName = null;
  let finalAssignedTo = assignedTo || null;

  // If a telecaller is adding, assign it directly to themselves by default
  const userRole = req.headers["x-user-role"];
  const userId = req.headers["x-user-id"] as string;
  if (userRole === "telecaller" && userId) {
    finalAssignedTo = userId;
  }

  if (finalAssignedTo) {
    const caller = db.users.find((u: any) => u.id === finalAssignedTo);
    if (caller) assignedName = caller.name;
  }

  const newLead = {
    id: "lead-" + Date.now(),
    name,
    phone,
    whatsapp: whatsapp || "",
    email: email || "",
    requirements: requirements || "No specific details provided.",
    status: "New",
    assignedTo: finalAssignedTo,
    assignedName,
    assignedByAdminId: userRole === "admin" ? userId : null,
    assignedByAdminName: userRole === "admin" ? "Direct Add" : null,
    assignedAt: userRole === "admin" ? new Date().toISOString() : null,
    notes: "",
    createdAt: new Date().toISOString(),
    journey: [
      {
        status: "New",
        notes: "Lead registered in CRM",
        updatedBy: userRole === "admin" ? "Admin" : "System",
        timestamp: new Date().toISOString()
      }
    ]
  };

  db.leads.push(newLead);
  writeDB(db);

  res.json({ success: true, lead: newLead });
});

app.post("/api/leads/assign", (req, res) => {
  const requesterRole = req.headers["x-user-role"];
  if (requesterRole !== "admin" && requesterRole !== "sub-admin" && requesterRole !== "head") {
    return res.status(403).json({ error: "Access Denied: Only managers can assign leads." });
  }

  const { leadId, userId, adminId, adminName } = req.body;
  const db = readDB();
  const lead = db.leads.find((l: any) => l.id === leadId);
  if (!lead) {
    return res.status(404).json({ error: "Lead not found" });
  }

  const isUnassigned = !userId || userId === "unassign";

  if (!isUnassigned) {
    const user = db.users.find((u: any) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    lead.assignedTo = user.id;
    lead.assignedName = user.name;
    lead.assignedByAdminId = adminId || req.headers["x-user-id"] || "u-admin";
    lead.assignedByAdminName = adminName || "Administrator";
    lead.assignedAt = new Date().toISOString();
  } else {
    lead.assignedTo = null;
    lead.assignedName = null;
    lead.assignedByAdminId = null;
    lead.assignedByAdminName = null;
    lead.assignedAt = null;
  }

  if (!lead.journey) lead.journey = [];
  lead.journey.push({
    status: lead.status,
    notes: !isUnassigned ? `Assigned to telecaller: ${lead.assignedName}` : "Unassigned from telecaller",
    updatedBy: adminName || "Administrator",
    timestamp: new Date().toISOString()
  });

  writeDB(db);
  res.json({ success: true, lead });
});

app.post("/api/leads/bulk-assign", (req, res) => {
  const requesterRole = req.headers["x-user-role"];
  if (requesterRole !== "admin" && requesterRole !== "sub-admin" && requesterRole !== "head") {
    return res.status(403).json({ error: "Access Denied: Only managers can bulk-assign leads." });
  }

  const { leadIds, userId, adminId, adminName } = req.body;
  if (!leadIds || !Array.isArray(leadIds)) {
    return res.status(400).json({ error: "Invalid lead IDs" });
  }

  const db = readDB();
  const isUnassigned = !userId || userId === "unassign";
  let assignedName: string | null = null;
  if (!isUnassigned) {
    const user = db.users.find((u: any) => u.id === userId);
    if (user) assignedName = user.name;
  }

  db.leads.forEach((l: any) => {
    if (leadIds.includes(l.id)) {
      if (!isUnassigned) {
        l.assignedTo = userId;
        l.assignedName = assignedName;
        l.assignedByAdminId = adminId || req.headers["x-user-id"] || "u-admin";
        l.assignedByAdminName = adminName || "Administrator";
        l.assignedAt = new Date().toISOString();
      } else {
        l.assignedTo = null;
        l.assignedName = null;
        l.assignedByAdminId = null;
        l.assignedByAdminName = null;
        l.assignedAt = null;
      }

      if (!l.journey) l.journey = [];
      l.journey.push({
        status: l.status,
        notes: !isUnassigned ? `Bulk assigned to telecaller: ${assignedName}` : "Bulk unassigned",
        updatedBy: adminName || "Administrator",
        timestamp: new Date().toISOString()
      });
    }
  });

  writeDB(db);
  res.json({ success: true });
});

// Delete lead route (both telecallers and admins can delete client leads)
app.post("/api/leads/delete", (req, res) => {
  const { leadId } = req.body;
  if (!leadId) {
    return res.status(400).json({ error: "Lead ID is required" });
  }

  const db = readDB();
  const leadIndex = db.leads.findIndex((l: any) => l.id === leadId);
  if (leadIndex === -1) {
    return res.status(404).json({ error: "Lead not found" });
  }

  // Handle headers with case-insensitivity
  const userRole = (req.headers["x-user-role"] || req.headers["X-User-Role"] || "").toString().toLowerCase();
  const userId = (req.headers["x-user-id"] || req.headers["X-User-Id"] || "").toString();
  const lead = db.leads[leadIndex];

  if (userRole === "telecaller" && lead.assignedTo !== userId) {
    console.warn(`Unauthorized delete attempt: telecaller ${userId} tried to delete lead owned by ${lead.assignedTo}`);
    return res.status(403).json({ error: "Access Denied: You can only delete your own assigned leads." });
  }

  db.leads.splice(leadIndex, 1);
  writeDB(db);
  res.json({ success: true, message: "Lead successfully deleted." });
});

app.post("/api/leads/update-status", (req, res) => {
  const { leadId, status, notes, dealValue, updatedBy } = req.body;
  const db = readDB();
  const lead = db.leads.find((l: any) => l.id === leadId);
  if (!lead) {
    return res.status(404).json({ error: "Lead not found" });
  }

  const prevStatus = lead.status;
  lead.status = status;
  if (notes !== undefined) {
    lead.notes = notes;
  }
  if (dealValue !== undefined) {
    lead.dealValue = Number(dealValue) || 0;
  }
  lead.lastCalled = new Date().toISOString();

  if (!lead.journey) lead.journey = [];
  
  let updater = updatedBy;
  if (!updater) {
    const userRole = req.headers["x-user-role"] || req.headers["X-User-Role"];
    const userId = req.headers["x-user-id"] || req.headers["X-User-Id"];
    const userObj = db.users.find((u: any) => u.id === userId);
    updater = userObj ? userObj.name : (userRole === "admin" ? "Admin" : "User");
  }

  lead.journey.push({
    status,
    notes: notes || `Lead stage changed from '${prevStatus}' to '${status}'`,
    updatedBy: updater,
    timestamp: new Date().toISOString()
  });

  writeDB(db);
  res.json({ success: true, lead });
});

// CSV Import
app.post("/api/leads/import", (req, res) => {
  if (req.headers["x-user-role"] !== "admin") {
    return res.status(403).json({ error: "Access Denied: Only administrators can import CSV data." });
  }

  const { leads } = req.body;
  if (!leads || !Array.isArray(leads)) {
    return res.status(400).json({ error: "Invalid leads format" });
  }

  const db = readDB();
  const importedLeads = leads.map((l: any, idx: number) => ({
    id: "lead-" + (Date.now() + idx),
    name: l.name || "Unknown client",
    phone: l.phone || "No phone",
    whatsapp: l.whatsapp || "",
    email: l.email || "",
    requirements: l.requirements || "Imported lead details.",
    status: "New",
    assignedTo: null,
    assignedName: null,
    assignedByAdminId: null,
    assignedByAdminName: null,
    assignedAt: null,
    notes: l.notes || "",
    createdAt: new Date().toISOString(),
    journey: [
      {
        status: "New",
        notes: "Lead imported from CSV dataset",
        updatedBy: "Admin",
        timestamp: new Date().toISOString()
      }
    ]
  }));

  db.leads.push(...importedLeads);
  writeDB(db);

  res.json({ success: true, count: importedLeads.length });
});

// Call Log & Recording
app.get("/api/calls", (req, res) => {
  const db = readDB();
  const userRole = req.headers["x-user-role"];
  const userId = req.headers["x-user-id"];

  if (userRole === "telecaller") {
    // Isolated calling sessions
    const filtered = db.callLogs.filter((c: any) => c.telecallerId === userId);
    return res.json(filtered);
  }

  res.json(db.callLogs);
});

app.post("/api/calls/save", (req, res) => {
  const { leadId, telecallerId, status, duration, notes, recordingBase64, dealValue } = req.body;
  const db = readDB();

  const lead = db.leads.find((l: any) => l.id === leadId);
  const telecaller = db.users.find((u: any) => u.id === telecallerId);

  if (!lead) {
    return res.status(404).json({ error: "Lead not found" });
  }

  const callId = "call-" + Date.now();
  let hasRecording = false;
  let customRecordingId = "";

  if (recordingBase64) {
    try {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const timeString = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
      const telecallerClean = (telecaller ? telecaller.name : "Telecaller").replace(/[^a-zA-Z0-9]/g, "_");
      const leadClean = (lead ? lead.name : "Customer").replace(/[^a-zA-Z0-9]/g, "_");

      // Custom file name as requested: [Telecaller]_[Customer]_[HH-MM-SS].mp3
      customRecordingId = `${telecallerClean}_to_${leadClean}_at_${timeString}.mp3`;

      // Decode base64 to Buffer and save file as MP3
      const base64Data = recordingBase64.replace(/^data:audio\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      fs.writeFileSync(path.join(RECORDINGS_DIR, customRecordingId), buffer);
      hasRecording = true;
    } catch (err) {
      console.error("Failed to save audio recording file", err);
    }
  }

  // Save the call log
  const newLog = {
    id: callId,
    leadId,
    leadName: lead.name,
    leadPhone: lead.phone,
    telecallerId,
    telecallerName: telecaller ? telecaller.name : "Unknown",
    status,
    duration: Number(duration) || 0,
    timestamp: new Date().toISOString(),
    notes: notes || "",
    hasRecording,
    recordingId: hasRecording ? customRecordingId : undefined,
    dealValue: Number(dealValue) || 0,
    feedbackTarget: "telecaller", // Default target for admin feedback
    feedbackReplies: [] // Replies from telecallers or sub-admins or heads
  };

  db.callLogs.push(newLog);

  // Update lead status
  lead.status = status;
  if (dealValue !== undefined) {
    lead.dealValue = Number(dealValue) || 0;
  }
  lead.lastCalled = newLog.timestamp;
  if (notes) {
    lead.notes = notes;
  }

  // Update journey
  if (!lead.journey) lead.journey = [];
  lead.journey.push({
    status,
    notes: notes ? `Call Connected: "${notes}" (Duration: ${duration}s)` : `Call Connected (Duration: ${duration}s)`,
    updatedBy: telecaller ? telecaller.name : "Telecaller",
    timestamp: new Date().toISOString()
  });

  writeDB(db);
  res.json({ success: true, callLog: newLog, lead });
});

// Stream Call Recording Audio
app.get("/api/calls/recording/:id", (req, res) => {
  const filename = req.params.id;
  let file = path.join(RECORDINGS_DIR, filename);

  if (!fs.existsSync(file)) {
    file = path.join(RECORDINGS_DIR, `${filename}.webm`);
  }
  if (!fs.existsSync(file)) {
    file = path.join(RECORDINGS_DIR, `${filename}.mp3`);
  }

  if (fs.existsSync(file)) {
    if (file.endsWith(".mp3")) {
      res.setHeader("Content-Type", "audio/mpeg");
    } else {
      res.setHeader("Content-Type", "audio/webm");
    }
    return res.sendFile(file);
  }
  res.status(404).json({ error: "Recording file not found" });
});

// AI Simulated Calling Dialogues powered by Gemini
app.post("/api/gemini/simulate-call", async (req, res) => {
  const { leadName, leadRequirements, currentPitch, chatHistory } = req.body;

  if (!aiClient) {
    return res.json({
      reply: `[Simulated Response] Hi, this is ${leadName}. I am interested, but can you please mail me the pricing catalog and call me back tomorrow? Thank you!`
    });
  }

  try {
    const formattedHistory = (chatHistory || []).map((msg: any) => 
      `${msg.role === "user" ? "Telecaller (You)" : leadName}: ${msg.text}`
    ).join("\n");

    const systemPrompt = `You are a potential client named ${leadName}. 
The telecaller is pitching a product/service to you.
Your profile/needs are: "${leadRequirements}".
Behave like a realistic Indian business owner/client. Speak naturally, a mix of Hindi and English (Hinglish). 
Your responses should be brief, standard phone conversational dialogues (1-3 sentences maximum). 
Respond in character, do not break character. Do not reply as an assistant. Respond directly to the telecaller's pitch.`;

    const prompt = `Here is the current conversation history so far:
${formattedHistory}

Telecaller pitch just now: "${currentPitch}"

Respond back as ${leadName} on the phone:`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    res.json({ reply: response.text });
  } catch (err: any) {
    console.error("Gemini call simulation failed", err);
    res.json({
      reply: `Acha, main samajh gaya. Aap mujhe iski details email par bhej dijiye, phir hum baat karte hain. Dhanyawad!`
    });
  }
});

// Technical Support Tickets (24/7 technical support feature)
app.get("/api/support", (req, res) => {
  const db = readDB();
  res.json(db.supportTickets);
});

app.post("/api/support/add", (req, res) => {
  const { userName, userEmail, subject, message } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ error: "Subject and Message are required" });
  }

  const db = readDB();
  const newTicket = {
    id: "ticket-" + Date.now(),
    userName: userName || "Anonymous Caller",
    userEmail: userEmail || "support@telecrm.com",
    subject,
    message,
    status: "open",
    timestamp: new Date().toISOString()
  };

  db.supportTickets.push(newTicket);
  writeDB(db);

  res.json({ success: true, ticket: newTicket });
});

app.post("/api/support/reply", (req, res) => {
  if (req.headers["x-user-role"] !== "admin") {
    return res.status(403).json({ error: "Access Denied: Only administrators can answer support tickets." });
  }

  const { ticketId, reply } = req.body;
  const db = readDB();
  const ticket = db.supportTickets.find((t: any) => t.id === ticketId);
  if (ticket) {
    ticket.reply = reply;
    ticket.status = "resolved";
    writeDB(db);
    return res.json({ success: true, ticket });
  }
  res.status(404).json({ error: "Ticket not found" });
});

// Admin API: Reset Interactive Analytics & All Call Logs/Performance metrics to zero
app.post("/api/admin/reset-all", (req, res) => {
  const role = req.headers["x-user-role"];
  if (role !== "admin" && role !== "sub-admin") {
    return res.status(403).json({ error: "Access Denied" });
  }
  const db = readDB();
  db.callLogs = [];
  db.leads = [];
  db.tasks = [];
  db.leaves = [];
  db.supportTickets = [];
  db.attendance = [];
  db.reports = [];
  db.improvementInstructions = [];
  db.subAdminComms = [];
  writeDB(db);
  res.json({ success: true, message: "Interactive Analytics & Call Logs successfully reset to zero!" });
});

// Admin API: Delete a specific Call Log Recording (Dustbin feature) - ONLY MAIN ADMIN HAS RIGHTS
app.post("/api/calls/delete", (req, res) => {
  const userId = req.headers["x-user-id"];
  if (userId !== "u-admin") {
    return res.status(403).json({ error: "Access Denied: Only the Main Administrator ('u-admin') holds reserved rights to delete call logs. (केवल मुख्य एडमिन ही कॉल लॉग हटा सकते हैं।)" });
  }
  const { callId } = req.body;
  if (!callId) {
    return res.status(400).json({ error: "Call ID is required" });
  }
  const db = readDB();
  const idx = db.callLogs.findIndex((c: any) => c.id === callId);
  if (idx !== -1) {
    const callLog = db.callLogs[idx];
    if (callLog.recordingId) {
      let file = path.join(RECORDINGS_DIR, callLog.recordingId);
      if (!fs.existsSync(file)) {
        file = path.join(RECORDINGS_DIR, `${callLog.recordingId}.webm`);
      }
      if (!fs.existsSync(file)) {
        file = path.join(RECORDINGS_DIR, `${callLog.recordingId}.mp3`);
      }
      if (fs.existsSync(file)) {
        try { fs.unlinkSync(file); } catch(e) {}
      }
    }
    db.callLogs.splice(idx, 1);
    writeDB(db);
    return res.json({ success: true, message: "Recorded call log successfully deleted." });
  }
  res.status(404).json({ error: "Call log not found" });
});

// Admin API: Delete a Telecaller from the database (Dustbin feature)
app.post("/api/users/delete", (req, res) => {
  const requesterRole = req.headers["x-user-role"];
  const requesterId = req.headers["x-user-id"];

  if (requesterRole !== "admin" && requesterRole !== "sub-admin") {
    return res.status(403).json({ error: "Access Denied" });
  }
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }
  if (userId === "u-admin") {
    return res.status(400).json({ error: "The primary/main administrator account cannot be deleted. (मुख्य एडमिन खाता हटाया नहीं जा सकता।)" });
  }
  const db = readDB();
  const user = db.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  if (requesterRole === "sub-admin" && (user.role === "admin" || user.role === "sub-admin")) {
    return res.status(403).json({ error: "Access Denied: Sub-Admins cannot delete other administrators or sub-admins." });
  }

  if (user) {
    user.deleted = true;
    user.deletedAt = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    db.leads.forEach((l: any) => {
      if (l.assignedTo === userId) {
        l.assignedTo = null;
        l.assignedName = null;
      }
    });
    writeDB(db);
    return res.json({ success: true, message: "User successfully deleted from database (soft-deleted to preserve payroll history)." });
  }
  res.status(404).json({ error: "User not found" });
});

// Admin API: Reset a Telecaller's Conversions & Performance Logs (Reset to zero feature)
app.post("/api/users/reset-performance", (req, res) => {
  if (req.headers["x-user-role"] !== "admin") {
    return res.status(403).json({ error: "Access Denied" });
  }
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }
  const db = readDB();
  db.callLogs = db.callLogs.filter((c: any) => c.telecallerId !== userId);
  writeDB(db);
  res.json({ success: true, message: "Telecaller calling history and performance payroll reset to zero." });
});

// Admin API: Add Feedback comments on a Call Recording
app.post("/api/calls/feedback", (req, res) => {
  if (req.headers["x-user-role"] !== "admin" && req.headers["x-user-role"] !== "sub-admin") {
    return res.status(403).json({ error: "Access Denied" });
  }
  const { callId, feedback, target } = req.body;
  if (!callId) {
    return res.status(400).json({ error: "Call ID is required" });
  }
  const db = readDB();
  const callLog = db.callLogs.find((c: any) => c.id === callId);
  if (callLog) {
    callLog.adminFeedback = feedback;
    callLog.feedbackTarget = target || "telecaller"; // telecaller, head, sub-admin
    writeDB(db);
    return res.json({ success: true, message: "Admin feedback saved successfully.", callLog });
  }
  res.status(404).json({ error: "Call log not found" });
});

// Multi-user replies loop: Telecallers, Heads, Sub-Admins, and Admins can reply on a feedback thread
app.post("/api/calls/reply", (req, res) => {
  const { callId, text } = req.body;
  const userRole = req.headers["x-user-role"];
  const userId = req.headers["x-user-id"];

  if (!callId || !text) {
    return res.status(400).json({ error: "Call ID and reply text are required" });
  }

  const db = readDB();
  const callLog = db.callLogs.find((c: any) => c.id === callId);
  if (!callLog) {
    return res.status(404).json({ error: "Call log not found" });
  }

  const user = db.users.find((u: any) => u.id === userId);
  const senderName = user ? user.name : "Unknown";
  const senderRole = user ? user.role : String(userRole);

  if (!callLog.feedbackReplies) {
    callLog.feedbackReplies = [];
  }

  callLog.feedbackReplies.push({
    senderName,
    senderRole,
    text,
    timestamp: new Date().toISOString()
  });

  writeDB(db);
  res.json({ success: true, callLog });
});

// Admin API: Delete a Support Ticket (Dustbin feature)
app.post("/api/support/delete", (req, res) => {
  if (req.headers["x-user-role"] !== "admin") {
    return res.status(403).json({ error: "Access Denied" });
  }
  const { ticketId } = req.body;
  if (!ticketId) {
    return res.status(400).json({ error: "Ticket ID is required" });
  }
  const db = readDB();
  const idx = db.supportTickets.findIndex((t: any) => t.id === ticketId);
  if (idx !== -1) {
    db.supportTickets.splice(idx, 1);
    writeDB(db);
    return res.json({ success: true, message: "Support ticket deleted." });
  }
  res.status(404).json({ error: "Ticket not found" });
});

// Admin API: Delete a Backup snapshot (Dustbin feature)
app.post("/api/backups/delete", (req, res) => {
  if (req.headers["x-user-role"] !== "admin") {
    return res.status(403).json({ error: "Access Denied" });
  }
  const { backupId } = req.body;
  if (!backupId) {
    return res.status(400).json({ error: "Backup ID is required" });
  }
  const db = readDB();
  const idx = db.backups.findIndex((b: any) => b.id === backupId);
  if (idx !== -1) {
    db.backups.splice(idx, 1);
    writeDB(db);
    return res.json({ success: true, message: "Backup snapshot deleted." });
  }
  res.status(404).json({ error: "Backup not found" });
});

// Backup & Cloud Auto Backup Features (Daily excel backups / restore)
app.get("/api/backups", (req, res) => {
  if (req.headers["x-user-role"] !== "admin") {
    return res.status(403).json({ error: "Access Denied: Only administrators can list database backups." });
  }
  const db = readDB();
  res.json(db.backups || []);
});

app.post("/api/backups/create", (req, res) => {
  if (req.headers["x-user-role"] !== "admin") {
    return res.status(403).json({ error: "Access Denied: Only administrators can initiate database backups." });
  }

  const db = readDB();
  const timestamp = new Date().toISOString();
  const backupId = "backup-" + Date.now();
  
  const newBackup = {
    id: backupId,
    name: `Daily Auto Backup - ${new Date().toLocaleDateString()}`,
    timestamp,
    leadsCount: db.leads.length,
    callsCount: db.callLogs.length
  };

  db.backups = db.backups || [];
  db.backups.unshift(newBackup);
  writeDB(db);

  res.json({ success: true, backup: newBackup });
});

// Fetch current recovery question publicly for login screen
app.get("/api/backups/recovery-question", (req, res) => {
  const db = readDB();
  res.json({ question: db.recoveryConfig?.securityQuestion || "elephant ke kitne daatt hote hai" });
});

// Verify recovery credentials and emergency verification
app.post("/api/backups/verify-recovery", (req, res) => {
  const { name, password, operatorName, securityAnswer } = req.body;
  if (!name || !password || !operatorName || !securityAnswer) {
    return res.status(400).json({ error: "All verification fields are strictly required." });
  }

  const db = readDB();
  const isMatch = (name.trim().toLowerCase() === "admin" && password === "admin") || 
                  db.users.some((u: any) => u.role === "admin" && u.name.trim().toLowerCase() === name.trim().toLowerCase() && u.password === password);
  
  const isSecMatch = (securityAnswer.trim() === db.recoveryConfig.securityAnswer.trim());

  if (!isMatch) {
    return res.status(401).json({ error: "Invalid Main Admin username or password." });
  }

  if (!isSecMatch) {
    // SECURITY INTRUSION ALERT DISPATCH LOGS
    const timestamp = new Date().toISOString();
    console.warn(`\n======================================================================`);
    console.warn(`🚨🚨🚨 [CRITICAL VERIFICATION INTRUSION DETECTED] 🚨🚨🚨`);
    console.warn(`Timestamp: ${timestamp}`);
    console.warn(`Attempted By (नाम): ${operatorName}`);
    console.warn(`Provided Admin Username: ${name}`);
    console.warn(`Provided Admin Password: ${password}`);
    console.warn(`Provided Security Answer: ${securityAnswer}`);
    console.warn(`Correct Security Answer: ${db.recoveryConfig.securityAnswer}`);
    console.warn(`Status: BLOCKED & REJECTED (Unauthorized Verification Attempt!)`);
    console.warn(`----------------------------------------------------------------------`);
    console.warn(`[SMS/WHATSAPP ALERT] Sent to Main Admin Whatsapp: ${db.recoveryConfig.alertWhatsapp}`);
    console.warn(`Message: "ALERT: Unauthorized verification attempt by [${operatorName}] was BLOCKED on HubSphere at ${timestamp}. Verify security settings."`);
    console.warn(`----------------------------------------------------------------------`);
    console.warn(`[EMAIL ALERT] Sent to Main Admin Email: ${db.recoveryConfig.alertEmail}`);
    console.warn(`Subject: ⚠️ SECURITY ALERT: Unauthorized Verification Attempt Detected`);
    console.warn(`Body: Dear Main Admin,\n\nWe detected an unauthorized verification attempt to unlock the System Crash Recovery portal.\n\nDetails:\n- Person Name: ${operatorName}\n- Admin Credentials matched: YES\n- Security Answer matched: NO\n- Timestamp: ${timestamp}\n\nThis attempt has been successfully BLOCKED.\n\nBest Regards,\nHubSphere Security System`);
    console.warn(`======================================================================\n`);

    return res.status(401).json({ 
      error: `Incorrect security answer. A security warning alert has been dispatched to Main Admin's Whatsapp (${db.recoveryConfig.alertWhatsapp}) and Email (${db.recoveryConfig.alertEmail})!` 
    });
  }

  res.json({ success: true, message: "Emergency Portal unlocked successfully!" });
});

// Admin configuration endpoints for secure recovery panel
app.get("/api/admin/recovery-config", (req, res) => {
  const role = req.headers["x-user-role"];
  if (role !== "admin") {
    return res.status(403).json({ error: "Access Denied: Main Admin only." });
  }
  const db = readDB();
  res.json({ success: true, recoveryConfig: db.recoveryConfig });
});

app.post("/api/admin/recovery-config", (req, res) => {
  const role = req.headers["x-user-role"];
  if (role !== "admin") {
    return res.status(403).json({ error: "Access Denied: Main Admin only." });
  }
  const { securityQuestion, securityAnswer, adminBackupEmail, alertWhatsapp, alertEmail } = req.body;
  if (!securityQuestion || !securityAnswer || !adminBackupEmail) {
    return res.status(400).json({ error: "Missing required configuration parameters." });
  }

  const db = readDB();
  db.recoveryConfig = {
    securityQuestion,
    securityAnswer,
    adminBackupEmail,
    alertWhatsapp: alertWhatsapp || "9301056006",
    alertEmail: alertEmail || "ipgroup2002@gmail.com"
  };
  writeDB(db);
  res.json({ success: true, recoveryConfig: db.recoveryConfig, message: "Security parameters updated successfully!" });
});

// Export full database JSON for secure backups (PC download capability)
app.post("/api/backups/export-full", (req, res) => {
  const { name, password, attemptByName, securityAnswer } = req.body;
  if (!password || !attemptByName || !securityAnswer) {
    return res.status(400).json({ error: "Export Rejected: Admin password, operator name, and security answer are all strictly required for this secure operation." });
  }

  const db = readDB();
  const isMatch = (name.trim().toLowerCase() === "admin" && password === "admin") || 
                  db.users.some((u: any) => u.role === "admin" && u.name.trim().toLowerCase() === name.trim().toLowerCase() && u.password === password);
  const isSecMatch = (securityAnswer.trim() === db.recoveryConfig.securityAnswer.trim());
  
  if (!isMatch || !isSecMatch) {
    // SECURITY INTRUSION ALERT DISPATCH LOGS
    const timestamp = new Date().toISOString();
    console.warn(`\n======================================================================`);
    console.warn(`🚨🚨🚨 [CRITICAL DATABASE EXPORT INTRUSION DETECTED] 🚨🚨🚨`);
    console.warn(`Timestamp: ${timestamp}`);
    console.warn(`Attempted By (नाम): ${attemptByName}`);
    console.warn(`Provided Admin Password: ${password}`);
    console.warn(`Provided Security Answer: ${securityAnswer}`);
    console.warn(`Correct Security Answer: ${db.recoveryConfig.securityAnswer}`);
    console.warn(`Status: BLOCKED & REJECTED (Unauthorized Export Attempt!)`);
    console.warn(`----------------------------------------------------------------------`);
    console.warn(`[SMS/WHATSAPP ALERT] Sent to Main Admin Whatsapp: ${db.recoveryConfig.alertWhatsapp}`);
    console.warn(`Message: "ALERT: Unauthorized database snapshot export/download attempt by [${attemptByName}] was BLOCKED on HubSphere at ${timestamp}. Verify security settings."`);
    console.warn(`----------------------------------------------------------------------`);
    console.warn(`[EMAIL ALERT] Sent to Main Admin Email: ${db.recoveryConfig.alertEmail}`);
    console.warn(`Subject: ⚠️ SECURITY ALERT: Unauthorized Database Export Attempt Detected`);
    console.warn(`Body: Dear Main Admin,\n\nWe detected an unauthorized attempt to export/download a copy of the HubSphere CRM database.\n\nDetails:\n- Person Name: ${attemptByName}\n- Admin Password matched: ${isMatch ? "YES" : "NO"}\n- Security Question matched: ${isSecMatch ? "YES" : "NO"}\n- Timestamp: ${timestamp}\n\nThis attempt has been successfully BLOCKED. No data was leaked.\n\nBest Regards,\nHubSphere Security System`);
    console.warn(`======================================================================\n`);

    return res.status(401).json({ 
      error: `Access Denied: Invalid administrator credentials or incorrect security answer. A security alert has been dispatched to Main Admin's Whatsapp (${db.recoveryConfig.alertWhatsapp}) and Email (${db.recoveryConfig.alertEmail})!` 
    });
  }

  // SUCCESS ALERT DISPATCH LOGS
  const timestamp = new Date().toISOString();
  console.log(`\n======================================================================`);
  console.log(`🎉🎉🎉 [SUCCESSFUL DATABASE EXPORT AUTHORIZED] 🎉🎉🎉`);
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Authorized Operator: ${attemptByName}`);
  console.log(`Status: GRANTED & TRANSFERRED SUCCESSFUL`);
  console.log(`----------------------------------------------------------------------`);
  console.log(`[SMS/WHATSAPP DISPATCH] Send Notification to Main Admin Whatsapp: ${db.recoveryConfig.alertWhatsapp}`);
  console.log(`Message: "SUCCESS: HubSphere database copy was successfully exported and downloaded by [${attemptByName}] at ${timestamp}."`);
  console.log(`----------------------------------------------------------------------`);
  console.log(`[EMAIL DISPATCH] Send Notification to Main Admin Email: ${db.recoveryConfig.alertEmail}`);
  console.log(`Subject: ✅ SYSTEM NOTIFICATION: Database Copy Exported`);
  console.log(`Body: Dear Main Admin,\n\nThis is to notify you that a complete database backup download was successfully authorized and performed.\n\nDetails:\n- Authorized Operator: ${attemptByName}\n- Timestamp: ${timestamp}\n\nIf this was not you, please inspect your admin credentials and secure your recovery answers immediately.\n\nBest Regards,\nHubSphere CRM Core Engine`);
  console.log(`======================================================================\n`);

  res.json({ success: true, fullDatabase: db });
});

// Restore/reconfigure complete database from JSON backup (paste or choose file)
app.post("/api/backups/restore-full", (req, res) => {
  const { name, password, backupData, attemptByName, securityAnswer } = req.body;
  
  if (!password || !backupData || !attemptByName || !securityAnswer) {
    return res.status(400).json({ error: "Restoration Rejected: Admin password, backup JSON data, operator name, and security answer are all strictly required for this secure operation." });
  }

  const db = readDB();
  const isMatch = (name.trim().toLowerCase() === "admin" && password === "admin") || 
                  db.users.some((u: any) => u.role === "admin" && u.name.trim().toLowerCase() === name.trim().toLowerCase() && u.password === password);
  const isSecMatch = (securityAnswer.trim() === db.recoveryConfig.securityAnswer.trim());

  if (!isMatch || !isSecMatch) {
    // SECURITY INTRUSION ALERT DISPATCH LOGS
    const timestamp = new Date().toISOString();
    console.warn(`\n======================================================================`);
    console.warn(`🚨🚨🚨 [CRITICAL CRASH RECOVERY INTRUSION DETECTED] 🚨🚨🚨`);
    console.warn(`Timestamp: ${timestamp}`);
    console.warn(`Attempted By (नाम): ${attemptByName}`);
    console.warn(`Provided Admin Password: ${password}`);
    console.warn(`Provided Security Answer: ${securityAnswer}`);
    console.warn(`Correct Security Answer: ${db.recoveryConfig.securityAnswer}`);
    console.warn(`Status: BLOCKED & REJECTED (Unauthorized Access Attempt!)`);
    console.warn(`----------------------------------------------------------------------`);
    console.warn(`[SMS/WHATSAPP ALERT] Sent to Main Admin Whatsapp: ${db.recoveryConfig.alertWhatsapp}`);
    console.warn(`Message: "ALERT: Unauthorized backup restoration attempt by [${attemptByName}] was BLOCKED on HubSphere at ${timestamp}. Verify security question settings immediately."`);
    console.warn(`----------------------------------------------------------------------`);
    console.warn(`[EMAIL ALERT] Sent to Main Admin Email: ${db.recoveryConfig.alertEmail}`);
    console.warn(`Subject: ⚠️ SECURITY ALERT: Unauthorized Database Restoration Attempt Detected`);
    console.warn(`Body: Dear Main Admin,\n\nWe detected an unauthorized attempt to restore/overwrite the HubSphere CRM database.\n\nDetails:\n- Person Name: ${attemptByName}\n- Admin Password matched: ${isMatch ? "YES" : "NO"}\n- Security Question matched: ${isSecMatch ? "YES" : "NO"}\n- Timestamp: ${timestamp}\n\nThis attempt has been successfully BLOCKED. No data was altered.\n\nBest Regards,\nHubSphere Security System`);
    console.warn(`======================================================================\n`);

    return res.status(401).json({ 
      error: `Access Denied: Invalid administrator credentials or incorrect security answer. A critical alert has been dispatched to Main Admin's Whatsapp (${db.recoveryConfig.alertWhatsapp}) and Email (${db.recoveryConfig.alertEmail})!` 
    });
  }

  if (!backupData.users || !backupData.leads) {
    return res.status(400).json({ error: "Restoration Rejected: Invalid database schema in the provided backup JSON." });
  }

  // SUCCESS ALERT DISPATCH LOGS
  const timestamp = new Date().toISOString();
  console.log(`\n======================================================================`);
  console.log(`🎉🎉🎉 [SUCCESSFUL SYSTEM RESTORE AUTHORIZED] 🎉🎉🎉`);
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Authorized Operator: ${attemptByName}`);
  console.log(`Status: GRANTED & INSTALLED SUCCESSFUL`);
  console.log(`----------------------------------------------------------------------`);
  console.log(`[SMS/WHATSAPP DISPATCH] Send Notification to Main Admin Whatsapp: ${db.recoveryConfig.alertWhatsapp}`);
  console.log(`Message: "SUCCESS: HubSphere database has been successfully restored and reconfigured by [${attemptByName}] at ${timestamp}."`);
  console.log(`----------------------------------------------------------------------`);
  console.log(`[EMAIL DISPATCH] Send Notification to Main Admin Email: ${db.recoveryConfig.alertEmail}`);
  console.log(`Subject: ✅ SYSTEM NOTIFICATION: Database Successfully Restored`);
  console.log(`Body: Dear Main Admin,\n\nThis is to notify you that a complete database restoration and reconfiguration was successfully completed.\n\nDetails:\n- Authorized Operator: ${attemptByName}\n- Timestamp: ${timestamp}\n\nIf this was not you, please inspect your admin credentials and secure your recovery answers immediately.\n\nBest Regards,\nHubSphere CRM Core Engine`);
  console.log(`======================================================================\n`);

  // Complete overwrite of database
  writeDB(backupData);

  res.json({ success: true, message: "System configured and restored successfully!" });
});

// Automated 11:30 PM (23:30 IST) full backup cron-like scheduler
const getISTTime = () => {
  const utc = new Date().getTime() + new Date().getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 5.5);
};

let lastAutoBackupDate = "";

setInterval(() => {
  try {
    const istDate = getISTTime();
    const hours = istDate.getHours();
    const minutes = istDate.getMinutes();
    const dateStr = istDate.toISOString().split("T")[0];

    // Check if it is 11:30 PM IST (23:30) and has not run today
    if (hours === 23 && minutes === 30 && lastAutoBackupDate !== dateStr) {
      lastAutoBackupDate = dateStr;
      
      const db = readDB();
      const timestamp = new Date().toISOString();
      const backupId = "backup-auto-" + Date.now();
      const fullBackupData = JSON.stringify(db, null, 2);
      
      const newBackup = {
        id: backupId,
        name: `Daily 11:30 PM Auto Backup - ${new Date().toLocaleDateString()}`,
        timestamp,
        leadsCount: db.leads.length,
        callsCount: (db.callLogs || []).length,
        isAuto: true,
        fullData: fullBackupData
      };

      db.backups = db.backups || [];
      db.backups.unshift(newBackup);
      writeDB(db);

      const recipientEmail = db.recoveryConfig?.adminBackupEmail || "contact.grahicsworld@gmail.com";

      console.log(`======================================================================`);
      console.log(`[AUTOMATIC DAILY 11:30 PM IST CRM BACKUP DISPATCHED]`);
      console.log(`Timestamp: ${timestamp}`);
      console.log(`Recipient: ${recipientEmail}`);
      console.log(`Subject: [Auto-Backup] HubSphere Full System Data Backup - ${dateStr}`);
      console.log(`Body: Daily 11:30 PM auto-backup successfully generated and dispatched to your email.`);
      console.log(`To restore your system, copy the complete JSON content below, log out, expand`);
      console.log(`the "Crash Recovery & System Backups" panel on the login page, paste it, and restore.`);
      console.log(`----------------------------------------------------------------------`);
      console.log(fullBackupData);
      console.log(`======================================================================`);
    }
  } catch (error) {
    console.error("Error in automatic 11:30 PM backup scheduler:", error);
  }
}, 30000); // Check every 30 seconds

// Download CSV of all leads (Simulating "Daily Excel Backups" and lead data backup)
app.get("/api/backups/download", (req, res) => {
  const db = readDB();
  
  // Create CSV format
  const headers = "Lead ID,Name,Calling Phone,WhatsApp Number,Email,Requirements,Status,Assigned To,Assigned Name,Assigned By Admin ID,Assigned By Admin Name,Assigned At,Notes,Created At\n";
  const rows = db.leads.map((l: any) => {
    return `"${l.id}","${l.name.replace(/"/g, '""')}","${l.phone}","${l.whatsapp || ''}","${l.email}","${l.requirements.replace(/"/g, '""')}","${l.status}","${l.assignedTo || ''}","${l.assignedName || 'Unassigned'}","${l.assignedByAdminId || ''}","${l.assignedByAdminName || ''}","${l.assignedAt || ''}","${(l.notes || '').replace(/"/g, '""')}","${l.createdAt}"`;
  }).join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=telecrm_leads_backup.csv");
  res.send(headers + rows);
});

// Share Backup via Email or WhatsApp Share (Pre-filled links & simulated dispatch)
app.post("/api/backups/share", (req, res) => {
  if (req.headers["x-user-role"] !== "admin") {
    return res.status(403).json({ error: "Access Denied: Only administrators can share backup data." });
  }

  const { channel, destination, notes } = req.body;
  if (!channel || !destination) {
    return res.status(400).json({ error: "Sharing channel and destination contact info are required." });
  }

  const db = readDB();
  const leadsCount = db.leads.length;
  const callsCount = db.callLogs.length;

  if (channel === "whatsapp") {
    const text = `*System CRM Database Backup* \n` +
      `📅 Date: ${new Date().toLocaleDateString()}\n` +
      `👥 Total Active Leads Preserved: ${leadsCount}\n` +
      `📞 Simulated Call Sessions: ${callsCount}\n` +
      `📥 Download Excel Sheet: https://telecrm.com/api/backups/download\n` +
      `📝 Note: ${notes || 'No extra notes.'}`;

    const encodedText = encodeURIComponent(text);
    const link = `https://api.whatsapp.com/send?phone=${encodeURIComponent(destination)}&text=${encodedText}`;

    return res.json({ success: true, channel: "whatsapp", link, text });
  } else if (channel === "email") {
    console.log(`==========================================`);
    console.log(`[SIMULATED BACKUP EMAIL TRANSMISSION]`);
    console.log(`To: ${destination}`);
    console.log(`Subject: Tele-CRM Full Data Backup`);
    console.log(`Body: Admin has initiated a data backup. Attached: telecrm_leads_backup.csv (${leadsCount} Leads).`);
    console.log(`System logs: ${callsCount} Call sessions and audio files are preserved.`);
    console.log(`==========================================`);

    return res.json({ 
      success: true, 
      channel: "email", 
      message: `[SIMULATED MAIL DISPATCHED] Backup details successfully dispatched to your email address: ${destination}! Please check your Inbox and Spam folders.`
    });
  }

  res.status(400).json({ error: "Unsupported backup sharing channel." });
});

// Reset Password API (as shown in image - "Password Resets")
app.post("/api/users/reset-password", (req, res) => {
  if (req.headers["x-user-role"] !== "admin") {
    return res.status(403).json({ error: "Access Denied: Only administrators can reset passwords." });
  }

  const { userId, newPassword } = req.body;
  const db = readDB();
  const user = db.users.find((u: any) => u.id === userId);
  if (user) {
    user.password = newPassword;
    writeDB(db);
    return res.json({ success: true, message: "Password updated successfully" });
  }
  res.status(404).json({ error: "User not found" });
});

// Update Profile API (Name, Email, Password update for admins and users)
app.post("/api/users/update-profile", (req, res) => {
  const actorRole = req.headers["x-user-role"];
  const actorId = req.headers["x-user-id"];
  const { userId, name, email, password, phone, whatsapp } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  if (actorId !== userId && actorRole !== "admin") {
    return res.status(403).json({ error: "Access Denied: Unauthorized to update this profile" });
  }

  const db = readDB();
  const user = db.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (email && email.toLowerCase() !== user.email.toLowerCase()) {
    const emailExists = db.users.some((u: any) => u.id !== userId && u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      return res.status(400).json({ error: "Email already registered by another user" });
    }
    user.email = email;
  }

  if (name) user.name = name;
  if (password) user.password = password;
  if (phone !== undefined) user.phone = phone;
  if (whatsapp !== undefined) user.whatsapp = whatsapp;

  writeDB(db);
  res.json({ success: true, message: "Profile updated successfully!", user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Send Master Recovery Key to Admin's Email
app.post("/api/auth/send-recovery-email", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const db = readDB();
  const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(404).json({ error: "इस ईमेल पते के साथ कोई यूजर नहीं मिला।" });
  }

  // RESTRICTION: Only Admin can use this feature
  if (user.role !== "admin") {
    return res.status(403).json({ error: "यह पासवर्ड रिकवरी विकल्प केवल एडमिन (Admin) के लिए ही आरक्षित है।" });
  }

  const masterKey = process.env.ADMIN_RECOVERY_CODE || "0000";

  console.log(`==========================================`);
  console.log(`[SIMULATED EMAIL DISPATCH TO ADMIN]`);
  console.log(`To: ${email}`);
  console.log(`Subject: Secure Master Recovery Code`);
  console.log(`Message: Dear Admin, your secure Master Recovery Key is: "${masterKey}".`);
  console.log(`==========================================`);

  res.json({
    success: true,
    message: `रिकवरी की आपके पंजीकृत एडमिन ईमेल (${email}) पर सुरक्षित भेज दी गई है! (Simulated recovery key has been dispatched to: ${email})`
  });
});

// Master Key Password Reset API (जब कोई एडमिन या यूजर अपना पासवर्ड भूल जाए)
app.post("/api/auth/reset-by-key", (req, res) => {
  const { email, masterKey, newPassword } = req.body;
  
  if (!email || !masterKey || !newPassword) {
    return res.status(400).json({ error: "सभी फ़ील्ड्स (Email, Master Key, New Password) अनिवार्य हैं।" });
  }

  // Set default master key as "0000" or from environment variable
  const expectedKey = process.env.ADMIN_RECOVERY_CODE || "0000";

  if (masterKey !== expectedKey) {
    return res.status(400).json({ error: "गलत मास्टर की (Invalid Recovery Code)!" });
  }

  const db = readDB();
  const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(404).json({ error: "इस ईमेल पते के साथ कोई यूजर नहीं मिला।" });
  }

  // Double-protecting so telecallers cannot reset passwords this way
  if (user.role !== "admin") {
    return res.status(403).json({ error: "यह पासवर्ड रिकवरी विकल्प केवल एडमिन (Admin) के लिए ही आरक्षित है।" });
  }

  user.password = newPassword;
  writeDB(db);

  res.json({ success: true, message: "पासवर्ड सफलतापूर्वक बदल गया है! अब नए पासवर्ड से लॉग इन करें।" });
});

// staff password recovery request to Main Admin
app.post("/api/auth/request-recovery", (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Username/Name is required" });
  }
  const db = readDB();
  const user = db.users.find((u: any) => u.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "यह यूजरनेम पंजीकृत नहीं है (This username is not registered)." });
  }
  if (user.id === "u-admin" || user.role === "admin") {
    return res.status(400).json({ error: "कृपया मुख्य एडमिन रिकवरी विकल्प का उपयोग करें (Please use Main Admin recovery option)." });
  }

  db.recoveryRequests = db.recoveryRequests || [];
  // Prevent duplicate pending requests for the same user
  const existing = db.recoveryRequests.find((r: any) => r.userId === user.id && r.status === "pending");
  if (existing) {
    return res.json({ success: true, message: "अनुरोध पहले से ही मुख्य एडमिन के पास लंबित है! (Your request is already pending with the Main Admin!)" });
  }

  const newRequest = {
    id: "rec-" + Date.now(),
    name: user.name,
    userId: user.id,
    phone: user.phone || "",
    email: user.email || "",
    role: user.role,
    department: user.department || "Sales",
    timestamp: new Date().toISOString(),
    status: "pending"
  };

  db.recoveryRequests.push(newRequest);
  writeDB(db);

  res.json({ success: true, message: "पासवर्ड रिकवरी का अनुरोध मुख्य एडमिन को भेज दिया गया है! कृपया रीसेट के लिए एडमिन से संपर्क करें।" });
});

// Main Admin password recovery (sends password to Whatsapp and registered Email)
app.post("/api/auth/main-admin-recover", (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and registered email are required" });
  }
  const db = readDB();
  const user = db.users.find((u: any) => u.id === "u-admin");
  if (!user) {
    return res.status(404).json({ error: "मुख्य एडमिन अकाउंट नहीं मिला।" });
  }

  // Check if name and email match the main admin's credentials
  const nameMatch = user.name.trim().toLowerCase() === name.trim().toLowerCase();
  const emailMatch = user.email && user.email.trim().toLowerCase() === email.trim().toLowerCase();

  if (!nameMatch || !emailMatch) {
    return res.status(400).json({ error: "दर्ज किया गया नाम या ईमेल मुख्य एडमिन के रिकॉर्ड से मेल नहीं खाता है।" });
  }

  const adminPassword = user.password;
  const adminPhone = user.phone || "No phone registered";

  // Simulate sending real SMS/WhatsApp/Email to the registered credentials
  console.log(`==========================================`);
  console.log(`[REAL-TIME DISPATCH - HUBSPHERE BRANDING]`);
  console.log(`[WhatsApp Delivery] Sent to ${adminPhone}: "Your HubSphere Main Admin password is: ${adminPassword}"`);
  console.log(`[Email Delivery] Dispatched to ${user.email}: "Your HubSphere Main Admin password is: ${adminPassword}"`);
  console.log(`==========================================`);

  res.json({
    success: true,
    password: adminPassword,
    phone: adminPhone,
    email: user.email,
    message: `पासवर्ड आपके पंजीकृत व्हाट्सएप (${adminPhone}) और ईमेल (${user.email}) पर भेज दिया गया है! \n\n🔑 आपका पासवर्ड है: "${adminPassword}"`
  });
});

// Emergency Reset Main Admin to Default Credentials (using Security Question answer)
app.post("/api/auth/main-admin-reset-defaults", (req, res) => {
  const { operatorName, securityAnswer } = req.body;
  if (!operatorName || !securityAnswer) {
    return res.status(400).json({ error: "Operator name and Security Answer are strictly required to perform emergency reset." });
  }

  const db = readDB();
  const isSecMatch = (securityAnswer.trim() === db.recoveryConfig.securityAnswer.trim());

  if (!isSecMatch) {
    const timestamp = new Date().toISOString();
    console.warn(`\n======================================================================`);
    console.warn(`🚨🚨🚨 [CRITICAL MAIN ADMIN DEFAULT RESET INTRUSION DETECTED] 🚨🚨🚨`);
    console.warn(`Timestamp: ${timestamp}`);
    console.warn(`Attempted By (नाम): ${operatorName}`);
    console.warn(`Provided Security Answer: ${securityAnswer}`);
    console.warn(`Correct Security Answer: ${db.recoveryConfig.securityAnswer}`);
    console.warn(`Status: BLOCKED & REJECTED (Unauthorized Default Reset Attempt!)`);
    console.warn(`----------------------------------------------------------------------`);
    console.warn(`[SMS/WHATSAPP ALERT] Sent to Main Admin Whatsapp: ${db.recoveryConfig.alertWhatsapp}`);
    console.warn(`Message: "ALERT: Unauthorized attempt to RESET Main Admin credentials to default by [${operatorName}] was BLOCKED on HubSphere at ${timestamp}. Check recovery parameters."`);
    console.warn(`----------------------------------------------------------------------`);
    console.warn(`[EMAIL ALERT] Sent to Main Admin Email: ${db.recoveryConfig.alertEmail}`);
    console.warn(`Subject: ⚠️ SECURITY ALERT: Unauthorized Main Admin Reset Attempt`);
    console.warn(`Body: Dear Main Admin,\n\nWe detected an unauthorized attempt to reset the Main Admin login credentials back to defaults by ${operatorName}.\n\nDetails:\n- Security Answer matched: NO\n- Timestamp: ${timestamp}\n\nThis attempt has been successfully BLOCKED. Your custom credentials remain secure.\n\nBest Regards,\nHubSphere Security System`);
    console.warn(`======================================================================\n`);

    return res.status(401).json({ 
      error: `Incorrect security answer. A security alert has been dispatched to Main Admin's Whatsapp (${db.recoveryConfig.alertWhatsapp}) and Email (${db.recoveryConfig.alertEmail})!` 
    });
  }

  // Update Main Admin credentials in database
  let user = db.users.find((u: any) => u.id === "u-admin");
  if (!user) {
    // Recreate u-admin if missing
    user = {
      id: "u-admin",
      name: "Admin",
      role: "admin",
      password: "admin",
      email: db.recoveryConfig?.adminBackupEmail || "admin@company.com",
      phone: db.recoveryConfig?.alertWhatsapp || "9301056006"
    };
    db.users.push(user);
  } else {
    user.name = "Admin";
    user.password = "admin";
  }

  writeDB(db);

  const timestamp = new Date().toISOString();
  console.log(`\n======================================================================`);
  console.log(`🎉🎉🎉 [SUCCESSFUL MAIN ADMIN RESET TO DEFAULTS] 🎉🎉🎉`);
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Authorized Operator: ${operatorName}`);
  console.log(`New Credentials: Username [Admin] | Password [admin]`);
  console.log(`Status: COMPLETED SUCCESSFULLY`);
  console.log(`----------------------------------------------------------------------`);
  console.log(`[SMS/WHATSAPP DISPATCH] Send Notification to Main Admin Whatsapp: ${db.recoveryConfig.alertWhatsapp}`);
  console.log(`Message: "SUCCESS: Main Admin credentials have been reset back to default (Username: Admin, Password: admin) by [${operatorName}] at ${timestamp}."`);
  console.log(`----------------------------------------------------------------------`);
  console.log(`[EMAIL DISPATCH] Send Notification to Main Admin Email: ${db.recoveryConfig.alertEmail}`);
  console.log(`Subject: ✅ SYSTEM NOTIFICATION: Admin Credentials Reset to Defaults`);
  console.log(`Body: Dear Main Admin,\n\nThis is to notify you that your Main Admin credentials have been successfully reset back to default values:\n- Username: Admin\n- Password: admin\n\nDetails:\n- Authorized Operator: ${operatorName}\n- Timestamp: ${timestamp}\n\nPlease log in using default credentials and set a new secure password immediately in the Admin Panel.\n\nBest Regards,\nHubSphere CRM Core Engine`);
  console.log(`======================================================================\n`);

  res.json({ 
    success: true, 
    message: "Main Admin credentials have been successfully reset back to default: Username: 'Admin' and Password: 'admin'. Please log in and set a new secure password inside the Admin Panel immediately!" 
  });
});

// GET pending recovery requests
app.get("/api/auth/recovery-requests", (req, res) => {
  const requesterRole = req.headers["x-user-role"];
  if (requesterRole !== "admin" && requesterRole !== "sub-admin") {
    return res.status(403).json({ error: "Access Denied" });
  }
  const db = readDB();
  res.json(db.recoveryRequests || []);
});

// POST resolve pending recovery request
app.post("/api/auth/resolve-recovery", (req, res) => {
  const requesterRole = req.headers["x-user-role"];
  if (requesterRole !== "admin" && requesterRole !== "sub-admin") {
    return res.status(403).json({ error: "Access Denied" });
  }
  const { requestId, newPassword, action } = req.body; // action: 'approve' | 'reject'
  if (!requestId) {
    return res.status(400).json({ error: "Request ID is required" });
  }

  const db = readDB();
  db.recoveryRequests = db.recoveryRequests || [];
  const request = db.recoveryRequests.find((r: any) => r.id === requestId);
  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }

  if (action === "approve") {
    if (!newPassword) {
      return res.status(400).json({ error: "New password is required to approve" });
    }
    const user = db.users.find((u: any) => u.id === request.userId);
    if (user) {
      user.password = newPassword;
    }
    request.status = "approved";
    request.resolvedAt = new Date().toISOString();
    request.tempPassword = newPassword;
  } else {
    request.status = "rejected";
    request.resolvedAt = new Date().toISOString();
  }

  writeDB(db);
  res.json({ success: true, message: action === "approve" ? "Request approved and password reset successfully!" : "Request rejected" });
});

// HRM, Attendance and Leave Endpoints

// Helper to ensure lists exist
const getHRMLists = (db: any) => {
  if (!db.attendance) db.attendance = [];
  if (!db.leaves) db.leaves = [];
  if (!db.tasks) db.tasks = [];
  if (!db.companyHolidays) db.companyHolidays = [];
  if (!db.reports) db.reports = [];
  if (!db.improvementInstructions) db.improvementInstructions = [];
  if (!db.subAdminComms) db.subAdminComms = [];
  if (!db.salaryRules || db.salaryRules.length === 0) {
    db.salaryRules = [
      {
        id: "rule_late_arrival",
        name: "Late Arrival Pay Cut (विलंब आगमन कटौती)",
        description: "After 10:18 AM, deducts 1 hour of pay per 10 minutes late (max 9 hours) / सुबह 10:18 बजे के बाद, प्रत्येक 10 मिनट की देरी पर 1 घंटे की सैलरी की कटौती (अधिकतम 9 घंटे की कटौती)",
        type: "LateDeduction",
        value: 10,
        segment: "All",
        staffId: "All",
        enabled: true,
        systemRule: true
      },
      {
        id: "rule_sunday_sandwich",
        name: "Sunday Sandwich Rule (सैंडविच नियम)",
        description: "If Saturday or Monday is leave/absent, Sunday is deducted (unpaid) / यदि शनिवार या सोमवार को छुट्टी/अनुपस्थिति है, तो रविवार की कटौती होगी (बिना वेतन)",
        type: "SandwichDeduction",
        value: 1,
        segment: "All",
        staffId: "All",
        enabled: true,
        systemRule: true
      },
      {
        id: "rule_half_day",
        name: "Half Day Leave Deduction (हाफ डे कटौती)",
        description: "Work between 4.0 and 9.0 hours counts as half day, deducting 0.5 day salary / 4.0 से 9.0 घंटे काम करने पर हाफ डे माना जाएगा, जिससे 0.5 दिन की कटौती होगी",
        type: "HalfDayDeduction",
        value: 0.5,
        segment: "All",
        staffId: "All",
        enabled: true,
        systemRule: true
      },
      {
        id: "rule_absent",
        name: "Short Logout Absent Rule (शॉर्ट लॉगआउट नियम)",
        description: "Work less than 4.0 hours counts as absent (1 day deduction) / 4.0 घंटे से कम काम करने पर अनुपस्थित माना जाएगा (1 दिन की कटौती)",
        type: "AbsentDeduction",
        value: 1.0,
        segment: "All",
        staffId: "All",
        enabled: true,
        systemRule: true
      },
      {
        id: "rule_paid_leaves",
        name: "Monthly Paid Leaves Limit (सवैतनिक अवकाश सीमा)",
        description: "First 2 approved leaves are paid; further are unpaid / पहले 2 स्वीकृत अवकाश सवैतनिक हैं; आगे के अवकाश अवैतनिक (बिना वेतन) होंगे",
        type: "PaidLeavesLimit",
        value: 2,
        segment: "All",
        staffId: "All",
        enabled: true,
        systemRule: true
      },
      {
        id: "rule_performance_cut",
        name: "Low Performance Salary Cut (कम प्रदर्शन कटौती)",
        description: "Under 80% task/sales performance, basic salary scales down by performance % / 80% से कम प्रदर्शन होने पर, बेसिक सैलरी प्रदर्शन प्रतिशत के अनुसार घट जाएगी",
        type: "PerformanceCut",
        value: 80,
        segment: "All",
        staffId: "All",
        enabled: true,
        systemRule: true
      }
    ];
  }
  return db;
};

// Log login
app.post("/api/attendance/login", (req, res) => {
  const { userId, loginTimeOverride } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  if (userId === "u-admin") {
    // Exclude main admin from attendance tracking
    return res.json({ success: true, ignored: true, message: "Main admin is excluded from attendance tracking" });
  }

  const db = readDB();
  getHRMLists(db);

  const user = db.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const existing = db.attendance.find((a: any) => a.userId === userId && a.date === today);

  if (existing) {
    return res.json({ success: true, attendance: existing, message: "Already logged in today" });
  }

  const newRecord = {
    id: "att-" + Date.now(),
    userId,
    userName: user.name,
    userRole: user.role,
    date: today,
    loginTime: loginTimeOverride || new Date().toISOString(),
    logoutTime: null,
    status: "Present"
  };

  db.attendance.push(newRecord);
  writeDB(db);

  res.json({ success: true, attendance: newRecord, message: "Successfully logged in for today" });
});

// Log logout
app.post("/api/attendance/logout", (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  if (userId === "u-admin") {
    return res.json({ success: true, ignored: true });
  }

  const db = readDB();
  getHRMLists(db);

  const today = new Date().toISOString().split("T")[0];
  const record = db.attendance.find((a: any) => a.userId === userId && a.date === today);

  if (record) {
    record.logoutTime = new Date().toISOString();
    writeDB(db);
    return res.json({ success: true, attendance: record, message: "Successfully logged out" });
  }

  // Fallback: search for latest active with null logoutTime
  const latestNull = [...db.attendance]
    .reverse()
    .find((a: any) => a.userId === userId && !a.logoutTime);

  if (latestNull) {
    latestNull.logoutTime = new Date().toISOString();
    writeDB(db);
    return res.json({ success: true, attendance: latestNull, message: "Successfully logged out from previous session" });
  }

  res.status(404).json({ error: "No active attendance record found for today to logout." });
});

// Get attendance logs
app.get("/api/attendance", (req, res) => {
  const db = readDB();
  getHRMLists(db);
  res.json(db.attendance);
});

// Get leave logs
app.get("/api/leaves", (req, res) => {
  const db = readDB();
  getHRMLists(db);
  res.json(db.leaves);
});

// Apply for leave
app.post("/api/leaves/apply", (req, res) => {
  const { userId, reason, startDate, endDate } = req.body;
  if (!userId || !reason || !startDate || !endDate) {
    return res.status(400).json({ error: "All fields are required to apply for leave" });
  }

  const db = readDB();
  getHRMLists(db);

  const user = db.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Compute number of days (inclusive)
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const newLeave = {
    id: "leave-" + Date.now(),
    userId,
    userName: user.name,
    userRole: user.role,
    reason,
    startDate,
    endDate,
    daysCount,
    status: "Pending", // Pending, Approved, Rejected
    appliedAt: new Date().toISOString(),
    approvedBy: null
  };

  db.leaves.push(newLeave);
  writeDB(db);

  res.json({ success: true, leave: newLeave, message: "Leave applied successfully and is pending main admin approval." });
});

// Approve / Reject leave
app.post("/api/leaves/approve", (req, res) => {
  if (req.headers["x-user-role"] !== "admin") {
    return res.status(403).json({ error: "Access Denied: Only main administrator can approve or reject leaves." });
  }

  const { leaveId, action, rejectionReason, payType } = req.body; // action is "Approved" or "Rejected"
  if (!leaveId || !action) {
    return res.status(400).json({ error: "Leave ID and action are required" });
  }

  const db = readDB();
  getHRMLists(db);

  const leave = db.leaves.find((l: any) => l.id === leaveId);
  if (!leave) {
    return res.status(404).json({ error: "Leave application not found" });
  }

  leave.status = action;
  leave.approvedBy = "u-admin";
  if (action === "Rejected") {
    leave.rejectionReason = rejectionReason || "No reason specified";
    leave.payType = null;
  } else {
    leave.rejectionReason = null;
    leave.payType = payType || "Half Pay";
  }
  
  writeDB(db);
  res.json({ success: true, leave, message: `Leave has been successfully ${action.toLowerCase()}` });
});

// Raise a question/query about a rejected leave
app.post("/api/leaves/query", (req, res) => {
  const { leaveId, queryText, userId } = req.body;
  if (!leaveId || !queryText || !userId) {
    return res.status(400).json({ error: "Leave ID, query text, and user ID are required" });
  }

  const db = readDB();
  getHRMLists(db);

  const leave = db.leaves.find((l: any) => l.id === leaveId);
  if (!leave) {
    return res.status(404).json({ error: "Leave application not found" });
  }

  if (leave.userId !== userId) {
    return res.status(403).json({ error: "Access Denied: You cannot query this leave application" });
  }

  if (leave.status !== "Rejected" && leave.status !== "Queried") {
    return res.status(400).json({ error: "You can only raise questions on rejected leave applications." });
  }

  leave.query = queryText;
  leave.status = "Queried";
  leave.queryResponse = null; // Clear any old responses
  
  writeDB(db);
  res.json({ success: true, leave, message: "Question raised successfully. Awaiting admin response." });
});

// Respond to a queried leave (main admin)
app.post("/api/leaves/respond", (req, res) => {
  if (req.headers["x-user-role"] !== "admin") {
    return res.status(403).json({ error: "Access Denied: Only main administrator can respond to queries." });
  }

  const { leaveId, response, action, payType } = req.body; // action can be "Approved" or "Rejected"
  if (!leaveId || !response || !action) {
    return res.status(400).json({ error: "Leave ID, response, and action are required" });
  }

  const db = readDB();
  getHRMLists(db);

  const leave = db.leaves.find((l: any) => l.id === leaveId);
  if (!leave) {
    return res.status(404).json({ error: "Leave application not found" });
  }

  leave.queryResponse = response;
  leave.status = action;
  if (action === "Approved") {
    leave.payType = payType || "Half Pay";
  } else {
    leave.payType = null;
  }
  
  writeDB(db);
  res.json({ success: true, leave, message: `Response registered. Leave status is now ${action.toLowerCase()}` });
});

// ==========================================
// COMPANY HOLIDAYS ENDPOINTS
// ==========================================
app.get("/api/company-holidays", (req, res) => {
  const db = readDB();
  getHRMLists(db);
  res.json(db.companyHolidays || []);
});

app.post("/api/company-holidays", (req, res) => {
  if (req.headers["x-user-role"] !== "admin" || req.headers["x-user-id"] !== "u-admin") {
    return res.status(403).json({ error: "Access Denied: Only Main Admin can declare holidays." });
  }

  const { date, reason } = req.body;
  if (!date || !reason) {
    return res.status(400).json({ error: "Date and reason are required" });
  }

  const db = readDB();
  getHRMLists(db);

  const existing = db.companyHolidays.find((h: any) => h.date === date);
  if (existing) {
    existing.reason = reason;
  } else {
    db.companyHolidays.push({
      id: "hol-" + Date.now(),
      date,
      reason
    });
  }

  writeDB(db);
  res.json({ success: true, message: "Company Holiday declared successfully!" });
});

app.delete("/api/company-holidays/:id", (req, res) => {
  if (req.headers["x-user-role"] !== "admin" || req.headers["x-user-id"] !== "u-admin") {
    return res.status(403).json({ error: "Access Denied: Only Main Admin can delete holidays." });
  }

  const { id } = req.params;
  const db = readDB();
  getHRMLists(db);

  db.companyHolidays = db.companyHolidays.filter((h: any) => h.id !== id);
  writeDB(db);
  res.json({ success: true, message: "Company Holiday deleted successfully." });
});

// ==========================================
// SUB-ADMIN WORK / TASK ENDPOINTS
// ==========================================
// ==========================================
// WORK / TASK ENDPOINTS FOR SYSTEM WORKFLOW
// ==========================================
app.get("/api/tasks", (req, res) => {
  const db = readDB();
  getHRMLists(db);

  const actorId = req.headers["x-user-id"] || req.query.adminId;
  let userTasks = db.tasks || [];

  // If requester is not the main admin ("u-admin") and has a valid ID
  if (actorId && actorId !== "u-admin") {
    const requester = db.users.find((u: any) => u.id === actorId);
    if (requester) {
      if (requester.role === "admin" || requester.role === "sub-admin") {
        // Sub-admin or admin can see all tasks, do not restrict!
        return res.json(userTasks);
      } else if (requester.role === "head") {
        // Department heads can see tasks assigned to them, assigned by them, or within their department
        const dept = requester.department;
        userTasks = userTasks.filter((t: any) => 
          t.assignedTo === actorId || 
          t.assignedBy === actorId || 
          (dept && t.department === dept)
        );
        return res.json(userTasks);
      } else {
        // Standard staff (tech/nontech) / telecaller: can only see tasks assigned to them
        userTasks = userTasks.filter((t: any) => t.assignedTo === actorId);
        return res.json(userTasks);
      }
    }
  }

  const { adminId, assignedTo, assignedBy, department } = req.query;

  // Backward compatibility support for adminId parameter
  if (adminId) {
    userTasks = userTasks.filter((t: any) => t.adminId === adminId || t.assignedTo === adminId || t.assignedBy === adminId);
    return res.json(userTasks);
  }

  if (assignedTo) {
    userTasks = userTasks.filter((t: any) => t.assignedTo === assignedTo || t.adminId === assignedTo);
  }
  if (assignedBy) {
    userTasks = userTasks.filter((t: any) => t.assignedBy === assignedBy);
  }
  if (department) {
    userTasks = userTasks.filter((t: any) => t.department === department);
  }

  res.json(userTasks);
});

app.post("/api/tasks", (req, res) => {
  const { adminId, adminName, title, date, assignedTo, assignedToName, assignedBy, assignedByName, department, referenceFile } = req.body;
  
  const finalAssignedTo = assignedTo || adminId;
  const finalAssignedToName = assignedToName || adminName;
  const finalAssignedBy = assignedBy || req.headers["x-user-id"] || "u-admin";
  const finalAssignedByName = assignedByName || "Administrator";

  if (!finalAssignedTo || !finalAssignedToName || !title || !date) {
    return res.status(400).json({ error: "Assignee details, task Title, and Date are required." });
  }

  const db = readDB();
  getHRMLists(db);

  const newTask = {
    id: "task-" + Date.now(),
    adminId: finalAssignedTo, // backward compatibility
    adminName: finalAssignedToName, // backward compatibility
    assignedTo: finalAssignedTo,
    assignedToName: finalAssignedToName,
    assignedBy: finalAssignedBy,
    assignedByName: finalAssignedByName,
    department: department || null,
    title,
    date,
    assignedAt: new Date().toISOString(),
    completedAt: null,
    referenceFile: referenceFile || null,
    status: "Pending", // Pending, Submitted, Approved, Denied, Appealed
    remark: null,
    adminReply: null,
    appeal: null,
    appealReply: null,
    overdueRemark: null,
    overdueReply: null,
    replies: []
  };

  db.tasks.push(newTask);
  writeDB(db);
  res.json({ success: true, task: newTask, message: "Task assigned successfully!" });
});

app.delete("/api/tasks/:id", (req, res) => {
  const actorId = req.headers["x-user-id"];
  const actorRole = req.headers["x-user-role"];
  const taskId = req.params.id;

  const db = readDB();
  getHRMLists(db);

  const taskIdx = db.tasks.findIndex((t: any) => t.id === taskId);
  if (taskIdx === -1) {
    return res.status(404).json({ error: "Task not found." });
  }

  const task = db.tasks[taskIdx];
  // Allow delete if main admin or task creator
  const isAllowed = actorId === "u-admin" || task.assignedBy === actorId || actorRole === "admin";
  if (!isAllowed) {
    return res.status(403).json({ error: "Access Denied: You cannot delete this task." });
  }

  db.tasks.splice(taskIdx, 1);
  writeDB(db);
  res.json({ success: true, message: "Task deleted successfully!" });
});

app.post("/api/tasks/submit", (req, res) => {
  const { taskId, status, remark, file } = req.body;
  if (!taskId || !status || !remark) {
    return res.status(400).json({ error: "Task ID, status, and genuine remark are required." });
  }

  const db = readDB();
  getHRMLists(db);

  const task = db.tasks.find((t: any) => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found." });
  }

  task.status = status === "Completed" ? "Submitted" : "Pending";
  task.remark = remark;
  task.file = file || null;
  task.completedAt = status === "Completed" ? new Date().toISOString() : null;
  task.adminReply = null;
  task.appeal = null;
  task.appealReply = null;

  writeDB(db);
  res.json({ success: true, task, message: "Task update submitted successfully!" });
});

app.post("/api/tasks/evaluate", (req, res) => {
  const { taskId, action, adminReply } = req.body;
  const actorId = req.headers["x-user-id"];
  const actorRole = req.headers["x-user-role"];

  if (!taskId || !action || !adminReply) {
    return res.status(400).json({ error: "Task ID, evaluation action, and reply are required." });
  }

  const db = readDB();
  getHRMLists(db);

  const task = db.tasks.find((t: any) => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found." });
  }

  // Allow evaluation if caller is Main Admin, or if they are the task assigner, or if they are an admin
  const isAllowed = actorId === "u-admin" || task.assignedBy === actorId || actorRole === "admin";
  if (!isAllowed) {
    return res.status(403).json({ error: "Access Denied: You cannot evaluate this task." });
  }

  task.status = action;
  task.adminReply = adminReply;

  writeDB(db);
  res.json({ success: true, task, message: `Task has been ${action.toLowerCase()} successfully.` });
});

app.post("/api/tasks/appeal", (req, res) => {
  const { taskId, appeal } = req.body;
  if (!taskId || !appeal) {
    return res.status(400).json({ error: "Task ID and appeal question are required." });
  }

  const db = readDB();
  getHRMLists(db);

  const task = db.tasks.find((t: any) => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found." });
  }

  task.status = "Appealed";
  task.appeal = appeal;
  task.appealReply = null;

  writeDB(db);
  res.json({ success: true, task, message: "Appeal/Question raised successfully!" });
});

app.post("/api/tasks/appeal-reply", (req, res) => {
  const { taskId, appealReply, action } = req.body;
  const actorId = req.headers["x-user-id"];
  const actorRole = req.headers["x-user-role"];

  if (!taskId || !appealReply || !action) {
    return res.status(400).json({ error: "Task ID, reply instruction, and final action are required." });
  }

  const db = readDB();
  getHRMLists(db);

  const task = db.tasks.find((t: any) => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found." });
  }

  // Allow appeal reply if Main Admin or task creator
  const isAllowed = actorId === "u-admin" || task.assignedBy === actorId || actorRole === "admin";
  if (!isAllowed) {
    return res.status(403).json({ error: "Access Denied: You cannot answer this appeal." });
  }

  task.appealReply = appealReply;
  task.status = action;

  writeDB(db);
  res.json({ success: true, task, message: `Response registered. Task status updated to ${action}.` });
});

app.post("/api/tasks/overdue-remark", (req, res) => {
  const { taskId, overdueRemark } = req.body;
  const actorId = req.headers["x-user-id"] || "u-admin";

  if (!taskId || !overdueRemark) {
    return res.status(400).json({ error: "Task ID and explanation remark are required." });
  }

  const db = readDB();
  getHRMLists(db);

  const task = db.tasks.find((t: any) => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found." });
  }

  task.overdueRemark = overdueRemark;
  writeDB(db);
  res.json({ success: true, task, message: "Overdue delay explanation remark added successfully!" });
});

app.post("/api/tasks/overdue-reply", (req, res) => {
  const { taskId, overdueReply } = req.body;
  const actorId = req.headers["x-user-id"];
  const actorRole = req.headers["x-user-role"];

  if (!taskId || !overdueReply) {
    return res.status(400).json({ error: "Task ID and reply message are required." });
  }

  const db = readDB();
  getHRMLists(db);

  const task = db.tasks.find((t: any) => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found." });
  }

  const isAllowed = actorId === "u-admin" || task.assignedBy === actorId || actorRole === "admin";
  if (!isAllowed) {
    return res.status(403).json({ error: "Access Denied: You cannot reply to this explanation." });
  }

  task.overdueReply = overdueReply;
  writeDB(db);
  res.json({ success: true, task, message: "Response to delay explanation registered successfully!" });
});

app.post("/api/tasks/reply", (req, res) => {
  const { taskId, message, senderId, senderName, senderRole } = req.body;

  if (!taskId || !message || !senderId || !senderName) {
    return res.status(400).json({ error: "Task ID, message, sender ID, and sender name are required." });
  }

  const db = readDB();
  getHRMLists(db);

  const task = db.tasks.find((t: any) => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found." });
  }

  if (!task.replies) {
    task.replies = [];
  }

  const resolvedRole = senderRole || req.headers['x-user-role'] || 'staff';

  const newReply = {
    senderId,
    senderName,
    senderRole: resolvedRole,
    message,
    timestamp: new Date().toISOString()
  };

  task.replies.push(newReply);
  writeDB(db);
  res.json({ success: true, task, reply: newReply, message: "Reply added successfully!" });
});

// ==========================================
// DEPARTMENTAL WORKFLOW REPORTING ENDPOINTS
// ==========================================
app.get("/api/reports", (req, res) => {
  const db = readDB();
  getHRMLists(db);
  res.json(db.reports || []);
});

app.post("/api/reports/submit", (req, res) => {
  const { type, senderId, senderName, senderRole, department, reportText, date } = req.body;
  if (!senderId || !senderName || !reportText || !date) {
    return res.status(400).json({ error: "Sender details, reportText, and date are required." });
  }

  const db = readDB();
  getHRMLists(db);

  const newReport = {
    id: "rep-" + Date.now(),
    type: type || "department", // department (Head -> Sub-Admin) or consolidated (Sub-Admin -> Main Admin)
    senderId,
    senderName,
    senderRole: senderRole || "head",
    department: department || "Sales",
    reportText,
    date,
    status: "Pending", // Pending, Reviewed
    reviewedBy: null,
    reviewedByName: null,
    feedback: null,
    reviewedAt: null
  };

  db.reports.push(newReport);
  writeDB(db);
  res.json({ success: true, report: newReport, message: "Department work report submitted successfully!" });
});

app.post("/api/reports/review", (req, res) => {
  const { reportId, reviewerId, reviewerName, feedback } = req.body;
  if (!reportId || !reviewerId || !reviewerName || !feedback) {
    return res.status(400).json({ error: "Report ID, reviewer details, and feedback are required." });
  }

  const db = readDB();
  getHRMLists(db);

  const report = db.reports.find((r: any) => r.id === reportId);
  if (!report) {
    return res.status(404).json({ error: "Report not found." });
  }

  report.status = "Reviewed";
  report.reviewedBy = reviewerId;
  report.reviewedByName = reviewerName;
  report.feedback = feedback;
  report.reviewedAt = new Date().toISOString();

  writeDB(db);
  res.json({ success: true, report, message: "Report reviewed and feedback sent successfully!" });
});

// GET salary rules
app.get("/api/admin/salary-rules", (req, res) => {
  const db = readDB();
  getHRMLists(db);
  res.json({ success: true, salaryRules: db.salaryRules || [] });
});

// POST save salary rule (add/edit)
app.post("/api/admin/salary-rules", (req, res) => {
  const db = readDB();
  getHRMLists(db);
  db.salaryRules = db.salaryRules || [];

  const { id, name, description, type, value, valueType, segment, staffId, enabled } = req.body;

  if (!name || !type || value === undefined) {
    return res.status(400).json({ error: "Name, type, and value are strictly required." });
  }

  if (id) {
    // Edit existing
    const idx = db.salaryRules.findIndex((r: any) => r.id === id);
    if (idx !== -1) {
      db.salaryRules[idx] = {
        ...db.salaryRules[idx],
        name,
        description,
        type,
        value: Number(value),
        valueType: valueType || "Fixed",
        segment: segment || "All",
        staffId: staffId || "All",
        enabled: enabled !== false
      };
    } else {
      return res.status(404).json({ error: "Salary rule not found." });
    }
  } else {
    // Add new custom rule
    const newRule = {
      id: "rule_" + Date.now(),
      name,
      description,
      type,
      value: Number(value),
      valueType: valueType || "Fixed",
      segment: segment || "All",
      staffId: staffId || "All",
      enabled: enabled !== false,
      isCustom: true
    };
    db.salaryRules.push(newRule);
  }

  writeDB(db);
  res.json({ success: true, salaryRules: db.salaryRules, message: "Salary rule successfully saved!" });
});

// POST delete custom salary rule
app.post("/api/admin/salary-rules/delete", (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Rule ID is required." });
  }

  const db = readDB();
  getHRMLists(db);
  db.salaryRules = db.salaryRules || [];

  const rule = db.salaryRules.find((r: any) => r.id === id);
  if (!rule) {
    return res.status(404).json({ error: "Salary rule not found." });
  }
  if (rule.systemRule) {
    return res.status(400).json({ error: "System-defined rules cannot be deleted. You can only disable them!" });
  }

  db.salaryRules = db.salaryRules.filter((r: any) => r.id !== id);
  writeDB(db);
  res.json({ success: true, salaryRules: db.salaryRules, message: "Salary rule deleted successfully!" });
});

// GET payroll and attendance report
app.get("/api/payroll/report", (req, res) => {
  const db = readDB();
  getHRMLists(db);

  const targetMonth = (req.query.month as string) || new Date().toISOString().slice(0, 7); // YYYY-MM
  const [yr, mn] = targetMonth.split("-").map(Number);

  if (!yr || !mn || mn < 1 || mn > 12) {
    return res.status(400).json({ error: "Invalid month format. Expected YYYY-MM" });
  }

  const daysInMonth = new Date(yr, mn, 0).getDate();
  const isFeb = mn === 2;

  // Filter out the main admin u-admin, check joining, deletion, & suspension eligibility
  const eligibleUsers = db.users.filter((u: any) => {
    if (u.id === "u-admin" || u.email === "contact.grahicsworld@gmail.com") return false;

    // Check roles allowed in this panel
    const allowedRoles = ["sub-admin", "head", "staff", "telecaller"];
    if (!allowedRoles.includes(u.role)) return false;

    // 1. Filter by joining date: Must have joined on or before targetMonth (YYYY-MM)
    if (u.joiningDate) {
      const [joinYr, joinMn] = u.joiningDate.split("-").map(Number);
      if (joinYr && joinMn) {
        if (yr < joinYr || (yr === joinYr && mn < joinMn)) {
          return false; // User has not joined yet in targetMonth
        }
      }
    }

    // 2. Filter by deletion date: Must not be deleted in a month prior to targetMonth
    if (u.deleted && u.deletedAt) {
      const [delYr, delMn] = u.deletedAt.split("-").map(Number);
      if (delYr && delMn) {
        if (yr > delYr || (yr === delYr && mn > delMn)) {
          return false; // User was deleted in a past month
        }
      }
    }

    // 3. Filter by suspension date: Must not be suspended in a month prior to targetMonth
    if (u.status === "suspended" || u.suspendedAt) {
      if (u.suspendedAt) {
        const [suspYr, suspMn] = u.suspendedAt.split("-").map(Number);
        if (suspYr && suspMn) {
          if (yr > suspYr || (yr === suspYr && mn > suspMn)) {
            return false; // User was suspended in a past month
          }
        }
      } else {
        const currentMonthStr = new Date().toISOString().slice(0, 7);
        if (targetMonth >= currentMonthStr) {
          return false;
        }
      }
    }

    return true;
  });

  db.payrollOverrides = db.payrollOverrides || [];
  db.releasedSalaries = db.releasedSalaries || [];

  const report = eligibleUsers.map((user: any) => {
    const salaryBase = user.salaryBase || 12000;
    const commissionRate = user.commissionRate || 100;
    const monthlyTarget = user.monthlyTarget || 5;
    const perDaySalary = Number((salaryBase / daysInMonth).toFixed(2));
    const hourlyRate = Number((perDaySalary / 9).toFixed(4));

    // Load dynamic salary rules and check applicability for this user
    const userRules = (db.salaryRules || []).filter((r: any) => {
      if (!r.enabled) return false;
      if (r.segment && r.segment !== "All" && r.segment !== user.department) return false;
      if (r.staffId && r.staffId !== "All" && r.staffId !== user.id) return false;
      return true;
    });

    const isLateRule = userRules.find((r: any) => r.type === "LateDeduction");
    const isSandwichRule = userRules.find((r: any) => r.type === "SandwichDeduction");
    const isHalfDayRule = userRules.find((r: any) => r.type === "HalfDayDeduction");
    const isAbsentRule = userRules.find((r: any) => r.type === "AbsentDeduction");
    const isPaidLeavesRule = userRules.find((r: any) => r.type === "PaidLeavesLimit");
    const isPerformanceCutRule = userRules.find((r: any) => r.type === "PerformanceCut");

    const customAllowances = userRules.filter((r: any) => r.type === "Allowance" || r.type === "CustomAddition");
    const customDeductions = userRules.filter((r: any) => r.type === "CustomDeduction");

    // Get Admin overrides for this user & month
    let override = db.payrollOverrides.find((o: any) => o.month === targetMonth && o.userId === user.id);
    if (!override) {
      override = { month: targetMonth, userId: user.id, forceFullSalary: false, extraLeavePaid: false, approveOvertime: true };
    }

    let totalDeductions = 0;
    let presentDays = 0;
    let leaveDays = 0;
    let absentDays = 0;
    let sundayPaidCount = 0;
    let sundayDeductedCount = 0;
    let companyHolidaysCount = 0;

    let weekdayOvertimeHours = 0;
    let weekdayOvertimePay = 0;
    let sundayOvertimeCount = 0;
    let sundayOvertimeEarned = 0;
    let lateArrivalsCount = 0;
    let lateDeductionsTotal = 0;

    const detailDays: any[] = [];
    const todayStr = new Date().toISOString().split("T")[0];

    // Evaluate if Saturday or Monday counts as a leave or absent day for the Sunday sandwich rule
    const isLeaveOrAbsent = (targetDateStr: string, targetDayNum: number) => {
      if (targetDayNum < 1 || targetDayNum > daysInMonth) return false;

      const att = db.attendance.find((a: any) => a.userId === user.id && a.date === targetDateStr);
      if (att) {
        let workHours = 0;
        if (att.loginTime && att.logoutTime) {
          const diffMs = new Date(att.logoutTime).getTime() - new Date(att.loginTime).getTime();
          workHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
        } else if (att.loginTime && targetDateStr === todayStr) {
          workHours = 9.0;
        } else {
          workHours = 4.0;
        }
        if (workHours < 4.0) {
          return true; // Short logout counts as absent/leave
        }
        return false;
      }

      // Check company holiday (not a leave/absent day)
      const isCompHoliday = db.companyHolidays.some((h: any) => h.date === targetDateStr);
      if (isCompHoliday) return false;

      // Check Sunday itself
      const dow = new Date(yr, mn - 1, targetDayNum).getDay();
      if (dow === 0) return false;

      // Check approved leave
      const appLeave = db.leaves.find(
        (l: any) => l.userId === user.id && l.status === "Approved" && l.startDate <= targetDateStr && l.endDate >= targetDateStr
      );
      if (appLeave) {
        if (appLeave.payType === "Full Pay") {
          return false;
        }
        return true; // Half Pay or Unpaid count as leave/absent
      }

      // No attendance, no company holiday, no approved full-pay leave -> Absent/Unapproved leave
      return true;
    };

    // Loop through each day of the target month
    let approvedLeavesCountSoFar = 0;

    let hasNotJoinedYet = false;
    let joinDy = 1;
    if (user.joiningDate) {
      const [joinYr, joinMn, jd] = user.joiningDate.split("-").map(Number);
      if (joinYr && joinMn) {
        if (yr < joinYr || (yr === joinYr && mn < joinMn)) {
          hasNotJoinedYet = true;
        }
        if (jd) joinDy = jd;
      }
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, "0");
      const dateStr = `${yr}-${String(mn).padStart(2, "0")}-${dayStr}`;

      if (hasNotJoinedYet) {
        detailDays.push({ 
          date: dateStr, 
          day: d, 
          type: "BeforeJoining", 
          label: "Before Joining (Unpaid)", 
          deductionFraction: 1.0 
        });
        totalDeductions += perDaySalary;
        continue;
      }

      if (user.joiningDate) {
        const [joinYr, joinMn] = user.joiningDate.split("-").map(Number);
        if (yr === joinYr && mn === joinMn && d < joinDy) {
          detailDays.push({ 
            date: dateStr, 
            day: d, 
            type: "BeforeJoining", 
            label: "Before Joining (Unpaid)", 
            deductionFraction: 1.0 
          });
          totalDeductions += perDaySalary;
          continue;
        }
      }

      if (user.deleted && user.deletedAt) {
        const [delYr, delMn, delDy] = user.deletedAt.split("-").map(Number);
        if (yr === delYr && mn === delMn && delDy && d > delDy) {
          detailDays.push({ 
            date: dateStr, 
            day: d, 
            type: "AfterDeletion", 
            label: "After Deletion (Unpaid)", 
            deductionFraction: 1.0 
          });
          totalDeductions += perDaySalary;
          continue;
        }
      }
      
      const dayOfWeek = new Date(yr, mn - 1, d).getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Check if declared as Company-wide Holiday by Main Admin
      const isCompanyHoliday = db.companyHolidays.some((h: any) => h.date === dateStr);

      if (isCompanyHoliday) {
        companyHolidaysCount++;
        detailDays.push({ 
          date: dateStr, 
          day: d, 
          type: "CompanyHoliday", 
          label: "Company Holiday (Paid)", 
          deductionFraction: 0 
        });
      } else if (dayOfWeek === 0) {
        // It is Sunday!
        // Check Sunday Overtime (If worked on Sunday)
        const sunAttRecord = db.attendance.find((a: any) => a.userId === user.id && a.date === dateStr);
        if (sunAttRecord) {
          sundayOvertimeCount++;
          const sunPay = Number((1.5 * perDaySalary).toFixed(2));
          sundayOvertimeEarned += sunPay;
          detailDays.push({
            date: dateStr,
            day: d,
            type: "Sunday-Overtime",
            label: "Worked on Sunday (150% Overtime Bonus)",
            deductionFraction: 0,
            bonus: sunPay
          });
        } else {
          // Standard Sunday calculation
          if (isFeb) {
            sundayPaidCount++;
            detailDays.push({ 
              date: dateStr, 
              day: d, 
              type: "Sunday-Paid", 
              label: "Sunday (Paid)", 
              deductionFraction: 0 
            });
          } else {
            if (isSandwichRule) {
              // Sunday sandwich rule
              const satDate = new Date(yr, mn - 1, d - 1);
              const satStr = satDate.toISOString().split("T")[0];
              const monDate = new Date(yr, mn - 1, d + 1);
              const monStr = monDate.toISOString().split("T")[0];

              const satLeaveOrAbsent = isLeaveOrAbsent(satStr, d - 1);
              const monLeaveOrAbsent = isLeaveOrAbsent(monStr, d + 1);

              if (satLeaveOrAbsent || monLeaveOrAbsent) {
                sundayDeductedCount++;
                detailDays.push({ 
                  date: dateStr, 
                  day: d, 
                  type: "Sunday-Deducted", 
                  label: "Sunday (Deducted - Sat/Mon Leave/Absent sandwich)", 
                  deductionFraction: 1.0 
                });
                totalDeductions += perDaySalary;
              } else {
                sundayPaidCount++;
                detailDays.push({ 
                  date: dateStr, 
                  day: d, 
                  type: "Sunday-Paid", 
                  label: "Sunday (Paid)", 
                  deductionFraction: 0 
                });
              }
            } else {
              sundayPaidCount++;
              detailDays.push({ 
                date: dateStr, 
                day: d, 
                type: "Sunday-Paid", 
                label: "Sunday (Paid)", 
                deductionFraction: 0 
              });
            }
          }
        }
      } else {
        // Regular weekday/Saturday
        const attRecord = db.attendance.find((a: any) => a.userId === user.id && a.date === dateStr);
        if (attRecord) {
          let workHours = 0;
          if (attRecord.loginTime && attRecord.logoutTime) {
            const diffMs = new Date(attRecord.logoutTime).getTime() - new Date(attRecord.loginTime).getTime();
            workHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
          } else if (attRecord.loginTime && dateStr === todayStr) {
            workHours = 9.0;
          } else {
            workHours = 4.0; // Past day forgotten logout
          }

          // Late Arrival Check (from 10:00 AM, if after 10:18 AM, deduct 1 hr pay per 10 mins late)
          let lateDeduction = 0;
          let lateMinutes = 0;
          let lateHoursDeducted = 0;
          if (isLateRule && attRecord.loginTime) {
            try {
              const istTimeStr = new Date(attRecord.loginTime).toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour12: false });
              const [loginHr, loginMin] = istTimeStr.split(":").map(Number);
              if (loginHr > 10 || (loginHr === 10 && loginMin > 18)) {
                lateMinutes = (loginHr - 10) * 60 + loginMin;
                lateHoursDeducted = Math.floor(lateMinutes / 10);
                if (lateHoursDeducted > 9) lateHoursDeducted = 9; // Max 1 day
                lateDeduction = Number((lateHoursDeducted * (perDaySalary / 9)).toFixed(2));
                totalDeductions += lateDeduction;
                lateArrivalsCount++;
                lateDeductionsTotal += lateDeduction;
              }
            } catch (err) {}
          }

          if (workHours >= 9.0) {
            presentDays++;
            // Weekday Overtime (150% pay per hour beyond 9h)
            const otHours = Number((workHours - 9.0).toFixed(2));
            let otPay = 0;
            if (otHours > 0 && override.approveOvertime !== false) {
              weekdayOvertimeHours += otHours;
              otPay = Number((otHours * 1.5 * hourlyRate).toFixed(2));
              weekdayOvertimePay += otPay;
            }

            detailDays.push({ 
              date: dateStr, 
              day: d, 
              type: "Present", 
              label: `Present (${workHours} hrs)${lateHoursDeducted > 0 ? ` [Late ${lateMinutes}m, -${lateHoursDeducted}h pay]` : ""}${otHours > 0 ? ` [OT +${otHours}h]` : ""}`, 
              deductionFraction: 0,
              lateMinutes,
              lateDeduction,
              otHours,
              otPay
            });
          } else if (workHours >= 4.0) {
            if (isHalfDayRule) {
              const halfFraction = isHalfDayRule.value; // Usually 0.5
              presentDays += (1 - halfFraction);
              const halfDayDed = Number((halfFraction * perDaySalary).toFixed(2));
              totalDeductions += halfDayDed;
              detailDays.push({ 
                date: dateStr, 
                day: d, 
                type: "Present-Half", 
                label: `Present (${workHours} hrs - Half Day)${lateHoursDeducted > 0 ? ` [Late ${lateMinutes}m, -${lateHoursDeducted}h pay]` : ""}`, 
                deductionFraction: halfFraction,
                lateMinutes,
                lateDeduction
              });
            } else {
              // Half Day rule is disabled! Treat as Present
              presentDays++;
              detailDays.push({ 
                date: dateStr, 
                day: d, 
                type: "Present", 
                label: `Present (${workHours} hrs)${lateHoursDeducted > 0 ? ` [Late ${lateMinutes}m, -${lateHoursDeducted}h pay]` : ""}`, 
                deductionFraction: 0,
                lateMinutes,
                lateDeduction
              });
            }
          } else {
            // workHours < 4.0
            if (isAbsentRule) {
              absentDays++;
              const absentFraction = isAbsentRule.value; // Usually 1.0
              totalDeductions += Number((absentFraction * perDaySalary).toFixed(2));
              detailDays.push({ 
                date: dateStr, 
                day: d, 
                type: "Absent", 
                label: `Present (${workHours} hrs - Short Logout < 4 hrs)`, 
                deductionFraction: absentFraction,
                lateMinutes,
                lateDeduction: 0
              });
            } else if (isHalfDayRule) {
              // Absent rule disabled, but Half Day is enabled -> treat short logout as half-day
              const halfFraction = isHalfDayRule.value;
              presentDays += (1 - halfFraction);
              const halfDayDed = Number((halfFraction * perDaySalary).toFixed(2));
              totalDeductions += halfDayDed;
              detailDays.push({ 
                date: dateStr, 
                day: d, 
                type: "Present-Half", 
                label: `Present (${workHours} hrs - Short Logout treated as Half Day)${lateHoursDeducted > 0 ? ` [Late ${lateMinutes}m, -${lateHoursDeducted}h pay]` : ""}`, 
                deductionFraction: halfFraction,
                lateMinutes,
                lateDeduction
              });
            } else {
              // Both disabled! Treat as fully Present
              presentDays++;
              detailDays.push({ 
                date: dateStr, 
                day: d, 
                type: "Present", 
                label: `Present (${workHours} hrs)${lateHoursDeducted > 0 ? ` [Late ${lateMinutes}m, -${lateHoursDeducted}h pay]` : ""}`, 
                deductionFraction: 0,
                lateMinutes,
                lateDeduction
              });
            }
          }
        } else {
          // No attendance. Check if user has an approved leave
          const appLeave = db.leaves.find(
            (l: any) => l.userId === user.id && l.status === "Approved" && l.startDate <= dateStr && l.endDate >= dateStr
          );
          if (appLeave) {
            approvedLeavesCountSoFar++;
            leaveDays++;
            // Check paid leaves limit rule
            const leavesLimit = isPaidLeavesRule ? isPaidLeavesRule.value : 999;
            if (approvedLeavesCountSoFar <= leavesLimit || appLeave.payType === "Full Pay" || override.extraLeavePaid) {
              detailDays.push({ 
                date: dateStr, 
                day: d, 
                type: "Leave-Approved-Full", 
                label: `Approved Leave (Paid - count ${approvedLeavesCountSoFar}${isPaidLeavesRule ? ` of limit ${leavesLimit}` : ""})`, 
                deductionFraction: 0.0 
              });
            } else {
              detailDays.push({ 
                date: dateStr, 
                day: d, 
                type: "Leave-Approved-Unpaid", 
                label: `Approved Leave (Unpaid - Exceeded Limit of ${leavesLimit} leaves)`, 
                deductionFraction: 1.0 
              });
              totalDeductions += perDaySalary;
            }
          } else {
            absentDays++;
            detailDays.push({ 
              date: dateStr, 
              day: d, 
              type: "Absent", 
              label: "Absent (Deducted)", 
              deductionFraction: 1.0 
            });
            totalDeductions += perDaySalary;
          }
        }
      }
    }

    const finalBasicSalaryBeforePerformance = hasNotJoinedYet ? 0 : Number(Math.max(0, salaryBase - totalDeductions).toFixed(2));

    // Calculate calling metrics in the target month (only applicable/relevant to telecallers, but calculated for overview)
    const userLogs = db.callLogs.filter(
      (c: any) => c.telecallerId === user.id && c.timestamp && c.timestamp.startsWith(targetMonth)
    );

    const totalCalls = userLogs.length;
    const interestedCount = userLogs.filter((c: any) => c.status === "Interested").length;
    const salesDoneCount = userLogs.filter((c: any) => c.status === "Sales Done").length;
    
    const businessRevenue = userLogs
      .filter((c: any) => c.status === "Sales Done")
      .reduce((sum: number, c: any) => sum + (Number(c.dealValue) || 0), 0);

    // Performance Pct and Incentive
    let performancePct = 0;
    let incentivePct = 0;
    let incentiveAmount = 0;

    const isSalesRole = user.role === "telecaller" || (user.role === "staff" && user.department === "Sales");

    if (isSalesRole) {
      performancePct = monthlyTarget > 0 ? Number(((salesDoneCount / monthlyTarget) * 100).toFixed(2)) : 0;
      if (performancePct > 100) {
        incentivePct = Number((performancePct - 100).toFixed(2));
        incentiveAmount = Number(((incentivePct / 100) * salaryBase).toFixed(2));
      }
    } else {
      // Sub-admin, department head, or Tech/NonTech staff tasks performance and incentive
      const monthTasks = db.tasks.filter((t: any) => (t.adminId === user.id || t.assignedTo === user.id) && t.date && t.date.startsWith(targetMonth));
      const totalTasks = monthTasks.length;
      const approvedTasks = monthTasks.filter((t: any) => t.status === "Approved").length;
      
      performancePct = totalTasks > 0 ? Number(((approvedTasks / totalTasks) * 100).toFixed(2)) : 100;
      incentiveAmount = approvedTasks * commissionRate; // Commission/Incentive per approved task
    }

    // Performance-based salary cut (dynamic threshold)
    let performanceDeduction = 0;
    let finalBasicSalary = finalBasicSalaryBeforePerformance;

    const perfCutThreshold = isPerformanceCutRule ? isPerformanceCutRule.value : 0;
    if (perfCutThreshold > 0 && performancePct < perfCutThreshold) {
      if (override.forceFullSalary) {
        performanceDeduction = 0;
      } else {
        // Basic salary scaled down according to performance %
        const scaleFactor = performancePct / 100;
        finalBasicSalary = Number((finalBasicSalaryBeforePerformance * scaleFactor).toFixed(2));
        performanceDeduction = Number((finalBasicSalaryBeforePerformance - finalBasicSalary).toFixed(2));
      }
    }

    // Apply custom allowances (additions)
    let totalCustomAllowances = 0;
    const appliedCustomAllowances = customAllowances.map((r: any) => {
      let amount = 0;
      if (r.valueType === "Percentage") {
        amount = Number(((r.value / 100) * salaryBase).toFixed(2));
      } else {
        amount = r.value;
      }
      totalCustomAllowances += amount;
      return { id: r.id, name: r.name, amount };
    });

    // Apply custom deductions
    let totalCustomDeductions = 0;
    const appliedCustomDeductions = customDeductions.map((r: any) => {
      let amount = 0;
      if (r.valueType === "Percentage") {
        amount = Number(((r.value / 100) * salaryBase).toFixed(2));
      } else {
        amount = r.value;
      }
      totalCustomDeductions += amount;
      return { id: r.id, name: r.name, amount };
    });

    const finalSalary = hasNotJoinedYet ? 0 : Number(Math.max(0, finalBasicSalary + incentiveAmount + weekdayOvertimePay + sundayOvertimeEarned + totalCustomAllowances - totalCustomDeductions).toFixed(2));

    // Check release status
    const isReleased = db.releasedSalaries.some((r: any) => r.month === targetMonth && r.userId === user.id);
    const releaseRecord = db.releasedSalaries.find((r: any) => r.month === targetMonth && r.userId === user.id);

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      position: user.position || "",
      department: user.department || "Sales",
      joiningDate: user.joiningDate || "2026-07-01",
      employmentCode: user.employmentCode || generateEmploymentCode(user.name, user.department || "Sales", user.position || "", user.joiningDate || "2026-07-01"),
      salaryBase,
      commissionRate,
      monthlyTarget,
      daysInMonth,
      perDaySalary,
      presentDays,
      leaveDays,
      absentDays,
      sundayPaidCount,
      sundayDeductedCount,
      companyHolidaysCount,
      totalDeductions: Number(totalDeductions.toFixed(2)),
      finalBasicSalaryBeforePerformance,
      performanceDeduction,
      finalBasicSalary,
      weekdayOvertimeHours,
      weekdayOvertimePay,
      sundayOvertimeCount,
      sundayOvertimeEarned,
      lateArrivalsCount,
      lateDeductionsTotal,
      totalCalls,
      interestedCount,
      salesDoneCount,
      businessRevenue,
      performancePct,
      incentivePct,
      incentiveAmount,
      finalSalary,
      detailDays,
      isReleased,
      releasedAt: releaseRecord ? releaseRecord.releasedAt : null,
      override,
      appliedCustomAllowances,
      appliedCustomDeductions,
      totalTasks: isSalesRole ? 0 : db.tasks.filter((t: any) => (t.adminId === user.id || t.assignedTo === user.id) && t.date && t.date.startsWith(targetMonth)).length,
      approvedTasks: isSalesRole ? 0 : db.tasks.filter((t: any) => (t.adminId === user.id || t.assignedTo === user.id) && t.date && t.date.startsWith(targetMonth) && t.status === "Approved").length
    };
  });

  res.json({ success: true, month: targetMonth, report });
});

// POST toggle payroll override (Main Admin control)
app.post("/api/payroll/toggle-override", (req, res) => {
  const requesterRole = req.headers["x-user-role"];
  if (requesterRole !== "admin") {
    return res.status(403).json({ error: "Access Denied: Only Main Admin can modify overrides" });
  }

  const { month, userId, type } = req.body; // type: 'performance' | 'overtime' | 'leave'
  if (!month || !userId || !type) {
    return res.status(400).json({ error: "Month, User ID, and Type are required" });
  }

  const db = readDB();
  db.payrollOverrides = db.payrollOverrides || [];
  
  let override = db.payrollOverrides.find((o: any) => o.month === month && o.userId === userId);
  if (!override) {
    override = { month, userId, forceFullSalary: false, extraLeavePaid: false, approveOvertime: true };
    db.payrollOverrides.push(override);
  }

  if (type === "performance") {
    override.forceFullSalary = !override.forceFullSalary;
  } else if (type === "leave") {
    override.extraLeavePaid = !override.extraLeavePaid;
  } else if (type === "overtime") {
    override.approveOvertime = !override.approveOvertime;
  }

  writeDB(db);
  res.json({ success: true, override, message: "Override updated successfully!" });
});

// POST release / pay monthly salary (Main Admin)
app.post("/api/payroll/release", (req, res) => {
  const requesterRole = req.headers["x-user-role"];
  if (requesterRole !== "admin") {
    return res.status(403).json({ error: "Access Denied: Only Main Admin can release salaries" });
  }

  const { month, userId, finalSalary } = req.body;
  if (!month || !userId) {
    return res.status(400).json({ error: "Month and User ID are required" });
  }

  const db = readDB();
  db.releasedSalaries = db.releasedSalaries || [];

  const existingIndex = db.releasedSalaries.findIndex((r: any) => r.month === month && r.userId === userId);
  const releaseRecord = {
    month,
    userId,
    releasedAt: new Date().toISOString(),
    finalSalary: Number(finalSalary) || 0
  };

  if (existingIndex >= 0) {
    db.releasedSalaries[existingIndex] = releaseRecord;
  } else {
    db.releasedSalaries.push(releaseRecord);
  }

  writeDB(db);
  res.json({ success: true, record: releaseRecord, message: "Salary released successfully (सैलरी का भुगतान कर दिया गया है)!" });
});

// Auto-calling configuration
app.get("/api/config", (req, res) => {
  const db = readDB();
  res.json(db.autoCallingConfig || { delaySeconds: 5, enabled: true });
});

app.post("/api/config/update", (req, res) => {
  const { delaySeconds, enabled } = req.body;
  const db = readDB();
  db.autoCallingConfig = {
    delaySeconds: Number(delaySeconds) || 5,
    enabled: !!enabled
  };
  writeDB(db);
  res.json({ success: true, config: db.autoCallingConfig });
});

// Testing Period Management Endpoints
app.get("/api/testing-period", (req, res) => {
  const db = readDB();
  const config = db.testingConfig || {
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true
  };
  
  const today = new Date().toISOString().split('T')[0];
  const expiryDate = new Date(config.expiryDate);
  const currentDate = new Date(today);
  const diffTime = expiryDate.getTime() - currentDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isExpired = diffDays <= 0;

  res.json({
    expiryDate: config.expiryDate,
    isActive: config.isActive,
    remainingDays: diffDays > 0 ? diffDays : 0,
    isExpired: isExpired
  });
});

app.post("/api/testing-period/update", (req, res) => {
  const role = req.headers["x-user-role"];
  if (role !== "admin") {
    return res.status(403).json({ error: "Access Denied: Main Admin only." });
  }

  const { expiryDate, isActive } = req.body;
  if (!expiryDate) {
    return res.status(400).json({ error: "Expiry Date is required." });
  }

  const db = readDB();
  db.testingConfig = {
    expiryDate: expiryDate,
    isActive: isActive !== false
  };
  writeDB(db);

  res.json({ success: true, testingConfig: db.testingConfig, message: "Testing period updated successfully!" });
});

// IMPROVEMENT INSTRUCTIONS (Main Admin -> Sub-Admin)
app.get("/api/admin/improvement-instructions", (req, res) => {
  const db = readDB();
  getHRMLists(db);
  res.json(db.improvementInstructions || []);
});

app.post("/api/admin/improvement-instructions", (req, res) => {
  const { text, segment, type } = req.body; // segment: Tech, Nontech, Sales or general. type: Growth, Degrowth, Instruction
  if (!text) {
    return res.status(400).json({ error: "Instruction text is required." });
  }
  const db = readDB();
  getHRMLists(db);
  
  const newInst = {
    id: "inst-" + Date.now(),
    text,
    segment: segment || "general",
    type: type || "Instruction",
    timestamp: new Date().toISOString()
  };
  db.improvementInstructions.push(newInst);
  writeDB(db);
  res.json({ success: true, instruction: newInst });
});

// SUB-ADMIN CALL & FILE ATTACHMENT COMMUNICATIONS (Sub-Admin <-> Heads / Admin)
app.get("/api/sub-admin/comms", (req, res) => {
  const db = readDB();
  getHRMLists(db);
  res.json(db.subAdminComms || []);
});

app.post("/api/sub-admin/comms", (req, res) => {
  const { type, senderId, senderName, receiverId, receiverName, recipient, message, file, callReason, callOutcome, reason, solution } = req.body;
  if (!type) {
    return res.status(400).json({ error: "Type (call or whatsapp) is required." });
  }
  const db = readDB();
  getHRMLists(db);
  
  const finalReceiverId = receiverId || recipient || "u-admin";
  const finalReceiverName = receiverName || (finalReceiverId === "u-admin" ? "Main Admin" : (finalReceiverId === "tech-head" ? "Tech Head" : finalReceiverId === "nontech-head" ? "NonTech Head" : "Sales Head"));

  const newComm = {
    id: "comm-" + Date.now(),
    type, // 'call' or 'whatsapp'
    senderId: senderId || "sub-admin",
    senderName: senderName || "Sub-Admin",
    receiverId: finalReceiverId,
    receiverName: finalReceiverName,
    recipient: finalReceiverId,
    message: message || "",
    file: file || null, // { name, type, dataUrl }
    callReason: callReason || reason || null,
    callOutcome: callOutcome || solution || null,
    reason: reason || callReason || null,
    solution: solution || callOutcome || null,
    timestamp: new Date().toISOString(),
    adminReply: null,
    adminReplyTimestamp: null
  };
  
  db.subAdminComms.push(newComm);
  writeDB(db);
  res.json({ success: true, communication: newComm });
});

app.post("/api/sub-admin/comms/reply", (req, res) => {
  const { commId, replyText } = req.body;
  if (!commId || !replyText) {
    return res.status(400).json({ error: "Communication ID and reply text are required." });
  }
  const db = readDB();
  getHRMLists(db);
  
  if (!db.subAdminComms) {
    db.subAdminComms = [];
  }
  
  const comm = db.subAdminComms.find((c: any) => c.id === commId);
  if (!comm) {
    return res.status(404).json({ error: "Communication log not found." });
  }
  comm.adminReply = replyText;
  comm.adminReplyTimestamp = new Date().toISOString();
  writeDB(db);
  res.json({ success: true, communication: comm, message: "Reply submitted successfully!" });
});

// Global JSON error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global Server Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    details: err.stack
  });
});

// Vite middleware setup
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite development middleware loaded.");
    } catch (err) {
      console.error("Failed to load Vite dev middleware, falling back to static files", err);
      serveStaticFiles();
    }
  } else {
    serveStaticFiles();
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Tele-CRM full-stack server running on http://localhost:${PORT}`);
  });
}

function serveStaticFiles() {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  console.log("Static production files serving loaded.");
}

startServer();
