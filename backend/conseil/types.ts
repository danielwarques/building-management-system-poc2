export interface ConseilMember {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'president' | 'member' | 'secretary' | 'treasurer';
  electedAt: Date;
  termEndDate?: Date;
  active: boolean;
}

export interface ConseilCopropriete {
  id: number;
  buildingId: number;
  buildingName: string;
  presidentId?: number;
  president?: ConseilMember;
  members: ConseilMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConseilRequest {
  buildingId: number;
  presidentId?: number;
  members: Array<{
    userId: number;
    role: 'president' | 'member' | 'secretary' | 'treasurer';
    termEndDate?: Date;
  }>;
}

export interface AddMemberRequest {
  conseilId: number;
  userId: number;
  role: 'president' | 'member' | 'secretary' | 'treasurer';
  termEndDate?: Date;
}

export interface UpdateMemberRequest {
  memberId: number;
  role?: 'president' | 'member' | 'secretary' | 'treasurer';
  termEndDate?: Date;
  active?: boolean;
}

export interface SupervisionRequest {
  buildingId: number;
  supervisionType: 'budget_review' | 'contract_review' | 'performance_review' | 'audit';
  description: string;
}

export interface Supervision {
  id: number;
  buildingId: number;
  conseilId: number;
  supervisionType: 'budget_review' | 'contract_review' | 'performance_review' | 'audit';
  description: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  reviewedBy?: number;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}