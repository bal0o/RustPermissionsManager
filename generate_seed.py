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

print('Groups found:', len(groups))
print('Plugins found:', len(plugin_permissions))
print('Total permissions:', len(permissions))

# Generate SQL for groups
print('\n-- INSERT into groups (from rust-permissions.json)')
print('INSERT INTO groups (name, is_system) VALUES')

group_values = []
for group in sorted(groups):
    # Determine if group is system (brit* prefix) vs user 
    is_system = group.startswith('brit')
    group_values.append(f"('{group}', {str(is_system).lower()})")

print(',\n'.join(group_values) + '\nON CONFLICT (name) DO NOTHING;')

# Generate SQL for plugins
print('\n-- INSERT into plugins (from permission prefixes)')
print('INSERT INTO plugins (name) VALUES')
plugin_values = []
for plugin in sorted(plugin_permissions.keys()):
    plugin_values.append(f"('{plugin}')")

print(',\n'.join(plugin_values) + '\nON CONFLICT (name) DO NOTHING;')
