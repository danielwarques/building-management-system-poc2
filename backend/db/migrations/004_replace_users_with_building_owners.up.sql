-- Migration to replace users table with building_owners table

-- First, create the new building_owners table
CREATE TABLE building_owners (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create syndics table for building management
CREATE TABLE syndics (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create administrators table for system administration
CREATE TABLE administrators (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Migrate existing data from users table
-- Migrate building owners (users with role 'owner')
INSERT INTO building_owners (email, password_hash, first_name, last_name, phone, active, created_at, updated_at)
SELECT email, password_hash, first_name, last_name, phone, active, created_at, updated_at
FROM users 
WHERE role = 'owner';

-- Migrate syndics (users with role 'syndic')
INSERT INTO syndics (email, password_hash, first_name, last_name, phone, active, created_at, updated_at)
SELECT email, password_hash, first_name, last_name, phone, active, created_at, updated_at
FROM users 
WHERE role = 'syndic';

-- Migrate administrators (users with role 'admin')
INSERT INTO administrators (email, password_hash, first_name, last_name, phone, active, created_at, updated_at)
SELECT email, password_hash, first_name, last_name, phone, active, created_at, updated_at
FROM users 
WHERE role = 'admin';

-- Update foreign key references
-- Add temporary columns to track the new IDs
ALTER TABLE ownerships ADD COLUMN new_owner_id BIGINT;
ALTER TABLE buildings ADD COLUMN new_syndic_id BIGINT;
ALTER TABLE issues ADD COLUMN new_reported_by_id BIGINT;
ALTER TABLE documents ADD COLUMN new_uploaded_by_id BIGINT;
ALTER TABLE messages ADD COLUMN new_sender_id BIGINT;
ALTER TABLE notifications ADD COLUMN new_user_id BIGINT;
ALTER TABLE unit_access ADD COLUMN new_user_id BIGINT;
ALTER TABLE unit_access ADD COLUMN new_granted_by_id BIGINT;
ALTER TABLE charges ADD COLUMN new_created_by_id BIGINT;
ALTER TABLE conseil_copropriete ADD COLUMN new_president_id BIGINT;
ALTER TABLE conseil_members ADD COLUMN new_user_id BIGINT;
ALTER TABLE syndic_supervisions ADD COLUMN new_reviewed_by_id BIGINT;
ALTER TABLE syndic_supervisions ADD COLUMN new_created_by_id BIGINT;

-- Update ownerships to reference building_owners
UPDATE ownerships 
SET new_owner_id = bo.id
FROM building_owners bo, users u
WHERE ownerships.owner_id = u.id 
  AND u.email = bo.email 
  AND u.role = 'owner';

-- Drop the view that depends on owner_id before modifying the column
DROP VIEW current_unit_owners;

-- Update buildings to reference syndics
UPDATE buildings 
SET new_syndic_id = s.id
FROM syndics s, users u
WHERE buildings.syndic_id = u.id 
  AND u.email = s.email 
  AND u.role = 'syndic';

-- Update issues reported_by to reference appropriate table based on user role
UPDATE issues 
SET new_reported_by_id = bo.id
FROM building_owners bo, users u
WHERE issues.reported_by = u.id 
  AND u.email = bo.email 
  AND u.role = 'owner';

-- Update documents uploaded_by to reference appropriate table
UPDATE documents 
SET new_uploaded_by_id = bo.id
FROM building_owners bo, users u
WHERE documents.uploaded_by = u.id 
  AND u.email = bo.email 
  AND u.role = 'owner';

UPDATE documents 
SET new_uploaded_by_id = s.id
FROM syndics s, users u
WHERE documents.uploaded_by = u.id 
  AND u.email = s.email 
  AND u.role = 'syndic';

UPDATE documents 
SET new_uploaded_by_id = a.id
FROM administrators a, users u
WHERE documents.uploaded_by = u.id 
  AND u.email = a.email 
  AND u.role = 'admin';

-- Update messages sender_id
UPDATE messages 
SET new_sender_id = bo.id
FROM building_owners bo, users u
WHERE messages.sender_id = u.id 
  AND u.email = bo.email 
  AND u.role = 'owner';

UPDATE messages 
SET new_sender_id = s.id
FROM syndics s, users u
WHERE messages.sender_id = u.id 
  AND u.email = s.email 
  AND u.role = 'syndic';

-- Update notifications user_id
UPDATE notifications 
SET new_user_id = bo.id
FROM building_owners bo, users u
WHERE notifications.user_id = u.id 
  AND u.email = bo.email 
  AND u.role = 'owner';

UPDATE notifications 
SET new_user_id = s.id
FROM syndics s, users u
WHERE notifications.user_id = u.id 
  AND u.email = s.email 
  AND u.role = 'syndic';

-- Update unit_access user_id
UPDATE unit_access 
SET new_user_id = bo.id
FROM building_owners bo, users u
WHERE unit_access.user_id = u.id 
  AND u.email = bo.email 
  AND u.role = 'owner';

-- Update unit_access granted_by
UPDATE unit_access 
SET new_granted_by_id = bo.id
FROM building_owners bo, users u
WHERE unit_access.granted_by = u.id 
  AND u.email = bo.email 
  AND u.role = 'owner';

UPDATE unit_access 
SET new_granted_by_id = s.id
FROM syndics s, users u
WHERE unit_access.granted_by = u.id 
  AND u.email = s.email 
  AND u.role = 'syndic';

UPDATE unit_access 
SET new_granted_by_id = a.id
FROM administrators a, users u
WHERE unit_access.granted_by = u.id 
  AND u.email = a.email 
  AND u.role = 'admin';

-- Update charges created_by
UPDATE charges 
SET new_created_by_id = s.id
FROM syndics s, users u
WHERE charges.created_by = u.id 
  AND u.email = s.email 
  AND u.role = 'syndic';

UPDATE charges 
SET new_created_by_id = a.id
FROM administrators a, users u
WHERE charges.created_by = u.id 
  AND u.email = a.email 
  AND u.role = 'admin';

-- Update conseil_copropriete president_id
UPDATE conseil_copropriete 
SET new_president_id = bo.id
FROM building_owners bo, users u
WHERE conseil_copropriete.president_id = u.id 
  AND u.email = bo.email 
  AND u.role = 'owner';

-- Update conseil_members user_id
UPDATE conseil_members 
SET new_user_id = bo.id
FROM building_owners bo, users u
WHERE conseil_members.user_id = u.id 
  AND u.email = bo.email 
  AND u.role = 'owner';

-- Update syndic_supervisions reviewed_by
UPDATE syndic_supervisions 
SET new_reviewed_by_id = bo.id
FROM building_owners bo, users u
WHERE syndic_supervisions.reviewed_by = u.id 
  AND u.email = bo.email 
  AND u.role = 'owner';

UPDATE syndic_supervisions 
SET new_reviewed_by_id = s.id
FROM syndics s, users u
WHERE syndic_supervisions.reviewed_by = u.id 
  AND u.email = s.email 
  AND u.role = 'syndic';

-- Update syndic_supervisions created_by
UPDATE syndic_supervisions 
SET new_created_by_id = bo.id
FROM building_owners bo, users u
WHERE syndic_supervisions.created_by = u.id 
  AND u.email = bo.email 
  AND u.role = 'owner';

UPDATE syndic_supervisions 
SET new_created_by_id = s.id
FROM syndics s, users u
WHERE syndic_supervisions.created_by = u.id 
  AND u.email = s.email 
  AND u.role = 'syndic';

-- Drop old foreign key constraints and columns
ALTER TABLE ownerships DROP CONSTRAINT ownerships_owner_id_fkey;
ALTER TABLE ownerships DROP COLUMN owner_id;
ALTER TABLE ownerships RENAME COLUMN new_owner_id TO owner_id;
ALTER TABLE ownerships ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE ownerships ADD CONSTRAINT ownerships_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES building_owners(id) ON DELETE CASCADE;

ALTER TABLE buildings DROP CONSTRAINT buildings_syndic_id_fkey;
ALTER TABLE buildings DROP COLUMN syndic_id;
ALTER TABLE buildings RENAME COLUMN new_syndic_id TO syndic_id;
ALTER TABLE buildings ADD CONSTRAINT buildings_syndic_id_fkey FOREIGN KEY (syndic_id) REFERENCES syndics(id);

ALTER TABLE issues DROP CONSTRAINT issues_reported_by_fkey;
ALTER TABLE issues DROP COLUMN reported_by;
ALTER TABLE issues RENAME COLUMN new_reported_by_id TO reported_by;
ALTER TABLE issues ALTER COLUMN reported_by SET NOT NULL;
ALTER TABLE issues ADD CONSTRAINT issues_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES building_owners(id);

-- For documents, we need to handle multiple reference types
ALTER TABLE documents DROP CONSTRAINT documents_uploaded_by_fkey;
ALTER TABLE documents DROP COLUMN uploaded_by;
ALTER TABLE documents RENAME COLUMN new_uploaded_by_id TO uploaded_by;
ALTER TABLE documents ALTER COLUMN uploaded_by SET NOT NULL;
-- Note: We'll handle the foreign key constraint in the application logic since it can reference multiple tables

-- For messages, similar approach
ALTER TABLE messages DROP CONSTRAINT messages_sender_id_fkey;
ALTER TABLE messages DROP COLUMN sender_id;
ALTER TABLE messages RENAME COLUMN new_sender_id TO sender_id;
ALTER TABLE messages ALTER COLUMN sender_id SET NOT NULL;
-- Note: We'll handle the foreign key constraint in the application logic

-- For notifications
ALTER TABLE notifications DROP CONSTRAINT notifications_user_id_fkey;
ALTER TABLE notifications DROP COLUMN user_id;
ALTER TABLE notifications RENAME COLUMN new_user_id TO user_id;
ALTER TABLE notifications ALTER COLUMN user_id SET NOT NULL;
-- Note: We'll handle the foreign key constraint in the application logic

-- For unit_access
ALTER TABLE unit_access DROP CONSTRAINT unit_access_user_id_fkey;
ALTER TABLE unit_access DROP CONSTRAINT unit_access_granted_by_fkey;
ALTER TABLE unit_access DROP COLUMN user_id;
ALTER TABLE unit_access DROP COLUMN granted_by;
ALTER TABLE unit_access RENAME COLUMN new_user_id TO user_id;
ALTER TABLE unit_access RENAME COLUMN new_granted_by_id TO granted_by;
ALTER TABLE unit_access ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE unit_access ADD CONSTRAINT unit_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES building_owners(id) ON DELETE CASCADE;
-- Note: We'll handle granted_by constraint in application logic since it can reference multiple tables

-- For charges
ALTER TABLE charges DROP CONSTRAINT charges_created_by_fkey;
ALTER TABLE charges DROP COLUMN created_by;
ALTER TABLE charges RENAME COLUMN new_created_by_id TO created_by;
ALTER TABLE charges ALTER COLUMN created_by SET NOT NULL;
-- Note: We'll handle the foreign key constraint in the application logic

-- For conseil_copropriete
ALTER TABLE conseil_copropriete DROP CONSTRAINT conseil_copropriete_president_id_fkey;
ALTER TABLE conseil_copropriete DROP COLUMN president_id;
ALTER TABLE conseil_copropriete RENAME COLUMN new_president_id TO president_id;
ALTER TABLE conseil_copropriete ADD CONSTRAINT conseil_copropriete_president_id_fkey FOREIGN KEY (president_id) REFERENCES building_owners(id);

-- For conseil_members
ALTER TABLE conseil_members DROP CONSTRAINT conseil_members_user_id_fkey;
ALTER TABLE conseil_members DROP COLUMN user_id;
ALTER TABLE conseil_members RENAME COLUMN new_user_id TO user_id;
ALTER TABLE conseil_members ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE conseil_members ADD CONSTRAINT conseil_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES building_owners(id) ON DELETE CASCADE;

-- For syndic_supervisions
ALTER TABLE syndic_supervisions DROP CONSTRAINT syndic_supervisions_reviewed_by_fkey;
ALTER TABLE syndic_supervisions DROP CONSTRAINT syndic_supervisions_created_by_fkey;
ALTER TABLE syndic_supervisions DROP COLUMN reviewed_by;
ALTER TABLE syndic_supervisions DROP COLUMN created_by;
ALTER TABLE syndic_supervisions RENAME COLUMN new_reviewed_by_id TO reviewed_by;
ALTER TABLE syndic_supervisions RENAME COLUMN new_created_by_id TO created_by;
ALTER TABLE syndic_supervisions ALTER COLUMN created_by SET NOT NULL;
-- Note: We'll handle foreign key constraints in application logic since they can reference multiple tables

-- Add user_type column to track which table the user belongs to for multi-table references
ALTER TABLE documents ADD COLUMN uploaded_by_type TEXT CHECK (uploaded_by_type IN ('building_owner', 'syndic', 'administrator'));
ALTER TABLE messages ADD COLUMN sender_type TEXT CHECK (sender_type IN ('building_owner', 'syndic', 'administrator'));
ALTER TABLE notifications ADD COLUMN user_type TEXT CHECK (user_type IN ('building_owner', 'syndic', 'administrator'));
ALTER TABLE charges ADD COLUMN created_by_type TEXT CHECK (created_by_type IN ('syndic', 'administrator'));
ALTER TABLE unit_access ADD COLUMN granted_by_type TEXT CHECK (granted_by_type IN ('building_owner', 'syndic', 'administrator'));
ALTER TABLE syndic_supervisions ADD COLUMN reviewed_by_type TEXT CHECK (reviewed_by_type IN ('building_owner', 'syndic', 'administrator'));
ALTER TABLE syndic_supervisions ADD COLUMN created_by_type TEXT CHECK (created_by_type IN ('building_owner', 'syndic', 'administrator'));

-- Update user_type based on the original user roles
UPDATE documents 
SET uploaded_by_type = 'building_owner'
FROM building_owners bo
WHERE documents.uploaded_by = bo.id;

UPDATE documents 
SET uploaded_by_type = 'syndic'
FROM syndics s
WHERE documents.uploaded_by = s.id;

UPDATE documents 
SET uploaded_by_type = 'administrator'
FROM administrators a
WHERE documents.uploaded_by = a.id;

UPDATE messages 
SET sender_type = 'building_owner'
FROM building_owners bo
WHERE messages.sender_id = bo.id;

UPDATE messages 
SET sender_type = 'syndic'
FROM syndics s
WHERE messages.sender_id = s.id;

UPDATE notifications 
SET user_type = 'building_owner'
FROM building_owners bo
WHERE notifications.user_id = bo.id;

UPDATE notifications 
SET user_type = 'syndic'
FROM syndics s
WHERE notifications.user_id = s.id;

UPDATE charges 
SET created_by_type = 'syndic'
FROM syndics s
WHERE charges.created_by = s.id;

UPDATE charges 
SET created_by_type = 'administrator'
FROM administrators a
WHERE charges.created_by = a.id;

-- Update unit_access granted_by_type
UPDATE unit_access 
SET granted_by_type = 'building_owner'
FROM building_owners bo
WHERE unit_access.granted_by = bo.id;

UPDATE unit_access 
SET granted_by_type = 'syndic'
FROM syndics s
WHERE unit_access.granted_by = s.id;

UPDATE unit_access 
SET granted_by_type = 'administrator'
FROM administrators a
WHERE unit_access.granted_by = a.id;

-- Update syndic_supervisions reviewed_by_type
UPDATE syndic_supervisions 
SET reviewed_by_type = 'building_owner'
FROM building_owners bo
WHERE syndic_supervisions.reviewed_by = bo.id;

UPDATE syndic_supervisions 
SET reviewed_by_type = 'syndic'
FROM syndics s
WHERE syndic_supervisions.reviewed_by = s.id;

-- Update syndic_supervisions created_by_type
UPDATE syndic_supervisions 
SET created_by_type = 'building_owner'
FROM building_owners bo
WHERE syndic_supervisions.created_by = bo.id;

UPDATE syndic_supervisions 
SET created_by_type = 'syndic'
FROM syndics s
WHERE syndic_supervisions.created_by = s.id;

-- Make the user_type columns NOT NULL
ALTER TABLE documents ALTER COLUMN uploaded_by_type SET NOT NULL;
ALTER TABLE messages ALTER COLUMN sender_type SET NOT NULL;
ALTER TABLE notifications ALTER COLUMN user_type SET NOT NULL;
ALTER TABLE charges ALTER COLUMN created_by_type SET NOT NULL;
ALTER TABLE unit_access ALTER COLUMN granted_by_type SET NOT NULL;
ALTER TABLE syndic_supervisions ALTER COLUMN reviewed_by_type SET NOT NULL;
ALTER TABLE syndic_supervisions ALTER COLUMN created_by_type SET NOT NULL;

-- Update the suppliers table to remove the user_id reference
-- Suppliers will now be standalone entities
ALTER TABLE suppliers DROP CONSTRAINT suppliers_user_id_fkey;
ALTER TABLE suppliers DROP COLUMN user_id;

-- Update the current_unit_owners view to use building_owners
-- Note: View was already dropped above
CREATE VIEW current_unit_owners AS
SELECT 
  u.id as unit_id,
  u.building_id,
  u.unit_number,
  u.unit_type,
  u.surface_area,
  u.millieme,
  bo.id as owner_id,
  bo.first_name,
  bo.last_name,
  bo.email,
  bo.phone,
  o.ownership_percentage,
  o.start_date,
  o.is_primary_residence,
  o.is_rental_property
FROM units u
JOIN ownerships o ON u.id = o.unit_id
JOIN building_owners bo ON o.owner_id = bo.id
WHERE o.active = TRUE 
  AND (o.end_date IS NULL OR o.end_date > CURRENT_DATE);

-- Drop the old users table
DROP TABLE users;

-- Create indexes for the new tables
CREATE INDEX idx_building_owners_email ON building_owners(email);
CREATE INDEX idx_building_owners_active ON building_owners(active);
CREATE INDEX idx_syndics_email ON syndics(email);
CREATE INDEX idx_syndics_active ON syndics(active);
CREATE INDEX idx_administrators_email ON administrators(email);
CREATE INDEX idx_administrators_active ON administrators(active);

-- Comments for clarity
COMMENT ON TABLE building_owners IS 'Building owners who own units in buildings';
COMMENT ON TABLE syndics IS 'Property managers who manage buildings';
COMMENT ON TABLE administrators IS 'System administrators with full access';