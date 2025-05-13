# Rust Permissions Manager

A modern, efficient permissions management system built with Rust and React, designed to manage permissions and groups for Rust game servers.

## Live App

Visit the live app at [https://rustpermsmanager.thelms.co.uk](https://rustpermsmanager.thelms.co.uk).

## Features

- User-friendly interface for managing permissions and groups
- Role-based access control system
- Real-time updates and synchronization
- Import functionality for server permissions
- Save file management
- Automatic script generation for server configuration

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm (v10 or later)
- Rust game server (for plugin functionality)

## Using the Application

### Managing Permissions and Groups

1. **Manual Management**
   - Add permissions and groups directly through the interface
   - Assign permissions to groups
   - Configure permissions

2. **Import from Server**
   - Import existing permissions 
   - Add groups manually via interface
   - Configure permissions

3. **Save File Management**
   - Open existing save files
   - Export current configuration to save file
   - Backup and restore permissions

### Key Features

- **Update Permissions Button**: Allows import of all permission changes from the server. When updating permissions you will see what has been added, what has been removed and what is unchanged. Good for checking all plugins are still installed as expected

- **Generate Script Button**: Creates a ready-to-use rcon script for your Rust server. This script can be directly run via rcon to apply your permissions

## Rust Plugin

### Download

Download the latest version of the plugin from [Plugin Download Link](https://github.com/bal0o/RustPermissionsManager/releases/latest).

# PermissionsSync

A Rust plugin that synchronizes permissions from a JSON file to your server's permission system. This plugin is useful for maintaining consistent permissions across multiple servers or for easily managing complex permission setups.

## Features

- Sync permissions from a JSON file to your server
- Apply permissions on server startup
- Apply permissions on map wipe
- Option to remove existing permissions before applying new ones
- Automatically create missing groups
- Configurable startup delay
- Manual sync command for server administrators

## Installation

1. Place the `PermissionsSync.cs` file in your server's `oxide/plugins` directory
2. The plugin will automatically create its configuration file on first run
3. Create or place a save from the the app called `rust-permissions.json` in the `oxide/data/PermissionsSync` directory

## Configuration

The plugin can be configured through the `oxide/config/PermissionsSync.json` file:

```json
{
  "Apply on startup": false,
  "Apply on map wipe": true,
  "Remove existing permissions before applying": true,
  "Create groups if they don't exist": true,
  "Startup delay (seconds)": 300.0
}
```

### Configuration Options

- **Apply on startup**: When enabled, permissions will be synchronized when the server starts
- **Apply on map wipe**: When enabled, permissions will be synchronized when the map wipes
- **Remove existing permissions before applying**: When enabled, removes all existing permissions from groups before applying new ones
- **Create groups if they don't exist**: When enabled, automatically creates any groups that don't exist
- **Startup delay (seconds)**: Number of seconds to wait after server startup before applying permissions (default: 300)

## Permissions JSON Format

The permissions file should be placed at `oxide/data/PermissionsSync/rust-permissions.json`. Here's an example format:

```json
{
  "permissions": [
    {
      "name": "permission.name",
      "groups": ["group1", "group2"]
    },
    {
      "name": "another.permission",
      "groups": ["group1", "group3"]
    }
  ]
}
```

## Console Commands

- `syncperms` - Manually trigger permission synchronization (requires admin privileges)

## Notes

- The plugin will create a blank permissions file if one doesn't exist
- Permissions are only applied to groups that exist (unless CreateMissingGroups is enabled)
- The startup delay helps ensure all plugins are loaded before applying permissions
- Existing permissions are removed before applying new ones when configured to do so

## Support

If you encounter any issues or have questions, please report them on the plugin's repository.

## License

This project is licensed under the [MIT License](LICENSE).
