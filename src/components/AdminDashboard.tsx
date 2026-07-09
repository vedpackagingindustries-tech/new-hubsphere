import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, Upload, Database, Disc, Key, 
  DollarSign, HardDrive, Settings, LogOut, CheckCircle, 
  Trash2, Plus, Play, Pause, RefreshCw, ChevronRight, UserPlus, Shield, Lock, X, MapPin, Compass,
  Briefcase, Calendar, Clock, Clipboard, FileText, Phone, Send, MessageSquare
} from 'lucide-react';
import { 
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { User, Lead, CallLog, SupportTicket } from '../types';

interface AdminDashboardProps {
  user: { 
    id: string; 
    name: string; 
    email: string; 
    role: 'admin' | 'sub-admin' | 'head' | 'staff' | 'telecaller';
    department?: 'Tech' | 'NonTech' | 'Sales';
    phone?: string;
    whatsapp?: string;
    position?: string;
  };
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  // Mount protection: Strictly block telecallers/unauthorized staff from operating the Admin/Head Panel
  if (user.role !== 'admin' && user.role !== 'sub-admin' && user.role !== 'head') {
    onLogout();
    return null;
  }

  const isTabAllowed = (tab: string) => {
    if (user.role === 'admin') return true;
    if (user.role === 'sub-admin') {
      // All authority under Main Admin, hide backups/autocall setup
      if (['backups', 'autocall'].includes(tab)) return false;
      return true;
    }
    if (user.role === 'head') {
      // Department Heads don't access backups, resets, or autocall setups
      if (['backups', 'resets', 'autocall'].includes(tab)) return false;
      // Tech and NonTech department staff do different work, so hide calling segments
      if (user.department !== 'Sales') {
        if (['leads', 'upload', 'recordings'].includes(tab)) return false;
      }
      return true;
    }
    return false;
  };

  const [activeTab, setActiveTab] = useState<'analytics' | 'telecallers' | 'upload' | 'leads' | 'recordings' | 'resets' | 'payroll' | 'backups' | 'autocall' | 'support' | 'hrm'>('analytics');

  useEffect(() => {
    if (!isTabAllowed(activeTab)) {
      setActiveTab('analytics');
    }
  }, [activeTab, user.role, user.department]);
  
  // Data State
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [editingFullUser, setEditingFullUser] = useState<any | null>(null);
  const [telecallers, setTelecallers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [autoCallDelay, setAutoCallDelay] = useState<number>(5);
  const [autoCallEnabled, setAutoCallEnabled] = useState<boolean>(true);

  // Testing Period Expiry states
  const [testingExpiryDate, setTestingExpiryDate] = useState<string>('');
  const [testingActive, setTestingActive] = useState<boolean>(true);
  const [testingRemainingDays, setTestingRemainingDays] = useState<number>(0);

  // Emergency Recovery Security config states
  const [securityQuestion, setSecurityQuestion] = useState("elephant ke kitne daatt hote hai");
  const [securityAnswer, setSecurityAnswer] = useState("0000");
  const [adminBackupEmail, setAdminBackupEmail] = useState("contact.grahicsworld@gmail.com");
  const [alertWhatsapp, setAlertWhatsapp] = useState("9301056006");
  const [alertEmail, setAlertEmail] = useState("ipgroup2002@gmail.com");
  const [saveSecurityMessage, setSaveSecurityMessage] = useState("");
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

  // HRM Management States
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [leaveApplications, setLeaveApplications] = useState<any[]>([]);
  const [payrollReport, setPayrollReport] = useState<any[]>([]);
  const [selectedPayrollMonth, setSelectedPayrollMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedSlipUser, setSelectedSlipUser] = useState<any | null>(null);
  const [hrmSubTab, setHrmSubTab] = useState<'leaves' | 'attendance' | 'payroll_audit' | 'tasks' | 'holidays' | 'salary_rules'>('leaves');
  const [salaryRules, setSalaryRules] = useState<any[]>([]);
  const [isRulesLoading, setIsRulesLoading] = useState(false);
  const [isSavingRule, setIsSavingRule] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);
  
  // Rule Form States
  const [ruleName, setRuleName] = useState("");
  const [ruleDescription, setRuleDescription] = useState("");
  const [ruleType, setRuleType] = useState("Allowance"); // Default to Custom Addition
  const [ruleValue, setRuleValue] = useState("");
  const [ruleValueType, setRuleValueType] = useState("Fixed"); // Fixed or Percentage
  const [ruleSegment, setRuleSegment] = useState("All"); // All or specific department
  const [ruleStaffId, setRuleStaffId] = useState("All"); // All or specific staff
  const [leaveStartDate, setLeaveStartDate] = useState<string>('');
  const [leaveEndDate, setLeaveEndDate] = useState<string>('');
  const [leaveReason, setLeaveReason] = useState<string>('');

  // State for Company Holidays
  const [companyHolidays, setCompanyHolidays] = useState<any[]>([]);
  const [holidayDate, setHolidayDate] = useState<string>('');
  const [holidayReason, setHolidayReason] = useState<string>('');

  // State for Tasks
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskAssigneeId, setTaskAssigneeId] = useState<string>('');
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskDate, setTaskDate] = useState<string>('');
  const [taskReferenceFile, setTaskReferenceFile] = useState<{ name: string; type: string; size: number; data: string } | null>(null);
  const [taskReferenceUploadError, setTaskReferenceUploadError] = useState<string | null>(null);

  // Sub-admin submission / edit states
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);
  const [submitTaskRemark, setSubmitTaskRemark] = useState<string>('');
  const [submitTaskStatus, setSubmitTaskStatus] = useState<'Completed' | 'Pending'>('Completed');
  const [submitTaskFile, setSubmitTaskFile] = useState<{ name: string; type: string; size: number; data: string } | null>(null);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);

  // Admin evaluation state
  const [evaluatingTaskId, setEvaluatingTaskId] = useState<string | null>(null);
  const [evaluateAction, setEvaluateAction] = useState<'Approved' | 'Denied'>('Approved');
  const [evaluateFeedback, setEvaluateFeedback] = useState<string>('');

  // Sub-admin appeal states
  const [appealingTaskId, setAppealingTaskId] = useState<string | null>(null);
  const [appealText, setAppealText] = useState<string>('');

  // Admin appeal response states
  const [respondingAppealTaskId, setRespondingAppealTaskId] = useState<string | null>(null);
  const [appealReplyText, setAppealReplyText] = useState<string>('');
  const [appealReplyAction, setAppealReplyAction] = useState<'Approved' | 'Denied'>('Approved');

  // Task discussion / reply states
  const [expandedChatTaskId, setExpandedChatTaskId] = useState<string | null>(null);
  const [newReplyMessage, setNewReplyMessage] = useState<string>('');
  const [respondingOverdueTaskId, setRespondingOverdueTaskId] = useState<string | null>(null);
  const [overdueReplyText, setOverdueReplyText] = useState<string>('');

  // Custom states for Main Admin Interactive Analytics & Sub-Admin workspace
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'day' | 'month' | 'year'>('day');
  const [improvementText, setImprovementText] = useState('');
  const [improvementSegment, setImprovementSegment] = useState<'Tech' | 'NonTech' | 'Sales' | 'general'>('general');
  const [improvementType, setImprovementType] = useState<'Instruction' | 'Growth' | 'Degrowth'>('Instruction');
  const [improvementInstructions, setImprovementInstructions] = useState<any[]>([]);
  
  const [subAdminComms, setSubAdminComms] = useState<any[]>([]);
  const [commReplyTexts, setCommReplyTexts] = useState<{[key: string]: string}>({});
  const [whatsappRecipient, setWhatsappRecipient] = useState<string>('u-admin');
  const [whatsappMsgText, setWhatsappMsgText] = useState<string>('');
  const [whatsappAttachedFile, setWhatsappAttachedFile] = useState<{name: string, type: string, dataUrl: string} | null>(null);
  const [callRecipient, setCallRecipient] = useState<string>('u-admin');
  const [callReason, setCallReason] = useState<string>('');
  const [callOutcome, setCallOutcome] = useState<string>('');
  const [isSubmittingComm, setIsSubmittingComm] = useState<boolean>(false);

  // Leave Rejection & Response States
  const [rejectionModalLeaveId, setRejectionModalLeaveId] = useState<string | null>(null);
  const [rejectionInputReason, setRejectionInputReason] = useState<string>('');
  const [queryResponseLeaveId, setQueryResponseLeaveId] = useState<string | null>(null);
  const [queryResponseText, setQueryResponseText] = useState<string>('');
  const [queryResponseAction, setQueryResponseAction] = useState<'Approved' | 'Rejected'>('Approved');
  const [queryResponsePayType, setQueryResponsePayType] = useState<string>('Half Pay');
  
  // Form States
  const [singleLead, setSingleLead] = useState({ name: '', phone: '', whatsapp: '', email: '', requirements: '', assignedTo: '' });
  const [csvContent, setCsvContent] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [bulkAssignUser, setBulkAssignUser] = useState('');
  
  // User Management Forms
  const [editingUserRates, setEditingUserRates] = useState<string | null>(null);
  const [newRates, setNewRates] = useState({ salaryBase: 12000, commissionRate: 100, monthlyTarget: 5 });
  const [pwdResetUser, setPwdResetUser] = useState('');
  const [newPwd, setNewPwd] = useState('');

  // Password recovery resolving dictionary state
  const [resolvePasswords, setResolvePasswords] = useState<Record<string, string>>({});

  // Add Staff & Admin Form States
  const [addStaffName, setAddStaffName] = useState('');
  const [addStaffEmail, setAddStaffEmail] = useState('');
  const [addStaffPhone, setAddStaffPhone] = useState('');
  const [addStaffWhatsapp, setAddStaffWhatsapp] = useState('');
  const [addStaffPosition, setAddStaffPosition] = useState('');
  const [addStaffPassword, setAddStaffPassword] = useState('');
  const [addStaffRole, setAddStaffRole] = useState<'admin' | 'sub-admin' | 'head' | 'staff' | 'telecaller'>('staff');
  const [addStaffSegment, setAddStaffSegment] = useState<'Tech' | 'NonTech' | 'Sales'>('Sales');
  const [addStaffSalary, setAddStaffSalary] = useState<number>(15000);
  const [addStaffCommission, setAddStaffCommission] = useState<number>(100);
  const [addStaffTarget, setAddStaffTarget] = useState<number>(5);
  const [addStaffDailyWork, setAddStaffDailyWork] = useState('');
  const [addStaffJoiningDate, setAddStaffJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [addStaffEmploymentCode, setAddStaffEmploymentCode] = useState('');

  useEffect(() => {
    const firstWord = (addStaffName || '').trim().split(/\s+/)[0] || 'Staff';
    const computedDept = addStaffRole === 'sub-admin' ? 'All' : (addStaffRole === 'telecaller' ? 'Sales' : addStaffSegment);
    const post = addStaffPosition || 'Employee';
    
    let dateFormatted = '07/07/2026';
    if (addStaffJoiningDate) {
      const parts = addStaffJoiningDate.split('-');
      if (parts.length === 3) {
        dateFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    const cleanWord = (w: string) => w.replace(/[\/\s]/g, '');
    const code = `${cleanWord(firstWord)}/${cleanWord(computedDept)}/${cleanWord(post)}/${dateFormatted}`;
    setAddStaffEmploymentCode(code);
  }, [addStaffName, addStaffRole, addStaffSegment, addStaffPosition, addStaffJoiningDate]);

  useEffect(() => {
    if (editingFullUser) {
      const firstWord = (editingFullUser.name || '').trim().split(/\s+/)[0] || 'Staff';
      const computedDept = editingFullUser.role === 'sub-admin' ? 'All' : (editingFullUser.role === 'telecaller' ? 'Sales' : editingFullUser.department);
      const post = editingFullUser.position || 'Employee';
      
      let dateFormatted = '07/07/2026';
      if (editingFullUser.joiningDate) {
        const parts = editingFullUser.joiningDate.split('-');
        if (parts.length === 3) {
          dateFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }
      const cleanWord = (w: string) => w.replace(/[\/\s]/g, '');
      const code = `${cleanWord(firstWord)}/${cleanWord(computedDept)}/${cleanWord(post)}/${dateFormatted}`;
      
      if (editingFullUser.employmentCode !== code) {
        setEditingFullUser((prev: any) => prev ? { ...prev, employmentCode: code } : null);
      }
    }
  }, [editingFullUser?.name, editingFullUser?.role, editingFullUser?.department, editingFullUser?.position, editingFullUser?.joiningDate]);

  const isCommAndTargetDisabled = 
    addStaffRole === 'sub-admin' || 
    addStaffRole === 'admin' ||
    ((addStaffRole === 'head' || addStaffRole === 'staff') && (addStaffSegment === 'Tech' || addStaffSegment === 'NonTech'));

  const isEditingCommAndTargetDisabled = editingFullUser ? (
    editingFullUser.role === 'sub-admin' ||
    editingFullUser.role === 'admin' ||
    ((editingFullUser.role === 'head' || editingFullUser.role === 'staff') && (editingFullUser.department === 'Tech' || editingFullUser.department === 'NonTech'))
  ) : false;

  // Staff Directory Search/Filter states
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffSegmentFilter, setStaffSegmentFilter] = useState<'All' | 'Tech' | 'NonTech' | 'Sales'>('All');

  // Main Admin profile fields
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileWhatsapp, setProfileWhatsapp] = useState('');

  // Password Recovery Requests State
  const [recoveryRequests, setRecoveryRequests] = useState<any[]>([]);

  // Login GPS Authority Requests State
  const [loginAuthorityRequests, setLoginAuthorityRequests] = useState<any[]>([]);

  // Lead Journey Tracker State
  const [viewingJourneyLead, setViewingJourneyLead] = useState<Lead | null>(null);

  // Audio Playback State
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Custom Confirmation Modal State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const existingSubAdminUser = allUsers.find(u => u.role === 'sub-admin' || (u.role === 'admin' && u.id !== 'u-admin'));
  const isSubAdminCreated = !!existingSubAdminUser;
  const canSelectSubAdminInEdit = !isSubAdminCreated || (existingSubAdminUser && editingFullUser && existingSubAdminUser.id === editingFullUser.id);

  const techHeads = allUsers.filter(u => u.role === 'head' && u.department === 'Tech' && u.status !== 'inactive');
  const nonTechHeads = allUsers.filter(u => u.role === 'head' && u.department === 'NonTech' && u.status !== 'inactive');
  const salesHeads = allUsers.filter(u => u.role === 'head' && u.department === 'Sales' && u.status !== 'inactive');

  const isTechHeadCreated = techHeads.length > 0;
  const isNonTechHeadCreated = nonTechHeads.length > 0;
  const isSalesHeadCreated = salesHeads.length > 0;

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  // Feedback State
  const [statusMessage, setStatusMessage] = useState({ text: '', type: 'success' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load All CRM Data from Backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, leadsRes, callsRes, supportRes, backupsRes, configRes] = await Promise.all([
          fetch('/api/users', { headers: { 'x-user-role': user.role, 'x-user-id': user.id } }),
          fetch('/api/leads', { headers: { 'x-user-role': user.role, 'x-user-id': user.id } }),
          fetch('/api/calls', { headers: { 'x-user-role': user.role, 'x-user-id': user.id } }),
          fetch('/api/support', { headers: { 'x-user-role': user.role, 'x-user-id': user.id } }),
          fetch('/api/backups', { headers: { 'x-user-role': user.role, 'x-user-id': user.id } }),
          fetch('/api/config', { headers: { 'x-user-role': user.role, 'x-user-id': user.id } })
        ]);

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setAllUsers(usersData);
          
          let filteredCallers = usersData.filter((u: any) => u.role === 'telecaller' || u.role === 'staff');
          let filteredAdmins = usersData.filter((u: any) => u.role === 'admin' || u.role === 'sub-admin' || u.role === 'head');
          
          if (user.role === 'head' && user.department) {
            filteredCallers = filteredCallers.filter((u: any) => u.department === user.department);
            filteredAdmins = filteredAdmins.filter((u: any) => u.department === user.department || u.id === 'u-admin');
          }
          
          setTelecallers(filteredCallers);
          setAdmins(filteredAdmins);
        }
        if (leadsRes.ok) setLeads(await leadsRes.json());
        if (callsRes.ok) setCallLogs(await callsRes.json());
        if (supportRes.ok) setSupportTickets(await supportRes.json());
        if (backupsRes.ok) setBackups(await backupsRes.json());
        if (configRes.ok) {
          const cfg = await configRes.json();
          setAutoCallDelay(cfg.delaySeconds || 5);
          setAutoCallEnabled(cfg.enabled !== false);
        }

        // Fetch testing period details
        try {
          const testingRes = await fetch('/api/testing-period');
          if (testingRes.ok) {
            const tData = await testingRes.json();
            setTestingExpiryDate(tData.expiryDate || '');
            setTestingActive(tData.isActive !== false);
            setTestingRemainingDays(tData.remainingDays || 0);
          }
        } catch (err) {
          console.error("Failed to load testing period inside admin dashboard", err);
        }

        // Fetch recovery requests if authorized
        if (user.role === 'admin' || user.role === 'sub-admin' || user.role === 'head') {
          const recRes = await fetch('/api/auth/recovery-requests', { headers: { 'x-user-role': user.role, 'x-user-id': user.id } });
          if (recRes.ok) {
            setRecoveryRequests(await recRes.json());
          }
        }

        // Fetch login GPS authority requests if authorized (Admin and Sub-Admin)
        if (user.role === 'admin' || user.role === 'sub-admin') {
          const gpsAuthRes = await fetch('/api/admin/login-authority-requests');
          if (gpsAuthRes.ok) {
            const gpsData = await gpsAuthRes.json();
            if (gpsData.success) {
              setLoginAuthorityRequests(gpsData.requests || []);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch CRM data', err);
      }
    };
    fetchData();
  }, [refreshTrigger, user.role, user.id]);

  // Auto-refresh/synchronization interval (every 10 seconds) to sync newly updated staff and data automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  const handleApproveGps = async (requestId: string, approve: boolean) => {
    try {
      const res = await fetch('/api/admin/approve-login-authority', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({ requestId, approve })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(approve ? 'Login GPS Authority Approved!' : 'Login GPS Authority Rejected!');
        triggerRefresh();
      } else {
        showNotification(data.error || 'Failed to update request', 'error');
      }
    } catch (err) {
      showNotification('Connection error', 'error');
    }
  };

  const handleDeleteGps = async (requestId: string) => {
    try {
      const res = await fetch('/api/admin/delete-login-authority', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({ requestId })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('Login GPS Authority Request Deleted!');
        triggerRefresh();
      } else {
        showNotification(data.error || 'Failed to delete request', 'error');
      }
    } catch (err) {
      showNotification('Connection error', 'error');
    }
  };

  const fetchSalaryRules = async () => {
    setIsRulesLoading(true);
    try {
      const res = await fetch('/api/admin/salary-rules');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSalaryRules(data.salaryRules);
        }
      }
    } catch (err) {
      console.error("Failed fetching salary rules", err);
    } finally {
      setIsRulesLoading(false);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim() || !ruleType) {
      showNotification("Please fill in rule name and type.", "error");
      return;
    }
    setIsSavingRule(true);
    try {
      const res = await fetch('/api/admin/salary-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({
          id: editingRule ? editingRule.id : undefined,
          name: ruleName,
          description: ruleDescription,
          type: ruleType,
          value: Number(ruleValue) || 0,
          valueType: ruleValueType,
          segment: ruleSegment,
          staffId: ruleStaffId,
          enabled: editingRule ? editingRule.enabled : true
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSalaryRules(data.salaryRules);
          showNotification(data.message || "Salary rule saved successfully!");
          setShowRuleModal(false);
          setEditingRule(null);
          // Reset form
          setRuleName("");
          setRuleDescription("");
          setRuleType("Allowance");
          setRuleValue("");
          setRuleValueType("Fixed");
          setRuleSegment("All");
          setRuleStaffId("All");
          setRefreshTrigger(prev => prev + 1); // trigger payroll recalculation
        } else {
          showNotification(data.error || "Failed to save rule.", "error");
        }
      } else {
        const errData = await res.json();
        showNotification(errData.error || "Failed to save rule.", "error");
      }
    } catch (err) {
      showNotification("Error saving rule.", "error");
    } finally {
      setIsSavingRule(false);
    }
  };

  const handleToggleRuleEnabled = async (rule: any) => {
    try {
      const res = await fetch('/api/admin/salary-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({
          ...rule,
          enabled: !rule.enabled
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSalaryRules(data.salaryRules);
          showNotification(`Rule "${rule.name}" ${!rule.enabled ? 'Enabled' : 'Disabled'}!`);
          setRefreshTrigger(prev => prev + 1); // trigger payroll recalculation
        }
      }
    } catch (err) {
      showNotification("Failed to toggle rule status.", "error");
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm("Are you sure you want to delete this custom salary rule? (क्या आप इस नियम को हटाना चाहते हैं?)")) {
      return;
    }
    try {
      const res = await fetch('/api/admin/salary-rules/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({ id: ruleId })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSalaryRules(data.salaryRules);
          showNotification("Salary rule deleted successfully!");
          setRefreshTrigger(prev => prev + 1);
        } else {
          showNotification(data.error || "Failed to delete rule.", "error");
        }
      }
    } catch (err) {
      showNotification("Error deleting rule.", "error");
    }
  };

  const openAddRuleModal = () => {
    setEditingRule(null);
    setRuleName("");
    setRuleDescription("");
    setRuleType("Allowance");
    setRuleValue("");
    setRuleValueType("Fixed");
    setRuleSegment("All");
    setRuleStaffId("All");
    setShowRuleModal(true);
  };

  const openEditRuleModal = (rule: any) => {
    setEditingRule(rule);
    setRuleName(rule.name);
    setRuleDescription(rule.description || "");
    setRuleType(rule.type);
    setRuleValue(String(rule.value));
    setRuleValueType(rule.valueType || "Fixed");
    setRuleSegment(rule.segment || "All");
    setRuleStaffId(rule.staffId || "All");
    setShowRuleModal(true);
  };

  // Load HRM Data
  useEffect(() => {
    const fetchHRMData = async () => {
      try {
        const urlParams = user.id !== 'u-admin' ? `?adminId=${user.id}` : '';
        const [attRes, leavesRes, payrollRes, holidaysRes, tasksRes] = await Promise.all([
          fetch('/api/attendance', { headers: { 'x-user-role': user.role, 'x-user-id': user.id } }),
          fetch('/api/leaves', { headers: { 'x-user-role': user.role, 'x-user-id': user.id } }),
          fetch(`/api/payroll/report?month=${selectedPayrollMonth}`, { headers: { 'x-user-role': user.role, 'x-user-id': user.id } }),
          fetch('/api/company-holidays', { headers: { 'x-user-role': user.role, 'x-user-id': user.id } }),
          fetch(`/api/tasks${urlParams}`, { headers: { 'x-user-role': user.role, 'x-user-id': user.id } })
        ]);

        if (attRes.ok) setAttendanceLogs(await attRes.json());
        if (leavesRes.ok) setLeaveApplications(await leavesRes.json());
        if (holidaysRes.ok) setCompanyHolidays(await holidaysRes.json());
        if (tasksRes.ok) setTasks(await tasksRes.json());
        if (payrollRes.ok) {
          const prData = await payrollRes.json();
          if (prData.success) {
            setPayrollReport(prData.report);
          }
        }
      } catch (err) {
        console.error("Failed to load HRM records", err);
      }
    };
    if (activeTab === 'hrm' || activeTab === 'payroll') {
      fetchHRMData();
      fetchSalaryRules();
    }
  }, [activeTab, selectedPayrollMonth, refreshTrigger, user.role, user.id]);

  useEffect(() => {
    const fetchCustomData = async () => {
      try {
        const [instRes, commsRes] = await Promise.all([
          fetch('/api/admin/improvement-instructions'),
          fetch('/api/sub-admin/comms')
        ]);
        if (instRes.ok) setImprovementInstructions(await instRes.json());
        if (commsRes.ok) setSubAdminComms(await commsRes.json());
      } catch (err) {
        console.error("Failed fetching instructions/comms", err);
      }
    };
    if (user.role === 'admin' || user.role === 'sub-admin' || user.role === 'head') {
      fetchCustomData();
    }
  }, [refreshTrigger, user.role]);

  const handleDeclareHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayDate || !holidayReason) {
      showNotification("Please provide both Date and Reason for holiday", "error");
      return;
    }
    try {
      const res = await fetch('/api/company-holidays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({ date: holidayDate, reason: holidayReason })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification("Company Holiday declared successfully!");
        setHolidayDate('');
        setHolidayReason('');
        triggerRefresh();
      } else {
        showNotification(data.error || "Failed to declare holiday", "error");
      }
    } catch (err) {
      showNotification("Connection error", "error");
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      const res = await fetch(`/api/company-holidays/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': user.role,
          'x-user-id': user.id
        }
      });
      const data = await res.json();
      if (res.ok) {
        showNotification("Holiday deleted successfully");
        triggerRefresh();
      } else {
        showNotification(data.error || "Failed to delete holiday", "error");
      }
    } catch (err) {
      showNotification("Connection error", "error");
    }
  };

  const handleSendInstruction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!improvementText) return;
    try {
      const res = await fetch('/api/admin/improvement-instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: improvementText,
          segment: improvementSegment,
          type: improvementType
        })
      });
      if (res.ok) {
        showNotification("Corrective instruction sent to Sub-Admin!");
        setImprovementText('');
        triggerRefresh();
      } else {
        showNotification("Failed to send instruction", "error");
      }
    } catch (err) {
      showNotification("Error connecting to server", "error");
    }
  };

  const handleSendSubAdminComm = async (type: 'whatsapp' | 'call') => {
    setIsSubmittingComm(true);
    try {
      const getReceiverName = (rId: string) => {
        if (rId === 'u-admin') return 'Main Admin';
        if (rId === 'tech-head') return 'Tech Segment Head';
        if (rId === 'nontech-head') return 'NonTech Head';
        if (rId === 'sales-head') return 'Sales Head';
        return rId;
      };

      const payload = type === 'whatsapp' 
        ? {
            type: 'whatsapp',
            senderId: user.id,
            senderName: user.name || 'Sub-Admin',
            receiverId: whatsappRecipient,
            receiverName: getReceiverName(whatsappRecipient),
            recipient: whatsappRecipient,
            message: whatsappMsgText,
            file: whatsappAttachedFile
          }
        : {
            type: 'call',
            senderId: user.id,
            senderName: user.name || 'Sub-Admin',
            receiverId: callRecipient,
            receiverName: getReceiverName(callRecipient),
            recipient: callRecipient,
            reason: callReason,
            solution: callOutcome
          };

      const res = await fetch('/api/sub-admin/comms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showNotification(type === 'whatsapp' ? "WhatsApp message dispatched successfully!" : "Official Call Log recorded!");
        if (type === 'whatsapp') {
          setWhatsappMsgText('');
          setWhatsappAttachedFile(null);
        } else {
          setCallReason('');
          setCallOutcome('');
        }
        triggerRefresh();
      } else {
        showNotification("Failed to log communication", "error");
      }
    } catch (err) {
      showNotification("Server error logging communication", "error");
    } finally {
      setIsSubmittingComm(false);
    }
  };

  const handleSendCommReply = async (commId: string) => {
    const text = commReplyTexts[commId];
    if (!text || !text.trim()) {
      showNotification("Please enter reply text", "error");
      return;
    }
    try {
      const res = await fetch('/api/sub-admin/comms/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commId, replyText: text })
      });
      if (res.ok) {
        showNotification("Reply submitted successfully!");
        setCommReplyTexts(prev => ({ ...prev, [commId]: '' }));
        triggerRefresh();
      } else {
        showNotification("Failed to send reply", "error");
      }
    } catch (err) {
      showNotification("Connection error replying", "error");
    }
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskAssigneeId || !taskTitle || !taskDate) {
      showNotification("Please select employee, enter Title and Date", "error");
      return;
    }
    const assignee = allUsers.find(a => a.id === taskAssigneeId);
    if (!assignee) return;
 
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({
          adminId: taskAssigneeId,
          adminName: assignee.name,
          title: taskTitle,
          date: taskDate,
          assignedTo: taskAssigneeId,
          assignedToName: assignee.name,
          assignedBy: user.id,
          assignedByName: user.name,
          department: assignee.department || null,
          referenceFile: taskReferenceFile
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification("Task assigned successfully!");
        setTaskTitle('');
        setTaskDate('');
        setTaskReferenceFile(null);
        setTaskReferenceUploadError(null);
        triggerRefresh();
      } else {
        showNotification(data.error || "Failed to assign task", "error");
      }
    } catch (err) {
      showNotification("Connection error", "error");
    }
  };

  const handleTaskReferenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setTaskReferenceUploadError(null);
    if (!file) {
      setTaskReferenceFile(null);
      return;
    }

    // Check file size (limit to 2GB)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > maxSize) {
      setTaskReferenceUploadError("File size exceeds 2GB limit (फ़ाइल 2GB से अधिक है)");
      setTaskReferenceFile(null);
      return;
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const reader = new FileReader();
    reader.onload = () => {
      setTaskReferenceFile({
        name: file.name,
        type: file.type || fileExtension,
        size: file.size,
        data: reader.result as string // base64 data url
      });
    };
    reader.onerror = () => {
      setTaskReferenceUploadError("Error reading reference file (संदर्भ फ़ाइल पढ़ने में त्रुटि)");
    };
    reader.readAsDataURL(file);
  };

  const handleTaskFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileUploadError(null);
    if (!file) {
      setSubmitTaskFile(null);
      return;
    }
    
    // Check file size (limit to 2GB)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > maxSize) {
      setFileUploadError("File size exceeds 2GB limit (फ़ाइल 2GB से अधिक है)");
      setSubmitTaskFile(null);
      return;
    }
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    
    const reader = new FileReader();
    reader.onload = () => {
      setSubmitTaskFile({
        name: file.name,
        type: file.type || fileExtension,
        size: file.size,
        data: reader.result as string // base64 data url
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitTaskRemark.trim()) {
      showNotification("Please provide a genuine remark/reason", "error");
      return;
    }
    try {
      const res = await fetch('/api/tasks/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({
          taskId: submittingTaskId,
          status: submitTaskStatus,
          remark: submitTaskRemark,
          file: submitTaskFile
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification("Task submission sent to supervisor!");
        setSubmittingTaskId(null);
        setSubmitTaskRemark('');
        setSubmitTaskFile(null);
        setFileUploadError(null);
        triggerRefresh();
      } else {
        showNotification(data.error || "Submission failed", "error");
      }
    } catch (err) {
      showNotification("Connection error", "error");
    }
  };

  const handleEvaluateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluateFeedback.trim()) {
      showNotification("Please write evaluation feedback", "error");
      return;
    }
    try {
      const res = await fetch('/api/tasks/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({
          taskId: evaluatingTaskId,
          action: evaluateAction,
          adminReply: evaluateFeedback
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(`Task marked as ${evaluateAction}!`);
        setEvaluatingTaskId(null);
        setEvaluateFeedback('');
        triggerRefresh();
      } else {
        showNotification(data.error || "Failed to evaluate task", "error");
      }
    } catch (err) {
      showNotification("Connection error", "error");
    }
  };

  const handleAppealTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealText.trim()) {
      showNotification("Please type your question/appeal", "error");
      return;
    }
    try {
      const res = await fetch('/api/tasks/appeal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({
          taskId: appealingTaskId,
          appeal: appealText
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification("Appeal submitted successfully to Main Admin!");
        setAppealingTaskId(null);
        setAppealText('');
        triggerRefresh();
      } else {
        showNotification(data.error || "Failed to submit appeal", "error");
      }
    } catch (err) {
      showNotification("Connection error", "error");
    }
  };

  const handleRespondAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReplyText.trim()) {
      showNotification("Please write instructions/reply", "error");
      return;
    }
    try {
      const res = await fetch('/api/tasks/appeal-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({
          taskId: respondingAppealTaskId,
          appealReply: appealReplyText,
          action: appealReplyAction
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification("Response to appeal submitted successfully!");
        setRespondingAppealTaskId(null);
        setAppealReplyText('');
        triggerRefresh();
      } else {
        showNotification(data.error || "Failed to submit appeal response", "error");
      }
    } catch (err) {
      showNotification("Connection error", "error");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    showConfirm(
      "Delete Task (कार्य हटाएं)",
      "Are you sure you want to delete this task? (क्या आप वाकई इस कार्य को हटाना चाहते हैं?)",
      async () => {
        try {
          const res = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
              'x-user-role': user.role,
              'x-user-id': user.id
            }
          });
          const data = await res.json();
          if (res.ok) {
            showNotification("Task deleted successfully!");
            triggerRefresh();
          } else {
            showNotification(data.error || "Failed to delete task", "error");
          }
        } catch (err) {
          showNotification("Connection error", "error");
        }
      }
    );
  };

  const handleSendTaskReply = async (taskId: string) => {
    if (!newReplyMessage.trim()) {
      showNotification("Please enter a reply message", "error");
      return;
    }
    try {
      const res = await fetch('/api/tasks/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({
          taskId,
          message: newReplyMessage,
          senderId: user.id,
          senderName: user.name,
          senderRole: user.role
        })
      });
      const data = await res.json();
      if (res.ok) {
        setNewReplyMessage('');
        setTasks(prev => prev.map(t => t.id === taskId ? data.task : t));
        showNotification("Message sent!");
        triggerRefresh();
      } else {
        showNotification(data.error || "Failed to send message", "error");
      }
    } catch (err) {
      showNotification("Connection error", "error");
    }
  };

  const handleSendOverdueReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overdueReplyText.trim() || !respondingOverdueTaskId) {
      showNotification("Please enter a response", "error");
      return;
    }
    try {
      const res = await fetch('/api/tasks/overdue-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({
          taskId: respondingOverdueTaskId,
          overdueReply: overdueReplyText
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification("Delay response registered!");
        setRespondingOverdueTaskId(null);
        setOverdueReplyText('');
        triggerRefresh();
      } else {
        showNotification(data.error || "Failed to register response", "error");
      }
    } catch (err) {
      showNotification("Connection error", "error");
    }
  };

  const handleSendOverdueRemark = async (taskId: string, remark: string) => {
    if (!remark.trim()) {
      showNotification("Please enter a delay explanation", "error");
      return;
    }
    try {
      const res = await fetch('/api/tasks/overdue-remark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({
          taskId,
          overdueRemark: remark
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification("Delay explanation submitted successfully!");
        triggerRefresh();
      } else {
        showNotification(data.error || "Failed to submit explanation", "error");
      }
    } catch (err) {
      showNotification("Connection error", "error");
    }
  };

  const handleApproveLeave = async (leaveId: string, action: 'Approved' | 'Rejected', rejectionReason?: string, payType?: string) => {
    try {
      const res = await fetch('/api/leaves/approve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({ leaveId, action, rejectionReason, payType }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Leave application ${action.toLowerCase()} successfully!`);
        triggerRefresh();
      } else {
        showNotification(data.error || "Failed to process leave", "error");
      }
    } catch (err) {
      showNotification("Error connecting to server", "error");
    }
  };

  const handleRespondToQuery = async (leaveId: string, response: string, action: 'Approved' | 'Rejected', payType?: string) => {
    try {
      const res = await fetch('/api/leaves/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({ leaveId, response, action, payType }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Response registered and leave status updated to ${action}!`);
        triggerRefresh();
      } else {
        showNotification(data.error || "Failed to submit response", "error");
      }
    } catch (err) {
      showNotification("Error connecting to server", "error");
    }
  };

  // Sync main admin's profile state
  useEffect(() => {
    const mainAdmin = admins.find(a => a.id === 'u-admin');
    if (mainAdmin) {
      setProfileName(mainAdmin.name);
      setProfileEmail(mainAdmin.email);
      setProfilePassword(mainAdmin.password || '');
      setProfilePhone(mainAdmin.phone || '');
      setProfileWhatsapp(mainAdmin.whatsapp || '');
    } else if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
      setProfilePhone(user.phone || '');
      setProfileWhatsapp(user.whatsapp || '');
    }
  }, [admins, user]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage({ text: '', type: 'success' }), 4000);
  };

  // Add a Single Lead
  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleLead.name || !singleLead.phone) {
      showNotification('Name and Phone number are required', 'error');
      return;
    }

    try {
      const res = await fetch('/api/leads/add', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify(singleLead),
      });
      if (res.ok) {
        showNotification('Lead successfully added!');
        setSingleLead({ name: '', phone: '', whatsapp: '', email: '', requirements: '', assignedTo: '' });
        triggerRefresh();
      } else {
        const d = await res.json();
        showNotification(d.error || 'Failed to add lead', 'error');
      }
    } catch (err) {
      showNotification('Connection error', 'error');
    }
  };

  // Assign lead
  const handleAssignLead = async (leadId: string, userId: string) => {
    try {
      const res = await fetch('/api/leads/assign', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({ 
          leadId, 
          userId: userId || null,
          adminId: user.id,
          adminName: user.name
        }),
      });
      if (res.ok) {
        showNotification('Lead assigned successfully!');
        triggerRefresh();
      }
    } catch (err) {
      showNotification('Failed to assign lead', 'error');
    }
  };

  // Bulk Assign selected leads
  const handleBulkAssign = async () => {
    if (selectedLeads.length === 0) {
      showNotification('No leads selected', 'error');
      return;
    }
    try {
      const res = await fetch('/api/leads/bulk-assign', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({ 
          leadIds: selectedLeads, 
          userId: bulkAssignUser || null,
          adminId: user.id,
          adminName: user.name
        }),
      });
      if (res.ok) {
        showNotification(`Assigned ${selectedLeads.length} leads successfully!`);
        setSelectedLeads([]);
        setBulkAssignUser('');
        triggerRefresh();
      }
    } catch (err) {
      showNotification('Failed bulk assignment', 'error');
    }
  };

  // Toggle Bulk Selection
  const toggleSelectLead = (id: string) => {
    setSelectedLeads(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // CSV Lead Upload Parser
  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent.trim()) {
      showNotification('Please paste CSV data first', 'error');
      return;
    }

    // Simple CSV parser
    const lines = csvContent.split('\n');
    const parsedLeads: any[] = [];
    
    // Expect Header: name, phone, email, requirements, notes
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const leadObj: any = {};
      
      headers.forEach((h, idx) => {
        if (values[idx]) {
          leadObj[h] = values[idx];
        }
      });

      if (leadObj.name && leadObj.phone) {
        parsedLeads.push(leadObj);
      }
    }

    if (parsedLeads.length === 0) {
      showNotification('Could not parse any valid leads. Double-check headers.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({ leads: parsedLeads }),
      });
      if (res.ok) {
        showNotification(`Successfully imported ${parsedLeads.length} leads!`);
        setCsvContent('');
        triggerRefresh();
      } else {
        showNotification('Import failed', 'error');
      }
    } catch (err) {
      showNotification('Network error', 'error');
    }
  };

  // Play call recording audio saved on server
  const handlePlayRecording = (recordingId: string) => {
    if (playingAudioId === recordingId) {
      audioElement?.pause();
      setPlayingAudioId(null);
      return;
    }

    if (audioElement) {
      audioElement.pause();
    }

    const newAudio = new Audio(`/api/calls/recording/${recordingId}`);
    newAudio.onended = () => setPlayingAudioId(null);
    newAudio.onerror = () => {
      showNotification('Recording failed to load or does not exist', 'error');
      setPlayingAudioId(null);
    };
    newAudio.play();
    
    setAudioElement(newAudio);
    setPlayingAudioId(recordingId);
  };

  // Update rates for telecaller
  const handleUpdateRates = async (userId: string) => {
    try {
      const res = await fetch('/api/users/update-rates', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({ userId, ...newRates }),
      });
      if (res.ok) {
        showNotification('Rates updated successfully!');
        setEditingUserRates(null);
        triggerRefresh();
      }
    } catch (err) {
      showNotification('Failed to update rates', 'error');
    }
  };

  const handleFullUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFullUser) return;
    try {
      const res = await fetch('/api/users/admin-update-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({
          userId: editingFullUser.id,
          name: editingFullUser.name,
          email: editingFullUser.email,
          password: editingFullUser.password || undefined,
          phone: editingFullUser.phone,
          whatsapp: editingFullUser.whatsapp,
          role: editingFullUser.role,
          department: editingFullUser.role === 'sub-admin' ? 'All' : editingFullUser.department,
          salaryBase: Number(editingFullUser.salaryBase),
          commissionRate: isEditingCommAndTargetDisabled ? 0 : Number(editingFullUser.commissionRate),
          monthlyTarget: isEditingCommAndTargetDisabled ? 0 : Number(editingFullUser.monthlyTarget),
          dailyWork: editingFullUser.dailyWork,
          position: editingFullUser.position,
          joiningDate: editingFullUser.joiningDate,
          employmentCode: editingFullUser.employmentCode
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification("User credentials and contract updated successfully!");
        setEditingFullUser(null);
        triggerRefresh();
      } else {
        showNotification(data.error || "Update failed", "error");
      }
    } catch (err) {
      showNotification("Network error", "error");
    }
  };

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addStaffName || !addStaffPassword || !addStaffRole) {
      showNotification('Please fill in name, password and role!', 'error');
      return;
    }
    try {
      const res = await fetch('/api/users/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({
          name: addStaffName,
          email: addStaffEmail,
          password: addStaffPassword,
          phone: addStaffPhone,
          whatsapp: addStaffWhatsapp,
          role: addStaffRole,
          department: addStaffRole === 'sub-admin' ? 'All' : (addStaffRole === 'telecaller' ? 'Sales' : addStaffSegment),
          salaryBase: Number(addStaffSalary),
          commissionRate: isCommAndTargetDisabled ? 0 : Number(addStaffCommission),
          monthlyTarget: isCommAndTargetDisabled ? 0 : Number(addStaffTarget),
          dailyWork: addStaffDailyWork,
          position: addStaffPosition,
          joiningDate: addStaffJoiningDate,
          employmentCode: addStaffEmploymentCode
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('New staff member added and registered successfully!');
        setAddStaffName('');
        setAddStaffEmail('');
        setAddStaffPhone('');
        setAddStaffWhatsapp('');
        setAddStaffPosition('');
        setAddStaffPassword('');
        setAddStaffRole('staff');
        setAddStaffSegment('Sales');
        setAddStaffSalary(15000);
        setAddStaffCommission(100);
        setAddStaffTarget(5);
        setAddStaffDailyWork('');
        setAddStaffJoiningDate(new Date().toISOString().split('T')[0]);
        triggerRefresh();
      } else {
        showNotification(data.error || 'Failed to add staff', 'error');
      }
    } catch (err) {
      showNotification('Connection error', 'error');
    }
  };

  // Reset User Password
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdResetUser || !newPwd) {
      showNotification('Please select a user and type new password', 'error');
      return;
    }
    try {
      const res = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({ userId: pwdResetUser, newPassword: newPwd }),
      });
      if (res.ok) {
        showNotification('User password updated successfully!');
        setPwdResetUser('');
        setNewPwd('');
        triggerRefresh();
      }
    } catch (err) {
      showNotification('Password reset failed', 'error');
    }
  };

  // Update Main Admin profile handler
  const handleUpdateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName || !profileEmail) {
      showNotification('Name and Email are required', 'error');
      return;
    }
    try {
      const res = await fetch('/api/users/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({
          userId: 'u-admin',
          name: profileName,
          email: profileEmail,
          password: profilePassword || undefined,
          phone: profilePhone,
          whatsapp: profileWhatsapp
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('Main Admin details updated successfully!');
        triggerRefresh();
      } else {
        showNotification(data.error || 'Failed to update admin profile', 'error');
      }
    } catch (err) {
      showNotification('Network connection error', 'error');
    }
  };

  // Save Config Changes
  const handleSaveConfig = async () => {
    try {
      const res = await fetch('/api/config/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({ delaySeconds: autoCallDelay, enabled: autoCallEnabled }),
      });
      if (res.ok) {
        showNotification('Configurations saved successfully!');
        triggerRefresh();
      }
    } catch (err) {
      showNotification('Failed to save config', 'error');
    }
  };

  // Save Testing Period Changes (Main Admin only)
  const handleSaveTestingPeriod = async () => {
    try {
      const res = await fetch('/api/testing-period/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({ expiryDate: testingExpiryDate, isActive: testingActive }),
      });
      if (res.ok) {
        showNotification('Testing period settings updated successfully!');
        triggerRefresh();
      } else {
        const errData = await res.json();
        showNotification(errData.error || 'Failed to update testing period', 'error');
      }
    } catch (err) {
      showNotification('Failed to update testing period due to network connection', 'error');
    }
  };

  // Fetch and Save Secure Recovery Parameters
  const fetchRecoveryConfig = async () => {
    try {
      const response = await fetch('/api/admin/recovery-config', {
        headers: { 'x-user-role': user.role, 'x-user-id': user.id }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.recoveryConfig) {
          setSecurityQuestion(data.recoveryConfig.securityQuestion || "elephant ke kitne daatt hote hai");
          setSecurityAnswer(data.recoveryConfig.securityAnswer || "0000");
          setAdminBackupEmail(data.recoveryConfig.adminBackupEmail || "contact.grahicsworld@gmail.com");
          setAlertWhatsapp(data.recoveryConfig.alertWhatsapp || "9301056006");
          setAlertEmail(data.recoveryConfig.alertEmail || "ipgroup2002@gmail.com");
        }
      }
    } catch (err) {
      console.error("Error loading recovery config", err);
    }
  };

  const handleSaveSecurityConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSecurity(true);
    setSaveSecurityMessage("");
    try {
      const response = await fetch('/api/admin/recovery-config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({
          securityQuestion,
          securityAnswer,
          adminBackupEmail,
          alertWhatsapp,
          alertEmail
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setSaveSecurityMessage(`❌ Error: ${data.error || "Failed to update security parameters."}`);
      } else {
        setSaveSecurityMessage("✅ System recovery security question and contact parameters updated successfully!");
        setTimeout(() => setSaveSecurityMessage(""), 4000);
      }
    } catch (err) {
      setSaveSecurityMessage("❌ Error connecting to backend security server.");
    } finally {
      setIsSavingSecurity(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'backups' && user.role === 'admin') {
      fetchRecoveryConfig();
    }
  }, [activeTab, user.role]);

  // Trigger manual Daily cloud backup
  const handleManualBackup = async () => {
    try {
      const res = await fetch('/api/backups/create', { 
        method: 'POST',
        headers: {
          'x-user-role': user.role,
          'x-user-id': user.id
        }
      });
      if (res.ok) {
        showNotification('Durable auto-backup created successfully!');
        triggerRefresh();
      }
    } catch (err) {
      showNotification('Failed to generate backup', 'error');
    }
  };

  const handleToggleOverride = async (userId: string, type: 'performance' | 'leave' | 'overtime') => {
    try {
      const res = await fetch('/api/payroll/toggle-override', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({ month: selectedPayrollMonth, userId, type })
      });
      if (res.ok) {
        const pRes = await fetch(`/api/payroll/report?month=${selectedPayrollMonth}`, { 
          headers: { 'x-user-role': user.role, 'x-user-id': user.id } 
        });
        if (pRes.ok) {
          const prData = await pRes.json();
          setPayrollReport(prData.report || []);
          showNotification('Payroll settings override updated! (सैलरी सेटिंग अपडेट हो गई है)');
        }
      } else {
        const errData = await res.json();
        showNotification(errData.error || 'Failed to update override', 'error');
      }
    } catch (err) {
      showNotification('Error updating payroll override', 'error');
    }
  };

  const handleReleaseSalary = async (userId: string, finalSalary: number) => {
    try {
      const res = await fetch('/api/payroll/release', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({ month: selectedPayrollMonth, userId, finalSalary })
      });
      if (res.ok) {
        const pRes = await fetch(`/api/payroll/report?month=${selectedPayrollMonth}`, { 
          headers: { 'x-user-role': user.role, 'x-user-id': user.id } 
        });
        if (pRes.ok) {
          const prData = await pRes.json();
          setPayrollReport(prData.report || []);
          showNotification('Salary released successfully! (सैलरी का भुगतान जारी कर दिया गया है)');
        }
      } else {
        const errData = await res.json();
        showNotification(errData.error || 'Failed to release salary', 'error');
      }
    } catch (err) {
      showNotification('Error releasing salary', 'error');
    }
  };

  // Backup Share States & Handler
  const [shareChannel, setShareChannel] = useState<'download' | 'whatsapp' | 'email'>('download');
  const [shareDestination, setShareDestination] = useState('+91');
  const [shareEmail, setShareEmail] = useState('contact.grahicsworld@gmail.com');
  const [shareNotes, setShareNotes] = useState('');
  const [sharingBackup, setSharingBackup] = useState(false);

  const handleShareBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSharingBackup(true);
    const destination = shareChannel === 'whatsapp' ? shareDestination : shareEmail;
    try {
      const res = await fetch('/api/backups/share', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({ 
          channel: shareChannel, 
          destination, 
          notes: shareNotes 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (shareChannel === 'whatsapp' && data.link) {
          window.open(data.link, '_blank');
          showNotification('WhatsApp share initialized! Opening in new tab.');
        } else {
          showNotification(data.message || 'Backup successfully dispatched!');
        }
        setShareNotes('');
      } else {
        showNotification(data.error || 'Failed to dispatch backup', 'error');
      }
    } catch (err) {
      showNotification('Network connection error', 'error');
    } finally {
      setSharingBackup(false);
    }
  };

  // Support Reply Submission
  const handleResolveTicket = async (ticketId: string, replyText: string) => {
    try {
      const res = await fetch('/api/support/reply', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({ ticketId, reply: replyText }),
      });
      if (res.ok) {
        showNotification('Ticket resolved with reply!');
        triggerRefresh();
      }
    } catch (err) {
      showNotification('Failed to reply', 'error');
    }
  };

  // Admin feature: Global Reset to Zero (for analytics & call logs)
  const handleResetAll = () => {
    showConfirm(
      "Reset Analytics (रीसेट करें)",
      "WARNING: Are you sure you want to reset ALL call logs & analytics metrics to zero? This will clean up all dial logs! (क्या आप सभी एनालिटिक्स और कॉल लॉग्स को जीरो पर रीसेट करना चाहते हैं?)",
      async () => {
        try {
          const res = await fetch('/api/admin/reset-all', {
            method: 'POST',
            headers: {
              'x-user-role': user.role,
              'x-user-id': user.id
            }
          });
          if (res.ok) {
            showNotification('Analytics reset to zero successfully!');
            triggerRefresh();
          } else {
            showNotification('Reset failed', 'error');
          }
        } catch (err) {
          showNotification('Network error', 'error');
        }
      }
    );
  };

  // Admin feature: Delete Lead
  const handleDeleteLead = (leadId: string) => {
    showConfirm(
      "Delete Lead (लीड हटाएं)",
      "Are you sure you want to delete this lead from the database? (क्या आप इस लीड को हटाना चाहते हैं?)",
      async () => {
        try {
          const res = await fetch('/api/leads/delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-role': user.role,
              'x-user-id': user.id
            },
            body: JSON.stringify({ leadId })
          });
          if (res.ok) {
            showNotification('Lead successfully deleted!');
            triggerRefresh();
          } else {
            showNotification('Failed to delete lead', 'error');
          }
        } catch (err) {
          showNotification('Network error', 'error');
        }
      }
    );
  };

  // Admin feature: Delete Call Log Recording (Dustbin feature)
  const handleDeleteCallLog = (callId: string) => {
    showConfirm(
      "Delete Call Log (कॉल लॉग हटाएं)",
      "Are you sure you want to delete this recorded call log? (क्या आप इस कॉल लॉग को हटाना चाहते हैं?)",
      async () => {
        try {
          const res = await fetch('/api/calls/delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-role': user.role,
              'x-user-id': user.id
            },
            body: JSON.stringify({ callId })
          });
          if (res.ok) {
            showNotification('Call log deleted successfully!');
            triggerRefresh();
          } else {
            showNotification('Failed to delete call log', 'error');
          }
        } catch (err) {
          showNotification('Network error', 'error');
        }
      }
    );
  };

  // Admin feature: Save Admin Feedback on a call session with custom targeting
  const handleSaveCallFeedback = async (callId: string, feedback: string, target: string = 'telecaller') => {
    try {
      const res = await fetch('/api/calls/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({ callId, feedback, target })
      });
      if (res.ok) {
        showNotification('Feedback saved successfully!');
        triggerRefresh();
      } else {
        showNotification('Failed to save feedback', 'error');
      }
    } catch (err) {
      showNotification('Network error', 'error');
    }
  };

  // Admin feature: Post a reply on a call log's discussion thread
  const handleSaveCallReply = async (callId: string, text: string) => {
    if (!text.trim()) {
      showNotification('Please enter reply text', 'error');
      return;
    }
    try {
      const res = await fetch('/api/calls/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({ callId, text })
      });
      if (res.ok) {
        showNotification('Reply posted successfully!');
        triggerRefresh();
      } else {
        showNotification('Failed to post reply', 'error');
      }
    } catch (err) {
      showNotification('Network error', 'error');
    }
  };

  // Admin feature: Delete support ticket (Dustbin feature)
  const handleDeleteTicket = (ticketId: string) => {
    showConfirm(
      "Delete Ticket (टिकट हटाएं)",
      "Are you sure you want to delete this support ticket? (क्या आप इस टिकट को हटाना चाहते हैं?)",
      async () => {
        try {
          const res = await fetch('/api/support/delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-role': user.role,
              'x-user-id': user.id
            },
            body: JSON.stringify({ ticketId })
          });
          if (res.ok) {
            showNotification('Support ticket successfully deleted!');
            triggerRefresh();
          } else {
            showNotification('Failed to delete ticket', 'error');
          }
        } catch (err) {
          showNotification('Network error', 'error');
        }
      }
    );
  };

  // Admin feature: Delete a backup snapshot (Dustbin feature)
  const handleDeleteBackup = (backupId: string) => {
    showConfirm(
      "Delete Backup (बैकअप हटाएं)",
      "Are you sure you want to delete this backup snapshot? (क्या आप इस बैकअप को हटाना चाहते हैं?)",
      async () => {
        try {
          const res = await fetch('/api/backups/delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-role': user.role,
              'x-user-id': user.id
            },
            body: JSON.stringify({ backupId })
          });
          if (res.ok) {
            showNotification('Backup deleted successfully!');
            triggerRefresh();
          } else {
            showNotification('Failed to delete backup', 'error');
          }
        } catch (err) {
          showNotification('Network error', 'error');
        }
      }
    );
  };

  // Admin feature: Delete telecaller user (Dustbin feature)
  const handleDeleteUser = (userId: string) => {
    showConfirm(
      "Delete User (यूजर हटाएं)",
      "WARNING: Are you sure you want to delete this telecaller user entirely from the system? (क्या आप इस टेलीकॉलर यूजर को हटाना चाहते हैं?)",
      async () => {
        try {
          const res = await fetch('/api/users/delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-role': user.role,
              'x-user-id': user.id
            },
            body: JSON.stringify({ userId })
          });
          if (res.ok) {
            showNotification('Telecaller deleted successfully!');
            triggerRefresh();
          } else {
            showNotification('Failed to delete telecaller', 'error');
          }
        } catch (err) {
          showNotification('Network error', 'error');
        }
      }
    );
  };

  // Admin feature: Reset performance metrics / payroll commissions for a telecaller
  const handleResetPerformance = (userId: string) => {
    showConfirm(
      "Reset Performance (परफॉरमेंस रीसेट करें)",
      "Are you sure you want to reset this telecaller's calling performance and payroll commissions to zero? (क्या आप इस टेलीकॉलर का परफॉरमेंस जीरो करना चाहते हैं?)",
      async () => {
        try {
          const res = await fetch('/api/users/reset-performance', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-role': user.role,
              'x-user-id': user.id
            },
            body: JSON.stringify({ userId })
          });
          if (res.ok) {
            showNotification('Telecaller performance reset to zero!');
            triggerRefresh();
          } else {
            showNotification('Failed performance reset', 'error');
          }
        } catch (err) {
          showNotification('Network error', 'error');
        }
      }
    );
  };

  // CALCULATE METRICS
  const totalCalls = callLogs.length;
  const interestedCalls = callLogs.filter(c => c.status === 'Interested').length;
  const callbackCalls = callLogs.filter(c => c.status === 'Spoke').length;
  const conversionRate = totalCalls > 0 ? Math.round((interestedCalls / totalCalls) * 100) : 0;

  // Generate chart data based on logs
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toLocaleDateString(undefined, { weekday: 'short' });
    const dayKey = d.toISOString().split('T')[0];

    const dayCalls = callLogs.filter(c => c.timestamp.startsWith(dayKey));
    const dayInterested = dayCalls.filter(c => c.status === 'Interested');

    return {
      name: dayStr,
      'Total Calls Connected': dayCalls.length,
      'Interested (Conversion Pitch)': dayInterested.length,
    };
  });

  return (
    <div className="min-h-screen bg-[#090b11] text-gray-100 flex flex-col font-sans">
      
      {/* HEADER SECTION */}
      <header className="bg-[#10141e] border-b border-[#1f2635] px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3 text-left">
          <div className="bg-[#f97316] p-2 rounded-xl shadow-md shadow-orange-500/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight flex items-center">
                <span className="text-[#f97316]">
                  {user.role === 'admin' ? (user.id === 'u-admin' ? "Main Admin" : "Admin Center") : user.role === 'sub-admin' ? "Sub-Admin" : user.role === 'head' ? "Department Head" : "Staff"}
                </span>
              </h1>
            </div>
            <p className="text-[10px] text-gray-400 font-semibold tracking-wide mt-0.5">
              Login Name: <span className="text-white font-extrabold">{user.name}</span> • Role: <span className="text-[#f97316] font-bold uppercase">{user.role === 'admin' ? (user.id === 'u-admin' ? 'Main Admin' : 'Admin') : user.role === 'sub-admin' ? 'Sub-Admin' : user.role === 'head' ? `Dept Head (${user.department || 'All'})` : `Staff (${user.department || 'All'})`}</span> {user.position ? `[Appointed: ${user.position}]` : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#151922] border border-[#222b3c] rounded-xl text-[10px] font-black text-emerald-400 shadow-sm shadow-emerald-500/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            LIVE SYNC
          </div>

          <button 
            onClick={triggerRefresh}
            className="p-2.5 bg-[#151922] hover:bg-[#1e2432] border border-[#222b3c] rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
            title="Refresh Database Data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Exit Panel
          </button>
        </div>
      </header>

      {/* MAIN SCREEN GRID */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* SIDEBAR NAVIGATION PANEL */}
        <aside className="w-full md:w-64 bg-[#0d1017] border-r border-[#1f2635] p-4 flex flex-col gap-6">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3 px-2">
              OPERATIONAL TASKS
            </span>
            <nav className="flex flex-col gap-1.5">
              {isTabAllowed('analytics') && (
                <button
                  id="tab-analytics"
                  onClick={() => setActiveTab('analytics')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'analytics'
                      ? 'bg-[#f97316] text-white shadow-lg shadow-orange-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-[#151922]'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Interactive Analytics
                </button>
              )}
              
              {isTabAllowed('telecallers') && (
                <button
                  id="tab-telecallers"
                  onClick={() => setActiveTab('telecallers')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'telecallers'
                      ? 'bg-[#f97316] text-white shadow-lg shadow-orange-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-[#151922]'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Staff & Admins ({telecallers.length + admins.length})
                </button>
              )}

              {isTabAllowed('upload') && (
                <button
                  id="tab-upload"
                  onClick={() => setActiveTab('upload')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'upload'
                      ? 'bg-[#f97316] text-white shadow-lg shadow-orange-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-[#151922]'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Leads Upload Center
                </button>
              )}

              {isTabAllowed('leads') && (
                <button
                  id="tab-leads"
                  onClick={() => setActiveTab('leads')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'leads'
                      ? 'bg-[#f97316] text-white shadow-lg shadow-orange-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-[#151922]'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  Active Leads Database (लीड लिस्ट)
                </button>
              )}

              {isTabAllowed('recordings') && (
                <button
                  id="tab-recordings"
                  onClick={() => setActiveTab('recordings')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'recordings'
                      ? 'bg-[#f97316] text-white shadow-lg shadow-orange-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-[#151922]'
                  }`}
                >
                  <Disc className="w-4 h-4" />
                  Recorded Call Logs
                </button>
              )}

              {isTabAllowed('resets') && (
                <button
                  id="tab-resets"
                  onClick={() => setActiveTab('resets')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'resets'
                      ? 'bg-[#f97316] text-white shadow-lg shadow-orange-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-[#151922]'
                  }`}
                >
                  <Key className="w-4 h-4" />
                  Password Resets
                </button>
              )}
            </nav>
          </div>

          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3 px-2">
              FINANCE & AUDITING
            </span>
            <nav className="flex flex-col gap-1.5">
              {isTabAllowed('payroll') && (
                <button
                  id="tab-payroll"
                  onClick={() => setActiveTab('payroll')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'payroll'
                      ? 'bg-[#f97316] text-white shadow-lg shadow-orange-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-[#151922]'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Payroll Integration
                </button>
              )}

              {isTabAllowed('hrm') && (
                <button
                  id="tab-hrm"
                  onClick={() => setActiveTab('hrm')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'hrm'
                      ? 'bg-[#f97316] text-white shadow-lg shadow-orange-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-[#151922]'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  HRM Management (एचआरएम)
                </button>
              )}

              {isTabAllowed('backups') && (
                <button
                  id="tab-backups"
                  onClick={() => setActiveTab('backups')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'backups'
                      ? 'bg-[#f97316] text-white shadow-lg shadow-orange-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-[#151922]'
                  }`}
                >
                  <HardDrive className="w-4 h-4" />
                  Daily Excel Backups
                </button>
              )}

              {isTabAllowed('autocall') && (
                <button
                  id="tab-autocall"
                  onClick={() => setActiveTab('autocall')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'autocall'
                      ? 'bg-[#f97316] text-white shadow-lg shadow-orange-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-[#151922]'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Auto-Calling Setup
                </button>
              )}

              {isTabAllowed('support') && (
                <button
                  id="tab-support"
                  onClick={() => setActiveTab('support')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'support'
                      ? 'bg-[#f97316] text-white shadow-lg shadow-orange-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-[#151922]'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  24/7 Tech Support
                </button>
              )}
            </nav>
          </div>
          
          <div className="mt-auto p-3 bg-[#111622] border border-[#1e2635] rounded-2xl">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              CLOUD HOSTING STATUS
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-bold text-[#f97316]">Active & Secure</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">24/7 automated backups enabled.</p>
          </div>
        </aside>

        {/* WORKSPACE VIEWPORT CONTENT */}
        <main className="flex-1 p-6 overflow-y-auto">
          
          {/* Status message banners */}
          {statusMessage.text && (
            <div className={`p-4 rounded-xl border mb-6 text-sm flex items-center gap-2 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {statusMessage.type === 'success' ? '✅' : '⚠️'} {statusMessage.text}
            </div>
          )}

          {/* TAB 1: INTERACTIVE ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              {/* HEADER WITH PERIOD TOGGLES */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1f2635] pb-6">
                <div>
                  <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-[#f97316]" />
                    HubSphere Enterprise Analytics Dashboard
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Day-wise, Month-wise, and Year-wise interactive segment monitoring & supervisor workflows (अंग्रेजी और हिंदी)
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  {(user.role === 'admin' || user.role === 'sub-admin') && (
                    <button
                      onClick={handleResetAll}
                      className="bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 hover:border-red-500/40 text-red-400 text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition duration-200 cursor-pointer"
                      title="Reset all log analytics to zero"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
                      Reset Console Data
                    </button>
                  )}
                  
                  {/* Period selection tabs */}
                  <div className="flex bg-[#111622] border border-[#1f2635] rounded-xl p-1 gap-1">
                    {(['day', 'month', 'year'] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => setAnalyticsPeriod(period)}
                        className={`px-4 py-2 rounded-lg text-xs font-black transition capitalize cursor-pointer ${
                          analyticsPeriod === period
                            ? 'bg-[#f97316] text-white shadow-lg'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {period === 'day' ? 'Day-wise' : period === 'month' ? 'Month-wise' : 'Year-wise'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* DYNAMIC ANALYSIS AND BOTTLE-NECK IDENTIFIER */}
              {(() => {
                const getWeekDays = () => {
                  const current = new Date();
                  const day = current.getDay();
                  const distance = (day === 0 ? -6 : 1) - day;
                  const monday = new Date(current);
                  monday.setDate(current.getDate() + distance);
                  
                  const days = [];
                  for (let i = 0; i < 7; i++) {
                    const d = new Date(monday);
                    d.setDate(monday.getDate() + i);
                    days.push(d.toISOString().split('T')[0]);
                  }
                  return days;
                };

                const weekDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                const weekDates = getWeekDays();

                const daySegmentData = weekDates.map((dateStr, index) => {
                  const dayTasks = tasks || [];
                  const techTasks = dayTasks.filter((t: any) => t.department === 'Tech' && t.date === dateStr);
                  const techCompleted = techTasks.filter((t: any) => t.status === 'Approved' || t.status === 'Completed').length;
                  const Tech = techTasks.length > 0 ? Math.round((techCompleted / techTasks.length) * 100) : 0;
                  
                  const nonTechTasks = dayTasks.filter((t: any) => t.department === 'NonTech' && t.date === dateStr);
                  const nonTechCompleted = nonTechTasks.filter((t: any) => t.status === 'Approved' || t.status === 'Completed').length;
                  const NonTech = nonTechTasks.length > 0 ? Math.round((nonTechCompleted / nonTechTasks.length) * 100) : 0;

                  const dayCalls = (callLogs || []).filter((c: any) => c.timestamp.startsWith(dateStr));
                  const dayInterested = dayCalls.filter((c: any) => c.status === 'Interested').length;
                  const Sales = dayCalls.length > 0 ? Math.round((dayInterested / dayCalls.length) * 100) : 0;

                  const dayClosedWon = (leads || []).filter((l: any) => l.status === 'Closed Won' && l.createdAt?.startsWith(dateStr)).length;
                  const SalesAmount = (dayInterested * 15000) + (dayClosedWon * 50000);

                  return {
                    name: weekDayNames[index],
                    Tech,
                    NonTech,
                    Sales,
                    SalesAmount
                  };
                });

                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const currentYear = new Date().getFullYear().toString();

                const monthSegmentData = monthNames.map((monthName, index) => {
                  const monthNumStr = String(index + 1).padStart(2, '0');
                  const yearMonthPrefix = `${currentYear}-${monthNumStr}`;

                  const monthTasks = tasks || [];
                  const monthTechTasks = monthTasks.filter((t: any) => t.department === 'Tech' && t.date.startsWith(yearMonthPrefix));
                  const techCompleted = monthTechTasks.filter((t: any) => t.status === 'Approved' || t.status === 'Completed').length;
                  const Tech = monthTechTasks.length > 0 ? Math.round((techCompleted / monthTechTasks.length) * 100) : 0;

                  const monthNonTechTasks = monthTasks.filter((t: any) => t.department === 'NonTech' && t.date.startsWith(yearMonthPrefix));
                  const nonTechCompleted = monthNonTechTasks.filter((t: any) => t.status === 'Approved' || t.status === 'Completed').length;
                  const NonTech = monthNonTechTasks.length > 0 ? Math.round((nonTechCompleted / monthNonTechTasks.length) * 100) : 0;

                  const monthCalls = (callLogs || []).filter((c: any) => c.timestamp.startsWith(yearMonthPrefix));
                  const monthInterested = monthCalls.filter((c: any) => c.status === 'Interested').length;
                  const Sales = monthCalls.length > 0 ? Math.round((monthInterested / monthCalls.length) * 100) : 0;

                  const monthClosedWon = (leads || []).filter((l: any) => l.status === 'Closed Won' && l.createdAt?.startsWith(yearMonthPrefix)).length;
                  const SalesAmount = (monthInterested * 15000) + (monthClosedWon * 50000);

                  return {
                    name: monthName,
                    Tech,
                    NonTech,
                    Sales,
                    SalesAmount
                  };
                });

                const yearSegmentData = ['2024', '2025', '2026'].map(yearStr => {
                  const yearTasks = tasks || [];
                  const yearTechTasks = yearTasks.filter((t: any) => t.department === 'Tech' && t.date.startsWith(yearStr));
                  const techCompleted = yearTechTasks.filter((t: any) => t.status === 'Approved' || t.status === 'Completed').length;
                  const Tech = yearTechTasks.length > 0 ? Math.round((techCompleted / yearTechTasks.length) * 100) : 0;

                  const yearNonTechTasks = yearTasks.filter((t: any) => t.department === 'NonTech' && t.date.startsWith(yearStr));
                  const nonTechCompleted = yearNonTechTasks.filter((t: any) => t.status === 'Approved' || t.status === 'Completed').length;
                  const NonTech = yearNonTechTasks.length > 0 ? Math.round((nonTechCompleted / yearNonTechTasks.length) * 100) : 0;

                  const yearCalls = (callLogs || []).filter((c: any) => c.timestamp.startsWith(yearStr));
                  const yearInterested = yearCalls.filter((c: any) => c.status === 'Interested').length;
                  const Sales = yearCalls.length > 0 ? Math.round((yearInterested / yearCalls.length) * 100) : 0;

                  const yearClosedWon = (leads || []).filter((l: any) => l.status === 'Closed Won' && l.createdAt?.startsWith(yearStr)).length;
                  const SalesAmount = (yearInterested * 15000) + (yearClosedWon * 50000);

                  return {
                    name: yearStr,
                    Tech,
                    NonTech,
                    Sales,
                    SalesAmount
                  };
                });

                const selectedData = analyticsPeriod === 'day' ? daySegmentData : analyticsPeriod === 'month' ? monthSegmentData : yearSegmentData;
                const computedTotalSalesAmount = selectedData.reduce((acc, curr) => acc + curr.SalesAmount, 0);

                const avgTech = selectedData.length > 0 ? selectedData.reduce((acc, c) => acc + c.Tech, 0) / selectedData.length : 0;
                const avgNonTech = selectedData.length > 0 ? selectedData.reduce((acc, c) => acc + c.NonTech, 0) / selectedData.length : 0;
                const avgSales = selectedData.length > 0 ? selectedData.reduce((acc, c) => acc + c.Sales, 0) / selectedData.length : 0;

                const isUserHead = user.role === 'head';
                const userDept = user.department; // 'Tech' | 'NonTech' | 'Sales'

                let bottleneckText = "";
                let bottleneckSegment = "";
                let bottleneckType = "";

                if (isUserHead) {
                  if (userDept === 'Tech') {
                    bottleneckSegment = "Tech Segment (तकनीकी विभाग)";
                    bottleneckType = "Tech Performance Insight";
                    bottleneckText = avgTech > 0 
                      ? `Your Tech segment is performing at ${avgTech.toFixed(1)}% target achievement. Maintain high standards and ensure pending tasks are completed promptly.`
                      : "Tech segment has no active tasks currently logged in this period.";
                  } else if (userDept === 'NonTech') {
                    bottleneckSegment = "Non-Tech Segment (नॉन-टेक विभाग)";
                    bottleneckType = "Non-Tech Performance Insight";
                    bottleneckText = avgNonTech > 0
                      ? `Your Non-Tech segment is operating at ${avgNonTech.toFixed(1)}% documentation processing speed. Ensure onboarding and billing queues are clear.`
                      : "Non-Tech segment has no active tasks currently logged in this period.";
                  } else if (userDept === 'Sales') {
                    bottleneckSegment = "Sales Segment (सेल्स विभाग)";
                    bottleneckType = "Sales Performance Insight";
                    bottleneckText = avgSales > 0
                      ? `Your Sales segment shows a calling pitch interested conversion rate of ${avgSales.toFixed(1)}%. Focus telecallers on hot lists to boost performance.`
                      : "Sales segment has no call logs recorded in this period.";
                  }
                } else {
                  if (avgTech === 0 && avgNonTech === 0 && avgSales === 0) {
                    bottleneckSegment = "None (सभी विभाग संतुलित हैं)";
                    bottleneckType = "Operational Balanced (संतुलित स्थिति)";
                    bottleneckText = "All operational segment metrics are fresh or cleared to zero. No critical business bottlenecks detected in this view.";
                  } else {
                    const minScore = Math.min(
                      avgTech > 0 ? avgTech : 999,
                      avgNonTech > 0 ? avgNonTech : 999,
                      avgSales > 0 ? avgSales : 999
                    );
                    if (minScore === 999) {
                      bottleneckSegment = "None (सभी विभाग संतुलित हैं)";
                      bottleneckType = "Operational Balanced (संतुलित स्थिति)";
                      bottleneckText = "All operational segment metrics are fresh or cleared to zero. No critical business bottlenecks detected in this view.";
                    } else if (minScore === avgSales) {
                      bottleneckSegment = "Sales Segment (सेल्स विभाग)";
                      bottleneckType = "Degrowth Alert (मंदी अलर्ट)";
                      bottleneckText = `Sales conversion average has dropped to ${avgSales.toFixed(1)}% due to cold-leads list friction. Sub-Admin should immediately instruct the Sales Department Head to switch calling targets to hot lead records.`;
                    } else if (minScore === avgNonTech) {
                      bottleneckSegment = "Non-Tech Segment (नॉन-टेक विभाग)";
                      bottleneckType = "Operational Blocker (प्रक्रिया अवरोध)";
                      bottleneckText = `Non-Tech segment is lagging, showing ${avgNonTech.toFixed(1)}% performance due to delayed client documentation processing. Recommend automating onboarding verification.`;
                    } else {
                      bottleneckSegment = "Tech Segment (तकनीकी विभाग)";
                      bottleneckType = "SLA Deficit (कमी)";
                      bottleneckText = `Tech segment is lagging, showing ${avgTech.toFixed(1)}% achievement due to delayed task processing. Require tech department head to delegate high priority tasks.`;
                    }
                  }
                }

                return (
                  <div className="space-y-6">
                    {/* STATS OVERVIEW CARDS */}
                    <div className={`grid grid-cols-1 ${isUserHead ? (userDept === 'Sales' ? 'sm:grid-cols-2 max-w-2xl' : 'max-w-md') : 'sm:grid-cols-2 lg:grid-cols-4'} gap-4`}>
                      {(!isUserHead || userDept === 'Sales') && (
                        <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl">
                          <span className="text-[10px] font-extrabold tracking-widest text-gray-400 block mb-1">
                            TOTAL SALES CONVERTED
                          </span>
                          <div className="text-2xl font-black text-[#f97316]">
                            ₹{computedTotalSalesAmount.toLocaleString('en-IN')}
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1">Accumulated for selected {analyticsPeriod} view</p>
                        </div>
                      )}

                      {(!isUserHead || userDept === 'Tech') && (
                        <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl border-l-4 border-l-emerald-500">
                          <span className="text-[10px] font-extrabold tracking-widest text-emerald-400 block mb-1">
                            TECH AVG GROWTH
                          </span>
                          <div className="text-3xl font-black text-white">
                            {(selectedData.reduce((acc, c) => acc + c.Tech, 0) / selectedData.length).toFixed(1)}%
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1">Average technical target achievement</p>
                        </div>
                      )}

                      {(!isUserHead || userDept === 'NonTech') && (
                        <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl border-l-4 border-l-cyan-500">
                          <span className="text-[10px] font-extrabold tracking-widest text-cyan-400 block mb-1">
                            NON-TECH AVG GROWTH
                          </span>
                          <div className="text-3xl font-black text-white">
                            {(selectedData.reduce((acc, c) => acc + c.NonTech, 0) / selectedData.length).toFixed(1)}%
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1">Average documentation & support growth</p>
                        </div>
                      )}

                      {(!isUserHead || userDept === 'Sales') && (
                        <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl border-l-4 border-l-amber-500">
                          <span className="text-[10px] font-extrabold tracking-widest text-amber-400 block mb-1">
                            SALES AVG CONVERSION
                          </span>
                          <div className="text-3xl font-black text-white">
                            {(selectedData.reduce((acc, c) => acc + c.Sales, 0) / selectedData.length).toFixed(1)}%
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1">Average calling pitched conversion rate</p>
                        </div>
                      )}
                    </div>

                    {/* BOTTLENECK ALERT CARD */}
                    <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1 text-left">
                        <div className="flex items-center gap-2 text-rose-400 font-extrabold text-xs tracking-wider uppercase">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                          ⚠️ {isUserHead ? 'Department Performance Insight' : 'Growth Bottleneck Identified'} (विकास अवरोधक): {bottleneckSegment}
                        </div>
                        <span className="text-[10px] bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded font-black uppercase">
                          {bottleneckType}
                        </span>
                        <p className="text-gray-300 text-xs leading-relaxed italic mt-1">
                          "{bottleneckText}"
                        </p>
                      </div>

                      {user.id === 'u-admin' && (
                        <button
                          onClick={() => {
                            setImprovementSegment(
                              bottleneckSegment.includes("Sales") ? "Sales" :
                              bottleneckSegment.includes("Non-Tech") ? "NonTech" : "Tech"
                            );
                            setImprovementType("Degrowth");
                            setImprovementText(`Corrective instruction for ${bottleneckSegment}: Please resolve the identified bottleneck immediately. Action detail: `);
                            showNotification("Bottleneck values populated in direct instructions box below!");
                          }}
                          className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold px-4 py-2.5 rounded-xl transition shrink-0 cursor-pointer"
                        >
                          Draft Correction Instruction
                        </button>
                      )}
                    </div>

                    {/* GRAPHICAL REPRESENTATION GRIDS */}
                    <div className={`grid grid-cols-1 ${(!isUserHead || userDept === 'Sales') ? 'lg:grid-cols-2' : ''} gap-6`}>
                      {/* CHART 1: SEGMENT PERFORMANCE COMPARISON */}
                      <div className={`bg-[#111622] border border-[#1f2635] p-5 rounded-2xl ${(isUserHead && userDept !== 'Sales') ? 'lg:col-span-2' : ''}`}>
                        <h3 className="text-sm font-bold text-white mb-6 flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-[#f97316] rounded-full"></span>
                            {isUserHead ? `${userDept} Segment Performance Trends (%)` : 'Segment Growth/Degrowth Achievement Trends (%)'}
                          </span>
                          <span className="text-[10px] text-gray-500 font-sans uppercase font-bold">{analyticsPeriod} comparison</span>
                        </h3>
                        <div className="h-72 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={selectedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1f2635" />
                              <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: 11 }} />
                              <YAxis stroke="#6b7280" style={{ fontSize: 11 }} domain={[40, 100]} />
                              <Tooltip contentStyle={{ backgroundColor: '#131924', borderColor: '#1f2635', borderRadius: 12 }} />
                              <Legend style={{ fontSize: 11 }} />
                              {(!isUserHead || userDept === 'Tech') && (
                                <Line type="monotone" dataKey="Tech" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 8 }} />
                              )}
                              {(!isUserHead || userDept === 'NonTech') && (
                                <Line type="monotone" dataKey="NonTech" stroke="#06b6d4" strokeWidth={2.5} />
                              )}
                              {(!isUserHead || userDept === 'Sales') && (
                                <Line type="monotone" dataKey="Sales" stroke="#f97316" strokeWidth={2.5} />
                              )}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* CHART 2: SALES REVENUE AMOUNT (RUPEES) */}
                      {(!isUserHead || userDept === 'Sales') && (
                        <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl">
                          <h3 className="text-sm font-bold text-white mb-6 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                              Sales Converted Revenue Amount (₹)
                            </span>
                            <span className="text-[10px] text-gray-500 font-sans uppercase font-bold">In Rupees (₹)</span>
                          </h3>
                          <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={selectedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorSalesAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2635" />
                                <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: 11 }} />
                                <YAxis stroke="#6b7280" style={{ fontSize: 11 }} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#131924', borderColor: '#1f2635', borderRadius: 12 }}
                                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Sales Amount']}
                                />
                                <Area type="monotone" dataKey="SalesAmount" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSalesAmount)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* MAIN ADMIN ROLE-SPECIFIC CONTROLS & DIRECTIVES DISPATCH */}
              {user.id === 'u-admin' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 border-t border-[#1f2635] pt-8">
                  {/* DIRECTIVE WRITER FORM */}
                  <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl h-fit text-left space-y-4">
                    <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-[#1e2635] pb-3">
                      <MessageSquare className="w-5 h-5 text-[#f97316]" />
                      Main Admin Corrective Panel (सुधार निर्देश)
                    </div>
                    
                    <form onSubmit={handleSendInstruction} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-[10px] text-gray-400 font-bold mb-1 uppercase">TARGET SEGMENT (लक्षित अनुभाग)</label>
                        <select
                          value={improvementSegment}
                          onChange={(e) => setImprovementSegment(e.target.value as any)}
                          className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-3 py-2 text-white outline-none focus:border-[#f97316]"
                        >
                          <option value="general">General / All (सभी विभाग)</option>
                          <option value="Tech">Tech Segment (आईटी विभाग)</option>
                          <option value="NonTech">Non-Tech Segment (नॉन-टेक विभाग)</option>
                          <option value="Sales">Sales Segment (सेल्स विभाग)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-gray-400 font-bold mb-1 uppercase">Directive Type</label>
                          <select
                            value={improvementType}
                            onChange={(e) => setImprovementType(e.target.value as any)}
                            className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-3 py-2 text-white outline-none focus:border-[#f97316]"
                          >
                            <option value="Instruction">Routine Directive</option>
                            <option value="Growth">Growth Strategy</option>
                            <option value="Degrowth">Bottleneck Correction</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 font-bold mb-1 uppercase">Priority Level</label>
                          <span className="w-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold block text-center rounded-xl py-2">
                            CRITICAL (अति-आवश्यक)
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-gray-400 font-bold mb-1 uppercase">CORRECTIVE INSTRUCTION (सुधार निर्देश संदेश) *</label>
                        <textarea
                          required
                          rows={4}
                          value={improvementText}
                          onChange={(e) => setImprovementText(e.target.value)}
                          placeholder="Type clear instructions for the Sub-Admin and Dept Heads. e.g. 'Sub-admin immediately assign 2 sales reps to support tech target...' "
                          className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#f97316]"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-extrabold py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10 text-xs"
                      >
                        <Send className="w-4 h-4" />
                        Disptach Official Directive
                      </button>
                    </form>
                  </div>

                  {/* DIRECTIVE LIST DISPATCHED BY ADMIN */}
                  <div className="lg:col-span-2 bg-[#111622] border border-[#1f2635] p-5 rounded-2xl text-left flex flex-col">
                    <div className="flex items-center justify-between text-white font-bold text-sm border-b border-[#1e2635] pb-3 mb-4">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        Dispatched Core Corrective Directives Track
                      </span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded font-black">
                        {improvementInstructions.length} Total Directives
                      </span>
                    </div>

                    <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2 flex-1">
                      {improvementInstructions.map((inst: any) => (
                        <div key={inst.id} className="bg-[#0d1017] border border-[#1f2635] p-4 rounded-xl text-xs space-y-2">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <span className="font-bold text-gray-300">
                              🎯 Segment Target: <span className="text-orange-400 uppercase font-extrabold">{inst.segment}</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              inst.type === 'Degrowth' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              inst.type === 'Growth' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            }`}>
                              {inst.type}
                            </span>
                          </div>

                          <p className="text-gray-300 italic leading-relaxed text-xs">
                            "{inst.text}"
                          </p>

                          <div className="flex items-center justify-between pt-1 text-[10px] text-gray-500">
                            <span>📅 Sent At: {new Date(inst.timestamp || Date.now()).toLocaleDateString()}</span>
                            <span className="font-bold text-amber-500 bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 rounded">
                              ✓ Dispatched to Sub-Admin (एक्शन लंबित है)
                            </span>
                          </div>
                        </div>
                      ))}

                      {improvementInstructions.length === 0 && (
                        <div className="text-center py-16 text-gray-500 text-xs italic">
                          No official correction directives have been dispatched today yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-ADMIN SEGMENT WORKSPACE / SUB-ADMIN HUB */}
              {user.role === 'sub-admin' && (
                <div className="border-t border-[#1f2635] pt-8 space-y-6">
                  {/* MAIN ADMIN DIRECTIVES BANNER */}
                  <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl text-left space-y-4">
                    <h3 className="text-sm font-bold text-white border-b border-[#1f2635] pb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-[#f97316] animate-pulse" />
                        DIRECT CORRECTION DIRECTIVES FROM MAIN ADMIN (मुख्य एडमिन के आदेश)
                      </span>
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded font-black">
                        {improvementInstructions.length} Directives Dispatched
                      </span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {improvementInstructions.map((inst: any) => (
                        <div key={inst.id} className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl text-xs space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-[#f97316] uppercase tracking-wider">
                              TARGET: {inst.segment}
                            </span>
                            <span className="text-[9px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded font-black">
                              IMMEDIATE COMPLIANCE
                            </span>
                          </div>
                          <p className="text-gray-300 italic leading-relaxed">
                            "{inst.text}"
                          </p>
                          <div className="text-[10px] text-gray-500 pt-1 border-t border-[#1f2635] flex justify-between items-center">
                            <span>Dispatched At: {new Date(inst.timestamp || Date.now()).toLocaleDateString()}</span>
                            <button
                              onClick={async () => {
                                showNotification("Acknowledging instruction & alerting Department Head!");
                              }}
                              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-extrabold px-3 py-1 rounded border border-emerald-500/20 transition cursor-pointer text-[10px]"
                            >
                              ✓ Acknowledge & Deploy
                            </button>
                          </div>
                        </div>
                      ))}

                      {improvementInstructions.length === 0 && (
                        <div className="col-span-2 text-center py-8 text-gray-500 text-xs italic bg-[#0d1017] rounded-xl border border-[#1e2535]">
                          Great work! No pending action items from the Main Admin.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* WHATSAPP FILE SHARING AND DIRECT CALL RECORDS SUITE */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* COLUMN 1: WHATSAPP FILE SHARING AND CHAT */}
                    <div className="lg:col-span-2 bg-[#111622] border border-[#1f2635] p-5 rounded-2xl text-left flex flex-col">
                      <h3 className="text-sm font-bold text-white border-b border-[#1f2635] pb-3 mb-4 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        Green WhatsApp Communication Hub (व्हाट्सएप शेयरिंग पोर्टल)
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                        {/* LEFT: WHATSAPP DISPATCH FORM */}
                        <div className="md:col-span-1 bg-[#0d1017] border border-[#1f2635] p-4 rounded-xl text-xs space-y-4">
                          <div>
                            <label className="block text-[10px] text-gray-400 font-bold mb-1 uppercase">SELECT RECIPIENT</label>
                            <select
                              value={whatsappRecipient}
                              onChange={(e) => setWhatsappRecipient(e.target.value)}
                              className="w-full bg-[#111622] border border-[#1f2635] rounded-xl px-2 py-1.5 text-white outline-none focus:border-emerald-500 text-xs"
                            >
                              <option value="u-admin">Main Admin (मुख्य एडमिन)</option>
                              <option value="tech-head">Tech Segment Head (आईटी हेड)</option>
                              <option value="nontech-head">NonTech Head (नॉन-टेक हेड)</option>
                              <option value="sales-head">Sales Head (सेल्स हेड)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] text-gray-400 font-bold mb-1 uppercase">MESSAGE TEXT *</label>
                            <textarea
                              required
                              rows={3}
                              value={whatsappMsgText}
                              onChange={(e) => setWhatsappMsgText(e.target.value)}
                              placeholder="Enter message for WhatsApp..."
                              className="w-full bg-[#111622] border border-[#1f2635] rounded-xl px-2 py-1.5 text-white outline-none focus:border-emerald-500 text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-gray-400 font-bold mb-1 uppercase">
                              ATTACH FILE (PDF/Word/JPG)
                            </label>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const r = new FileReader();
                                  r.onload = () => {
                                    setWhatsappAttachedFile({
                                      name: file.name,
                                      type: file.type,
                                      dataUrl: r.result as string
                                    });
                                  };
                                  r.readAsDataURL(file);
                                }
                              }}
                              className="w-full text-[10px] text-white file:bg-orange-500 file:border-0 file:text-white file:px-3 file:py-1.5 file:rounded-lg file:cursor-pointer file:hover:bg-orange-600 file:font-black"
                            />
                            {whatsappAttachedFile && (
                              <div className="mt-1 bg-emerald-500/5 text-emerald-400 border border-emerald-500/25 p-1 px-2 rounded flex items-center justify-between text-[10px]">
                                <span className="truncate">📄 {whatsappAttachedFile.name}</span>
                                <button onClick={() => setWhatsappAttachedFile(null)} className="text-red-400 font-bold ml-1">×</button>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleSendSubAdminComm('whatsapp')}
                            disabled={isSubmittingComm}
                            className="w-full bg-[#128c7e] hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 text-xs shadow-md shadow-emerald-500/10"
                          >
                            Send on WhatsApp
                          </button>
                        </div>

                        {/* RIGHT: WHATSAPP LIVE CHAT BOX */}
                        <div className="md:col-span-2 bg-white border border-[#1f2635]/25 p-4 rounded-xl flex flex-col h-[320px] text-xs shadow-inner">
                          <div className="bg-[#128c7e] text-white p-2.5 rounded-lg flex items-center justify-between font-extrabold text-[10px] tracking-wider mb-3 shadow-sm">
                            <span className="text-white">🟩 VERIFIED WHATSAPP BROADCAST CHATS</span>
                            <span className="text-[9px] text-white bg-emerald-900/40 px-2 py-0.5 rounded font-black tracking-wider uppercase">CONNECTED</span>
                          </div>

                          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                            {subAdminComms.filter(c => c.type === 'whatsapp').map((chat: any) => (
                              <div key={chat.id} className="flex flex-col text-left space-y-0.5">
                                <span className="text-[9px] text-[#128c7e] font-extrabold ml-1">
                                  From: {chat.senderName || 'Sub-Admin'} ➜ To: {chat.recipient === 'u-admin' ? 'Main Admin' : (chat.receiverName || chat.recipient)}
                                </span>
                                <div className="bg-[#e2f7cb] text-gray-800 max-w-[85%] self-start p-3 rounded-2xl border border-emerald-200 space-y-1.5 shadow-sm text-xs">
                                  <p className="leading-relaxed whitespace-pre-line text-xs font-semibold text-gray-900">{chat.message}</p>
                                  {chat.file && (
                                    <div className="bg-white/60 border border-emerald-200 p-1.5 px-2.5 rounded-xl flex items-center gap-1.5 text-[10px]">
                                      <span>📄</span>
                                      <a href={chat.file.dataUrl} download={chat.file.name} className="underline text-[#128c7e] font-black truncate">
                                        Download: {chat.file.name}
                                      </a>
                                    </div>
                                  )}
                                  <span className="text-[8px] text-gray-500 block text-right mt-0.5 font-bold">
                                    {new Date(chat.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                                </div>
                              </div>
                            ))}

                            {subAdminComms.filter(c => c.type === 'whatsapp').length === 0 && (
                              <div className="text-center py-20 text-gray-400 text-xs italic font-bold">
                                No WhatsApp messages sent yet today.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* COLUMN 2: DIRECT OFFICIAL CALL LOGS RECORDING */}
                    <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl text-left flex flex-col space-y-4">
                      <h3 className="text-sm font-bold text-white border-b border-[#1f2635] pb-3 flex items-center gap-2">
                        <Phone className="w-5 h-5 text-orange-400" />
                        Official Calling Logger (कॉल रिकॉर्डर)
                      </h3>

                      <div className="space-y-3 text-xs flex-1">
                        <div>
                          <label className="block text-[10px] text-gray-400 font-bold mb-1 uppercase">CALLED PERSON</label>
                          <select
                            value={callRecipient}
                            onChange={(e) => setCallRecipient(e.target.value)}
                            className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-2.5 py-1.5 text-white outline-none focus:border-[#f97316] text-xs"
                          >
                            <option value="u-admin">Main Admin (मुख्य एडमिन)</option>
                            <option value="tech-head">Tech Segment Head (आईटी हेड)</option>
                            <option value="nontech-head">NonTech Head (नॉन-टेक हेड)</option>
                            <option value="sales-head">Sales Head (सेल्स हेड)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-400 font-bold mb-1 uppercase">REAL CALL REASON (कॉल का कारण) *</label>
                          <input
                            type="text"
                            required
                            value={callReason}
                            onChange={(e) => setCallReason(e.target.value)}
                            placeholder="e.g. Blocker regarding Tech target SLA delays"
                            className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-2.5 py-1.5 text-white outline-none focus:border-[#f97316] text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-400 font-bold mb-1 uppercase">SOLUTION / OUTCOME (क्या समाधान आया) *</label>
                          <textarea
                            required
                            rows={3}
                            value={callOutcome}
                            onChange={(e) => setCallOutcome(e.target.value)}
                            placeholder="e.g. Main Admin agreed to recruit 1 freelance support member for 15 days."
                            className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-2.5 py-1.5 text-white outline-none focus:border-[#f97316] text-xs"
                          />
                        </div>

                        <button
                          onClick={() => handleSendSubAdminComm('call')}
                          disabled={isSubmittingComm}
                          className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-extrabold py-2.5 rounded-xl transition cursor-pointer text-xs"
                        >
                          Log Call & Submit to Main Admin
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SUB-ADMIN CALL LOG RECORDS TABLE */}
                  <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl text-left">
                    <h3 className="text-sm font-bold text-white border-b border-[#1f2635] pb-3 mb-4 uppercase tracking-wider">
                      Shared Communication Log Table (मुख्य एडमिन के साथ साझा विवरण)
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left text-gray-400">
                        <thead className="bg-[#0d1017] text-white text-[10px] font-bold uppercase tracking-wider border border-[#1f2635]">
                          <tr>
                            <th className="p-3">Type</th>
                            <th className="p-3">Sender (भेजने वाला)</th>
                            <th className="p-3">Receiver (प्राप्तकर्ता)</th>
                            <th className="p-3">Reason / Message</th>
                            <th className="p-3">Solution / Outcome</th>
                            <th className="p-3">Main Admin Response (मुख्य एडमिन प्रतिक्रिया)</th>
                            <th className="p-3 text-right">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1f2635]">
                          {subAdminComms.map((comm: any) => (
                            <tr key={comm.id} className="hover:bg-[#151922] transition">
                              <td className="p-3 font-extrabold">
                                <span className={`px-2 py-0.5 rounded text-[9px] uppercase ${
                                  comm.type === 'call' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                  {comm.type}
                                </span>
                              </td>
                              <td className="p-3 text-white font-bold">
                                {comm.senderName || 'Sub-Admin'}
                              </td>
                              <td className="p-3 text-gray-300 font-bold uppercase">
                                {comm.receiverId === 'u-admin' ? 'Main Admin (मुख्य एडमिन)' : (comm.receiverName || comm.recipient)}
                              </td>
                              <td className="p-3">
                                {comm.type === 'call' ? comm.callReason || comm.reason : comm.message}
                                {comm.file && (
                                  <a href={comm.file.dataUrl || comm.file.data} download={comm.file.name} className="block text-[10px] text-[#128c7e] font-black mt-1 underline">
                                    📄 Attachment: {comm.file.name} (Download)
                                  </a>
                                )}
                              </td>
                              <td className="p-3 text-emerald-400 italic font-semibold">
                                {comm.type === 'call' ? comm.callOutcome || comm.solution : 'WhatsApp Broadcast Delivered ✓'}
                              </td>
                              <td className="p-3">
                                {comm.adminReply ? (
                                  <div className="bg-emerald-500/10 text-emerald-400 p-2.5 rounded-xl border border-emerald-500/25 max-w-xs">
                                    <span className="text-[8px] font-black uppercase text-emerald-300 block mb-0.5">ADMIN REPLIED ✓</span>
                                    <p className="font-bold italic">"{comm.adminReply}"</p>
                                    {comm.adminReplyTimestamp && (
                                      <span className="text-[7px] text-emerald-400/60 block text-right mt-1">
                                        {new Date(comm.adminReplyTimestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    {user.id === 'u-admin' ? (
                                      <div className="flex flex-col gap-1.5 max-w-xs">
                                        <textarea
                                          rows={1}
                                          placeholder="Enter reply for Sub-Admin..."
                                          value={commReplyTexts[comm.id] || ''}
                                          onChange={(e) => setCommReplyTexts(prev => ({ ...prev, [comm.id]: e.target.value }))}
                                          className="bg-[#0d1017] border border-[#1f2635] focus:border-orange-500 rounded-lg p-1.5 text-xs text-white outline-none placeholder-gray-600 resize-none"
                                        />
                                        <button
                                          onClick={() => handleSendCommReply(comm.id)}
                                          className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black py-1 px-2.5 rounded-lg transition self-end cursor-pointer"
                                        >
                                          Submit Reply
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-gray-600 italic">Awaiting Admin Response</span>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-right text-gray-500 text-[10px] font-bold">
                                {new Date(comm.timestamp || Date.now()).toLocaleDateString()}{' '}
                                {new Date(comm.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </td>
                            </tr>
                          ))}

                          {subAdminComms.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-gray-500 italic">
                                No official communications have been logged today yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STAFF & ADMINISTRATORS DATABASE */}
          {activeTab === 'telecallers' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white">Staff & Administrators Console (स्टाफ और एडमिन)</h2>
                  <p className="text-xs text-gray-400 mt-1">Configure base salaries, track performance, and manage active system administrators securely.</p>
                </div>
                {user.role === 'admin' && (
                  <button
                    onClick={handleResetAll}
                    className="bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 hover:border-red-500/40 text-red-400 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition duration-200 cursor-pointer"
                    title="Reset all active telecaller call performance counts to zero"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset Console to Zero
                  </button>
                )}
              </div>

              {/* Dynamic User Counts Breakdown */}
              {(() => {
                const adminsCount = allUsers.filter(u => u.role === 'admin' || u.role === 'sub-admin').length;
                const telecallersCount = allUsers.filter(u => u.role === 'telecaller').length;
                const techStaffCount = allUsers.filter(u => u.role === 'staff' && u.department === 'Tech').length;
                const nonTechStaffCount = allUsers.filter(u => u.role === 'staff' && u.department === 'NonTech').length;

                const techHeadsCount = allUsers.filter(u => u.role === 'head' && u.department === 'Tech').length;
                const nonTechHeadsCount = allUsers.filter(u => u.role === 'head' && u.department === 'NonTech').length;
                const salesHeadsCount = allUsers.filter(u => u.role === 'head' && u.department === 'Sales').length;
                const totalHeadsCount = techHeadsCount + nonTechHeadsCount + salesHeadsCount;

                return (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 bg-[#111622] border border-[#1f2635] p-5 rounded-2xl">
                    <div className="p-3 bg-[#151922] border border-[#1f2635] rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Administrators</span>
                        <span className="text-xl font-black text-white">{adminsCount} Admins</span>
                      </div>
                      <Shield className="w-7 h-7 text-indigo-400 opacity-80" />
                    </div>

                    <div className="p-3 bg-[#151922] border border-[#1f2635] rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Telecallers</span>
                        <span className="text-xl font-black text-white">{telecallersCount} Callers</span>
                      </div>
                      <Phone className="w-6 h-6 text-[#f97316] opacity-80" />
                    </div>

                    <div className="p-3 bg-[#151922] border border-[#1f2635] rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Tech Staff</span>
                        <span className="text-xl font-black text-white">{techStaffCount} Tech</span>
                      </div>
                      <Briefcase className="w-6 h-6 text-orange-400 opacity-80" />
                    </div>

                    <div className="p-3 bg-[#151922] border border-[#1f2635] rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Non-Tech Staff</span>
                        <span className="text-xl font-black text-white">{nonTechStaffCount} Non-Tech</span>
                      </div>
                      <Clipboard className="w-6 h-6 text-amber-500 opacity-80" />
                    </div>

                    <div className="p-3 bg-[#151922] border border-[#1f2635] rounded-xl flex flex-col justify-between min-h-[76px]">
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Dept Heads</span>
                          <span className="text-xl font-black text-white">{totalHeadsCount} Heads</span>
                        </div>
                        <Users className="w-6 h-6 text-purple-400 opacity-80" />
                      </div>
                      <div className="mt-1 text-[8px] text-gray-400 border-t border-[#1f2635]/60 pt-1 flex flex-wrap gap-x-1 justify-start w-full font-bold">
                        <span className="text-[#38bdf8]">T:{techHeadsCount}</span>
                        <span className="text-gray-600">|</span>
                        <span className="text-[#fb7185]">N:{nonTechHeadsCount}</span>
                        <span className="text-gray-600">|</span>
                        <span className="text-orange-400">S:{salesHeadsCount}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#151922] border border-[#1f2635] rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Main Admin Status</span>
                        <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded mt-1 inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> u-admin
                        </span>
                      </div>
                      <Shield className="w-7 h-7 text-emerald-500 opacity-80" />
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* CONSOLIDATED DIRECTORY COLUMN */}
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e2635] pb-4">
                      <div>
                        <h3 className="font-extrabold text-white text-base">Consolidated Directory (स्टाफ और प्रबंधक)</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">Filter by departments (Tech, Sales, NonTech)</p>
                      </div>
                      
                      {/* Segment Filter buttons */}
                      <div className="flex flex-wrap gap-1">
                        {(['All', 'Tech', 'NonTech', 'Sales'] as const).map(seg => (
                          <button
                            key={seg}
                            onClick={() => setStaffSegmentFilter(seg)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              staffSegmentFilter === seg
                                ? 'bg-[#f97316] text-white'
                                : 'bg-[#151922] border border-[#222b3c] text-gray-400 hover:text-white'
                            }`}
                          >
                            {seg === 'All' ? 'All' : seg}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Search Field */}
                    <div className="relative">
                      <input
                        type="text"
                        value={staffSearchQuery}
                        onChange={(e) => setStaffSearchQuery(e.target.value)}
                        placeholder="🔍 Search staff by name, email, credentials..."
                        className="w-full bg-[#0d1017] border border-[#1f2635] focus:border-[#f97316] text-xs px-3 py-2 rounded-xl text-white outline-none"
                      />
                    </div>

                    {/* Staff List */}
                    <div className="space-y-3">
                      {allUsers.filter(u => {
                        if (user.role === 'head' && u.department !== user.department) return false;
                        const matchesSearch = u.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) || u.email.toLowerCase().includes(staffSearchQuery.toLowerCase());
                        const matchesSegment = staffSegmentFilter === 'All' ? true : u.department === staffSegmentFilter;
                        return matchesSearch && matchesSegment;
                      }).length === 0 ? (
                        <p className="text-xs text-gray-500 italic py-6 text-center">No staff found matching search criteria.</p>
                      ) : (
                        allUsers.filter(u => {
                          if (user.role === 'head' && u.department !== user.department) return false;
                          const matchesSearch = u.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) || u.email.toLowerCase().includes(staffSearchQuery.toLowerCase());
                          const matchesSegment = staffSegmentFilter === 'All' ? true : (u.department === staffSegmentFilter && u.id !== 'u-admin');
                          return matchesSearch && matchesSegment;
                        }).map(emp => {
                          const isMainAdmin = emp.id === 'u-admin';
                          const cleanWhatsApp = (emp.whatsapp || emp.phone || '').replace(/[^0-9]/g, '');
                          return (
                            <div key={emp.id} className="bg-[#0e121a] border border-[#1e2635] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-extrabold text-white text-sm">{emp.name}</span>
                                  {emp.position && (
                                    <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                      {emp.position}
                                    </span>
                                  )}
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                    (emp.role === 'admin' || emp.role === 'sub-admin') ? 'bg-indigo-500/15 text-indigo-400' :
                                    emp.role === 'head' ? 'bg-orange-500/15 text-orange-400' :
                                    emp.role === 'staff' ? 'bg-blue-500/15 text-blue-400' :
                                    'bg-emerald-500/15 text-emerald-400'
                                  }`}>
                                    {emp.role === 'admin' ? (isMainAdmin ? 'Main Admin' : 'Sub Admin') : emp.role === 'sub-admin' ? 'Sub Admin' : emp.role === 'head' ? 'Dept Head' : emp.role}
                                  </span>
                                  {emp.department && !isMainAdmin && emp.role !== 'sub-admin' && emp.role !== 'admin' && (
                                    <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-purple-500/15 text-purple-400">
                                      {emp.department}
                                    </span>
                                  )}
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase ${
                                    emp.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                  }`}>
                                    {emp.status}
                                  </span>
                                </div>
                                <div className="text-gray-400 space-y-0.5">
                                  <p><span className="text-gray-500">Email:</span> {emp.email}</p>
                                  {emp.phone && <p><span className="text-gray-500">Calling Phone:</span> {emp.phone}</p>}
                                  {emp.whatsapp && <p><span className="text-gray-500">WhatsApp Number:</span> {emp.whatsapp}</p>}
                                  {!isMainAdmin && (
                                    <>
                                      <p><span className="text-gray-500">Salary Contract:</span> ₹{Number(emp.salaryBase || 0).toLocaleString()} base / ₹{emp.commissionRate || 0} comm / Target: {emp.monthlyTarget || 5} sales</p>
                                      {emp.dailyWork && (
                                        <p className="text-orange-400 mt-1"><span className="text-gray-500 font-medium">Daily Work:</span> {emp.dailyWork}</p>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 flex-wrap">
                                {emp.phone && (
                                  <>
                                    <a
                                      href={`https://wa.me/${cleanWhatsApp}`}
                                      target="_blank"
                                      referrerPolicy="no-referrer"
                                      className="bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 p-2 rounded-lg transition"
                                      title="WhatsApp Chat"
                                    >
                                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.755.002-2.61-1.01-5.063-2.85-6.906C16.628 2.1 14.183 1.082 12.01 1.082 6.57 1.082 2.146 5.51 2.143 10.894c-.001 1.702.469 3.361 1.361 4.8l-.995 3.637 3.543-.983z"/></svg>
                                    </a>
                                    <a
                                      href={`tel:${emp.phone}`}
                                      className="bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 p-2 rounded-lg transition"
                                      title="Phone Call"
                                    >
                                      <Phone className="w-3.5 h-3.5" />
                                    </a>
                                  </>
                                )}

                                {!isMainAdmin && user.id === 'u-admin' && (
                                  <button
                                    onClick={() => setEditingFullUser(emp)}
                                    className="bg-[#f97316]/10 hover:bg-[#f97316] border border-[#f97316]/20 text-[#f97316] hover:text-white px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                )}

                                {!isMainAdmin && user.id === 'u-admin' && (
                                  <>
                                    <button
                                      onClick={async () => {
                                        try {
                                          const res = await fetch('/api/users/toggle-status', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ userId: emp.id }),
                                          });
                                          if (res.ok) {
                                            showNotification('User status toggled!');
                                            triggerRefresh();
                                          }
                                        } catch (err) {
                                          showNotification('Failed to toggle status', 'error');
                                        }
                                      }}
                                      className={`px-2 py-1.5 rounded-lg font-bold cursor-pointer ${
                                        emp.status === 'active'
                                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      }`}
                                    >
                                      {emp.status === 'active' ? 'Suspend' : 'Active'}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(emp.id)}
                                      className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-1.5 border border-red-500/20 hover:border-red-500/40 rounded-lg transition duration-150 cursor-pointer"
                                      title="Delete Entirely"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: ADD STAFF & ADMIN / SEGMENT BOARD */}
                <div className="space-y-6">
                  {(user.id === 'u-admin' || user.role === 'sub-admin') && (
                    <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl h-fit space-y-4 text-left">
                      <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-[#1e2635] pb-3">
                        <UserPlus className="w-5 h-5 text-[#f97316]" />
                        Add Staff & Admin (स्टाफ/एडमिन जोड़ें)
                      </div>
                      
                      <form onSubmit={handleAddStaffSubmit} className="space-y-3 text-xs">
                        <div>
                          <label className="block text-[10px] text-gray-400 font-bold mb-1">USERNAME (लॉगिन नाम) *</label>
                          <input
                            type="text"
                            required
                            placeholder="Enter login username"
                            value={addStaffName}
                            onChange={(e) => setAddStaffName(e.target.value)}
                            className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-3 py-2 text-white outline-none focus:border-[#f97316]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-400 font-bold mb-1">JOB POSITION (नौकरी का पद - e.g. Designer, Video Editor) *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Designer, Video Editor, Telecaller"
                            value={addStaffPosition}
                            onChange={(e) => setAddStaffPosition(e.target.value)}
                            className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-3 py-2 text-white outline-none focus:border-[#f97316]"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] text-gray-400 font-bold mb-1">EMAIL</label>
                            <input
                              type="email"
                              placeholder="staff@example.com"
                              value={addStaffEmail}
                              onChange={(e) => setAddStaffEmail(e.target.value)}
                              className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-3 py-2 text-white outline-none focus:border-[#f97316]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-400 font-bold mb-1">CALLING PHONE *</label>
                            <input
                              type="text"
                              required
                              placeholder="Calling no"
                              value={addStaffPhone}
                              onChange={(e) => setAddStaffPhone(e.target.value)}
                              className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-3 py-2 text-white outline-none focus:border-[#f97316]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-400 font-bold mb-1">WHATSAPP NO</label>
                            <input
                              type="text"
                              placeholder="WhatsApp no"
                              value={addStaffWhatsapp}
                              onChange={(e) => setAddStaffWhatsapp(e.target.value)}
                              className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-3 py-2 text-white outline-none focus:border-[#f97316]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-gray-400 font-bold mb-1">ROLE (पद) *</label>
                            <select
                              value={addStaffRole}
                              onChange={(e) => {
                                const newRole = e.target.value as any;
                                setAddStaffRole(newRole);
                                if (newRole === 'sub-admin') {
                                  setAddStaffSegment('All');
                                } else if (newRole === 'telecaller') {
                                  setAddStaffSegment('Sales');
                                } else if (newRole === 'head') {
                                  if (!isTechHeadCreated) {
                                    setAddStaffSegment('Tech');
                                  } else if (!isNonTechHeadCreated) {
                                    setAddStaffSegment('NonTech');
                                  } else if (!isSalesHeadCreated) {
                                    setAddStaffSegment('Sales');
                                  } else {
                                    setAddStaffSegment('Tech');
                                  }
                                } else {
                                  setAddStaffSegment('Sales');
                                }
                              }}
                              className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-3 py-2 text-white outline-none focus:border-[#f97316]"
                            >
                              <option value="sub-admin" disabled={isSubAdminCreated || user.role === 'sub-admin'}>
                                Sub-Admin (सब-एडमिन) {(isSubAdminCreated || user.role === 'sub-admin') ? " - Limit Reached (अधिकतम 1)" : ""}
                              </option>
                              <option value="head">Dept Head (विभाग प्रमुख)</option>
                              <option value="staff">Staff (कर्मचारी)</option>
                              <option value="telecaller">Telecaller (टेलीकॉलर)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-400 font-bold mb-1">SEGMENT (विभाग) *</label>
                            <select
                              value={addStaffRole === 'sub-admin' ? 'All' : (addStaffRole === 'telecaller' ? 'Sales' : addStaffSegment)}
                              onChange={(e) => setAddStaffSegment(e.target.value as any)}
                              disabled={addStaffRole === 'sub-admin' || addStaffRole === 'telecaller'}
                              className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-3 py-2 text-white outline-none focus:border-[#f97316] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {addStaffRole === 'sub-admin' ? (
                                <option value="All">All Segments (सभी विभाग - Disabled for Sub-Admin)</option>
                              ) : (
                                <>
                                  <option 
                                    value="Tech" 
                                    disabled={addStaffRole === 'telecaller' || (addStaffRole === 'head' && isTechHeadCreated)}
                                  >
                                    Tech Segment {addStaffRole === 'telecaller' ? " (Disabled)" : (addStaffRole === 'head' && isTechHeadCreated ? " - Head Limit Reached (अधिकतम 1)" : "")}
                                  </option>
                                  <option 
                                    value="NonTech" 
                                    disabled={addStaffRole === 'telecaller' || (addStaffRole === 'head' && isNonTechHeadCreated)}
                                  >
                                    NonTech Segment {addStaffRole === 'telecaller' ? " (Disabled)" : (addStaffRole === 'head' && isNonTechHeadCreated ? " - Head Limit Reached (अधिकतम 1)" : "")}
                                  </option>
                                  <option 
                                    value="Sales" 
                                    disabled={addStaffRole === 'head' && isSalesHeadCreated}
                                  >
                                    Sales Segment {addStaffRole === 'head' && isSalesHeadCreated ? " - Head Limit Reached (अधिकतम 1)" : ""}
                                  </option>
                                </>
                              )}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-400 font-bold mb-1">PASSWORD (पासवर्ड) *</label>
                          <input
                            type="text"
                            required
                            placeholder="Type password"
                            value={addStaffPassword}
                            onChange={(e) => setAddStaffPassword(e.target.value)}
                            className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-[#f97316]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-gray-400 font-bold mb-1">JOINING DATE (ज्वाइनिंग तिथि) *</label>
                            <input
                              type="date"
                              required
                              value={addStaffJoiningDate}
                              onChange={(e) => setAddStaffJoiningDate(e.target.value)}
                              className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-3 py-2 text-white outline-none focus:border-[#f97316]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-400 font-bold mb-1">EMPLOYMENT CODE (कर्मचारी कोड)</label>
                            <input
                              type="text"
                              readOnly
                              placeholder="Auto-generated"
                              value={addStaffEmploymentCode}
                              className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-3 py-2 text-gray-400 font-mono outline-none cursor-not-allowed select-all"
                            />
                          </div>
                        </div>

                        <div className="border-t border-[#1e2635] pt-3 space-y-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">CONTRACT & TARGETS</span>
                          <div className="grid grid-cols-3 gap-1.5">
                            <div>
                              <label className="block text-[8px] text-gray-500 font-bold mb-1">BASE SALARY</label>
                              <input
                                type="number"
                                required
                                value={addStaffSalary}
                                onChange={(e) => setAddStaffSalary(Number(e.target.value))}
                                className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-2 py-1.5 text-white outline-none focus:border-[#f97316]"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] text-gray-500 font-bold mb-1">COMM RATE</label>
                              <input
                                type="number"
                                required
                                disabled={isCommAndTargetDisabled}
                                value={isCommAndTargetDisabled ? 0 : addStaffCommission}
                                onChange={(e) => setAddStaffCommission(Number(e.target.value))}
                                className={`w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-2 py-1.5 text-white outline-none focus:border-[#f97316] ${isCommAndTargetDisabled ? 'opacity-40 cursor-not-allowed select-none' : ''}`}
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] text-gray-500 font-bold mb-1">TARGET (SALES)</label>
                              <input
                                type="number"
                                required
                                disabled={isCommAndTargetDisabled}
                                value={isCommAndTargetDisabled ? 0 : addStaffTarget}
                                onChange={(e) => setAddStaffTarget(Number(e.target.value))}
                                className={`w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-2 py-1.5 text-white outline-none focus:border-[#f97316] ${isCommAndTargetDisabled ? 'opacity-40 cursor-not-allowed select-none' : ''}`}
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-400 font-bold mb-1">DAILY WORK ASSIGNMENT (दैनिक कार्य)</label>
                          <textarea
                            rows={2}
                            placeholder="Describe daily work instructions..."
                            value={addStaffDailyWork}
                            onChange={(e) => setAddStaffDailyWork(e.target.value)}
                            className="w-full bg-[#0d1017] border border-[#1f2635] focus:border-[#f97316] outline-none rounded-xl p-3 text-white"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-black py-2.5 rounded-xl cursor-pointer shadow-lg shadow-orange-500/10"
                        >
                          Register Staff & Assign Work (दर्ज करें)
                        </button>
                      </form>
                    </div>
                  )}

                  {/* SUB-ADMIN DEPT BOARD: RECEIVES DAILY WORK & TARGETS OF THEIR PARTICULAR SEGMENT */}
                  {user.role === 'sub-admin' && (
                    <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl h-fit space-y-4 text-left">
                      <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-[#1e2635] pb-3">
                        <Briefcase className="w-5 h-5 text-orange-400" />
                        <div>
                          <span className="block">{user.department} Segment Work Board</span>
                          <span className="text-[10px] text-gray-400 font-normal">Active Daily Work received & monitored by Sub-Admin</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {allUsers.filter(u => u.department === user.department && u.id !== 'u-admin').length === 0 ? (
                          <p className="text-xs text-gray-500 italic py-4 text-center">No staff found in your {user.department} segment.</p>
                        ) : (
                          allUsers.filter(u => u.department === user.department && u.id !== 'u-admin').map(emp => (
                            <div key={emp.id} className="bg-[#0e121a] border border-[#1f2635] p-3.5 rounded-xl space-y-2 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-white">{emp.name}</span>
                                <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded text-[9px] font-bold uppercase tracking-wide">
                                  {emp.role}
                                </span>
                              </div>
                              <div className="text-gray-400 space-y-1">
                                <p><span className="text-gray-500">Target:</span> {emp.monthlyTarget || 5} sales | <span className="text-gray-500">Base Salary:</span> ₹{Number(emp.salaryBase || 0).toLocaleString()}</p>
                                <div className="p-2.5 bg-[#151922] border border-[#1f2635] rounded-lg mt-1 text-gray-300">
                                  <span className="text-[10px] font-bold text-orange-400 block mb-0.5">Assigned Daily Work:</span>
                                  {emp.dailyWork ? emp.dailyWork : <span className="italic text-gray-500 text-[10px]">No daily work assigned yet.</span>}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* GENERAL HRM SUMMARY CARD (FOR ALL ROLES INCLUDING HEADS) */}
                  <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl h-fit space-y-3 text-left">
                    <div className="flex items-center gap-2 text-white font-bold text-xs">
                      <Shield className="w-4 h-4 text-[#f97316]" />
                      Organizational Governance Rules
                    </div>
                    <ul className="text-[10px] text-gray-400 space-y-1.5 list-disc pl-4">
                      <li>The Main Admin holds absolute authority and does not receive salary.</li>
                      <li>Sub-Admins receive department segment assignments and can review/manage their segment's daily workflow.</li>
                      <li>All passwords and updates are audited under company logs.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LEADS UPLOAD CENTER */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">Leads Upload & Entry Desk</h2>
                <p className="text-xs text-gray-400 mt-1">Upload client sheets via paste CSV or manual input entry</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* MANUAL SINGLE ENTRY */}
                <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#f97316]" /> Single Client Lead Entry
                  </h3>
                  <form onSubmit={handleAddLead} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">NAME *</label>
                      <input 
                        type="text" 
                        required
                        value={singleLead.name}
                        onChange={(e) => setSingleLead(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-4 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">CALLING NUMBER (WITH COUNTRY CODE) *</label>
                      <input 
                        type="text" 
                        required
                        value={singleLead.phone}
                        onChange={(e) => setSingleLead(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="e.g. +919876543210"
                        className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-4 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">WHATSAPP NUMBER (व्हाट्सएप नंबर)</label>
                      <input 
                        type="text" 
                        value={singleLead.whatsapp || ''}
                        onChange={(e) => setSingleLead(prev => ({ ...prev, whatsapp: e.target.value }))}
                        placeholder="e.g. +919876543210"
                        className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-4 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">EMAIL ADDRESS</label>
                      <input 
                        type="email" 
                        value={singleLead.email}
                        onChange={(e) => setSingleLead(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="e.g. ramesh@example.com"
                        className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-4 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">REQUIREMENTS / PRODUCTS</label>
                      <textarea 
                        value={singleLead.requirements}
                        onChange={(e) => setSingleLead(prev => ({ ...prev, requirements: e.target.value }))}
                        placeholder="e.g. Wants catalog of wedding cardboard templates"
                        rows={3}
                        className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-4 py-2 text-sm resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">ASSIGN IMMEDIATE TO TELECALLER</label>
                      <select 
                        value={singleLead.assignedTo}
                        onChange={(e) => setSingleLead(prev => ({ ...prev, assignedTo: e.target.value }))}
                        className="w-full bg-[#0e121a] text-white border border-[#222b3c] rounded-xl px-4 py-2 text-sm outline-none"
                      >
                        <option value="">Leave Unassigned</option>
                        {telecallers.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                    >
                      Add & Save Client Lead
                    </button>
                  </form>
                </div>

                {/* CSV MASS IMPORT WITH REAL FILE SELECTOR */}
                <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Upload className="w-4 h-4 text-[#f97316]" /> Bulk Excel / CSV Upload Desk
                  </h3>
                  <div className="space-y-4">
                    {/* Visual File Selector */}
                    <div className="border-2 border-dashed border-[#1f2635] hover:border-[#f97316] bg-[#0e121a] rounded-2xl p-6 text-center transition cursor-pointer relative group">
                      <input
                        type="file"
                        accept=".csv"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            const text = evt.target?.result as string;
                            setCsvContent(text);
                            showNotification('Excel CSV File loaded! Click Parse below to import.');
                          };
                          reader.readAsText(file);
                        }}
                      />
                      <Upload className="w-8 h-8 text-[#f97316] mx-auto mb-2 animate-pulse group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-white block mb-1">Select / Drag .CSV Lead Sheet File</span>
                      <span className="text-[10px] text-gray-500">Supports standard UTF-8 Microsoft Excel saved .CSV sheets</span>
                    </div>

                    <form onSubmit={handleCsvImport} className="space-y-4">
                      <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">
                        CSV Preview / Paste Editor
                      </label>
                      <textarea 
                        value={csvContent}
                        onChange={(e) => setCsvContent(e.target.value)}
                        placeholder="name, phone, whatsapp, email, requirements&#10;Suresh Kumar, +919876543210, +919876543210, suresh@gmail.com, Needs cardboard boxes&#10;Deepak Dev, +918123456789, +918123456789, deepak@gmail.com, Inquiring printing prices"
                        rows={5}
                        className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-4 py-3 text-xs font-mono resize-none"
                      />

                      <button 
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                      >
                        Parse & Import Uploaded Leads
                      </button>
                    </form>
                  </div>
                </div>

              </div>

              {/* CLEAR EXPLICIT UPLOAD INSTRUCTIONS */}
              <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-2xl space-y-3">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  ℹ️ CSV / Excel Lead Upload Instruction Guide
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-400 leading-relaxed">
                  <div className="bg-[#0e121a] p-4 rounded-xl border border-[#1f2635] space-y-1.5">
                    <span className="font-extrabold text-white block text-xs">1. Setup Column Headers</span>
                    <p>The first line of your CSV sheet must contain column names. The headers are case-insensitive and can be placed in any order:</p>
                    <code className="text-orange-400 block mt-1 font-mono text-[10px] bg-[#111622] p-1 rounded">name, phone, email, requirements</code>
                  </div>
                  <div className="bg-[#0e121a] p-4 rounded-xl border border-[#1f2635] space-y-1.5">
                    <span className="font-extrabold text-white block text-xs">2. Format Rules</span>
                    <p>Ensure that phone numbers contain proper country codes (e.g. +91 or 91 for India). Avoid inserting special symbol brackets or spaces inside numbers to ensure WhatsApp dialers trigger seamlessly.</p>
                  </div>
                  <div className="bg-[#0e121a] p-4 rounded-xl border border-[#1f2635] space-y-1.5">
                    <span className="font-extrabold text-white block text-xs">3. Download Template</span>
                    <p>For immediate testing, download our compliant spreadsheet layout. Simply save your Excel workbook as an ".CSV" format before uploading.</p>
                    <a
                      href="/api/backups/download"
                      className="text-[#f97316] hover:underline block font-bold mt-1 text-[11px]"
                    >
                      Download Compliant Demo CSV Template ➡️
                    </a>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: ACTIVE LEADS DATABASE */}
          {activeTab === 'leads' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white">Active Leads Central Registry</h2>
                  <p className="text-xs text-gray-400 mt-1">Assign unallocated client leads to telecallers singly or in bulk</p>
                </div>
                
                {/* BULK ACTIONS PANEL */}
                {selectedLeads.length > 0 && (
                  <div className="bg-[#111622] border border-orange-500/30 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in">
                    <span className="text-xs text-orange-400 font-bold">
                      {selectedLeads.length} Selected
                    </span>
                    <select 
                      value={bulkAssignUser}
                      onChange={(e) => setBulkAssignUser(e.target.value)}
                      className="bg-[#0e121a] text-white border border-[#222b3c] rounded px-3 py-1.5 text-xs outline-none"
                    >
                      <option value="">Choose Telecaller...</option>
                      <option value="unassign">Unassign leads</option>
                      {telecallers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button 
                      onClick={handleBulkAssign}
                      className="bg-[#f97316] hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                    >
                      Execute Assignment
                    </button>
                  </div>
                )}
              </div>

              {/* LEADS LIST REGISTRY */}
              <div className="bg-[#111622] border border-[#1f2635] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1f2635] bg-[#0d1017]">
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 w-12">
                          <input 
                            type="checkbox"
                            checked={selectedLeads.length === leads.length && leads.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedLeads(leads.map(l => l.id));
                              else setSelectedLeads([]);
                            }}
                            className="rounded accent-orange-500"
                          />
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400">CLIENT INFO</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400">CONTACT DETAILS</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400">STATUS</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400">ASSIGNED CALLER</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400">LATEST CALL STATUS</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 text-center">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f2635]">
                      {leads.map(lead => (
                        <tr key={lead.id} className="hover:bg-[#151922] transition-colors text-sm">
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="checkbox"
                              checked={selectedLeads.includes(lead.id)}
                              onChange={() => toggleSelectLead(lead.id)}
                              className="rounded accent-orange-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-white">{lead.name}</div>
                            <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={lead.requirements}>
                              {lead.requirements}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 text-gray-200 font-medium">
                              <span>📞 {lead.phone}</span>
                            </div>
                            {lead.whatsapp && (
                              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                                <span>💬 {lead.whatsapp}</span>
                              </div>
                            )}
                            {lead.email && <div className="text-gray-500">{lead.email}</div>}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              lead.status === 'New' ? 'bg-blue-500/10 text-blue-400' :
                              lead.status === 'Interested' ? 'bg-emerald-500/10 text-emerald-400' :
                              lead.status === 'Spoke' ? 'bg-orange-500/10 text-orange-400' :
                              'bg-red-500/10 text-red-400'
                            }`}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={lead.assignedTo || ''}
                              onChange={(e) => handleAssignLead(lead.id, e.target.value)}
                              className="bg-[#0e121a] text-white border border-[#222b3c] rounded px-2 py-1 text-xs outline-none w-full max-w-[150px]"
                            >
                              <option value="">-- Unassigned --</option>
                              {telecallers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                            {lead.assignedByAdminName && (
                              <div className="text-[10px] text-[#f97316] font-semibold mt-1 leading-tight">
                                By: {lead.assignedByAdminName}
                                {lead.assignedAt && (
                                  <span className="text-[9px] text-gray-500 font-normal block mt-0.5">
                                    on {new Date(lead.assignedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-400">
                            {lead.lastCalled ? new Date(lead.lastCalled).toLocaleString() : 'Never Called'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center gap-1.5 justify-center">
                              <button
                                onClick={() => setViewingJourneyLead(lead)}
                                className="bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/40 text-[#f97316] px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                                title="Audit Lead Journey Timeline"
                              >
                                📈 Journey
                              </button>
                              <button
                                onClick={() => handleDeleteLead(lead.id)}
                                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 p-2 rounded-lg transition cursor-pointer"
                                title="Delete Lead"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {leads.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-xs">
                            No client leads found in registry database. Use Leads Upload Center to add some!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RECORDED CALL LOGS */}
          {activeTab === 'recordings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">Call Recording Logs</h2>
                <p className="text-xs text-gray-400 mt-1">Listen to automatic speech audio saved securely on the cloud server</p>
              </div>

              <div className="bg-[#111622] border border-[#1f2635] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#1f2635] bg-[#0d1017]">
                        <th className="px-6 py-4 text-xs font-bold text-gray-400">CLIENT INFO</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400">TELECALLER</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400">CALL STATUS</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400">DURATION</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400">TIMESTAMP</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 text-center">PLAYBACK & ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f2635] text-sm">
                      {callLogs.map(log => (
                        <tr key={log.id} className="hover:bg-[#151922] transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-white">{log.leadName}</div>
                            <div className="text-xs text-gray-500 mt-1">{log.leadPhone}</div>
                            {log.notes && (
                              <div className="mt-1 bg-[#0e121a] text-gray-400 text-xs px-2.5 py-1.5 rounded-lg italic">
                                "{log.notes}"
                              </div>
                            )}

                            {/* Admin feedback input / display segment */}
                            <div className="mt-2.5 p-3 rounded-xl bg-[#0b0e14] border border-[#1f2635] space-y-2.5">
                              <label className="text-[9px] font-bold text-gray-500 block uppercase tracking-wider">
                                Daily Feedback & Questions Segment (फीडबैक / सवाल)
                              </label>
                              
                              {log.adminFeedback ? (
                                <div className="space-y-1">
                                  <div className="text-xs text-[#f97316] font-medium bg-orange-500/5 px-2.5 py-1.5 rounded border border-orange-500/10 italic">
                                    "{log.adminFeedback}"
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[8px] font-extrabold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/15 uppercase">
                                      🎯 Target User: {log.feedbackTarget ? log.feedbackTarget.toUpperCase() : 'TELECALLER'}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500 italic">No feedback submitted yet.</div>
                              )}

                              {/* SUBMIT FEEDBACK FORM WITH DROPDOWN */}
                              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                <select
                                  id={`feedback-target-${log.id}`}
                                  defaultValue={log.feedbackTarget || 'telecaller'}
                                  className="bg-[#111622] text-white border border-[#222b3c] focus:border-[#f97316] text-[11px] px-2 py-1 rounded outline-none cursor-pointer"
                                >
                                  <option value="telecaller">Telecaller (टेलीकॉलर)</option>
                                  <option value="head">Sales Head (सेल्स हेड)</option>
                                  <option value="sub-admin">Sub-Admin (सब-एडमिन)</option>
                                </select>
                                <input
                                  type="text"
                                  placeholder="Ask question or give advice..."
                                  id={`feedback-input-${log.id}`}
                                  defaultValue={log.adminFeedback || ''}
                                  className="bg-[#111622] text-white border border-[#222b3c] focus:border-[#f97316] text-xs px-2.5 py-1 rounded outline-none flex-1"
                                />
                                <button
                                  onClick={() => {
                                    const val = (document.getElementById(`feedback-input-${log.id}`) as HTMLInputElement)?.value;
                                    const tgt = (document.getElementById(`feedback-target-${log.id}`) as HTMLSelectElement)?.value || 'telecaller';
                                    handleSaveCallFeedback(log.id, val, tgt);
                                  }}
                                  className="bg-[#f97316] hover:bg-orange-600 text-white font-extrabold text-[10px] px-3 py-1 rounded transition cursor-pointer shrink-0"
                                >
                                  Save Question
                                </button>
                              </div>

                              {/* DISCUSSION THREAD / REPLIES */}
                              {log.feedbackReplies && log.feedbackReplies.length > 0 && (
                                <div className="pt-2 border-t border-gray-800 space-y-1.5">
                                  <span className="text-[8px] font-black text-gray-400 block uppercase tracking-wider">Discussion History:</span>
                                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                                    {log.feedbackReplies.map((reply: any, rIdx: number) => (
                                      <div key={rIdx} className="bg-[#0e121a] p-2 rounded border border-gray-800/40 text-[11px]">
                                        <div className="flex justify-between text-[9px] font-bold text-gray-500 mb-0.5">
                                          <span className="text-orange-400">{reply.senderName} ({reply.senderRole === 'admin' ? 'Admin' : reply.senderRole})</span>
                                          <span>{new Date(reply.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-gray-300 font-medium">{reply.text}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* QUICK REPLY BOX FOR DISCUSSION */}
                              <div className="pt-2 border-t border-gray-800/40 flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Type reply or explanation here..."
                                  id={`admin-reply-input-${log.id}`}
                                  className="bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] text-[11px] px-2 py-1 rounded outline-none flex-1"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const val = (document.getElementById(`admin-reply-input-${log.id}`) as HTMLInputElement)?.value;
                                      handleSaveCallReply(log.id, val);
                                      (document.getElementById(`admin-reply-input-${log.id}`) as HTMLInputElement).value = '';
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    const val = (document.getElementById(`admin-reply-input-${log.id}`) as HTMLInputElement)?.value;
                                    handleSaveCallReply(log.id, val);
                                    (document.getElementById(`admin-reply-input-${log.id}`) as HTMLInputElement).value = '';
                                  }}
                                  className="bg-[#1e2535] border border-gray-800 hover:border-gray-600 text-gray-300 font-bold text-[10px] px-3 py-1 rounded transition cursor-pointer"
                                >
                                  Reply
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-gray-200">{log.telecallerName}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              log.status === 'Interested' ? 'bg-emerald-500/10 text-emerald-400' :
                              log.status === 'Spoke' ? 'bg-orange-500/10 text-orange-400' :
                              'bg-red-500/10 text-red-400'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-300">
                            {log.duration}s
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center gap-2 justify-center">
                              {log.hasRecording ? (
                                <button
                                  onClick={() => handlePlayRecording(log.id)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                                    playingAudioId === log.id 
                                      ? 'bg-orange-500 text-white' 
                                      : 'bg-[#1e2535] text-[#f97316] hover:bg-[#28324a]'
                                  }`}
                                >
                                  {playingAudioId === log.id ? (
                                    <>
                                      <Pause className="w-3.5 h-3.5 fill-white" />
                                      Playing
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-3.5 h-3.5 fill-[#f97316]" />
                                      Play
                                    </>
                                  )}
                                </button>
                              ) : (
                                <span className="text-xs text-gray-600 font-medium italic">No Audio</span>
                              )}

                              {user.id === 'u-admin' && (
                                <button
                                  onClick={() => handleDeleteCallLog(log.id)}
                                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 p-2 rounded-lg transition cursor-pointer"
                                  title="Delete call log (Main Admin Only)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {callLogs.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-xs">
                            No call logs have been recorded in this session yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PASSWORD RESETS */}
          {activeTab === 'resets' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">Security & Password Administration (सुरक्षा एवं पासवर्ड)</h2>
                <p className="text-xs text-gray-400 mt-1">Reset staff passwords, manage login GPS bypass authority, or configure administrator profiles.</p>
              </div>

              {/* LOGIN GPS BYPASS AUTHORITY REQUESTS CARD */}
              <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="text-[#f97316] w-5 h-5 animate-pulse" />
                      Login GPS Bypass Requests (लॉगिन जीपीएस बायपास अनुरोध सूची)
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Staff members requesting login access from outside the office GPS perimeter, or PC users undergoing security timing check.
                    </p>
                  </div>
                  <span className="text-xs bg-[#f97316]/15 text-[#f97316] border border-orange-500/20 px-2.5 py-1 rounded-full font-bold">
                    {loginAuthorityRequests.filter(r => r.status === 'pending').length} Pending Requests
                  </span>
                </div>

                <div className="overflow-x-auto">
                  {loginAuthorityRequests.length === 0 ? (
                    <div className="text-xs text-gray-500 italic py-8 text-center bg-[#0e121a] border border-[#1f2635] rounded-xl">
                      No GPS bypass or PC login authority requests logged yet.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#1f2635] text-gray-400 font-bold">
                          <th className="py-2.5 px-3">Name / Username</th>
                          <th className="py-2.5 px-3">Device Type</th>
                          <th className="py-2.5 px-3">GPS Distance</th>
                          <th className="py-2.5 px-3">Bypass Reason</th>
                          <th className="py-2.5 px-3">Requested At</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loginAuthorityRequests.map((req) => (
                          <tr key={req.id} className="border-b border-[#1f2635]/50 hover:bg-[#0e121a]/50">
                            <td className="py-3 px-3 font-bold text-white text-sm">{req.name}</td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                req.deviceType === 'pc'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {req.deviceType === 'pc' ? '💻 PC User' : '📱 Mobile'}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-gray-300">
                              {req.distance ? `${req.distance.toFixed(1)} meters` : 'N/A'}
                            </td>
                            <td className="py-3 px-3 text-gray-300 italic max-w-xs truncate" title={req.reason}>
                              {req.reason}
                            </td>
                            <td className="py-3 px-3 text-gray-400">
                              {req.timestamp ? new Date(req.timestamp).toLocaleString() : 'N/A'}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                                req.status === 'approved'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : req.status === 'rejected'
                                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                  : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 animate-pulse'
                              }`}>
                                {req.status === 'approved' ? 'Approved' : req.status === 'rejected' ? 'Rejected' : 'Pending'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                              {req.status === 'pending' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveGps(req.id, true)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-1 rounded transition cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveGps(req.id, false)}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] px-2.5 py-1 rounded transition cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteGps(req.id)}
                                className="bg-[#181f30] hover:bg-red-950/40 border border-gray-700 hover:border-red-500/30 text-gray-400 hover:text-red-400 font-bold text-[10px] p-1 rounded transition cursor-pointer"
                                title="Delete Request"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* PENDING PASSWORD RESET REQUESTS QUEUE */}
                <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Key className="w-4 h-4 text-[#f97316]" /> Password Reset Requests (पासवर्ड अनुरोध सूची)
                  </h3>
                  <p className="text-xs text-gray-400">
                    Approved recovery requests authorize you to assign a secure new password for sub-admins or staff.
                  </p>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {recoveryRequests.filter(r => r.status === 'pending').length === 0 ? (
                      <div className="text-xs text-gray-500 italic py-8 text-center bg-[#0e121a] border border-[#1f2635] rounded-xl">
                        No pending password recovery requests.
                      </div>
                    ) : (
                      recoveryRequests.filter(r => r.status === 'pending').map(req => {
                        const currentPwd = resolvePasswords[req.id] || '';
                        return (
                          <div key={req.id} className="bg-[#0e121a] border border-[#1f2635] p-4 rounded-xl space-y-3 text-xs">
                            <div className="flex justify-between items-start flex-wrap gap-2 text-left">
                              <div>
                                <span className="font-extrabold text-white text-sm block">{req.name}</span>
                                <span className="text-[10px] text-gray-400 block uppercase tracking-wider mt-0.5">
                                  Role: {req.role} | Dept: {req.department}
                                </span>
                                <span className="text-[10px] text-gray-500 block">
                                  Requested on: {new Date(req.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <span className="bg-yellow-500/15 border border-yellow-500/30 text-yellow-500 px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                                PENDING REQUEST
                              </span>
                            </div>

                            <div className="flex gap-2 text-left">
                              <input
                                type="text"
                                placeholder="Assign New Password (नया पासवर्ड लिखें)"
                                value={currentPwd}
                                onChange={(e) => {
                                  setResolvePasswords(prev => ({ ...prev, [req.id]: e.target.value }));
                                }}
                                className="w-full bg-[#090b11] text-white border border-[#1f2635] focus:border-[#f97316] outline-none rounded-lg px-3 py-1.5 text-xs font-mono"
                              />
                            </div>

                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!currentPwd.trim()) {
                                    showNotification('Please enter or generate a new password first!', 'error');
                                    return;
                                  }
                                  try {
                                    const res = await fetch('/api/auth/resolve-recovery', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'x-user-role': user.role,
                                        'x-user-id': user.id
                                      },
                                      body: JSON.stringify({ requestId: req.id, newPassword: currentPwd, action: 'approve' })
                                    });
                                    const data = await res.json();
                                    if (res.ok) {
                                      showNotification('Password resolved and assigned successfully!');
                                      setResolvePasswords(prev => {
                                        const copy = { ...prev };
                                        delete copy[req.id];
                                        return copy;
                                      });
                                      triggerRefresh();
                                    } else {
                                      showNotification(data.error || 'Failed to approve request', 'error');
                                    }
                                  } catch (err) {
                                    showNotification('Connection error', 'error');
                                  }
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition cursor-pointer"
                              >
                                Approve & Assign
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/auth/resolve-recovery', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'x-user-role': user.role,
                                        'x-user-id': user.id
                                      },
                                      body: JSON.stringify({ requestId: req.id, action: 'reject' })
                                    });
                                    if (res.ok) {
                                      showNotification('Password recovery request rejected');
                                      triggerRefresh();
                                    } else {
                                      showNotification('Failed to reject request', 'error');
                                    }
                                  } catch (err) {
                                    showNotification('Connection error', 'error');
                                  }
                                }}
                                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold px-3 py-1.5 rounded-lg text-[10px] transition cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* FORM 2: UPDATE MAIN ADMIN PROFILE */}
                <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#f97316]" /> Update Main Admin Profile (मुख्य एडमिन प्रोफाइल)
                  </h3>
                  
                  <form onSubmit={handleUpdateAdminProfile} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">ADMIN NAME (एडमिन का नाम)</label>
                      <input 
                        type="text" 
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Admin name"
                        className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-4 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">ADMIN EMAIL (ईमेल पता)</label>
                      <input 
                        type="email" 
                        required
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        placeholder="admin@example.com"
                        className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-4 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">CALLING NUMBER (कॉलिंग नंबर)</label>
                      <input 
                        type="text" 
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="Calling phone number"
                        className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-4 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">WHATSAPP NUMBER (व्हाट्सएप नंबर)</label>
                      <input 
                        type="text" 
                        value={profileWhatsapp}
                        onChange={(e) => setProfileWhatsapp(e.target.value)}
                        placeholder="WhatsApp number"
                        className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-4 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">UPDATE PASSWORD (पासवर्ड बदलें)</label>
                      <input 
                        type="password" 
                        value={profilePassword}
                        onChange={(e) => setProfilePassword(e.target.value)}
                        placeholder="Type secure new password"
                        className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-4 py-2 text-sm"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                    >
                      Save Admin Profile
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}

          {/* TAB 7: PAYROLL INTEGRATION */}
          {activeTab === 'payroll' && (() => {
            const getMonthLabel = (m: string) => {
              const labels: { [key: string]: string } = {
                '01': 'January (जनवरी)',
                '02': 'February (फ़रवरी)',
                '03': 'March (मार्च)',
                '04': 'April (अप्रैल)',
                '05': 'May (मई)',
                '06': 'June (जून)',
                '07': 'July (जुलाई)',
                '08': 'August (अगस्त)',
                '09': 'September (सितंबर)',
                '10': 'October (अक्टूबर)',
                '11': 'November (नवंबर)',
                '12': 'December (दिसंबर)'
              };
              return labels[m] || m;
            };

            const payrollUsers = (payrollReport || [])
              .map((rep: any) => ({
                ...rep,
                id: rep.userId, // Map userId to id for component compatibility
              }))
              .filter((u: any) => {
                if (user.role === 'head' && user.department) {
                  if (u.department !== user.department) return false;
                }
                const allowedRoles = ['sub-admin', 'head', 'staff', 'telecaller'];
                return allowedRoles.includes(u.role) && u.id !== 'u-admin';
              });

            const grandTotalSalary = payrollUsers.reduce((sum, caller) => {
              return sum + (caller.finalSalary || 0);
            }, 0);

            const currentYear = selectedPayrollMonth.slice(0, 4);
            const currentMonth = selectedPayrollMonth.slice(5, 7);

            return (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-white">Staff Payroll & Auditing</h2>
                    <p className="text-xs text-gray-400 mt-1">Calculate real-time monthly payout totals based on calling achievements</p>
                  </div>

                  {/* Month/Year selector for Admin */}
                  <div className="bg-[#111622] border border-[#1f2635] p-3.5 rounded-2xl flex items-center gap-3 self-start sm:self-center">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-gray-400 font-bold mb-1 uppercase">Select Month (महीना)</span>
                      <select
                        value={currentMonth}
                        onChange={(e) => {
                          setSelectedPayrollMonth(`${currentYear}-${e.target.value}`);
                        }}
                        className="bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer"
                      >
                        <option value="01">January (जनवरी)</option>
                        <option value="02">February (फ़रवरी)</option>
                        <option value="03">March (मार्च)</option>
                        <option value="04">April (अप्रैल)</option>
                        <option value="05">May (मई)</option>
                        <option value="06">June (जून)</option>
                        <option value="07">July (जुलाई)</option>
                        <option value="08">August (अगस्त)</option>
                        <option value="09">September (सितंबर)</option>
                        <option value="10">October (अक्टूबर)</option>
                        <option value="11">November (नवंबर)</option>
                        <option value="12">December (दिसंबर)</option>
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-gray-400 font-bold mb-1 uppercase">Select Year (साल)</span>
                      <select
                        value={currentYear}
                        onChange={(e) => {
                          setSelectedPayrollMonth(`${e.target.value}-${currentMonth}`);
                        }}
                        className="bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer"
                      >
                        {Array.from({ length: 7 }, (_, i) => 2024 + i).map(yr => (
                          <option key={yr} value={String(yr)}>{yr}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111622] border border-[#1f2635] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#1f2635] bg-[#0d1017]">
                          <th className="px-6 py-4 text-xs font-bold text-gray-400">STAFF NAME</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400">BASE MONTHLY SALARY</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400">COMMISSION CONTRACT RATE</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400">INTERESTED CONVERSIONS</th>
                          <th className="px-6 py-4 text-xs font-bold text-orange-400">TOTAL MONTHLY SALARY OUTSTANDING</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400">PAYOUT ACCURACY / STATUS</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 text-center">PAYROLL ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1f2635] text-sm">
                        {payrollUsers.map(caller => {
                          const isSalesOrCaller = caller.role === 'telecaller' || caller.department === 'Sales';
                          
                          return (
                            <tr key={caller.id} className="hover:bg-[#151922]">
                              <td className="px-6 py-4">
                                <div className="font-bold text-white flex flex-col gap-0.5">
                                  <span className="text-sm font-bold text-white">{caller.name}</span>
                                  {caller.position && (
                                    <span className="text-[10px] text-[#f97316] font-semibold uppercase tracking-wider">
                                      💼 {caller.position}
                                    </span>
                                  )}
                                  <span className="text-[11px] text-gray-400 capitalize">
                                    Role: {caller.role} {caller.department ? `(${caller.department})` : ''}
                                  </span>
                                  {caller.joiningDate && (
                                    <span className="text-[10px] text-gray-500 font-medium">
                                      Joined: {(() => {
                                        const parts = caller.joiningDate.split('-');
                                        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                                        return caller.joiningDate;
                                      })()}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">{caller.email}</div>
                              </td>
                              <td className="px-6 py-4 text-gray-300">₹{caller.salaryBase || 0}</td>
                              <td className="px-6 py-4">
                                {isSalesOrCaller ? (
                                  <span className="text-[#f97316] font-bold bg-[#f97316]/10 border border-[#f97316]/20 px-2 py-1 rounded text-xs">
                                    ₹{caller.commissionRate || 0} / lead
                                  </span>
                                ) : (
                                  <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded text-xs">
                                    ₹{caller.commissionRate || 0} / task
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {isSalesOrCaller ? (
                                  <span className="text-emerald-400 font-bold">{caller.interestedCount || 0} leads</span>
                                ) : (
                                  <span className="text-emerald-400 font-bold">{caller.approvedTasks || 0} / {caller.totalTasks || 0} tasks approved</span>
                                )}
                              </td>
                              <td className="px-6 py-4 font-black text-[#f97316] text-base">
                                ₹{caller.finalSalary || 0}
                                {caller.override?.forceFullSalary && (
                                  <div className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold w-fit mt-1">
                                    OVERRIDE: FULL PAY
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {caller.isReleased ? (
                                  <span className="text-emerald-500 font-bold text-xs flex items-center gap-1 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/15 w-fit">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                    PAID / RELEASED
                                  </span>
                                ) : (
                                  <span className="text-amber-500 font-bold text-xs flex items-center gap-1 bg-amber-500/5 px-2 py-1 rounded border border-amber-500/15 w-fit">
                                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                                    PENDING RELEASE
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex gap-2 justify-center items-center">
                                  {!caller.isReleased ? (
                                    <button
                                      onClick={() => handleReleaseSalary(caller.id, caller.finalSalary)}
                                      className="bg-[#f97316] hover:bg-orange-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition cursor-pointer"
                                    >
                                      💵 Release Payout
                                    </button>
                                  ) : (
                                    <span className="text-xs text-emerald-400 font-semibold italic bg-emerald-500/5 border border-emerald-500/10 px-2 py-1 rounded-lg">Released</span>
                                  )}
                                  <button
                                    onClick={() => handleResetPerformance(caller.id)}
                                    className="bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/40 text-[#f97316] font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                                    title="Reset performance data to zero"
                                  >
                                    Reset to Zero
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(caller.id)}
                                    className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 p-2 rounded-lg transition cursor-pointer"
                                    title="Delete User Entirely"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {payrollUsers.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-xs">
                              No staff members in registry to compute payroll calculations.
                            </td>
                          </tr>
                        )}
                        {/* Grand Total Row at bottom */}
                        {payrollUsers.length > 0 && (
                          <tr className="bg-[#0d1017] font-black border-t-2 border-[#1f2635]">
                            <td colSpan={4} className="px-6 py-5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                              GRAND TOTAL OF SALARY ({getMonthLabel(currentMonth)} {currentYear}) :
                            </td>
                            <td colSpan={3} className="px-6 py-5 text-left text-lg text-orange-400 font-extrabold">
                              ₹{grandTotalSalary.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB: HRM MANAGEMENT */}
          {activeTab === 'hrm' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">HRM Management (एचआरएम)</h2>
                <p className="text-xs text-gray-400 mt-1">Manage employee attendance, leave permissions, and detailed salary structures</p>
              </div>

              {/* Sub tabs */}
              <div className="flex flex-wrap border-b border-[#1f2635] gap-6">
                <button
                  onClick={() => setHrmSubTab('leaves')}
                  className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
                    hrmSubTab === 'leaves' ? 'text-[#f97316]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Leave Requests (छुट्टियां)
                  {hrmSubTab === 'leaves' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f97316]"></span>}
                </button>
                <button
                  onClick={() => setHrmSubTab('attendance')}
                  className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
                    hrmSubTab === 'attendance' ? 'text-[#f97316]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Attendance Logs (हाजिरी रजिस्टर)
                  {hrmSubTab === 'attendance' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f97316]"></span>}
                </button>
                <button
                  onClick={() => setHrmSubTab('tasks')}
                  className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
                    hrmSubTab === 'tasks' ? 'text-[#f97316]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Daily Work Tasks (दैनिक कार्य)
                  {hrmSubTab === 'tasks' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f97316]"></span>}
                </button>
                <button
                  onClick={() => setHrmSubTab('holidays')}
                  className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
                    hrmSubTab === 'holidays' ? 'text-[#f97316]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Company Holidays (सार्वजनिक अवकाश)
                  {hrmSubTab === 'holidays' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f97316]"></span>}
                </button>
                <button
                  onClick={() => setHrmSubTab('payroll_audit')}
                  className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
                    hrmSubTab === 'payroll_audit' ? 'text-[#f97316]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Attendance-Based Payroll Audits (सैलरी गणना)
                  {hrmSubTab === 'payroll_audit' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f97316]"></span>}
                </button>
                <button
                  onClick={() => setHrmSubTab('salary_rules')}
                  className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
                    hrmSubTab === 'salary_rules' ? 'text-[#f97316]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Salary Criteria Rules (सैलरी मापदंड नियम)
                  {hrmSubTab === 'salary_rules' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f97316]"></span>}
                </button>
                {user.id !== 'u-admin' && (
                  <button
                    onClick={() => setHrmSubTab('my_salary_slip')}
                    className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
                      hrmSubTab === 'my_salary_slip' ? 'text-[#f97316]' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    My Salary Slip (मेरा सैलरी स्लिप)
                    {hrmSubTab === 'my_salary_slip' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f97316]"></span>}
                  </button>
                )}
              </div>

              {/* HRM Sub-tab content */}
              {hrmSubTab === 'leaves' && (
                <div className="space-y-6">
                  {/* Leave Application form for secondary admins */}
                  {user.id !== 'u-admin' && (
                    <div className="bg-[#111622] border border-[#1f2635] rounded-2xl p-6 space-y-4">
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Apply for Leave (छुट्टी के लिए आवेदन करें)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={leaveStartDate}
                            onChange={(e) => setLeaveStartDate(e.target.value)}
                            className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">End Date</label>
                          <input
                            type="date"
                            value={leaveEndDate}
                            onChange={(e) => setLeaveEndDate(e.target.value)}
                            className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Reason for Leave (स्पष्ट कारण लिखें)</label>
                        <textarea
                          rows={3}
                          value={leaveReason}
                          onChange={(e) => setLeaveReason(e.target.value)}
                          placeholder="Please mention the exact reason for leave..."
                          className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl p-4 text-xs text-white outline-none focus:border-[#f97316]"
                        />
                      </div>
                      <button
                        onClick={async () => {
                          if (!leaveReason || !leaveStartDate || !leaveEndDate) {
                            showNotification("Please fill in all leave form parameters", "error");
                            return;
                          }
                          try {
                            const res = await fetch('/api/leaves/apply', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ userId: user.id, reason: leaveReason, startDate: leaveStartDate, endDate: leaveEndDate })
                            });
                            const data = await res.json();
                            if (res.ok) {
                              showNotification("Leave request submitted! Pending main admin approval.");
                              setLeaveReason('');
                              setLeaveStartDate('');
                              setLeaveEndDate('');
                              triggerRefresh();
                            } else {
                              showNotification(data.error || "Failed to apply", "error");
                            }
                          } catch (err) {
                            showNotification("Server communication error", "error");
                          }
                        }}
                        className="bg-[#f97316] hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs cursor-pointer"
                      >
                        Submit Leave Application (आवेदन भेजें)
                      </button>
                    </div>
                  )}

                  {/* Leave approval board (visible to main admin or as summary for secondary) */}
                  <div className="bg-[#111622] border border-[#1f2635] rounded-2xl p-6">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">
                      {user.id === 'u-admin' ? "Leave Applications Board" : "Your Leave Statuses"}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-[#1f2635] text-xs text-gray-400">
                            <th className="pb-3">APPLICANT</th>
                            <th className="pb-3">ROLE</th>
                            <th className="pb-3">DATES</th>
                            <th className="pb-3">DAYS</th>
                            <th className="pb-3">REASON</th>
                            <th className="pb-3 text-center">STATUS</th>
                            {user.id === 'u-admin' && <th className="pb-3 text-center">ACTIONS</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1f2635] text-xs text-gray-300">
                          {leaveApplications
                            .filter(l => user.id === 'u-admin' || l.userId === user.id)
                            .map(leave => (
                              <tr key={leave.id} className="hover:bg-[#151922] align-top">
                                <td className="py-3 font-bold text-white">{leave.userName}</td>
                                <td className="py-3 uppercase text-[10px] text-gray-400">{leave.userRole}</td>
                                <td className="py-3">{leave.startDate} to {leave.endDate}</td>
                                <td className="py-3 font-bold text-orange-400">{leave.daysCount} days</td>
                                <td className="py-3 max-w-sm">
                                  <div className="font-medium text-gray-300 mb-1" title={leave.reason}>{leave.reason}</div>
                                  {leave.rejectionReason && (
                                    <div className="text-[10px] text-red-400 mt-1.5 bg-red-950/20 px-2 py-1.5 rounded border border-red-500/10 text-left leading-relaxed">
                                      <strong>अस्वीकृति का कारण:</strong> {leave.rejectionReason}
                                    </div>
                                  )}
                                  {leave.query && (
                                    <div className="text-[10px] text-purple-400 mt-1.5 bg-purple-950/20 px-2 py-1.5 rounded border border-purple-500/10 text-left leading-relaxed animate-pulse">
                                      <strong>कर्मचारी का सवाल (Query):</strong> {leave.query}
                                    </div>
                                  )}
                                  {leave.queryResponse && (
                                    <div className="text-[10px] text-emerald-400 mt-1.5 bg-emerald-950/20 px-2 py-1.5 rounded border border-emerald-500/10 text-left leading-relaxed">
                                      <strong>एडमिन का जवाब (Response):</strong> {leave.queryResponse}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 text-center">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase block w-max mx-auto border ${
                                    leave.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    leave.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    leave.status === 'Queried' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                  }`}>
                                    {leave.status === 'Queried' ? 'Queried 💬' : leave.status}
                                  </span>
                                  {leave.status === 'Approved' && (
                                    <span className={`text-[8px] font-extrabold block mt-1 tracking-wider uppercase w-max mx-auto px-1.5 py-0.5 rounded border ${
                                      leave.payType === 'Full Pay' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                                      leave.payType === 'Unpaid' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                                      'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                                    }`}>
                                      {leave.payType || 'Half Pay'}
                                    </span>
                                  )}
                                </td>
                                {user.id === 'u-admin' && (
                                  <td className="py-3 text-center">
                                    {leave.status === 'Pending' ? (
                                      <div className="flex flex-col gap-1.5 items-center justify-center">
                                        <div className="flex gap-1">
                                          <select 
                                            id={`pay-type-${leave.id}`}
                                            className="bg-[#0d1017] border border-[#1f2635] text-[10px] rounded px-1.5 text-white font-semibold outline-none py-1"
                                            defaultValue="Half Pay"
                                          >
                                            <option value="Full Pay">Full Pay (पूरा वेतन)</option>
                                            <option value="Half Pay">Half Pay (आधा वेतन)</option>
                                            <option value="Unpaid">Unpaid (बिना वेतन)</option>
                                          </select>
                                          <button
                                            onClick={() => {
                                              const sel = document.getElementById(`pay-type-${leave.id}`) as HTMLSelectElement;
                                              handleApproveLeave(leave.id, 'Approved', undefined, sel?.value || 'Half Pay');
                                            }}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded font-bold text-[10px] cursor-pointer"
                                          >
                                            Approve
                                          </button>
                                        </div>
                                        <button
                                          onClick={() => {
                                            setRejectionModalLeaveId(leave.id);
                                            setRejectionInputReason('');
                                          }}
                                          className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-4 py-1 rounded font-bold text-[10px] cursor-pointer"
                                        >
                                          Reject
                                        </button>
                                      </div>
                                    ) : leave.status === 'Queried' ? (
                                      <div className="flex justify-center">
                                        <button
                                          onClick={() => {
                                            setQueryResponseLeaveId(leave.id);
                                            setQueryResponseText('');
                                            setQueryResponseAction('Approved');
                                          }}
                                          className="bg-purple-500 hover:bg-purple-600 text-white border border-purple-600 px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer"
                                        >
                                          Respond & Resolve
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-gray-500 text-[10px]">Audited by {leave.approvedBy || 'Admin'}</span>
                                    )}
                                  </td>
                                )}
                              </tr>
                            ))}
                          {leaveApplications.filter(l => user.id === 'u-admin' || l.userId === user.id).length === 0 && (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-gray-500">No leave applications registered.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {hrmSubTab === 'attendance' && (
                <div className="bg-[#111622] border border-[#1f2635] rounded-2xl p-6">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">Daily Attendance Register</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#1f2635] text-xs text-gray-400">
                          <th className="pb-3">STAFF NAME</th>
                          <th className="pb-3">ROLE</th>
                          <th className="pb-3">DATE</th>
                          <th className="pb-3">CHECK-IN TIME</th>
                          <th className="pb-3">CHECK-OUT TIME</th>
                          <th className="pb-3 text-center">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1f2635] text-xs text-gray-300">
                        {attendanceLogs.map(log => (
                          <tr key={log.id} className="hover:bg-[#151922]">
                            <td className="py-3 font-bold text-white">{log.userName}</td>
                            <td className="py-3 uppercase text-[10px] text-gray-400">{log.userRole}</td>
                            <td className="py-3">{log.date}</td>
                            <td className="py-3 text-emerald-400 font-mono">{log.loginTime ? new Date(log.loginTime).toLocaleTimeString() : 'N/A'}</td>
                            <td className="py-3 text-orange-400 font-mono">{log.logoutTime ? new Date(log.logoutTime).toLocaleTimeString() : 'Active Session'}</td>
                            <td className="py-3 text-center">
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {attendanceLogs.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-gray-500">No attendance logs logged yet today.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {hrmSubTab === 'tasks' && (
                <div className="space-y-6">
                  {/* MAIN ADMIN / SUB-ADMIN / HEAD: Assign Task Form */}
                  {(user.role === 'admin' || user.role === 'sub-admin' || user.role === 'head') && (
                    <div className="bg-[#111622] border border-[#1f2635] rounded-2xl p-6 space-y-4">
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Assign Daily Task (दैनिक कार्य सौंपें)</h3>
                      <form onSubmit={handleAssignTask} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Select Assignee (कर्मचारी चुनें)</label>
                          <select
                            value={taskAssigneeId}
                            onChange={(e) => setTaskAssigneeId(e.target.value)}
                            className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white"
                          >
                            <option value="">-- Select Employee --</option>
                            {(user.id === 'u-admin' || user.role === 'admin'
                              ? allUsers.filter(u => u.id !== 'u-admin')
                              : user.role === 'sub-admin'
                              ? allUsers.filter(u => u.role !== 'admin' && u.role !== 'sub-admin')
                              : allUsers.filter(u => (u.role === 'staff' || u.role === 'telecaller') && u.department === user.department)
                            ).map(a => (
                              <option key={a.id} value={a.id}>{a.name} [{a.role.toUpperCase()}] {a.department ? `(${a.department})` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Task Title / Assignment</label>
                          <input
                            type="text"
                            placeholder="e.g. Audit yesterday's sales logs"
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Target Date</label>
                          <input
                            type="date"
                            value={taskDate}
                            onChange={(e) => setTaskDate(e.target.value)}
                            className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-xs text-gray-400 mb-2 font-black uppercase">Attach Work Reference File (PDF, Word, Excel, Video, Audio, Images, etc.)</label>
                          <div className="flex items-center justify-between bg-[#0d1017] border border-[#1f2635] hover:border-gray-600 p-3 rounded-xl transition relative">
                            <input 
                              type="file" 
                              onChange={handleTaskReferenceFileChange}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex items-center gap-2 text-xs text-gray-400 pointer-events-none">
                              <Upload className="w-4 h-4 text-orange-500" />
                              {taskReferenceFile ? (
                                <span className="text-white font-bold truncate max-w-[400px]">{taskReferenceFile.name}</span>
                              ) : (
                                <span>Choose reference file (PDF, Docs, Excel, MP4, MP3, JPEG...)</span>
                              )}
                            </div>
                            <span className="bg-[#f97316] text-white text-[10px] font-black px-3 py-1.5 rounded-lg pointer-events-none transition">
                              Browse File
                            </span>
                          </div>
                          {taskReferenceUploadError && (
                            <p className="text-red-400 text-[10px] font-bold mt-1">{taskReferenceUploadError}</p>
                          )}
                          {taskReferenceFile && (
                            <p className="text-emerald-400 text-[10px] font-bold mt-1">✓ Reference file loaded: {taskReferenceFile.name} ({(taskReferenceFile.size / 1024).toFixed(1)} KB)</p>
                          )}
                        </div>
                        <div className="md:col-span-3 flex justify-end">
                          <button
                            type="submit"
                            className="bg-[#f97316] hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs cursor-pointer"
                          >
                            Assign Task (कार्य असाइन करें)
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Sub-Admin Task Actions: Submission & Appeal Forms */}
                  {user.id !== 'u-admin' && (
                    <div className="space-y-6">
                      {/* Submission Form */}
                      {submittingTaskId && (
                        <div className="bg-[#111622] border border-[#1f2635] rounded-2xl p-6 space-y-4">
                          <h3 className="text-sm font-black text-white uppercase tracking-wider text-orange-500">Submit Daily Work Completion (कार्य पूरा होने की रिपोर्ट)</h3>
                          <form onSubmit={handleSubmitTask} className="space-y-4">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Task Details</label>
                              <div className="bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-3 text-xs text-white">
                                {tasks.find(t => t.id === submittingTaskId)?.title}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-2">Status</label>
                              <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                                  <input
                                    type="radio"
                                    checked={submitTaskStatus === 'Completed'}
                                    onChange={() => setSubmitTaskStatus('Completed')}
                                    className="accent-orange-500"
                                  />
                                  Completed (पूर्ण हुआ)
                                </label>
                                <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                                  <input
                                    type="radio"
                                    checked={submitTaskStatus === 'Pending'}
                                    onChange={() => setSubmitTaskStatus('Pending')}
                                    className="accent-orange-500"
                                  />
                                  Still Pending (लंबित)
                                </label>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Genuine Completion Remark / Reason (स्पष्ट टिप्पणी/कारण लिखें)</label>
                              <textarea
                                rows={3}
                                placeholder="Write exactly what you did or why it wasn't fully completed..."
                                value={submitTaskRemark}
                                onChange={(e) => setSubmitTaskRemark(e.target.value)}
                                className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl p-4 text-xs text-white outline-none focus:border-[#f97316]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-2 font-black uppercase">Attach Work Proof File (PDF, Word, Excel, JPG/PNG)</label>
                              <div className="flex items-center justify-between bg-[#0d1017] border border-[#1f2635] hover:border-gray-600 p-3 rounded-xl transition relative">
                                <input 
                                  type="file" 
                                  onChange={handleTaskFileChange}
                                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex items-center gap-2 text-xs text-gray-400 pointer-events-none">
                                  <Upload className="w-4 h-4 text-orange-500" />
                                  {submitTaskFile ? (
                                    <span className="text-white font-bold truncate max-w-[200px]">{submitTaskFile.name}</span>
                                  ) : (
                                    <span>Choose proof file...</span>
                                  )}
                                </div>
                                <span className="bg-[#f97316] text-white text-[10px] font-black px-3 py-1.5 rounded-lg pointer-events-none transition">
                                  Browse File
                                </span>
                              </div>
                              {fileUploadError && (
                                <p className="text-red-400 text-[10px] font-bold mt-1">{fileUploadError}</p>
                              )}
                              {submitTaskFile && (
                                <p className="text-emerald-400 text-[10px] font-bold mt-1">✓ File ready: {submitTaskFile.name} ({(submitTaskFile.size / 1024).toFixed(1)} KB)</p>
                              )}
                            </div>
                            <div className="flex gap-3 justify-end">
                              <button
                                type="button"
                                onClick={() => setSubmittingTaskId(null)}
                                className="bg-[#f97316] hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="bg-[#f97316] hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer"
                              >
                                Submit Task
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Appeal / Raise Question Form */}
                      {appealingTaskId && (
                        <div className="bg-[#111622] border border-[#1f2635] rounded-2xl p-6 space-y-4">
                          <h3 className="text-sm font-black text-white uppercase tracking-wider text-[#f97316]">Appeal / Raise Question (अपील करें या प्रश्न पूछें)</h3>
                          <form onSubmit={handleAppealTask} className="space-y-4">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Task Title</label>
                              <div className="bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-3 text-xs text-white font-bold">
                                {tasks.find(t => t.id === appealingTaskId)?.title}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Main Admin Rejection Reason</label>
                              <div className="bg-[#0d1017] border border-[#1f2635] text-red-400 rounded-xl px-4 py-3 text-xs">
                                {tasks.find(t => t.id === appealingTaskId)?.adminReply}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Your Appeal / Question / Remarks (अपना प्रश्न या समाधान के लिए अपील लिखें)</label>
                              <textarea
                                rows={3}
                                placeholder="Explain your situation or request a clear solution from the main admin..."
                                value={appealText}
                                onChange={(e) => setAppealText(e.target.value)}
                                className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl p-4 text-xs text-white outline-none focus:border-[#f97316]"
                              />
                            </div>
                            <div className="flex gap-3 justify-end">
                              <button
                                type="button"
                                onClick={() => setAppealingTaskId(null)}
                                className="bg-[#f97316] hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="bg-[#f97316] hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer"
                              >
                                Submit Appeal
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  )}

                  {/* MAIN ADMIN: Evaluation & Appeal Response forms */}
                  {user.id === 'u-admin' && (
                    <div className="space-y-6">
                      {evaluatingTaskId && (
                        <div className="bg-[#111622] border border-[#1f2635] rounded-2xl p-6 space-y-4">
                          <h3 className="text-sm font-black text-white uppercase tracking-wider text-orange-400">Evaluate Sub-Admin Task (कार्य मूल्यांकन)</h3>
                          <form onSubmit={handleEvaluateTask} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Task Title</label>
                                <div className="bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-3 text-xs text-white font-bold">
                                  {tasks.find(t => t.id === evaluatingTaskId)?.title}
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Sub-Admin Remark</label>
                                <div className="bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-3 text-xs text-white">
                                  {tasks.find(t => t.id === evaluatingTaskId)?.remark || "No remark provided."}
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-2 font-bold font-sans">Evaluation Action</label>
                              <div className="flex gap-4">
                                <button
                                  type="button"
                                  onClick={() => setEvaluateAction('Approved')}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                    evaluateAction === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-[#0d1017] text-gray-400 border-[#1f2635]'
                                  }`}
                                >
                                  Approve & Give Performance Incentive
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEvaluateAction('Denied')}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                    evaluateAction === 'Denied' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-[#0d1017] text-gray-400 border-[#1f2635]'
                                  }`}
                                >
                                  Deny / Reject with Reason
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Evaluation Feedback / Reason for Denial (मूल्यांकन टिप्पणी लिखें)</label>
                              <textarea
                                rows={3}
                                placeholder="Explain why this task is approved or denied..."
                                value={evaluateFeedback}
                                onChange={(e) => setEvaluateFeedback(e.target.value)}
                                className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl p-4 text-xs text-white outline-none focus:border-[#f97316]"
                              />
                            </div>
                            <div className="flex justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => setEvaluatingTaskId(null)}
                                className="bg-[#f97316] hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="bg-[#f97316] hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer"
                              >
                                Submit Evaluation
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {respondingAppealTaskId && (
                        <div className="bg-[#111622] border border-[#1f2635] rounded-2xl p-6 space-y-4">
                          <h3 className="text-sm font-black text-white uppercase tracking-wider text-orange-400">Respond to Appeal & Instruct Sub-Admin (अपील का उत्तर और निर्देश)</h3>
                          <form onSubmit={handleRespondAppeal} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Sub-Admin Appeal / Question</label>
                                <div className="bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-3 text-xs text-orange-400 font-bold">
                                  {tasks.find(t => t.id === respondingAppealTaskId)?.appeal}
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Original Denial Reason</label>
                                <div className="bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-3 text-xs text-gray-400">
                                  {tasks.find(t => t.id === respondingAppealTaskId)?.adminReply}
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-2 font-bold font-sans">Updated Decision</label>
                              <div className="flex gap-4">
                                <button
                                  type="button"
                                  onClick={() => setAppealReplyAction('Approved')}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                    appealReplyAction === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-[#0d1017] text-gray-400 border-[#1f2635]'
                                  }`}
                                >
                                  Satisfactory Response: Approve & Clear
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAppealReplyAction('Denied')}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                    appealReplyAction === 'Denied' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-[#0d1017] text-gray-400 border-[#1f2635]'
                                  }`}
                                >
                                  Unsatisfactory: Keep Denied with further Instructions
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Reply Instructions / Resolution Details (निर्णय और निर्देश लिखें)</label>
                              <textarea
                                rows={3}
                                placeholder="Provide your detailed explanation, resolution steps, or feedback..."
                                value={appealReplyText}
                                onChange={(e) => setAppealReplyText(e.target.value)}
                                className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl p-4 text-xs text-white outline-none focus:border-[#f97316]"
                              />
                            </div>
                            <div className="flex justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => setRespondingAppealTaskId(null)}
                                className="bg-[#f97316] hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="bg-[#f97316] hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer"
                              >
                                Submit Response
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tasks List */}
                  <div className="bg-[#111622] border border-[#1f2635] rounded-2xl p-6">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">
                      Hierarchical Tasks & Progress Register (दैनिक कार्य एवं प्रगति सूची)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-sans">
                        <thead>
                          <tr className="border-b border-[#1f2635] text-xs text-gray-400">
                            <th className="pb-3">ASSIGNED TO</th>
                            <th className="pb-3">ASSIGNED BY</th>
                            <th className="pb-3">DATE</th>
                            <th className="pb-3">TASK ASSIGNMENT</th>
                            <th className="pb-3">STATUS</th>
                            <th className="pb-3">REMARK / PROGRESS</th>
                            <th className="pb-3">FEEDBACK / REPLY</th>
                            <th className="pb-3 text-right">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1f2635] text-xs text-gray-300">
                          {tasks.map(task => {
                            const todayStr = new Date().toISOString().split('T')[0];
                            const isTaskOverdue = !['Approved', 'Submitted'].includes(task.status) && task.date < todayStr;
                            const isSupervisor = user.id === 'u-admin' || user.role === 'admin' || user.role === 'sub-admin' || user.id === task.assignedBy || (user.role === 'head' && user.department === task.department);
                            return (
                              <React.Fragment key={task.id}>
                                <tr className="hover:bg-[#151922] border-b border-[#1f2635]/50">
                                  <td className="py-3 font-bold text-white">
                                    {task.assignedToName || task.adminName || 'Sub-Admin'}
                                    {task.department ? <span className="block text-[10px] text-gray-400 font-normal font-sans">Dept: {task.department}</span> : null}
                                  </td>
                                  <td className="py-3 text-gray-400">{task.assignedByName || 'Administrator'}</td>
                                  <td className="py-3 font-mono">
                                    {task.date}
                                    {isTaskOverdue && (
                                      <span className="block text-[10px] text-red-500 font-extrabold font-sans mt-0.5 animate-pulse">
                                        ⚠️ OVERDUE (देरी)
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 font-bold text-white max-w-xs">
                                    <div>
                                      <span>{task.title}</span>
                                      {task.assignedAt && (
                                        <span className="block text-[10px] text-gray-500 font-sans mt-1">
                                          📅 Assigned: {new Date(task.assignedAt).toLocaleDateString()} at {new Date(task.assignedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                      )}
                                      {task.referenceFile && (
                                        <div className="mt-2 p-2 bg-[#0d1017] border border-[#1f2635] rounded-xl flex items-center justify-between text-[10px] gap-2">
                                          <div className="truncate flex-1">
                                            <span className="text-[8px] font-black text-orange-400 block uppercase">Reference File</span>
                                            <span className="text-white font-semibold truncate block max-w-[150px]" title={task.referenceFile.name}>{task.referenceFile.name}</span>
                                          </div>
                                          <a 
                                            href={task.referenceFile.dataUrl || task.referenceFile.data} 
                                            download={task.referenceFile.name}
                                            className="bg-[#f97316] hover:bg-orange-600 text-white font-black px-2 py-1 rounded text-[9px] shrink-0"
                                          >
                                            Download
                                          </a>
                                        </div>
                                      )}
                                      {/* Overdue delay explanation section */}
                                      {isTaskOverdue && !task.overdueRemark && user.id === task.assignedTo && (
                                        <div className="mt-1.5 bg-red-500/10 border border-red-500/25 p-2 rounded-xl space-y-1 max-w-xs font-sans">
                                          <p className="text-[10px] text-red-400 font-extrabold">⚠️ Task Overdue: Please enter reason for delay (देरी का कारण):</p>
                                          <div className="flex gap-1.5">
                                            <input
                                              type="text"
                                              id={`overdue-remark-${task.id}`}
                                              placeholder="Reason for delay..."
                                              className="bg-[#0d1017] border border-[#1f2635] rounded-lg px-2 py-1 text-[10px] text-white flex-1 focus:outline-none"
                                            />
                                            <button
                                              onClick={() => {
                                                const val = (document.getElementById(`overdue-remark-${task.id}`) as HTMLInputElement)?.value;
                                                if (val) handleSendOverdueRemark(task.id, val);
                                              }}
                                              className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg transition"
                                            >
                                              Submit
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 font-sans">
                                    {task.status === 'Pending' && (
                                      <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                        Pending
                                      </span>
                                    )}
                                    {task.status === 'Submitted' && (
                                      <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                        Submitted (Evaluating)
                                      </span>
                                    )}
                                    {task.status === 'Approved' && (
                                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                        Done / Approved ✓
                                      </span>
                                    )}
                                    {task.status === 'Denied' && (
                                      <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                        Denied (Action Required)
                                      </span>
                                    )}
                                    {task.status === 'Appealed' && (
                                      <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                        Appealed (Under Discussion)
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 text-gray-400 max-w-xs font-sans">
                                    {task.remark ? (
                                      <div>
                                        <p className="text-white italic">"{task.remark}"</p>
                                        {task.completedAt && (
                                          <span className="block text-[10px] text-emerald-400 font-bold font-sans mt-1">
                                            ✓ Completed: {new Date(task.completedAt).toLocaleDateString()} at {new Date(task.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                          </span>
                                        )}
                                        {task.file && (
                                          <div className="mt-2 p-2 bg-[#0d1017] border border-[#1f2635] rounded-xl flex items-center justify-between text-[10px] gap-2">
                                            <div className="truncate flex-1">
                                              <span className="text-[8px] font-bold text-gray-500 block uppercase">Submitted File</span>
                                              <span className="text-white font-semibold truncate block max-w-[120px]" title={task.file.name}>{task.file.name}</span>
                                            </div>
                                            <a 
                                              href={task.file.dataUrl || task.file.data} 
                                              download={task.file.name}
                                              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-2 py-1 rounded text-[9px] shrink-0"
                                            >
                                              Download
                                            </a>
                                          </div>
                                        )}
                                        {task.appeal && (
                                          <p className="text-purple-400 text-[10px] mt-1 font-bold">Question: {task.appeal}</p>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-gray-600 italic">No report yet</span>
                                    )}

                                    {/* Display overdue delay remark if exists */}
                                    {task.overdueRemark && (
                                      <div className="mt-2 bg-red-500/10 text-red-300 p-2 rounded-xl border border-red-500/25 text-[10px]">
                                        <span className="font-extrabold text-red-400 block mb-0.5">⚠️ DELAY REASON (देरी का कारण):</span>
                                        <p className="italic">"{task.overdueRemark}"</p>

                                        {task.overdueReply && (
                                          <div className="mt-1.5 pt-1.5 border-t border-red-500/20 text-emerald-400 font-sans">
                                            <span className="font-extrabold text-emerald-400 block mb-0.5">✓ Admin Response:</span>
                                            <p className="italic">"{task.overdueReply}"</p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3 text-gray-400 max-w-xs font-sans">
                                    {task.adminReply ? (
                                      <div>
                                        <p className="text-orange-400 font-bold">Feedback: {task.adminReply}</p>
                                        {task.appealReply && (
                                          <p className="text-emerald-400 text-[10px] mt-1 font-bold">Reply: {task.appealReply}</p>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-gray-600 italic">No feedback yet</span>
                                    )}

                                    {/* Delay Reason Admin reply form */}
                                    {task.overdueRemark && !task.overdueReply && isSupervisor && (
                                      <div className="mt-2 font-sans">
                                        {respondingOverdueTaskId === task.id ? (
                                          <form onSubmit={handleSendOverdueReply} className="space-y-1.5">
                                            <textarea
                                              value={overdueReplyText}
                                              onChange={(e) => setOverdueReplyText(e.target.value)}
                                              placeholder="Type a response to this delay..."
                                              className="w-full bg-[#0d1017] border border-[#1f2635] p-2 text-[10px] text-white rounded-lg focus:outline-none"
                                              rows={2}
                                            />
                                            <div className="flex gap-1.5">
                                              <button
                                                type="button"
                                                onClick={() => setRespondingOverdueTaskId(null)}
                                                className="bg-[#f97316] hover:bg-orange-600 text-white text-[9px] px-2 py-1 rounded font-bold cursor-pointer"
                                              >
                                                Cancel
                                              </button>
                                              <button
                                                type="submit"
                                                className="bg-emerald-600 text-white text-[9px] px-2.5 py-1 rounded font-bold"
                                              >
                                                Submit Reply
                                              </button>
                                            </div>
                                          </form>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              setRespondingOverdueTaskId(task.id);
                                              setOverdueReplyText('');
                                            }}
                                            className="bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 text-[9px] px-2.5 py-1 rounded font-bold transition cursor-pointer"
                                          >
                                            💬 Reply to Delay Reason
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3 text-right font-sans">
                                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                      {/* Sub-admin / Staff / Head: Report Completion */}
                                      {user.id === task.assignedTo && task.status === 'Pending' && (
                                        <button
                                          onClick={() => {
                                            setSubmittingTaskId(task.id);
                                            setSubmitTaskStatus('Completed');
                                            setSubmitTaskRemark('');
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                          }}
                                          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-1 rounded text-[10px] cursor-pointer"
                                        >
                                          Report Progress / Submit
                                        </button>
                                      )}

                                      {/* Sub-admin / Staff / Head: Appeal Denied Task */}
                                      {user.id === task.assignedTo && task.status === 'Denied' && (
                                        <button
                                          onClick={() => {
                                            setAppealingTaskId(task.id);
                                            setAppealText('');
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                          }}
                                          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-1 rounded text-[10px] cursor-pointer"
                                        >
                                          Raise Question / Appeal
                                        </button>
                                      )}

                                      {/* Main Admin / Assigner: Evaluate Task */}
                                      {isSupervisor && task.status === 'Submitted' && (
                                        <button
                                          onClick={() => {
                                            setEvaluatingTaskId(task.id);
                                            setEvaluateAction('Approved');
                                            setEvaluateFeedback('');
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                          }}
                                          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-1 rounded text-[10px] cursor-pointer"
                                        >
                                          Evaluate Work
                                        </button>
                                      )}

                                      {/* Main Admin / Assigner: Respond to Appeal */}
                                      {isSupervisor && task.status === 'Appealed' && (
                                        <button
                                          onClick={() => {
                                            setRespondingAppealTaskId(task.id);
                                            setAppealReplyAction('Approved');
                                            setAppealReplyText('');
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                          }}
                                          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-1 rounded text-[10px] cursor-pointer"
                                        >
                                          Reply & Instruct
                                        </button>
                                      )}

                                      {/* General Task Reply / Chat Segment Toggle */}
                                      <button
                                        onClick={() => setExpandedChatTaskId(expandedChatTaskId === task.id ? null : task.id)}
                                        className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-extrabold px-2.5 py-1 rounded text-[10px] transition cursor-pointer"
                                        title="Task discussion"
                                      >
                                        💬 Discuss ({(task.replies || []).length})
                                      </button>

                                      {/* Delete (Dustbin) Button - Visible to main admin / task creator */}
                                      {(user.id === 'u-admin' || task.assignedBy === user.id) && (
                                        <button
                                          onClick={() => handleDeleteTask(task.id)}
                                          title="Delete task"
                                          className="bg-red-500/15 hover:bg-red-500/30 text-red-500 hover:text-red-400 p-1.5 rounded-lg transition inline-flex items-center cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>

                                {/* Expandable discussion/chat block */}
                                {expandedChatTaskId === task.id && (
                                  <tr className="bg-[#0f131d]">
                                    <td colSpan={8} className="p-4 border-t border-[#1f2635]/50">
                                      <div className="space-y-3 max-w-2xl font-sans text-left">
                                        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                                          💬 Task Discussion & Chat (कार्य संवाद)
                                        </h4>
                                        
                                        {/* Message history */}
                                        <div className="space-y-2 max-h-48 overflow-y-auto bg-[#0d1017] p-3 rounded-xl border border-[#1f2635] text-xs">
                                          {(task.replies || []).length === 0 ? (
                                            <p className="text-gray-500 italic py-1">No conversation logged yet. Start the discussion below.</p>
                                          ) : (
                                            (task.replies || []).map((rep: any, idx: number) => {
                                              const isAdminSender = 
                                                rep.senderRole === 'admin' || 
                                                rep.senderRole === 'sub-admin' || 
                                                rep.senderRole === 'head' || 
                                                rep.senderId === 'u-admin' || 
                                                rep.senderId === task.assignedBy;

                                              const bubbleBgClass = "bg-white";
                                              const bubbleBorderClass = isAdminSender 
                                                ? "border-2 border-red-500" 
                                                : "border border-gray-300";
                                              const textNameClass = isAdminSender 
                                                ? "text-red-700 font-black text-[11px]" 
                                                : "text-gray-800 font-black text-[11px]";
                                              const textMsgClass = isAdminSender 
                                                ? "text-red-600 font-extrabold font-sans text-xs break-words" 
                                                : "text-black font-semibold font-sans text-xs break-words";
                                              const alignClass = isAdminSender 
                                                ? "ml-auto text-right" 
                                                : "mr-auto text-left";

                                              return (
                                                <div 
                                                  key={idx} 
                                                  className={`p-3 rounded-xl max-w-[85%] shadow-sm ${bubbleBgClass} ${bubbleBorderClass} ${alignClass}`}
                                                >
                                                  <p className={`${textNameClass} mb-1 flex items-center gap-1.5 justify-start ${isAdminSender ? 'justify-end' : ''}`}>
                                                    <span>{rep.senderName}</span>
                                                    <span className="text-[9px] text-gray-500 font-normal">
                                                      ({new Date(rep.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})
                                                    </span>
                                                    {isAdminSender && (
                                                      <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                                                        ADMIN / SUPERVISOR
                                                      </span>
                                                    )}
                                                  </p>
                                                  <p className={textMsgClass}>{rep.message}</p>
                                                </div>
                                              );
                                            })
                                          )}
                                        </div>

                                        {/* Input message form */}
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            value={newReplyMessage}
                                            onChange={(e) => setNewReplyMessage(e.target.value)}
                                            placeholder="Write a message about this task... (कार्य के बारे में संदेश लिखें...)"
                                            className="flex-1 bg-[#0d1017] border border-[#1f2635] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                handleSendTaskReply(task.id);
                                              }
                                            }}
                                          />
                                          <button
                                            onClick={() => handleSendTaskReply(task.id)}
                                            className="bg-[#f97316] hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                                          >
                                            Send
                                          </button>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                          {tasks.length === 0 && (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-gray-500">
                                No assigned daily tasks recorded.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {hrmSubTab === 'holidays' && (
                <div className="space-y-6">
                  {/* MAIN ADMIN: Declare Company-wide Holiday Form */}
                  {user.id === 'u-admin' && (
                    <div className="bg-[#111622] border border-[#1f2635] rounded-2xl p-6 space-y-4">
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Declare Company-Wide Holiday (सार्वजनिक अवकाश घोषित करें)</h3>
                      <form onSubmit={handleDeclareHoliday} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Holiday Date</label>
                          <input
                            type="date"
                            value={holidayDate}
                            onChange={(e) => setHolidayDate(e.target.value)}
                            className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Reason / Occasion Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Independence Day / Diwali"
                            value={holidayReason}
                            onChange={(e) => setHolidayReason(e.target.value)}
                            className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white"
                          />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                          <button
                            type="submit"
                            className="bg-[#f97316] hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs cursor-pointer"
                          >
                            Declare Holiday (सार्वजनिक छुट्टी घोषित करें)
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Holidays Display Board */}
                  <div className="bg-[#111622] border border-[#1f2635] rounded-2xl p-6">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">Declared Company Holidays</h3>
                    <p className="text-xs text-gray-400 mb-4">Note: All declared company-wide holidays are fully-paid days for all staff members, including telecallers and administrators.</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-[#1f2635] text-xs text-gray-400">
                            <th className="pb-3">HOLIDAY DATE</th>
                            <th className="pb-3">REASON / OCCASION</th>
                            <th className="pb-3">PAY STATUS</th>
                            {user.id === 'u-admin' && <th className="pb-3 text-right">ACTION</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1f2635] text-xs text-gray-300">
                          {companyHolidays.map(holiday => (
                            <tr key={holiday.id} className="hover:bg-[#151922]">
                              <td className="py-3 font-mono font-bold text-white">{holiday.date}</td>
                              <td className="py-3 font-bold text-white">{holiday.reason}</td>
                              <td className="py-3">
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                  Fully Paid (100% सैलरी)
                                </span>
                              </td>
                              {user.id === 'u-admin' && (
                                <td className="py-3 text-right">
                                  <button
                                    onClick={() => handleDeleteHoliday(holiday.id)}
                                    className="text-red-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                                    title="Delete Holiday"
                                  >
                                    <Trash2 className="w-4 h-4 inline" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                          {companyHolidays.length === 0 && (
                            <tr>
                              <td colSpan={user.id === 'u-admin' ? 4 : 3} className="py-8 text-center text-gray-500">
                                No company holidays declared yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {hrmSubTab === 'salary_rules' && (
                <div className="space-y-6">
                  {/* Header Banner */}
                  <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 p-6 rounded-2xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                      <div>
                        <h3 className="text-lg font-black text-white">Salary Criteria Rules Management (सैलरी मापदंड नियम)</h3>
                        <p className="text-xs text-gray-400 mt-1">Configure automated salary additions, deductions, attendance parameters, sandwich rules, and performance thresholds.</p>
                      </div>
                      {user.id === 'u-admin' && (
                        <button
                          onClick={openAddRuleModal}
                          className="bg-[#f97316] hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-orange-500/10 self-start md:self-auto"
                        >
                          <Plus className="w-4 h-4" /> Add Custom Rule (नया नियम जोड़ें)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rules Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
                    {/* System Rules */}
                    <div className="bg-[#111622] border border-[#1f2635] rounded-2xl p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-[#1f2635] pb-3">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">System-Defined Core Rules (सिस्टम नियम)</h4>
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono">Protected</span>
                      </div>
                      <div className="space-y-4 divide-y divide-[#1f2635]/50">
                        {salaryRules.filter(r => r.systemRule).map((rule) => (
                          <div key={rule.id} className="pt-4 first:pt-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">{rule.name}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono ${rule.enabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                  {rule.enabled ? "Active" : "Disabled"}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 leading-relaxed max-w-md">{rule.description}</p>
                              <div className="flex flex-wrap gap-2 text-[10px] font-mono text-gray-500 pt-1">
                                <span>Type: <strong className="text-gray-300">{rule.type}</strong></span>
                                <span>•</span>
                                <span>Value: <strong className="text-[#f97316]">{rule.value} {rule.type === 'PerformanceCut' || rule.type === 'LateDeduction' ? 'mins/pct' : 'day pay'}</strong></span>
                                <span>•</span>
                                <span>Segment: <strong className="text-blue-400">{rule.segment || "All"}</strong></span>
                                <span>•</span>
                                <span>Staff: <strong className="text-purple-400">{rule.staffId === "All" ? "All Users" : rule.staffId}</strong></span>
                              </div>
                            </div>
                            {user.id !== 'u-admin' ? (
                              <span className={`text-[10px] px-2.5 py-1.5 rounded-lg font-mono ${rule.enabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {rule.enabled ? "Active (सक्रिय)" : "Disabled (निष्क्रिय)"}
                              </span>
                            ) : (
                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                  onClick={() => openEditRuleModal(rule)}
                                  className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/10 hover:border-blue-500/30 bg-blue-500/5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all"
                                >
                                  Edit (संशोधित करें)
                                </button>
                                <button
                                  onClick={() => handleToggleRuleEnabled(rule)}
                                  className={`text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-all border ${rule.enabled ? 'text-red-400 hover:text-red-300 border-red-500/10 hover:border-red-500/30 bg-red-500/5' : 'text-emerald-400 hover:text-emerald-300 border-emerald-500/10 hover:border-emerald-500/30 bg-emerald-500/5'}`}
                                >
                                  {rule.enabled ? "Disable" : "Enable"}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Custom Rules */}
                    <div className="bg-[#111622] border border-[#1f2635] rounded-2xl p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-[#1f2635] pb-3">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Custom Additions & Deductions (कस्टम नियम)</h4>
                        <span className="text-[10px] bg-orange-500/10 text-[#f97316] border border-orange-500/20 px-2 py-0.5 rounded font-mono">User Created</span>
                      </div>
                      <div className="space-y-4 divide-y divide-[#1f2635]/50 overflow-y-auto max-h-[450px] pr-2">
                        {salaryRules.filter(r => !r.systemRule).map((rule) => (
                          <div key={rule.id} className="pt-4 first:pt-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">{rule.name}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono ${rule.enabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                  {rule.enabled ? "Active" : "Disabled"}
                                </span>
                              </div>
                              {rule.description && <p className="text-xs text-gray-400 leading-relaxed max-w-md">{rule.description}</p>}
                              <div className="flex flex-wrap gap-2 text-[10px] font-mono text-gray-500 pt-1">
                                <span>Type: <strong className={`font-bold ${rule.type === 'Allowance' || rule.type === 'CustomAddition' ? 'text-emerald-400' : 'text-red-400'}`}>{rule.type}</strong></span>
                                <span>•</span>
                                <span>Value: <strong className="text-white">{rule.valueType === 'Percentage' ? `${rule.value}%` : `₹${rule.value}`}</strong></span>
                                <span>•</span>
                                <span>Segment: <strong className="text-blue-400">{rule.segment || "All"}</strong></span>
                                <span>•</span>
                                <span>Staff: <strong className="text-purple-400">{rule.staffId === "All" ? "All Users" : rule.staffId}</strong></span>
                              </div>
                            </div>
                            {user.id !== 'u-admin' ? (
                              <span className={`text-[10px] px-2.5 py-1.5 rounded-lg font-mono ${rule.enabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {rule.enabled ? "Active (सक्रिय)" : "Disabled (निष्क्रिय)"}
                              </span>
                            ) : (
                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                  onClick={() => openEditRuleModal(rule)}
                                  className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/10 hover:border-blue-500/30 bg-blue-500/5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleToggleRuleEnabled(rule)}
                                  className={`text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-all border ${rule.enabled ? 'text-yellow-400 hover:text-yellow-300 border-yellow-500/10 hover:border-yellow-500/30 bg-yellow-500/5' : 'text-emerald-400 hover:text-emerald-300 border-emerald-500/10 hover:border-emerald-500/30 bg-emerald-500/5'}`}
                                >
                                  {rule.enabled ? "Disable" : "Enable"}
                                </button>
                                <button
                                  onClick={() => handleDeleteRule(rule.id)}
                                  className="text-xs text-red-400 hover:text-red-300 border border-red-500/10 hover:border-red-500/30 bg-red-500/5 p-1.5 rounded-lg cursor-pointer transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                        {salaryRules.filter(r => !r.systemRule).length === 0 && (
                          <div className="py-12 text-center text-gray-500 text-xs">
                            No custom rules defined yet. Click "Add Custom Rule" to define allowances or specific company deductions.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* DIALOG MODAL FOR SALARY RULES */}
                  {showRuleModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
                      <div className="bg-[#111622] border border-[#1f2635] w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in duration-200 text-left">
                        <div className="flex items-center justify-between border-b border-[#1f2635] pb-3">
                          <h3 className="text-sm font-black text-white uppercase tracking-wider">
                            {editingRule ? "Edit Salary Rule (सैलरी नियम संशोधन)" : "Add New Custom Salary Rule (नया सैलरी नियम)"}
                          </h3>
                          <button
                            onClick={() => {
                              setShowRuleModal(false);
                              setEditingRule(null);
                            }}
                            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <form onSubmit={handleSaveRule} className="space-y-4">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1 font-bold">Rule Name (नियम का नाम) <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Festival Bonus, Petrol Allowance, Late fine"
                              value={ruleName}
                              onChange={(e) => setRuleName(e.target.value)}
                              className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#f97316]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-400 mb-1 font-bold">Description (विवरण)</label>
                            <textarea
                              placeholder="e.g. Applicability details or special notes"
                              value={ruleDescription}
                              onChange={(e) => setRuleDescription(e.target.value)}
                              className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 h-16 resize-none focus:outline-none focus:border-[#f97316]"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1 font-bold">Rule Category (श्रेणी) <span className="text-red-500">*</span></label>
                              {editingRule?.systemRule ? (
                                <div className="w-full bg-[#1c2230] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-gray-400 font-mono">
                                  {ruleType}
                                </div>
                              ) : (
                                <select
                                  value={ruleType}
                                  onChange={(e) => setRuleType(e.target.value)}
                                  className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#f97316]"
                                >
                                  <option value="Allowance">Allowance / Addition (भत्ता / सैलरी जोड़)</option>
                                  <option value="CustomDeduction">Deduction / Penalty (कटौती / जुर्माना)</option>
                                </select>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs text-gray-400 mb-1 font-bold font-mono">Value (मात्रा) <span className="text-red-500">*</span></label>
                              <input
                                type="number"
                                step="any"
                                required
                                placeholder="e.g. 500, 2, 80"
                                value={ruleValue}
                                onChange={(e) => setRuleValue(e.target.value)}
                                className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#f97316]"
                              />
                            </div>
                          </div>

                          {!editingRule?.systemRule && (
                            <div>
                              <label className="block text-xs text-gray-400 mb-1 font-bold">Value Type (मात्रा प्रकार)</label>
                              <select
                                value={ruleValueType}
                                onChange={(e) => setRuleValueType(e.target.value)}
                                className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#f97316]"
                              >
                                <option value="Fixed">Fixed Amount (INR) - निश्चित रुपया</option>
                                <option value="Percentage">Percentage (%) of Basic Salary - प्रतिशत बेसिक</option>
                              </select>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1 font-bold">Company Segment / Department</label>
                              <select
                                value={ruleSegment}
                                onChange={(e) => setRuleSegment(e.target.value)}
                                className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#f97316]"
                              >
                                <option value="All">All Segments (सभी विभाग)</option>
                                <option value="Sales">Sales (बिक्री)</option>
                                <option value="Tech">Tech (तकनीकी)</option>
                                <option value="Support">Support (सहायता)</option>
                                <option value="Operations">Operations (संचालन)</option>
                                <option value="Design">Design (डिजाइन)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs text-gray-400 mb-1 font-bold">Target Staff Member</label>
                              <select
                                value={ruleStaffId}
                                onChange={(e) => setRuleStaffId(e.target.value)}
                                className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#f97316]"
                              >
                                <option value="All">All Staff (सभी कर्मचारी)</option>
                                {Array.from(new Map(payrollReport.map(item => [item.userId, item])).values()).map((emp: any) => (
                                  <option key={emp.userId} value={emp.userId}>
                                    {emp.name} ({emp.userId})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-[#1f2635] flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setShowRuleModal(false);
                                setEditingRule(null);
                              }}
                              className="bg-[#1f2635] hover:bg-[#2e374a] text-gray-300 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer transition-colors"
                            >
                              Cancel (रद्द करें)
                            </button>
                            <button
                              type="submit"
                              disabled={isSavingRule}
                              className="bg-[#f97316] hover:bg-orange-600 disabled:bg-orange-600/50 text-white font-bold px-6 py-2.5 rounded-xl text-xs cursor-pointer transition-all flex items-center gap-2"
                            >
                              {isSavingRule ? "Saving..." : editingRule ? "Save Changes (संशोधन सुरक्षित करें)" : "Add Rule (नियम लागू करें)"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {hrmSubTab === 'payroll_audit' && (
                <div className="space-y-6">
                  {/* WhatsApp Notification Simulation Banner */}
                  {(() => {
                    const hasPending = payrollReport.some(r => !r.isReleased);
                    const currentDay = new Date().getDate();
                    if (hasPending && currentDay >= 5) {
                      return (
                        <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl space-y-2 text-left animate-pulse">
                          <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                            </span>
                            <h4 className="text-sm font-black text-white uppercase tracking-wider">
                              ⚠️ Simulated WhatsApp Broadcast Pending (पेंडिंग सैलरी ब्रॉडकास्ट)
                            </h4>
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed">
                            <strong>System Broadcast Status:</strong> Since today is the {currentDay}th of the month and there are staff salaries pending release, a twice-daily automated WhatsApp notification is being pushed to the Main Admin. <strong>To stop this background process, please release the salaries of all staff.</strong>
                          </p>
                          <div className="text-[10px] text-gray-500 font-mono">
                            WhatsApp Payload: "Attention Admin: Staff payouts for {selectedPayrollMonth} are ready. Release between 10th and 15th of the month to avoid delays."
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-left">
                          <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                            ✅ WhatsApp Notifications Status: Clear (व्हाट्सएप ब्रॉडकास्ट समाप्त)
                          </h4>
                          <p className="text-xs text-gray-400 mt-1">
                            All staff salaries for {selectedPayrollMonth} are released, or we are outside the pending broadcast window. No automatic reminder WhatsApps are currently active.
                          </p>
                        </div>
                      );
                    }
                  })()}

                  {/* Payroll Month Selection */}
                  <div className="bg-[#111622] border border-[#1f2635] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Payroll Calculation Period</h3>
                      <p className="text-xs text-gray-400 mt-1">Select month range to audit attendance-based salary calculations & incentives</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-gray-400">Target Period:</label>
                      <input
                        type="month"
                        value={selectedPayrollMonth}
                        onChange={(e) => setSelectedPayrollMonth(e.target.value)}
                        className="bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Payroll Report Grid */}
                  <div className="bg-[#111622] border border-[#1f2635] rounded-2xl p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-[#1f2635] text-xs text-gray-400">
                            <th className="pb-3">EMPLOYEE NAME</th>
                            <th className="pb-3">BASE PAY</th>
                            <th className="pb-3">ATTENDANCE & OVERTIME SUMMARY</th>
                            <th className="pb-3">PERFORMANCE %</th>
                            <th className="pb-3">INCENTIVE GAINED</th>
                            <th className="pb-3 font-bold text-orange-400">FINAL NET PAYABLE</th>
                            <th className="pb-3">ADMIN OVERRIDES (ओवरराइड)</th>
                            <th className="pb-3">PAYOUT ACTION (भुगतान)</th>
                            <th className="pb-3 text-center">PAYSLIP</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1f2635] text-xs text-gray-300">
                           {(() => {
                             const filteredReport = (payrollReport || []).filter((rep: any) => {
                               if (user.role === 'head' && user.department) {
                                 return rep.department === user.department;
                               }
                               return true;
                             });
                             return (
                               <>
                                 {filteredReport.map(rep => (
                            <tr key={rep.userId} className="hover:bg-[#151922]">
                              <td className="py-4">
                                <div className="font-bold text-white text-sm">{rep.name}</div>
                                <div className="text-[10px] text-gray-500 uppercase">{rep.role} {rep.position ? `(${rep.position})` : ''}</div>
                                {rep.employmentCode && (
                                  <div className="text-[9px] font-mono text-orange-400 font-semibold mt-1 bg-orange-500/5 px-1.5 py-0.5 rounded w-fit">
                                    Code: {rep.employmentCode}
                                  </div>
                                )}
                                {rep.joiningDate && (
                                  <div className="text-[9px] text-gray-400 mt-0.5 font-medium">
                                    Joined: {(() => {
                                      const parts = rep.joiningDate.split('-');
                                      if (parts.length === 3) {
                                        return `${parts[2]}/${parts[1]}/${parts[0]}`;
                                      }
                                      return rep.joiningDate;
                                    })()}
                                  </div>
                                )}
                              </td>
                              <td className="py-4 font-mono">₹{rep.salaryBase}</td>
                              <td className="py-4 space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-emerald-400 font-bold">{rep.presentDays} Days Present</span>
                                  {rep.lateArrivalsCount > 0 && (
                                    <span className="bg-red-500/10 text-red-400 px-1 py-0.5 rounded text-[8px] font-bold">
                                      {rep.lateArrivalsCount} Late (-₹{rep.lateDeductionsTotal})
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-gray-400">
                                  Leaves/Absences: <span className="text-red-400 font-semibold">{rep.leaveDays + rep.absentDays + rep.sundayDeductedCount} Days</span>
                                </div>
                                <div className="text-[10px] text-gray-500 flex flex-wrap gap-1">
                                  {rep.sundayOvertimeCount > 0 && (
                                    <span className="bg-blue-500/10 text-blue-400 px-1 py-0.5 rounded text-[8px] font-bold">
                                      Sunday OT: {rep.sundayOvertimeCount}x (+₹{rep.sundayOvertimeEarned})
                                    </span>
                                  )}
                                  {rep.weekdayOvertimeHours > 0 && (
                                    <span className="bg-purple-500/10 text-purple-400 px-1 py-0.5 rounded text-[8px] font-bold">
                                      Weekday OT: {rep.weekdayOvertimeHours}h (+₹{rep.weekdayOvertimePay})
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 font-mono">
                                <span className={rep.performancePct >= 80 ? "text-emerald-400 font-bold" : "text-yellow-500 font-bold"}>
                                  {rep.performancePct}%
                                </span>
                                <div className="text-[10px] text-gray-500">
                                  {rep.role === 'admin' ? 'Task Ratio' : `Target: ${rep.monthlyTarget}`}
                                </div>
                                {rep.performancePct < 80 && rep.performanceDeduction > 0 && (
                                  <div className="text-[9px] text-red-400 font-bold">
                                    Low performance penalty: -₹{rep.performanceDeduction}
                                  </div>
                                )}
                              </td>
                              <td className="py-4 text-emerald-400 font-bold">
                                ₹{rep.incentiveAmount}
                                <div className="text-[10px] text-gray-500">
                                  {rep.role === 'admin' ? `+₹${rep.commissionRate}/approved task` : `+${rep.incentivePct}% added`}
                                </div>
                              </td>
                              <td className="py-4 font-black text-white text-sm">
                                ₹{rep.finalSalary}
                                {rep.override?.forceFullSalary && (
                                  <div className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1 py-0.5 rounded font-bold w-fit mt-1">
                                    OVERRIDE: FULL SALARY RELEASED
                                  </div>
                                )}
                                {rep.appliedCustomAllowances && rep.appliedCustomAllowances.length > 0 && (
                                  <div className="space-y-0.5 mt-1">
                                    {rep.appliedCustomAllowances.map((al: any, aIdx: number) => (
                                      <div key={aIdx} className="text-[9px] text-emerald-400 bg-emerald-500/5 px-1 py-0.5 rounded font-medium">
                                        +{al.name}: ₹{al.amount}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {rep.appliedCustomDeductions && rep.appliedCustomDeductions.length > 0 && (
                                  <div className="space-y-0.5 mt-1">
                                    {rep.appliedCustomDeductions.map((de: any, dIdx: number) => (
                                      <div key={dIdx} className="text-[9px] text-red-400 bg-red-500/5 px-1 py-0.5 rounded font-medium">
                                        -{de.name}: ₹{de.amount}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="py-4 space-y-1.5">
                                {/* Overrides Action Grid */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleOverride(rep.userId, 'performance')}
                                  className={`w-full block text-left px-2 py-1 rounded text-[9px] font-bold border transition ${
                                    rep.override?.forceFullSalary 
                                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                      : 'bg-gray-500/5 border-gray-500/10 text-gray-400 hover:bg-gray-500/10'
                                  }`}
                                >
                                  🎯 Full Salary Override: {rep.override?.forceFullSalary ? 'ON (चालू)' : 'OFF (बंद)'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleOverride(rep.userId, 'leave')}
                                  className={`w-full block text-left px-2 py-1 rounded text-[9px] font-bold border transition ${
                                    rep.override?.extraLeavePaid 
                                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                      : 'bg-gray-500/5 border-gray-500/10 text-gray-400 hover:bg-gray-500/10'
                                  }`}
                                >
                                  🌴 Extra Leaves Paid: {rep.override?.extraLeavePaid ? 'ON (चालू)' : 'OFF (बंद)'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleOverride(rep.userId, 'overtime')}
                                  className={`w-full block text-left px-2 py-1 rounded text-[9px] font-bold border transition ${
                                    rep.override?.approveOvertime !== false 
                                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                      : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                                  }`}
                                >
                                  ⏰ Allow Overtime Pay: {rep.override?.approveOvertime !== false ? 'YES (हां)' : 'NO (नहीं)'}
                                </button>
                              </td>
                              <td className="py-4">
                                {rep.isReleased ? (
                                  <div className="space-y-1">
                                    <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2 py-1 rounded text-[9px] block text-center">
                                      ✅ PAID / RELEASED
                                    </span>
                                    <div className="text-[8px] text-gray-500 text-center">
                                      Paid: {new Date(rep.releasedAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleReleaseSalary(rep.userId, rep.finalSalary)}
                                    className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-bold py-1.5 px-2 rounded-lg text-[9px] cursor-pointer text-center uppercase tracking-wider transition"
                                  >
                                    💵 Release Payout
                                  </button>
                                )}
                              </td>
                              <td className="py-4 text-center">
                                <button
                                  onClick={() => setSelectedSlipUser(rep)}
                                  className="bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-[#f97316] px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                                >
                                  View Slip
                                </button>
                              </td>
                            </tr>
                          ))}
                          {filteredReport.length === 0 && (
                            <tr>
                              <td colSpan={9} className="py-8 text-center text-gray-500">No staff members listed in the audited report.</td>
                            </tr>
                          )}
                          {(() => {
                            const grandTotalNetSalary = filteredReport.reduce((acc, curr) => acc + (curr.finalSalary || 0), 0);
                            const getMonthName = (monthStr: string) => {
                              if (!monthStr) return "";
                              const parts = monthStr.split('-');
                              if (parts.length === 2) {
                                const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                                const mIndex = parseInt(parts[1], 10) - 1;
                                return `${monthNames[mIndex]} ${parts[0]}`;
                              }
                              return monthStr;
                            };
                            if (filteredReport.length > 0) {
                              return (
                                <tr className="bg-[#0c0e14] font-black border-t-2 border-[#1f2635]">
                                  <td colSpan={5} className="py-5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    GRAND TOTAL OF SALARY FOR {getMonthName(selectedPayrollMonth)} :
                                  </td>
                                  <td colSpan={4} className="py-5 text-left text-sm text-[#f97316] font-extrabold pl-4">
                                    ₹{grandTotalNetSalary.toLocaleString('en-IN')}
                                  </td>
                                </tr>
                              );
                            }
                            return null;
                          })()}
                               </>
                             );
                           })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {hrmSubTab === 'my_salary_slip' && (
                <div className="space-y-6 max-w-xl mx-auto text-left">
                  <div className="bg-[#111622] border border-[#1f2635] rounded-2xl p-6">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">My Monthly Payslip (मेरा सैलरी स्लिप)</h3>
                    <p className="text-xs text-gray-400 mb-6">Audited monthly payroll summary with detailed incentive and attendance reports.</p>
                    
                    {(() => {
                      const rep = payrollReport.find(r => r.userId === user.id);
                      if (!rep) {
                        return (
                          <div className="text-center py-8 text-gray-500 text-xs">
                            No payroll records found for you in the target period of {selectedPayrollMonth}. Please ensure your attendance has been logged!
                          </div>
                        );
                      }
                      return (
                        <div className="bg-white text-gray-900 rounded-2xl p-6 shadow-2xl border-2 border-gray-200 space-y-6 font-sans printable-slip">
                          {/* Slip Header */}
                          <div className="text-center border-b pb-4 border-gray-200">
                            <h4 className="text-lg font-black tracking-tight text-orange-600 uppercase">HubSphere</h4>
                            <p className="text-[11px] text-gray-700 font-bold mt-0.5 font-sans">Salary Slip for {selectedPayrollMonth}</p>
                          </div>

                          {/* Employee Meta */}
                          <div className="grid grid-cols-2 gap-y-2 text-xs border-b pb-4 border-gray-100">
                            <div>
                              <span className="text-[10px] text-gray-500 uppercase font-bold block font-sans">Employee Name</span>
                              <span className="font-extrabold text-gray-800">{rep.name}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-500 uppercase font-bold block font-sans">Designation / Job Position</span>
                              <span className="font-bold text-gray-800 uppercase font-sans">{rep.role} {rep.position ? `(${rep.position})` : ''}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-500 uppercase font-bold block font-sans">Department Segment</span>
                              <span className="font-semibold text-gray-700">{user.department || 'Sales'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-500 uppercase font-bold block font-sans">Email & Phone</span>
                              <span className="text-gray-600 block">{user.email}</span>
                              <span className="text-gray-600 block font-mono">{user.phone || 'N/A'}</span>
                            </div>
                          </div>

                          {/* Earnings & Deductions Tables */}
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            {/* Earnings column */}
                            <div className="space-y-2 border-r pr-4 border-gray-200">
                              <span className="text-[10px] font-bold text-emerald-600 block border-b pb-1 font-sans">EARNINGS / ALLOWANCES</span>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Base Contract Pay:</span>
                                <span className="font-mono font-bold text-gray-800">₹{rep.salaryBase}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Incentive Reward:</span>
                                <span className="font-mono font-bold text-emerald-600">+₹{rep.incentiveAmount}</span>
                              </div>
                              <p className="text-[9px] text-gray-400 leading-tight">
                                {rep.role === 'admin' ? `${rep.approvedTasks} of ${rep.totalTasks} approved tasks` : `${rep.salesDoneCount} sales logged`}
                              </p>
                            </div>

                            {/* Attendance / Deductions column */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-red-600 block border-b pb-1 font-sans">ATTENDANCE DEDUCTIONS</span>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Worked Present:</span>
                                <span className="font-bold text-gray-800">{rep.presentDays} Days</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Leaves / Absences:</span>
                                <span className="font-bold text-red-600">{rep.leaveDays + rep.absentDays} Days</span>
                              </div>
                              <p className="text-[9px] text-gray-400 leading-tight">
                                Pro-rata deductions applied based on daily clock-out records.
                              </p>
                            </div>
                          </div>

                          {/* Net Payable block */}
                          <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center border border-gray-200">
                            <div>
                              <span className="text-[9px] font-bold text-gray-500 block uppercase font-sans">Total Net Payable</span>
                              <span className="text-xs text-gray-400">Paid securely into registered credentials</span>
                            </div>
                            <span className="text-2xl font-black text-gray-900 font-mono">
                              ₹{rep.finalSalary}
                            </span>
                          </div>

                          {/* Footer details */}
                          <div className="text-center pt-2 text-[10px] text-gray-500 leading-normal border-t border-gray-100 font-sans no-print">
                            HubSphere Systems CRM • 100% Digital Audited Ledger
                            <button
                              type="button"
                              onClick={() => window.print()}
                              className="mt-4 w-full bg-[#f97316] hover:bg-orange-600 text-white py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              🖨️ Print / Download PDF
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: DAILY EXCEL BACKUPS */}
          {activeTab === 'backups' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white">Daily Excel & CSV Backups</h2>
                  <p className="text-xs text-gray-400 mt-1">Secure cloud backup registry and manual storage extraction tools</p>
                </div>
                <button
                  onClick={handleManualBackup}
                  className="bg-[#f97316] hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Initiate Cloud Backup
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* BACKUP EXPORT & CHANNEL DISPATCH PANEL */}
                <div className="md:col-span-2 bg-[#111622] border border-[#1f2635] p-6 rounded-2xl">
                  <div className="mb-6">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <HardDrive className="w-5 h-5 text-[#f97316]" /> Excel Backups & Dispatch Console
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Extract and download the entire current Active Leads Registry directly as a standard, universally readable Microsoft Excel compatible CSV sheet, or automatically route it via direct WhatsApp/email dispatch channels.
                    </p>
                  </div>

                  {/* Channel Tabs Selector */}
                  <div className="grid grid-cols-3 gap-2 bg-[#0d1017] p-1 rounded-xl border border-[#1f2635] mb-5 font-sans">
                    <button
                      type="button"
                      onClick={() => setShareChannel('download')}
                      className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        shareChannel === 'download'
                          ? 'bg-[#f97316] text-white shadow'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      📥 Excel CSV Download
                    </button>
                    <button
                      type="button"
                      onClick={() => setShareChannel('whatsapp')}
                      className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        shareChannel === 'whatsapp'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      💬 WhatsApp Dispatch
                    </button>
                    <button
                      type="button"
                      onClick={() => setShareChannel('email')}
                      className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        shareChannel === 'email'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      ✉️ Email Dispatch
                    </button>
                  </div>

                  {/* Form Content */}
                  <form onSubmit={handleShareBackup} className="space-y-4">
                    {shareChannel === 'download' && (
                      <div className="bg-[#151922] p-4 rounded-xl border border-[#1f2635] flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-xs text-gray-300">
                          <span className="font-bold text-white block mb-0.5">Ready for Local Save</span>
                          Download complete registry of leads and telecallers containing all status parameters.
                        </div>
                        <a
                          href="/api/backups/download"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-3 rounded-lg shadow transition cursor-pointer text-center block w-full sm:w-auto"
                        >
                          ⬇️ Download CSV File
                        </a>
                      </div>
                    )}

                    {shareChannel === 'whatsapp' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">RECIPIENT WHATSAPP NUMBER</label>
                            <input
                              type="text"
                              required
                              value={shareDestination}
                              onChange={(e) => setShareDestination(e.target.value)}
                              placeholder="e.g. +919876543210"
                              className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-emerald-500 outline-none rounded-xl px-4 py-2 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">CUSTOM MEMO / MESSAGE</label>
                            <input
                              type="text"
                              value={shareNotes}
                              onChange={(e) => setShareNotes(e.target.value)}
                              placeholder="e.g. Daily sales lead backup"
                              className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-emerald-500 outline-none rounded-xl px-4 py-2 text-xs"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={sharingBackup}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                        >
                          💬 Send Data Backup via WhatsApp
                        </button>
                      </div>
                    )}

                    {shareChannel === 'email' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">RECIPIENT EMAIL ADDRESS</label>
                            <input
                              type="email"
                              required
                              value={shareEmail}
                              onChange={(e) => setShareEmail(e.target.value)}
                              placeholder="e.g. admin@company.com"
                              className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-blue-500 outline-none rounded-xl px-4 py-2 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">CUSTOM MEMO / MESSAGE</label>
                            <input
                              type="text"
                              value={shareNotes}
                              onChange={(e) => setShareNotes(e.target.value)}
                              placeholder="e.g. CRM database secure backup"
                              className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-blue-500 outline-none rounded-xl px-4 py-2 text-xs"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={sharingBackup}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                        >
                          ✉️ Dispatch Backup to Email
                        </button>
                      </div>
                    )}
                  </form>
                </div>

                {/* AUTOBACKUP STATUS & CRASH RECOVERY SECURITY SETUP CARD */}
                <div className="flex flex-col gap-4">
                  {/* AUTO STATUS */}
                  <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                      Automatic Backup Service
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed mb-1">
                      Our servers perform scheduled database state preservation cycles every 24 hours at 11:30 PM (23:30 IST) automatically.
                    </p>
                    <span className="text-[10px] font-bold text-[#f97316] uppercase mt-1 block">
                      Active Target: {adminBackupEmail}
                    </span>
                  </div>

                  {/* CRASH RECOVERY SECURITY SETUP CARD */}
                  <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                        <Shield className="w-4 h-4 text-[#f97316] animate-pulse" />
                        🛡️ Emergency Recovery Security Setup
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                        Configure the emergency security question & alert option contacts. Any unauthorized attempt to restore database snapshots will instantly trigger warning alerts to your configured Whatsapp & Email.
                      </p>
                    </div>

                    <form onSubmit={handleSaveSecurityConfig} className="space-y-3">
                      {/* Security Question Input */}
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">
                          SECURITY QUESTION (सुरक्षा प्रश्न)
                        </label>
                        <input
                          type="text"
                          required
                          value={securityQuestion}
                          onChange={(e) => setSecurityQuestion(e.target.value)}
                          placeholder="e.g. elephant ke kitne daatt hote hai"
                          className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-3 py-2 text-xs"
                        />
                      </div>

                      {/* Security Answer Input */}
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">
                          SECURITY ANSWER (सुरक्षा उत्तर)
                        </label>
                        <input
                          type="text"
                          required
                          value={securityAnswer}
                          onChange={(e) => setSecurityAnswer(e.target.value)}
                          placeholder="e.g. 0000"
                          className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-3 py-2 text-xs font-mono"
                        />
                      </div>

                      {/* 11:30 PM Email Recipient */}
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">
                          11:30 PM AUTO-BACKUP RECIPIENT EMAIL (ऑटो-बैकअप ईमेल)
                        </label>
                        <input
                          type="email"
                          required
                          value={adminBackupEmail}
                          onChange={(e) => setAdminBackupEmail(e.target.value)}
                          placeholder="e.g. contact.grahicsworld@gmail.com"
                          className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-3 py-2 text-xs"
                        />
                      </div>

                      {/* Alert Options Group */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 block mb-1 uppercase">
                            ALERT WHATSAPP
                          </label>
                          <input
                            type="text"
                            required
                            value={alertWhatsapp}
                            onChange={(e) => setAlertWhatsapp(e.target.value)}
                            placeholder="e.g. 9301056006"
                            className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-2 py-1.5 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 block mb-1 uppercase">
                            ALERT EMAIL
                          </label>
                          <input
                            type="email"
                            required
                            value={alertEmail}
                            onChange={(e) => setAlertEmail(e.target.value)}
                            placeholder="e.g. ipgroup2002@gmail.com"
                            className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-2 py-1.5 text-xs"
                          />
                        </div>
                      </div>

                      {saveSecurityMessage && (
                        <div className={`p-2.5 rounded-lg border text-[10px] font-bold leading-relaxed ${
                          saveSecurityMessage.startsWith('❌') 
                            ? 'bg-red-500/5 border-red-500/15 text-red-400' 
                            : 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400'
                        }`}>
                          {saveSecurityMessage}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSavingSecurity}
                        className="w-full bg-[#f97316] hover:bg-orange-600 disabled:opacity-50 text-white font-extrabold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 uppercase"
                      >
                        {isSavingSecurity ? (
                          <span className="animate-spin">🌀</span>
                        ) : (
                          <Lock className="w-3.5 h-3.5" />
                        )}
                        🔒 Update Security Config
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* BACKUPS HISTORY LOGS */}
              <div className="bg-[#111622] border border-[#1f2635] rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[#1f2635] bg-[#0d1017]">
                  <h3 className="text-sm font-bold text-white">Backups Log Records</h3>
                </div>
                <div className="divide-y divide-[#1f2635]">
                  {backups.map(bk => (
                    <div key={bk.id} className="p-4 flex justify-between items-center hover:bg-[#151922]">
                      <div>
                        <h4 className="font-bold text-sm text-white">{bk.name}</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5">{new Date(bk.timestamp).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-xs">
                          <span className="text-gray-400 block">{bk.leadsCount} leads preserved</span>
                          <span className="text-[#f97316] font-bold block mt-0.5">{bk.callsCount} call sessions</span>
                        </div>
                        <button
                          onClick={() => handleDeleteBackup(bk.id)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 rounded-lg transition duration-150 cursor-pointer"
                          title="Delete Backup snapshot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {backups.length === 0 && (
                    <div className="p-8 text-center text-xs text-gray-500">
                      No system backups manually created in this workspace yet.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 9: AUTO-CALLING DELAY SETUP */}
          {activeTab === 'autocall' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">Dialer Console Settings</h2>
                <p className="text-xs text-gray-400 mt-1">Configure global automated dialer delay settings and auto-calling policies</p>
              </div>

              <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-2xl max-w-lg space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Auto-Dialing Modes Policy</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    When telecallers activate Auto-Calling mode, completing a call log triggers an automatic countdown timer before dial-calling the next allocated customer lead.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-300 font-bold">Default Dial Countdown Timer</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min="1"
                        max="60"
                        value={autoCallDelay}
                        onChange={(e) => setAutoCallDelay(Number(e.target.value))}
                        className="bg-[#0e121a] text-white border border-[#222b3c] rounded px-3 py-1 text-center font-bold text-sm w-16 outline-none"
                      />
                      <span className="text-xs text-gray-400">Seconds</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-300 font-bold">Enable Global Auto-Calling System</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={autoCallEnabled}
                        onChange={(e) => setAutoCallEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[#222b3c] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#f97316]"></div>
                    </label>
                  </div>
                </div>

                <button 
                  onClick={handleSaveConfig}
                  className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                >
                  Save Global Configurations
                </button>
              </div>

              {/* TESTING & EXPIRY MANAGEMENT PANEL */}
              <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-2xl max-w-lg space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">System Testing Expiry Settings</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Monitor system testing time limit. Main Admin can extend the expiry date directly. Non-admin roles will be locked out automatically upon reaching this date. (टेस्टिंग अवधि समाप्ति तिथि और समय सीमा यहाँ से बढ़ाएं)
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-300 font-bold">Current Testing Status</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-black ${
                      testingRemainingDays <= 0
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-orange-500/10 text-orange-400'
                    }`}>
                      {testingRemainingDays <= 0 
                        ? '⚠️ EXPIRED (अवधि समाप्त)' 
                        : `⚡ ACTIVE (${testingRemainingDays} DAYS LEFT)`
                      }
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-300 font-bold">Expiry Date (समाप्ति तिथि)</span>
                    <input 
                      type="date" 
                      value={testingExpiryDate}
                      onChange={(e) => setTestingExpiryDate(e.target.value)}
                      className="bg-[#0e121a] text-white border border-[#222b3c] rounded px-3 py-1.5 font-bold text-xs outline-none"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-300 font-bold">Enforce Testing Period Limit</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={testingActive}
                        onChange={(e) => setTestingActive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[#222b3c] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#f97316]"></div>
                    </label>
                  </div>
                </div>

                <button 
                  onClick={handleSaveTestingPeriod}
                  className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                >
                  Extend / Save Testing Expiry Settings
                </button>
              </div>
            </div>
          )}

          {/* TAB 10: 24/7 TECHNICAL SUPPORT TICKETS */}
          {activeTab === 'support' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">24/7 Technical Support Registry</h2>
                <p className="text-xs text-gray-400 mt-1">Audit and resolve telecaller technical support queries instantly</p>
              </div>

              <div className="bg-[#111622] border border-[#1f2635] rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[#1f2635] bg-[#0d1017]">
                  <h3 className="text-sm font-bold text-white">Active Support Query Tickets</h3>
                </div>
                <div className="divide-y divide-[#1f2635]">
                  {supportTickets.map(tk => {
                    return (
                      <div key={tk.id} className="p-6 space-y-4 hover:bg-[#151922] transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider mr-2 ${
                              tk.status === 'open' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {tk.status}
                            </span>
                            <span className="text-xs text-gray-500">{new Date(tk.timestamp).toLocaleString()}</span>
                            <h4 className="font-extrabold text-base text-white mt-1.5">{tk.subject}</h4>
                            <p className="text-xs text-gray-400 mt-1">
                              From: <strong className="text-gray-300">{tk.userName}</strong> ({tk.userEmail})
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteTicket(tk.id)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 rounded-lg transition duration-150 cursor-pointer"
                            title="Delete Support Ticket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="bg-[#0e121a] border border-[#1f2635] p-4 rounded-xl text-sm text-gray-300 whitespace-pre-wrap">
                          {tk.message}
                        </div>

                        {tk.reply ? (
                          <div className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-xl space-y-1">
                            <span className="text-[10px] font-bold text-[#f97316] uppercase tracking-wider">ADMINISTRATOR REPLY:</span>
                            <p className="text-sm text-gray-300 italic">"{tk.reply}"</p>
                          </div>
                        ) : (
                          <div className="bg-[#0c0f16] border border-[#1f2635] p-4 rounded-xl space-y-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Write Reply Resolution:</span>
                            <textarea 
                              placeholder="Type support reply or troubleshooting steps..."
                              rows={2}
                              id={`reply-text-${tk.id}`}
                              className="w-full bg-[#111622] border border-[#1f2635] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#f97316]"
                            />
                            <div className="text-right">
                              <button
                                onClick={() => {
                                  const textVal = (document.getElementById(`reply-text-${tk.id}`) as HTMLTextAreaElement)?.value;
                                  if (!textVal) return showNotification('Reply content is required', 'error');
                                  handleResolveTicket(tk.id, textVal);
                                }}
                                className="bg-[#f97316] hover:bg-orange-600 text-white font-bold text-[11px] px-4 py-2 rounded-lg cursor-pointer"
                              >
                                Submit Support Reply & Resolve
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {supportTickets.length === 0 && (
                    <div className="p-12 text-center text-xs text-gray-500">
                      No customer/caller technical support tickets generated yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* DETAILED EMPLOYEE PAYSLIP (सैलरी स्लिप) MODAL */}
      {selectedSlipUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111622] border border-[#1f2635] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-[#1f2635] bg-[#0d1017] flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-white">Employee Payslip (सैलरी स्लिप)</h3>
                <p className="text-xs text-gray-400">Statement of Earnings and Deductions for {selectedPayrollMonth}</p>
              </div>
              <button 
                onClick={() => setSelectedSlipUser(null)}
                className="text-gray-400 hover:text-white font-bold text-sm bg-[#1a202c] px-3 py-1.5 rounded-lg cursor-pointer"
              >
                Close ✕
              </button>
            </div>
            {/* Slip Body */}
            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] printable-slip">
              {/* Corporate Header */}
              <div className="border-b border-[#1f2635] pb-6 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-[#f97316] tracking-tight text-left">HubSphere</h2>
                  <p className="text-xs text-gray-500 mt-1 text-left font-bold">Salary Slip for {selectedPayrollMonth}</p>
                </div>
                <div className="text-right">
                  {selectedSlipUser.isReleased ? (
                    <div className="text-right">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold">
                        ✅ RELEASED & PAID (भुगतान हो गया)
                      </span>
                      <p className="text-[9px] text-gray-500 mt-1">Paid on {new Date(selectedSlipUser.releasedAt).toLocaleDateString()}</p>
                    </div>
                  ) : (
                    <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-full text-xs font-semibold">
                      ⏳ PENDING RELEASE (भुगतान प्रक्रिया में)
                    </span>
                  )}
                  <p className="text-[10px] text-gray-500 mt-2">Generated on {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Employee Info Block */}
              <div className="grid grid-cols-2 gap-4 text-xs text-left">
                <div>
                  <p className="text-gray-500">Employee Name:</p>
                  <p className="font-bold text-white text-sm">{selectedSlipUser.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Employee Role / Position:</p>
                  <p className="font-bold text-[#f97316] uppercase">{selectedSlipUser.role} {selectedSlipUser.position ? `(${selectedSlipUser.position})` : ''}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email Address:</p>
                  <p className="text-gray-300">{selectedSlipUser.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Monthly Target:</p>
                  <p className="text-gray-300 font-bold">{selectedSlipUser.monthlyTarget} Sales / Tasks</p>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="border border-[#1f2635] rounded-xl overflow-hidden text-xs text-left">
                <div className="grid grid-cols-2 bg-[#f97316] text-white border-b border-[#1f2635] p-3 font-bold">
                  <div>Description</div>
                  <div className="text-right">Amount (₹)</div>
                </div>
                
                <div className="divide-y divide-[#1f2635]">
                  <div className="grid grid-cols-2 p-3 text-gray-300">
                    <div>Basic Base Salary (महीने की बेसिक सैलरी)</div>
                    <div className="text-right">₹{selectedSlipUser.salaryBase.toLocaleString()}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 p-3 text-gray-300">
                    <div>
                      Deductions (Approved Leaves + Absences + Sunday Deductions)
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {selectedSlipUser.leaveDays} Leaves, {selectedSlipUser.absentDays} Absences, {selectedSlipUser.sundayDeductedCount} Sun Deductions (Sandwich Rule applied)
                      </p>
                    </div>
                    <div className="text-right text-red-400">-₹{selectedSlipUser.totalDeductions.toLocaleString()}</div>
                  </div>

                  {selectedSlipUser.lateArrivalsCount > 0 && (
                    <div className="grid grid-cols-2 p-3 text-gray-300">
                      <div>
                        Late Arrival Deduction (देर से आने का शुल्क)
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {selectedSlipUser.lateArrivalsCount} Late Arrivals beyond 10:18 AM grace window (-1h pay per 10 mins late)
                        </p>
                      </div>
                      <div className="text-right text-red-400">-₹{selectedSlipUser.lateDeductionsTotal.toLocaleString()}</div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 p-3 text-gray-300 bg-[#161d2b]/30">
                    <div className="font-semibold text-white">Net Basic Earned Before Performance (हाजिरी के बाद बेसिक)</div>
                    <div className="text-right font-semibold text-white">₹{selectedSlipUser.finalBasicSalaryBeforePerformance?.toLocaleString() || selectedSlipUser.finalBasicSalary.toLocaleString()}</div>
                  </div>

                  {selectedSlipUser.performanceDeduction > 0 && (
                    <div className="grid grid-cols-2 p-3 text-gray-300">
                      <div>
                        Performance Scaled Penalty (काम का परफॉरमेंस कट)
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          Performance is {selectedSlipUser.performancePct}% (Less than 80% threshold). Scaled basic pay accordingly.
                        </p>
                      </div>
                      <div className="text-right text-red-400">-₹{selectedSlipUser.performanceDeduction.toLocaleString()}</div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 p-3 text-gray-300 bg-[#161d2b]/30">
                    <div className="font-semibold text-white">Final Net Basic Earned (कुल बेसिक सैलरी)</div>
                    <div className="text-right font-semibold text-white">₹{selectedSlipUser.finalBasicSalary.toLocaleString()}</div>
                  </div>

                  {selectedSlipUser.role === 'telecaller' && (
                    <div className="grid grid-cols-2 p-3 text-gray-300">
                      <div>
                        Incentive Earned (इंसेंटिव)
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          Conversion Pct: {selectedSlipUser.performancePct}% ({selectedSlipUser.salesDoneCount} Sales) | Exceeded: +{selectedSlipUser.incentivePct}%
                        </p>
                      </div>
                      <div className="text-right text-emerald-400 font-bold">+₹{selectedSlipUser.incentiveAmount.toLocaleString()}</div>
                    </div>
                  )}

                  {selectedSlipUser.role === 'admin' && (
                    <div className="grid grid-cols-2 p-3 text-gray-300 font-sans">
                      <div>
                        Task Performance Incentive (इंसेंटिव)
                        <p className="text-[10px] text-gray-500 mt-0.5 font-sans">
                          Approved Tasks: {selectedSlipUser.approvedTasks} of {selectedSlipUser.totalTasks} ({selectedSlipUser.performancePct}%) | Rate: ₹{selectedSlipUser.commissionRate} per task
                        </p>
                      </div>
                      <div className="text-right text-emerald-400 font-bold">+₹{selectedSlipUser.incentiveAmount.toLocaleString()}</div>
                    </div>
                  )}

                  {selectedSlipUser.weekdayOvertimePay > 0 && (
                    <div className="grid grid-cols-2 p-3 text-gray-300">
                      <div>
                        Weekday Overtime (सामान्य ओवरटाइम - 150%)
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {selectedSlipUser.weekdayOvertimeHours} hours worked beyond 9h shift at 1.5x basic hourly rate
                        </p>
                      </div>
                      <div className="text-right text-emerald-400 font-bold">+₹{selectedSlipUser.weekdayOvertimePay.toLocaleString()}</div>
                    </div>
                  )}

                  {selectedSlipUser.sundayOvertimeEarned > 0 && (
                    <div className="grid grid-cols-2 p-3 text-gray-300">
                      <div>
                        Sunday Overtime (रविवार ओवरटाइम - 150% Basic Day Pay)
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {selectedSlipUser.sundayOvertimeCount} Sundays worked. Paid at 150% daily rate per Sunday.
                        </p>
                      </div>
                      <div className="text-right text-emerald-400 font-bold">+₹{selectedSlipUser.sundayOvertimeEarned.toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Payable */}
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex justify-between items-center">
                <div className="text-left">
                  <p className="text-xs text-gray-400">Total Net Payable (कुल प्राप्त सैलरी)</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-semibold">Basic Earned + Performance Incentive + Overtime Hours</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#f97316]">₹{selectedSlipUser.finalSalary.toLocaleString()}</span>
                </div>
              </div>

              {/* Attendance breakdown in slip */}
              <div className="space-y-2 text-left">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Attendance Breakdown ({selectedPayrollMonth})</h4>
                <div className="grid grid-cols-7 gap-1 bg-[#f97316] p-2 rounded-xl border border-orange-600 text-center text-[10px]">
                  {selectedSlipUser.detailDays && selectedSlipUser.detailDays.map((day: any) => {
                    let bg = "bg-white/20 text-white border border-white/30";
                    if (day.type.startsWith("Present")) bg = "bg-emerald-600 text-white border border-emerald-700";
                    if (day.type.startsWith("Leave")) bg = "bg-yellow-500 text-gray-900 border border-yellow-600 font-bold";
                    if (day.type === "Absent") bg = "bg-red-600 text-white border border-red-700 font-bold";
                    if (day.type === "Sunday-Paid") bg = "bg-blue-600 text-white border border-blue-700";
                    if (day.type === "Sunday-Deducted") bg = "bg-orange-800 text-white border border-orange-900";
                    if (day.type === "Sunday-Overtime") bg = "bg-purple-600 text-white border border-purple-700 font-bold animate-pulse";

                    return (
                      <div key={day.day} className={`p-1.5 rounded-md flex flex-col justify-between h-10 ${bg}`} title={day.label}>
                        <span className="font-bold text-[11px]">{day.day}</span>
                        <span className="text-[8px] truncate font-bold uppercase">{day.type.split("-")[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-center pt-4 no-print">
                <button 
                  onClick={() => window.print()}
                  className="bg-[#f97316] hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 mx-auto cursor-pointer"
                >
                  🖨️ Download PDF / Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEAVE REJECTION REASON MODAL */}
      {rejectionModalLeaveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111622] border border-[#1f2635] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col p-6 space-y-4">
            <div className="text-left">
              <h3 className="text-base font-black text-white">Leave Reject Reason (अस्वीकृति का कारण)</h3>
              <p className="text-xs text-gray-400 mt-1">Please enter why this leave is being rejected so the employee can view and reply.</p>
            </div>
            
            <textarea
              value={rejectionInputReason}
              onChange={(e) => setRejectionInputReason(e.target.value)}
              placeholder="e.g., Shortage of team members on these dates..."
              className="w-full bg-[#0d1017] text-white border border-[#222b3c] rounded-xl px-3 py-2 text-xs focus:border-[#f97316] outline-none h-24 resize-none"
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRejectionModalLeaveId(null)}
                className="px-4 py-2 text-xs font-bold text-gray-400 bg-[#1e2635] rounded-xl hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!rejectionInputReason.trim()) {
                    showNotification("Please specify a reason for rejection", "error");
                    return;
                  }
                  handleApproveLeave(rejectionModalLeaveId, 'Rejected', rejectionInputReason);
                  setRejectionModalLeaveId(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl cursor-pointer"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN QUERY RESPONSE MODAL */}
      {queryResponseLeaveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111622] border border-[#1f2635] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col p-6 space-y-4">
            <div className="text-left">
              <h3 className="text-base font-black text-white">Respond to Employee Question (सवाल का जवाब दें)</h3>
              <p className="text-xs text-gray-400 mt-1">Type your official response. Once answered, you can change the status back to Approved or keep it Rejected.</p>
            </div>

            <textarea
              value={queryResponseText}
              onChange={(e) => setQueryResponseText(e.target.value)}
              placeholder="Write response..."
              className="w-full bg-[#0d1017] text-white border border-[#222b3c] rounded-xl px-3 py-2 text-xs focus:border-[#f97316] outline-none h-24 resize-none"
            />

            <div className="text-left space-y-2">
              <label className="text-[10px] text-gray-400 uppercase font-bold block">Final Action (अंतिम निर्णय)</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setQueryResponseAction('Approved')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    queryResponseAction === 'Approved'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-transparent text-gray-400 border-[#222b3c] hover:text-white'
                  }`}
                >
                  Approve (Pass)
                </button>
                <button
                  type="button"
                  onClick={() => setQueryResponseAction('Rejected')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    queryResponseAction === 'Rejected'
                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                      : 'bg-transparent text-gray-400 border-[#222b3c] hover:text-white'
                  }`}
                >
                  Keep Rejected
                </button>
              </div>
            </div>

            {queryResponseAction === 'Approved' && (
              <div className="text-left space-y-1.5">
                <label className="text-[10px] text-gray-400 uppercase font-bold block">Salary Treatment (सैलरी भुगतान प्रकार)</label>
                <select
                  value={queryResponsePayType}
                  onChange={(e) => setQueryResponsePayType(e.target.value)}
                  className="w-full bg-[#0d1017] text-white border border-[#222b3c] rounded-xl px-3 py-2 text-xs focus:border-[#f97316] outline-none"
                >
                  <option value="Full Pay">Full Pay (पूरा वेतन)</option>
                  <option value="Half Pay">Half Pay (आधा वेतन)</option>
                  <option value="Unpaid">Unpaid (बिना वेतन)</option>
                </select>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setQueryResponseLeaveId(null)}
                className="px-4 py-2 text-xs font-bold text-gray-400 bg-[#1e2635] rounded-xl hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!queryResponseText.trim()) {
                    showNotification("Please enter your response text", "error");
                    return;
                  }
                  handleRespondToQuery(
                    queryResponseLeaveId, 
                    queryResponseText, 
                    queryResponseAction, 
                    queryResponseAction === 'Approved' ? queryResponsePayType : undefined
                  );
                  setQueryResponseLeaveId(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-[#f97316] hover:bg-orange-600 rounded-xl cursor-pointer"
              >
                Submit Response
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* MAIN ADMIN: FULL EDIT CREDENTIALS & CONTRACT MODAL */}
      {/* ============================================== */}
      {editingFullUser && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#111622] border border-[#1f2635] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#1f2635] bg-[#0c0f16] flex justify-between items-center">
              <div className="text-left">
                <span className="text-[10px] font-bold text-[#f97316] uppercase tracking-wider block">MAIN POWER CONTROL PANEL</span>
                <h3 className="text-lg font-black text-white">Edit Credentials & Salary Contract</h3>
              </div>
              <button 
                onClick={() => setEditingFullUser(null)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFullUpdateUser} className="p-6 overflow-y-auto space-y-4 text-xs text-left">
              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">EMPLOYEE NAME *</label>
                <input
                  type="text"
                  required
                  value={editingFullUser.name || ''}
                  onChange={(e) => setEditingFullUser({ ...editingFullUser, name: e.target.value })}
                  className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">JOB POSITION (नौकरी का पद - e.g. Designer, Video Editor) *</label>
                <input
                  type="text"
                  required
                  value={editingFullUser.position || ''}
                  onChange={(e) => setEditingFullUser({ ...editingFullUser, position: e.target.value })}
                  className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">EMAIL ADDRESS (LOGIN USERNAME) *</label>
                <input
                  type="email"
                  required
                  value={editingFullUser.email || ''}
                  onChange={(e) => setEditingFullUser({ ...editingFullUser, email: e.target.value })}
                  className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">PASSWORD (LEAVE BLANK TO KEEP CURRENT)</label>
                <input
                  type="password"
                  placeholder="Type new secure password if updating..."
                  value={editingFullUser.password || ''}
                  onChange={(e) => setEditingFullUser({ ...editingFullUser, password: e.target.value })}
                  className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">CALLING PHONE *</label>
                  <input
                    type="text"
                    required
                    value={editingFullUser.phone || ''}
                    onChange={(e) => setEditingFullUser({ ...editingFullUser, phone: e.target.value })}
                    className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">WHATSAPP NUMBER</label>
                  <input
                    type="text"
                    value={editingFullUser.whatsapp || ''}
                    onChange={(e) => setEditingFullUser({ ...editingFullUser, whatsapp: e.target.value })}
                    className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">ORGANIZATIONAL ROLE</label>
                  <select
                    value={editingFullUser.role || 'staff'}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      const updatedUser = { ...editingFullUser, role: newRole };
                      if (newRole === 'sub-admin') {
                        updatedUser.department = 'All';
                      } else if (newRole === 'telecaller') {
                        updatedUser.department = 'Sales';
                      } else if (newRole === 'head') {
                        // If the edited user is not currently a head, let's auto-select the first available head department
                        if (editingFullUser.role !== 'head') {
                          if (!isTechHeadCreated) {
                            updatedUser.department = 'Tech';
                          } else if (!isNonTechHeadCreated) {
                            updatedUser.department = 'NonTech';
                          } else if (!isSalesHeadCreated) {
                            updatedUser.department = 'Sales';
                          } else {
                            updatedUser.department = 'Tech';
                          }
                        }
                      }
                      setEditingFullUser(updatedUser);
                    }}
                    className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-white"
                  >
                    <option value="telecaller">Telecaller (टेलीकॉलर)</option>
                    <option value="staff">Staff Member (कर्मचारी)</option>
                    <option value="head">Department Head (विभाग अध्यक्ष)</option>
                    <option value="sub-admin" disabled={!canSelectSubAdminInEdit}>
                      Sub-Admin (सब-एडमिन) {!canSelectSubAdminInEdit ? " - Limit Reached (अधिकतम 1)" : ""}
                    </option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">DEPARTMENT SEGMENT</label>
                  <select
                    value={editingFullUser.role === 'sub-admin' ? 'All' : (editingFullUser.role === 'telecaller' ? 'Sales' : (editingFullUser.department || 'Sales'))}
                    onChange={(e) => setEditingFullUser({ ...editingFullUser, department: e.target.value })}
                    disabled={editingFullUser.role === 'sub-admin' || editingFullUser.role === 'telecaller'}
                    className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingFullUser.role === 'sub-admin' ? (
                      <option value="All">All Segments (सभी विभाग - Disabled for Sub-Admin)</option>
                    ) : (
                      <>
                        <option 
                          value="Tech" 
                          disabled={editingFullUser.role === 'telecaller' || (editingFullUser.role === 'head' && isTechHeadCreated && editingFullUser.department !== 'Tech')}
                        >
                          Tech Segment {editingFullUser.role === 'telecaller' ? " (Disabled)" : (editingFullUser.role === 'head' && isTechHeadCreated && editingFullUser.department !== 'Tech' ? " - Head Limit Reached (अधिकतम 1)" : "")}
                        </option>
                        <option 
                          value="NonTech" 
                          disabled={editingFullUser.role === 'telecaller' || (editingFullUser.role === 'head' && isNonTechHeadCreated && editingFullUser.department !== 'NonTech')}
                        >
                          NonTech Segment {editingFullUser.role === 'telecaller' ? " (Disabled)" : (editingFullUser.role === 'head' && isNonTechHeadCreated && editingFullUser.department !== 'NonTech' ? " - Head Limit Reached (अधिकतम 1)" : "")}
                        </option>
                        <option 
                          value="Sales" 
                          disabled={editingFullUser.role === 'head' && isSalesHeadCreated && editingFullUser.department !== 'Sales'}
                        >
                          Sales Segment {editingFullUser.role === 'head' && isSalesHeadCreated && editingFullUser.department !== 'Sales' ? " - Head Limit Reached (अधिकतम 1)" : ""}
                        </option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="border-t border-[#1f2635] pt-4 space-y-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">CONTRACT & PAYROLL OPTIONS</span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-gray-500 block mb-1">BASE SALARY (₹)</label>
                    <input
                      type="number"
                      required
                      value={editingFullUser.salaryBase || 0}
                      onChange={(e) => setEditingFullUser({ ...editingFullUser, salaryBase: Number(e.target.value) })}
                      className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-500 block mb-1">COMMISSION/SALE (₹)</label>
                    <input
                      type="number"
                      required
                      disabled={isEditingCommAndTargetDisabled}
                      value={isEditingCommAndTargetDisabled ? 0 : (editingFullUser.commissionRate || 0)}
                      onChange={(e) => setEditingFullUser({ ...editingFullUser, commissionRate: Number(e.target.value) })}
                      className={`w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-3 py-2 text-white ${isEditingCommAndTargetDisabled ? 'opacity-40 cursor-not-allowed select-none' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-500 block mb-1">MONTHLY TARGET</label>
                    <input
                      type="number"
                      required
                      disabled={isEditingCommAndTargetDisabled}
                      value={isEditingCommAndTargetDisabled ? 0 : (editingFullUser.monthlyTarget || 0)}
                      onChange={(e) => setEditingFullUser({ ...editingFullUser, monthlyTarget: Number(e.target.value) })}
                      className={`w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-3 py-2 text-white outline-none focus:border-[#f97316] ${isEditingCommAndTargetDisabled ? 'opacity-40 cursor-not-allowed select-none' : ''}`}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">DAILY WORK TASK (दैनिक कार्य)</label>
                  <textarea
                    placeholder="Describe daily work instructions..."
                    rows={2}
                    value={editingFullUser.dailyWork || ''}
                    onChange={(e) => setEditingFullUser({ ...editingFullUser, dailyWork: e.target.value })}
                    className="w-full bg-[#0d1017] border border-[#1f2635] focus:border-[#f97316] outline-none rounded-xl px-4 py-2 text-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">JOINING DATE (ज्वाइनिंग तिथि) *</label>
                    <input
                      type="date"
                      required
                      value={editingFullUser.joiningDate || ''}
                      onChange={(e) => setEditingFullUser({ ...editingFullUser, joiningDate: e.target.value })}
                      className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">EMPLOYMENT CODE (कर्मचारी कोड)</label>
                    <input
                      type="text"
                      readOnly
                      placeholder="Auto-generated"
                      value={editingFullUser.employmentCode || ''}
                      className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-gray-400 font-mono outline-none cursor-not-allowed select-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingFullUser(null)}
                  className="bg-[#151922] border border-[#222b3c] text-gray-400 hover:text-white px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#f97316] hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-xs font-black cursor-pointer shadow-lg shadow-orange-500/10"
                >
                  Apply & Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmState.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#111622] border border-[#1f2635] rounded-2xl p-6 w-full max-w-sm text-center space-y-4">
            <h4 className="text-base font-extrabold text-white uppercase tracking-wider">{confirmState.title}</h4>
            <p className="text-xs text-gray-400 leading-relaxed">{confirmState.message}</p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-[#151922] border border-[#222b3c] text-gray-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel (रद्द करें)
              </button>
              <button
                onClick={() => {
                  confirmState.onConfirm();
                  setConfirmState(prev => ({ ...prev, isOpen: false }));
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Confirm (हाँ)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEAD HISTORIC JOURNEY TIMELINE MODAL */}
      {viewingJourneyLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#111622] border border-[#1f2635] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-[#1f2635] bg-[#0d1017] flex justify-between items-center">
              <div className="text-left">
                <h3 className="text-base font-black text-white">Lead Journey Timeline (लीड यात्रा इतिहास)</h3>
                <p className="text-xs text-gray-400 mt-1">Audit log of all assignments, stages, calls, and actions logged for {viewingJourneyLead.name}.</p>
              </div>
              <button 
                type="button"
                onClick={() => setViewingJourneyLead(null)}
                className="text-gray-400 hover:text-white font-bold text-xs bg-[#1a202c] px-2.5 py-1.5 rounded-lg cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
              {(!viewingJourneyLead.journey || viewingJourneyLead.journey.length === 0) ? (
                <div className="text-center py-8 text-gray-500 text-xs space-y-2">
                  <p>No historical updates registered on this lead yet.</p>
                  <p className="text-[10px] text-gray-600 font-mono">When telecallers place virtual calls or update lead stages, its path will be tracked here.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-[#1f2635] ml-4 pl-6 space-y-6 text-left">
                  {viewingJourneyLead.journey.map((event, idx) => {
                    const getTimelineDotColor = (status: string) => {
                      switch (status) {
                        case 'New': return 'bg-blue-500';
                        case 'Contacted': return 'bg-cyan-500';
                        case 'Nurturing': return 'bg-purple-500';
                        case 'Closed Won': return 'bg-emerald-500 ring-4 ring-emerald-500/20';
                        case 'Closed Lost': return 'bg-rose-500 ring-4 ring-rose-500/20';
                        case 'Interested': return 'bg-amber-500';
                        case 'Spoke': return 'bg-orange-500';
                        default: return 'bg-gray-500';
                      }
                    };

                    return (
                      <div key={idx} className="relative group">
                        {/* Dot indicator */}
                        <span className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full ${getTimelineDotColor(event.status)} transition-all`} />

                        <div className="bg-[#0e121a] border border-[#1e2635] hover:border-gray-700 p-4 rounded-2xl space-y-2 transition">
                          <div className="flex justify-between items-start gap-4 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-wider text-white bg-[#111622] px-2.5 py-1 rounded-md border border-[#1e2635]">
                              Stage: {event.status}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>

                          <p className="text-xs text-gray-300 leading-relaxed font-medium">
                            "{event.notes || 'No description provided.'}"
                          </p>

                          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold bg-[#111622]/40 p-1 px-2.5 rounded-lg w-max border border-[#1e2635]/30">
                            👤 Updated By: <span className="text-[#f97316]">{event.updatedBy}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 bg-[#0d1017] border-t border-[#1f2635] flex justify-end">
              <button
                type="button"
                onClick={() => setViewingJourneyLead(null)}
                className="px-5 py-2 bg-[#1a2130] text-gray-300 font-bold hover:text-white rounded-xl text-xs transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
