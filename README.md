# End of Life and Outdated JS Scan Action

This GitHub Action scans your repository for end of life and outdated javascript vulnerabilities using [dependency-check](https://github.com/dependency-check/DependencyCheck), providing detailed scan results as PR comments.

## Features

- 🔍 Comprehensive vulnerability scanning of your codebase
- 📊 Detailed vulnerability reports as PR comments
- 🚫 Automatic PR blocking for Critical/High severity vulnerabilities
- 📝 Organized vulnerability reporting by severity and package
- 🔄 Support for suppressing false positives

## Usage

Add the following workflow to your repository (e.g., `.github/workflows/eol-outdated-js-scan.yml`):

```yaml
name: End of Life and Outdated JS Scan

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: lts/*

      - name: Install modules
        run: npm ci

      - name: Run Scanner
        uses: fylein/eol-outdated-js-scan-action@master
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          project: 'example-project'
```


## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `token` | GitHub token for creating PR comments | Yes | N/A |
| `project` | The name of the project being scanned | Yes | N/A |
| `path` | The path to scan | No | `.` |
| `suppression_file` | The file path to the suppression XML file. | No | N/A |

## Examples

### Basic Usage

```yaml
- name: End of Life and Outdated JS Scan
  uses: fylein/eol-outdated-js-scan-action@master
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    project: 'example-project'
```

### Suppressing Vulnerabilities

```yaml
- name: End of Life and Outdated JS Scan
  uses: fylein/eol-outdated-js-scan-action@master
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    project: 'example-project'
    suppression_file: 'suppression.xml'
```

## Output

The action provides:

1. A detailed PR comment containing:
   - Total vulnerability count
   - Breakdown by severity (Critical, High, Medium, Low)
   - Detailed information for each vulnerability, grouped by package
   - Remediation suggestions

2. Automatic PR blocking if Critical/High severity vulnerabilities are found

Example PR comment:
##
### 🔍 End of Life and Outdated JS Scan Results

⛔️ Action Required: 1 Critical/High severity vulnerabilities found

Found 2 total vulnerabilities
| Dependency Path | Dependency Name |   CVE   |   Severity   |
|-----------------|-----------------|---------|--------------|
| package-lock.json?/vuln_pkg:1.2.3 | vuln_pkg:1.2.3 | CVE-2025-12345 | CRITICAL 🔴 |
| package-lock.json?/vuln_pkg:1.2.3 | vuln_pkg:1.2.3 | CVE-2025-12346 | MEDIUM 🟡 |

### Remediation

⚠️ Action Required: Critical/High severity vulnerabilities must be fixed before merging

- Update vulnerable packages to their fixed versions where available
- Run `dependency-check` locally to see more details
##

## Behavior

- The action will fail if any Critical or High severity vulnerabilities are found
- Vulnerabilities are grouped by severity and package for easy review
- Each vulnerability includes:
  - Dependency path
  - Dependency name
  - CVE
  - Severity level

## Local Testing

To run the same scan locally:

1. Install dependency-check:
```bash
brew install dependency-check
```

2. Run the scan:
```bash
dependency-check --scan . --format CSV --exclude "**/node_modules/**"
```

## License

[MIT License](LICENSE)
