# ============================================
# IMPORTANT: Run this migration in pgAdmin
# ============================================
# 
# To enable MFA and use the new roles:
# 1. Open pgAdmin and connect to your database
# 2. Run the migration script: migration-employee-fields-and-roles.sql
# 3. Then uncomment the line below to enable MFA
#
# ============================================

# Enable MFA (uncomment after running migration)
# MFA_REQUIRED=true

# Current Status: MFA is DISABLED
# This allows you to test the system without MFA first
# Once you're ready, set MFA_REQUIRED=true above
