export interface Owner {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ownership {
  id: number;
  unitId: number;
  ownerId: number;
  ownershipPercentage: number;
  startDate: Date;
  endDate?: Date;
  purchasePrice?: number;
  notaryReference?: string;
  isPrimaryResidence: boolean;
  isRentalProperty: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UnitOwner {
  unitId: number;
  buildingId: number;
  unitNumber: string;
  unitType: string;
  surfaceArea?: number;
  millieme: number;
  ownerId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  ownershipPercentage: number;
  startDate: Date;
  isPrimaryResidence: boolean;
  isRentalProperty: boolean;
}

export interface CreateOwnershipRequest {
  unitId: number;
  ownerId: number;
  ownershipPercentage?: number;
  startDate?: Date;
  endDate?: Date;
  purchasePrice?: number;
  notaryReference?: string;
  isPrimaryResidence?: boolean;
  isRentalProperty?: boolean;
}

export interface UpdateOwnershipRequest {
  ownershipPercentage?: number;
  endDate?: Date;
  purchasePrice?: number;
  notaryReference?: string;
  isPrimaryResidence?: boolean;
  isRentalProperty?: boolean;
}