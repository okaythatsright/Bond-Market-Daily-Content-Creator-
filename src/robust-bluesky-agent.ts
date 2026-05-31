import { BskyAgent, AppBskyFeedPost } from '@atproto/api';
import { XRPCError } from '@atproto/xrpc';

/**
 * Enhanced BlueSky Agent with robust error handling
 * Fixes JSON parsing and response handling issues
 */
export class RobustBskyAgent {
    private agent: BskyAgent;
    private maxRetries: number = 3;
    private retryDelay: number = 1000;

    constructor(service: string = 'https://bsky.social') {
        this.agent = new BskyAgent({ service });
    }

    /**
     * Login with comprehensive error handling
     */
    async login(identifier: string, password: string): Promise<void> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`[Attempt ${attempt}/${this.maxRetries}] Logging in as ${identifier}...`);
                
                await this.agent.login({
                    identifier: identifier.trim(),
                    password: password.trim()
                });

                console.log(`✅ Successfully logged in as ${this.agent.session?.handle}`);
                return;

            } catch (error: any) {
                lastError = error;
                console.error(`❌ Login attempt ${attempt} failed:`);
                
                // Parse detailed error information
                const errorDetails = this.parseError(error);
                console.error(`  Status: ${errorDetails.status}`);
                console.error(`  Message: ${errorDetails.message}`);
                console.error(`  Code: ${errorDetails.code}`);

                // Don't retry on authentication errors
                if (errorDetails.status === 401 || errorDetails.code === 'AuthenticationRequired') {
                    throw error;
                }

                // Retry on network/temporary errors
                if (attempt < this.maxRetries) {
                    const delay = this.retryDelay * attempt;
                    console.log(`⏳ Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError || new Error('Login failed after all retries');
    }

    /**
     * Create post with comprehensive error handling
     */
    async post(text: string, createdAt?: string): Promise<{ uri: string; cid: string }> {
        try {
            // Validate input
            if (!text || text.trim().length === 0) {
                throw new Error('Post text cannot be empty');
            }

            if (text.length > 300) {
                throw new Error(`Post exceeds 300 character limit: ${text.length} characters`);
            }

            // Ensure session is active
            if (!this.agent.session) {
                throw new Error('Not authenticated. Call login() first.');
            }

            console.log(`📤 Creating post (${text.length}/300 chars)...`);

            const result = await this.agent.post({
                text: text.trim(),
                createdAt: createdAt || new Date().toISOString()
            });

            console.log(`✅ Post created successfully`);
            console.log(`  URI: ${result.uri}`);
            console.log(`  CID: ${result.cid}`);

            return { uri: result.uri, cid: result.cid };

        } catch (error: any) {
            const errorDetails = this.parseError(error);
            console.error(`❌ Failed to create post:`);
            console.error(`  Status: ${errorDetails.status}`);
            console.error(`  Message: ${errorDetails.message}`);
            console.error(`  Code: ${errorDetails.code}`);

            throw error;
        }
    }

    /**
     * Parse and format API errors
     */
    private parseError(error: any): {
        status: number | null;
        message: string;
        code: string;
        details: string;
    } {
        let status = null;
        let message = 'Unknown error';
        let code = 'UNKNOWN';
        let details = '';

        // Handle XRPCError from @atproto/xrpc
        if (error instanceof XRPCError) {
            status = error.status;
            code = error.error || 'XRPC_ERROR';
            message = error.message;
            details = JSON.stringify(error.body || {});
        }
        // Handle standard Error
        else if (error instanceof Error) {
            message = error.message;
            
            // Try to extract error details from message
            if (message.includes('JSON')) {
                code = 'JSON_PARSE_ERROR';
                details = 'Failed to parse API response - may be invalid JSON from server';
            }
            if (message.includes('Unexpected end of JSON')) {
                code = 'JSON_TRUNCATION_ERROR';
                details = 'Response body was truncated - possible server issue or timeout';
            }
            if (message.includes('401') || message.includes('Unauthorized')) {
                status = 401;
                code = 'AUTH_ERROR';
            }
            if (message.includes('429') || message.includes('Too many')) {
                status = 429;
                code = 'RATE_LIMIT';
            }
            if (message.includes('500') || message.includes('Internal Server')) {
                status = 500;
                code = 'SERVER_ERROR';
            }
        }
        // Handle network errors
        else if (error.code) {
            code = error.code;
            message = error.message || error.code;
            details = `Network error: ${code}`;
        }

        return { status, message, code, details };
    }

    /**
     * Get session info
     */
    getSession() {
        return this.agent.session;
    }

    /**
     * Check if authenticated
     */
    isAuthenticated(): boolean {
        return !!this.agent.session;
    }

    /**
     * Create fresh agent (for cleanup)
     */
    reset(): void {
        this.agent = new BskyAgent({ service: 'https://bsky.social' });
    }
}

/**
 * Singleton instance for global use
 */
export const robustBskyAgent = new RobustBskyAgent();

/**
 * Helper function to create and authenticate agent
 */
export async function createAuthenticatedAgent(
    identifier: string,
    password: string
): Promise<RobustBskyAgent> {
    const agent = new RobustBskyAgent();
    await agent.login(identifier, password);
    return agent;
}
