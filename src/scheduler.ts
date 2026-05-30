import cron from 'node-cron';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { BskyAgent } from '@atproto/api';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * SchedulerService - Handles daily automated post generation and publishing
 * Triggers at 4:30 PM Central Standard Time (CST)
 */
export class SchedulerService {
    private cronJob: any = null;
    private googleDoc: GoogleSpreadsheet | null = null;
    private geminiClient: GoogleGenAI;
    private lastRunTime: Date | null = null;
    private isRunning = false;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is required');
        }
        
        this.geminiClient = new GoogleGenAI({
            apiKey,
            httpOptions: {
                headers: { 'User-Agent': 'bond-market-scheduler' }
            }
        });
    }

    /**
     * Initialize the scheduler service
     */
    async initialize(): Promise<void> {
        try {
            console.log('🚀 Initializing Bond Market Scheduler Service...');
            
            // Initialize Google Sheets if credentials provided
            if (process.env.GOOGLE_SHEETS_PRIVATE_KEY && process.env.GOOGLE_SHEETS_EMAIL) {
                await this.initializeGoogleSheets();
            }
            
            // Start the cron scheduler for 4:30 PM CST
            this.startScheduler();
            
            console.log('✅ Scheduler Service initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize scheduler:', error);
            throw error;
        }
    }

    /**
     * Initialize Google Sheets connection
     */
    private async initializeGoogleSheets(): Promise<void> {
        try {
            const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
            if (!spreadsheetId) {
                console.warn('⚠️ GOOGLE_SHEETS_ID not configured');
                return;
            }

            this.googleDoc = new GoogleSpreadsheet(spreadsheetId, {
                email: process.env.GOOGLE_SHEETS_EMAIL,
                key: process.env.GOOGLE_SHEETS_PRIVATE_KEY
            });

            await this.googleDoc.loadInfo();
            console.log('✅ Google Sheets connected');
        } catch (error) {
            console.error('❌ Failed to initialize Google Sheets:', error);
        }
    }

    /**
     * Start the cron scheduler
     * Runs daily at 4:30 PM CST (16:30 in 24-hour format)
     */
    private startScheduler(): void {
        // Cron expression for 4:30 PM CST
        // 30 16 * * * = Every day at 16:30 (4:30 PM)
        // TZ=America/Chicago ensures CST timezone
        const cronExpression = '30 16 * * *';
        
        this.cronJob = cron.schedule(cronExpression, () => {
            this.runDailyGeneration();
        }, {
            timezone: 'America/Chicago'
        });

        console.log('⏰ Scheduler started - Daily posts will be generated at 4:30 PM CST');
        
        // Run once immediately for testing
        console.log('📅 Next scheduled run: Tomorrow at 4:30 PM CST');
    }

    /**
     * Stop the scheduler
     */
    public stopScheduler(): void {
        if (this.cronJob) {
            this.cronJob.stop();
            console.log('⛔ Scheduler stopped');
        }
    }

    /**
     * Main daily generation routine
     */
    private async runDailyGeneration(): Promise<void> {
        if (this.isRunning) {
            console.log('⏳ Generation already running, skipping duplicate trigger');
            return;
        }

        this.isRunning = true;
        const startTime = new Date();

        try {
            console.log('\n📅 ========== DAILY POST GENERATION STARTED ==========');
            console.log(`⏰ Time: ${startTime.toISOString()}`);

            // Step 1: Fetch bond market data
            console.log('\n📊 Step 1: Fetching bond market data...');
            const bondData = await this.fetchBondMarketData();

            // Step 2: Generate AI content
            console.log('\n🤖 Step 2: Generating content with Gemini AI...');
            const posts = await this.generateContentAI(bondData);

            // Step 3: Publish to BlueSky
            console.log('\n🦋 Step 3: Publishing to BlueSky...');
            const publishResults = await this.publishToBlueSky(posts);

            // Step 4: Log to Google Sheets
            if (this.googleDoc) {
                console.log('\n📋 Step 4: Logging to Google Sheets...');
                await this.logToGoogleSheets(posts, publishResults);
            }

            // Step 5: Summary
            this.printSummary(startTime, posts, publishResults);

        } catch (error) {
            console.error('❌ Daily generation failed:', error);
        } finally {
            this.isRunning = false;
            this.lastRunTime = new Date();
        }
    }

    /**
     * Fetch bond market data from Treasury and Yahoo Finance
     */
    private async fetchBondMarketData(): Promise<any> {
        try {
            // This would call the existing /api/bond-data/sync endpoint
            // For now, returning mock data structure
            return {
                lastUpdated: new Date().toISOString().split('T')[0],
                treasury: {
                    '2Y': 4.00,
                    '5Y': 4.17,
                    '10Y': 4.48,
                    '30Y': 5.01
                },
                corporate: {
                    investmentGrade: 5.32,
                    highYield: 7.45
                },
                municipal: {
                    aaaYield: 2.84
                },
                tips: {
                    breakeven5Y: 2.25,
                    breakeven10Y: 2.63
                }
            };
        } catch (error) {
            console.error('Error fetching bond data:', error);
            throw error;
        }
    }

    /**
     * Generate content using Google Gemini AI
     */
    private async generateContentAI(bondData: any): Promise<any[]> {
        try {
            const sections = [
                'broad-aggregate',
                'us-treasury',
                'corporate',
                'municipal',
                'real-yield',
                'tips',
                'international',
                'duration-aggregates'
            ];

            const prompt = `
You are a premier bond market expert and professional financial writer.
Generate EXACTLY one BlueSky post (300 characters max) for each bond market section below:

Bond Market Data:
${JSON.stringify(bondData, null, 2)}

REQUIREMENTS FOR EACH POST:
- Maximum 300 characters (strictly enforced)
- Use actual economic context and translate yields into market implications
- Write as an expert bond strategist (no self-praise or AI jargon)
- Include relevant emojis and hashtags where appropriate
- Be direct, professional, clear, and highly insightful

Sections to cover:
${sections.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Return ONLY a valid JSON array with objects containing "sectionId" and "postText" fields.
`;

            const response = await this.geminiClient.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                sectionId: { type: Type.STRING },
                                postText: { type: Type.STRING }
                            },
                            required: ['sectionId', 'postText']
                        }
                    }
                }
            });

            const responseText = response.text;
            if (!responseText) {
                throw new Error('No response generated by Gemini API');
            }

            return JSON.parse(responseText.trim());
        } catch (error) {
            console.error('Error generating content:', error);
            throw error;
        }
    }

    /**
     * Publish posts to BlueSky
     */
    private async publishToBlueSky(posts: any[]): Promise<any[]> {
        const results = [];

        try {
            const agent = await this.loginBlueSky();

            for (let i = 0; i < posts.length; i++) {
                const post = posts[i];
                
                try {
                    // Delay between posts to avoid rate limiting
                    if (i > 0) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                    const postResult = await agent.post({
                        text: post.postText,
                        createdAt: new Date().toISOString()
                    });

                    results.push({
                        sectionId: post.sectionId,
                        status: 'success',
                        uri: postResult.uri,
                        cid: postResult.cid,
                        timestamp: new Date().toISOString()
                    });

                    console.log(`✅ Published ${post.sectionId}: ${postResult.uri}`);
                } catch (error: any) {
                    results.push({
                        sectionId: post.sectionId,
                        status: 'failed',
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                    console.error(`❌ Failed to publish ${post.sectionId}:`, error.message);
                }
            }
        } catch (error) {
            console.error('BlueSky publishing error:', error);
            throw error;
        }

        return results;
    }

    /**
     * Login to BlueSky
     */
    private async loginBlueSky(): Promise<BskyAgent> {
        const identifier = process.env.BLUESKY_IDENTIFIER;
        const password = process.env.BLUESKY_PASSWORD;

        if (!identifier || !password) {
            throw new Error('BlueSky credentials not configured (BLUESKY_IDENTIFIER, BLUESKY_PASSWORD)');
        }

        const agent = new BskyAgent({
            service: 'https://bsky.social'
        });

        await agent.login({
            identifier,
            password
        });

        return agent;
    }

    /**
     * Log posts to Google Sheets
     */
    private async logToGoogleSheets(posts: any[], results: any[]): Promise<void> {
        if (!this.googleDoc) {
            console.warn('⚠️ Google Sheets not initialized');
            return;
        }

        try {
            const sheet = this.googleDoc.sheetsByTitle['Posts Log'] || 
                         this.googleDoc.sheetsByTitle[0];

            if (!sheet) {
                console.warn('⚠️ Could not find sheet for logging');
                return;
            }

            const date = new Date().toISOString();
            const rows = results.map((result, index) => ({
                date,
                section: posts[index]?.sectionId || '',
                postText: posts[index]?.postText || '',
                status: result.status,
                blueskyUri: result.uri || result.error || '',
                timestamp: result.timestamp
            }));

            await sheet.addRows(rows);
            console.log(`📋 Logged ${rows.length} posts to Google Sheets`);
        } catch (error) {
            console.error('Error logging to Google Sheets:', error);
        }
    }

    /**
     * Print summary of daily generation
     */
    private printSummary(startTime: Date, posts: any[], results: any[]): void {
        const endTime = new Date();
        const duration = (endTime.getTime() - startTime.getTime()) / 1000;
        const successCount = results.filter(r => r.status === 'success').length;

        console.log('\n📊 ========== GENERATION SUMMARY ==========');
        console.log(`✅ Successful Posts: ${successCount}/${posts.length}`);
        console.log(`⏱️ Duration: ${duration.toFixed(2)}s`);
        console.log(`📅 Completed At: ${endTime.toISOString()}`);
        console.log(`🔗 BlueSky Posts: ${results.filter(r => r.uri).map(r => r.uri).join(', ')}`);
        console.log('==========================================\n');
    }

    /**
     * Get scheduler status
     */
    public getStatus(): {
        running: boolean;
        lastRun: Date | null;
        nextRun: string;
    } {
        return {
            running: !this.isRunning,
            lastRun: this.lastRunTime,
            nextRun: '4:30 PM CST (Daily)'
        };
    }

    /**
     * Trigger immediate generation (for manual testing)
     */
    public async triggerImmediate(): Promise<void> {
        console.log('🚀 Manual trigger: Starting immediate generation...');
        await this.runDailyGeneration();
    }
}

// Export singleton instance
export const schedulerService = new SchedulerService();
