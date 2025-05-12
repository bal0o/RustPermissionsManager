const fs = require('fs');

const csv = fs.readFileSync('permissions.csv', 'utf-8');
const lines = csv.split(/\r?\n/).filter(Boolean);
const header = lines[0].split(',').map(h => h.trim());
const groups = header.slice(1).filter(g => g);

const permissions = lines.slice(1).map(line => {
  const cols = line.split(',');
  const name = cols[0].trim();
  const permGroups = groups.filter((g, i) => cols[i + 1] && cols[i + 1].trim().toUpperCase() === 'X');
  return { name, groups: permGroups };
});

const output = {
  permissions,
  groups
};

fs.writeFileSync('rust-permissions.json', JSON.stringify(output, null, 2));
console.log('rust-permissions.json created!');