# UNPARTY Build Status Generator

A dynamic tool for generating comprehensive build status reports for The UNPARTY App.

## Quick Start

```bash
# Run the status generator
./unparty-status

# Or use npm script
npm run status
```

This generates `unparty-status.md` with a complete breakdown of all routes, bundle sizes, and build statistics.

## What It Does

The status generator:

1. **Runs the Next.js build** - Executes the full build pipeline
2. **Parses build output** - Extracts route information dynamically (no hardcoded values)
3. **Analyzes statistics** - Categorizes routes by type (Static, SSG, Dynamic, etc.)
4. **Generates report** - Creates a markdown file with tables and summaries

## Generated Report Includes

### Build Summary
- Total routes count
- Breakdown by route type (Static, SSG, Dynamic, Lambda, ISR)
- Shared bundle size
- Middleware size

### Route Type Legend
- Visual guide to route symbols (○, ●, ƒ, λ, ◐)
- Explanation of each rendering strategy

### Complete Routes Table
- All routes with their paths
- Route type with symbol
- Individual route size
- First Load JS size per route

## Usage Examples

### Basic Usage
```bash
./unparty-status
```

### Using npm script
```bash
npm run status
```

### Advanced Usage
```bash
# Direct script invocation with Node
node scripts/unparty-status.js

# Use existing build (experimental)
./unparty-status --no-build
```

## Sample Output

```markdown
# UNPARTY Build Status Report

**Generated:** Monday, January 19, 2026 at 3:06:14 PM PST

## Build Summary

| Metric | Value |
|--------|-------|
| **Total Routes** | 113 |
| Static Pages | 61 |
| SSG Pages | 3 |
| Dynamic Pages | 49 |
| **Shared Bundle Size** | 102 kB |
| **Middleware Size** | 34.1 kB |

## All Routes (113)

| Route | Type | Size | First Load JS |
|-------|------|------|---------------|
| `/_not-found` | ○ Static | 1 kB | 103 kB |
| `/about` | ○ Static | 300 B | 117 kB |
...
```

## How It Works

### 1. Build Execution
The script runs `npm run build` and captures the complete stdout output.

### 2. Dynamic Parsing
Uses regex patterns to extract route information from build output:
- Route paths
- Type indicators (○, ●, ƒ, λ, ◐)
- Size metrics
- First Load JS values

### 3. Statistics Calculation
Analyzes parsed data to compute:
- Total routes by type
- Aggregate statistics
- Bundle size information

### 4. Markdown Generation
Creates formatted tables and summaries with:
- Timestamp
- Summary statistics
- Complete route listing
- Legend and documentation

## Features

### ✅ Fully Dynamic
- No hardcoded values
- Adapts to any number of routes
- Automatically detects all route types
- Handles new Next.js rendering strategies

### ✅ Comprehensive
- All routes included
- Size metrics for every route
- Shared bundle analysis
- Middleware size tracking

### ✅ Easy to Use
- Simple CLI interface
- Executable script (`./unparty-status`)
- npm script integration
- Clear error messages

### ✅ Well Documented
- Inline code comments
- This README
- Generated report includes legend
- Usage examples

## File Structure

```
theunpartyapp/
├── scripts/
│   └── unparty-status.js    # Main generator script
├── unparty-status            # Executable wrapper (bash)
├── unparty-status.md         # Generated report (gitignored)
└── README-STATUS.md          # This documentation
```

## Configuration

The script uses these default configurations (can be modified in `scripts/unparty-status.js`):

```javascript
const OUTPUT_FILE = 'unparty-status.md'
const BUILD_DIR = '.next'

const ROUTE_TYPES = {
  '○': 'Static',
  '●': 'SSG',
  'ƒ': 'Dynamic',
  'λ': 'Lambda',
  '◐': 'ISR'
}
```

## Integration

### With CI/CD

```yaml
# .github/workflows/build-report.yml
- name: Generate build status
  run: npm run status

- name: Upload report
  uses: actions/upload-artifact@v3
  with:
    name: build-status
    path: unparty-status.md
```

### Pre-deployment Check

```bash
# Run before deploying to check bundle sizes
npm run status
cat unparty-status.md
```

### Regular Monitoring

```bash
# Add to cron or scheduled tasks
0 */6 * * * cd /path/to/theunpartyapp && ./unparty-status
```

## Troubleshooting

### "No routes found in build output"
- Ensure build completes successfully
- Check that Next.js outputs route information
- Verify `npm run build` works standalone

### Script permission denied
```bash
chmod +x unparty-status
chmod +x scripts/unparty-status.js
```

### Node.js version issues
- Requires Node.js 14+ (ES modules support)
- Uses `import` syntax
- Check `node --version`

## Future Enhancements

Potential improvements:
- [ ] Compare with previous builds (trend analysis)
- [ ] Bundle size warnings/alerts
- [ ] JSON output option
- [ ] HTML report generation
- [ ] Performance metrics integration
- [ ] Lighthouse score integration

## Related Commands

```bash
npm run build      # Standard Next.js build
npm run status     # Generate status report
npm run start      # Start production server
```

## License

Part of The UNPARTY App project.

---

**Generated by:** `./unparty-status`
**Last updated:** Check the generated `unparty-status.md` file for latest timestamp
