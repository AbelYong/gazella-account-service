#!/bin/bash
set -e

DB_USER=${DB_USER:-user}
DB_USER_PASS=${DB_USER_PASS:-CHANGEME}

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
    --set=db_user="$DB_USER" --set=db_user_pass="$DB_USER_PASS" <<-'EOSQL'
    SELECT format(
        'CREATE ROLE %I LOGIN PASSWORD %L',
        :'db_user',
        :'db_user_pass'
    )
    WHERE NOT EXISTS (
        SELECT 1 FROM pg_roles WHERE rolname = :'db_user'
    ) \gexec

    SELECT format(
        'ALTER ROLE %I WITH LOGIN PASSWORD %L',
        :'db_user',
        :'db_user_pass'
    ) \gexec

    SELECT format('GRANT CONNECT ON DATABASE %I TO %I', current_database(), :'db_user') \gexec
    SELECT format('GRANT USAGE ON SCHEMA public TO %I', :'db_user') \gexec

    SELECT format(
        'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO %I',
        :'db_user'
    ) \gexec

    SELECT format(
        'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I',
        current_user,
        :'db_user'
    ) \gexec
EOSQL
