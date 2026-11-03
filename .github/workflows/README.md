# GitHub Workflows

## TypeCheck Workflow

The `typecheck.yml` workflow provides comprehensive TypeScript build checking and automated issue creation for deployment-blocking errors.

### Features

- **Automated Build Checking**: Runs `npm run build` on every push and PR
- **Error Categorization**: Separates blocking errors from warnings
- **GitHub Issue Creation**: Creates specific issues for each error with proper labeling
- **File-Specific Issues**: Links directly to the problematic code lines
- **Duplicate Prevention**: Avoids creating duplicate issues for the same errors

### Issue Labels

| Label | Color | Description |
|-------|-------|-------------|
| `blocking` | `#2a1314` | Errors that prevent deployment |
| `warning` | `#0d3868` | Non-blocking warnings |
| `typecheck` | `#1f2937` | Issues created by TypeCheck workflow |
| `automated` | `#6b7280` | Auto-generated issues |

### Error Types Detected

#### TypeScript Errors
- Type mismatches
- Missing imports
- Interface violations
- Unused variables/imports
- Property access errors

#### Runtime Errors  
- Missing environment variables
- Configuration issues
- API key problems (e.g., Stripe authentication)
- Dependency setup issues

### Issue Format

Each issue includes:
- **File path and line number** for precise error location
- **Error type and message** with full context
- **Direct links** to the problematic code
- **Workflow information** for traceability
- **Commit and branch** details

### Workflow Triggers

- **Push to main/develop**: Checks production/staging code
- **Pull Requests**: Validates changes before merge
- **Manual dispatch**: Can be triggered manually via GitHub UI

### Example Issues Created

```
🚨 BLOCKING TypeScript Error in src/app/api/book/route.ts:41
- File: src/app/api/book/route.ts
- Line: 41:71
- Error: Unexpected any. Specify a different type.
```

```
⚠️ WARNING TypeScript Warning in src/app/components/Blog.tsx:97
- File: src/app/components/Blog.tsx  
- Line: 97:37
- Warning: Using `<img>` could result in slower LCP...
```

### Benefits

1. **Deployment Safety**: Catches blocking errors before they reach production
2. **Code Quality**: Enforces TypeScript best practices through warnings
3. **Developer Productivity**: Creates actionable issues with direct links to problems
4. **Architecture Enforcement**: Helps maintain clean, typed codebase
5. **Visibility**: Makes build issues visible to the entire team

### Local Testing

You can test the workflow logic locally:

```bash
# Run build and capture output similar to workflow
npm run build > build-output.log 2>&1

# Check for TypeScript errors
grep -E "^\./" build-output.log

# Check for runtime errors  
grep -A5 -B5 "Error:" build-output.log
```

### Customization

To modify error detection patterns, edit the regex patterns in the workflow:

```yaml
# TypeScript error pattern
if [[ $line =~ ^(\./[^:]+):([0-9]+):([0-9]+)[[:space:]]+(Error|Warning):[[:space:]]*(.+)$ ]]; then

# Runtime error pattern  
grep -n "Error:" build-results/runtime-errors.log
```

### Maintenance

The workflow automatically:
- Creates labels if they don't exist
- Prevents duplicate issue creation
- Assigns issues to the commit author
- Uploads build artifacts for debugging

No manual maintenance is required for normal operation.