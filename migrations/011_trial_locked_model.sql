-- MIGRATION: Trial + Locked Access Model
-- TradeOS - 30-day PRO trial with locked mode after expiry
-- Run in Supabase SQL Editor
-- =====================================================

DO $$ 
BEGIN
    -- Add trial tracking columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'trial_started_at') THEN
        ALTER TABLE users_profile ADD COLUMN trial_started_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'trial_ends_at') THEN
        ALTER TABLE users_profile ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add locked mode usage counters
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'locked_project_created') THEN
        ALTER TABLE users_profile ADD COLUMN locked_project_created BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'locked_quote_created') THEN
        ALTER TABLE users_profile ADD COLUMN locked_quote_created BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'locked_invoice_created') THEN
        ALTER TABLE users_profile ADD COLUMN locked_invoice_created BOOLEAN DEFAULT false;
    END IF;
    
    -- Add AI usage counter for locked mode (resets daily)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'ai_messages_today') THEN
        ALTER TABLE users_profile ADD COLUMN ai_messages_today INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'ai_messages_date') THEN
        ALTER TABLE users_profile ADD COLUMN ai_messages_date DATE;
    END IF;
END $$;

-- Set trial dates for existing users who don't have them
-- (Give them 30 days from now as a grace period)
UPDATE users_profile 
SET 
    trial_started_at = COALESCE(trial_started_at, created_at, NOW()),
    trial_ends_at = COALESCE(trial_ends_at, created_at + INTERVAL '30 days', NOW() + INTERVAL '30 days')
WHERE trial_started_at IS NULL OR trial_ends_at IS NULL;

-- Update the handle_new_user function to set trial dates on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users_profile (
        user_id, 
        email, 
        subscription_tier,
        trial_started_at,
        trial_ends_at,
        onboarding_completed
    )
    VALUES (
        NEW.id, 
        NEW.email, 
        'trial',
        NOW(),
        NOW() + INTERVAL '30 days',
        false
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users_profile' 
AND column_name IN (
    'trial_started_at', 
    'trial_ends_at', 
    'locked_project_created', 
    'locked_quote_created', 
    'locked_invoice_created',
    'ai_messages_today',
    'ai_messages_date'
)
ORDER BY column_name;
