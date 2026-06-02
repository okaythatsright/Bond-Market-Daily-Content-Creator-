<div align="center">
<img width="1200" height="475" alt="Bond Market Daily Content Creator" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Bond Market Daily Content Creator 📊

**Automated AI-powered bond market analysis posts to BlueSky**

Generate and publish professional bond market insights daily at **4:30 PM CST** using Google Gemini AI, with direct BlueSky integration and Google Sheets tracking.

🔗 **[Live Dashboard](https://okaythatsright.github.io/Bond-Market-Daily-Content-Creator-/)**

---

## ✨ Features

- 🤖 **AI-Powered Generation** - Uses Google Gemini 3.5 Flash for expert-level content
- 📅 **Scheduled Automation** - Daily posts at 4:30 PM Central Standard Time
- 🦋 **BlueSky Integration** - Direct API publishing with 300-char limit compliance
- 📋 **Google Sheets Logging** - Automatic post tracking and archival
- 📊 **Professional Dashboard** - React-based UI for management and monitoring
- 🔄 **Real-time Data** - Treasury.gov + Yahoo Finance data sources
- 🧪 **Manual Testing** - Trigger posts on-demand via dashboard or API
- 🔐 **Secure Credentials** - Local encryption for sensitive data
- 📈 **Analytics** - Publishing statistics and performance tracking
- 🌐 **8 Bond Market Sections** - Comprehensive coverage of all major asset classes

---

## 🎯 Bond Market Coverage

The system generates expert posts for:

1. **Broad Aggregate Bond Market** - Overall performance metrics
2. **U.S. Treasury Bonds** - Government yield curves and trends
3. **Corporate Bonds** - Investment grade and high-yield analysis
4. **Municipal Bonds** - Tax-exempt market dynamics
5. **Real Yield** - Inflation-adjusted returns
6. **TIPS** - Inflation-protected securities
7. **International Bonds** - Global benchmarks (Bunds, Gilts, JGBs)
8. **Duration Aggregates** - Maturity-specific yields

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Google Gemini API Key
- BlueSky account with app password

### Installation

```bash
# Clone repository
git clone https://github.com/okaythatsright/Bond-Market-Daily-Content-Creator-.git
cd Bond-Market-Daily-Content-Creator-

# Install dependencies
npm install
npm install node-cron google-spreadsheet

# Create environment file
cp .env.example .env.local

# Configure credentials (see SETUP_GUIDE.md)
# Add GEMINI_API_KEY, BLUESKY_IDENTIFIER, BLUESKY_PASSWORD
```

### Running

```bash
# Development mode
npm run dev

# Open dashboard
# http://localhost:3000/dashboard.html

# Production build
npm run build
npm run start
```

---

## 📡 API Endpoints

### Scheduler Control
```
POST   /api/scheduler/trigger          Trigger immediate generation
GET    /api/scheduler/status           Get scheduler status
```

### Bond Market Data
```
GET    /api/bond-data/sync             Fetch current bond data
GET    /api/bond-data/narratives       Get macro narratives
```

### BlueSky Integration
```
POST   /api/bluesky/test               Test connection
POST   /api/bluesky/publish            Publish posts
```

### Content Generation
```
POST   /api/synthesize                 Generate posts from data
```

---

## 🔐 Environment Setup

Create `.env.local` with:

```env
# Google Gemini API
GEMINI_API_KEY=your_api_key

# BlueSky Credentials
BLUESKY_IDENTIFIER=your_handle@bsky.social
BLUESKY_PASSWORD=your_app_password

# Google Sheets (Optional)
GOOGLE_SHEETS_ID=your_spreadsheet_id
GOOGLE_SHEETS_EMAIL=service@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
```

See **SETUP_GUIDE.md** for detailed API key configuration.

---

## 📊 Dashboard

Access the professional management interface:

```
http://localhost:3000/dashboard.html
```

### Dashboard Sections:
- **Overview** - System status and quick actions
- **Schedule** - View/modify 4:30 PM CST posting time
- **Analytics** - Publishing statistics
- **Content Generator** - Create posts manually
- **Posts History** - View all published posts
- **Google Sheets** - Configure tracking spreadsheet
- **BlueSky Settings** - Manage account credentials
- **Settings** - App configuration

---

## 🤖 How It Works

### Automatic Daily Flow (4:30 PM CST)

```
1. Fetch Data
   └─ Treasury yields + Yahoo Finance data

2. Generate Content
   └─ Gemini AI creates 8 expert posts (≤300 chars each)

3. Publish
   └─ BlueSky API posts with proper authentication

4. Track
   └─ Log all results to Google Sheets
```

### Manual Triggering

Via Dashboard:
- Click "Generate Posts Now" button

Via API:
```bash
curl -X POST http://localhost:3000/api/scheduler/trigger
```

---

## 📝 Post Content

Each daily post:
- ✅ Synthesizes real bond market data
- ✅ Provides macroeconomic context
- ✅ Maintains 300-character BlueSky limit
- ✅ Written in professional analyst tone
- ✅ Includes relevant hashtags (#BondMarket, #Markets, etc.)
- ✅ Uses emoji for visual engagement

Example post:
> "10Y Treasury yields trending at 4.48%, reflecting Fed rate expectations. Market monitoring inflation data closely. Bond spreads stabilizing with positive sentiment. 📊 #BondMarket"

---

## 🧪 Testing

### Test BlueSky Connection
```bash
curl -X POST http://localhost:3000/api/bluesky/test \
  -H "Content-Type: application/json" \
  -d '{
    "loginToken": "your_handle",
    "password": "your_password",
    "testText": "🤖 Test post"
  }'
```

### Check Scheduler Status
```bash
curl http://localhost:3000/api/scheduler/status
```

### Manual Generation
```bash
curl -X POST http://localhost:3000/api/scheduler/trigger
```

---

## 📚 Project Structure

```
Bond-Market-Daily-Content-Creator-/
├── dashboard.html              # UX Dashboard
├── server.ts                   # Express server + API
├── src/
│   ├── scheduler.ts            # Scheduler service (4:30 PM CST)
│   ├── data.ts                 # Bond data definitions
│   └── main.tsx                # React frontend
├── .env.local                  # Environment variables
├── .env.example                # Environment template
├── SETUP_GUIDE.md              # Detailed setup instructions
├── package.json                # Dependencies
└── README.md                   # This file
```

---

## 🔧 Configuration

### Modify Posting Time

1. Dashboard → Schedule & Status
2. Enter new time (HH:MM format, 24-hour)
3. Click "Update Schedule"

Default: **16:30** (4:30 PM CST)

### Custom Post Tone

Select in Content Generator:
- Professional (default)
- Casual
- Technical
- Educational

---

## 🚀 Deployment

### Heroku
```bash
heroku create bond-market-bot
heroku config:set GEMINI_API_KEY=your_key
heroku config:set BLUESKY_IDENTIFIER=your_handle
heroku config:set BLUESKY_PASSWORD=your_password
git push heroku main
```

### Docker
```bash
docker build -t bond-market-bot .
docker run -p 3000:3000 \
  -e GEMINI_API_KEY=your_key \
  -e BLUESKY_IDENTIFIER=your_handle \
  -e BLUESKY_PASSWORD=your_password \
  bond-market-bot
```

---

## 📊 Data Sources

- **U.S. Treasury** - Official Treasury yield curve
- **Yahoo Finance** - Bond indices and market data
- **Google Gemini AI** - Content generation and analysis
- **BlueSky API** - Post publishing
- **Google Sheets** - Historical tracking

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Scheduler not running | Verify .env.local vars, restart server |
| BlueSky auth fails | Check app password, test via dashboard |
| Posts exceed 300 chars | Adjust Gemini prompt for brevity |
| Bond data errors | Verify network, check Treasury.gov status |
| Google Sheets not updating | Verify service account email is shared |

See **SETUP_GUIDE.md** for detailed troubleshooting.

---

## 📈 Monitoring

Check scheduler status:
```bash
curl http://localhost:3000/api/scheduler/status

# Response:
{
  "success": true,
  "scheduler": {
    "running": true,
    "lastRun": "2026-05-30T20:30:00Z",
    "nextRun": "4:30 PM CST (Daily)"
  }
}
```

---

## 🔒 Security

- 🔐 Environment variables for sensitive data
- 🔒 Local storage encryption for credentials
- 🛡️ Never logs passwords or API keys
- ✅ Uses app-specific BlueSky passwords
- 🔑 Service account separation for Google APIs

---

## 📄 Files

- **dashboard.html** - Standalone dashboard UI
- **server.ts** - Express backend with all API endpoints
- **src/scheduler.ts** - Core scheduler service
- **SETUP_GUIDE.md** - Detailed configuration guide
- **.env.example** - Environment variable template

---

## 📞 Support

For detailed setup instructions, see **SETUP_GUIDE.md**

For API documentation, see inline comments in **server.ts** and **src/scheduler.ts**

---

## 📄 License

Google AI Studio Repository Template - Modified for Bond Market Analysis

---

## 🎯 Next Steps

1. Follow **SETUP_GUIDE.md** for complete configuration
2. Set up `.env.local` with all credentials
3. Run `npm run dev`
4. Access dashboard at `http://localhost:3000/dashboard.html`
5. Test connections via dashboard
6. Wait for 4:30 PM CST or trigger manually

---

**Version:** 1.0.0  
**Last Updated:** May 30, 2026  
**Timezone:** America/Chicago (CST/CDT)  
**Tech Stack:** TypeScript, React, Express, Node-Cron, Gemini AI, BlueSky API
