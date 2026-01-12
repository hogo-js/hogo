# GitHub Actions Workflow Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GITHUB REPOSITORY                        │
│  (hogo-framework/hogo)                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
              ┌─────────────┬─────────────┐
              ↓             ↓             ↓
         ┌────────┐   ┌─────────┐   ┌────────┐
         │ MAIN   │   │ DEVELOP │   │ TAGS   │
         │BRANCH  │   │ BRANCH  │   │ vX.Y.Z │
         └────────┘   └─────────┘   └────────┘
              │             │             │
    ┌─────────┴─────────┐   │   ┌─────────┴─────────┐
    ↓                   ↓   ↓   ↓                   ↓
┌─────────┐        ┌─────────┐              ┌──────────┐
│ test.yml│        │quality. │              │release.  │
│         │        │yml      │              │yml       │
└─────────┘        └─────────┘              └──────────┘
    ↓                   ↓                       ↓
 Tests Fail?         Quality Fail?         Release Created
    │                   │                    ✅ YES
    ├─ ❌ Block PR      ├─ ❌ Block PR        │
    │                   │               ┌─────↓─────┐
    └─ ✅ Pass          └─ ✅ Pass      │publish.yml│
         ↓                   ↓         └─────┬─────┘
       READY              READY              ↓
       TO MERGE          TO MERGE      Publish to npm
       TO RELEASE        TO RELEASE         ✅ DONE
```

---

## 📊 Workflow Sequence Diagram

### Complete Release Flow

```
Developer                   GitHub              npm Registry
   │                          │                        │
   │─ git push main ────────→│                        │
   │                          │                        │
   │                    ┌─────┴──────┐                │
   │                    │ test.yml    │                │
   │                    │ quality.yml │                │
   │                    │ Run         │                │
   │                    └─────┬──────┘                │
   │                          │                        │
   │                    ┌─────┴──────┐                │
   │                    │Tests Pass?  │                │
   │                    └─────┬──────┘                │
   │                          │                        │
   │                    ✅ YES│                        │
   │                          │                        │
   │─ git tag v1.0.0 ───────→│                        │
   │                          │                        │
   │                    ┌─────┴──────┐                │
   │                    │release.yml  │                │
   │                    │ Validate    │                │
   │                    │ Test        │                │
   │                    │ Release     │                │
   │                    └─────┬──────┘                │
   │                          │                        │
   │                    ✅ Release Created             │
   │                          │                        │
   │                    ┌─────┴──────┐                │
   │                    │publish.yml  │                │
   │                    │ Publish     │                │
   │                    └─────┬──────→├────────────┐  │
   │                          │       │ Publishing │  │
   │                          │       └────────────┘  │
   │                          │                        │
   │                          │            ┌──────────┴─┐
   │                          │            │Package     │
   │                          │            │Available   │
   │                          │            └────────────┘
   │                          │                        │
   │←─ ✅ Notification ───────│                        │
   │                          │                        │

```

---

## 🔄 Event Triggers

### Push to Main/Develop
```
Push event
   ↓
├─ test.yml runs
│  ├─ Node 14.x tests
│  ├─ Node 16.x tests
│  ├─ Node 18.x tests
│  ├─ Node 20.x tests
│  ├─ Security audit
│  └─ Example validation
│
└─ quality.yml runs
   ├─ Code analysis
   ├─ Dependency check
   └─ Documentation verification
```

### Pull Request
```
PR created/updated
   ↓
├─ test.yml runs
│  └─ Block merge if fails
│
└─ quality.yml runs
   └─ Block merge if fails
```

### Tag Push (v*.*.*)
```
Tag v1.0.0 pushed
   ↓
├─ release.yml runs
│  ├─ Validates tag format
│  ├─ Checks version match
│  ├─ Runs tests
│  └─ Creates GitHub Release
│
└─ publish.yml runs (auto-triggered)
   ├─ Tests again
   ├─ Publishes to npm
   └─ Confirms success
```

### Schedule
```
Daily at 2 AM UTC
   ↓
test.yml runs
   ├─ Security check
   ├─ All tests
   └─ Catches issues early
```

---

## 🎯 Decision Flow

### For Push/PR
```
Code pushed
   ↓
Run test.yml
   ├─ All Node versions
   ├─ All tests
   └─ Security audit
   ↓
   ├─ ❌ FAIL → Notify developer
   │           (PR can't merge)
   │
   └─ ✅ PASS
       ↓
    Run quality.yml
       ├─ Code style
       ├─ Dependencies
       └─ Documentation
       ↓
       ├─ ❌ FAIL → Notify developer
       │           (PR can't merge)
       │
       └─ ✅ PASS
           ↓
        ✅ Ready to merge!
```

### For Release Tag
```
Tag v1.0.0 pushed
   ↓
Run release.yml
   ├─ Check tag format
   │  └─ Must be vX.Y.Z
   │
   ├─ Check version match
   │  └─ package.json version = tag
   │
   ├─ Run full test suite
   │  └─ All tests must pass
   │
   └─ Create Release
      └─ Auto-triggers publish.yml
       ↓
    Run publish.yml
       ├─ Test again
       ├─ Publish to npm
       └─ Confirm success
       ↓
    ✅ Package on npm!
```

---

## 📈 Job Dependencies

### test.yml Jobs
```
              ┌────────┐
              │install │ (implicit)
              └───┬────┘
          ┌───────┴───────┐
          ↓               ↓
       ┌─────────────────────────────┐
       │   test (matrix 4 versions)  │
       │   - coalesce.test.js         │
       │   - error-handling.test.js   │
       │   - timeout.test.js          │
       └───────────────┬──────────────┘
                       ↓
       ┌──────────────────────────────┐
       │      test-examples           │
       │  (after test matrix)          │
       └───────────────┬───────────────┘
                       ↓
       ┌──────────────────────────────┐
       │         lint                 │
       │ (independent, parallel)      │
       └───────────────┬───────────────┘
                       ↓
       ┌──────────────────────────────┐
       │       security               │
       │ (independent, parallel)      │
       └───────────────┬───────────────┘
                       ↓
       ┌──────────────────────────────┐
       │    build-report (if always)  │
       │ (runs regardless of failures)│
       └──────────────────────────────┘
```

### release.yml Jobs
```
          ┌────────┐
          │ check  │ (first)
          └───┬────┘
              ↓
          ┌────────┐
          │ test   │ (depends on check)
          └───┬────┘
              ↓
    ┌──────────────────┐
    │ create-release   │ (depends on test)
    └────────┬─────────┘
             ↓
    ┌──────────────────┐
    │    notify        │ (depends on create-release)
    └──────────────────┘
    │ (publish.yml auto-triggers here)
```

### publish.yml Jobs
```
          ┌────────┐
          │publish │
          └───┬────┘
              ↓
       ┌────────────────┐
       │ post-publish   │ (depends on publish)
       └────────────────┘
```

---

## 🔀 Status Check Flow

### GitHub Branch Protection
```
PR created
   ↓
├─ Required checks start
│  ├─ test.yml status
│  └─ quality.yml status
│
├─ Can merge if:
│  ├─ All checks pass ✅
│  ├─ Approved by reviewer
│  └─ No conflicts
│
└─ Can't merge if:
   ├─ Any check fails ❌
   └─ (until fixed and re-run)
```

---

## 📊 Resource Usage

### per Workflow Run
```
test.yml
├─ Node 14.x: ~2 min
├─ Node 16.x: ~2 min
├─ Node 18.x: ~2 min
├─ Node 20.x: ~2 min
├─ Examples: ~30 sec
├─ Lint: ~30 sec
├─ Security: ~30 sec
└─ Total: ~10-12 min

quality.yml
├─ Analyze: ~1 min
├─ Dependencies: ~1 min
├─ Documentation: ~1 min
└─ Total: ~3-4 min

release.yml
├─ Check: ~1 min
├─ Test: ~10 min
├─ Release: ~1 min
├─ Notify: ~30 sec
└─ Total: ~12 min

publish.yml
├─ Test: ~10 min
├─ Publish: ~1 min
└─ Total: ~11 min
```

### Monthly Estimate
```
4 releases per month:
├─ Push (4 × 13 min): 52 min
├─ Release (4 × 12 min): 48 min
├─ Publish (4 × 11 min): 44 min
└─ Total: ~144 minutes (well under 2,000 limit)
```

---

## 🎯 Success Criteria

### test.yml Success
```
✅ All Node versions pass
✅ All tests pass
✅ Examples start without error
✅ No security vulnerabilities
✅ File structure valid
```

### quality.yml Success
```
✅ Code style acceptable
✅ Package.json valid
✅ Module exports work
✅ Zero dependencies confirmed
✅ All documentation present
```

### release.yml Success
```
✅ Tag format valid (vX.Y.Z)
✅ Version matches package.json
✅ All tests pass
✅ GitHub Release created
✅ Artifacts uploaded
```

### publish.yml Success
```
✅ All tests pass again
✅ Package contents valid
✅ Publishes to npm successfully
✅ Package queryable on npm
✅ Correct version set
```

---

## 🚨 Failure Handling

### If test.yml Fails
```
❌ Tests failed
   ├─ Notification sent
   ├─ PR marked as failing
   └─ Can't merge until fixed
   
Developer action:
├─ Review error logs
├─ Fix code locally
├─ Push fix
└─ Workflow re-runs
```

### If quality.yml Fails
```
❌ Quality check failed
   ├─ Notification sent
   ├─ PR marked as failing
   └─ Can't merge until fixed

Developer action:
├─ Review quality issues
├─ Fix documentation/code
├─ Push fix
└─ Workflow re-runs
```

### If release.yml Fails
```
❌ Release failed
   ├─ No GitHub Release created
   ├─ No publish.yml triggered
   └─ Manual intervention needed

Developer action:
├─ Review failure logs
├─ Fix issue (usually version mismatch)
├─ Create new tag
└─ Try release again
```

### If publish.yml Fails
```
❌ Publish failed
   ├─ GitHub Release exists
   ├─ Package NOT on npm
   └─ Manual intervention needed

Developer action:
├─ Check NPM_TOKEN validity
├─ Verify package name
├─ Check npm account
└─ Manual publish if needed
   npm publish
```

---

## 🔐 Access Control

### Secrets
```
NPM_TOKEN (encrypted)
├─ Only available to workflow
├─ Not shown in logs
├─ Can be rotated anytime
└─ Limited to npm authentication
```

### Permissions
```
test.yml
├─ Read repository
└─ Check code only

release.yml
├─ Read repository
└─ Write releases
```

---

## 📋 Maintenance

### Periodic Tasks
```
Monthly:
├─ Check workflow logs
├─ Review any failures
└─ Update if needed

Quarterly:
├─ Rotate NPM_TOKEN
├─ Review Node versions
└─ Update workflows if needed

Yearly:
├─ Archive old releases
├─ Update documentation
└─ Plan for next year
```

---

**Visual Architecture Documentation Complete!** 📊

All workflows are documented with decision flows, dependencies, and status checks. 🎉
