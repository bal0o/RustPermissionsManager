-- PostgreSQL schema for permissions management
-- Users, Groups, Permissions, Assignments, Group Inheritance, Audit

-- Enable extensions (optional but useful)
-- Uncomment if you want UUIDs. Using identity columns by default here.
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

BEGIN;

CREATE TABLE IF NOT EXISTS users (
    steam_id        BIGINT PRIMARY KEY,
    username        TEXT NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS groups (
    id              BIGSERIAL PRIMARY KEY,
    name            TEXT NOT NULL UNIQUE,         -- e.g., "VIP", "britadmin"
    description     TEXT,
    is_system       BOOLEAN NOT NULL DEFAULT FALSE, -- protect built-ins
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Plugins (e.g., nteleportation, signartist)
CREATE TABLE IF NOT EXISTS plugins (
    id              BIGSERIAL PRIMARY KEY,
    name            TEXT NOT NULL UNIQUE,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Permissions belong to a plugin and have an action key (e.g., tp, tpr)
CREATE TABLE IF NOT EXISTS permissions (
    id              BIGSERIAL PRIMARY KEY,
    plugin_id       BIGINT NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
    action          TEXT NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT permissions_plugin_action_unique UNIQUE (plugin_id, action)
);

-- Assignment of users to groups
CREATE TABLE IF NOT EXISTS user_groups (
    steam_id        BIGINT NOT NULL REFERENCES users(steam_id) ON DELETE CASCADE,
    group_id        BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    granted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    granted_by      BIGINT REFERENCES users(steam_id) ON DELETE SET NULL,
    PRIMARY KEY (steam_id, group_id)
);

-- Group parents: groups declare only parent ids (child -> parent)
-- Example: VIP+ has parent VIP; staff roles can chain upwards.
CREATE TABLE IF NOT EXISTS group_parents (
    group_id        BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    parent_group_id BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, parent_group_id),
    CHECK (group_id <> parent_group_id)
);

-- Permissions can be granted directly to groups
CREATE TABLE IF NOT EXISTS group_permissions (
    group_id        BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    permission_id   BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    allowed         BOOLEAN NOT NULL DEFAULT TRUE, -- support explicit deny
    granted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    granted_by      BIGINT REFERENCES users(id) ON DELETE SET NULL,
    PRIMARY KEY (group_id, permission_id)
);

-- Direct user permissions are intentionally omitted (group-only model)

-- Deny lists for fine-grained overrides (optional; can be modeled via allowed=false)
-- Keeping a separate table is sometimes clearer operationally; comment out if not needed.
-- CREATE TABLE IF NOT EXISTS group_permission_denies (
--     group_id      BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
--     permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
--     PRIMARY KEY (group_id, permission_id)
-- );

CREATE INDEX IF NOT EXISTS idx_user_groups_steam ON user_groups(steam_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_group ON user_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_group_permissions_group ON group_permissions(group_id);
CREATE INDEX IF NOT EXISTS idx_group_permissions_perm ON group_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_group_parents_group ON group_parents(group_id);
CREATE INDEX IF NOT EXISTS idx_group_parents_parent ON group_parents(parent_group_id);

-- Triggers to maintain updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_groups_updated
BEFORE UPDATE ON groups
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_permissions_updated
BEFORE UPDATE ON permissions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Convenience view: permission full names as plugin.action
CREATE OR REPLACE VIEW permission_fullnames AS
SELECT pe.id AS permission_id,
       CASE WHEN pe.action = '' THEN pl.name ELSE pl.name || '.' || pe.action END AS name,
       pe.action,
       pl.name AS plugin_name
FROM permissions pe
JOIN plugins pl ON pl.id = pe.plugin_id;

-- Resolution helpers

CREATE OR REPLACE VIEW user_all_groups AS
WITH RECURSIVE rel(steam_id, group_id) AS (
    SELECT ug.steam_id, ug.group_id
    FROM user_groups ug
    UNION
    SELECT r.steam_id, gp.parent_group_id
    FROM rel r
    JOIN group_parents gp ON gp.group_id = r.group_id
)
SELECT DISTINCT steam_id, group_id FROM rel;

-- 2) Effective permissions per group considering parent chain (ancestors)
CREATE OR REPLACE VIEW group_effective_permissions AS
WITH RECURSIVE all_ancestors AS (
    SELECT g.id AS group_id, g.id AS ancestor_id
    FROM groups g
    UNION
    SELECT aa.group_id, gp.parent_group_id AS ancestor_id
    FROM all_ancestors aa
    JOIN group_parents gp ON gp.group_id = aa.ancestor_id
)
SELECT aa.group_id, gp.permission_id, bool_or(gp.allowed) AS allowed
FROM all_ancestors aa
JOIN group_permissions gp ON gp.group_id = aa.ancestor_id
GROUP BY aa.group_id, gp.permission_id;

-- 3) Effective permissions per user from groups only
CREATE OR REPLACE VIEW user_effective_permissions AS
SELECT uag.steam_id, gep.permission_id, bool_or(gep.allowed) AS allowed
FROM user_all_groups uag
JOIN group_effective_permissions gep ON gep.group_id = uag.group_id
GROUP BY uag.steam_id, gep.permission_id;

-- Human-friendly view: direct group-permission grants with names
CREATE OR REPLACE VIEW group_permissions_named AS
SELECT
    gp.group_id,
    g.name AS group_name,
    gp.permission_id,
    pf.name AS permission_name,
    pf.plugin_name,
    pf.action,
    gp.allowed,
    gp.granted_at,
    gp.granted_by
FROM group_permissions gp
JOIN groups g ON g.id = gp.group_id
JOIN permission_fullnames pf ON pf.permission_id = gp.permission_id;

COMMIT;


