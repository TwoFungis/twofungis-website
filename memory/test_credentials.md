# Test Credentials

## TradeOS Command Center Owners

### Scott Marshall (Primary Owner)
- **Email:** inbox@twofungis.ca
- **Password:** TradeOS2024!
- **Subscription Tier:** founding_lifetime
- **Organization:** Two Fungis Finishing
- **Role:** Owner
- **Post-Login:** Redirects to `/app/command-center`

### Beau (Second Owner)
- **Email:** carpenterbeau@hotmail.com
- **Password:** TradeOS2024!
- **Subscription Tier:** N/A (access via organization membership)
- **Organization:** Two Fungis Finishing
- **Role:** Owner
- **Post-Login:** Redirects to `/app/command-center`

## Legacy Founder Account
- **Email:** info@twofungis.ca
- **Password:** Marshall!31
- **Subscription Tier:** founding_lifetime
- **Organization:** None
- **Post-Login:** Redirects to `/app/dashboard`

## Authorization Architecture (July 12, 2026)
- Authorization uses `organization_members` and `platform_admins` tables
- Legacy `tfcs_user_roles` table is deprecated but still checked as fallback
- `/api/workspace/context` endpoint determines post-login routing
- Organization members redirect to `/app/command-center`
- Users without organization redirect to `/app/dashboard`

## Notes
- Both Owners have full access to Company Brain, User Management, Financial, System Settings
- Password changes are private (no activity logging, no notifications)
- Use Settings > Change Password to update passwords
