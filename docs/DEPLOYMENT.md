# Deployment Guide — Misbah Portfolio

## Prerequisites

- GitHub repository is public
- AWS account with access to Amplify, Route53, and Secrets Manager
- Route53 domain purchased (e.g., `misbah.engineer`)
- Anthropic API key for LLM features

---

## Step 1: Push Repo to GitHub

```bash
git add -A && git commit -m "Session 18: deploy setup"
git push origin main
```

---

## Step 2: Connect to AWS Amplify

1. Open the **AWS Console** and navigate to **AWS Amplify**
2. Click **"Create new app"**
3. Select **"Host your web app"** and choose **GitHub** as the source provider
4. **Authorize** AWS Amplify to access your GitHub account
5. Select the **misbah-portfolio** repository
6. Branch: **main**
7. Click **Next**

---

## Step 3: Build Settings

Amplify may auto-detect the Next.js framework. Verify these settings:

| Setting          | Value              |
|------------------|--------------------|
| Framework        | Next.js - SSR      |
| Build command    | `npm run build`    |
| Output directory | `.next`            |
| Node.js version  | **20** (set in Advanced settings) |

The project includes an `amplify.yml` at the root that Amplify will auto-detect.

---

## Step 4: Environment Variables

In the Amplify Console, add the following environment variable:

| Key                | Value              |
|--------------------|--------------------|
| `ANTHROPIC_API_KEY` | Your actual API key |

This is critical — all LLM features across the 5 apps will fail without it.

---

## Step 5: Deploy

1. Click **"Save and deploy"**
2. First deploy takes approximately **5-8 minutes**
3. Watch the build logs for any errors
4. Build phases: Provision → Build → Deploy → Verify

---

## Step 6: Test on Amplify URL

After deployment, note the Amplify URL:

```
https://main.[appid].amplifyapp.com
```

Test all 5 apps at this URL before connecting a custom domain:

| App         | Route                  | LLM Feature to Test         |
|-------------|------------------------|-----------------------------|
| InboundIQ   | `/apps/inboundiq`      | "Why Ranked #N?" explainer  |
| FreightLens | `/apps/freightlens`    | NL metric query             |
| Nova        | `/apps/nova`           | Delay Intelligence Brief    |
| DataOps     | `/apps/dataops`        | Catalog chat or metadata gen|
| LoFAT       | `/apps/lofat`          | Daily Intelligence Brief    |

Also verify:
- Landing page loads at `/`
- Maps render on InboundIQ and LoFAT pages
- Chart visualizations appear on analytics pages

---

## Step 7: Custom Domain (Route53)

1. In the Amplify Console, navigate to your app
2. Go to **"Domain management"** and click **"Add domain"**
3. Enter your domain (e.g., `misbah.engineer`)
4. Amplify auto-configures the Route53 A records
5. SSL certificate auto-provisions (**15-30 minutes**)
6. Both `misbah.engineer` and `www.misbah.engineer` will be configured

---

## Step 8: Final Checklist

- [ ] All 5 apps load without errors
- [ ] All LLM features return responses (test at least one per app)
- [ ] Maps render correctly (InboundIQ yard map, LoFAT GPS traces)
- [ ] Mobile responsive (test on phone or DevTools)
- [ ] HTTPS green padlock on custom domain
- [ ] Landing page hero section and animations work
- [ ] Navigation between apps works from sidebar

---

## CI/CD Pipeline

- **Pull requests** to `main` trigger the GitHub Actions CI workflow (lint + build)
- **Pushes** to `main` trigger Amplify auto-deploy
- No manual deployment steps needed after initial setup

---

## Troubleshooting

| Issue                        | Solution                                          |
|------------------------------|---------------------------------------------------|
| Build fails on Node version  | Set Node.js 20 in Amplify Advanced build settings |
| LLM features return errors   | Verify `ANTHROPIC_API_KEY` in Environment variables|
| Maps show grey tiles         | Check that Leaflet CSS is imported correctly       |
| Custom domain not resolving  | Wait 15-30 min for SSL + DNS propagation           |
| 404 on app routes            | Ensure Amplify platform is set to SSR (not static) |
