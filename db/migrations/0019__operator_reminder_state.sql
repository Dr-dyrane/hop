alter table app.payments
  add column if not exists last_admin_reminder_at timestamptz null,
  add column if not exists admin_reminder_count integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'payments_admin_reminder_count_check'
      and conrelid = 'app.payments'::regclass
  ) then
    alter table app.payments
      add constraint payments_admin_reminder_count_check
      check (admin_reminder_count >= 0);
  end if;
end
$$;

alter table app.order_return_cases
  add column if not exists last_admin_reminder_at timestamptz null,
  add column if not exists admin_reminder_count integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_return_cases_admin_reminder_count_check'
      and conrelid = 'app.order_return_cases'::regclass
  ) then
    alter table app.order_return_cases
      add constraint order_return_cases_admin_reminder_count_check
      check (admin_reminder_count >= 0);
  end if;
end
$$;
