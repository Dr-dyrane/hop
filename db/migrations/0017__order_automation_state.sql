alter table app.payments
  add column if not exists last_customer_reminder_at timestamptz null,
  add column if not exists customer_reminder_count integer not null default 0;

alter table app.payments
  drop constraint if exists payments_customer_reminder_count_check;

alter table app.payments
  add constraint payments_customer_reminder_count_check
  check (customer_reminder_count >= 0);

alter table app.review_requests
  add column if not exists last_reminder_sent_at timestamptz null,
  add column if not exists reminder_count integer not null default 0;

alter table app.review_requests
  drop constraint if exists review_requests_reminder_count_check;

alter table app.review_requests
  add constraint review_requests_reminder_count_check
  check (reminder_count >= 0);
