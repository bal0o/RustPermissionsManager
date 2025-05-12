import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  Snackbar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ListItem,
  ListItemText,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import { Add as AddIcon, Delete as DeleteIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { PermissionsGridProps, PermissionData, ServerType, ServerConfig } from '../types';
import { parsePermissionOutput } from '../utils/permissionParser';
import { Grid as VirtualizedGrid } from 'react-virtualized';
import 'react-virtualized/styles.css';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Stack } from '@mui/material';

const OTHER_COL_WIDTH = 60;
const HEADER_FONT_SIZE = 12;
const MIN_PERMISSION_COL_WIDTH = 180;
const MAX_PERMISSION_COL_WIDTH = 600;
const PERMISSION_FONT_SIZE = 14;
const DELETE_BUTTON_HEIGHT = 24;
const DELETE_BUTTON_MARGIN = 8;
const HEADER_VERTICAL_PADDING = 16;
const CELL_HEIGHT = 40;

function getTextWidth(text: string, font: string) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return 0;
  context.font = font;
  return context.measureText(text).width;
}

function getScrollbarWidth() {
  const container = document.createElement('div');
  container.style.overflow = 'scroll';
  container.style.width = '100px';
  container.style.height = '100px';
  container.style.visibility = 'hidden';
  document.body.appendChild(container);
  const inner = document.createElement('div');
  inner.style.width = '100%';
  inner.style.height = '100%';
  container.appendChild(inner);
  const scrollbarWidth = container.offsetWidth - container.clientWidth;
  document.body.removeChild(container);
  return scrollbarWidth;
}

// Separate component for input fields
const InputFields = React.memo(({ 
  onAddGroup,
  onAddPermission,
}: { 
  onAddGroup: (group: string) => void;
  onAddPermission: (permission: string) => void;
}) => {
  const [newGroup, setNewGroup] = useState('');
  const [newPermission, setNewPermission] = useState('');

  const handleAddGroup = useCallback(() => {
    if (newGroup) {
      onAddGroup(newGroup);
      setNewGroup('');
    }
  }, [newGroup, onAddGroup]);

  const handleAddPermission = useCallback(() => {
    if (newPermission) {
      onAddPermission(newPermission);
      setNewPermission('');
    }
  }, [newPermission, onAddPermission]);

  return (
    <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
      <TextField
        label="New Group"
        value={newGroup}
        onChange={(e) => setNewGroup(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleAddGroup();
          }
        }}
        size="small"
        sx={{ bgcolor: 'white', borderRadius: 1 }}
      />
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleAddGroup}
        sx={{ bgcolor: '#3f51b5', '&:hover': { bgcolor: '#303f9f' } }}
      >
        Add Group
      </Button>
      <TextField
        label="New Permission"
        value={newPermission}
        onChange={(e) => setNewPermission(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleAddPermission();
          }
        }}
        size="small"
        sx={{ bgcolor: 'white', borderRadius: 1 }}
      />
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleAddPermission}
        sx={{ bgcolor: '#3f51b5', '&:hover': { bgcolor: '#303f9f' } }}
      >
        Add Permission
      </Button>
    </Stack>
  );
});

// Separate component for action buttons
const ActionButtons = React.memo(({ 
  onExport,
  onShowImport,
  onShowExportScript,
  onShowConfig,
  onImportFile,
}: {
  onExport: () => void;
  onShowImport: () => void;
  onShowExportScript: () => void;
  onShowConfig: () => void;
  onImportFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
      <Button 
        variant="outlined" 
        component="label"
        sx={{ bgcolor: 'white', borderColor: '#4caf50', color: '#4caf50', '&:hover': { borderColor: '#2e7d32', bgcolor: '#f1f8e9' } }}
      >
        Open File
        <input
          type="file"
          hidden
          accept=".json"
          onChange={onImportFile}
        />
      </Button>
      <Button 
        variant="outlined" 
        onClick={onExport}
        sx={{ bgcolor: 'white', borderColor: '#4caf50', color: '#4caf50', '&:hover': { borderColor: '#2e7d32', bgcolor: '#f1f8e9' } }}
      >
        Save File
      </Button>
      <Box sx={{ borderLeft: 1, borderColor: 'divider', mx: 1, height: '36px' }} />
      
      <Button 
        variant="outlined" 
        onClick={onShowImport}
        sx={{ bgcolor: 'white', borderColor: '#ff9800', color: '#ff9800', '&:hover': { borderColor: '#ef6c00', bgcolor: '#fff3e0' } }}
      >
        Import Permissions
      </Button>
      <Button 
        variant="outlined" 
        onClick={onShowExportScript}
        sx={{ bgcolor: 'white', borderColor: '#ff9800', color: '#ff9800', '&:hover': { borderColor: '#ef6c00', bgcolor: '#fff3e0' } }}
      >
        Generate Script
      </Button>
      
      <IconButton 
        onClick={onShowConfig}
        sx={{ bgcolor: 'white', color: '#9e9e9e', '&:hover': { bgcolor: '#f5f5f5', color: '#616161' } }}
      >
        <SettingsIcon />
      </IconButton>
    </Stack>
  );
});

// Separate component for Import Dialog
const ImportDialog = React.memo(({
  open,
  onClose,
  onImport,
  currentPermissions
}: {
  open: boolean;
  onClose: () => void;
  onImport: (data: { permissions: PermissionData[], groups: string[] }) => void;
  currentPermissions: PermissionData[];
}) => {
  const [importText, setImportText] = useState('');
  const [showImportSummary, setShowImportSummary] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    toAdd: string[];
    toRemove: string[];
    unchanged: string[];
  }>({ toAdd: [], toRemove: [], unchanged: [] });

  const handleImportText = useCallback(() => {
    try {
      const parsedPermissions = parsePermissionOutput(importText);
      const allGroups = new Set<string>();
      parsedPermissions.forEach(perm => {
        perm.groups.forEach(group => allGroups.add(group));
      });

      // Calculate differences with trimmed strings
      const currentPerms = new Set(currentPermissions.map(p => p.name.trim()));
      const newPerms = new Set(parsedPermissions.map(p => p.name.trim()));
      
      const toAdd = parsedPermissions
        .filter(p => !currentPerms.has(p.name.trim()))
        .map(p => p.name);
      
      const toRemove = currentPermissions
        .filter(p => !newPerms.has(p.name.trim()))
        .map(p => p.name);
      
      const unchanged = currentPermissions
        .filter(p => newPerms.has(p.name.trim()))
        .map(p => p.name);
      
      setImportSummary({ toAdd, toRemove, unchanged });
      setShowImportSummary(true);
    } catch (error) {
      console.error('Error parsing permission text:', error);
    }
  }, [importText, currentPermissions]);

  const handleConfirmImport = useCallback(() => {
    try {
      const parsedPermissions = parsePermissionOutput(importText);
      const updatedPermissions = parsedPermissions.map(newPerm => {
        const existingPerm = currentPermissions.find(p => p.name.trim() === newPerm.name.trim());
        return {
          ...newPerm,
          groups: existingPerm ? existingPerm.groups : []
        };
      }).sort((a, b) => a.name.localeCompare(b.name));
      onImport({ permissions: updatedPermissions, groups: Array.from(new Set(updatedPermissions.flatMap(p => p.groups))) });
      setShowImportSummary(false);
      setImportText('');
      onClose();
    } catch (error) {
      console.error('Error during import:', error);
    }
  }, [importText, currentPermissions, onImport, onClose]);

  // Memoize the import summary list items
  const ImportSummaryList = useMemo(() => ({ items, color }: { items: string[], color: string }) => (
    <FixedSizeList
      height={200}
      width="100%"
      itemCount={items.length}
      itemSize={35}
    >
      {({ index, style }: ListChildComponentProps) => (
        <ListItem style={style} key={items[index]}>
          <ListItemText 
            primary={items[index]} 
            sx={{ 
              color,
              '& .MuiListItemText-primary': {
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }
            }}
          />
        </ListItem>
      )}
    </FixedSizeList>
  ), []);

  return (
    <>
      <Dialog open={open && !showImportSummary} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#ff9800', color: 'white' }}>Import Permissions</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextareaAutosize
            minRows={10}
            style={{ width: '100%', marginTop: '1rem' }}
            value={importText}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setImportText(e.target.value)}
            placeholder="Paste the output from c.show perms here..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleImportText} variant="contained">
            Import
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showImportSummary} onClose={() => setShowImportSummary(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#ff9800', color: 'white' }}>Import Summary</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {importSummary.toAdd.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" color="primary">
                  Added ({importSummary.toAdd.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <ImportSummaryList items={importSummary.toAdd} color="primary.main" />
              </AccordionDetails>
            </Accordion>
          )}
          {importSummary.toRemove.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" color="error">
                  Removed ({importSummary.toRemove.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <ImportSummaryList items={importSummary.toRemove} color="error.main" />
              </AccordionDetails>
            </Accordion>
          )}
          {importSummary.unchanged.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" color="text.secondary">
                  Unchanged ({importSummary.unchanged.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <ImportSummaryList items={importSummary.unchanged} color="text.secondary" />
              </AccordionDetails>
            </Accordion>
          )}
          {importSummary.toAdd.length === 0 && importSummary.toRemove.length === 0 && (
            <Typography variant="body1" color="text.secondary">
              No changes detected. The permission list is identical to the current one.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowImportSummary(false)}>Cancel</Button>
          <Button onClick={handleConfirmImport} variant="contained" color="primary">
            Confirm Import
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

const PermissionsGrid = ({
  permissions,
  groups,
  onPermissionsChange,
  onGroupsChange,
  onImport,
  onExport,
}: PermissionsGridProps) => {
  const [serverConfig, setServerConfig] = useState<ServerConfig>({
    type: 'oxide',
    commandPrefix: 'oxide.',
  });
  const [showConfig, setShowConfig] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportScriptDialog, setShowExportScriptDialog] = useState(false);
  const [exportScriptOptions, setExportScriptOptions] = useState({
    serverType: 'oxide' as ServerType,
    commandPrefix: 'oxide.',
    createGroups: false,
    revokeBeforeGrant: false
  });
  const [exportScript, setExportScript] = useState('');
  const [showCopied, setShowCopied] = useState(false);

  // Calculate dynamic header height (for rotated group names)
  const headerHeight = useMemo(() => {
    if (!groups.length) return 60;
    const font = `${HEADER_FONT_SIZE}px sans-serif`;
    const maxLen = Math.max(...groups.map(g => getTextWidth(g, font)));
    return Math.ceil(DELETE_BUTTON_HEIGHT + DELETE_BUTTON_MARGIN + HEADER_VERTICAL_PADDING + maxLen);
  }, [groups]);

  // Calculate dynamic permission column width
  const permissionColWidth = useMemo(() => {
    if (!permissions.length) return MIN_PERMISSION_COL_WIDTH;
    const font = `${PERMISSION_FONT_SIZE}px sans-serif`;
    const maxLen = Math.max(...permissions.map(p => getTextWidth(p.name, font)));
    return Math.min(Math.max(maxLen + 48, MIN_PERMISSION_COL_WIDTH), MAX_PERMISSION_COL_WIDTH);
  }, [permissions]);

  // Calculate column count and width getter
  const columnCount = groups.length + 2; // permission + groups + actions
  const getColumnWidth = ({ index }: { index: number }) =>
    index === 0 ? permissionColWidth : OTHER_COL_WIDTH;

  // Memoize sorted permissions to prevent unnecessary re-sorting
  const sortedPermissions = useMemo(() => 
    [...permissions].sort((a, b) => a.name.localeCompare(b.name)),
    [permissions]
  );

  // Memoize the permission lookup map for faster group checks
  const permissionGroupsMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    permissions.forEach(perm => {
      map.set(perm.name, new Set(perm.groups));
    });
    return map;
  }, [permissions]);

  // Only update state when adding
  const handleAddGroup = useCallback((group: string) => {
    if (!groups.includes(group)) {
      onGroupsChange([...groups, group]);
    }
  }, [groups, onGroupsChange]);

  const handleAddPermission = useCallback((permission: string) => {
    if (!permissions.some(p => p.name === permission)) {
      const updated = [
        ...permissions,
        { name: permission, groups: [] }
      ].filter(p => p.name && p.name.trim() !== '')
       .sort((a, b) => a.name.localeCompare(b.name));
      onPermissionsChange(updated);
    }
  }, [permissions, onPermissionsChange]);

  const handleRemoveGroup = (groupToRemove: string) => {
    onGroupsChange(groups.filter(g => g !== groupToRemove));
    onPermissionsChange(
      permissions.map(perm => ({
        ...perm,
        groups: perm.groups.filter(g => g !== groupToRemove),
      }))
    );
  };

  // Optimize the toggle permission handler
  const handleTogglePermission = useCallback((permission: PermissionData, group: string) => {
    const groups = permissionGroupsMap.get(permission.name) || new Set();
    const newGroups = new Set(groups);
    
    if (newGroups.has(group)) {
      newGroups.delete(group);
    } else {
      newGroups.add(group);
    }

    onPermissionsChange(
      permissions.map(p =>
        p.name === permission.name 
          ? { ...p, groups: Array.from(newGroups) }
          : p
      )
    );
  }, [permissions, permissionGroupsMap, onPermissionsChange]);

  // Add this handler to remove a permission
  const handleDeletePermission = useCallback((permissionName: string) => {
    const updated = permissions.filter(p => p.name !== permissionName);
    onPermissionsChange(updated);
  }, [permissions, onPermissionsChange]);

  // Optimize the cell renderer
  const cellRenderer = useCallback(({ columnIndex, key, rowIndex, style }: any) => {
    const permission = sortedPermissions[rowIndex];
    const isOdd = rowIndex % 2 === 1;
    const baseBg = isOdd ? '#f5f8ff' : '#fff';
    
    if (columnIndex === 0) {
      return (
        <div key={key} style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #e0e0ff',
          borderRight: '1px solid #e0e0ff',
          paddingLeft: 12,
          background: baseBg,
          fontWeight: 500,
          fontSize: `${PERMISSION_FONT_SIZE}px`,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {permission.name}
        </div>
      );
    } else if (columnIndex === groups.length + 1) {
      // Actions column: add delete button for permission
      return (
        <div key={key} style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #e0e0ff',
          borderRight: '1px solid #e0e0ff',
          background: baseBg,
        }}>
          <IconButton
            size="small"
            onClick={() => handleDeletePermission(permission.name)}
            sx={{ color: '#f44336' }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </div>
      );
    } else {
      const group = groups[columnIndex - 1];
      const isChecked = permissionGroupsMap.get(permission.name)?.has(group) || false;
      return (
        <div key={key} style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #e0e0ff',
          borderRight: '1px solid #e0e0ff',
          background: isChecked ? 'rgba(63, 81, 181, 0.08)' : baseBg,
        }}>
          <Checkbox
            checked={isChecked}
            onChange={() => handleTogglePermission(permission, group)}
            sx={{ 
              '& .MuiSvgIcon-root': { fontSize: 20 },
              color: '#9fa8da',
              '&.Mui-checked': {
                color: '#3f51b5',
              },
            }}
            size="small"
          />
        </div>
      );
    }
  }, [sortedPermissions, groups, permissionGroupsMap, handleTogglePermission, handleDeletePermission]);

  // Memoize grid dimensions
  const gridDimensions = useMemo(() => {
    const scrollbarWidth = getScrollbarWidth();
    const gridWidth = permissionColWidth + groups.length * OTHER_COL_WIDTH + OTHER_COL_WIDTH + scrollbarWidth;
    const gridHeight = Math.min(window.innerHeight - 220 - headerHeight, sortedPermissions.length * CELL_HEIGHT);
    const totalHeight = headerHeight + gridHeight;
    return { gridWidth, gridHeight, totalHeight };
  }, [permissionColWidth, groups.length, headerHeight, sortedPermissions.length]);

  // Memoize the grid component with optimized settings
  const GridComponent = useMemo(() => (
    <VirtualizedGrid
      columnCount={columnCount}
      columnWidth={getColumnWidth}
      height={gridDimensions.gridHeight}
      rowCount={sortedPermissions.length}
      rowHeight={CELL_HEIGHT}
      width={gridDimensions.gridWidth}
      cellRenderer={cellRenderer}
      style={{ border: '1px solid #ccc', background: '#fff' }}
      overscanRowCount={10}
      overscanColumnCount={2}
      enableFixedColumnScroll
      enableFixedRowScroll
      hideTopRightGridScrollbar
      hideBottomLeftGridScrollbar
    />
  ), [columnCount, getColumnWidth, gridDimensions, sortedPermissions.length, cellRenderer]);

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const data = JSON.parse(text);
          
          // Validate the imported data structure
          if (!data.permissions || !Array.isArray(data.permissions) || !data.groups || !Array.isArray(data.groups)) {
            throw new Error('Invalid file format: missing permissions or groups arrays');
          }

          // Validate each permission has the required structure
          const validPermissions = data.permissions.every((p: any) => 
            typeof p === 'object' && 
            typeof p.name === 'string' && 
            Array.isArray(p.groups)
          );

          if (!validPermissions) {
            throw new Error('Invalid file format: permissions must have name and groups array');
          }

          // Update the state with the imported data
          onPermissionsChange(data.permissions);
          onGroupsChange(data.groups);
        } catch (error) {
          console.error('Error parsing permissions file:', error);
          // You might want to show an error message to the user here
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExportScript = () => {
    const groupMap: Record<string, string[]> = {};
    permissions.forEach(perm => {
      perm.groups.forEach(group => {
        if (!groupMap[group]) {
          groupMap[group] = [];
        }
        groupMap[group].push(perm.name);
      });
    });

    const { commandPrefix, createGroups, revokeBeforeGrant } = exportScriptOptions;
    const lines: string[] = [];

    // Add group creation commands if enabled
    if (createGroups) {
      groups.forEach(group => {
        lines.push(`${commandPrefix}group add ${group}`);
      });
    }

    // Add permission commands
    Object.entries(groupMap).forEach(([group, perms]) => {
      if (revokeBeforeGrant) {
        perms.forEach(perm => {
          lines.push(`${commandPrefix}group revoke ${group} ${perm}`);
        });
      }
      perms.forEach(perm => {
        lines.push(`${commandPrefix}group grant ${group} ${perm}`);
      });
    });

    setExportScript(lines.join('\n'));
  };

  // Render header row as a separate flex container
  const renderHeaderRow = () => (
    <div
      style={{
        display: 'flex',
        width: permissionColWidth + groups.length * OTHER_COL_WIDTH + OTHER_COL_WIDTH,
        height: headerHeight,
        background: '#3f51b5',
        color: 'white',
        borderBottom: '1px solid #303f9f',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        style={{
          width: permissionColWidth,
          minWidth: permissionColWidth,
          maxWidth: permissionColWidth,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          borderRight: '1px solid rgba(255,255,255,0.2)',
          height: '100%',
          fontSize: `${PERMISSION_FONT_SIZE}px`,
        }}
      >
        Permission
      </div>
      {groups.map((group) => (
        <div
          key={group}
          style={{
            width: OTHER_COL_WIDTH,
            minWidth: OTHER_COL_WIDTH,
            maxWidth: OTHER_COL_WIDTH,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            fontWeight: 'bold',
            borderRight: '1px solid rgba(255,255,255,0.2)',
            height: '100%',
            position: 'relative',
            overflow: 'visible',
          }}
        >
          <IconButton
            size="small"
            onClick={() => handleRemoveGroup(group)}
            style={{
              position: 'absolute',
              top: DELETE_BUTTON_MARGIN,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 2,
              padding: '4px',
              color: 'white',
              backgroundColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
          <span
            style={{
              display: 'block',
              position: 'absolute',
              left: '68%',
              bottom: 2,
              width: 0,
              transform: 'translateX(-48%) rotate(-90deg)',
              transformOrigin: 'left bottom',
              whiteSpace: 'nowrap',
              fontSize: `${HEADER_FONT_SIZE}px`,
              lineHeight: 1.2,
              textAlign: 'left',
              background: 'rgba(63, 81, 181, 0.85)',
              color: 'white',
              padding: '0 4px',
              borderRadius: 4,
              overflow: 'visible',
              textOverflow: 'clip',
              zIndex: 1,
            }}
          >
            {group}
          </span>
        </div>
      ))}
      <div
        style={{
          width: OTHER_COL_WIDTH,
          minWidth: OTHER_COL_WIDTH,
          maxWidth: OTHER_COL_WIDTH,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          height: '100%',
        }}
      >
      </div>
    </div>
  );

  // Only render the grid when no dialog is open
  const shouldRenderGrid = !showImportDialog && !showExportScriptDialog && !showConfig;

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      width: '100vw', 
      minHeight: 0,
      background: 'linear-gradient(to bottom right, #f0f8ff, #e6f2ff)',
      p: 2,
      borderRadius: 2
    }}>
      <ActionButtons 
        onExport={onExport}
        onShowImport={() => setShowImportDialog(true)}
        onShowExportScript={() => setShowExportScriptDialog(true)}
        onShowConfig={() => setShowConfig(true)}
        onImportFile={handleImportFile}
      />
      <InputFields 
        onAddGroup={handleAddGroup}
        onAddPermission={handleAddPermission}
      />
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {renderHeaderRow()}
        {shouldRenderGrid && (
          <Box sx={{ 
            flex: 1, 
            minHeight: 0, 
            position: 'relative', 
            overflow: gridDimensions.totalHeight > window.innerHeight - 220 ? 'auto' : 'hidden',
            bgcolor: 'white',
            borderRadius: 1,
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
          }}>
            {GridComponent}
          </Box>
        )}
      </div>
      <ImportDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={onImport}
        currentPermissions={permissions}
      />
      <Dialog open={showExportScriptDialog} onClose={() => setShowExportScriptDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#ff9800', color: 'white' }}>Generate Script</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">Server Type</FormLabel>
            <RadioGroup
              row
              value={exportScriptOptions.serverType}
              onChange={e => setExportScriptOptions(opts => ({ ...opts, serverType: e.target.value as ServerType }))}
            >
              <FormControlLabel value="carbon" control={<Radio />} label="Carbon" />
              <FormControlLabel value="oxide" control={<Radio />} label="Oxide" />
            </RadioGroup>
          </FormControl>
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={exportScriptOptions.createGroups}
                  onChange={e => setExportScriptOptions(opts => ({ ...opts, createGroups: e.target.checked }))}
                />
              }
              label="Create groups if missing"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={exportScriptOptions.revokeBeforeGrant}
                  onChange={e => setExportScriptOptions(opts => ({ ...opts, revokeBeforeGrant: e.target.checked }))}
                />
              }
              label="Revoke permissions before granting"
            />
          </FormControl>
          <Button
            variant="contained"
            sx={{ mb: 2 }}
            onClick={handleExportScript}
          >
            Generate Script
          </Button>
          <TextareaAutosize
            minRows={8}
            style={{ width: '100%', fontFamily: 'monospace', marginTop: 8 }}
            value={exportScript}
            readOnly
            onFocus={(e: React.FocusEvent<HTMLTextAreaElement>) => e.target.select()}
          />
          <Button
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={() => {
              navigator.clipboard.writeText(exportScript);
              setShowCopied(true);
            }}
          >
            Copy to Clipboard
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExportScriptDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={showConfig} onClose={() => setShowConfig(false)}>
        <DialogTitle sx={{ bgcolor: '#3f51b5', color: 'white' }}>Server Configuration</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Server Type</InputLabel>
            <Select
              value={serverConfig.type}
              label="Server Type"
              onChange={(e) => setServerConfig({
                ...serverConfig,
                type: e.target.value as ServerType,
                commandPrefix: e.target.value === 'carbon' ? 'c.' : 'oxide.',
              })}
            >
              <MenuItem value="carbon">Carbon</MenuItem>
              <MenuItem value="oxide">Oxide</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Command Prefix"
            value={serverConfig.commandPrefix}
            onChange={(e) => setServerConfig({
              ...serverConfig,
              commandPrefix: e.target.value,
            })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfig(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={showCopied}
        autoHideDuration={2000}
        onClose={() => setShowCopied(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setShowCopied(false)}>
          Script copied to clipboard!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PermissionsGrid; 