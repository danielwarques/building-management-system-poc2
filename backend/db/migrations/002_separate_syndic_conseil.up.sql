-- Migration to separate syndic and conseil de copropriété according to Belgian legislation

-- Add new role for conseil members
ALTER TABLE users DROP CONSTRAINT users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'syndic', 'conseil_member', 'owner', 'supplier'));

-- Create conseil de copropriété table
CREATE TABLE conseil_copropriete (
  id BIGSERIAL PRIMARY KEY,
  building_id BIGINT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  president_id BIGINT REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(building_id) -- One conseil per building
);

-- Create conseil members table (association table)
CREATE TABLE conseil_members (
  id BIGSERIAL PRIMARY KEY,
  conseil_id BIGINT NOT NULL REFERENCES conseil_copropriete(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('president', 'member', 'secretary', 'treasurer')),
  elected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  term_end_date DATE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(conseil_id, user_id) -- A user can only be in one conseil per building
);

-- Update buildings table to clarify syndic relationship
ALTER TABLE buildings 
  ADD COLUMN syndic_type TEXT NOT NULL DEFAULT 'professional' 
  CHECK (syndic_type IN ('professional', 'voluntary')),
  ADD COLUMN syndic_company_name TEXT,
  ADD COLUMN syndic_license_number TEXT,
  ADD COLUMN syndic_contact_email TEXT,
  ADD COLUMN syndic_contact_phone TEXT,
  ADD COLUMN conseil_id BIGINT REFERENCES conseil_copropriete(id);

-- Create table for syndic supervision by conseil
CREATE TABLE syndic_supervisions (
  id BIGSERIAL PRIMARY KEY,
  building_id BIGINT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  conseil_id BIGINT NOT NULL REFERENCES conseil_copropriete(id) ON DELETE CASCADE,
  supervision_type TEXT NOT NULL CHECK (supervision_type IN ('budget_review', 'contract_review', 'performance_review', 'audit')),
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_review', 'approved', 'rejected')),
  reviewed_by BIGINT REFERENCES users(id),
  created_by BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create table for general assemblies and decisions
CREATE TABLE assemblies (
  id BIGSERIAL PRIMARY KEY,
  building_id BIGINT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ordinary', 'extraordinary')),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  agenda TEXT NOT NULL,
  minutes TEXT,
  convened_by TEXT NOT NULL CHECK (convened_by IN ('syndic', 'conseil', 'owners')),
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create table for assembly decisions
CREATE TABLE assembly_decisions (
  id BIGSERIAL PRIMARY KEY,
  assembly_id BIGINT NOT NULL REFERENCES assemblies(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  description TEXT NOT NULL,
  decision_type TEXT NOT NULL CHECK (decision_type IN ('budget_approval', 'works_authorization', 'syndic_appointment', 'conseil_election', 'rule_change')),
  votes_for INTEGER NOT NULL DEFAULT 0,
  votes_against INTEGER NOT NULL DEFAULT 0,
  votes_abstention INTEGER NOT NULL DEFAULT 0,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'postponed')),
  execution_deadline DATE,
  responsible_party TEXT CHECK (responsible_party IN ('syndic', 'conseil', 'owners')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_conseil_copropriete_building_id ON conseil_copropriete(building_id);
CREATE INDEX idx_conseil_members_conseil_id ON conseil_members(conseil_id);
CREATE INDEX idx_conseil_members_user_id ON conseil_members(user_id);
CREATE INDEX idx_syndic_supervisions_building_id ON syndic_supervisions(building_id);
CREATE INDEX idx_syndic_supervisions_conseil_id ON syndic_supervisions(conseil_id);
CREATE INDEX idx_assemblies_building_id ON assemblies(building_id);
CREATE INDEX idx_assembly_decisions_assembly_id ON assembly_decisions(assembly_id);

-- Comments for clarity
COMMENT ON TABLE conseil_copropriete IS 'Conseil de copropriété - supervisory body that monitors syndic performance';
COMMENT ON TABLE conseil_members IS 'Members of the conseil de copropriété with their roles';
COMMENT ON TABLE syndic_supervisions IS 'Actions taken by conseil to supervise syndic activities';
COMMENT ON TABLE assemblies IS 'General assemblies of co-owners';
COMMENT ON TABLE assembly_decisions IS 'Decisions made during general assemblies';
COMMENT ON COLUMN buildings.syndic_id IS 'Reference to syndic user (executive manager)';
COMMENT ON COLUMN buildings.conseil_id IS 'Reference to conseil de copropriété (supervisory body)';