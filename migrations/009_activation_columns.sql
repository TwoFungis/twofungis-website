-- MIGRATION: Add activation flow columns to users_profile
-- TradeOS - Activate Your Business feature columns
-- Run this in Supabase SQL Editor
-- =====================================================

DO $$ 
BEGIN
    -- Add labor_rate column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'labor_rate') THEN
        ALTER TABLE users_profile ADD COLUMN labor_rate NUMERIC;
    END IF;
    
    -- Add business_activated column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'business_activated') THEN
        ALTER TABLE users_profile ADD COLUMN business_activated BOOLEAN DEFAULT false;
    END IF;
    
    -- Add business_activation_skipped column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'business_activation_skipped') THEN
        ALTER TABLE users_profile ADD COLUMN business_activation_skipped BOOLEAN DEFAULT false;
    END IF;
    
    -- Add default_payment_days column (for invoice settings)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'default_payment_days') THEN
        ALTER TABLE users_profile ADD COLUMN default_payment_days INTEGER DEFAULT 30;
    END IF;
    
    -- Add full_name column (alias for name)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'full_name') THEN
        ALTER TABLE users_profile ADD COLUMN full_name TEXT;
    END IF;
    
    -- Add trade column (alias for trade_type)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'trade') THEN
        ALTER TABLE users_profile ADD COLUMN trade TEXT;
    END IF;
    
    -- Add notifications columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'notifications_email') THEN
        ALTER TABLE users_profile ADD COLUMN notifications_email BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'notifications_co') THEN
        ALTER TABLE users_profile ADD COLUMN notifications_co BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'notifications_weekly') THEN
        ALTER TABLE users_profile ADD COLUMN notifications_weekly BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Verify columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users_profile' 
AND column_name IN ('labor_rate', 'business_activated', 'business_activation_skipped', 'default_payment_days', 'full_name', 'trade', 'notifications_email', 'notifications_co', 'notifications_weekly')
ORDER BY column_name;
