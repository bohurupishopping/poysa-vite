export interface BusinessProposal {
  id: string;
  profile_id: string;
  full_name: string;
  phone: string;
  email: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  company_name: string;
  business_type?: string;
  company_registration_number?: string;
  company_address?: string;
  company_description?: string;
  contact_person_name?: string;
  contact_person_position?: string;
  contact_email?: string;
  contact_phone?: string;
  is_gst_registered: boolean;
  gstin?: string;
  document_urls: string[];
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ProposalFormData {
  full_name: string;
  phone: string;
  email: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  company_name: string;
  is_gst_registered: boolean;
  gstin: string;
  documents: File[];
}

export interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}