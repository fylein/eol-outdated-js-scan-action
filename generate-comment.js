import fs from 'fs';

const filePath = 'reports/dependency-check-report.json';
if (!fs.existsSync(filePath)) {
  console.log('No dependency-check JSON report found.');
  process.exit(0);
}

let report;
try {
  report = JSON.parse(fs.readFileSync(filePath, 'utf8'));
} catch (err) {
  console.log('Error parsing JSON:', err);
  process.exit(1);
}

// Emoji mapping for severity levels
const emojiMapping = {
  CRITICAL: '🚨',
  HIGH: '🔴',
  MEDIUM: '⚠️',
  LOW: '✅'
};

// Define sort order for severity (lower number means higher priority)
const sortOrder = {
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4
};

// Prepare table header with columns: Dependency Path, Dependency Name, CVE, Severity
let tableHeader = '| Dependency Path | Dependency Name | CVE | Severity |\n';
tableHeader += '|-----------------|-----------------|-----|----------|\n';

// Collect vulnerability rows as objects for sorting
const vulnRows = [];
if (Array.isArray(report.dependencies)) {
  for (const dep of report.dependencies) {
    // Remove "/github/workspace/" prefix to get relative path
    const fullPath = dep.filePath || '-';
    const relativePath = fullPath.replace(/^\/github\/workspace\//, '');
    const depName = dep.fileName || '-';
    if (Array.isArray(dep.vulnerabilities) && dep.vulnerabilities.length > 0) {
      for (const vuln of dep.vulnerabilities) {
        const cve = vuln.name || '-';
        // Determine severity and emoji display
        const severity = (vuln.cvssv3 && vuln.cvssv3.baseSeverity) ? vuln.cvssv3.baseSeverity : '-';
        const severityUpper = severity.toUpperCase();
        let severityDisplay = severity;
        if (severity !== '-' && emojiMapping[severityUpper]) {
          severityDisplay = `${severity} ${emojiMapping[severityUpper]}`;
        }
        vulnRows.push({
          relativePath,
          depName,
          cve,
          severity: severityUpper, // use uppercase for sorting
          severityDisplay
        });
      }
    }
  }
}

/*
 * Sort the vulnerability rows by severity using sortOrder mapping.
 * Vulnerabilities with an unrecognized severity are sorted last.
 */
vulnRows.sort((a, b) => {
  const orderA = sortOrder[a.severity] || 99;
  const orderB = sortOrder[b.severity] || 99;
  return orderA - orderB;
});

// Calculate dynamic counts
const criticalHighCount = vulnRows.filter(v => v.severity === 'CRITICAL' || v.severity === 'HIGH').length;
const totalVulnCount = vulnRows.length;

// Create header text with dynamic counts and a large header for the scan results
const headerText = `# 🔍 Security Scan Results\n\n⛔️ Action Required: ${criticalHighCount} Critical/High severity vulnerabilities found\nFound ${totalVulnCount} total vulnerabilities\n`;

// Convert sorted objects to Markdown table rows
const rows = vulnRows.map(item =>
  `| ${item.relativePath} | ${item.depName} | ${item.cve} | ${item.severityDisplay} |`
);

// Build the final comment body
let commentBody;
if (rows.length === 0) {
  commentBody = `🛡️ **Dependency-Check Report**\n\nNo vulnerabilities were found in the scan.`;
} else {
  const markdownTable = tableHeader + rows.join('\n');
  commentBody = `🛡️ **Dependency-Check Report**\n\n${headerText}${markdownTable}`;
}

// Output the comment body to stdout
console.log(commentBody);
