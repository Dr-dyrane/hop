create table if not exists app.riders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone_e164 text not null,
  vehicle_type text null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint riders_phone_e164_check check (
    phone_e164 ~ '^\+[1-9][0-9]{7,14}$'
  )
);

create unique index if not exists riders_phone_idx
  on app.riders (phone_e164);

create table if not exists app.delivery_assignments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references app.orders(id) on delete cascade,
  rider_id uuid null references app.riders(id) on delete set null,
  status text not null default 'unassigned',
  assigned_by_user_id uuid null references app.users(id) on delete set null,
  assigned_by_email citext null,
  assigned_at timestamptz null,
  picked_up_at timestamptz null,
  delivered_at timestamptz null,
  failed_at timestamptz null,
  returned_at timestamptz null,
  note text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint delivery_assignments_status_check check (
    status in (
      'unassigned',
      'assigned',
      'picked_up',
      'out_for_delivery',
      'delivered',
      'failed',
      'returned'
    )
  )
);

create index if not exists delivery_assignments_order_idx
  on app.delivery_assignments (order_id, created_at desc);

create index if not exists delivery_assignments_rider_idx
  on app.delivery_assignments (rider_id, created_at desc);

create index if not exists delivery_assignments_status_idx
  on app.delivery_assignments (status, updated_at desc);

create unique index if not exists delivery_assignments_order_active_idx
  on app.delivery_assignments (order_id)
  where status in ('unassigned', 'assigned', 'picked_up', 'out_for_delivery', 'failed');

create unique index if not exists delivery_assignments_rider_active_idx
  on app.delivery_assignments (rider_id)
  where rider_id is not null
    and status in ('assigned', 'picked_up', 'out_for_delivery');

create table if not exists app.delivery_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references app.orders(id) on delete cascade,
  assignment_id uuid null references app.delivery_assignments(id) on delete set null,
  event_type text not null,
  actor_type text not null default 'system',
  actor_user_id uuid null references app.users(id) on delete set null,
  actor_email citext null,
  note text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint delivery_events_actor_type_check check (
    actor_type in ('admin', 'dispatcher', 'rider', 'system')
  )
);

create index if not exists delivery_events_order_idx
  on app.delivery_events (order_id, created_at desc);

create index if not exists delivery_events_assignment_idx
  on app.delivery_events (assignment_id, created_at desc);

create table if not exists app.tracking_points (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references app.delivery_assignments(id) on delete cascade,
  latitude numeric(9, 6) not null,
  longitude numeric(9, 6) not null,
  heading numeric(6, 2) null,
  accuracy_meters numeric(8, 2) null,
  recorded_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists tracking_points_assignment_idx
  on app.tracking_points (assignment_id, recorded_at desc);

create trigger set_riders_updated_at
before update on app.riders
for each row
execute function app.set_updated_at();

create trigger set_delivery_assignments_updated_at
before update on app.delivery_assignments
for each row
execute function app.set_updated_at();
