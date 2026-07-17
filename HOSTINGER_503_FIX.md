# Hostinger 503 / restart loop fix

If logs show many `✓ Starting...` lines and never `✓ Ready`, Hostinger is
restarting the Node app in a loop. That produces site-wide **503 Service
Unavailable**.

## Fix now in hPanel

1. Open **Websites → Node.js**.
2. Click **Stop**.
3. Wait 30–60 seconds.
4. Confirm only one Node.js app is configured for `ilovebiodata.com`.
5. Set:
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm run start`
   - **Node version:** 20.x or 22.x
   - **Port:** leave Hostinger default / use `PORT` from the panel
6. Click **Rebuild**, then **Start** once.
7. Healthy logs should look like:

```text
✓ Starting...
✓ Ready in ...ms
```

Not dozens of `Starting...` every second.

## Do not

- Click Restart repeatedly while it is already restarting
- Run the app twice (two Node apps / two start commands)
- Put quotes around environment variable values

## After it stays Ready

1. Open `https://ilovebiodata.com/api/health`
2. Open `https://ilovebiodata.com/api/health/database`
3. Then test Google login
