# Rust Permissions Manager

A web-based tool for managing permissions for Rust servers. This tool allows you to easily configure and manage permissions for your Rust server using a user-friendly interface.

## Live Demo

You can use the live version of the app at [https://rust-permissions-manager.azurewebsites.net](https://rust-permissions-manager.azurewebsites.net).

## Features

- **User-Friendly Interface**: Easily manage permissions and groups with a modern, intuitive UI.
- **Import/Export**: Import existing permissions from your server or export your configuration for backup.
- **Generate Scripts**: Automatically generate server commands for applying permissions.
- **Customizable Settings**: Configure server type (Oxide/Carbon) and command prefixes.

## Rust Plugin

This tool is designed to work seamlessly with the Rust permissions system. The Rust plugin is a key part of the overall solution, providing the necessary backend functionality to apply permissions on your server.

### Plugin Options

- **Apply on startup**: Automatically apply permissions when the server starts (default: false)
- **Apply on map wipe**: Automatically apply permissions after a map wipe (default: true)
- **Remove existing permissions before applying**: Cleans up existing permissions before applying new ones (default: true)
- **Create groups if they don't exist**: Automatically creates groups that don't exist on the server (default: true)
- **Permission required to use sync command**: Permission node required to use the sync command (default: "permissionssync.admin")

### Commands

- `syncperms` - Manually trigger permission synchronization (requires permission: permissionssync.admin)

### Download the Plugin

You can download the Rust plugin from the following link:
[Download Rust Permissions Plugin](https://github.com/bal0o/RustPermissionsManager/raw/main/releases/PermissionsSync.cs)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
