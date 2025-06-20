# Professional Git Workflow Guide

## 🌳 Branch Strategy

### Main Branches:
- **main** (or master) - Production code (what Vercel deploys)
- **develop** - Development branch (for testing new features)

### Feature Branches:
- **feature/feature-name** - For new features
- **fix/bug-name** - For bug fixes
- **improve/improvement-name** - For improvements

## 📝 Daily Workflow

### Starting Work:
```bash
# 1. Always start from develop branch
git checkout develop

# 2. Pull latest changes
git pull origin develop

# 3. Create a new feature branch
git checkout -b feature/your-feature-name
```

### While Working:
```bash
# Save your work frequently
git add .
git commit -m "feat: describe what you did"

# Push to GitHub (backup)
git push origin feature/your-feature-name
```

### Commit Message Format:
- `feat:` New feature
- `fix:` Bug fix
- `improve:` Enhancement
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring

### Finishing Work:
```bash
# 1. Push final changes
git add .
git commit -m "feat: completed feature description"
git push origin feature/your-feature-name

# 2. Create Pull Request on GitHub
# 3. Merge to develop for testing
# 4. When ready, merge develop to main
```

## 🔄 Rollback Commands

### Undo Last Commit (keep changes):
```bash
git reset --soft HEAD~1
```

### Undo Last Commit (discard changes):
```bash
git reset --hard HEAD~1
```

### Go Back to Previous Version:
```bash
# Find the commit you want
git log --oneline

# Go back to that commit
git checkout <commit-hash>
```

### Emergency: Revert on Production:
```bash
# This creates a new commit that undoes changes
git revert <bad-commit-hash>
git push origin main
```

## 🛡️ Safety Rules

1. **Never commit directly to main**
2. **Always work in feature branches**
3. **Test in develop before main**
4. **Commit frequently (every 30-60 min)**
5. **Write clear commit messages**

## 🚀 Vercel Setup

### For Testing:
1. Create a preview deployment from develop branch
2. Test thoroughly before merging to main

### Production:
- Only main branch deploys to production
- All changes go through develop first