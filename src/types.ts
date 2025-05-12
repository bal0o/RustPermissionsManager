export interface PermissionData {
  name: string;
  description?: string;
  groups: string[];
}

export interface PermissionsGridProps {
  permissions: PermissionData[];
  groups: string[];
  onPermissionsChange: (permissions: PermissionData[]) => void;
  onGroupsChange: (groups: string[]) => void;
  onImport: (data: { permissions: PermissionData[], groups: string[] }) => void;
  onExport: () => void;
  onExportScript: () => void;
}

export type ServerType = 'carbon' | 'oxide';

export interface ServerConfig {
  type: ServerType;
  commandPrefix: string;
}

export interface ParsedPermission {
  name: string;
  groups: string[];
} 