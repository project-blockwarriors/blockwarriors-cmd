-- Drop existing table and related objects
DROP TABLE IF EXISTS public.users CASCADE;
-- Create new users table
CREATE TABLE public.users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    institution TEXT,
    geographic_location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Create trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.users (
        user_id,
        first_name,
        last_name,
        email
    ) VALUES (
        new.id,
        COALESCE(split_part(jsonb_extract_path_text(new.raw_user_meta_data, 'full_name'), ' ', 1), NULL),
        COALESCE(split_part(jsonb_extract_path_text(new.raw_user_meta_data, 'full_name'), ' ', 2), NULL),
        new.email
    );
    RETURN new;
END;
$$;
-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
