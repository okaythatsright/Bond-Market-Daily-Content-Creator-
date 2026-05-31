import { BskyAgent } from '@atproto/api';

/**
 * BlueSkyDebugger - Enhanced debugging and troubleshooting for BlueSky API interactions
 * Provides detailed logging, error analysis, and connection diagnostics
 */
export class BlueSkyDebugger {
    private debugMode: boolean;
    private logBuffer: string[] = [];
    private maxLogSize: number = 1000;

    constructor(debugMode: boolean = true) {
        this.debugMode = debugMode;
    }

    /**
     * Debug log with timestamp and level
     */
    private log(level: 'INFO' | 'DEBUG' | 'WARN' | 'ERROR', message: string, data?: any): void {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level}] ${message}`;
        
        if (this.debugMode) {
            if (data) {
                console.log(logEntry, JSON.stringify(data, null, 2));
            } else {
                console.log(logEntry);
            }
        }

        this.logBuffer.push(logEntry);
        if (this.logBuffer.length > this.maxLogSize) {
            this.logBuffer.shift();
        }
    }

    /**
     * Test BlueSky credentials and connection
     */
    async testCredentials(identifier: string, password: string): Promise<{
        success: boolean;
        handle?: string;
        did?: string;
        service?: string;
        errors?: string[];
    }> {
        this.log('INFO', '🦋 BlueSky Credentials Test Started');
        this.log('DEBUG', `Identifier: ${identifier}`);

        const errors: string[] = [];

        try {
            // Step 1: Validate input
            if (!identifier || !password) {
                const err = 'Missing credentials: identifier and password required';
                this.log('ERROR', err);
                errors.push(err);
                return { success: false, errors };
            }

            // Step 2: Normalize identifier
            const normalized = this.normalizeIdentifier(identifier);
            this.log('DEBUG', `Normalized identifier: ${normalized}`);

            // Step 3: Create agent
            this.log('DEBUG', 'Creating BskyAgent...');
            const agent = new BskyAgent({
                service: 'https://bsky.social'
            });
            this.log('DEBUG', 'BskyAgent created successfully');

            // Step 4: Attempt login with retry logic
            this.log('DEBUG', `Attempting login with: ${normalized}`);
            
            try {
                await agent.login({
                    identifier: normalized,
                    password: password
                });
                
                this.log('INFO', '✅ Login successful!');
                this.log('DEBUG', `Handle: ${agent.session?.handle}`);
                this.log('DEBUG', `DID: ${agent.session?.did}`);

                return {
                    success: true,
                    handle: agent.session?.handle,
                    did: agent.session?.did,
                    service: 'https://bsky.social'
                };
            } catch (loginError: any) {
                const errorMsg = loginError.message || String(loginError);
                this.log('ERROR', `Login failed: ${errorMsg}`);
                errors.push(`Login error: ${errorMsg}`);

                // Try alternative formats
                if (normalized.includes('@')) {
                    const altIdentifier = normalized.replace(/@.*/, '').trim();
                    this.log('DEBUG', `Trying alternative identifier: ${altIdentifier}`);
                    
                    try {
                        await agent.login({
                            identifier: altIdentifier,
                            password: password
                        });
                        
                        this.log('INFO', `✅ Login successful with alternative format!`);
                        return {
                            success: true,
                            handle: agent.session?.handle,
                            did: agent.session?.did,
                            service: 'https://bsky.social'
                        };
                    } catch (altError: any) {
                        this.log('ERROR', `Alternative format also failed: ${altError.message}`);
                        errors.push(`Alternative format: ${altError.message}`);
                    }
                }
            }
        } catch (error: any) {
            const errorMsg = error.message || String(error);
            this.log('ERROR', `Unexpected error: ${errorMsg}`);
            errors.push(errorMsg);
        }

        return { success: false, errors };
    }

    /**
     * Test posting capability
     */
    async testPosting(identifier: string, password: string, testText: string): Promise<{
        success: boolean;
        uri?: string;
        cid?: string;
        postUrl?: string;
        errors?: string[];
    }> {
        this.log('INFO', '🦋 BlueSky Posting Test Started');
        this.log('DEBUG', `Test text length: ${testText.length} chars (max 300)`);

        const errors: string[] = [];

        if (testText.length > 300) {
            const err = `Post exceeds 300 character limit: ${testText.length} chars`;
            this.log('ERROR', err);
            errors.push(err);
            return { success: false, errors };
        }

        try {
            // Step 1: Login
            this.log('DEBUG', 'Step 1: Authenticating...');
            const credTest = await this.testCredentials(identifier, password);
            
            if (!credTest.success) {
                this.log('ERROR', 'Authentication failed');
                return { success: false, errors: credTest.errors };
            }

            this.log('DEBUG', `Authenticated as: ${credTest.handle}`);

            // Step 2: Create agent and login
            this.log('DEBUG', 'Step 2: Creating posting agent...');
            const agent = new BskyAgent({
                service: 'https://bsky.social'
            });

            await agent.login({
                identifier: this.normalizeIdentifier(identifier),
                password: password
            });

            this.log('DEBUG', 'Agent authenticated for posting');

            // Step 3: Create post
            this.log('DEBUG', 'Step 3: Creating post...');
            const now = new Date();
            
            const postResult = await agent.post({
                text: testText,
                createdAt: now.toISOString()
            });

            this.log('INFO', '✅ Post created successfully!');
            this.log('DEBUG', `URI: ${postResult.uri}`);
            this.log('DEBUG', `CID: ${postResult.cid}`);

            const postUrl = `https://bsky.app/profile/${credTest.handle}/post/${postResult.uri.split('/').pop()}`;
            this.log('DEBUG', `Post URL: ${postUrl}`);

            return {
                success: true,
                uri: postResult.uri,
                cid: postResult.cid,
                postUrl: postUrl
            };

        } catch (error: any) {
            const errorMsg = error.message || String(error);
            this.log('ERROR', `Posting failed: ${errorMsg}`);
            errors.push(errorMsg);

            // Log detailed error info
            if (error.response) {
                this.log('ERROR', `Response status: ${error.response.status}`);
                this.log('ERROR', `Response body: ${JSON.stringify(error.response.body)}`);
            }
        }

        return { success: false, errors };
    }

    /**
     * Validate post content
     */
    validatePost(text: string): {
        valid: boolean;
        errors: string[];
        characterCount: number;
        remainingCharacters: number;
    } {
        this.log('DEBUG', `Validating post: ${text.length} characters`);

        const errors: string[] = [];
        const characterCount = text.length;
        const maxChars = 300;
        const remainingCharacters = maxChars - characterCount;

        if (!text || text.trim().length === 0) {
            errors.push('Post text cannot be empty');
        }

        if (characterCount > maxChars) {
            errors.push(`Post exceeds ${maxChars} character limit by ${characterCount - maxChars} characters`);
        }

        const valid = errors.length === 0;

        this.log('DEBUG', `Validation result - Valid: ${valid}, Chars: ${characterCount}/${maxChars}`);

        return {
            valid,
            errors,
            characterCount,
            remainingCharacters
        };
    }

    /**
     * Normalize BlueSky identifier (handle, email, URL)
     */
    private normalizeIdentifier(identifier: string): string {
        let normalized = identifier.trim();

        // Remove @ prefix if present
        if (normalized.startsWith('@')) {
            normalized = normalized.slice(1);
        }

        // Extract handle from BlueSky URL
        if (normalized.includes('bsky.app/profile/')) {
            const match = normalized.match(/bsky\.app\/profile\/([^/?]+)/);
            if (match) {
                normalized = match[1];
            }
        }

        this.log('DEBUG', `Identifier normalization: ${identifier} → ${normalized}`);
        return normalized;
    }

    /**
     * Batch post with detailed logging
     */
    async batchPost(
        identifier: string,
        password: string,
        posts: Array<{ id: string; text: string }>,
        delayMs: number = 1000
    ): Promise<{
        total: number;
        successful: number;
        failed: number;
        results: Array<{
            id: string;
            success: boolean;
            uri?: string;
            error?: string;
        }>;
    }> {
        this.log('INFO', `🦋 Batch Posting Started - ${posts.length} posts`);

        const results = [];
        let successful = 0;
        let failed = 0;

        try {
            // Authenticate once
            this.log('DEBUG', 'Authenticating for batch posting...');
            const agent = new BskyAgent({
                service: 'https://bsky.social'
            });

            await agent.login({
                identifier: this.normalizeIdentifier(identifier),
                password: password
            });

            this.log('DEBUG', 'Batch authentication successful');

            // Post each one with delay
            for (let i = 0; i < posts.length; i++) {
                const post = posts[i];
                this.log('DEBUG', `Posting ${i + 1}/${posts.length}: ${post.id}`);

                try {
                    // Validate before posting
                    const validation = this.validatePost(post.text);
                    if (!validation.valid) {
                        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
                    }

                    // Post
                    const postResult = await agent.post({
                        text: post.text,
                        createdAt: new Date().toISOString()
                    });

                    results.push({
                        id: post.id,
                        success: true,
                        uri: postResult.uri
                    });

                    successful++;
                    this.log('INFO', `✅ Posted ${post.id}: ${postResult.uri}`);

                    // Delay between posts
                    if (i < posts.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, delayMs));
                    }

                } catch (error: any) {
                    const errorMsg = error.message || String(error);
                    results.push({
                        id: post.id,
                        success: false,
                        error: errorMsg
                    });

                    failed++;
                    this.log('ERROR', `❌ Failed to post ${post.id}: ${errorMsg}`);
                }
            }

            this.log('INFO', `📊 Batch complete - ${successful} successful, ${failed} failed`);

        } catch (error: any) {
            this.log('ERROR', `Batch posting error: ${error.message}`);
        }

        return {
            total: posts.length,
            successful,
            failed,
            results
        };
    }

    /**
     * Get detailed diagnostics
     */
    getDiagnostics(): {
        environment: {
            hasIdentifier: boolean;
            hasPassword: boolean;
            nodeEnv: string;
        };
        logs: string[];
        recommendations: string[];
    } {
        const hasIdentifier = !!process.env.BLUESKY_IDENTIFIER;
        const hasPassword = !!process.env.BLUESKY_PASSWORD;
        const recommendations: string[] = [];

        if (!hasIdentifier) {
            recommendations.push('⚠️ BLUESKY_IDENTIFIER not set in environment');
        }

        if (!hasPassword) {
            recommendations.push('⚠️ BLUESKY_PASSWORD not set in environment');
        }

        if (!hasIdentifier || !hasPassword) {
            recommendations.push('💡 Add credentials to .env.local and restart');
        }

        return {
            environment: {
                hasIdentifier,
                hasPassword,
                nodeEnv: process.env.NODE_ENV || 'development'
            },
            logs: [...this.logBuffer],
            recommendations
        };
    }

    /**
     * Clear log buffer
     */
    clearLogs(): void {
        this.logBuffer = [];
        this.log('DEBUG', 'Log buffer cleared');
    }

    /**
     * Export logs for debugging
     */
    exportLogs(): string {
        return this.logBuffer.join('\n');
    }
}

// Export singleton instance
export const blueSkyDebugger = new BlueSkyDebugger(true);
