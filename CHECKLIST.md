# 🚀 Render Deployment Checklist

## Before You Start
- [ ] GitHub account created
- [ ] Render account created (free, no credit card)
- [ ] Sample data tested locally (optional)

## Step-by-Step

### 1️⃣ Push to GitHub (5 minutes)
```bash
cd map-fee-analyzer
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/map-fee-analyzer.git
git push -u origin main
```

### 2️⃣ Deploy on Render (2 minutes)
- [ ] Go to https://render.com
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repository
- [ ] Render auto-detects `render.yaml`
- [ ] Click "Create Web Service"
- [ ] Wait 2-3 minutes for build

### 3️⃣ Test Your App
- [ ] Click the URL Render gives you (ends in `.onrender.com`)
- [ ] Check map loads
- [ ] Try city dropdown
- [ ] Click some markers
- [ ] View comparison table

### 4️⃣ Add Your Real Data
- [ ] Replace `sample_data.csv` with your CSV
- [ ] Commit and push to GitHub
- [ ] Render auto-deploys!

## 🎉 Done!

Your app is live at: `https://your-app-name.onrender.com`

## ⚡ Pro Tips

**Keep it awake** (optional):
- Use UptimeRobot (free) to ping every 5 minutes
- Prevents cold starts during the day

**Custom domain** (paid tier):
- Upgrade to $7/month
- Add your own domain

**Monitor it**:
- Check Render dashboard for logs
- Watch for errors or issues

## 🆘 Need Help?

- Check [DEPLOY.md](DEPLOY.md) for detailed guide
- See [Render Docs](https://render.com/docs)
- Check logs in Render dashboard

## 📊 Free Tier Limits

✅ 750 hours/month (enough for constant use)
✅ Persistent SQLite storage
⚠️ Sleeps after 15 min (30s cold start)
✅ Auto-deploys on Git push
✅ Free SSL certificate
