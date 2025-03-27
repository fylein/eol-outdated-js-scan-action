const fs = require('fs');

const filePath = 'reports/dependency-check-report.json';
if (!fs.existsSync(filePath)) {
    console.log('No dependency-check JSON report found.');
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `vuln_count=0\ncomment<<EOF\n\nEOF\n`);
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
    CRITICAL: '🔴',
    HIGH: '🟠',
    MEDIUM: '🟡',
    LOW: '🟢'
};

// Define sort order for severity (lower number means higher priority)
const sortOrder = {
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 3,
    LOW: 4
};

// Prepare table header with columns: Dependency Path, Dependency Name, CVE, Severity
let tableHeader = '| Dependency Path | Dependency Name |   CVE   |   Severity   |\n';
tableHeader += '|-----------------|-----------------|---------|--------------|\n';

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

// Sort the vulnerability rows by severity using sortOrder mapping.
vulnRows.sort((a, b) => {
    const orderA = sortOrder[a.severity] || 99;
    const orderB = sortOrder[b.severity] || 99;
    return orderA - orderB;
});

const vulnCount = vulnRows.length;
fs.appendFileSync(process.env.GITHUB_OUTPUT, `vuln_count=${vulnCount}\n`);

if (vulnCount === 0) {
    console.log("No vulnerabilities found. Not posting comment.");
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `comment<<EOF\n\nEOF\n`);
    process.exit(0);
}

// Calculate dynamic counts
const criticalHighCount = vulnRows.filter(v => v.severity === 'CRITICAL' || v.severity === 'HIGH').length;
const totalVulnCount = vulnCount;

// Create header text with dynamic counts.
let headerText = `### 🔍 End of Life and Outdated JS Scan Results\n\n`;
if (criticalHighCount > 0) {
    headerText += `⛔️ **Action Required:** ${criticalHighCount} Critical/High severity vulnerabilities found\n\n`;
}
headerText += `Found ${totalVulnCount} total vulnerabilities\n`;

let footerText = '\n### Remediation\n';
if (criticalHighCount > 0) {
    footerText += `⚠️ **Action Required:** Critical/High severity vulnerabilities must be fixed before merging\n\n`;
}
footerText += `- Update vulnerable packages to their fixed versions where available\n`;
footerText += `- Run \`dependency-check\` locally to see more details\n`;

// Convert sorted objects to Markdown table rows
const rows = vulnRows.map(item =>
    `| ${item.relativePath} | ${item.depName} | ${item.cve} | ${item.severityDisplay} |`
);

const markdownTable = tableHeader + rows.join('\n');
const commentBody = `${headerText}${markdownTable}${footerText}`;

fs.appendFileSync(process.env.GITHUB_OUTPUT, `comment<<EOF\n${commentBody}\nEOF\n`);
