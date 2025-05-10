-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Create the sightings table
create table if not exists sightings (
    id uuid default uuid_generate_v4() primary key,
    date date not null,
    min_group_size integer not null,
    -- First sighting details
    first_sighting_location text,
    first_sighting_latitude numeric(10, 8),
    first_sighting_longitude numeric(11, 8),
    first_sighting_time time,
    first_sighting_direction text,
    -- End sighting details
    end_sighting_location text,
    end_sighting_latitude numeric(10, 8),
    end_sighting_longitude numeric(11, 8),
    end_sighting_time time,
    end_sighting_direction text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create the whales table
create table if not exists whales (
    id uuid default uuid_generate_v4() primary key,
    matriline_id text not null unique,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create the junction table for sightings and whales
create table if not exists sighting_whales (
    id uuid default uuid_generate_v4() primary key,
    sighting_id uuid references sightings(id),
    whale_id uuid references whales(id),
    created_at timestamp with time zone default now(),
    constraint fk_sighting
        foreign key (sighting_id)
        references sightings(id)
        on delete cascade,
    constraint fk_whale
        foreign key (whale_id)
        references whales(id)
        on delete cascade
);

-- Create indexes for better query performance
create index if not exists idx_sightings_date on sightings(date);
create index if not exists idx_sightings_first_location on sightings(first_sighting_location);
create index if not exists idx_sightings_end_location on sightings(end_sighting_location);
create index if not exists idx_whales_matriline on whales(matriline_id);

-- Create a function to update the updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create triggers to automatically update the updated_at column
drop trigger if exists update_sightings_updated_at on sightings;
create trigger update_sightings_updated_at
    before update on sightings
    for each row
    execute function update_updated_at_column();

drop trigger if exists update_whales_updated_at on whales;
create trigger update_whales_updated_at
    before update on whales
    for each row
    execute function update_updated_at_column(); 