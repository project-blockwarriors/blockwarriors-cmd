-- Rename the existing users table to temporary table
ALTER TABLE IF EXISTS "public"."users" RENAME TO users_old;

-- Create new users table with desired structure
CREATE TABLE IF NOT EXISTS "public"."users" (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    institution TEXT,
    geographic_location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Copy data from old table to new table, splitting user_name into first_name and last_name
INSERT INTO "public"."users" (
    user_id, 
    first_name, 
    last_name, 
    email, 
    institution, 
    geographic_location,
    created_at
)
SELECT 
    user_id,
    SPLIT_PART(user_name, ' ', 1) as first_name,
    CASE 
        WHEN POSITION(' ' IN user_name) > 0 
        THEN SUBSTRING(user_name FROM POSITION(' ' IN user_name) + 1)
        ELSE ''
    END as last_name,
    email,
    institution,
    geographic_location,
    created_at
FROM "public"."users_old";

-- Drop the old table
DROP TABLE IF EXISTS "public"."users_old";