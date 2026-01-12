# GitHub Actions Workflows Guide

## Overview

This project uses GitHub Actions for automated testing, code quality checks, releases, and npm publishing.

---

## 🧪 Workflows Included

### 1. **test.yml** - Continuous Testing
**Triggers:** Push to main/develop, Pull Requests, Daily schedule

**What it does:**
- Tests on Node.js 14.x, 16.x, 18.x, 20.x
- Runs coalescing test
- Runs error handling test
- Runs timeout test
- Tests example applications
- Validates file structure
- Runs security audit

**Configuration:**
```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
```

**Matrix Testing:**
- Node 14.x ✓
- Node 16.x ✓
- Node 18.x ✓
- Node 20.x ✓

---

### 2. **release.yml** - Release Management
**Triggers:** Tagged push (v*.*.*) or Manual workflow dispatch

**What it does:**
- Verifies tag format (vX.Y.Z)
- Validates version in package.json
- Runs complete test suite
- Creates GitHub Release
- Generates changelog
- Uploads release artifacts

**How to trigger:**
```bash
git tag v1.0.1
git push origin v1.0.1
```

**Or manually:**
- Go to Actions → Release → Run workflow
- Enter version number

**Version validation:**
```bash
# Tag must match package.json version
Tag: v1.0.1
package.json: "version": "1.0.1"
```

---

### 3. **publish.yml** - npm Publishing
**Triggers:** GitHub Release published or Manual dispatch

**What it does:**
- Tests package before publishing
- Verifies all required files
- Publishes to npm registry
- Confirms successful publication
- Creates publish notification

**Requirements:**
- Set `NPM_TOKEN` in repository secrets
- Valid npm account
- Proper npm access

**Setup npm token:**
1. Create token on npmjs.com (Account settings → Auth tokens)
2. Go to GitHub repo → Settings → Secrets
3. Create secret: `NPM_TOKEN` with token value

---

### 4. **quality.yml** - Code Quality
**Triggers:** Push to main/develop, Pull Requests

**What it does:**
- Validates code style
- Checks package.json validity
- Verifies module exports
- Confirms zero dependencies
- Audits dependencies
- Generates code statistics
- Verifies documentation

**Checks:**
- ✓ No production console.log statements
- ✓ Valid package.json
- ✓ All documentation files present
- ✓ Proper module exports
- ✓ Zero external dependencies
- ✓ README has required sections

---

## 🚀 How to Use

### Automatic Testing (on every push)
```bash
git push origin feature-branch
# Workflow automatically triggers
# Tests run on Node 14.x-20.x
# Results in Actions tab
```

### Creating a Release
```bash
# Update version in package.json
vi package.json  # Change version to 1.0.1

# Commit and tag
git add package.json
git commit -m "Bump version to 1.0.1"
git tag v1.0.1
git push origin main
git push origin v1.0.1

# release.yml workflow triggers automatically
# Creates GitHub Release
# publish.yml then triggers
# Package published to npm
```

### Manual Release (without tag)
1. Go to GitHub Actions
2. Select "Release" workflow
3. Click "Run workflow"
4. Enter version number (e.g., 1.0.1)
5. Click "Run workflow"

### Manual npm Publish
1. Go to GitHub Actions
2. Select "Publish to npm" workflow
3. Click "Run workflow"
4. Optionally specify tag
5. Click "Run workflow"

---

## 📊 Workflow Status

Check workflow status:
1. Go to GitHub repo
2. Click "Actions" tab
3. View running/completed workflows
4. Click workflow name for details

### Status badges for README:

```markdown
[![Test Suite](https://github.com/hogo-framework/hogo/actions/workflows/test.yml/badge.svg)](https://github.com/hogo-framework/hogo/actions/workflows/test.yml)
[![Code Quality](https://github.com/hogo-framework/hogo/actions/workflows/quality.yml/badge.svg)](https://github.com/hogo-framework/hogo/actions/workflows/quality.yml)
```

---

## 🔐 Secrets Configuration

### Required Secrets

**NPM_TOKEN** (for npm publishing)
1. Create npm token:
   - npmjs.com → Account → Auth Tokens
   - Create token with "Automation" type
   
2. Add to GitHub:
   - Repo Settings → Secrets → New repository secret
   - Name: `NPM_TOKEN`
   - Value: (paste token)

### Optional Secrets

Add as needed:
- `SLACK_WEBHOOK` - For Slack notifications
- `DISCORD_WEBHOOK` - For Discord notifications
- `EMAIL_TOKEN` - For email notifications

---

## 📝 Workflow Files

### test.yml
- **Location:** `.github/workflows/test.yml`
- **Runs:** On push, PR, schedule
- **Jobs:** test, test-examples, lint, security, build-report
- **Duration:** ~10-15 minutes

### release.yml
- **Location:** `.github/workflows/release.yml`
- **Runs:** On tag push or manual dispatch
- **Jobs:** check, test, create-release, notify
- **Duration:** ~5-10 minutes

### publish.yml
- **Location:** `.github/workflows/publish.yml`
- **Runs:** On release published or manual dispatch
- **Jobs:** publish, post-publish
- **Duration:** ~5 minutes

### quality.yml
- **Location:** `.github/workflows/quality.yml`
- **Runs:** On push, PR
- **Jobs:** analyze, dependencies, documentation
- **Duration:** ~3-5 minutes

---

## 🔄 Complete Release Process

### Automated Flow:
```
1. Developer: git push origin v1.0.1
   ↓
2. GitHub: release.yml triggers
   - Validates tag format
   - Runs all tests
   - Creates GitHub Release
   ↓
3. GitHub: publish.yml triggers automatically
   - Tests package again
   - Publishes to npm
   - Creates notification
   ↓
4. npm: Package available
   ↓
5. Users: npm install hogo@1.0.1
```

### Manual Process:
```
1. Update version in package.json
2. Commit changes
3. Create tag: git tag v1.0.1
4. Push: git push origin v1.0.1
5. GitHub automatically creates release
6. npm automatically publishes
7. Done!
```

---

## 🧪 Test Matrix Details

### Node.js Versions
- **14.x** - Legacy support
- **16.x** - LTS
- **18.x** - LTS (Recommended)
- **20.x** - Current

### Tests Run
1. **Coalescing Test** - 100 concurrent = 1 execution
2. **Error Handling Test** - Verify resilience
3. **Timeout Test** - Timeout protection
4. **File Structure** - Required files present
5. **Dependencies** - Verify zero dependencies
6. **Security Audit** - npm audit

---

## 📈 Monitoring

### View Test Results
```
GitHub → Actions → Workflow Name → Latest Run
```

### Artifact Downloads
- Test results uploaded for each Node version
- Release artifacts saved
- Available for 30 days

### Notifications
- Email on failure
- GitHub checks on PR
- Action required badge

---

## 🛠️ Troubleshooting

### Test Fails on Specific Node Version
1. Check error in GitHub Actions logs
2. Run locally on that version: `nvm use 14`
3. Run tests: `npm test`
4. Fix and push

### npm Publishing Fails
1. Verify NPM_TOKEN is set
2. Check token hasn't expired
3. Verify package name not taken
4. Check package.json validity

### Release Tag Not Creating Release
1. Verify tag format: `v1.0.1` (not `1.0.1`)
2. Verify version in package.json matches
3. Check GitHub Actions logs
4. Manually create release if needed

### Workflow Not Triggering
1. Check branch protection rules
2. Verify event triggers (push, PR, tag)
3. Check file paths in trigger
4. Restart Actions service

---

## 📋 Pre-Release Checklist

Before creating a release:
- [ ] Update version in package.json
- [ ] Update CHANGELOG.md
- [ ] Run tests locally: `npm run test:all`
- [ ] Test examples: `npm run example`
- [ ] Verify documentation up to date
- [ ] Check for console.log in production
- [ ] Commit all changes
- [ ] Create tag: `git tag v1.0.1`
- [ ] Push to GitHub

---

## 🎯 Best Practices

### Commit Messages
```
fix: Correct coalescing bug
feat: Add new middleware system
docs: Update README
chore: Update dependencies
```

### Branch Strategy
- `main` - Production code
- `develop` - Development code
- `feature/*` - Feature branches
- All merge via PR

### Testing
- Run tests before push: `npm test`
- Fix any failures before commit
- Use meaningful test names
- Document test purpose

### Releases
- Follow semantic versioning: `vX.Y.Z`
- Update CHANGELOG
- Create meaningful release notes
- Tag all releases

---

## 📚 Resources

### GitHub Actions Docs
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Workflow Syntax](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions)
- [Events](https://docs.github.com/actions/using-workflows/events-that-trigger-workflows)

### npm Publishing
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [npm Tokens](https://docs.npmjs.com/creating-and-viewing-authentication-tokens)

### Semantic Versioning
- [semver.org](https://semver.org/)
- [npm Versioning](https://docs.npmjs.com/about-semantic-versioning)

---

## ✅ Summary

All four workflows are configured and ready:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **test.yml** | Push, PR, Schedule | Run tests on all Node versions |
| **quality.yml** | Push, PR | Check code quality & docs |
| **release.yml** | Tag push | Create GitHub Release |
| **publish.yml** | Release published | Publish to npm |

**Everything is automated and production-ready!** 🚀

---

For questions, check the workflow files in `.github/workflows/` or GitHub Actions documentation.
