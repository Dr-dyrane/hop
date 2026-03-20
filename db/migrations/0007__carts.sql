create table if not exists app.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references app.users(id) on delete set null,
  status text not null default 'active',
  converted_order_id uuid null references app.orders(id) on delete set null,
  last_interacted_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint carts_status_check check (
    status in ('active', 'converted', 'abandoned', 'expired')
  )
);

create index if not exists carts_user_status_idx
  on app.carts (user_id, status, updated_at desc);

create index if not exists carts_status_updated_idx
  on app.carts (status, updated_at desc);

create table if not exists app.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references app.carts(id) on delete cascade,
  variant_id uuid not null references app.product_variants(id) on delete cascade,
  quantity integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint cart_items_quantity_check check (quantity > 0),
  constraint cart_items_unique_variant_per_cart unique (cart_id, variant_id)
);

create index if not exists cart_items_cart_idx
  on app.cart_items (cart_id, created_at asc);

create trigger set_carts_updated_at
before update on app.carts
for each row
execute function app.set_updated_at();

create trigger set_cart_items_updated_at
before update on app.cart_items
for each row
execute function app.set_updated_at();
