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

- **Server Type**: Choose between Oxide and Carbon.
- **Command Prefix**: Set the command prefix for your server (e.g., `oxide.` or `c.`).
- **Create Groups**: Option to automatically create groups if they don't exist.
- **Revoke Before Grant**: Option to revoke permissions before granting them to ensure a clean state.

### Download the Plugin

You can download the Rust plugin from the following link:
[Download Rust Permissions Plugin](https://github.com/bal0o/RustPermissionsManager/releases/latest)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
