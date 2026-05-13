export type Role = 'READ' | 'FULL';
export type ContentStatus = 'DRAFT' | 'PUBLISHED';

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface OrganizationDTO {
  id: string;
  name: string;
  createdAt: string;
}

export interface TeamDTO {
  id: string;
  name: string;
  organizationId: string;
  createdAt: string;
}

export interface UserOrganizationDTO {
  userId: string;
  organizationId: string;
  role: Role;
  user?: UserDTO;
  organization?: OrganizationDTO;
}

export interface TeamMemberDTO {
  userId: string;
  teamId: string;
  user?: UserDTO;
}

export interface ContentDTO {
  id: string;
  title: string;
  body: string;
  status: ContentStatus;
  assignedToId: string;
  assignedTo?: UserDTO;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserDTO;
  accessToken: string;
}

export interface AuthMeResponse {
  user: UserDTO;
  membership: UserOrganizationDTO | null;
}

export interface CreateOrgRequest { name: string; }
export interface UpdateOrgRequest { name: string; }

export interface CreateTeamRequest { name: string; }
export interface UpdateTeamRequest { name: string; }

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
}
export interface UpdateUserRequest {
  email?: string;
  name?: string;
  password?: string;
}

export interface AddMemberRequest { userId: string; role: Role; }
export interface UpdateMemberRequest { role: Role; }

export interface CreateContentRequest {
  title: string;
  body: string;
  status?: ContentStatus;
  assignedToId: string;
}
export interface UpdateContentRequest {
  title?: string;
  body?: string;
  status?: ContentStatus;
  assignedToId?: string;
}

export interface ApiError {
  error: string;
  code: string;
}
