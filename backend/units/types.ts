export interface Unit {
  id: number;
  buildingId: number;
  unitNumber: string;
  floor?: number;
  unitType: 'apartment' | 'commercial' | 'garage' | 'storage' | 'other';
  surfaceArea?: number;
  millieme: number;
  description?: string;
  balconyArea?: number;
  garageIncluded: boolean;
  storageIncluded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUnitRequest {
  buildingId: number;
  unitNumber: string;
  floor?: number;
  unitType: 'apartment' | 'commercial' | 'garage' | 'storage' | 'other';
  surfaceArea?: number;
  millieme: number;
  description?: string;
  balconyArea?: number;
  garageIncluded?: boolean;
  storageIncluded?: boolean;
}

export interface UpdateUnitRequest {
  unitNumber?: string;
  floor?: number;
  unitType?: 'apartment' | 'commercial' | 'garage' | 'storage' | 'other';
  surfaceArea?: number;
  millieme?: number;
  description?: string;
  balconyArea?: number;
  garageIncluded?: boolean;
  storageIncluded?: boolean;
}

export interface UnitWithOwners {
  id: number;
  buildingId: number;
  unitNumber: string;
  floor?: number;
  unitType: string;
  surfaceArea?: number;
  millieme: number;
  description?: string;
  balconyArea?: number;
  garageIncluded: boolean;
  storageIncluded: boolean;
  createdAt: Date;
  updatedAt: Date;
  owners: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    ownershipPercentage: number;
    isPrimaryResidence: boolean;
    isRentalProperty: boolean;
  }[];
}