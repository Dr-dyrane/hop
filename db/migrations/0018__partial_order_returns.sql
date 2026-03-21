create table if not exists app.order_return_case_items (
  id uuid primary key default gen_random_uuid(),
  return_case_id uuid not null references app.order_return_cases(id) on delete cascade,
  order_id uuid not null references app.orders(id) on delete cascade,
  order_item_id uuid not null references app.order_items(id) on delete cascade,
  title text not null,
  sku text not null,
  quantity integer not null,
  unit_price_ngn integer not null,
  line_total_ngn integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint order_return_case_items_quantity_check check (quantity > 0),
  constraint order_return_case_items_amounts_check check (
    unit_price_ngn >= 0
    and line_total_ngn >= 0
    and line_total_ngn = unit_price_ngn * quantity
  )
);

create index if not exists order_return_case_items_case_idx
  on app.order_return_case_items (return_case_id, created_at asc);

create index if not exists order_return_case_items_order_idx
  on app.order_return_case_items (order_id, order_item_id);

create unique index if not exists order_return_case_items_unique_idx
  on app.order_return_case_items (return_case_id, order_item_id);

drop trigger if exists audit_order_return_case_items_change on app.order_return_case_items;
create trigger audit_order_return_case_items_change
after insert or update or delete on app.order_return_case_items
for each row
execute function audit.log_row_change('id');

alter table app.order_return_case_items enable row level security;
alter table app.order_return_case_items force row level security;

drop policy if exists order_return_case_items_admin_all on app.order_return_case_items;
create policy order_return_case_items_admin_all
on app.order_return_case_items
for all
using (app.has_role('admin'))
with check (app.has_role('admin'));

drop policy if exists order_return_case_items_customer_select on app.order_return_case_items;
create policy order_return_case_items_customer_select
on app.order_return_case_items
for select
using (app.can_access_order_id(order_id));

drop policy if exists order_return_case_items_customer_insert on app.order_return_case_items;
create policy order_return_case_items_customer_insert
on app.order_return_case_items
for insert
with check (
  app.has_role('customer')
  and app.can_access_order_id(order_id)
);
