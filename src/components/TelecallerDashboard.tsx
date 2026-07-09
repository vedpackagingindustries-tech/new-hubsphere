import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, LogOut, CheckCircle, XCircle, Clock, Plus, 
  Search, Mic, MicOff, Volume2, Sparkles, Loader2, Play, Pause, AlertCircle, Trash2,
  MessageSquare, Send, ExternalLink, Calendar, Shield,
  TrendingUp, TrendingDown, FileText, Upload, Download, RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { Lead, CallLog, AutoCallingConfig, SupportTicket } from '../types';

interface TelecallerDashboardProps {
  user: { 
    id: string; 
    name: string; 
    email: string; 
    role: 'admin' | 'head' | 'staff' | 'telecaller';
    department?: 'Tech' | 'NonTech' | 'Sales';
    phone?: string;
    whatsapp?: string;
    position?: string;
  };
  onLogout: () => void;
}

export default function TelecallerDashboard({ user, onLogout }: TelecallerDashboardProps) {
  // Database States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [autoCallingMode, setAutoCallingMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'New' | 'Interested' | 'Spoke' | 'Contacted' | 'Nurturing' | 'Closed Won' | 'Closed Lost'>('All');

  // Direct Lead Progress Updates
  const [updatingLead, setUpdatingLead] = useState<Lead | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');
  const [isSavingStatus, setIsSavingStatus] = useState<boolean>(false);
  const [viewingJourneyLead, setViewingJourneyLead] = useState<Lead | null>(null);

  // Submitting Support Query
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  // Feedback State & Custom Notifications
  const [statusMessage, setStatusMessage] = useState({ text: '', type: 'success' });

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage({ text: '', type: 'success' }), 4000);
  };

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

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  // Add Customer modal state (telecallers adding clients)
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', whatsapp: '', email: '', requirements: '' });
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  // Calling & Virtual Dialer States
  const [activeCallLead, setActiveCallLead] = useState<Lead | null>(null);
  const [callState, setCallState] = useState<'disconnected' | 'ringing' | 'connected' | 'ended'>('disconnected');
  const [callTimer, setCallTimer] = useState(0);
  const [micMuted, setMicMuted] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const [callOutcome, setCallOutcome] = useState<'Interested' | 'Spoke' | 'Not Interested'>('Interested');

  // Countdown State for Auto Calling Mode
  const [autoCallCountdown, setAutoCallCountdown] = useState<number | null>(null);
  const [nextAutoCallLeadId, setNextAutoCallLeadId] = useState<string | null>(null);

  // MediaRecorder Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [recordingBase64, setRecordingBase64] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [isProcessingRecording, setIsProcessingRecording] = useState(false);
  const ringingTimeoutRef = useRef<any>(null);

  // Ringing Synthesizer Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringOscillatorRef = useRef<OscillatorNode | null>(null);
  const ringIntervalRef = useRef<any>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);

  // Telecaller HRM states
  const [myAttendanceLogs, setMyAttendanceLogs] = useState<any[]>([]);
  const [myLeaveApplications, setMyLeaveApplications] = useState<any[]>([]);
  const [myPayrollStats, setMyPayrollStats] = useState<any | null>(null);
  const [companyHolidays, setCompanyHolidays] = useState<any[]>([]);
  const [salaryRules, setSalaryRules] = useState<any[]>([]);
  const [selectedHrmMonth, setSelectedHrmMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [leaveStartDate, setLeaveStartDate] = useState<string>('');
  const [leaveEndDate, setLeaveEndDate] = useState<string>('');
  const [leaveReason, setLeaveReason] = useState<string>('');
  const [isSubmittingLeave, setIsSubmittingLeave] = useState<boolean>(false);
  const [showMySlipModal, setShowMySlipModal] = useState<boolean>(false);

  // Leave Query States
  const [queryModalLeaveId, setQueryModalLeaveId] = useState<string | null>(null);
  const [queryModalText, setQueryModalText] = useState<string>('');

  // Tasks States
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [taskRemark, setTaskRemark] = useState('');
  const [selectedTaskForSubmit, setSelectedTaskForSubmit] = useState<any | null>(null);
  const [taskAppealText, setTaskAppealText] = useState('');
  const [selectedTaskForAppeal, setSelectedTaskForAppeal] = useState<any | null>(null);
  const [expandedChatTaskId, setExpandedChatTaskId] = useState<string | null>(null);
  const [newReplyMessage, setNewReplyMessage] = useState<string>('');

  // File Upload states for Tasks
  const [selectedFile, setSelectedFile] = useState<{ name: string; type: string; size: number; data: string } | null>(null);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileUploadError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }
    
    // Check file size (limit to 2GB)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > maxSize) {
      setFileUploadError("File size exceeds 2GB limit (फ़ाइल 2GB से अधिक है)");
      setSelectedFile(null);
      return;
    }
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile({
        name: file.name,
        type: file.type || fileExtension,
        size: file.size,
        data: reader.result as string // base64 data url
      });
    };
    reader.onerror = () => {
      setFileUploadError("Error reading file (फ़ाइल पढ़ने में त्रुटि)");
    };
    reader.readAsDataURL(file);
  };

  // Load HRM Data
  useEffect(() => {
    const fetchHrmData = async () => {
      try {
        const [attRes, leaveRes, payRes, holidayRes, tasksRes, rulesRes] = await Promise.all([
          fetch(`/api/attendance?userId=${user.id}`),
          fetch(`/api/leaves?userId=${user.id}`),
          fetch(`/api/payroll/report?month=${selectedHrmMonth}`),
          fetch('/api/company-holidays'),
          fetch(`/api/tasks?assignedTo=${user.id}`),
          fetch('/api/admin/salary-rules')
        ]);

        if (attRes.ok) {
          const logs = await attRes.json();
          setMyAttendanceLogs(logs.filter((a: any) => a.userId === user.id));
        }
        if (leaveRes.ok) {
          const leaves = await leaveRes.json();
          setMyLeaveApplications(leaves.filter((l: any) => l.userId === user.id));
        }
        if (holidayRes.ok) {
          const hols = await holidayRes.json();
          setCompanyHolidays(hols);
        }
        if (payRes.ok) {
          const payData = await payRes.json();
          const reportList = payData.report || (Array.isArray(payData) ? payData : []);
          const myRecord = reportList.find((p: any) => p.userId === user.id);
          setMyPayrollStats(myRecord || null);
        }
        if (tasksRes.ok) {
          const tasks = await tasksRes.json();
          setMyTasks(tasks);
        }
        if (rulesRes.ok) {
          const rData = await rulesRes.json();
          if (rData.success) {
            setSalaryRules(rData.salaryRules || []);
          }
        }
      } catch (err) {
        console.error('Failed to load HRM statistics', err);
      }
    };
    fetchHrmData();
  }, [refreshTrigger, selectedHrmMonth, user.id]);

  const handleTaskSubmit = async (taskId: string, remarkText: string) => {
    if (!remarkText) {
      showNotification("कृपया रिमार्क दर्ज करें!", "error");
      return;
    }
    try {
      const res = await fetch("/api/tasks/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          taskId, 
          status: "Completed", 
          remark: remarkText,
          file: selectedFile || null
        })
      });
      if (res.ok) {
        showNotification("कार्य सफलतापूर्वक जमा किया गया (Task submitted!)", "success");
        setTaskRemark("");
        setSelectedFile(null);
        setFileUploadError(null);
        setSelectedTaskForSubmit(null);
        setRefreshTrigger(prev => prev + 1);
      } else {
        const d = await res.json();
        showNotification(d.error || "जमा करने में असमर्थ", "error");
      }
    } catch (err) {
      showNotification("सर्वर से कनेक्ट करने में विफल", "error");
    }
  };

  const handleTaskAppeal = async (taskId: string, appealText: string) => {
    if (!appealText) {
      showNotification("कृपया अपना सवाल/अपील दर्ज करें!", "error");
      return;
    }
    try {
      const res = await fetch("/api/tasks/appeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, appeal: appealText })
      });
      if (res.ok) {
        showNotification("अपील / सवाल सफलतापूर्वक प्रबंधक को भेजा गया (Appeal sent!)", "success");
        setTaskAppealText("");
        setSelectedTaskForAppeal(null);
        setRefreshTrigger(prev => prev + 1);
      } else {
        const d = await res.json();
        showNotification(d.error || "अपील भेजने में असमर्थ", "error");
      }
    } catch (err) {
      showNotification("सर्वर से कनेक्ट करने में विफल", "error");
    }
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
        setMyTasks(prev => prev.map(t => t.id === taskId ? data.task : t));
        showNotification("Message sent!");
        setRefreshTrigger(prev => prev + 1);
      } else {
        showNotification(data.error || "Failed to send message", "error");
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
        setRefreshTrigger(prev => prev + 1);
      } else {
        showNotification(data.error || "Failed to submit explanation", "error");
      }
    } catch (err) {
      showNotification("Connection error", "error");
    }
  };

  const handleRaiseQuery = async (leaveId: string, queryText: string) => {
    try {
      const res = await fetch('/api/leaves/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ leaveId, queryText, userId: user.id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("सवाल सफलतापूर्वक दर्ज हो गया है!", "success");
        setRefreshTrigger(prev => prev + 1);
      } else {
        showNotification(data.error || "सवाल दर्ज करने में विफलता", "error");
      }
    } catch (err) {
      showNotification("सर्वर कनेक्शन एरर", "error");
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStartDate || !leaveEndDate || !leaveReason) {
      showNotification('Please fill all leave fields (सभी फील्ड भरें)', 'error');
      return;
    }
    setIsSubmittingLeave(true);
    try {
      const res = await fetch('/api/leaves/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          role: user.role,
          startDate: leaveStartDate,
          endDate: leaveEndDate,
          reason: leaveReason
        })
      });
      if (res.ok) {
        showNotification('Leave application submitted successfully! (छुट्टी की अर्ज़ी भेज दी गई है)');
        setLeaveStartDate('');
        setLeaveEndDate('');
        setLeaveReason('');
        setRefreshTrigger(prev => prev + 1);
      } else {
        const err = await res.json();
        showNotification(err.error || 'Failed to apply leave', 'error');
      }
    } catch (err) {
      showNotification('Server communication failure', 'error');
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  // Sync Timer for active call
  useEffect(() => {
    let interval: any;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    } else {
      setCallTimer(0);
    }
    return () => clearInterval(interval);
  }, [callState]);

  // Load leads and personal logs from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsRes, callsRes, supportRes] = await Promise.all([
          fetch('/api/leads', { headers: { 'x-user-role': user.role, 'x-user-id': user.id } }),
          fetch('/api/calls', { headers: { 'x-user-role': user.role, 'x-user-id': user.id } }),
          fetch('/api/support', { headers: { 'x-user-role': user.role, 'x-user-id': user.id } })
        ]);

        if (leadsRes.ok) {
          const lds = await leadsRes.json();
          // Filter to only those assigned to this telecaller
          setLeads(lds.filter((l: Lead) => l.assignedTo === user.id));
        }
        if (callsRes.ok) {
          const cls = await callsRes.json();
          // Filter to caller's own logs
          setCallLogs(cls.filter((c: CallLog) => c.telecallerId === user.id));
        }
        if (supportRes.ok) {
          const tkts = await supportRes.json();
          setSupportTickets(tkts.filter((t: SupportTicket) => t.userEmail === user.email));
        }
      } catch (err) {
        console.error('Failed to load portal metrics', err);
      }
    };
    fetchData();
  }, [refreshTrigger, user.role, user.id, user.email]);

  // Auto-refresh/synchronization interval (every 10 seconds) to sync newly updated staff and data automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteLead = (leadId: string) => {
    showConfirm(
      "Delete Lead (लीड हटाएं)",
      "Are you sure you want to delete this customer lead? (क्या आप इस कस्टमर लीड को हटाना चाहते हैं?)",
      async () => {
        try {
          const res = await fetch('/api/leads/delete', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-user-role': user.role,
              'x-user-id': user.id
            },
            body: JSON.stringify({ leadId }),
          });
          if (res.ok) {
            showNotification('Lead deleted successfully!');
            triggerRefresh();
          } else {
            const data = await res.json();
            showNotification(data.error || 'Failed to delete lead.', 'error');
          }
        } catch (err) {
          showNotification('Network error.', 'error');
        }
      }
    );
  };

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  // Web Audio Ringing Synthesizer (Zero external dependencies, 100% free sound)
  const startRingingSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const playRingPair = () => {
        if (ctx.state === 'closed') return;
        
        // Indian phone ringing standard double ring
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.frequency.setValueAtTime(400, ctx.currentTime);
        osc2.frequency.setValueAtTime(450, ctx.currentTime);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        osc1.start();
        osc2.start();

        // Dual beep ring sound
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime + 0.4);
        gainNode.gain.setValueAtTime(0, ctx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime + 0.9);
        gainNode.gain.setValueAtTime(0, ctx.currentTime + 1.4);

        // Stop oscillators after the dual beep ring duration
        setTimeout(() => {
          try {
            osc1.stop();
            osc2.stop();
          } catch(e) {}
        }, 1500);
      };

      // Play initially and then repeat every 3 seconds
      playRingPair();
      ringIntervalRef.current = setInterval(playRingPair, 3000);
    } catch (err) {
      console.warn('Web Audio Context not supported or blocked by user', err);
    }
  };

  const stopRingingSound = () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
  };

  // Helper to format clean phone numbers for WhatsApp API links
  const getCleanWhatsAppPhone = (phone: string) => {
    let cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned; // default country code for India
    }
    return cleaned;
  };

  // Audio play handler for recordings list
  const handlePlayRecording = (recordingId: string) => {
    if (activeAudio) {
      activeAudio.pause();
    }
    if (playingAudioId === recordingId) {
      setPlayingAudioId(null);
      setActiveAudio(null);
      return;
    }
    const audio = new Audio(`/api/calls/recording/${recordingId}`);
    audio.onended = () => setPlayingAudioId(null);
    audio.onerror = () => {
      showNotification('Failed to play recording.', 'error');
      setPlayingAudioId(null);
    };
    audio.play();
    setPlayingAudioId(recordingId);
    setActiveAudio(audio);
  };

  // Reply handler for telecallers responding to admin questions on call logs
  const handleSaveReply = async (callId: string, text: string) => {
    if (!text.trim()) {
      showNotification('Please enter some text to reply', 'error');
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

  // 1. PLACE OUTBOUND CALL TRIGGER (STARTS RINGING, DOES NOT START TIMER YET)
  const handlePlaceCall = async (lead: Lead) => {
    setActiveCallLead(lead);
    setCallState('ringing'); // Transition to ringing state
    setCallNotes('');
    setCallOutcome('Interested');
    setRecordingBase64(null);
    setRecordingError(null);
    setIsRecording(false);

    // Cancel any active Auto-Calling timer
    setAutoCallCountdown(null);

    // Set the default pre-filled template message for WhatsApp Quick-Sender
    const defaultMsg = `नमस्ते ${lead.name} जी, मैं HubSphere से बात कर रहा हूँ। आपने ${lead.requirements || 'हमारी सेवाओं'} में रुचि दिखाई थी। क्या हम इस बारे में बात कर सकते हैं?`;
    setWhatsappMessage(defaultMsg);

    // Play ringing synthesizer sound
    startRingingSound();

    // OPEN REAL PHONE DIALER: Immediate device tel trigger
    try {
      window.location.href = `tel:${lead.phone}`;
    } catch (err) {
      console.warn('Device calling protocol error', err);
    }

    // Auto-answer after 1.5s so timer & recording activate automatically!
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
    }
    ringingTimeoutRef.current = setTimeout(() => {
      handleAnswerCall();
    }, 1500);
  };

  // 2. ANSWER / CONNECT TRIGGER (TIMER AND MICROPHONE RECORDING START ONLY NOW)
  const handleAnswerCall = async () => {
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }
    stopRingingSound();
    setCallState('connected'); // Transitions to connected, running the timer

    // Check if browser context supports media devices
    if (typeof window !== 'undefined') {
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (!isSecure) {
        const errMsg = "Insecure Connection (गैर-सुरक्षित HTTP): Microphone access requires a secure HTTPS connection. Please check your URL bar or server SSL configuration. (माइक्रोफोन रिकॉर्डिंग के लिए HTTPS आवश्यक है)";
        setRecordingError(errMsg);
        console.warn(errMsg);
        return;
      }

      if (typeof MediaRecorder === 'undefined') {
        const errMsg = "Browser Unsupported: MediaRecorder is not supported by your current browser. (इस ब्राउज़र में कॉल रिकॉर्डिंग समर्थित नहीं है)";
        setRecordingError(errMsg);
        console.warn(errMsg);
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errMsg = "Media Devices Blocked: Your browser has disabled audio media devices. If you are inside an iframe preview, please click 'Open in new tab' at the top-right! (आईफ्रेम में माइक्रोफोन ब्लॉक हो सकता है, कृपया नए टैब में खोलें)";
        setRecordingError(errMsg);
        console.warn(errMsg);
        return;
      }
    }

    // Capture microphone audio now that call is connected
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let options = {};
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          options = { mimeType: 'audio/ogg' };
        }
      }
      
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        setIsProcessingRecording(true);
        if (audioChunksRef.current.length === 0) {
          console.warn("No audio data captured during call.");
          setIsProcessingRecording(false);
          return;
        }
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        
        // Convert to Base64 to upload and archive call recording
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setRecordingBase64(base64String);
          setIsProcessingRecording(false);
        };
      };

      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setIsRecording(false);
      let errorFriendlyMsg = "Microphone failed to start. (माइक्रोफोन प्रारंभ नहीं हो सका)";
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorFriendlyMsg = "Permission Denied: Microphone permission blocked. Please check your browser's URL bar security icon to allow microphone. (माइक्रोफोन परमिशन ब्लॉक की गई है)";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorFriendlyMsg = "No Input Device: No active microphone found on your system. Please plug in a microphone or headset. (कोई माइक्रोफोन नहीं मिला)";
      } else {
        errorFriendlyMsg = `Microphone Error: ${err.message || err}`;
      }
      
      setRecordingError(errorFriendlyMsg);
      console.warn('Microphone recording error. Logging details manually.', err);
    }
  };

  // Stop current active local CRM voice recording upon call finish
  const handleEndCall = () => {
    stopRingingSound();
    setCallState('ended');
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      } catch (e) {}
    }
  };

  // 3. SUBMIT OUTCOME AND AUTOMATICALLY SAVE AUDIO CALL RECORDING
  const handleSaveCallLog = async () => {
    if (!activeCallLead) return;

    try {
      const res = await fetch('/api/calls/save', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({
          leadId: activeCallLead.id,
          telecallerId: user.id,
          status: callOutcome,
          duration: callTimer,
          notes: callNotes,
          recordingBase64 // The recorded mic audio saved on cloud!
        }),
      });

      if (res.ok) {
        triggerRefresh();
        
        // Auto Calling Mode trigger
        if (autoCallingMode) {
          // Identify the next lead in the filtered listing
          const currentIndex = filteredLeads.findIndex(l => l.id === activeCallLead.id);
          const nextLead = filteredLeads[currentIndex + 1];

          if (nextLead) {
            setNextAutoCallLeadId(nextLead.id);
            setAutoCallCountdown(5);
          } else {
            showNotification('Auto-Calling finished! No more leads in your queue.', 'success');
          }
        }

        // Reset
        setCallState('disconnected');
        setActiveCallLead(null);
      } else {
        showNotification('Failed to save call session.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error connecting to Server.', 'error');
    }
  };

  // Countdown timer effect for Auto Calling Mode
  useEffect(() => {
    if (autoCallCountdown === null) return;
    if (autoCallCountdown === 0) {
      setAutoCallCountdown(null);
      const leadToCall = leads.find(l => l.id === nextAutoCallLeadId);
      if (leadToCall) {
        handlePlaceCall(leadToCall);
      }
      return;
    }

    const timer = setTimeout(() => {
      setAutoCallCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoCallCountdown, nextAutoCallLeadId]);

  // Submit new Customer (added by Telecaller themselves)
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) {
      showNotification('Name and Phone are required.', 'error');
      return;
    }
    setIsSavingCustomer(true);

    try {
      const res = await fetch('/api/leads/add', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({
          ...newCustomer,
          assignedTo: user.id // Assign directly to this telecaller
        }),
      });

      if (res.ok) {
        setShowAddCustomerModal(false);
        setNewCustomer({ name: '', phone: '', whatsapp: '', email: '', requirements: '' });
        showNotification('Customer added successfully!', 'success');
        triggerRefresh();
      } else {
        const d = await res.json();
        showNotification(d.error || 'Failed to add customer.', 'error');
      }
    } catch (err) {
      showNotification('Network error.', 'error');
    } finally {
      setIsSavingCustomer(false);
    }
  };

  // Submit Support Ticket Ticket
  const handleSubmitSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject || !supportMsg) return;
    setIsSubmittingSupport(true);

    try {
      const res = await fetch('/api/support/add', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({
          userName: user.name,
          userEmail: user.email,
          subject: supportSubject,
          message: supportMsg
        })
      });

      if (res.ok) {
        showNotification('Your support query submitted successfully! Support staff will answer in 24/7 technical assistance portal.', 'success');
        setSupportSubject('');
        setSupportMsg('');
        triggerRefresh();
      }
    } catch (err) {
      showNotification('Failed submitting ticket.', 'error');
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  const handleDirectUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingLead) return;
    setIsSavingStatus(true);
    try {
      const res = await fetch('/api/leads/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({
          leadId: updatingLead.id,
          status: newStatus,
          notes: newNotes,
          updatedBy: user.name
        })
      });
      if (res.ok) {
        showNotification('Lead status and progress updated successfully!', 'success');
        setUpdatingLead(null);
        setNewNotes('');
        triggerRefresh();
      } else {
        showNotification('Failed to update lead progress.', 'error');
      }
    } catch (err) {
      showNotification('Network error.', 'error');
    } finally {
      setIsSavingStatus(false);
    }
  };

  // COMPUTE DIALER PERFORMANCE TARGET METRICS (Screenshot 4: 0/40 target calls)
  const dailyTargetTotal = 40;
  const monthlyTargetTotal = 1000;

  const dailyCallsCompleted = callLogs.length; // Simulated daily total
  const dailyAchievedPct = Math.min(Math.round((dailyCallsCompleted / dailyTargetTotal) * 100), 100);

  const monthlyCallsCompleted = callLogs.length; // Simple mapping
  const monthlyAchievedPct = Math.min(Math.round((monthlyCallsCompleted / monthlyTargetTotal) * 100), 100);

  // Filter leads based on search query and status tab selection
  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.phone.includes(searchQuery);
    
    if (!matchesSearch) return false;
    if (activeFilter === 'All') return true;
    return l.status === activeFilter;
  });

  // Count sub metrics
  const interestedCount = callLogs.filter(c => c.status === 'Interested').length;
  const callbackCount = callLogs.filter(c => c.status === 'Spoke').length;
  const notInterestedCount = callLogs.filter(c => c.status === 'Not Interested').length;

  const isTechOrNonTech = user.department === 'Tech' || user.department === 'NonTech';

  // Generate daily task analytics for Tech/NonTech
  const getDailyTaskAnalytics = () => {
    const days = [];
    const today = new Date();
    
    // Create list of last 7 dates in YYYY-MM-DD format
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push(dateStr);
    }
    
    // Map tasks to dates
    const data = days.map(dateStr => {
      const tasksOnDate = myTasks.filter(t => t.date === dateStr);
      const total = tasksOnDate.length;
      const completed = tasksOnDate.filter(t => t.status === 'Approved' || t.status === 'Submitted').length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      // format date for display (e.g. "06 Jul")
      const dateParts = dateStr.split('-');
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedDate = `${dateParts[2]} ${monthNames[parseInt(dateParts[1]) - 1]}`;
      
      return {
        dateStr,
        date: formattedDate,
        "Total Tasks": total,
        "Completed Tasks": completed,
        "Success Rate (%)": rate
      };
    });
    
    return data;
  };

  const dailyAnalytics = getDailyTaskAnalytics();
  const todayData = dailyAnalytics[dailyAnalytics.length - 1];
  const yesterdayData = dailyAnalytics[dailyAnalytics.length - 2];
  
  const todayRate = todayData ? todayData["Success Rate (%)"] : 0;
  const yesterdayRate = yesterdayData ? yesterdayData["Success Rate (%)"] : 0;
  
  let growthPct = 0;
  let trendDirection: 'growth' | 'degrowth' | 'stable' = 'stable';
  
  if (yesterdayRate === 0 && todayRate > 0) {
    growthPct = todayRate;
    trendDirection = 'growth';
  } else if (todayRate > yesterdayRate) {
    growthPct = todayRate - yesterdayRate;
    trendDirection = 'growth';
  } else if (todayRate < yesterdayRate) {
    growthPct = yesterdayRate - todayRate;
    trendDirection = 'degrowth';
  } else {
    trendDirection = 'stable';
  }

  if (isTechOrNonTech) {
    return (
      <div className="min-h-screen bg-[#090b11] text-gray-100 flex flex-col font-sans relative">
        {/* HEADER SECTION */}
        <header className="bg-[#10141e] border-b border-[#1f2635] px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 text-left">
            <div className="bg-[#f97316] p-2 rounded-xl shadow-md shadow-orange-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight flex items-center">
                  <span className="text-[#f97316]">
                    {user.role === 'head' ? "Department Head" : "Staff"}
                  </span>
                </h1>
              </div>
              <p className="text-[10px] text-gray-400 font-semibold tracking-wide text-left mt-0.5">
                Login Name: <span className="text-white font-extrabold">{user.name}</span> • Role: <span className="text-[#f97316] font-bold uppercase">{user.role === 'head' ? `Dept Head (${user.department || 'All'})` : `Staff (${user.department || 'All'})`}</span> {user.position ? `[Appointed: ${user.position}]` : ''}
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
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              className="p-2.5 bg-[#151922] hover:bg-[#1e2432] border border-[#222b3c] rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
              title="Refresh Portal Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button 
              onClick={onLogout}
              className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-extrabold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full flex-1">
          {/* STATUS / NOTIFICATION BAR */}
          {statusMessage.text && (
            <div className={`p-4 rounded-2xl border text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' 
                : 'bg-rose-500/15 text-rose-400 border-rose-500/25'
            }`}>
              <AlertCircle className="w-4 h-4" />
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* DYNAMIC METRIC CARDS AND GRAPH CARD */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* GRAPH CARD: occupies 2 columns */}
            <div className="lg:col-span-2 bg-[#111622] border border-[#1f2635] p-6 rounded-3xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-left">
                <div>
                  <h3 className="text-base font-black text-white">Daily Performance Chart (दैनिक कार्य ग्राफ़)</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Task completion success rate over the last 7 days</p>
                </div>
                
                {/* GROWTH OR DEGROWTH BADGE */}
                {trendDirection === 'growth' && (
                  <div className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-black self-start sm:self-auto">
                    <TrendingUp className="w-4 h-4" />
                    <span>📈 Growth +{growthPct}% (प्रगति)</span>
                  </div>
                )}
                {trendDirection === 'degrowth' && (
                  <div className="bg-rose-500/15 text-rose-400 border border-rose-500/25 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-black self-start sm:self-auto">
                    <TrendingDown className="w-4 h-4" />
                    <span>📉 Degrowth -{growthPct}% (गिरावट)</span>
                  </div>
                )}
                {trendDirection === 'stable' && (
                  <div className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-black self-start sm:self-auto">
                    <Clock className="w-4 h-4" />
                    <span>Stable (स्थिर)</span>
                  </div>
                )}
              </div>

              {/* RECHARTS COMPONENT */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyAnalytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1f2635" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} fontWeight="bold" />
                    <YAxis stroke="#64748b" fontSize={10} fontWeight="bold" domain={[0, 100]} unit="%" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111622', borderColor: '#1f2635', borderRadius: '12px' }} 
                      labelStyle={{ fontWeight: 'bold', color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="Success Rate (%)" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PERFORMANCE METRIC CARDS: occupies 1 column */}
            <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-3xl flex flex-col justify-between gap-4 text-left">
              <div>
                <h3 className="text-base font-black text-white">Task Efficiency</h3>
                <p className="text-xs text-gray-400 mt-0.5">Your work metrics for this week</p>
              </div>

              <div className="space-y-4">
                <div className="bg-[#0e121a] border border-[#1e2635] p-4 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-gray-500 text-[10px] font-bold block uppercase">TOTAL ASSIGNED</span>
                    <span className="text-2xl font-black text-white">
                      {myTasks.length}
                    </span>
                  </div>
                  <FileText className="w-8 h-8 text-gray-600" />
                </div>

                <div className="bg-[#0e121a] border border-[#1e2635] p-4 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-gray-500 text-[10px] font-bold block uppercase">COMPLETED & APPROVED</span>
                    <span className="text-2xl font-black text-emerald-400">
                      {myTasks.filter(t => t.status === 'Approved').length}
                    </span>
                  </div>
                  <CheckCircle className="w-8 h-8 text-emerald-500/30" />
                </div>

                <div className="bg-[#0e121a] border border-[#1e2635] p-4 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-gray-500 text-[10px] font-bold block uppercase">PENDING TASKS</span>
                    <span className="text-2xl font-black text-yellow-500">
                      {myTasks.filter(t => t.status === 'Pending').length}
                    </span>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500/30" />
                </div>
              </div>

              <div className="text-[11px] text-gray-500 text-center font-sans">
                Keep completing tasks on time to maintain a healthy growth rate!
              </div>
            </div>

          </div>

          {/* MY ASSIGNED TASK SECTION */}
          <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-3xl space-y-6">
            <div className="text-left">
              <h3 className="text-lg font-black text-white">My Assigned Tasks (मेरा आवंटित कार्य)</h3>
              <p className="text-xs text-gray-400 mt-1">Submit your task updates, upload proof files, or appeal reviews</p>
            </div>

            {myTasks.length === 0 ? (
              <div className="text-center py-12 bg-[#0d1017] rounded-2xl border border-[#1f2635]">
                <FileText className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-bold">No tasks assigned to you yet. (अभी कोई काम आवंटित नहीं हुआ है)</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myTasks.map((task: any) => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isTaskOverdue = !['Approved', 'Submitted'].includes(task.status) && task.date < todayStr;
                  return (
                    <div key={task.id} className="bg-[#0e121a] border border-[#1e2635] p-5 rounded-2xl space-y-4 text-left flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">TASK TITLE</span>
                            <h4 className="font-extrabold text-white text-base">
                              {task.title}
                              {isTaskOverdue && (
                                <span className="block text-[10px] text-red-500 font-extrabold font-sans mt-0.5 animate-pulse">
                                  ⚠️ OVERDUE (देरी)
                                </span>
                              )}
                            </h4>
                          </div>
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase shrink-0 border ${
                            task.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                            task.status === 'Denied' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                            task.status === 'Submitted' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                            task.status === 'Appealed' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                            'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30'
                          }`}>
                            {task.status === 'Approved' ? 'Approved ✓' : task.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400 border-t border-b border-[#1f2635]/40 py-2">
                          <div>
                            <span className="text-gray-500">Assigned By:</span> <span className="text-white font-semibold">{task.assignedByName || "Supervisor"}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 font-sans">Target Date:</span> <span className="text-white font-semibold">{task.date}</span>
                          </div>
                        </div>

                        {/* Overdue delay explanation section */}
                        {isTaskOverdue && !task.overdueRemark && (
                          <div className="bg-red-500/10 border border-red-500/25 p-3 rounded-xl space-y-1.5 font-sans">
                            <p className="text-[10px] text-red-400 font-extrabold">⚠️ Task Overdue: Please enter reason for delay (देरी का कारण):</p>
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                id={`overdue-remark-tele-${task.id}`}
                                placeholder="Reason for delay..."
                                className="bg-[#0d1017] border border-[#1f2635] rounded-lg px-2.5 py-1.5 text-xs text-white flex-1 focus:outline-none"
                              />
                              <button
                                onClick={() => {
                                  const val = (document.getElementById(`overdue-remark-tele-${task.id}`) as HTMLInputElement)?.value;
                                  if (val) handleSendOverdueRemark(task.id, val);
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg transition"
                              >
                                Submit
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Display overdue delay remark if exists */}
                        {task.overdueRemark && (
                          <div className="p-3 bg-red-500/5 text-red-300 rounded-xl border border-red-500/20 text-xs">
                            <span className="font-extrabold text-red-400 block mb-0.5">⚠️ DELAY REASON (देरी का कारण):</span>
                            <p className="italic">"{task.overdueRemark}"</p>

                            {task.overdueReply && (
                              <div className="mt-2 pt-2 border-t border-red-500/20 text-emerald-400 font-sans">
                                <span className="font-extrabold text-emerald-400 block mb-0.5">✓ Supervisor Response:</span>
                                <p className="italic">"{task.overdueReply}"</p>
                              </div>
                            )}
                          </div>
                        )}

                        {task.remark && (
                          <div className="p-3 bg-[#111622] rounded-xl border border-[#1f2635] text-xs space-y-1">
                            <span className="text-[9px] font-bold text-gray-500 block uppercase">YOUR SUBMISSION REMARK</span>
                            <p className="text-gray-300 italic">"{task.remark}"</p>
                          </div>
                        )}

                        {/* Display Uploaded File details */}
                        {task.file && (
                          <div className="p-3 bg-[#111622] rounded-xl border border-[#1f2635] text-xs flex justify-between items-center gap-3">
                            <div className="truncate flex-1">
                              <span className="text-[9px] font-bold text-gray-500 block uppercase">SUBMITTED FILE (भेजी गई फ़ाइल)</span>
                              <span className="text-white font-semibold truncate block max-w-[150px]" title={task.file.name}>{task.file.name}</span>
                              <span className="text-gray-400 block text-[10px]">{(task.file.size / 1024).toFixed(1)} KB</span>
                            </div>
                            <a 
                              href={task.file.data} 
                              download={task.file.name}
                              className="bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 font-extrabold text-[10px] px-3 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" /> Download
                            </a>
                          </div>
                        )}

                        {task.adminReply && (
                          <div className="p-3 bg-orange-500/5 rounded-xl border border-orange-500/20 text-xs space-y-1">
                            <span className="text-[9px] font-bold text-orange-400 block uppercase">SUPERVISOR FEEDBACK</span>
                            <p className="text-gray-300 italic">"{task.adminReply}"</p>
                          </div>
                        )}

                        {task.appeal && (
                          <div className="p-3 bg-purple-500/5 rounded-xl border border-purple-500/20 text-xs space-y-1">
                            <span className="text-[9px] font-bold text-purple-400 block uppercase">YOUR APPEAL/QUESTION</span>
                            <p className="text-gray-300 italic">"{task.appeal}"</p>
                            {task.appealReply && (
                              <div className="mt-2 pt-2 border-t border-purple-500/10">
                                <span className="text-[9px] font-bold text-emerald-400 block uppercase">SUPERVISOR ANSWER</span>
                                <p className="text-gray-300 italic">"{task.appealReply}"</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions based on status */}
                      <div className="flex gap-2 flex-col pt-3 border-t border-[#1f2635]/40 mt-3">
                        {task.status === 'Pending' && (
                          <div className="w-full">
                            {selectedTaskForSubmit?.id === task.id ? (
                              <div className="space-y-3 bg-[#0e121a] p-3 rounded-xl border border-[#1f2635]">
                                <textarea
                                  value={taskRemark}
                                  onChange={(e) => setTaskRemark(e.target.value)}
                                  placeholder="Enter your completion proof or work update remark..."
                                  className="w-full bg-[#0d1017] border border-[#222b3c] focus:border-[#f97316] rounded-xl p-2.5 text-xs text-white outline-none"
                                  rows={3}
                                />
                                
                                {/* FILE UPLOADER FOR TASK PROOF */}
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-gray-400 block uppercase">ATTACH PROOF FILE (PDF, Word, Excel, JPG)</label>
                                  <div className="flex items-center justify-between bg-[#0d1017] border border-[#222b3c] hover:border-gray-700 p-2 rounded-xl transition relative">
                                    <input 
                                      type="file" 
                                      onChange={handleFileChange}
                                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex items-center gap-2 text-xs text-gray-500 pointer-events-none">
                                      <Upload className="w-4 h-4 text-[#f97316]" />
                                      {selectedFile ? (
                                        <span className="text-white font-bold truncate max-w-[150px]">{selectedFile.name}</span>
                                      ) : (
                                        <span>Choose proof file...</span>
                                      )}
                                    </div>
                                    {selectedFile && (
                                      <button 
                                        type="button" 
                                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                        className="text-[10px] text-red-500 hover:underline font-bold shrink-0 z-10"
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                  {fileUploadError && (
                                    <p className="text-[10px] text-red-400 font-bold">{fileUploadError}</p>
                                  )}
                                </div>

                                <div className="flex gap-2 justify-end pt-1">
                                  <button
                                    onClick={() => { setSelectedTaskForSubmit(null); setSelectedFile(null); setFileUploadError(null); }}
                                    className="px-3 py-1.5 bg-gray-800 text-gray-300 hover:text-white rounded-lg text-xs font-bold transition"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleTaskSubmit(task.id, taskRemark)}
                                    className="px-4 py-1.5 bg-[#f97316] hover:bg-orange-600 text-white rounded-lg text-xs font-black transition"
                                  >
                                    Submit Task Proof
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setSelectedTaskForSubmit(task); setSelectedFile(null); setFileUploadError(null); }}
                                className="w-full py-2 bg-[#f97316]/10 hover:bg-[#f97316]/20 border border-[#f97316]/30 text-[#f97316] hover:text-white text-xs font-black rounded-xl transition"
                              >
                                Submit Work Completion
                              </button>
                            )}
                          </div>
                        )}

                        {(task.status === 'Denied' || task.status === 'Approved') && !task.appeal && (
                          <div className="w-full">
                            {selectedTaskForAppeal?.id === task.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={taskAppealText}
                                  onChange={(e) => setTaskAppealText(e.target.value)}
                                  placeholder="Type your question or explanation appeal to the supervisor..."
                                  className="w-full bg-[#0d1017] border border-[#222b3c] focus:border-[#f97316] rounded-xl p-2.5 text-xs text-white outline-none"
                                  rows={3}
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => setSelectedTaskForAppeal(null)}
                                    className="px-3 py-1.5 bg-gray-800 text-gray-300 hover:text-white rounded-lg text-xs font-bold transition"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleTaskAppeal(task.id, taskAppealText)}
                                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-black transition"
                                  >
                                    Submit Appeal
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setSelectedTaskForAppeal(task)}
                                className="w-full py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:text-white text-xs font-bold rounded-xl transition"
                              >
                                Raise Query / Appeal (जवाब से अपील करें)
                              </button>
                            )}
                          </div>
                        )}

                        {/* Discuss toggle button */}
                        <button
                          onClick={() => setExpandedChatTaskId(expandedChatTaskId === task.id ? null : task.id)}
                          className="w-full py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 hover:text-white text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          💬 Discuss & Chat ({(task.replies || []).length})
                        </button>
                      </div>

                      {/* Inline Expandable Chat Panel */}
                      {expandedChatTaskId === task.id && (
                        <div className="mt-4 pt-3 border-t border-[#1e2635] space-y-3 text-left">
                          <h4 className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                            💬 Discussion & Comments (कार्य संवाद)
                          </h4>
                          
                          {/* Messages logs list */}
                          <div className="space-y-2 max-h-36 overflow-y-auto bg-[#0d1017] p-2.5 rounded-xl border border-[#1f2635] text-[11px]">
                            {(task.replies || []).length === 0 ? (
                              <p className="text-gray-500 italic py-1">No messages recorded. Start the discussion below.</p>
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
                                const alignClass = isAdminSender ? "text-right" : "text-left";

                                return (
                                  <div key={idx} className={`p-2 rounded-xl bg-[#111622] border border-[#1f2635] ${alignClass}`}>
                                    <span className={textNameClass}>{rep.senderName} ({rep.senderRole}):</span>
                                    <p className="text-white mt-0.5">{rep.message}</p>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Message input field */}
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={newReplyMessage}
                              onChange={(e) => setNewReplyMessage(e.target.value)}
                              placeholder="Type your message..."
                              className="flex-1 bg-[#0d1017] text-white border border-[#222b3c] focus:border-[#f97316] outline-none px-3 py-2 rounded-xl text-xs placeholder:text-gray-600"
                            />
                            <button
                              onClick={() => handleSendTaskReply(task.id)}
                              className="bg-[#f97316] hover:bg-orange-600 text-white p-2 rounded-xl transition cursor-pointer"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090b11] text-gray-100 flex flex-col font-sans relative">
      
      {/* HEADER SECTION (BILINGUAL) */}
      <header className="bg-[#10141e] border-b border-[#1f2635] px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 text-left">
          <div className="bg-[#f97316] p-2 rounded-xl shadow-md shadow-orange-500/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight flex items-center">
                <span className="text-[#f97316]">
                  {user.role === 'head' ? "Department Head" : "Staff"}
                </span>
              </h1>
            </div>
            <p className="text-[10px] text-gray-400 font-semibold tracking-wide text-left mt-0.5">
              Login Name: <span className="text-white font-extrabold">{user.name}</span> • Role: <span className="text-[#f97316] font-bold uppercase">{user.role === 'head' ? `Dept Head (${user.department || 'All'})` : `Staff (${user.department || 'All'})`}</span> {user.position ? `[Appointed: ${user.position}]` : ''}
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
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="p-2.5 bg-[#151922] hover:bg-[#1e2432] border border-[#222b3c] rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
            title="Refresh Portal Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button 
            onClick={onLogout}
            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-extrabold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full flex-1">
        
        {/* ROW 1: PERFORMANCE TARGET MODULES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* DAILY CALL TARGETS PROGRESS */}
          <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#f97316] rounded-full"></span>
                <span className="text-sm font-bold text-white uppercase tracking-wider">Daily Call Target (दैनिक लक्ष्य)</span>
              </div>
              <strong className="text-sm font-black text-gray-300">{dailyCallsCompleted} / {dailyTargetTotal} calls</strong>
            </div>
            
            <div className="w-full bg-[#0d1017] rounded-full h-3 overflow-hidden border border-[#1a212e]">
              <div 
                className="bg-gradient-to-r from-[#f97316] to-amber-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${dailyAchievedPct}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">{dailyAchievedPct}% achieved</span>
              <button onClick={triggerRefresh} className="text-[#f97316] hover:underline cursor-pointer font-bold">Reset daily progress</button>
            </div>
          </div>

          {/* MONTHLY target volume */}
          <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                <span className="text-sm font-bold text-white uppercase tracking-wider">Monthly target volume (मासिक लक्ष्य)</span>
              </div>
              <strong className="text-sm font-black text-gray-300">{monthlyCallsCompleted} / {monthlyTargetTotal} calls</strong>
            </div>

            <div className="w-full bg-[#0d1017] rounded-full h-3 overflow-hidden border border-[#1a212e]">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${monthlyAchievedPct}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">{monthlyAchievedPct}% achieved</span>
              <span className="text-gray-500">Bonus target scale</span>
            </div>
          </div>
        </div>

        {/* ROW 2: DETAILED LIVE PERFORMANCE COUNTS */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-emerald-400 block mb-1">INTERESTED (रुचि है)</span>
            <div className="text-3xl font-black text-emerald-400">{interestedCount}</div>
          </div>
          <div className="bg-orange-500/5 border border-orange-500/20 p-5 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-orange-400 block mb-1">SPOKE / CALLBACK (फिर बात करें)</span>
            <div className="text-3xl font-black text-orange-400">{callbackCount}</div>
          </div>
          <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-red-400 block mb-1">NOT INTERESTED (रुचि नहीं है)</span>
            <div className="text-3xl font-black text-red-400">{notInterestedCount}</div>
          </div>
        </div>

        {/* ROW 3: AUTO-CALL SWITCH CONTROLS */}
        <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${autoCallingMode ? 'bg-emerald-500 animate-ping' : 'bg-gray-600'}`}></span>
              <h3 className="font-extrabold text-sm text-white">Auto-Calling Mode (ऑटो-डायल मोड)</h3>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              When active, completing a call logs triggers a 5s delay before initiating the next dial automatically.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`text-xs font-black uppercase tracking-wider ${autoCallingMode ? 'text-emerald-400' : 'text-gray-500'}`}>
              {autoCallingMode ? 'ACTIVE (चालू)' : 'INACTIVE (बंद)'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoCallingMode}
                onChange={(e) => setAutoCallingMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#222b3c] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f97316]"></div>
            </label>
          </div>
        </div>

        {/* AUTO CALLING COUNTDOWN BANNER */}
        {autoCallCountdown !== null && (
          <div className="bg-[#1a2030] border border-orange-500/50 p-5 rounded-2xl text-center space-y-3 animate-pulse">
            <h4 className="text-lg font-black text-white flex items-center justify-center gap-2">
              <Volume2 className="w-5 h-5 text-[#f97316] animate-bounce" />
              Automated dialer initiating next call in{' '}
              <span className="text-[#f97316] text-xl font-black">{autoCallCountdown}</span> seconds...
            </h4>
            <div className="w-64 mx-auto bg-[#0d1017] h-2 rounded-full overflow-hidden border border-[#1f2635]">
              <div 
                className="bg-orange-500 h-full transition-all duration-1000"
                style={{ width: `${(autoCallCountdown / 5) * 100}%` }}
              ></div>
            </div>
            <button 
              onClick={() => setAutoCallCountdown(null)}
              className="text-xs text-red-400 hover:underline font-bold"
            >
              Cancel Auto-Calling Timer
            </button>
          </div>
        )}

        {/* MAIN CORES BENTO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMN 1: MY ASSIGNED LEADS DESK */}
          <div className="lg:col-span-2 bg-[#111622] border border-[#1f2635] p-6 rounded-3xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white">My Assigned Leads Desk</h3>
                <p className="text-xs text-gray-400 mt-1">Pick a customer contact to launch virtual dialer</p>
              </div>

              {/* TELECALLERS ADDING CUSTOMER CLIENT BUTTON */}
              <button
                onClick={() => setShowAddCustomerModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 self-start md:self-auto"
              >
                <Plus className="w-4 h-4" />
                Add Customer (ग्राहक जोड़ें)
              </button>
            </div>

            {/* SEACH BAR & TABS */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search lead by name or phone..."
                  className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none pl-10 pr-4 py-2.5 rounded-xl text-xs placeholder:text-gray-600"
                />
              </div>

              <div className="flex bg-[#0e121a] border border-[#1f2635] p-1 rounded-xl overflow-x-auto max-w-full no-scrollbar whitespace-nowrap gap-1">
                {(['All', 'New', 'Contacted', 'Nurturing', 'Closed Won', 'Closed Lost', 'Interested', 'Spoke'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveFilter(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                      activeFilter === tab 
                        ? 'bg-[#f97316] text-white border border-orange-600' 
                        : 'text-gray-400 hover:text-white hover:bg-[#1e2535]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* CLIENT CARDS MAPS */}
            <div className="space-y-4">
              {filteredLeads.map(lead => {
                const getStatusBadgeStyle = (status: string) => {
                  switch (status) {
                    case 'New': return 'bg-blue-500/15 text-blue-400 border border-blue-500/20';
                    case 'Contacted': return 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20';
                    case 'Nurturing': return 'bg-purple-500/15 text-purple-400 border border-purple-500/20';
                    case 'Closed Won': return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
                    case 'Closed Lost': return 'bg-rose-500/15 text-rose-400 border border-rose-500/20';
                    case 'Interested': return 'bg-amber-500/15 text-amber-400 border border-amber-500/20';
                    case 'Spoke': return 'bg-orange-500/15 text-orange-400 border border-orange-500/20';
                    default: return 'bg-gray-500/15 text-gray-400 border border-gray-500/20';
                  }
                };

                return (
                  <div key={lead.id} className="bg-[#0e121a] border border-[#1e2635] p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-gray-700 transition">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-white text-base">{lead.name}</h4>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${getStatusBadgeStyle(lead.status)}`}>
                          {lead.status}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
                        <span>📱 {lead.phone}</span>
                        {lead.email && <span>📧 {lead.email}</span>}
                      </div>

                      <p className="text-xs text-gray-400 leading-relaxed italic bg-[#111622] p-2.5 rounded-xl border border-[#1e2535]">
                        "{lead.requirements}"
                      </p>

                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => {
                            setUpdatingLead(lead);
                            setNewStatus(lead.status);
                            setNewNotes(lead.notes || '');
                          }}
                          className="px-3 py-1.5 bg-[#1a2130] hover:bg-[#222c3f] text-[#f97316] border border-[#2d3953] rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          ⚙️ Update Stage
                        </button>
                        <button
                          onClick={() => setViewingJourneyLead(lead)}
                          className="px-3 py-1.5 bg-[#1a2130] hover:bg-[#222c3f] text-orange-400 border border-[#2d3953] rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          📈 Track Journey
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 self-stretch md:self-auto justify-end w-full md:w-auto">
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 p-3 rounded-xl transition cursor-pointer flex items-center justify-center"
                        title="Delete Customer Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handlePlaceCall(lead)}
                        className="bg-[#f97316] hover:bg-orange-600 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition cursor-pointer flex items-center gap-2 flex-1 md:flex-initial justify-center"
                      >
                        <Phone className="w-4 h-4 fill-white" />
                        Place Free Call
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredLeads.length === 0 && (
                <div className="text-center py-12 text-gray-500 text-xs">
                  No assigned leads matching criteria found.
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: CALL LOGS HISTORY & 24/7 SUPPORT REQUESTS */}
          <div className="space-y-6">
            
            {/* CALL DIAL LOGS HISTORY */}
            <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-3xl space-y-4">
              <h3 className="text-base font-extrabold text-white uppercase tracking-wider">My Dial Logs History</h3>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {callLogs.map(log => (
                  <div key={log.id} className="bg-[#0e121a] border border-[#1e2635] p-4 rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-xs text-white">{log.leadName}</h4>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        log.status === 'Interested' ? 'bg-emerald-500/10 text-emerald-400' :
                        log.status === 'Spoke' ? 'bg-orange-500/10 text-orange-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500 flex justify-between items-center">
                      <span>Duration: {log.duration}s</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    {log.notes && <p className="text-[11px] text-gray-400 italic">"{log.notes}"</p>}
                    
                    {/* AUDIO PLAYER CONTROLLER */}
                    {log.hasRecording && (
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          onClick={() => handlePlayRecording(log.recordingId || log.id)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                            playingAudioId === (log.recordingId || log.id)
                              ? 'bg-orange-500 text-white'
                              : 'bg-[#151922] text-[#f97316] border border-[#f97316]/20 hover:bg-[#1c2436]'
                          }`}
                        >
                          {playingAudioId === (log.recordingId || log.id) ? (
                            <>
                              <Pause className="w-3 h-3 fill-white" />
                              Pause Audio
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-[#f97316]" />
                              Listen Recording (.mp3)
                            </>
                          )}
                        </button>
                        <span className="text-[9px] text-gray-500 font-mono">
                          {log.recordingId || 'call_record.mp3'}
                        </span>
                      </div>
                    )}

                    {/* ADMIN FEEDBACK & QUESTIONS SYSTEM */}
                    {(log.adminFeedback || (log.feedbackReplies && log.feedbackReplies.length > 0)) && (
                      <div className="mt-2.5 p-3 bg-orange-500/5 border border-orange-500/15 rounded-xl space-y-2 text-[11px]">
                        {log.adminFeedback && (
                          <div>
                            <span className="font-bold text-[#f97316] block uppercase tracking-wider text-[8px] mb-0.5">
                              Admin Advice / Question (एडमिन सलाह / सवाल):
                            </span>
                            <p className="text-gray-200 italic">"{log.adminFeedback}"</p>
                          </div>
                        )}

                        {/* REPLIES LOOP */}
                        {log.feedbackReplies && log.feedbackReplies.length > 0 && (
                          <div className="pt-2 border-t border-orange-500/10 space-y-1.5">
                            <span className="text-[8px] font-black text-gray-400 block uppercase tracking-wider">Discussion History:</span>
                            {log.feedbackReplies.map((reply: any, rIdx: number) => (
                              <div key={rIdx} className="bg-[#0b0d14] p-2 rounded border border-gray-800/40">
                                <div className="flex justify-between text-[9px] font-bold text-gray-400 mb-0.5">
                                  <span>{reply.senderName} ({reply.senderRole === 'admin' ? 'Main Admin' : reply.senderRole})</span>
                                  <span>{new Date(reply.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-gray-300 font-medium">{reply.text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* REPLY FORM */}
                        <div className="pt-2 flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Type your response / explain details..."
                            id={`log-reply-input-${log.id}`}
                            className="bg-[#0d0f17] text-white border border-gray-800 focus:border-[#f97316] text-[10px] px-2 py-1 rounded outline-none flex-1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = (document.getElementById(`log-reply-input-${log.id}`) as HTMLInputElement)?.value;
                                handleSaveReply(log.id, val);
                                (document.getElementById(`log-reply-input-${log.id}`) as HTMLInputElement).value = '';
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              const val = (document.getElementById(`log-reply-input-${log.id}`) as HTMLInputElement)?.value;
                              handleSaveReply(log.id, val);
                              (document.getElementById(`log-reply-input-${log.id}`) as HTMLInputElement).value = '';
                            }}
                            className="bg-[#f97316] hover:bg-orange-600 text-white font-extrabold text-[9px] px-2.5 py-1 rounded transition cursor-pointer"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {callLogs.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-xs italic">
                    No call sessions logged today yet.
                  </div>
                )}
              </div>
            </div>

            {/* 24/7 TECHNICAL ASSISTANCE TICKETS */}
            <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-3xl space-y-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#f97316] animate-pulse" />
                24/7 Support Assistance
              </h3>
              
              <form onSubmit={handleSubmitSupport} className="space-y-3">
                <input 
                  type="text" 
                  required
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  placeholder="Query Topic (e.g., Calling lag)"
                  className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none px-3 py-2 rounded-lg text-xs"
                />
                <textarea 
                  required
                  value={supportMsg}
                  onChange={(e) => setSupportMsg(e.target.value)}
                  placeholder="Describe technical issue in detail..."
                  rows={2}
                  className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none px-3 py-2 rounded-lg text-xs resize-none"
                />
                <button 
                  type="submit"
                  disabled={isSubmittingSupport}
                  className="w-full bg-[#151922] border border-[#222b3c] hover:border-gray-500 text-gray-300 font-bold py-2 rounded-lg text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingSupport ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Raise Urgent Support Ticket'}
                </button>
              </form>

              {/* RECENT TICKETS INBOX */}
              {supportTickets.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-[#1f2635]">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Recent Ticket status:</span>
                  {supportTickets.slice(0, 2).map(tk => (
                    <div key={tk.id} className="bg-[#0e121a] border border-[#1e2635] p-3 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between">
                        <strong className="text-gray-300 truncate w-32">{tk.subject}</strong>
                        <span className={`text-[9px] font-bold uppercase ${tk.status === 'open' ? 'text-red-400' : 'text-emerald-400'}`}>
                          {tk.status}
                        </span>
                      </div>
                      {tk.reply && <p className="text-gray-400 italic bg-[#111622] p-1.5 rounded mt-1">Reply: "{tk.reply}"</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* HRM & SELF-SERVICE PAYROLL PORTAL (एचआरएम एवं वेतन विभाग) */}
        <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-3xl space-y-6">
          <div className="border-b border-[#1f2635] pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-left">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#f97316]" /> 
                HRM & Self-Service Payroll (एचआरएम एवं वेतन विभाग)
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Apply for leaves, view active attendance calendar, and download verified salary slips.
              </p>
            </div>
            
            {/* Month filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Select Payroll Month:</span>
              <input 
                type="month" 
                value={selectedHrmMonth}
                onChange={(e) => setSelectedHrmMonth(e.target.value)}
                className="bg-[#0e121a] border border-[#222b3c] text-white text-xs rounded-xl px-3 py-1.5 focus:border-[#f97316] outline-none font-bold cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUMN 1: APPLY LEAVE (छुट्टी के लिए आवेदन) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#f97316]" />
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Apply for Leave (छुट्टी का आवेदन)</h4>
              </div>

              <form onSubmit={handleApplyLeave} className="space-y-3 bg-[#0d1017] p-4 rounded-2xl border border-[#1f2635] text-left">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1 uppercase font-bold">Start Date</label>
                    <input 
                      type="date"
                      required
                      value={leaveStartDate}
                      onChange={(e) => setLeaveStartDate(e.target.value)}
                      className="w-full bg-[#111622] text-white border border-[#222b3c] rounded-xl px-3 py-1.5 text-xs focus:border-[#f97316] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1 uppercase font-bold">End Date</label>
                    <input 
                      type="date"
                      required
                      value={leaveEndDate}
                      onChange={(e) => setLeaveEndDate(e.target.value)}
                      className="w-full bg-[#111622] text-white border border-[#222b3c] rounded-xl px-3 py-1.5 text-xs focus:border-[#f97316] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-1 uppercase font-bold">Reason for Leave (कारण)</label>
                  <textarea 
                    required
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="e.g. Health issue or personal work details..."
                    rows={2}
                    className="w-full bg-[#111622] text-white border border-[#222b3c] rounded-xl px-3 py-2 text-xs focus:border-[#f97316] outline-none resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmittingLeave}
                  className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-extrabold text-xs py-2 rounded-xl transition flex justify-center items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingLeave ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Leave Request'}
                </button>
              </form>

              {/* MY APPLICATIONS STATUS LIST */}
              <div className="space-y-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider text-left">Leave Applications Status:</span>
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {myLeaveApplications.map(lv => (
                    <div key={lv.id} className="bg-white border border-gray-200 shadow-sm p-4 rounded-xl space-y-2.5 text-xs text-left">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-black text-gray-900">{lv.startDate} to {lv.endDate}</p>
                          <p className="text-[10px] text-gray-600 font-semibold mt-0.5" title={lv.reason}>Reason: {lv.reason}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                            lv.status?.toLowerCase() === 'approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            lv.status?.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                            lv.status?.toLowerCase() === 'queried' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                            'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }`}>
                            {lv.status === 'Queried' ? 'Queried 💬' : lv.status}
                          </span>
                          {lv.status === 'Approved' && (
                            <span className="text-[8px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 uppercase tracking-wider">
                              {lv.payType || 'Half Pay'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Show rejection reason if present */}
                      {lv.rejectionReason && (
                        <div className="bg-red-50 border border-red-100 p-2.5 rounded-lg text-[10px] text-red-900 leading-relaxed font-semibold">
                          <span className="text-red-700 font-extrabold">अस्वीकृति का कारण: </span>
                          {lv.rejectionReason}
                        </div>
                      )}

                      {/* Show employee query if present */}
                      {lv.query && (
                        <div className="bg-purple-50 border border-purple-100 p-2.5 rounded-lg text-[10px] text-purple-900 leading-relaxed font-semibold">
                          <span className="text-purple-700 font-extrabold">आपका सवाल: </span>
                          {lv.query}
                        </div>
                      )}

                      {/* Show admin reply if present */}
                      {lv.queryResponse && (
                        <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg text-[10px] text-emerald-900 leading-relaxed font-semibold">
                          <span className="text-emerald-700 font-extrabold">एडमिन का जवाब: </span>
                          {lv.queryResponse}
                        </div>
                      )}

                      {/* Raise question button if status is Rejected or Queried */}
                      {(lv.status?.toLowerCase() === 'rejected' || lv.status?.toLowerCase() === 'queried') && (
                        <button
                          type="button"
                          onClick={() => {
                            setQueryModalLeaveId(lv.id);
                            setQueryModalText(lv.query || '');
                          }}
                          className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-extrabold text-xs py-2 rounded-xl transition text-center cursor-pointer"
                        >
                          {lv.query ? '✏️ Edit Question / Appeal (सवाल बदलें)' : '❓ Raise Question / Appeal (सवाल उठाएं)'}
                        </button>
                      )}
                    </div>
                  ))}
                  {myLeaveApplications.length === 0 && (
                    <p className="text-xs text-gray-500 italic py-2 text-center">No leave applications found.</p>
                  )}
                </div>
              </div>
            </div>

            {/* COLUMN 2: ATTENDANCE OVERVIEW (हाजिरी रिपोर्ट) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Attendance Breakdown ({selectedHrmMonth})</h4>
              </div>

              {myPayrollStats ? (
                <div className="grid grid-cols-7 gap-1 bg-[#0d1017] p-3 rounded-2xl border border-[#1f2635] text-center text-[10px]">
                  {myPayrollStats.detailDays && myPayrollStats.detailDays.map((day: any) => {
                    let bg = "bg-[#1f2635]/20 text-gray-500";
                    if (day.type.startsWith("Present")) bg = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
                    if (day.type.startsWith("Leave")) bg = "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
                    if (day.type === "Absent") bg = "bg-red-500/20 text-red-400 border border-red-500/30";
                    if (day.type === "Sunday-Paid") bg = "bg-blue-500/20 text-blue-400 border border-blue-500/30";
                    if (day.type === "Sunday-Deducted") bg = "bg-orange-500/20 text-orange-400 border border-orange-500/30";

                    return (
                      <div key={day.day} className={`p-1 rounded flex flex-col justify-between h-9 ${bg}`} title={day.label}>
                        <span className="font-bold">{day.day}</span>
                        <span className="text-[7px] truncate font-semibold uppercase">{day.type.split("-")[0]}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[#0d1017] p-8 text-center rounded-2xl border border-[#1f2635] text-xs text-gray-500 italic">
                  Attendance matrix pending for this billing month.
                </div>
              )}

              {/* Attendance metrics brief count */}
              {myPayrollStats && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#0e121a] p-2 rounded-xl border border-[#1f2635]">
                    <span className="text-[9px] text-gray-400 block uppercase font-bold">Present</span>
                    <span className="text-sm font-extrabold text-emerald-400">{myPayrollStats.presentDays} Days</span>
                  </div>
                  <div className="bg-[#0e121a] p-2 rounded-xl border border-[#1f2635]">
                    <span className="text-[9px] text-gray-400 block uppercase font-bold">Leaves</span>
                    <span className="text-sm font-extrabold text-yellow-400">{myPayrollStats.leaveDays} Days</span>
                  </div>
                  <div className="bg-[#0e121a] p-2 rounded-xl border border-[#1f2635]">
                    <span className="text-[9px] text-gray-400 block uppercase font-bold">Sunday Ded</span>
                    <span className="text-sm font-extrabold text-orange-400">{myPayrollStats.sundayDeductedCount || 0} Days</span>
                  </div>
                </div>
              )}

              {/* COMPANY HOLIDAYS */}
              <div className="pt-4 border-t border-[#1f2635] space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#f97316]" />
                  <span className="text-xs font-extrabold text-white uppercase tracking-wider">Company Holidays (सार्वजनिक अवकाश)</span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto bg-[#0d1017] p-3.5 rounded-2xl border border-[#1f2635]">
                  {companyHolidays && companyHolidays.map(hol => (
                    <div key={hol.id} className="flex justify-between items-center text-xs text-gray-300 py-1.5 border-b border-[#1f2635]/50 last:border-0">
                      <div className="text-left">
                        <span className="font-extrabold text-white block">{hol.reason}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{hol.date}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-extrabold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Paid Holiday</span>
                    </div>
                  ))}
                  {(!companyHolidays || companyHolidays.length === 0) && (
                    <p className="text-[10px] text-gray-500 italic text-center py-2">No company holidays listed yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* COLUMN 3: PAYROLL & SALARY SLIPS (वेतन विवरण) */}
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#f97316]" />
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Payroll & Salary Slips (वेतन विवरण)</h4>
              </div>

              {myPayrollStats ? (
                <div className="bg-[#0d1017] p-5 rounded-2xl border border-[#1f2635] space-y-4">
                  <div className="flex justify-between items-start border-b border-[#1f2635] pb-3">
                    <div>
                      <p className="text-xs text-gray-400">Total Net Salary (कुल देय वेतन)</p>
                      <span className="text-2xl font-black text-[#f97316] block mt-1">₹{myPayrollStats.finalSalary.toLocaleString()}</span>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">
                      AUDITED
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-gray-400">
                      <span>Base monthly salary:</span>
                      <strong className="text-white">₹{myPayrollStats.salaryBase.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Deductions:</span>
                      <strong className="text-red-400">-₹{myPayrollStats.totalDeductions.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Incentive Earned:</span>
                      <strong className="text-emerald-400">+₹{myPayrollStats.incentiveAmount.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between text-gray-400 border-t border-[#1f2635] pt-2">
                      <span>Conversion achievement:</span>
                      <strong className="text-orange-400">{myPayrollStats.performancePct}% ({myPayrollStats.salesDoneCount} sales)</strong>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => setShowMySlipModal(true)}
                    className="w-full bg-[#1e2637] hover:bg-[#28324a] text-white font-extrabold text-xs py-2.5 rounded-xl transition cursor-pointer text-center block mt-2 border border-[#2d3953]"
                  >
                    🔍 View Detailed Salary Slip
                  </button>
                </div>
              ) : (
                <div className="bg-[#0d1017] p-8 text-center rounded-2xl border border-[#1f2635] text-xs text-gray-500 italic">
                  Payroll and salary calculations have not been verified by administration yet. Please check in with the main admin.
                </div>
              )}

              {/* SALARY & ATTENDANCE CRITERIA RULES (सैलरी एवं हाजिरी नियम) */}
              <div className="bg-[#0d1017] p-5 rounded-2xl border border-[#1f2635] space-y-3">
                <div className="flex items-center justify-between border-b border-[#1f2635] pb-2">
                  <h5 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                    Company Salary Rules (कंपनी नियम)
                  </h5>
                  <span className="text-[9px] bg-orange-500/10 text-[#f97316] border border-orange-500/20 px-1.5 py-0.5 rounded font-bold font-mono">
                    Active
                  </span>
                </div>
                <div className="space-y-3.5 divide-y divide-[#1f2635]/50 max-h-[260px] overflow-y-auto pr-1">
                  {salaryRules.filter(r => r.enabled).map((rule, idx) => (
                    <div key={rule.id || idx} className={`${idx > 0 ? 'pt-2.5' : ''} text-xs text-left`}>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]" />
                        <span className="font-bold text-white text-[11px]">{rule.name}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-relaxed mt-1">{rule.description}</p>
                      <div className="flex gap-2 text-[9px] text-gray-500 font-mono mt-1">
                        <span>Segment: <strong>{rule.segment || "All"}</strong></span>
                        <span>•</span>
                        <span>Value: <strong>{rule.valueType === 'Percentage' ? `${rule.value}%` : rule.type === 'PerformanceCut' || rule.type === 'LateDeduction' ? `${rule.value} mins/pct` : `₹${rule.value}`}</strong></span>
                      </div>
                    </div>
                  ))}
                  {salaryRules.filter(r => r.enabled).length === 0 && (
                    <p className="text-[10px] text-gray-500 italic text-center py-2">No active salary rules found.</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================== */}
        {/* WORK, TASKS & SUPERVISOR COMMUNICATION SECTION */}
        {/* ========================================== */}
        <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-3xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e2635] pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                📋 My Assigned Work & Progress (मेरा काम और प्रगति)
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                View instructions assigned by your department head / sub-admin, submit completions, or raise appeals.
              </p>
            </div>
            
            {/* Direct WhatsApp / Call Supervisor Support */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-gray-400 font-bold">Contact supervisor:</span>
              <a 
                href="https://wa.me/919876543210" 
                target="_blank" 
                referrerPolicy="no-referrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Head
              </a>
              <a 
                href="tel:+919876543210" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" /> Call Head
              </a>
            </div>
          </div>

          {/* Tasks List */}
          {myTasks.length === 0 ? (
            <div className="text-center py-8 bg-[#0d1017] rounded-2xl border border-[#1f2635]">
              <p className="text-sm text-gray-500 font-medium">No tasks assigned to you yet. (अभी कोई काम आवंटित नहीं हुआ है)</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myTasks.map((task: any) => {
                const todayStr = new Date().toISOString().split('T')[0];
                const isTaskOverdue = !['Approved', 'Submitted'].includes(task.status) && task.date < todayStr;
                return (
                  <div key={task.id} className="bg-[#0e121a] border border-[#1e2635] p-5 rounded-2xl space-y-3 text-left">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">TASK TITLE</span>
                        <h4 className="font-bold text-white text-sm">
                          {task.title}
                          {isTaskOverdue && (
                            <span className="block text-[10px] text-red-500 font-extrabold font-sans mt-0.5 animate-pulse">
                              ⚠️ OVERDUE (देरी)
                            </span>
                          )}
                        </h4>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        task.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        task.status === 'Denied' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                        task.status === 'Submitted' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                        task.status === 'Appealed' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' :
                        'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30'
                      }`}>
                        {task.status === 'Approved' ? 'Done / Approved ✓' : task.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400">
                      <div>
                        <span className="text-gray-500">Assigned By:</span> {task.assignedByName || "Head/Admin"}
                      </div>
                      <div>
                        <span className="text-gray-500 font-sans">Target Date:</span> {task.date}
                      </div>
                    </div>

                    {task.assignedAt && (
                      <div className="text-[10px] text-gray-500 font-sans bg-[#0d1017] p-2 rounded-xl border border-[#1f2635]">
                        📅 <span className="font-bold">Assigned On:</span> {new Date(task.assignedAt).toLocaleDateString()} at {new Date(task.assignedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    )}

                    {task.completedAt && (
                      <div className="text-[10px] text-emerald-400 font-sans bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10">
                        ✓ <span className="font-bold">Completed On:</span> {new Date(task.completedAt).toLocaleDateString()} at {new Date(task.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    )}

                    {task.referenceFile && (
                      <div className="p-3 bg-orange-500/5 rounded-xl border border-orange-500/10 text-xs flex items-center justify-between gap-3">
                        <div className="truncate flex-1">
                          <span className="text-[8px] font-bold text-orange-400 block uppercase">WORK REFERENCE FILE</span>
                          <span className="text-white font-bold truncate block max-w-[180px]" title={task.referenceFile.name}>{task.referenceFile.name}</span>
                        </div>
                        <a 
                          href={task.referenceFile.dataUrl || task.referenceFile.data} 
                          download={task.referenceFile.name}
                          className="bg-[#f97316] hover:bg-orange-600 text-white font-black px-2.5 py-1 rounded text-[9px] shrink-0"
                        >
                          Download Reference
                        </a>
                      </div>
                    )}

                    {/* Overdue delay explanation section */}
                    {isTaskOverdue && !task.overdueRemark && (
                      <div className="bg-red-500/10 border border-red-500/25 p-3 rounded-xl space-y-1.5 font-sans">
                        <p className="text-[10px] text-red-400 font-extrabold">⚠️ Task Overdue: Please enter reason for delay (देरी का कारण):</p>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            id={`overdue-remark-tele-${task.id}`}
                            placeholder="Reason for delay..."
                            className="bg-[#0d1017] border border-[#1f2635] rounded-lg px-2.5 py-1 text-xs text-white flex-1 focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              const val = (document.getElementById(`overdue-remark-tele-${task.id}`) as HTMLInputElement)?.value;
                              if (val) handleSendOverdueRemark(task.id, val);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] px-3 py-1 rounded-lg transition"
                          >
                            Submit
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Display overdue delay remark if exists */}
                    {task.overdueRemark && (
                      <div className="p-3 bg-red-500/5 text-red-300 rounded-xl border border-red-500/20 text-xs">
                        <span className="font-extrabold text-red-400 block mb-0.5">⚠️ DELAY REASON (देरी का कारण):</span>
                        <p className="italic">"{task.overdueRemark}"</p>

                        {task.overdueReply && (
                          <div className="mt-2 pt-2 border-t border-red-500/20 text-emerald-400 font-sans">
                            <span className="font-extrabold text-emerald-400 block mb-0.5">✓ Supervisor Response:</span>
                            <p className="italic">"{task.overdueReply}"</p>
                          </div>
                        )}
                      </div>
                    )}

                    {task.remark && (
                      <div className="p-3 bg-[#111622] rounded-xl border border-[#1f2635] text-xs space-y-1">
                        <span className="text-[9px] font-bold text-gray-500 block uppercase">YOUR SUBMISSION REMARK</span>
                        <p className="text-gray-300 italic">"{task.remark}"</p>
                      </div>
                    )}

                    {task.adminReply && (
                      <div className="p-3 bg-orange-500/5 rounded-xl border border-orange-500/20 text-xs space-y-1">
                        <span className="text-[9px] font-bold text-orange-400 block uppercase">SUPERVISOR FEEDBACK</span>
                        <p className="text-gray-300 italic">"{task.adminReply}"</p>
                      </div>
                    )}

                    {task.appeal && (
                      <div className="p-3 bg-purple-500/5 rounded-xl border border-purple-500/20 text-xs space-y-1">
                        <span className="text-[9px] font-bold text-purple-400 block uppercase">YOUR APPEAL/QUESTION</span>
                        <p className="text-gray-300 italic">"{task.appeal}"</p>
                        {task.appealReply && (
                          <div className="mt-2 pt-2 border-t border-purple-500/10">
                            <span className="text-[9px] font-bold text-emerald-400 block uppercase">SUPERVISOR ANSWER</span>
                            <p className="text-gray-300 italic">"{task.appealReply}"</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions based on status */}
                    <div className="flex gap-2 flex-wrap pt-1">
                      {task.status === 'Pending' && (
                        <div className="w-full">
                          {selectedTaskForSubmit?.id === task.id ? (
                            <div className="space-y-3">
                              <textarea
                                value={taskRemark}
                                onChange={(e) => setTaskRemark(e.target.value)}
                                placeholder="Enter your completion proof or work update remark..."
                                className="w-full bg-[#0d1017] border border-[#222b3c] focus:border-[#f97316] rounded-xl p-2.5 text-xs text-white outline-none"
                                rows={3}
                              />
                              <div>
                                <label className="block text-xs text-gray-400 mb-2 font-black uppercase">Attach Work Proof File (PDF, Word, Excel, Video, Audio, Images, etc.)</label>
                                <div className="flex items-center justify-between bg-[#0d1017] border border-[#1f2635] hover:border-gray-600 p-3 rounded-xl transition relative">
                                  <input 
                                    type="file" 
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  />
                                  <div className="flex items-center gap-2 text-xs text-gray-400 pointer-events-none">
                                    <Upload className="w-4 h-4 text-orange-500" />
                                    {selectedFile ? (
                                      <span className="text-white font-bold truncate max-w-[200px]">{selectedFile.name}</span>
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
                                {selectedFile && (
                                  <p className="text-emerald-400 text-[10px] font-bold mt-1">✓ File loaded: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</p>
                                )}
                              </div>
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => {
                                    setSelectedTaskForSubmit(null);
                                    setSelectedFile(null);
                                    setFileUploadError(null);
                                  }}
                                  className="px-4 py-1.5 bg-[#f97316] hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleTaskSubmit(task.id, taskRemark)}
                                  className="px-4 py-1.5 bg-[#f97316] hover:bg-orange-600 text-white rounded-lg text-xs font-black transition cursor-pointer"
                                >
                                  Submit Task Proof
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedTaskForSubmit(task)}
                              className="w-full py-2 bg-[#f97316]/10 hover:bg-[#f97316]/20 border border-[#f97316]/30 text-[#f97316] hover:text-white text-xs font-black rounded-xl transition"
                            >
                              Submit Work Completion
                            </button>
                          )}
                        </div>
                      )}

                      {(task.status === 'Denied' || task.status === 'Approved') && !task.appeal && (
                        <div className="w-full">
                          {selectedTaskForAppeal?.id === task.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={taskAppealText}
                                onChange={(e) => setTaskAppealText(e.target.value)}
                                placeholder="Type your question or explanation appeal to the supervisor..."
                                className="w-full bg-[#0d1017] border border-[#222b3c] focus:border-[#f97316] rounded-xl p-2.5 text-xs text-white outline-none"
                                rows={3}
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setSelectedTaskForAppeal(null)}
                                  className="px-4 py-1.5 bg-[#f97316] hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleTaskAppeal(task.id, taskAppealText)}
                                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-black transition cursor-pointer"
                                >
                                  Submit Appeal
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedTaskForAppeal(task)}
                              className="w-full py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:text-white text-xs font-bold rounded-xl transition"
                            >
                              Raise Query / Appeal
                            </button>
                          )}
                        </div>
                      )}

                      {/* Discuss toggle button */}
                      <button
                        onClick={() => setExpandedChatTaskId(expandedChatTaskId === task.id ? null : task.id)}
                        className="w-full py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 hover:text-white text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        💬 Discuss & Chat ({(task.replies || []).length})
                      </button>
                    </div>

                    {/* Inline Expandable Chat Panel */}
                    {expandedChatTaskId === task.id && (
                      <div className="mt-3 pt-3 border-t border-[#1e2635] space-y-3 text-left">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                          💬 Discussion & Comments (कार्य संवाद)
                        </h4>
                        
                        {/* Messages logs list */}
                        <div className="space-y-2 max-h-36 overflow-y-auto bg-[#0d1017] p-2.5 rounded-xl border border-[#1f2635] text-[11px]">
                          {(task.replies || []).length === 0 ? (
                            <p className="text-gray-500 italic py-1">No messages recorded. Start the discussion below.</p>
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

                        {/* Text form input */}
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={newReplyMessage}
                            onChange={(e) => setNewReplyMessage(e.target.value)}
                            placeholder="Write message... (संदेश लिखें...)"
                            className="flex-1 bg-[#0d1017] border border-[#1f2635] rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSendTaskReply(task.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleSendTaskReply(task.id)}
                            className="bg-[#f97316] hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* MODAL 1: ADD CUSTOMER DIALOG (TELECALLER CLIENT INSERT) */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#111622] border border-[#1f2635] rounded-3xl p-6 w-full max-w-md relative">
            <h3 className="text-lg font-black text-white flex items-center gap-2 mb-1">
              <Plus className="w-5 h-5 text-[#f97316]" /> Add New Customer Lead
            </h3>
            <p className="text-xs text-gray-400 mb-6">Create and assign a client lead immediately to yourself</p>

            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">CLIENT NAME *</label>
                <input 
                  type="text" 
                  required
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Anand Sharma"
                  className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">CALLING PHONE *</label>
                <input 
                  type="text" 
                  required
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g. +919012345678"
                  className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">WHATSAPP NUMBER (व्हाट्सएप नंबर)</label>
                <input 
                  type="text" 
                  value={newCustomer.whatsapp || ''}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, whatsapp: e.target.value }))}
                  placeholder="e.g. +919012345678"
                  className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">EMAIL ADDRESS</label>
                <input 
                  type="email" 
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. anand@company.com"
                  className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">CLIENT REQUIREMENTS / PRODUCTS</label>
                <textarea 
                  value={newCustomer.requirements}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, requirements: e.target.value }))}
                  placeholder="e.g. Wants eco custom packaging"
                  rows={3}
                  className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-4 py-2 text-sm resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-[#1f2635]">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2.5 bg-[#151922] border border-[#222b3c] text-gray-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCustomer}
                  className="px-5 py-2.5 bg-[#f97316] hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingCustomer ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ACTUAL TELECALL CONTROLLER & WHATSAPP TEMPLATES CONSOLE */}
      {activeCallLead && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#111622] border border-[#1f2635] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row h-[550px]">
            
            {/* LEFT HALF: STATUS, METRICS AND MANUAL TRIGGER ACTIONS */}
            <div className="flex-1 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#1f2635] bg-[#0c0f16]">
              <div className="space-y-4">
                {/* Caller Profile Card */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#f97316] tracking-wider uppercase">REAL CALL & WHATSAPP DESK</span>
                  <h3 className="text-xl font-black text-white">{activeCallLead.name}</h3>
                  <p className="text-xs text-gray-400">{activeCallLead.phone}</p>
                </div>

                <div className="bg-[#111622] border border-[#1e2635] p-3 rounded-xl">
                  <span className="text-[9px] font-bold text-gray-500 uppercase block mb-1">CLIENT REQUIREMENTS</span>
                  <p className="text-xs text-gray-300 italic">"{activeCallLead.requirements}"</p>
                </div>
              </div>

              {/* CALLING ACTION PROTOCOLS */}
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                
                {callState === 'ringing' ? (
                  <div className="flex flex-col items-center space-y-4 w-full">
                    <div className="w-20 h-20 rounded-full bg-orange-500/10 border-2 border-orange-500/40 flex items-center justify-center relative">
                      <div className="absolute inset-0 w-full h-full bg-orange-500/20 rounded-full animate-ping"></div>
                      <Phone className="w-8 h-8 text-[#f97316] animate-bounce" />
                    </div>
                    <div>
                      <span className="text-sm font-black text-[#f97316] uppercase tracking-widest block animate-pulse">
                        🔔 Ringing Outbound... (घंटी जा रही है)
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Please click "ANSWER / CONNECT" below when the customer picks up the call!
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md pt-2">
                      <button
                        onClick={handleAnswerCall}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 hover:scale-[1.02]"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        ANSWER / CONNECT (कॉल कनेक्ट करें)
                      </button>
                      <button
                        onClick={handleEndCall}
                        className="bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-red-500/20 hover:scale-[1.02]"
                      >
                        <XCircle className="w-4 h-4" />
                        DECLINE (काटें)
                      </button>
                    </div>
                  </div>
                ) : callState === 'connected' ? (
                  <div className="flex flex-col items-center space-y-3 w-full">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center">
                      <div className="w-4 h-4 bg-emerald-500 rounded-full animate-ping"></div>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-400 block">CALL TIMING RUNNING</span>
                      <p className="text-[10px] text-gray-400 mt-0.5">कॉल चल रही है / सिम/डायल ऐप पर बात करें</p>
                    </div>
                    
                    {/* Stopwatch */}
                    <div className="text-3xl font-black text-white font-mono flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#f97316]" />
                      {Math.floor(callTimer / 60).toString().padStart(2, '0')}:
                      {(callTimer % 60).toString().padStart(2, '0')}
                    </div>

                    {/* Manual Triggers in active console */}
                    <div className="flex gap-2 w-full pt-2">
                      <button
                        onClick={() => { window.location.href = `tel:${activeCallLead.phone}`; }}
                        className="flex-1 bg-[#f97316]/10 hover:bg-[#f97316]/20 border border-[#f97316]/30 text-[#f97316] py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call Again
                      </button>
                      <button
                        onClick={() => {
                          const clean = getCleanWhatsAppPhone(activeCallLead.whatsapp || activeCallLead.phone);
                          window.open(`https://wa.me/${clean}`, '_blank');
                        }}
                        className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Chat
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-red-400">Call Finished</span>
                      <p className="text-[10px] text-gray-500 mt-0.5">कॉल समाप्त हुई, अब परिणाम दर्ज करें</p>
                    </div>
                  </div>
                )}

                {/* Local microphone visualizers */}
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${callState === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`}></div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase">Timer Active</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`}></div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase">
                        {isRecording ? 'Recording Live' : 'Recording Inactive'}
                      </span>
                    </div>
                  </div>

                  {recordingError && (
                    <div className="mt-2 p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-[11px] text-red-200 space-y-1 text-left">
                      <p className="font-bold flex items-center gap-1 text-red-400">
                        ⚠️ Microphone Alert (रिकॉर्डिंग अलर्ट):
                      </p>
                      <p className="leading-relaxed">{recordingError}</p>
                      <p className="text-gray-400 text-[10px] leading-snug">
                        Note: Virtual calls route through your local device protocol. If running in an iframe preview, click "Open in new tab" at the top-right to authorize secure media capture.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* CALL END BUTTON */}
              {callState !== 'ended' ? (
                <button
                  onClick={handleEndCall}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-red-500/15"
                >
                  <XCircle className="w-4 h-4" />
                  Disconnect Call (कॉल काटें)
                </button>
              ) : (
                <div className="text-center text-[10px] text-gray-400 font-bold uppercase py-3 border border-dashed border-gray-700 rounded-xl bg-[#080b10]">
                  📝 Please log Call outcome on right →
                </div>
              )}
            </div>

            {/* RIGHT HALF: DYNAMIC WHATSAPP MESSENGER & CAMPAIGN TEMPLATES */}
            <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto max-h-[550px] md:max-h-full bg-[#111622]">
              
              {callState !== 'ended' ? (
                <div className="flex-1 flex flex-col justify-between h-full space-y-4">
                  <div className="space-y-3">
                    <div className="text-[10px] text-[#f97316] font-bold uppercase tracking-wider block border-b border-[#1f2635] pb-1.5 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Direct Dispatch Templates
                    </div>
                    
                    <p className="text-[10px] text-gray-400">
                      Select any template below to load, customize, and immediately open in real WhatsApp Web/App:
                    </p>

                    {/* Pre-filled Templates */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          title: '👋 Welcome Intro',
                          desc: 'परिचय व स्वागत संदेश',
                          text: `नमस्ते ${activeCallLead.name} जी, मैं Graphics World से बात कर रहा हूँ। आपने बॉक्स डिजाइनिंग / पैकेजिंग में रुचि दिखाई थी। क्या हम इसके बारे में बात कर सकते हैं?`
                        },
                        {
                          title: '📵 Not Reachable',
                          desc: 'कॉल न उठाने पर सन्देश',
                          text: `नमस्ते ${activeCallLead.name} जी, मैंने आपको कॉल करने का प्रयास किया था लेकिन आपका नंबर व्यस्त/अनलपलब्ध था। कृपया फ्री होकर हमें मैसेज करें।`
                        },
                        {
                          title: '📦 Catalogue Sent',
                          desc: 'कैटलॉग और प्राइस लिस्ट',
                          text: `नमस्ते ${activeCallLead.name} जी, आपकी रिक्वायरमेंट: "${activeCallLead.requirements || 'कस्टम पैकेजिंग'}" के संबंध में हमारा कैटलॉग यहाँ देखें।`
                        },
                        {
                          title: '🙏 Thank You Notes',
                          desc: 'बातचीत के बाद आभार',
                          text: `नमस्ते ${activeCallLead.name} जी, आपसे बातचीत करके बहुत ख़ुशी हुई। हम जल्द ही आपकी रिक्वायरमेंट पर प्रोसेस शुरू करेंगे। धन्यवाद!`
                        }
                      ].map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setWhatsappMessage(tmpl.text)}
                          className="p-2.5 bg-[#0c0f16] border border-[#1f2635] hover:border-emerald-500 hover:bg-emerald-500/5 text-left rounded-xl transition cursor-pointer"
                        >
                          <span className="text-[11px] font-bold text-white block">{tmpl.title}</span>
                          <span className="text-[9px] text-gray-500 block">{tmpl.desc}</span>
                        </button>
                      ))}
                    </div>

                    {/* Composer input preview */}
                    <div className="pt-1.5">
                      <label className="text-[9px] font-extrabold text-gray-500 block mb-1 uppercase tracking-wider">
                        Custom Message Preview (संदेश का प्रीव्यू)
                      </label>
                      <textarea
                        value={whatsappMessage}
                        onChange={(e) => setWhatsappMessage(e.target.value)}
                        rows={4}
                        className="w-full bg-[#0c0f16] text-white border border-[#1f2635] focus:border-emerald-500 outline-none rounded-xl px-3 py-2 text-xs resize-none"
                        placeholder="Select a template above or type your text..."
                      />
                    </div>
                  </div>

                  {/* WhatsApp send dispatch */}
                  <button
                    type="button"
                    onClick={() => {
                      const cleanPhone = getCleanWhatsAppPhone(activeCallLead.whatsapp || activeCallLead.phone);
                      const encodedText = encodeURIComponent(whatsappMessage);
                      window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`, '_blank');
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                  >
                    <MessageSquare className="w-4 h-4 fill-white text-emerald-600" />
                    Send Custom Message via Real WhatsApp
                  </button>

                  <div className="border-t border-[#1f2635] pt-2 flex justify-between items-center text-[10px]">
                    <span className="text-gray-500 font-bold">Real CRM Operations</span>
                    <button
                      type="button"
                      onClick={handleEndCall}
                      className="text-[#f97316] font-bold hover:underline"
                    >
                      Skip & Log Outcome →
                    </button>
                  </div>
                </div>
              ) : (
                /* OUTCOME SAVING PORTAL ONCE DISCONNECTED */
                <div className="flex-1 flex flex-col justify-between h-full space-y-4 animate-fade-in">
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-white text-sm uppercase tracking-wider">Call Log Outcome (कॉल परिणाम)</h4>
                    
                    {/* Log Outcome Selector */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1.5 uppercase">Select status outcome</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Interested', 'Spoke', 'Not Interested'] as const).map(out => (
                          <button
                            key={out}
                            type="button"
                            onClick={() => setCallOutcome(out)}
                            className={`py-2 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                              callOutcome === out 
                                ? 'bg-[#f97316] border-[#f97316] text-white shadow' 
                                : 'bg-[#0e121a] border-[#222b3c] text-gray-400 hover:border-gray-600'
                            }`}
                          >
                            {out === 'Interested' ? 'Interested' :
                             out === 'Spoke' ? 'Follow Up' : 'Rejected'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notes text area */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">Call notes / Customer feedback</label>
                      <textarea 
                        required
                        value={callNotes}
                        onChange={(e) => setCallNotes(e.target.value)}
                        placeholder="Provide details of conversation (e.g. Anand wants 500 customised corrugated boxes, quotation details to follow on Monday)..."
                        rows={6}
                        className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-3.5 py-2.5 text-xs resize-none"
                      />
                    </div>
                  </div>

                  {/* Submission and file-save trigger */}
                  <button
                    onClick={handleSaveCallLog}
                    disabled={isProcessingRecording}
                    className={`w-full font-black py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg mt-auto ${
                      isProcessingRecording
                        ? 'bg-amber-600/50 text-amber-200 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10 cursor-pointer'
                    }`}
                  >
                    {isProcessingRecording ? (
                      <>
                        <div className="w-4 h-4 border-2 border-amber-200 border-t-transparent rounded-full animate-spin"></div>
                        <span>PROCESSING CALL RECORDING... (रिकॉर्डिंग सहेजी जा रही है)</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Save Call Log & Update Registry (कॉल विवरण सहेजें)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* RAISE LEAVE QUESTION / APPEAL MODAL OVERLAY */}
      {queryModalLeaveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#111622] border border-[#1f2635] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col p-6 space-y-4">
            <div className="text-left">
              <h3 className="text-base font-black text-white">Raise Question / Appeal (सवाल या प्रश्न उठाएं)</h3>
              <p className="text-xs text-gray-400 mt-1">If your leave was rejected and you want to raise a query or appeal to the administration, type your message below.</p>
            </div>

            <textarea
              required
              value={queryModalText}
              onChange={(e) => setQueryModalText(e.target.value)}
              placeholder="Type your question or reason for query (e.g. Please approve this as it was an emergency)..."
              className="w-full bg-[#0d1017] text-white border border-[#222b3c] rounded-xl px-3 py-2 text-xs focus:border-[#f97316] outline-none h-28 resize-none"
            />

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setQueryModalLeaveId(null);
                  setQueryModalText('');
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!queryModalText.trim()) {
                    showNotification("कृपया सवाल या कारण लिखें", "error");
                    return;
                  }
                  handleRaiseQuery(queryModalLeaveId, queryModalText);
                  setQueryModalLeaveId(null);
                  setQueryModalText('');
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-[#f97316] hover:bg-orange-600 rounded-xl cursor-pointer"
              >
                Submit Appeal (सवाल भेजें)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERSONAL EMPLOYEE PAYSLIP MODAL OVERLAY */}
      {showMySlipModal && myPayrollStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111622] border border-[#1f2635] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-[#1f2635] bg-[#0d1017] flex justify-between items-center">
              <div className="text-left">
                <h3 className="text-lg font-black text-white">My Salary Slip (सैलरी स्लिप)</h3>
                <p className="text-xs text-gray-400">Statement of Earnings and Deductions for {selectedHrmMonth}</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowMySlipModal(false)}
                className="text-gray-400 hover:text-white font-bold text-sm bg-[#1a202c] px-3 py-1.5 rounded-lg cursor-pointer"
              >
                Close ✕
              </button>
            </div>
            {/* Slip Body */}
            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] printable-slip">
              {/* Corporate Header */}
              <div className="border-b border-[#1f2635] pb-6 flex justify-between items-start">
                <div className="text-left">
                  <h2 className="text-2xl font-black text-[#f97316] tracking-tight">HubSphere</h2>
                  <p className="text-xs text-gray-500 mt-1 font-bold">Salary Slip for {selectedHrmMonth}</p>
                </div>
                <div className="text-right">
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold">
                    PAID & AUDITED
                  </span>
                  <p className="text-[10px] text-gray-500 mt-2">Generated on {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Employee Info Block */}
              <div className="grid grid-cols-2 gap-4 text-xs text-left">
                <div>
                  <p className="text-gray-500">Employee Name:</p>
                  <p className="font-bold text-white text-sm">{user.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Employee Role / Position:</p>
                  <p className="font-bold text-[#f97316] uppercase">{user.role} {user.position ? `(${user.position})` : ''}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email Address:</p>
                  <p className="text-gray-300">{user.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Monthly Target:</p>
                  <p className="text-gray-300 font-bold">{myPayrollStats.monthlyTarget} Sales</p>
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
                    <div className="text-right">₹{myPayrollStats.salaryBase.toLocaleString()}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 p-3 text-gray-300">
                    <div>
                      Deductions (Approved Leaves + Absences + Sunday Deductions)
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {myPayrollStats.leaveDays} Leaves, {myPayrollStats.absentDays} Absences, {myPayrollStats.sundayDeductedCount} Sun Deductions
                      </p>
                    </div>
                    <div className="text-right text-red-400">-₹{myPayrollStats.totalDeductions.toLocaleString()}</div>
                  </div>

                  <div className="grid grid-cols-2 p-3 text-gray-300 bg-[#161d2b]/30">
                    <div className="font-semibold text-white">Net Basic Earned (दर्ज हाजिरी के हिसाब से बेसिक)</div>
                    <div className="text-right font-semibold text-white">₹{myPayrollStats.finalBasicSalary.toLocaleString()}</div>
                  </div>

                  {user.role === 'telecaller' && (
                    <div className="grid grid-cols-2 p-3 text-gray-300">
                      <div>
                        Incentive Earned (इंसेंटिव)
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          Conversion Pct: {myPayrollStats.performancePct}% ({myPayrollStats.salesDoneCount} Sales) | Exceeded: +{myPayrollStats.incentivePct}%
                        </p>
                      </div>
                      <div className="text-right text-emerald-400">+₹{myPayrollStats.incentiveAmount.toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Payable */}
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex justify-between items-center">
                <div className="text-left">
                  <p className="text-xs text-gray-400">Total Net Payable (कुल प्राप्त सैलरी)</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Basic Earned + Performance Incentive</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#f97316]">₹{myPayrollStats.finalSalary.toLocaleString()}</span>
                </div>
              </div>

              {/* Attendance breakdown in slip */}
              <div className="space-y-2 text-left">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Attendance Breakdown ({selectedHrmMonth})</h4>
                <div className="grid grid-cols-7 gap-1 bg-[#f97316] p-2 rounded-xl border border-orange-600 text-center text-[10px]">
                  {myPayrollStats.detailDays && myPayrollStats.detailDays.map((day: any) => {
                    let bg = "bg-white/20 text-white border border-white/30";
                    if (day.type.startsWith("Present")) bg = "bg-emerald-600 text-white border border-emerald-700";
                    if (day.type.startsWith("Leave")) bg = "bg-yellow-500 text-gray-900 border border-yellow-600 font-bold";
                    if (day.type === "Absent") bg = "bg-red-600 text-white border border-red-700 font-bold";
                    if (day.type === "Sunday-Paid") bg = "bg-blue-600 text-white border border-blue-700";
                    if (day.type === "Sunday-Deducted") bg = "bg-orange-800 text-white border border-orange-900";

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
                  type="button"
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

      {/* Status message banners / Toast notification */}
      {statusMessage.text && (
        <div className="fixed top-6 right-6 z-50 animate-fade-in">
          <div className={`p-4 rounded-xl border shadow-lg text-xs font-bold flex items-center gap-2 max-w-sm ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {statusMessage.type === 'success' ? '✅' : '⚠️'} {statusMessage.text}
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

      {/* DIRECT UPDATE LEAD STATUS & PROGRESS MODAL */}
      {updatingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#111622] border border-[#1f2635] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-[#1f2635] bg-[#0d1017] flex justify-between items-center">
              <div className="text-left">
                <h3 className="text-base font-black text-white">Update Lead Progress (प्रगति अपडेट करें)</h3>
                <p className="text-xs text-gray-400 mt-1">Directly change lead stage, status, and add progressive notes for {updatingLead.name}.</p>
              </div>
              <button 
                type="button"
                onClick={() => setUpdatingLead(null)}
                className="text-gray-400 hover:text-white font-bold text-xs bg-[#1a202c] px-2.5 py-1.5 rounded-lg cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <form onSubmit={handleDirectUpdateStatus} className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Lead Stage / Status (लीड चरण)</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-3.5 py-2.5 text-xs"
                >
                  <option value="New">🆕 New Lead</option>
                  <option value="Contacted">📞 Contacted</option>
                  <option value="Nurturing">🌱 Nurturing</option>
                  <option value="Interested">⭐ Interested</option>
                  <option value="Spoke">💬 Spoke</option>
                  <option value="Not Interested">❌ Not Interested</option>
                  <option value="Closed Won">🎉 Closed Won</option>
                  <option value="Closed Lost">📉 Closed Lost</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Progress Update Notes (अपडेट विवरण)</label>
                <textarea
                  required
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="E.g., Client is looking for high volume corrugated box deliveries. Price catalog shared via WhatsApp."
                  rows={4}
                  className="w-full bg-[#0e121a] text-white border border-[#222b3c] focus:border-[#f97316] outline-none rounded-xl px-3.5 py-2.5 text-xs resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setUpdatingLead(null)}
                  className="px-4 py-2.5 bg-[#151922] border border-[#222b3c] text-gray-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingStatus}
                  className="px-5 py-2.5 bg-[#f97316] hover:bg-orange-600 text-white font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shadow-lg shadow-orange-500/15"
                >
                  {isSavingStatus ? 'Saving...' : 'Save Updates (अपडेट सहेजें)'}
                </button>
              </div>
            </form>
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
                  <p className="text-[10px] text-gray-600">Completing a virtual call or direct status update will start tracking its path.</p>
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
