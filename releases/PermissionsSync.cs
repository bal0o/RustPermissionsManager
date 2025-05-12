using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Oxide.Core;
using Oxide.Core.Libraries.Covalence;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace Oxide.Plugins
{
    [Info("Permissions Sync", "Bal0o", "1.0.0")]
    [Description("Syncs permissions from a JSON file to the server at startup / wipe or manually")]
    public class PermissionsSync : RustPlugin
    {
        #region Configuration
        private Configuration config;

        public class Configuration
        {
            [JsonProperty("Apply on startup")]
            public bool ApplyOnStartup { get; set; } = false;

            [JsonProperty("Apply on map wipe")]
            public bool ApplyOnMapWipe { get; set; } = true;

            [JsonProperty("Remove existing permissions before applying")]
            public bool RemoveExistingPermissions { get; set; } = true;

            [JsonProperty("Create groups if they don't exist")]
            public bool CreateMissingGroups { get; set; } = true;

            [JsonProperty("Permission required to use sync command")]
            public string SyncPermission { get; set; } = "permissionssync.admin";
        }

        protected override void LoadConfig()
        {
            base.LoadConfig();
            try
            {
                config = Config.ReadObject<Configuration>();
                if (config == null) LoadDefaultConfig();
            }
            catch
            {
                PrintError("Configuration file is corrupt! Generating new one...");
                LoadDefaultConfig();
            }
            SaveConfig();
        }

        protected override void LoadDefaultConfig()
        {
            config = new Configuration();
        }

        protected override void SaveConfig() => Config.WriteObject(config);
        #endregion

        #region Oxide Hooks
        private void Init()
        {
            permission.RegisterPermission(config.SyncPermission, this);
            cmd.AddConsoleCommand("syncperms", this, "CmdSyncPermissions");
            
            if (config.ApplyOnStartup)
            {
                // Delay for 5 minutes to ensure all plugins have loaded
                timer.Once(300f, () => ApplyPermissions());
            }
        }

        private void OnServerSave() => SaveConfig();

        private void OnMapWipe()
        {
            if (config.ApplyOnMapWipe)
            {
                ApplyPermissions();
            }
        }
        #endregion

        #region Commands
        private void CmdSyncPermissions(ConsoleSystem.Arg arg)
        {
            ApplyPermissions();
            Puts("Permissions have been synchronized!");
        }
        #endregion

        #region Core Methods
        private void ApplyPermissions()
        {
            string jsonPath = Path.Combine(Interface.Oxide.DataDirectory, "PermissionsSync", "rust-permissions.json");
            
            if (!File.Exists(jsonPath))
            {
                PrintWarning($"Permissions file not found at: {jsonPath}. Creating blank file...");
                
                // Ensure the directory exists
                Directory.CreateDirectory(Path.GetDirectoryName(jsonPath));
                
                // Create a blank permissions file
                var blankPermissions = new
                {
                    permissions = new object[] { }
                };
                
                File.WriteAllText(jsonPath, JsonConvert.SerializeObject(blankPermissions, Formatting.Indented));
                PrintWarning("Blank permissions file created. No permissions will be applied.");
                return;
            }

            try
            {
                PrintWarning("Starting permission synchronization...");
                string jsonContent = File.ReadAllText(jsonPath);
                var permissionsData = JsonConvert.DeserializeObject<JObject>(jsonContent);
                var permissions = permissionsData["permissions"] as JArray;

                if (permissions == null)
                {
                    PrintError("Invalid permissions file format!");
                    return;
                }

                PrintWarning($"Processing {permissions.Count} permissions...");

                // Get all unique groups from the permissions file
                var allGroups = permissions
                    .SelectMany(p => (p["groups"] as JArray)?.ToObject<List<string>>() ?? new List<string>())
                    .Distinct()
                    .ToList();

                // Create missing groups if configured
                if (config.CreateMissingGroups)
                {
                    foreach (var group in allGroups)
                    {
                        if (!permission.GroupExists(group))
                        {
                            permission.CreateGroup(group, group, 0);
                        }
                    }
                }

                if (config.RemoveExistingPermissions)
                {
                    // Remove all permissions from the groups we're going to modify
                    foreach (var group in allGroups)
                    {
                        if (!permission.GroupExists(group)) continue;

                        var existingPerms = permission.GetGroupPermissions(group);
                        foreach (var perm in existingPerms)
                        {
                            permission.RevokeGroupPermission(group, perm);
                        }
                    }
                }

                HashSet<string> uniquePerms = new HashSet<string>();
                HashSet<string> uniqueGroups = new HashSet<string>();

                foreach (var perm in permissions)
                {
                    string permName = perm["name"].ToString();
                    var groups = perm["groups"] as JArray;

                    if (groups == null || groups.Count == 0) continue;

                    bool permissionApplied = false;

                    // Grant the permission to each group
                    foreach (var group in groups)
                    {
                        string groupName = group.ToString();
                        if (!permission.GroupExists(groupName)) continue;

                        // Add this group to our unique set
                        uniqueGroups.Add(groupName);
                        permissionApplied = true;

                        try 
                        {
                            // First check if the permission is already granted
                            if (permission.GroupHasPermission(groupName, permName))
                                continue;

                            // Try to grant the permission using the permission library directly
                            permission.GrantGroupPermission(groupName, permName, null);
                        }
                        catch (System.Exception ex)
                        {
                            PrintError($"Failed to grant permission {permName} to group {groupName}: {ex.Message}");
                            PrintError($"Stack trace: {ex.StackTrace}");
                        }
                    }

                    // Only add to uniquePerms if the permission was actually applied to at least one group
                    if (permissionApplied)
                    {
                        uniquePerms.Add(permName);
                    }
                }

                PrintWarning($"Successfully processed {uniquePerms.Count} unique permissions across {uniqueGroups.Count} groups");
            }
            catch (System.Exception ex)
            {
                PrintError($"Error applying permissions: {ex.Message}");
            }
        }
        #endregion
    }
} 