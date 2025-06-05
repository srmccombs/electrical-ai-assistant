# 🚨 EMERGENCY ROLLBACK PROCEDURES

## Situation 1: "I broke something in develop!"

### Quick Fix:
```bash
# See last 5 commits
git log --oneline -5

# Go back to a working commit
git reset --hard <commit-hash>

# Force push to update GitHub
git push origin develop --force
```

## Situation 2: "Production is broken!"

### Immediate Action:
```bash
# 1. Switch to main
git checkout main

# 2. See recent commits
git log --oneline -10

# 3. Find the last working commit and revert
git revert <bad-commit-hash>

# 4. Push the fix
git push origin main

# Vercel will auto-deploy the fix!
```

## Situation 3: "I don't know what I did!"

### Nuclear Option (Start Fresh):
```bash
# 1. Save any important files elsewhere

# 2. Reset to match GitHub
git checkout main
git fetch origin
git reset --hard origin/main

# 3. You're back to the last pushed version!
```

## Situation 4: "I want yesterday's version!"

### Time Travel:
```bash
# 1. Find yesterday's commit
git log --since="2 days ago" --until="1 day ago" --oneline

# 2. Create a branch from that commit
git checkout -b recovery <commit-hash>

# 3. If it's good, merge it back
git checkout main
git merge recovery
```

## 🛟 Prevention Tips:

1. **Before any big change:**
   ```bash
   git checkout -b backup-$(date +%Y%m%d)
   ```

2. **Tag working versions:**
   ```bash
   git tag -a v1.0-working -m "Everything works here"
   git push origin v1.0-working
   ```

3. **Always work in feature branches**

## 📞 GitHub Rollback:

If all else fails, GitHub keeps everything:

1. Go to: https://github.com/srmccombs/electrical-ai-assistant
2. Click "Commits"
3. Find a working commit
4. Click "Browse repository at this point"
5. Download the working code

## 🎯 Quick Command Reference:

```bash
# "Show me what I changed"
git status

# "Show me recent commits"
git log --oneline -10

# "Go back one commit (keeping changes)"
git reset --soft HEAD~1

# "Go back one commit (discarding changes)"
git reset --hard HEAD~1

# "Get back to GitHub's version"
git fetch origin
git reset --hard origin/main
```

## Remember:
- Git NEVER truly deletes anything
- You can always recover
- When in doubt, make a backup branch first
- Your code is safe on GitHub