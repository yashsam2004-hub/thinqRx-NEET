-- Allow 'pending' subscription status for Razorpay-created subscriptions before activation.

alter table public.subscriptions
  drop constraint if exists subscriptions_status_check;

alter table public.subscriptions
  add constraint subscriptions_status_check
  check (status in ('pending','active','past_due','canceled','expired'));


