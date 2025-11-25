# Deploy to Render - Step by Step

## Prerequisites
- GitHub account
- Render account (free - no credit card needed)

## Step 1: Push to GitHub

```bash
cd map-fee-analyzer
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/map-fee-analyzer.git
git push -u origin main
```

## Step 2: Deploy on Render

1. Go to https://render.com and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Render will auto-detect the `render.yaml` file
5. Click **"Create Web Service"**

That's it! Render will:
- Install dependencies
- Import the sample data
- Start the server
- Give you a URL like: `https://map-fee-analyzer.onrender.com`

## Step 3: Using Your Own Data

### Option A: Update in Repository
1. Replace `sample_data.csv` with your data
2. Commit and push:
   ```bash
   git add sample_data.csv
   git commit -m "Update with real data"
   git push
   ```
3. Render auto-deploys on push!

### Option B: Manual Upload (After First Deploy)
You can also SSH into Render to update data without redeploying:
1. In Render dashboard, go to your service
2. Click **"Shell"** tab
3. Run: `python import_data.py your_data.csv`

## Important Notes

### Free Tier Limitations
- **Sleeps after 15 min of inactivity** → First load after sleep takes ~30 seconds
- **750 hours/month** → About 31 days if running 24/7, but sleeping saves hours
- **SQLite data persists** across deploys and restarts

### Keep It Awake (Optional)
If you want faster response times, use a service like [UptimeRobot](https://uptimerobot.com) (free) to ping your app every 5 minutes. This keeps it awake during the day.

### Environment Variables
If you need to add environment variables later:
1. Go to your service in Render
2. Click **"Environment"** tab
3. Add variables as needed

## Updating the App

Just push to GitHub - Render auto-deploys:
```bash
git add .
git commit -m "Your changes"
git push
```

## Monitoring

Check your app status in Render dashboard:
- **Logs**: See all application logs
- **Metrics**: CPU, memory usage
- **Events**: Deploy history

## Troubleshooting

### Build Fails
Check the logs in Render dashboard. Common issues:
- Missing dependencies in `requirements.txt`
- Invalid CSV format

### App Won't Start
- Check that `database.db` was created during build
- Verify all files are committed to Git

### Cold Start is Slow
This is normal on free tier. Options:
- Use UptimeRobot to keep awake
- Upgrade to paid tier ($7/month) for always-on

## Custom Domain (Optional)

Free tier includes:
- `your-app.onrender.com` subdomain

Paid tier adds:
- Custom domains
- Auto SSL certificates

## Next Steps

1. Deploy with sample data first
2. Test the live URL
3. Replace with your real data
4. Share the URL!

Need help? Check [Render Docs](https://render.com/docs) or ask me!
