# Echoes Payment Webhook Configuration Guide

This guide details how to deploy and configure the Supabase Edge Function to handle payments from **Afdian (爱发电)**.

## 1. Prerequisites
- **Supabase CLI** installed (`npm install -g supabase`).
- **Afdian Account** with a Creator Page.
- **Supabase Project** created.

## 2. Webhook Logic Overview
The `afdian-webhook` function processes incoming payment notifications:
- **< ¥5.00**: Treated as **Donation**. Records transaction but does not grant Pro status.
- **>= ¥5.00**: Grants **Monthly Pro** membership.
- **>= ¥48.00**: Grants **Yearly Pro** membership.

The system relies on the user providing their **Echoes User ID (UUID)** in the payment remark/message.

## 3. Deployment Steps

### Step A: Login to Supabase CLI
Open your terminal and run:
```bash
npx supabase login
```
Follow the browser prompt to authenticate.

### Step B: Link Your Project
Link your local project to your remote Supabase project:
```bash
npx supabase link --project-ref <YOUR_PROJECT_REF>
```
*Find your Project Reference in Supabase Dashboard > Settings > General.*

### Step C: Deploy the Function
Deploy the `afdian-webhook` function to the edge:
```bash
npx supabase functions deploy afdian-webhook --no-verify-jwt
```
*Note: We use `--no-verify-jwt` because Afdian's webhook request does not include a Supabase JWT. We verify the request using a shared secret token instead.*

## 4. Configuration (Environment Variables)

Go to **Supabase Dashboard > Edge Functions > afdian-webhook > Secrets** and add the following:

| Key | Value | Description |
| :--- | :--- | :--- |
| `AFDIAN_WEBHOOK_SECRET` | `your_secure_token` | A random string you generate (e.g., `echoes_secret_888`). MUST match the token used in Step 5. |
| `SUPABASE_URL` | `https://xyz.supabase.co` | Your project URL (usually auto-populated). |
| `SUPABASE_SERVICE_ROLE_KEY` | `ey...` | Your Service Role Key (usually auto-populated). Required to update user profiles. |

## 5. Set Up Afdian Webhook

1. Log in to **Afdian**.
2. Go to **Developer Settings** (or Webhook configuration page).
3. Set the **Webhook URL** to:
   ```
   https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/afdian-webhook?token=your_secure_token
   ```
   *Replace `your_secure_token` with the `AFDIAN_WEBHOOK_SECRET` you set in Step 4.*
4. Enable events for **Order Success** (订单成交).

## 6. Verification

### Test with Script
You can verify the deployment using the local test script:
```bash
# Update the script to point to your remote URL first!
# Edit scripts/test-afdian.js:
# const WEBHOOK_URL = 'https://<YOUR_REF>.supabase.co/functions/v1/afdian-webhook';

node scripts/test-afdian.js <YOUR_USER_UUID>
```

### Check Logs
In Supabase Dashboard > Edge Functions > afdian-webhook > Logs, you should see:
- `Incoming Webhook Request`
- `Token check: Provided=..., Expected=...`
- `Success: User upgraded to Pro ...`
