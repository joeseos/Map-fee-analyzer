# GitHub Setup - Copy & Paste Commands

## Step 1: Create Repository on GitHub

1. Go to https://github.com/new
2. Repository name: `map-fee-analyzer`
3. Keep it Public or Private (both work with Render)
4. **Don't** initialize with README, .gitignore, or license
5. Click "Create repository"

## Step 2: Push Your Code

Open terminal in the `map-fee-analyzer` folder and run these commands:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Map Fee Analyzer"

# Add remote (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/map-fee-analyzer.git

# Push to GitHub
git push -u origin main
```

### If you get "main branch doesn't exist" error:
```bash
git branch -M main
git push -u origin main
```

### If you need to authenticate:
GitHub will prompt you to login. Use:
- **Personal Access Token** (recommended)
- Or GitHub Desktop app
- Or SSH keys

## Step 3: Verify Upload

1. Refresh your GitHub repository page
2. You should see all files uploaded
3. Check that `render.yaml` is there

## Done! 🎉

Now go to Render and connect this repository:
1. https://render.com
2. New + → Web Service
3. Connect repository
4. Create!

---

## Troubleshooting

### "fatal: remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR-USERNAME/map-fee-analyzer.git
```

### "Updates were rejected"
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Need to change remote URL?
```bash
git remote set-url origin https://github.com/YOUR-USERNAME/map-fee-analyzer.git
```

### Check current remote:
```bash
git remote -v
```
