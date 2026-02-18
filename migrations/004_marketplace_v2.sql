-- TradeOS Marketplace V2 Migration
-- Run this in Supabase SQL Editor

-- 1. Marketplace Job Posts Table
CREATE TABLE IF NOT EXISTS marketplace_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    trade_required TEXT NOT NULL,
    location TEXT NOT NULL,
    budget_min DECIMAL(12,2),
    budget_max DECIMAL(12,2),
    timeline TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Contractor Services Table
CREATE TABLE IF NOT EXISTS contractor_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    trade_category TEXT NOT NULL,
    price_type TEXT DEFAULT 'quote' CHECK (price_type IN ('quote', 'fixed', 'hourly')),
    price_amount DECIMAL(12,2),
    service_areas TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Contractor Connections Table (Networking)
CREATE TABLE IF NOT EXISTS contractor_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    UNIQUE(from_user_id, to_user_id)
);

-- 4. Contractor Inquiries Table (Contact Form)
CREATE TABLE IF NOT EXISTS contractor_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    project_type TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'responded', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Add new columns to contractor_profiles_public if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles_public' AND column_name = 'website_url') THEN
        ALTER TABLE contractor_profiles_public ADD COLUMN website_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles_public' AND column_name = 'phone_public') THEN
        ALTER TABLE contractor_profiles_public ADD COLUMN phone_public TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles_public' AND column_name = 'email_public') THEN
        ALTER TABLE contractor_profiles_public ADD COLUMN email_public TEXT;
    END IF;
END $$;

-- 6. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_marketplace_jobs_user_id ON marketplace_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_jobs_status ON marketplace_jobs(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_jobs_trade ON marketplace_jobs(trade_required);
CREATE INDEX IF NOT EXISTS idx_contractor_services_user_id ON contractor_services(user_id);
CREATE INDEX IF NOT EXISTS idx_contractor_services_active ON contractor_services(is_active);
CREATE INDEX IF NOT EXISTS idx_contractor_connections_from ON contractor_connections(from_user_id);
CREATE INDEX IF NOT EXISTS idx_contractor_connections_to ON contractor_connections(to_user_id);
CREATE INDEX IF NOT EXISTS idx_contractor_inquiries_contractor ON contractor_inquiries(contractor_id);

-- 7. Enable Row Level Security
ALTER TABLE marketplace_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_inquiries ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for marketplace_jobs
-- Public can read open jobs
CREATE POLICY "Anyone can view open jobs" ON marketplace_jobs
    FOR SELECT USING (status = 'open');

-- Owner can do everything with their jobs
CREATE POLICY "Users can manage own jobs" ON marketplace_jobs
    FOR ALL USING (auth.uid() = user_id);

-- 9. RLS Policies for contractor_services
-- Public can read active services
CREATE POLICY "Anyone can view active services" ON contractor_services
    FOR SELECT USING (is_active = true);

-- Owner can do everything with their services
CREATE POLICY "Users can manage own services" ON contractor_services
    FOR ALL USING (auth.uid() = user_id);

-- 10. RLS Policies for contractor_connections
-- Users can view their own connections
CREATE POLICY "Users can view own connections" ON contractor_connections
    FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Users can create connections from themselves
CREATE POLICY "Users can create connections" ON contractor_connections
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Users can update connections to themselves
CREATE POLICY "Users can respond to connections" ON contractor_connections
    FOR UPDATE USING (auth.uid() = to_user_id);

-- 11. RLS Policies for contractor_inquiries
-- Contractors can view inquiries sent to them
CREATE POLICY "Contractors can view own inquiries" ON contractor_inquiries
    FOR SELECT USING (auth.uid() = contractor_id);

-- Anyone can submit an inquiry (public form)
CREATE POLICY "Anyone can submit inquiry" ON contractor_inquiries
    FOR INSERT WITH CHECK (true);

-- Contractors can update their inquiries
CREATE POLICY "Contractors can update own inquiries" ON contractor_inquiries
    FOR UPDATE USING (auth.uid() = contractor_id);

-- Grant access to service role
GRANT ALL ON marketplace_jobs TO service_role;
GRANT ALL ON contractor_services TO service_role;
GRANT ALL ON contractor_connections TO service_role;
GRANT ALL ON contractor_inquiries TO service_role;

-- Grant select to anon for public queries
GRANT SELECT ON marketplace_jobs TO anon;
GRANT SELECT ON contractor_services TO anon;
GRANT INSERT ON contractor_inquiries TO anon;

SELECT 'Marketplace V2 migration complete!' as status;
