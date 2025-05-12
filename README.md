# Rust Permissions Manager

A web-based tool for managing Rust server permissions. This tool allows you to:
- Import and export permission configurations
- Manage permission groups
- Generate permission scripts for Carbon and Oxide servers
- Copy scripts to clipboard for manual execution

## Features

- Import permissions from server output
- Export permissions to JSON
- Generate permission scripts for Carbon and Oxide servers
- Support for creating groups and revoking permissions
- Modern, responsive UI with Material Design
- Real-time permission management
- Copy scripts to clipboard for manual execution

## Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Usage

1. Start the application using `npm run dev`
2. Open your browser to `http://localhost:3000`
3. Use the interface to:
   - Import existing permissions
   - Add/remove groups
   - Add/remove permissions
   - Generate scripts
   - Copy scripts to clipboard

## Script Generation

The tool can generate permission scripts for both Carbon and Oxide servers. When generating a script, you can:

- Choose between Carbon and Oxide server types
- Optionally create groups if they don't exist
- Optionally revoke all permissions before granting new ones
- Copy the generated script to clipboard for manual execution

## License

ISC 