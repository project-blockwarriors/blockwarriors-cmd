create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  start_tournament boolean not null default false,
  show_banner boolean not null default false,
  banner_text_content text,
  banner_button_content text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Create a single row that will be used to store all settings
insert into settings (start_tournament, show_banner, banner_text_content, banner_button_content)
values (false, false, '', '')
on conflict do nothing;
