Permissions database schema (PostgreSQL)

Setup

- Ensure PostgreSQL 13+ is available.
- Run the schema first, then the seed:

```
psql "postgres://user:pass@localhost:5432/permissions" -f db/schema.sql
psql "postgres://user:pass@localhost:5432/permissions" -f db/seed.sql
```

Key tables

- `users`: player/operator identities with `steam_id` and `username`.
- `groups`: named roles like `VIP`, `britadmin`.
- `plugins`: list of plugin names like `nteleportation`, `signartist`.
- `permissions`: actions per plugin (e.g., `tp`, `tpr`) linked via `plugin_id`.
- `user_groups`: many-to-many user membership in groups.
 - `group_parents`: parent-only relations (each group may reference one or more parents).
 - `group_permissions`: allow/deny flags per group and permission.

Resolution helpers

- `user_all_groups` view expands parent chains to all effective groups for a user.
- `group_effective_permissions` view aggregates permissions across ancestor groups.
- `user_effective_permissions` view aggregates from groups only (no direct user permissions).

Common queries

Get all effective permissions for a user by SteamID:

```sql
SELECT pf.name AS permission, uep.allowed
FROM users u
JOIN user_effective_permissions uep ON uep.steam_id = u.steam_id
JOIN permission_fullnames pf ON pf.permission_id = uep.permission_id
WHERE u.steam_id = $1;
```

Check if a user has a specific permission:

```sql
SELECT EXISTS (
  SELECT 1
  FROM users u
  JOIN permission_fullnames pf ON pf.name = $2
  JOIN user_effective_permissions uep ON uep.steam_id = u.steam_id AND uep.permission_id = pf.permission_id AND uep.allowed = TRUE
  WHERE u.steam_id = $1
);
```

Insert helpers

```sql
-- Upsert a group
INSERT INTO groups (name) VALUES ($1)
ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name;

-- Upsert a permission
INSERT INTO permissions (name) VALUES ($1)
ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name;

-- Assign user to group
INSERT INTO user_groups (steam_id, group_id) VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- Add parent to a group (child -> parent)
INSERT INTO group_parents (group_id, parent_group_id) VALUES ($1, $2)
ON CONFLICT DO NOTHING;
```

Notes

- Use `group_parents` to model tiers (e.g., `VIP+` parent `VIP`). You may chain parents.
- Use `allowed = FALSE` for explicit denies in `group_permissions`.
- Extend with audit tables if you need historical tracking beyond `granted_at/granted_by`.


