# 🛡️ Safe Git Guide for Electrical AI Assistant

## 🌳 Your Branch Structure

```
main (PRODUCTION - Never touch directly!)
  │
  └── develop (TESTING - All new code goes here first)
       │
       └── feature/your-feature (INDIVIDUAL CHANGES)
```

## 📝 Daily Safe Workflow

### Starting Your Day:
```bash
# 1. Always start from develop (never main!)
git checkout develop

# 2. Get latest code
git pull origin develop

# 3. Create a feature branch for today's work
git checkout -b feature/todays-work-description
```

### While Coding:
```bash
# Save your work every 30-60 minutes
git add .
git commit -m "feat: what you just did"

# Backup to GitHub
git push origin feature/your-feature-name
```

### Testing Your Changes:
```bash
# When ready to test, merge to develop
git checkout develop
git merge feature/your-feature-name
git push origin develop

# Check Vercel preview URL (not production!)
```

### Moving to Production (Only when 100% tested):
```bash
# 1. Make sure you're on develop
git checkout develop

# 2. Create a pull request on GitHub
# Go to: https://github.com/srmccombs/electrical-ai-assistant
# Click "Pull requests" → "New pull request"
# Set: base: main ← compare: develop
# Review changes carefully!
# Click "Create pull request"
# Then "Merge pull request"

# 3. Your tested code is now live!
```

## 🚨 Emergency Commands

### "I made a mistake on develop!"
```bash
# Go back to last commit
git reset --hard HEAD~1
```

### "I need to check production is OK!"
```bash
git checkout main
# Look around, but DON'T CHANGE ANYTHING
git checkout develop  # Go back to develop
```

### "I accidentally changed something on main!"
```bash
# DON'T PANIC! Discard all changes
git checkout main
git reset --hard origin/main
```

## ✅ Safety Checklist

Before ANY commit:
- [ ] Am I on develop or feature branch? (Never main!)
- [ ] Did I test my changes?
- [ ] Is my commit message clear?

Before merging to main:
- [ ] Did I test on develop branch?
- [ ] Did Vercel preview look good?
- [ ] Am I sure it won't break production?

## 🎯 Your Safe Commands Cheat Sheet

```bash
# See what branch you're on
git branch

# Switch to develop (safe)
git checkout develop

# Create feature branch (safe)
git checkout -b feature/new-feature

# Save work (safe)
git add .
git commit -m "feat: description"

# Backup to GitHub (safe)
git push origin current-branch-name

# See what changed
git status
git diff
```

## 🚀 Vercel Setup for Preview

1. Go to your Vercel dashboard
2. Go to Settings → Git
3. Add develop branch for preview deployments
4. Now every push to develop creates a preview URL!

## 💡 Golden Rules

1. **Main = Production = Don't Touch Directly**
2. **Develop = Testing Ground = Safe to Experiment**
3. **Feature = Your Daily Work = Even Safer**
4. **Always Test in Develop Before Main**
5. **Commit Often (Every Save Point)**
6. **Write Clear Messages**
7. **When in Doubt, Ask First**

## 📞 Help Commands

```bash
# "What branch am I on?"
git branch

# "What did I change?"
git status

# "Show me the last 5 commits"
git log --oneline -5

# "What files will be affected?"
git diff --name-only
```

Remember: Git is your friend! It's here to protect your code, not complicate your life.