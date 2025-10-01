import json

# Read the JSON file
with open('rust-permissions.json', 'r') as f:
    data = json.load(f)

# Extract all unique groups
groups = set(data['groups'])

# Extract all plugins and permissions
permissions = data['permissions']
plugin_permissions = {}
for perm in permissions:
    perm_name = perm['name']
    if '.' in perm_name:
        plugin, action = perm_name.split('.', 1)
        if plugin not in plugin_permissions:
            plugin_permissions[plugin] = set()
        plugin_permissions[plugin].add(action)
    else:
        # Handle permissions without dots
        plugin = "unknown"
        if plugin not in plugin_permissions:
            plugin_permissions[plugin] = set()
        plugin_permissions[plugin].add(perm_name)

# Start building the SQL
print("BEGIN;")
print()

# INSERT groups
print("-- Insert all groups from rust-permissions.json")
print("INSERT INTO groups (name, is_system) VALUES")

group_values = []
for group in sorted(groups):
    # Determine if group is system (brit* prefix) vs user 
    is_system = group.startswith('brit')
    group_values.append(f"('{group}', {str(is_system).lower()})")

print(',\n'.join(group_values))
print('ON CONFLICT (name) DO NOTHING;')
print()

# INSERT plugins
print("-- Insert all plugins from permission prefixes")
print("INSERT INTO plugins (name) VALUES")

plugin_values = []
for plugin in sorted(plugin_permissions.keys()):
    plugin_values.append(f"('{plugin}')")

print(',\n'.join(plugin_values))
print('ON CONFLICT (name) DO NOTHING;')
print()

# INSERT permissions
print("-- Insert all permissions (plugin_id + action)")
print("INSERT INTO permissions (plugin_id, action) VALUES")

permission_values = []
for plugin in sorted(plugin_permissions.keys()):
    plugin_actions = sorted(plugin_permissions[plugin])
    for action in plugin_actions:
        permission_values.append(f"((SELECT id FROM plugins WHERE name = '{plugin}'), '{action}')")

print(',\n'.join(permission_values))
print('ON CONFLICT (plugin_id, action) DO NOTHING;')
print()

# INSERT group permissions - mapping groups to permissions
print("-- Insert all group permission mappings")
print("INSERT INTO group_permissions (group_id, permission_id, allowed) VALUES")

mapping_values = []
for perm in permissions:
    perm_name = perm['name']
    groups_with_permission = perm['groups']
    
    # Get plugin and action for this permission
    if '.' in perm_name:
        plugin, action = perm_name.split('.', 1)
    else:
        plugin = "unknown"
        action = perm_name
    
    # Create mapping for each group
    for group_name in groups_with_permission:
        mapping_values.append(f"((SELECT id FROM groups WHERE name = '{group_name}'), (SELECT id FROM permissions WHERE plugin_id = (SELECT id FROM plugins WHERE name = '{plugin}') AND action = '{action}'), true)")

print(',\n'.join(mapping_values))
print('ON CONFLICT (group_id, permission_id) DO NOTHING;')
print()

print("COMMIT;")

