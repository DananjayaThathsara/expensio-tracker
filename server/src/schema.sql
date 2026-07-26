create table if not exists users (
  id            serial primary key,
  name          text not null,
  email         text not null unique,
  password_hash text,
  provider      text not null default 'password',
  provider_id   text,
  created_at    timestamptz not null default now()
);

create table if not exists households (
  id              serial primary key,
  name            text not null default 'My budget',
  owner_id        integer not null references users(id) on delete cascade,
  default_budget  numeric(12,2) not null default 4000,
  currency        text not null default 'USD',
  alert_threshold integer not null default 80,
  notify_over     boolean not null default true,
  notify_weekly   boolean not null default true,
  notify_adds     boolean not null default false,
  created_at      timestamptz not null default now()
);

create table if not exists memberships (
  household_id integer not null references households(id) on delete cascade,
  user_id      integer not null references users(id) on delete cascade,
  role         text not null default 'edit' check (role in ('owner','edit','view')),
  primary key (household_id, user_id)
);

create table if not exists monthly_budgets (
  household_id integer not null references households(id) on delete cascade,
  month        char(7) not null,
  amount       numeric(12,2) not null,
  primary key (household_id, month)
);

create table if not exists expenses (
  id           serial primary key,
  household_id integer not null references households(id) on delete cascade,
  user_id      integer not null references users(id) on delete set null,
  amount       numeric(12,2) not null check (amount > 0),
  category     text not null,
  spent_on     date not null,
  note         text not null default '',
  method       text not null default 'Card',
  recurring    boolean not null default false,
  receipt_url  text,
  created_at   timestamptz not null default now()
);
create index if not exists expenses_household_month on expenses (household_id, spent_on);

create table if not exists invites (
  id           serial primary key,
  household_id integer not null references households(id) on delete cascade,
  email        text not null,
  role         text not null default 'edit' check (role in ('edit','view')),
  token        text not null unique,
  created_at   timestamptz not null default now()
);

create table if not exists alerts_sent (
  household_id integer not null references households(id) on delete cascade,
  month        char(7) not null,
  level        integer not null,
  primary key (household_id, month, level)
);
