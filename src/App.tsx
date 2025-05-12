import { useState } from 'react';
import { Box, Container, Typography, Paper, Button } from '@mui/material';
import PermissionsGrid from './components/PermissionsGrid';
import { PermissionData, ServerConfig } from './types';
import { generateServerCommands } from './utils/permissionParser';
import BuyMeCoffeeButton from './components/BuyMeCoffeeButton';
import HelpIcon from '@mui/icons-material/Help';

function App() {
  const [permissions, setPermissions] = useState<PermissionData[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [serverConfig] = useState<ServerConfig>({
    type: 'oxide',
    commandPrefix: 'oxide.',
  });

  const handleImport = (data: { permissions: PermissionData[], groups: string[] }) => {
    const filtered = data.permissions.filter(p => p.name && p.name.trim() !== '');
    const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    setPermissions(sorted);
    setGroups(data.groups);
  };

  const handleExport = () => {
    const data = {
      permissions,
      groups,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rust-permissions.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportScript = () => {
    const commands = generateServerCommands(permissions, serverConfig);
    const blob = new Blob([commands], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rust-permissions.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ 
      height: '100vh', 
      width: '100vw', 
      bgcolor: '#e8eaf6', 
      overflow: 'auto',
      background: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)'
    }}>
      <Container maxWidth={false} disableGutters sx={{ height: '100%', width: '100%' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: '1px solid rgba(63, 81, 181, 0.2)',
            background: 'rgba(255,255,255,0.7)',
            borderRadius: '4px 4px 0 0',
            p: 2
          }}>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                color: '#3f51b5',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
              }}
            >
              Rust Permissions Manager
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<HelpIcon />}
                href="https://github.com/bal0o/RustPermissionsManager/blob/main/README.md"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ 
                  borderColor: '#3f51b5', 
                  color: '#3f51b5',
                  '&:hover': {
                    borderColor: '#1a237e',
                    backgroundColor: 'rgba(63, 81, 181, 0.04)'
                  }
                }}
              >
                Help
              </Button>
              <BuyMeCoffeeButton />
            </Box>
          </Box>
          <Paper sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: 0, 
            p: 0, 
            m: 2,
            overflow: 'hidden',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <PermissionsGrid
              permissions={permissions}
              groups={groups}
              onPermissionsChange={setPermissions}
              onGroupsChange={setGroups}
              onImport={handleImport}
              onExport={handleExport}
              onExportScript={handleExportScript}
            />
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}

export default App; 