-- Migration to add proper unit and owner management

-- Create units table
CREATE TABLE units (
  id BIGSERIAL PRIMARY KEY,
  building_id BIGINT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  floor INTEGER,
  unit_type TEXT NOT NULL CHECK (unit_type IN ('apartment', 'commercial', 'garage', 'storage', 'other')),
  surface_area DOUBLE PRECISION, -- in square meters
  millieme DOUBLE PRECISION NOT NULL, -- ownership fraction in thousandths
  description TEXT,
  balcony_area DOUBLE PRECISION,
  garage_included BOOLEAN NOT NULL DEFAULT FALSE,
  storage_included BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(building_id, unit_number) -- Unique unit number per building
);

-- Create ownership table (handles multiple owners per unit and ownership history)
CREATE TABLE ownerships (
  id BIGSERIAL PRIMARY KEY,
  unit_id BIGINT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ownership_percentage DOUBLE PRECISION NOT NULL DEFAULT 100.0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  purchase_price DOUBLE PRECISION,
  notary_reference TEXT,
  is_primary_residence BOOLEAN NOT NULL DEFAULT TRUE,
  is_rental_property BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CHECK (ownership_percentage > 0 AND ownership_percentage <= 100),
  CHECK (end_date IS NULL OR end_date > start_date)
);

-- Create tenants table for rental properties
CREATE TABLE tenants (
  id BIGSERIAL PRIMARY KEY,
  unit_id BIGINT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  lease_start_date DATE NOT NULL,
  lease_end_date DATE,
  monthly_rent DOUBLE PRECISION,
  deposit_amount DOUBLE PRECISION,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CHECK (lease_end_date IS NULL OR lease_end_date > lease_start_date)
);

-- Create charges table for managing building charges and fees
CREATE TABLE charges (
  id BIGSERIAL PRIMARY KEY,
  building_id BIGINT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  unit_id BIGINT REFERENCES units(id) ON DELETE CASCADE, -- NULL for building-wide charges
  charge_type TEXT NOT NULL CHECK (charge_type IN ('common_charges', 'heating', 'water', 'insurance', 'maintenance', 'special_assessment', 'other')),
  description TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'paid', 'overdue', 'cancelled')) DEFAULT 'pending',
  payment_date DATE,
  created_by BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CHECK (billing_period_end > billing_period_start),
  CHECK (amount >= 0)
);

-- Update building_access table to reference units properly
DROP TABLE building_access;
CREATE TABLE unit_access (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_id BIGINT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL CHECK (access_type IN ('owner', 'tenant', 'emergency_contact', 'authorized_person')),
  granted_by BIGINT REFERENCES users(id), -- Who granted the access
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, unit_id, access_type),
  CHECK (end_date IS NULL OR end_date > start_date)
);

-- Create view for current unit owners (active ownerships)
CREATE VIEW current_unit_owners AS
SELECT 
  u.id as unit_id,
  u.building_id,
  u.unit_number,
  u.unit_type,
  u.surface_area,
  u.millieme,
  usr.id as owner_id,
  usr.first_name,
  usr.last_name,
  usr.email,
  usr.phone,
  o.ownership_percentage,
  o.start_date,
  o.is_primary_residence,
  o.is_rental_property
FROM units u
JOIN ownerships o ON u.id = o.unit_id
JOIN users usr ON o.owner_id = usr.id
WHERE o.active = TRUE 
  AND (o.end_date IS NULL OR o.end_date > CURRENT_DATE);

-- Create view for current tenants
CREATE VIEW current_tenants AS
SELECT 
  u.id as unit_id,
  u.building_id,
  u.unit_number,
  t.id as tenant_id,
  t.first_name,
  t.last_name,
  t.email,
  t.phone,
  t.lease_start_date,
  t.lease_end_date,
  t.monthly_rent,
  t.active
FROM units u
JOIN tenants t ON u.id = t.unit_id
WHERE t.active = TRUE 
  AND (t.lease_end_date IS NULL OR t.lease_end_date > CURRENT_DATE);

-- Indexes for performance
CREATE INDEX idx_units_building_id ON units(building_id);
CREATE INDEX idx_units_building_unit_number ON units(building_id, unit_number);
CREATE INDEX idx_ownerships_unit_id ON ownerships(unit_id);
CREATE INDEX idx_ownerships_owner_id ON ownerships(owner_id);
CREATE INDEX idx_ownerships_active ON ownerships(active);
CREATE INDEX idx_tenants_unit_id ON tenants(unit_id);
CREATE INDEX idx_tenants_active ON tenants(active);
CREATE INDEX idx_charges_building_id ON charges(building_id);
CREATE INDEX idx_charges_unit_id ON charges(unit_id);
CREATE INDEX idx_charges_status ON charges(status);
CREATE INDEX idx_charges_due_date ON charges(due_date);
CREATE INDEX idx_unit_access_user_id ON unit_access(user_id);
CREATE INDEX idx_unit_access_unit_id ON unit_access(unit_id);

-- Comments for clarity
COMMENT ON TABLE units IS 'Individual units within buildings (apartments, commercial spaces, etc.)';
COMMENT ON TABLE ownerships IS 'Ownership records for units, supporting multiple owners and ownership history';
COMMENT ON TABLE tenants IS 'Tenant information for rental properties';
COMMENT ON TABLE charges IS 'Building charges and fees for units or common areas';
COMMENT ON TABLE unit_access IS 'Access permissions for units (owners, tenants, authorized persons)';
COMMENT ON COLUMN units.millieme IS 'Ownership fraction in thousandths (used for charge calculations)';
COMMENT ON COLUMN ownerships.ownership_percentage IS 'Percentage of unit owned by this owner';
COMMENT ON VIEW current_unit_owners IS 'Active unit owners with their ownership details';
COMMENT ON VIEW current_tenants IS 'Active tenants with their lease details';