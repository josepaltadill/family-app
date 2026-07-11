create schema if not exists validation;
create table if not exists validation.concurrency_barrier (
  session_id text primary key,
  arrived_at timestamptz not null default now()
);
truncate table validation.concurrency_barrier;
