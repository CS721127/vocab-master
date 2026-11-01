-- Supabase Schema for Vocab Master Web App

-- 1. Enable Row Level Security (RLS)
-- Create tables

-- Lists Table (Grouping vocabularies together)
CREATE TABLE lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Vocabularies Table
CREATE TABLE words (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
    term TEXT NOT NULL,
    definition TEXT NOT NULL,
    example TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Setup Row Level Security (RLS)
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;

-- Keep vocabulary private to signed-in users and their own rows.
REVOKE ALL ON TABLE lists, words FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE lists, words TO authenticated;

-- Lists Policies: Users can only see and modify their own lists
CREATE POLICY "Users can view their own lists" ON lists FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert their own lists" ON lists FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update their own lists" ON lists FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete their own lists" ON lists FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

-- Words Policies: Users can only see and modify their own words
CREATE POLICY "Users can view their own words" ON words FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert their own words" ON words FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id AND (list_id IS NULL OR EXISTS (SELECT 1 FROM lists WHERE lists.id = words.list_id AND lists.user_id = (select auth.uid()))));
CREATE POLICY "Users can update their own words" ON words FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id AND (list_id IS NULL OR EXISTS (SELECT 1 FROM lists WHERE lists.id = words.list_id AND lists.user_id = (select auth.uid()))));
CREATE POLICY "Users can delete their own words" ON words FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
