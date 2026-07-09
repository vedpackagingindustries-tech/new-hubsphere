export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  role: 'admin' | 'sub-admin' | 'head' | 'staff' | 'telecaller';
  department?: 'Tech' | 'NonTech' | 'Sales';
  salaryBase: number;
  commissionRate: number; // commission per qualified lead or per task
  monthlyTarget?: number;
  status: 'active' | 'suspended';
  position?: string;
}

export interface LeadJourneyEvent {
  status: string;
  notes?: string;
  updatedBy: string;
  timestamp: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email: string;
  requirements: string;
  status: 'New' | 'Interested' | 'Spoke' | 'Not Interested' | 'Contacted' | 'Nurturing' | 'Closed Won' | 'Closed Lost';
  assignedTo: string | null; // User ID
  assignedName: string | null; // User Name
  assignedByAdminId?: string | null;
  assignedByAdminName?: string | null;
  assignedAt?: string | null;
  notes: string;
  lastCalled?: string;
  createdAt: string;
  journey?: LeadJourneyEvent[];
}

export interface CallLog {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  telecallerId: string;
  telecallerName: string;
  status: 'Interested' | 'Spoke' | 'Not Interested';
  duration: number; // in seconds
  timestamp: string;
  notes: string;
  hasRecording: boolean;
  recordingId?: string;
  adminFeedback?: string;
}

export interface SupportTicket {
  id: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  reply?: string;
  timestamp: string;
}

export interface AutoCallingConfig {
  delaySeconds: number;
  enabled: boolean;
}
