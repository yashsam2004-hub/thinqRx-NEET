# Admin Plans Management Guide

## Overview

The admin plans panel at `/admin/plans` allows you to fully configure pricing plans without touching code. All changes appear immediately on the pricing page, upgrade page, and throughout the app.

## Accessing the Plans Panel

1. Navigate to `/admin/plans`
2. You'll see all active and inactive plans
3. Plans are sorted by display order

## Plan Display Order

Plans appear on the pricing page in order of their `display_order` value:

- **1** = Hero plan (highlighted, shown first)
- **2-4** = Secondary plans
- **5+** = De-emphasized plans

Lower numbers = higher priority.

## Editing a Plan

Click the "Edit" button on any plan card to open the editor.

### Basic Settings

#### Plan Name
- Displays on pricing cards and throughout the app
- Example: "GPAT Last Minute Pack"

#### Description
- Short tagline shown under the plan name
- Example: "High-yield revision for GPAT exam preparation"

#### Price (₹)
- Plan cost in Indian Rupees
- Set to `0` for free plans

#### Validity (days)
- Number of days the plan remains active
- Examples:
  - `31` = 1 month
  - `60` = 2 months
  - `365` = 1 year
  - `9999` = Lifetime

#### Display Order
- Controls where plan appears on pricing page
- Lower numbers show first
- `1` = Hero plan with special highlighting

### Access Control Features

#### AI Notes Limit (per day)
- `-1` = Unlimited
- `0` = No access
- `N` = Daily limit (e.g., `50` = 50 notes per day)
- **Displays as**: "✨ Unlimited AI Notes" or "📝 50 AI Notes per day"

#### Practice Tests Limit (per day)
- `-1` = Unlimited
- `0` = No access
- `N` = Daily limit (e.g., `10` = 10 tests per day)
- **Displays as**: "✨ Unlimited Practice Tests" or "📚 10 Practice Tests per day"

#### Mock Tests Limit (per month)
- `-1` = Unlimited
- `0` = No access
- `N` = Monthly limit
- **Displays as**: "🎯 Unlimited Mock Tests" or "🎯 5 Mock Tests per month"

#### Mock Test Access (checkbox)
- Enable this for plans that can access mock tests
- If disabled, user cannot take mock tests regardless of limit
- **Displays as**: "🎯 Full Mock Test Access"

#### Premium Content Access (checkbox)
- Enable for plans that can access non-free topics
- All paid plans should have this enabled
- Free plan should have this disabled
- **Displays as**: "🔓 All Premium Topics"

#### Regenerate Notes (checkbox)
- Allow users to force regenerate AI notes
- Useful for pro/premium plans
- **Displays as**: "🔄 Regenerate AI Notes"

### Pricing Page Display Settings

#### Explanations Type
- **None**: No explanations shown in display
- **Partial**: Shows "💡 Partial Explanations"
- **Full**: Shows "💡 Full & Detailed Explanations"

#### Analytics Type
- **None**: No analytics shown in display
- **Basic**: Shows "📊 Basic Analytics"
- **Advanced**: Shows "📊 Advanced Analytics"

#### "Best For" Display Text
- Custom text explaining who this plan is for
- Example: "Students with 2-3 months left for GPAT"
- **Displays as**: "✅ Best for: [your text]"
- Shows at the bottom of feature list
- Leave blank to hide

#### Validity Display Text (optional)
- Override auto-generated validity text
- Leave blank to auto-generate from validity days
- Examples:
  - Auto-generated: "Valid for 60 days"
  - Custom: "Valid until GPAT 2027"

## Live Preview

The "Pricing Page Preview" section shows exactly how features will appear on the pricing page. Use this to see your changes before saving.

## Access Summary

The "Quick Access Summary" shows all feature settings at a glance:
- AI Notes, Practice Tests, Mock Tests limits
- Premium access, Explanations, Analytics types
- Regenerate notes capability
- "Best For" text

## Saving Changes

1. Make your edits
2. Click "Save Changes"
3. Changes appear **immediately** on:
   - Pricing page (`/pricing`)
   - Upgrade page (`/upgrade`)
   - Access control throughout app
4. Cache is auto-cleared on save

## Activating/Deactivating Plans

- **Activate**: Makes plan visible on pricing page
- **Deactivate**: Hides plan from pricing page (users with this plan keep access)

Use the eye icon button to toggle activation.

## Best Practices

### For Free Plan
```
AI Notes: 5/day
Practice Tests: 3/day
Mock Tests: Disabled
Premium Content: Disabled
Explanations: None or Partial
Analytics: None
```

### For Plus Plan
```
AI Notes: Unlimited
Practice Tests: Unlimited
Mock Tests: Disabled (special case: allows 2 tests)
Premium Content: Enabled
Explanations: Partial
Analytics: Basic
```

### For Pro Plan
```
AI Notes: Unlimited
Practice Tests: Unlimited
Mock Tests: Unlimited
Premium Content: Enabled
Explanations: Full
Analytics: Advanced
Regenerate: Enabled
```

### For Exam Packs (e.g., GPAT Last Minute)
```
AI Notes: Limited (e.g., 50/day)
Practice Tests: Limited (e.g., 10/day)
Mock Tests: Unlimited
Premium Content: Enabled
Explanations: Partial or Full
Analytics: Basic
Best For: "Students with 2-3 months left for GPAT"
```

## Common Questions

### How do I create a new plan?
Plans must be created via SQL in Supabase. Once created, they appear in the admin panel for editing.

### Do changes affect existing users?
- **Access changes**: Yes, immediately
- **Price changes**: No, existing subscriptions keep their original price
- **Validity changes**: No, existing subscriptions keep their original end date

### What happens if I deactivate a plan?
- Plan disappears from pricing page
- Existing users with that plan keep full access
- New purchases are blocked

### Can I delete a plan?
No, deactivate instead. Deleting breaks existing user subscriptions.

### How do I make a plan the "hero" plan?
Set its `display_order` to `1`.

## Troubleshooting

### Changes not showing on pricing page
1. Clear browser cache
2. Check that plan is marked as "Active"
3. Wait 5 minutes (cache TTL)
4. Try incognito/private browsing

### Features not displaying correctly
1. Check "Pricing Page Preview" in admin panel
2. Ensure all required fields are set
3. Verify feature limits are not `null` (use `0` or `-1`)

### User can't access content despite having paid plan
1. Check plan's "Premium Content Access" is enabled
2. Verify AI/Practice test limits are not `0`
3. Check plan status is "Active"
4. Verify validity hasn't expired

---

**Need Help?** Contact the development team or check the code documentation.
