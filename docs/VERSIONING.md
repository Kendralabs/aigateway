#Release & Versioning Guide

This document describes the project's versioning scheme and release process.

## Versioning Strategy

KCG uses [Semantic Versioning 2.0.0](https://semver.org/) with a **release candidate (RC) workflow** for beta releases.

### Version Format

```
MAJOR.MINOR.PATCH[-rc.N]
```

Examples:
- `1.2.0` — Stable release
- `1.2.0-rc.1` — First release candidate for v1.2.0
- `1.2.0-rc.2` — Second release candidate (bug fixes)
- `2.0.0` — Major version bump (breaking changes)
- `1.3.0` — Minor version bump (new features, backward compatible)
- `1.2.1` — Patch version bump (bug fixes)

### When to Bump Versions

| Bump Type | When to Use | Example |
|-----------|-----------|---------|
| **Major** | Breaking API changes, major architectural changes | `1.2.0` → `2.0.0` |
| **Minor** | New features, new endpoints, backward compatible | `1.2.0` → `1.3.0` |
| **Patch** | Bug fixes, small improvements | `1.2.0` → `1.2.1` |
| **RC** | Release candidate (pre-release testing) | `1.2.0-rc.1` → `1.2.0-rc.2` |
| **Release** | Promote RC to stable | `1.2.0-rc.2` → `1.2.0` |

## Versioning Files

The project version is maintained in:

1. **`VERSION`** (root) — Single source of truth
   ```
   0.1.0-rc.1
   ```

2. **`pyproject.toml`** (backend) — Python package version
   ```toml
   version = "0.1.0-rc.1"
   ```

3. **`package.json`** (root) — Root package version
   ```json
   "version": "0.1.0-rc.1"
   ```

4. **`ui/kcg-dashboard/package.json`** (frontend) — UI package version
   ```json
   "version": "0.1.0-rc.1"
   ```

5. **`website/package.json`** (docs site) — kept in sync too, so the docs site's
   own package version never drifts from the product version
   ```json
   "version": "0.§.0-rc.1"
   ```

6. **Git tags** — Release history
   ```bash
   v0.1.0-rc.1
   v0.1.0-rc.2
   v0.1.0
   ```

## Bumping Versions Locally

Use the provided version management script to bump versions consistently across all files:

```bash
./scripts/bump-version.sh [major|minor|patch|rc|release]
```

### Examples

#### 1. Create First Release Candidate
Start development on a new minor/major release:

```bash
./scripts/bump-version.sh minor
# 1.1.0 → 1.2.0 (stable release)

# OR to start RC cycle:
git checkout -b release/1.2.0
./scripts/bump-version.sh rc
# Creates 1.2.0-rc.1
```

#### 2. Bump RC (Bug Fixes)
While in RC testing phase, create new RC with fixes:

```bash
./scripts/bump-version.sh rc
# 1.2.0-rc.1 → 1.2.0-rc.2
```

#### 3. Release to Stable
When RC testing is complete, promote to stable:

```bash
./scripts/bump-version.sh release
# 1.2.0-rc.2 → 1.2.0
```

#### 4. Create Patch Release
Quick fix on existing stable release:

```bash
./scripts/bump-version.sh patch
# 1.2.0 → 1.2.1
```

### What the Script Does

The `bump-version.sh` script:

1. ✅ Parses current version from `VERSION` file
2. ✅ Calculates new version based on bump type
3. ✅ Updates all version files (VERSION, pyproject.toml, package.json,
   ui/kcg-dashboard/package.json, website/package.json)
4. ✅ Creates git commit with message
5. ✅ Creates annotated git tag (e.g., `v1.2.0-rc.1`)
6. ✅ Provides next steps for pushing to GitHub

## Pre-Push Validation

A git hook enforces version sync before every push — it blocks the push if
`VERSION` doesn't match `pyproject.toml`/`package.json`/`ui/kcg-dashboard/package.json`/
`website/package.json`, or if any of those files have uncommitted changes.
Linting (ruff) and tests (pytest) also run but are warnings-only, non-blocking.

Canonical copy: `scripts/hooks/pre-push`. Install (once per clone):

```bash
cp scripts/hooks/pre-push .git/hooks/pre-push
chmod +x .git/hooks/pre-push
```

Bypass in an emergency with `git push --no-verify` (not recommended — fix the
underlying mismatch with `./scripts/bump-version.sh` instead).

## Release Process

### 1. Development Phase

Work normally on feature branches:

```bash
git checkout -b feature/awesome-feature
# Make commits...
git push origin feature/awesome-feature
```

### 2. Release Branch & RC

When ready for beta/release testing:

```bash
# Create release branch
git checkout -b release/1.2.0

# Bump to first RC
./scripts/bump-version.sh rc
# Creates: VERSION, commits, tags v1.2.0-rc.1

# Fix bugs found during testing
git commit -am "fix: critical bug in feature X"

# Bump to RC.2 if needed
./scripts/bump-version.sh rc
# v1.2.0-rc.1 → v1.2.0-rc.2
```

### 3. Release to Stable

When RC is stable enough for production:

```bash
./scripts/bump-version.sh release
# v1.2.0-rc.2 → v1.2.0
```

### 4. GitHub Release

Push commits and tags to trigger the automated workflow:

```bash
git push origin release/1.2.0
git push origin v1.2.0-rc.1 v1.2.0-rc.2 v1.2.0
```

The GitHub Actions workflow automatically:
- ✅ Detects new tags (v*.*.*)
- ✅ Creates GitHub Release with changelog
- ✅ Marks RC versions as pre-release
- ✅ Builds and publishes packages (Python, Docker, npm)
- ✅ Deploys documentation (stable releases only)

### 5. Merge Release Branch

After release is stable:

```bash
git checkout main
git pull origin main
git merge release/1.2.0
git push origin main
```

## Version Synchronization

All version files are kept in sync by `bump-version.sh`:

```bash
# Check current versions
cat VERSION
grep version pyproject.toml | head -1
grep version package.json | head -1
grep version ui/kcg-dashboard/package.json | head -1

# After running bump-version.sh, all should match
```

## GitHub Actions Workflow

The project includes `.github/workflows/release.yml` which:

1. **Triggers on new tags** (pushed to GitHub)
2. **Reads VERSION file** to determine version
3. **Detects pre-release** (if tag contains `-rc`, `-alpha`, `-beta`)
4. **Creates GitHub Release** with auto-generated changelog
5. **Builds packages** (Python/Node.js)
6. **Publishes artifacts** (npm, PyPI, Docker registry)
7. **Deploys docs** (only for stable releases)

### Workflow Status

View workflow runs: https://github.com/Kendralabs/kcg/actions/workflows/release.yml

## Release Checklist

Before creating a release:

- [ ] All commits merged to main/release branch
- [ ] Tests passing (`poetry run pytest`, `npm test`)
- [ ] Changelog/release notes updated
- [ ] Version bumped via `./scripts/bump-version.sh`
- [ ] Git tag pushed to GitHub
- [ ] GitHub Actions workflow completed successfully
- [ ] Release notes reviewed on GitHub Releases page
- [ ] Announce release (email, Slack, etc.)

## Common Scenarios

### Scenario 1: Regular Development → Release

```bash
# After several features merged to main...
git checkout -b release/1.2.0

# First RC
./scripts/bump-version.sh rc
# → v1.2.0-rc.1

# Test, find bugs, fix them...
git commit -am "fix: bug in feature X"

# Bump RC for re-testing
./scripts/bump-version.sh rc
# → v1.2.0-rc.2

# Everything stable, release to production
./scripts/bump-version.sh release
# → v1.2.0

git push origin release/1.2.0 v1.2.0-rc.1 v1.2.0-rc.2 v1.2.0
# GitHub Actions creates release, builds, publishes

git checkout main
git merge release/1.2.0
git push origin main
```

### Scenario 2: Hot Fix Patch Release

```bash
# Critical bug found in production v1.2.0
git checkout -b hotfix/1.2.1
git merge main  # ensure we're on latest

# Fix the bug
git commit -am "fix: critical production bug"

# Bump patch version
./scripts/bump-version.sh patch
# → v1.2.1

git push origin hotfix/1.2.1 v1.2.1
# GitHub Actions creates release

git checkout main
git merge hotfix/1.2.1
git push origin main
```

### Scenario 3: Major Version Release

```bash
git checkout -b release/2.0.0

# Major bump (breaking changes)
./scripts/bump-version.sh major
# → v2.0.0-rc.1

# Or bump from RC if RC cycle already started
./scripts/bump-version.sh rc

# When ready
./scripts/bump-version.sh release
# → v2.0.0

git push origin release/2.0.0 v2.0.0
```

## Troubleshooting

### Version mismatch across files

```bash
# Check all versions
echo "VERSION:" $(cat VERSION)
echo "pyproject.toml:" $(grep '^version' pyproject.toml)
echo "package.json:" $(grep version package.json | head -1)
echo "dashboard:" $(grep version ui/kcg-dashboard/package.json | head -1)
```

### Git tag already exists

```bash
# If tag exists but commit changed:
git tag -d v1.2.0           # Delete local
git push origin :refs/tags/v1.2.0  # Delete remote
./scripts/bump-version.sh release  # Re-create
```

### Workflow didn't trigger

- Verify tag format: `v1.2.0` or `v1.2.0-rc.1`
- Check workflow file: `.github/workflows/release.yml`
- View workflow runs: https://github.com/Kendralabs/kcg/actions

## References

- [Semantic Versioning 2.0.0](https://semver.org/)
- [GitHub Release Automation](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
- [Git Tagging](https://git-scm.com/book/en/v2/Git-Basics-Tagging)
