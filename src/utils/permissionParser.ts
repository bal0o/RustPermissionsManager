import { PermissionData, ServerConfig } from '../types';

export function parsePermissionOutput(output: string): PermissionData[] {
  const lines = output.split('\n');
  const permissions: PermissionData[] = [];

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line === 'Permissions:') continue;

    // Split by commas and process each permission
    const permissionNames = line.split(',').map(p => p.trim()).filter(p => p);
    
    // Add each permission
    for (const name of permissionNames) {
      if (name && name !== 'Permissions:') {
        permissions.push({
          name: name,
          groups: [] // No group information in this format
        });
      }
    }
  }

  return permissions;
}

export function generateServerCommands(
  permissions: PermissionData[],
  config: ServerConfig
): string {
  const commands: string[] = [];
  const { commandPrefix } = config;

  // Generate commands for each permission and group
  permissions.forEach(perm => {
    // Get all groups that should have this permission
    const groupsWithPermission = new Set(perm.groups);

    // Generate grant commands for groups that should have the permission
    groupsWithPermission.forEach(group => {
      commands.push(`${commandPrefix}grant user ${group} ${perm.name}`);
    });

    // Generate revoke commands for groups that shouldn't have the permission
    // This would require knowing all possible groups in the system
    // For now, we'll just handle the groups we know about
  });

  return commands.join('\n');
} 