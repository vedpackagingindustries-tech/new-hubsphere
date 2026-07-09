import React, { useState, useEffect, useRef } from 'react';
import { Shield, Phone, Loader2, Key, HelpCircle, Mail, User, MapPin, Compass, Laptop, Smartphone, AlertTriangle, Database, Download, Upload, FileJson, Terminal } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: { 
    id: string; 
    name: string; 
    email: string; 
    phone?: string;
    role: 'admin' | 'sub-admin' | 'head' | 'staff' | 'telecaller';
    department?: 'Tech' | 'NonTech' | 'Sales';
    position?: string;
    pcLoginAuthorizedAt?: string; // Optional timestamp when authorized via mobile GPS
  }) => void;
}

// Office GPS Coordinates from google maps link provided by user
const OFFICE_LAT = 21.2078048;
const OFFICE_LON = 81.3540014;

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<'staff_signin' | 'admin_signin' | 'recovery'>('staff_signin');
  const [recoveryType, setRecoveryType] = useState<'staff' | 'main_admin'>('staff');
  
  // Fields
  const [companyName, setCompanyName] = useState('HubSphere');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(''); // Only used for main admin recovery

  // Testing period state
  const [testingPeriod, setTestingPeriod] = useState<{
    expiryDate: string;
    isActive: boolean;
    remainingDays: number;
    isExpired: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchTestingPeriod = async () => {
      try {
        const res = await fetch('/api/testing-period');
        if (res.ok) {
          setTestingPeriod(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch testing period status", err);
      }
    };
    fetchTestingPeriod();
  }, []);
  
  // System Backup & Crash Recovery States
  const [backupJson, setBackupJson] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');
  const [showBackupConsole, setShowBackupConsole] = useState(false);
  
  const [recoveryQuestion, setRecoveryQuestion] = useState("elephant ke kitne daatt hote hai");
  const [operatorName, setOperatorName] = useState("");
  const [securityAnswerInput, setSecurityAnswerInput] = useState("");
  
  const [isRecoveryUnlocked, setIsRecoveryUnlocked] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Auto-lock when any credentials or verification parameters change
  useEffect(() => {
    setIsRecoveryUnlocked(false);
    setVerificationError('');
  }, [name, password, operatorName, securityAnswerInput]);

  const handleVerifyRecovery = async () => {
    if (!name.trim() || !password.trim()) {
      setVerificationError('❌ Please enter the Main Admin Username & Password in the main login fields above first.');
      return;
    }
    if (!operatorName.trim()) {
      setVerificationError('❌ Please enter your Operator Name (Who is attempting this recovery?).');
      return;
    }
    if (!securityAnswerInput.trim()) {
      setVerificationError('❌ Please enter the Security Answer.');
      return;
    }

    setIsVerifying(true);
    setVerificationError('');
    try {
      const response = await fetch('/api/backups/verify-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          password,
          operatorName,
          securityAnswer: securityAnswerInput
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setVerificationError(`❌ ${data.error || 'Verification failed.'}`);
        setIsRecoveryUnlocked(false);
      } else {
        setIsRecoveryUnlocked(true);
        setVerificationError('✅ Verification successful! Emergency recovery portal is now UNLOCKED.');
      }
    } catch (err) {
      setVerificationError('❌ Error connecting to backup security server.');
      setIsRecoveryUnlocked(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const [showResetDefaultsConsole, setShowResetDefaultsConsole] = useState(false);
  const [resetOperatorName, setResetOperatorName] = useState('');
  const [resetSecurityAnswer, setResetSecurityAnswer] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleResetDefaults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOperatorName.trim()) {
      setResetMessage('❌ Please enter your Operator Name (Who is attempting this recovery?).');
      return;
    }
    if (!resetSecurityAnswer.trim()) {
      setResetMessage('❌ Please enter the Security Answer.');
      return;
    }

    setIsResetting(true);
    setResetMessage('');
    try {
      const response = await fetch('/api/auth/main-admin-reset-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorName: resetOperatorName,
          securityAnswer: resetSecurityAnswer
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setResetMessage(`❌ ${data.error || 'Reset failed.'}`);
      } else {
        setResetMessage(`✅ ${data.message}`);
        setResetOperatorName('');
        setResetSecurityAnswer('');
        setName('Admin');
        setPassword('admin');
      }
    } catch (err) {
      setResetMessage('❌ Error connecting to backup security server.');
    } finally {
      setIsResetting(false);
    }
  };

  const fetchRecoveryQuestion = async () => {
    try {
      const response = await fetch('/api/backups/recovery-question');
      const data = await response.json();
      if (data && data.question) {
        setRecoveryQuestion(data.question);
      }
    } catch (err) {
      console.error("Error fetching recovery question:", err);
    }
  };

  useEffect(() => {
    if (showBackupConsole) {
      fetchRecoveryQuestion();
    }
  }, [showBackupConsole]);

  const handleDownloadBackupFile = (data: any) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `hubsphere_full_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportFullBackup = async () => {
    if (!password) {
      setBackupMessage('❌ Please enter your Admin password in the field below to authorize backup download.');
      return;
    }
    if (!operatorName.trim()) {
      setBackupMessage('❌ Please enter your Name (अपना नाम दर्ज करें) to authorize backup download.');
      return;
    }
    if (!securityAnswerInput.trim()) {
      setBackupMessage('❌ Please answer the security question (सुरक्षा प्रश्न का उत्तर दें) below to authorize download.');
      return;
    }
    setIsExporting(true);
    setBackupMessage('');
    try {
      const response = await fetch('/api/backups/export-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name || 'Admin', 
          password,
          attemptByName: operatorName,
          securityAnswer: securityAnswerInput
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setBackupMessage('❌ ' + (data.error || 'Failed to authorize backup.'));
      } else {
        handleDownloadBackupFile(data.fullDatabase);
        setBackupMessage('✅ Full system backup (.json) downloaded successfully!');
        setOperatorName('');
        setSecurityAnswerInput('');
      }
    } catch (err) {
      setBackupMessage('❌ Error contacting the backup server.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestoreFullBackup = async () => {
    if (!password) {
      setBackupMessage('❌ Please enter your Admin password in the field below to authorize system restoration.');
      return;
    }
    if (!operatorName.trim()) {
      setBackupMessage('❌ Please enter your Name (अपना नाम दर्ज करें) to authorize this crash recovery attempt.');
      return;
    }
    if (!securityAnswerInput.trim()) {
      setBackupMessage('❌ Please answer the security question (सुरक्षा प्रश्न का उत्तर दें) below.');
      return;
    }
    if (!backupJson.trim()) {
      setBackupMessage('❌ Please paste backup JSON data or choose a .json file.');
      return;
    }

    try {
      const parsed = JSON.parse(backupJson);
      if (!parsed.users || !parsed.leads) {
        setBackupMessage('❌ Invalid backup structure. Must contain standard database tables.');
        return;
      }
    } catch (e) {
      setBackupMessage('❌ Invalid JSON format. Please verify the copied text.');
      return;
    }

    setIsRestoring(true);
    setBackupMessage('');
    try {
      const response = await fetch('/api/backups/restore-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || 'Admin',
          password,
          backupData: JSON.parse(backupJson),
          attemptByName: operatorName,
          securityAnswer: securityAnswerInput
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setBackupMessage('❌ ' + (data.error || 'Failed to restore database.'));
      } else {
        setBackupMessage('🎉 SYSTEM CONFIGURED & RESTORED SUCCESSFULLY! Reloading...');
        setBackupJson('');
        setOperatorName('');
        setSecurityAnswerInput('');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      setBackupMessage('❌ Error restoring database.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleBackupFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setBackupJson(text);
      setBackupMessage(`✅ File loaded: ${file.name}. Click "Configure System" to restore.`);
    };
    reader.readAsText(file);
  };
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // GPS / Device Location States
  const [deviceType, setDeviceType] = useState<'mobile' | 'pc'>('mobile');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [gpsDistance, setGpsDistance] = useState<number | null>(null);
  const [isLocationMatched, setIsLocationMatched] = useState(false);
  
  // PC Login Timing States
  const [pcMobileAuthorized, setPcMobileAuthorized] = useState(false);
  const [pcAuthTimestamp, setPcAuthTimestamp] = useState<string | null>(null);
  const [pcSecondsLeft, setPcSecondsLeft] = useState(0); // 18 minutes countdown = 1080 seconds
  const countdownIntervalRef = useRef<any>(null);

  // Clean interval on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Countdown timer for PC Login
  useEffect(() => {
    if (pcSecondsLeft > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setPcSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [pcSecondsLeft]);

  // Distance helper (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // meters
  };

  // Perform GPS Location Check
  const verifyLocationGPS = () => {
    setGpsLoading(true);
    setGpsError('');
    setGpsDistance(null);

    if (!navigator.geolocation) {
      setGpsError('Browser does not support Geolocation (ब्राउज़र जियोलोकेशन का समर्थन नहीं करता है)');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const dist = calculateDistance(latitude, longitude, OFFICE_LAT, OFFICE_LON);
        setGpsDistance(Math.round(dist));

        // Let's allow within 150 meters as matched
        if (dist <= 150) {
          if (deviceType === 'mobile') {
            setIsLocationMatched(true);
            setSuccess('✅ Geolocation matched! Mobile device authorized for Login (मोबाइल डिवाइस अधिकृत है।)');
          } else {
            // PC path
            setPcMobileAuthorized(true);
            const authTime = new Date().toISOString();
            setPcAuthTimestamp(authTime);
            setPcSecondsLeft(18 * 60); // 18 minutes wait
            setSuccess('✅ Geolocation matched! Mobile verification saved. Starting 18-minute PC Login countdown (18 मिनट का काउंटडाउन शुरू)।');
          }
        } else {
          setGpsError(`You are ${Math.round(dist)} meters away from the office coordinates. Must be within 150 meters. (आप ऑफिस से ${Math.round(dist)} मीटर दूर हैं। लॉग इन करने के लिए ऑफिस के दायरे में होना आवश्यक है।)`);
        }
        setGpsLoading(false);
      },
      (error) => {
        let msg = 'Error fetching location (लोकेशन प्राप्त करने में त्रुटि)';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Geolocation access denied. Please grant permission or use the Simulating option. (लोकेशन अनुमति अस्वीकार कर दी गई है। कृपया सिम्युलेटर विकल्प का उपयोग करें।)';
        }
        setGpsError(msg);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Simulate/Force Location match for Testing/Iframes
  const simulateLocationMatch = () => {
    setGpsError('');
    setGpsDistance(0);
    
    if (deviceType === 'mobile') {
      setIsLocationMatched(true);
      setSuccess('✅ Location Matched via Simulator! Mobile device is now authorized (लॉगिन स्वीकृत है)।');
    } else {
      setPcMobileAuthorized(true);
      const authTime = new Date().toISOString();
      setPcAuthTimestamp(authTime);
      setPcSecondsLeft(18 * 60); // 18 minutes
      setSuccess('✅ Mobile verification simulated successfully! Starting 18-minute PC Login countdown.');
    }
  };

  // Fast-Forward the PC wait timer (testing tool)
  const fastForwardPcTimer = () => {
    setPcSecondsLeft(0);
    setSuccess('✅ Wait period skipped! You can now log in securely via PC (पीसी से लॉग इन करें)।');
  };

  // Request Login GPS Authority from Main Admin
  const handleRequestLoginAuthority = async () => {
    if (!name.trim()) {
      setError('कृपया पहले लॉगिन फ़ील्ड में अपना पंजीकृत नाम दर्ज करें (Please enter your registered Name in the username field below first).');
      return;
    }
    setGpsLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/auth/request-login-authority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          deviceType: 'mobile',
          distance: gpsDistance || 0,
          reason: gpsError || 'Location mismatched or denied on phone login'
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message);
      } else {
        setError(data.error || 'Request failed');
      }
    } catch (err) {
      setError('अनुमति अनुरोध भेजने में विफलता (Failed to send authority request)');
    } finally {
      setGpsLoading(false);
    }
  };

  // Recoveries submissions
  const handleStaffRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError('कृपया अपना पंजीकृत यूजरनेम दर्ज करें (Please enter your registered username).');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/request-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      setSuccess(data.message || 'अनुरोध सफलतापूर्वक भेज दिया गया है!');
    } catch (err: any) {
      setError(err.message || 'रिकवरी अनुरोध भेजने में त्रुटि हुई।');
    } finally {
      setLoading(false);
    }
  };

  const handleMainAdminRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError('नाम और पंजीकृत ईमेल दोनों दर्ज करें (Please enter both your name and registered email).');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/main-admin-recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      setSuccess(data.message || 'पासवर्ड आपके व्हाट्सएप और ईमेल पर भेज दिया गया है!');
    } catch (err: any) {
      setError(err.message || 'मुख्य एडमिन रिकवरी में त्रुटि हुई।');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // If recovery, run recovery instead
    if (activeTab === 'recovery') {
      if (recoveryType === 'staff') {
        return handleStaffRecoverySubmit(e);
      } else {
        return handleMainAdminRecoverySubmit(e);
      }
    }

    if (!name || !password) {
      setError('Name and password are required');
      return;
    }

    if (activeTab === 'staff_signin' && !companyName) {
      setError('Company name is required for staff members');
      return;
    }

    // 1. Verify Location Requirement (Main Admin u-admin is exempted from GPS checks as per rules)
    const isMainAdminLogging = activeTab === 'admin_signin';
    if (!isMainAdminLogging) {
      if (deviceType === 'pc') {
        // "verify GPS is not applicable for PC user" -> PC users bypass GPS checks completely!
        // But PC users are subject to the 18-minute security countdown sequence.
        if (!pcMobileAuthorized) {
          setPcMobileAuthorized(true);
          setPcSecondsLeft(18 * 60); // 18 minutes Wait
          const authTime = new Date().toISOString();
          setPcAuthTimestamp(authTime);
          setError('सुरक्षा ब्लॉक: पीसी लॉगिन के लिए 18 मिनट की सुरक्षा प्रतीक्षा आवश्यक है। टाइमर शुरू हो गया है। (Security Wait: 18-minute countdown initialized for PC. Please wait or use test fast-forward below.)');
          return;
        }
        if (pcSecondsLeft > 0) {
          setError(`सुरक्षा ब्लॉक: पीसी सुरक्षा मंजूरी के लिए 18 मिनट की प्रतीक्षा आवश्यक है। शेष समय: ${Math.floor(pcSecondsLeft / 60)}m ${pcSecondsLeft % 60}s (PC Security Wait: 18-minute wait required.)`);
          return;
        }
      } else if (deviceType === 'mobile') {
        // If location is matched, proceed. Otherwise, check for Main Admin login authority.
        if (!isLocationMatched) {
          setLoading(true);
          try {
            const authRes = await fetch(`/api/auth/check-login-authority?name=${encodeURIComponent(name.trim())}`);
            const authData = await authRes.json();
            if (!authRes.ok || !authData.approved) {
              setError('मिसमैच: लॉग इन केवल ऑफिस लोकेशन (GPS) पर ही संभव है। यदि आप ऑफिस से बाहर हैं, तो एडमिन से लॉगिन अनुमति का अनुरोध करें और उसके बाद लॉगिन बटन दबाएं। (Error: Login is only allowed at office coordinates. If you are outside, please request login authority from Main Admin first, and once approved, click Login.)');
              setLoading(false);
              return;
            } else {
              setSuccess('✅ लॉगिन अनुमति एडमिन द्वारा स्वीकृत है! (Login authority approved by Main Admin!)');
            }
          } catch (err) {
            setError('लोकेशन अनुमति जांच में असमर्थ (Unable to verify login authority from server).');
            setLoading(false);
            return;
          }
        }
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Check role permissions based on signin tab
      const loggedUser = data.user;
      if (activeTab === 'admin_signin' && loggedUser.role !== 'admin') {
        throw new Error('This tab is reserved exclusively for the Main Admin.');
      }
      if (activeTab === 'staff_signin' && loggedUser.role === 'admin') {
        throw new Error('Main Admin must use the "Main Admin" tab to log in.');
      }

      // If PC login is used, inject the active login timestamp
      if (deviceType === 'pc' && pcAuthTimestamp) {
        loggedUser.pcLoginAuthorizedAt = pcAuthTimestamp;
      }

      onLoginSuccess(loggedUser);
    } catch (err: any) {
      setError(err.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: 'staff_signin' | 'admin_signin') => {
    setActiveTab(tab);
    setError('');
    setSuccess('');
    // Clear GPS states on tab change
    setIsLocationMatched(false);
    setPcMobileAuthorized(false);
    setPcSecondsLeft(0);
    setGpsError('');
    setGpsDistance(null);
    setName('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-[#090b11] text-gray-100 flex flex-col justify-center items-center p-4 font-sans selection:bg-orange-500 selection:text-white">
      {/* Brand Logo & Header */}
      <div className="flex flex-col items-center mb-6 text-center bg-white px-8 py-5 rounded-3xl shadow-xl border border-gray-100 max-w-sm w-full">
        <div className="flex items-center gap-3 bg-gradient-to-br from-orange-500 to-amber-500 p-3.5 rounded-2xl shadow-lg shadow-orange-500/20 mb-3">
          <Shield className="w-7 h-7 text-white fill-white" />
        </div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-0">
          <span className="text-[#f97316]">Hub</span>
          <span className="text-black">Sphere</span>
        </h1>
        <p className="text-[10px] font-black text-gray-400 uppercase mt-1.5 tracking-widest">
          Integrated ERP Environment
        </p>
      </div>

      {/* Main Login Panel */}
      <div className="w-full max-w-md bg-[#131924] border border-[#1e2635] rounded-2xl shadow-2xl p-6 relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500"></div>

        {/* Live Testing Expiry Countdown and Status Indicator */}
        {testingPeriod && testingPeriod.isActive && (
          <div className="mb-5 p-3.5 rounded-xl text-center border text-xs font-extrabold tracking-wide bg-orange-500/10 border-orange-500/20 text-orange-400">
            {testingPeriod.isExpired ? (
              <div className="space-y-1 text-red-400">
                <span>⚠️ TESTING PERIOD EXPIRED (टेस्टिंग अवधि समाप्त हो गई है)</span>
                <span className="block text-[10px] text-gray-400 font-bold uppercase mt-0.5">Expired on: {testingPeriod.expiryDate}</span>
              </div>
            ) : (
              <div className="space-y-1">
                <span>⚡ TESTING MODE: {testingPeriod.remainingDays} DAYS REMAINING (दिन शेष)</span>
                <span className="block text-[10px] text-gray-400 font-bold uppercase mt-0.5">Expires on: {testingPeriod.expiryDate}</span>
              </div>
            )}
          </div>
        )}

        {/* Device Selection Toggle (Mobile vs PC) */}
        {activeTab !== 'recovery' && activeTab !== 'admin_signin' && (
          <div className="flex bg-[#0d111a] p-1 rounded-xl border border-[#1d2433] mb-6">
            <button
              type="button"
              onClick={() => {
                setDeviceType('mobile');
                setIsLocationMatched(false);
                setPcMobileAuthorized(false);
                setPcSecondsLeft(0);
                setError('');
                setSuccess('');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-xs transition cursor-pointer ${
                deviceType === 'mobile'
                  ? 'bg-[#f97316] text-white shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Smartphone className="w-4 h-4" /> Mobile Phone (स्मार्टफोन)
            </button>
            <button
              type="button"
              onClick={() => {
                setDeviceType('pc');
                setIsLocationMatched(false);
                setPcMobileAuthorized(false);
                setPcSecondsLeft(0);
                setError('');
                setSuccess('');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-xs transition cursor-pointer ${
                deviceType === 'pc'
                  ? 'bg-[#f97316] text-white shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Laptop className="w-4 h-4" /> Desktop / PC (कंप्यूटर)
            </button>
          </div>
        )}

        {/* Form Selection Tabs */}
        {activeTab !== 'recovery' ? (
          <div className="flex border-b border-[#1f2635] mb-6">
            <button
              id="tab-staff-btn"
              type="button"
              onClick={() => handleTabChange('staff_signin')}
              className={`flex-1 pb-3 text-center font-bold text-xs tracking-wide transition-all duration-200 border-b-2 ${
                activeTab === 'staff_signin'
                  ? 'border-[#f97316] text-[#f97316]'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              Sign In <span className="block text-[9px] font-medium opacity-80">(Sub Admin, Head, Staff)</span>
            </button>
            <button
              id="tab-admin-btn"
              type="button"
              onClick={() => handleTabChange('admin_signin')}
              className={`flex-1 pb-3 text-center font-bold text-xs tracking-wide transition-all duration-200 border-b-2 ${
                activeTab === 'admin_signin'
                  ? 'border-[#f97316] text-[#f97316]'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              Sign In <span className="block text-[9px] font-medium opacity-80">(Main Admin)</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 border-b border-[#1f2635] pb-3 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('staff_signin');
                setError('');
                setSuccess('');
              }}
              className="text-xs font-bold text-[#f97316] hover:underline"
            >
              ← Back to Sign In (लॉग इन पर जाएं)
            </button>
            <span className="text-gray-400 text-xs font-semibold ml-auto">
              Password Recovery (पासवर्ड पुनः प्राप्ति)
            </span>
          </div>
        )}

        {/* Display Error / Success Notifications */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl p-3.5 mb-4 font-medium flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl p-3.5 mb-4 font-medium whitespace-pre-line">
            {success}
          </div>
        )}

        {/* GPS Verification Widget (Only shown for non-Main Admin, non-recovery screens) */}
        {activeTab !== 'recovery' && activeTab !== 'admin_signin' && (
          <div className="mb-6 p-4 rounded-xl bg-[#0d111a] border border-[#1d2433] space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#1d2433] pb-2">
              <span className="text-xs font-bold text-[#f97316] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4.5 h-4.5" /> GPS Location Check (जीपीएस सत्यापन)
              </span>
              <span className="text-[9px] bg-orange-500/15 border border-orange-500/35 text-[#f97316] px-2 py-0.5 rounded-full font-bold uppercase">
                Required
              </span>
            </div>

            <p className="text-[10px] text-gray-400 leading-relaxed">
              {deviceType === 'mobile'
                ? "लॉग इन केवल ऑफिस लोकेशन (GPS) पर ही संभव है। कृपया अपना लोकेशन सत्यापित करें।"
                : "पीसी उपयोगकर्ताओं के लिए जीपीएस सत्यापन लागू नहीं है। आप सीधे लॉग इन कर सकते हैं।"}
            </p>

            {gpsError && (
              <div className="text-[10px] text-red-400 bg-red-950/20 border border-red-500/20 rounded-lg p-2 font-semibold">
                ⚠️ {gpsError}
              </div>
            )}

            {/* GPS Interaction Controls */}
            <div className="flex flex-col gap-2">
              {deviceType === 'mobile' ? (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    disabled={gpsLoading}
                    onClick={verifyLocationGPS}
                    className="w-full bg-[#f97316] hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {gpsLoading ? (
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    ) : (
                      <Compass className="w-4.5 h-4.5 animate-pulse" />
                    )}
                    Verify GPS (लोकेशन जांचें)
                  </button>
                  
                  {/* Option to request login authority if not matched */}
                  {(!isLocationMatched || gpsError) && (
                    <button
                      type="button"
                      disabled={gpsLoading}
                      onClick={handleRequestLoginAuthority}
                      className="w-full bg-[#f97316] hover:bg-orange-600 text-white border border-orange-500 font-bold text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-lg cursor-pointer"
                    >
                      Request Login Authority from Admin (एडमिन से लॉगिन अनुमति का अनुरोध करें)
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-500/25 rounded-lg p-3 text-center font-bold">
                    ✅ PC GPS Exemption: GPS verification is not applicable for PC users. You have a full bypass!
                  </div>
                  {!pcMobileAuthorized ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPcMobileAuthorized(true);
                        setPcSecondsLeft(18 * 60);
                        const authTime = new Date().toISOString();
                        setPcAuthTimestamp(authTime);
                        setSuccess('✅ PC security countdown initialized! Please wait 18 minutes or use the test-utility fast-forward below.');
                      }}
                      className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-bold text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      Initialize 18-min PC Security Countdown
                    </button>
                  ) : (
                    <div className="text-[10px] text-blue-400 bg-blue-950/20 border border-blue-500/20 rounded-lg p-2 text-center font-bold">
                      ℹ️ PC Security countdown is active. Login will unlock when timer completes.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PC Countdown Panel */}
        {activeTab !== 'recovery' && activeTab !== 'admin_signin' && deviceType === 'pc' && pcMobileAuthorized && (
          <div className="bg-[#10141f] border border-blue-500/20 rounded-xl p-3 space-y-2.5 text-center mb-6">
            <div className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Loader2 className="w-4.5 h-4.5 animate-spin text-[#f97316]" />
              <span>PC TIMING SECURITY ACTIVATED</span>
            </div>
            
            {pcSecondsLeft > 0 ? (
              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-300">
                  Please wait 18 minutes for PC security clearance:
                </p>
                <p className="text-xl font-black font-mono text-white tracking-widest">
                  {Math.floor(pcSecondsLeft / 60).toString().padStart(2, '0')}:
                  {(pcSecondsLeft % 60).toString().padStart(2, '0')}
                </p>
                <button
                  type="button"
                  onClick={fastForwardPcTimer}
                  className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-black text-[9px] py-1.5 rounded-lg transition uppercase tracking-wider"
                >
                  ⚡ Fast-Forward 18 min for Testing
                </button>
              </div>
            ) : (
              <div className="p-1 text-center">
                <span className="text-xs font-bold text-emerald-400">
                  ✅ 18-Minute wait clearance verified! PC login unlocked.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Authentication Forms */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recovery Type Toggle (Only shown in recovery tab) */}
          {activeTab === 'recovery' && (
            <div className="bg-[#1a202c] p-1.5 rounded-xl border border-[#2d3748] flex gap-1 mb-4">
              <button
                type="button"
                onClick={() => {
                  setRecoveryType('staff');
                  setError('');
                  setSuccess('');
                }}
                className={`flex-1 text-center py-2 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                  recoveryType === 'staff'
                    ? 'bg-[#f97316] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                👤 Staff Recovery (स्टाफ सदस्य)
              </button>
              <button
                type="button"
                onClick={() => {
                  setRecoveryType('main_admin');
                  setError('');
                  setSuccess('');
                }}
                className={`flex-1 text-center py-2 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                  recoveryType === 'main_admin'
                    ? 'bg-[#f97316] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                👑 Main Admin Recovery (मुख्य एडमिन)
              </button>
            </div>
          )}

          {/* Company Name (only shown for staff sign-in) */}
          {activeTab === 'staff_signin' && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                Company Name (कंपनी का नाम) *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. HubSphere"
                className="w-full bg-[#0e121a] border border-[#222b3c] focus:border-[#f97316] rounded-xl px-4 py-2.5 text-sm text-gray-100 outline-none placeholder:text-gray-600 transition-all duration-250"
              />
            </div>
          )}

          {/* Name Field */}
          {(activeTab === 'staff_signin' || activeTab === 'admin_signin' || activeTab === 'recovery') && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-gray-500" />
                {activeTab === 'recovery' && recoveryType === 'main_admin' 
                  ? 'Main Admin Name (मुख्य एडमिन का नाम)' 
                  : 'Your Name / Username (आपका नाम / यूजरनेम) *'}
              </label>
              <input
                id="name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Suresh Gupta"
                className="w-full bg-[#0e121a] border border-[#222b3c] focus:border-[#f97316] rounded-xl px-4 py-2.5 text-sm text-gray-100 outline-none placeholder:text-gray-600 transition-all duration-250"
              />
            </div>
          )}

          {/* Email Field (Only shown in main admin recovery mode) */}
          {activeTab === 'recovery' && recoveryType === 'main_admin' && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-gray-500" />
                Email Address (पंजीकृत ईमेल पता) *
              </label>
              <input
                id="email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@company.com"
                className="w-full bg-[#0e121a] border border-[#222b3c] focus:border-[#f97316] rounded-xl px-4 py-2.5 text-sm text-gray-100 outline-none placeholder:text-gray-600 transition-all duration-250"
              />
            </div>
          )}

          {/* Password Field (shown in standard signin tabs) */}
          {activeTab !== 'recovery' && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Password (पासवर्ड) *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('recovery');
                    setRecoveryType(activeTab === 'admin_signin' ? 'main_admin' : 'staff');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-xs text-[#f97316] hover:underline font-medium cursor-pointer"
                >
                  Forgot password? (पासवर्ड भूल गए?)
                </button>
              </div>
              <input
                id="password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0e121a] border border-[#222b3c] focus:border-[#f97316] rounded-xl px-4 py-2.5 text-sm text-gray-100 outline-none placeholder:text-gray-600 transition-all duration-250"
              />
            </div>
          )}



          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-orange-500/10 hover:shadow-orange-500/25 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 text-xs cursor-pointer uppercase tracking-wider"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : activeTab === 'staff_signin' ? (
              'Sign In to Workspace'
            ) : activeTab === 'admin_signin' ? (
              'Log In as Main Admin'
            ) : recoveryType === 'staff' ? (
              'Send Request to Main Admin'
            ) : (
              'Send Password to WhatsApp'
            )}
          </button>
        </form>

        {/* EMERGENCY RESET MAIN ADMIN TO DEFAULTS */}
        {activeTab === 'recovery' && recoveryType === 'main_admin' && (
          <div className="mt-4 pt-4 border-t border-[#1f2635] text-left">
            <button
              type="button"
              onClick={() => {
                setShowResetDefaultsConsole(!showResetDefaultsConsole);
                setResetMessage('');
              }}
              className="w-full bg-[#f97316] hover:bg-orange-600 border border-orange-500 text-white rounded-xl px-4 py-2.5 text-xs font-bold flex items-center justify-between transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#f97316] animate-pulse" />
                🚨 Forgot Custom Admin Login? Reset to Defaults (डिफ़ॉल्ट पर रीसेट करें)
              </span>
              <span className="text-gray-500 font-mono text-[10px] uppercase">
                {showResetDefaultsConsole ? 'Hide' : 'Open'}
              </span>
            </button>

            {showResetDefaultsConsole && (
              <form onSubmit={handleResetDefaults} className="mt-3 bg-[#0d111a] border border-[#1f2635] rounded-xl p-4.5 space-y-4 animate-fadeIn">
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-gray-300 flex items-center gap-1.5 uppercase">
                    <Database className="w-3.5 h-3.5 text-orange-500" />
                    Reset Admin back to Admin/admin
                  </h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    If you forgot your custom username & password, verify the Main Admin's recovery security answer below to reset back to default <span className="text-gray-300 font-bold font-mono">Admin / admin</span>.
                  </p>
                </div>

                {/* Operator Name */}
                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 font-bold uppercase">
                    Who is attempting this reset? (आपका नाम) *
                  </label>
                  <input
                    type="text"
                    required
                    value={resetOperatorName}
                    onChange={(e) => setResetOperatorName(e.target.value)}
                    placeholder="e.g. Laxmi Kant"
                    className="w-full bg-[#111622] border border-[#1f2635] focus:border-[#f97316] rounded-lg py-1.5 px-2.5 text-xs text-white outline-none placeholder:text-gray-600 transition"
                  />
                </div>

                {/* Security Answer */}
                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 font-bold uppercase">
                    Security Answer (सुरक्षा प्रश्न का गुप्त उत्तर) *
                  </label>
                  <input
                    type="password"
                    required
                    value={resetSecurityAnswer}
                    onChange={(e) => setResetSecurityAnswer(e.target.value)}
                    placeholder="Enter secret answer..."
                    className="w-full bg-[#111622] border border-[#1f2635] focus:border-[#f97316] rounded-lg py-1.5 px-2.5 text-xs text-white outline-none placeholder:text-gray-600 transition"
                  />
                </div>

                {resetMessage && (
                  <div className={`p-2.5 rounded-lg border text-[10px] font-bold leading-relaxed ${
                    resetMessage.startsWith('❌') 
                      ? 'bg-red-500/5 border-red-500/15 text-red-400' 
                      : 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400'
                  }`}>
                    {resetMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isResetting}
                  className="w-full bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 hover:border-red-500/40 text-[#f97316] font-extrabold py-2.5 px-3 rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 uppercase tracking-wide"
                >
                  {isResetting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Shield className="w-3.5 h-3.5 text-[#f97316] animate-pulse" />
                  )}
                  ⚡ Confirm & Reset to Defaults
                </button>
              </form>
            )}
          </div>
        )}
        
        {/* CRASH RECOVERY & SYSTEM BACKUPS FOR MAIN ADMIN */}
        {activeTab === 'admin_signin' && (
          <div className="mt-4 pt-4 border-t border-[#1f2635] text-left">
            <button
              type="button"
              onClick={() => setShowBackupConsole(!showBackupConsole)}
              className="w-full bg-[#f97316] hover:bg-orange-600 border border-orange-500 text-white rounded-xl px-4 py-2.5 text-xs font-bold flex items-center justify-between transition-all"
            >
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#f97316] animate-pulse" />
                🛠️ System Crash Recovery & Backups (सिस्टम रिकवरी)
              </span>
              <span className="text-gray-500 font-mono text-[10px] uppercase">
                {showBackupConsole ? 'Hide' : 'Manage'}
              </span>
            </button>

            {showBackupConsole && (
              <div className="mt-3 bg-[#0d111a] border border-[#1f2635] rounded-xl p-4.5 space-y-4 animate-fadeIn">
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-gray-300 flex items-center gap-1.5 uppercase">
                    <Terminal className="w-3.5 h-3.5 text-orange-400" />
                    Secure Backup Operations
                  </h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Verify the main admin credentials above first, then fulfill the Emergency Authentication below to unlock recovery options.
                  </p>
                </div>

                {/* Operator Audit & Security Question Verification at the Top */}
                <div className="bg-[#080b11] border border-[#1f2635] p-3.5 rounded-xl space-y-3.5 text-left">
                  <span className="text-[10px] font-extrabold tracking-widest text-[#f97316] block uppercase flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#f97316] animate-pulse" />
                    🔒 Emergency Authentication (सुरक्षा सत्यापन)
                  </span>
                  
                  {/* Operator Name Field */}
                  <div className="space-y-1">
                    <label className="block text-[10px] text-gray-400 font-bold uppercase">
                      Who is attempting this recovery? (आपका नाम दर्ज करें) *
                    </label>
                    <input
                      type="text"
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      placeholder="e.g. Laxmi Kant, Kumar, etc."
                      className="w-full bg-[#111622] border border-[#1f2635] focus:border-orange-500 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none placeholder:text-gray-600 transition"
                    />
                  </div>

                  {/* Security Question Input */}
                  <div className="space-y-1 bg-[#111622]/50 p-2.5 border border-[#1a212f] rounded-lg">
                    <span className="block text-[9px] text-[#f97316] font-extrabold uppercase tracking-wider">
                      Security Question (मुख्य एडमिन द्वारा सेट प्रश्न):
                    </span>
                    <p className="text-xs text-gray-300 font-semibold italic">
                      "{recoveryQuestion}"
                    </p>
                    
                    <div className="mt-2 space-y-1">
                      <label className="block text-[10px] text-gray-400 font-bold uppercase">
                        Answer (उत्तर दर्ज करें) *
                      </label>
                      <input
                        type="text"
                        value={securityAnswerInput}
                        onChange={(e) => setSecurityAnswerInput(e.target.value)}
                        placeholder="Enter secret security answer..."
                        className="w-full bg-[#0d111a] border border-[#1f2635] focus:border-orange-500 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none placeholder:text-gray-600 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Verification Action Button */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleVerifyRecovery}
                    disabled={isVerifying}
                    className="w-full bg-[#f97316] hover:bg-orange-600 disabled:opacity-50 text-white font-extrabold text-[11px] py-2.5 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase shadow-md shadow-orange-500/5"
                  >
                    {isVerifying ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Shield className="w-3.5 h-3.5 text-white animate-pulse" />
                    )}
                    🔒 Verify Credentials & Unlock Portal (सत्यापित करें)
                  </button>

                  {verificationError && (
                    <div className={`p-2.5 rounded-lg border text-[10px] font-bold leading-relaxed ${
                      verificationError.startsWith('❌') 
                        ? 'bg-red-500/5 border-red-500/15 text-red-400' 
                        : 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400'
                    }`}>
                      {verificationError}
                    </div>
                  )}
                </div>

                {/* Unlock Status Warning banner */}
                {!isRecoveryUnlocked ? (
                  <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-xl text-left">
                    <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-wider block mb-1">
                      🚨 EMERGENCY PORTAL LOCKED
                    </span>
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                      Please enter the Main Admin Username & Password in the forms above, and provide your Name & Security Answer above, then click "Verify Credentials & Unlock Portal".
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl text-left">
                    <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block mb-0.5">
                      🔓 SECURITY VERIFICATION COMPLETE
                    </span>
                    <p className="text-[9px] text-gray-400 leading-normal">
                      Credentials and verification fields matched successfully. All backup recovery operations are unlocked.
                    </p>
                  </div>
                )}

                {/* Export Button */}
                <div>
                  <button
                    type="button"
                    onClick={handleExportFullBackup}
                    disabled={isExporting || !isRecoveryUnlocked}
                    className="w-full bg-orange-600/10 hover:bg-orange-600/20 border border-orange-500/20 hover:border-orange-500/40 text-[#f97316] disabled:text-gray-600 disabled:border-transparent disabled:bg-gray-900 font-bold py-2.5 px-3 rounded-lg text-[11px] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 uppercase tracking-wide"
                  >
                    {isExporting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    📥 Export Complete Database (Download to PC) {!isRecoveryUnlocked && '🔒'}
                  </button>
                </div>

                <div className="border-t border-[#1a212f] my-3"></div>

                {/* Import / Restore Section */}
                <div className="space-y-3">
                  <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5 text-[#f97316]" />
                    Paste or Upload Backup Data
                  </label>
                  
                  {/* File Upload Trigger */}
                  <div className={`relative group ${!isRecoveryUnlocked ? 'opacity-40 cursor-not-allowed' : ''}`}>
                    <input
                      type="file"
                      accept=".json"
                      disabled={!isRecoveryUnlocked}
                      onChange={handleBackupFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-not-allowed z-10 disabled:pointer-events-none"
                    />
                    <div className="bg-[#111622] border border-[#1f2635] group-hover:border-[#2a354c] rounded-lg py-2.5 px-3 text-center transition-all">
                      <p className="text-[10px] font-semibold text-gray-400">
                        📁 Choose `.json` backup file from PC {!isRecoveryUnlocked && '🔒'}
                      </p>
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-gray-600 font-bold uppercase">— OR —</div>

                  <textarea
                    value={backupJson}
                    disabled={!isRecoveryUnlocked}
                    onChange={(e) => {
                      setBackupJson(e.target.value);
                      if (backupMessage) setBackupMessage('');
                    }}
                    placeholder={isRecoveryUnlocked 
                      ? "Paste the full database JSON object here (from auto-backup email logs or offline backups)..."
                      : "🔒 PORTAL LOCKED: Enter Admin credentials and Security verification above to paste..."
                    }
                    className="w-full h-24 bg-[#080b11] border border-[#1f2635] focus:border-orange-500 rounded-lg p-2.5 text-[10px] font-mono text-gray-300 outline-none placeholder:text-gray-600 transition disabled:opacity-40"
                  />

                  {backupMessage && (
                    <div className={`p-2.5 rounded-lg border text-[10px] font-bold leading-relaxed ${
                      backupMessage.startsWith('❌') 
                        ? 'bg-red-500/5 border-red-500/15 text-red-400' 
                        : backupMessage.includes('🎉') || backupMessage.startsWith('✅')
                          ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400'
                          : 'bg-orange-500/5 border-orange-500/15 text-orange-400'
                    }`}>
                      {backupMessage}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRestoreFullBackup()}
                    disabled={isRestoring || !backupJson.trim() || !isRecoveryUnlocked}
                    className="w-full bg-[#f97316] hover:bg-orange-600 disabled:bg-gray-800 disabled:border-transparent disabled:text-gray-500 text-white font-black py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/5 active:scale-[0.99] transition-all cursor-pointer uppercase tracking-wider"
                  >
                    {isRestoring ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileJson className="w-4 h-4" />
                    )}
                    ⚡ Restore & Configure System Data {!isRecoveryUnlocked && '🔒'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Informative Tip */}
        <div className="mt-6 pt-4 border-t border-[#1f2635] text-center">
          <p className="text-[10px] text-gray-500">
            {activeTab === 'staff_signin' 
              ? 'Sign In tab for Sub-Admin, Department Heads, and General Staff. Location authorization required.' 
              : activeTab === 'admin_signin'
                ? 'Main Admin login panel. Exempted from company GPS location and timing restrictions.'
                : recoveryType === 'staff'
                  ? 'पासवर्ड भूल जाने पर अपना नाम डालकर मुख्य एडमिन को रिकवरी रिक्वेस्ट भेजें।'
                  : 'मुख्य एडमिन पासवर्ड भूल जाने पर व्हाट्सएप और पंजीकृत ईमेल पर तुरंत पासवर्ड पुनः प्राप्त कर सकते हैं।'}
          </p>
        </div>
      </div>
    </div>
  );
}
