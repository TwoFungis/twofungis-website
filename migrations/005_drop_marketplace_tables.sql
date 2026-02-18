-- TradeOS Strategic Pivot: Marketplace Cleanup Migration
-- Run this in Supabase SQL Editor AFTER backing up data if needed
-- This removes all marketplace-related tables and functions

-- 1. Drop RLS policies first (must be dropped before tables)
DROP POLICY IF EXISTS "Anyone can view open jobs" ON marketplace_jobs;
DROP POLICY IF EXISTS "Users can manage own jobs" ON marketplace_jobs;
DROP POLICY IF EXISTS "Anyone can view active services" ON contractor_services;
DROP POLICY IF EXISTS "Users can manage own services" ON contractor_services;
DROP POLICY IF EXISTS "Users can view own connections" ON contractor_connections;
DROP POLICY IF EXISTS "Users can create connections" ON contractor_connections;
DROP POLICY IF EXISTS "Users can respond to connections" ON contractor_connections;
DROP POLICY IF EXISTS "Contractors can view own inquiries" ON contractor_inquiries;
DROP POLICY IF EXISTS "Anyone can submit inquiry" ON contractor_inquiries;
DROP POLICY IF EXISTS "Contractors can update own inquiries" ON contractor_inquiries;

-- Drop policies on contractor_profiles_public
DROP POLICY IF EXISTS "Anyone can view verified profiles" ON contractor_profiles_public;
DROP POLICY IF EXISTS "Users can manage own profile" ON contractor_profiles_public;

-- Drop policies on contractor_verification
DROP POLICY IF EXISTS "Users can view own verification" ON contractor_verification;
DROP POLICY IF EXISTS "Users can manage own verification" ON contractor_verification;

-- 2. Drop indexes
DROP INDEX IF EXISTS idx_marketplace_jobs_user_id;
DROP INDEX IF EXISTS idx_marketplace_jobs_status;
DROP INDEX IF EXISTS idx_marketplace_jobs_trade;
DROP INDEX IF EXISTS idx_contractor_services_user_id;
DROP INDEX IF EXISTS idx_contractor_services_active;
DROP INDEX IF EXISTS idx_contractor_connections_from;
DROP INDEX IF EXISTS idx_contractor_connections_to;
DROP INDEX IF EXISTS idx_contractor_inquiries_contractor;

-- 3. Drop marketplace tables
DROP TABLE IF EXISTS contractor_inquiries CASCADE;
DROP TABLE IF EXISTS contractor_connections CASCADE;
DROP TABLE IF EXISTS contractor_services CASCADE;
DROP TABLE IF EXISTS marketplace_jobs CASCADE;
DROP TABLE IF EXISTS contractor_verification CASCADE;
DROP TABLE IF EXISTS contractor_profiles_public CASCADE;

-- 4. Remove marketplace-related columns from users_profile if they exist
-- (Keep basic profile columns for internal billing purposes)
ALTER TABLE users_profile 
DROP COLUMN IF EXISTS marketplace_enabled CASCADE,
DROP COLUMN IF EXISTS marketplace_verified CASCADE,
DROP COLUMN IF EXISTS marketplace_verified_at CASCADE,
DROP COLUMN IF EXISTS marketplace_bio CASCADE,
DROP COLUMN IF EXISTS marketplace_rating CASCADE,
DROP COLUMN IF EXISTS marketplace_reviews_count CASCADE;

SELECT 'Marketplace cleanup complete! Tables dropped successfully.' as status;
