# Bond Market Daily Content Creator - Setup & Configuration Guide

## 🚀 Overview

This application automatically generates and publishes bond market analysis posts to BlueSky daily at **4:30 PM Central Standard Time (CST)**.

### Key Features:
- ✅ **Automated Daily Posts** - Generated at 4:30 PM CST using Gemini AI
- ✅ **8 Bond Market Sections** - Comprehensive analysis across asset classes
- ✅ **BlueSky Integration** - Direct post publishing to BlueSky
- ✅ **Google Sheets Logging** - Track all published posts
- ✅ **Professional Dashboard** - Monitor and manage posts
- ✅ **Manual Triggering** - Generate posts on-demand

---

## 📋 Prerequisites

- **Node.js** v18+ 
- **npm** or **yarn**
- **Google Gemini API Key**
- **BlueSky Account** with app password
- **Google Cloud Project** (optional, for Google Sheets integration)

---

## 🔧 Installation

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/okaythatsright/Bond-Market-Daily-Content-Creator-.git
cd Bond-Market-Daily-Content-Creator-
npm install
```

### 2. Install Additional Dependencies for Scheduler

```bash
npm install node-cron google-spreadsheet
npm install --save-dev @types/node-cron
```

---

## 🔐 Environment Configuration

### Create `.env.local` file in the root directory:

```env
# ============================================
# GOOGLE GEMINI API
# ============================================
GEMINI_API_KEY=your_gemini_api_key_here

# ============================================
# BLUESKY CREDENTIALS
# ============================================
# Get app password from https://bsky.app/settings/app-passwords
BLUESKY_IDENTIFIER=your_bluesky_handle_or_email@example.com
BLUESKY_PASSWORD=your_bluesky_app_password_here

# ============================================
# GOOGLE SHEETS (Optional)
# ============================================
GOOGLE_SHEETS_ID=your_spreadsheet_id_here
GOOGLE_SHEETS_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ============================================
# SERVER CONFIG
# ============================================
NODE_ENV=development
PORT=3000
```

---

## 🔑 API Key Setup Guide

### Google Gemini API

1. Go to [Google AI Studio](https://ai.google.dev/studio)
2. Click "Get API Key"
3. Create a new API key
4. Copy and paste into `GEMINI_API_KEY` in `.env.local`

### BlueSky App Password

1. Go to [BlueSky Settings](https://bsky.app/settings/app-passwords)
2. Click "Add App Password"
3. Name it "Bond Market Bot"
4. Copy the generated password
5. Use your handle and this password in `.env.local`

### Google Sheets (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable "Google Sheets API"
4. Create a Service Account
5. Download JSON key
6. Extract credentials into `.env.local`

---

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

The application will:
- Start the server on `http://localhost:3000`
- Load the dashboard at `http://localhost:3000/dashboard.html`
- Initialize the scheduler for 4:30 PM CST daily posts

### Production Build

```bash
npm run build
npm run start
```

---

## 📊 Dashboard Access

Open your browser and navigate to:

```
http://localhost:3000/dashboard.html
```

### Dashboard Features:

- **Overview** - System status and quick actions
- **Schedule & Status** - View/modify posting schedule
- **Analytics** - Publishing statistics
- **Content Generator** - Create posts manually
- **Posts History** - View published posts
- **Google Sheets** - Connect to tracking spreadsheet
- **BlueSky Settings** - Configure credentials
- **Settings** - App configuration

---

## 🤖 How It Works

### Automatic Daily Generation (4:30 PM CST)

1. **Fetch Bond Data**
   - Treasury yields from U.S. Department of Treasury
   - Corporate/Municipal bonds from financial APIs
   - Real yields and TIPS data

2. **Generate Content**
   - Send data to Google Gemini AI
   - AI generates 8 expert bond market posts
   - Each post ≤ 300 characters (BlueSky limit)

3. **Publish to BlueSky**
   - Authenticate with BlueSky API
   - Publish 8 posts with 1-second delays
   - Log results and URIs

4. **Track in Google Sheets**
   - Log all post metadata
   - Track publishing success/failures
   - Maintain content history

### Manual Triggering

**Via Dashboard:**
- Click "Generate Posts Now" button

**Via API:**
```bash
curl -X POST http://localhost:3000/api/scheduler/trigger
```

---

## 📡 API Endpoints

### Scheduler Endpoints

```
POST   /api/scheduler/trigger          # Trigger immediate generation
GET    /api/scheduler/status           # Get scheduler status
```

### Bond Data Endpoints

```
GET    /api/bond-data/sync             # Fetch current bond market data
GET    /api/bond-data/narratives       # Get macro narratives
```

### BlueSky Endpoints

```
POST   /api/bluesky/test               # Test BlueSky connection
POST   /api/bluesky/publish            # Publish posts to BlueSky
```

### Content Generation

```
POST   /api/synthesize                 # Generate posts from bond data
```

---

## 🕐 Scheduling Details

### Default Schedule
- **Time:** 4:30 PM Central Standard Time (CST)
- **Frequency:** Daily
- **Timezone:** America/Chicago

### Modify Schedule

1. Open Dashboard → Schedule & Status
2. Enter new time in HH:MM format (24-hour)
3. Click "Update Schedule"

Or programmatically via API (future enhancement)

---

## 📝 Bond Market Sections

The system generates posts for 8 bond market categories:

1. **Broad Aggregate Bond Market** - Overall bond universe performance
2. **U.S. Treasury Bonds** - Government bond yields and curves
3. **Corporate Bonds** - Investment grade and high-yield bonds
4. **Municipal Bonds** - Tax-exempt state and local government bonds
5. **Real Yield** - Inflation-adjusted bond returns
6. **TIPS** - Treasury Inflation-Protected Securities
7. **International Bonds** - Global government benchmarks
8. **Duration Aggregates** - Maturity-specific yields and curve slopes

---

## 🧪 Testing

### Test BlueSky Connection

```bash
curl -X POST http://localhost:3000/api/bluesky/test \
  -H "Content-Type: application/json" \
  -d '{
    "loginToken": "your_handle",
    "password": "your_app_password",
    "testText": "🤖 Test post from Bond Market Bot"
  }'
```

### Test Content Generation

```bash
curl -X POST http://localhost:3000/api/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "sections": [
      {
        "id": "us-treasury",
        "title": "U.S. Treasury Bonds",
        "data": [{"label": "10Y Yield", "value": "4.48%"}]
      }
    ]
  }'
```

---

## 📊 Monitoring

### Check Scheduler Status

```bash
curl http://localhost:3000/api/scheduler/status
```

Response:
```json
{
  "success": true,
  "scheduler": {
    "running": true,
    "lastRun": "2026-05-30T20:30:00Z",
    "nextRun": "4:30 PM CST (Daily)"
  }
}
```

### Console Logs

The scheduler logs detailed information:
```
📅 DAILY POST GENERATION STARTED
📊 Fetching bond market data...
🤖 Generating content with Gemini AI...
🦋 Publishing to BlueSky...
📋 Logging to Google Sheets...
📊 GENERATION SUMMARY
✅ Successful Posts: 8/8
```

---

## 🐛 Troubleshooting

### Scheduler Not Running

1. Check `.env.local` has all required keys
2. Verify Node timezone is correct: `date`
3. Check server logs for errors
4. Restart the server

### BlueSky Publishing Fails

1. Verify credentials in `.env.local`
2. Test connection via dashboard
3. Check app password hasn't expired
4. Ensure account has posting permissions

### Low Bond Data Quality

1. Check Treasury.gov is accessible
2. Verify Yahoo Finance APIs are working
3. Check network connectivity
4. Review console for specific API errors

---

## 📚 Project Structure

```
Bond-Market-Daily-Content-Creator-/
├── dashboard.html           # Main UX dashboard
├── server.ts               # Express server & API endpoints
├── src/
│   ├── scheduler.ts        # Scheduler service (4:30 PM CST)
│   ├── data.ts             # Default bond data
│   └── ...
├── .env.local             # Environment variables (local)
├── .env.example           # Example environment template
├── package.json           # Dependencies
└── README.md              # This file
```

---

## 🚀 Deployment

### Heroku

```bash
heroku create your-app-name
heroku config:set GEMINI_API_KEY=your_key
heroku config:set BLUESKY_IDENTIFIER=your_handle
heroku config:set BLUESKY_PASSWORD=your_password
git push heroku main
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📞 Support & Debugging

### Enable Debug Mode

In dashboard settings, enable "Debug Mode" to see detailed console logs.

### Common Issues

| Issue | Solution |
|-------|----------|
| Scheduler not triggering | Verify timezone and .env vars |
| Posts too long | Gemini may exceed 300 chars, adjust prompt |
| BlueSky auth fails | Check app password expiration |
| Google Sheets not updating | Verify service account email is shared |

---

## 📄 License

This project is part of the Bond Market Daily Content Creator ecosystem.

---

## 🔄 Next Steps

1. ✅ Set up `.env.local` with all credentials
2. ✅ Install dependencies: `npm install`
3. ✅ Test connections via dashboard
4. ✅ Configure Google Sheets (optional)
5. ✅ Run: `npm run dev`
6. ✅ Visit: `http://localhost:3000/dashboard.html`
7. ✅ Wait for 4:30 PM CST or click "Generate Posts Now"

---

**Version:** 1.0.0  
**Last Updated:** May 30, 2026  
**Timezone:** America/Chicago (CST/CDT)
