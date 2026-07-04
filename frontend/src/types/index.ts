export interface DocumentInfo {
  id: string;
  user_id: string;
  filename: string;
  status: string;
  created_at: string;
}

export interface Source {
  filename: string;
  content: string;
  chunk_index: number;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: Source[];
}

export interface UserInfo {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}