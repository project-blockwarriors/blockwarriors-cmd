-- logic loop, user created first -> user clicks start match -> user is joined to a new/existing team -> team is joined to a new/existing match, -> token is created and joined to that match.

-- once all players are logged in to the server (they will be in a waiting state prior)
-- and all teams are full, the match status will be set to "starting" -> "completed".

CREATE TABLE dev_active_tokens (
    token UUID NOT NULL DEFAULT uuid_generate_v4(), -- uuidv4
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    bot_id INTEGER GENERATED ALWAYS AS IDENTITY,
    match_id BIGINT REFERENCES dev_matches(match_id) ON DELETE CASCADE,
    team_id BIGINT REFERENCES dev_practice_teams(team_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 minutes'),
    CONSTRAINT active_tokens_pkey PRIMARY KEY (token)
);

CREATE TABLE dev_matches (
    match_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY, -- auto increment
    match_type TEXT NOT NULL REFERENCES dev_practice_teams(match_type),
    match_status TEXT DEFAULT 'pending',
    match_elo INTEGER,
    red_team_id BIGINT REFERENCES dev_practice_teams(team_id),
    blue_team_id BIGINT REFERENCES dev_practice_teams(team_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 minutes')
);

CREATE TABLE dev_practice_teams (
    team_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    team_name TEXT NOT NULL,
    match_type TEXT NOT NULL,
    team_leader_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    total_team_elo INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


CREATE OR REPLACE FUNCTION delete_expired_records()
RETURNS VOID AS $$
BEGIN
    -- Delete expired tokens
    DELETE FROM dev_active_tokens
    WHERE expires_at < NOW();

    -- Delete matches that have expired and are still pending
    DELETE FROM dev_matches
    WHERE expires_at < NOW() AND status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- Schedule the above function to run once per minute (cron job)
SELECT cron.schedule('*/1 * * * *', 'SELECT delete_expired_records();');
-- To view active CRON jobs run
-- SELECT * FROM cron.job;