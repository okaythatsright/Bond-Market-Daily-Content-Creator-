# BlueSky SDK Debugging Guide

## Overview

This guide provides comprehensive debugging strategies for BlueSky API integration in the Bond Market Daily Content Creator.

---

## 🔧 BlueSky Debugger Module

The `src/bluesky-debugger.ts` module provides enhanced debugging capabilities for BlueSky interactions.

### Quick Start

```typescript
import { blueSkyDebugger } from './src/bluesky-debugger';

// Test credentials
const result = await blueSkyDebugger.testCredentials(
  'your_handle@bsky.social',
  'your_app_password'
);

console.log('Credentials valid:', result.success);
```

---

## 📊 Debugging Methods

### 1. Test Credentials

```typescript
const result = await blueSkyDebugger.testCredentials(identifier, password);

// Returns:
{
  success: boolean,
  handle?: string,
  did?: string,
  service?: string,
  errors?: string[]
}
```

**Use when:**
- Authentication fails
- Handle or DID needs verification
- Troubleshooting login issues

---

### 2. Test Posting

```typescript
const result = await blueSkyDebugger.testPosting(
  identifier,
  password,
  'Test post content here'
);

// Returns:
{
  success: boolean,
  uri?: string,
  cid?: string,
  postUrl?: string,
  errors?: string[]
}
```

**Use when:**
- Post publishing fails
- Verifying posting permissions
- Testing before batch operations

---

### 3. Validate Post Content

```typescript
const validation = blueSkyDebugger.validatePost('Your post text');

// Returns:
{
  valid: boolean,
  errors: string[],
  characterCount: number,
  remainingCharacters: number
}
```

**Checks:**
- ✅ Non-empty content
- ✅ Character count (max 300)
- ✅ Required formatting

---

### 4. Batch Posting

```typescript
const results = await blueSkyDebugger.batchPost(
  identifier,
  password,
  [
    { id: 'post-1', text: 'First post' },
    { id: 'post-2', text: 'Second post' },
    { id: 'post-3', text: 'Third post' }
  ],
  1000 // delay between posts in ms
);

// Returns detailed results per post
```

**Features:**
- Single authentication
- Per-post error handling
- Configurable delays
- Detailed logging

---

### 5. Get Diagnostics

```typescript
const diagnostics = blueSkyDebugger.getDiagnostics();

// Returns:
{
  environment: {
    hasIdentifier: boolean,
    hasPassword: boolean,
    nodeEnv: string
  },
  logs: string[],
  recommendations: string[]
}
```

---

## 🐛 Common Issues & Solutions

### Issue: Invalid Login Credentials

**Error:**
```
Login failed: Invalid identifier or password
```

**Solutions:**
1. ✅ Verify handle/email format:
   - `@username` or `username`
   - `email@domain.com`
   - `bsky.app/profile/username`

2. ✅ Check app password:
   - Go to https://bsky.app/settings/app-passwords
   - Generate NEW app password (old ones may expire)
   - Do NOT use account password

3. ✅ Test via debugger:
```typescript
const test = await blueSkyDebugger.testCredentials(
  'your_handle',
  'your_app_password'
);
console.log('Valid:', test.success);
console.log('Errors:', test.errors);
```

---

### Issue: Post Exceeds Character Limit

**Error:**
```
Post exceeds 300 character limit: 325 chars
```

**Solutions:**
1. ✅ Validate before posting:
```typescript
const validation = blueSkyDebugger.validatePost(postText);
if (!validation.valid) {
  console.error('Post too long:', validation.errors);
  console.log(`Remaining: ${validation.remainingCharacters}`);
}
```

2. ✅ Trim Gemini output in scheduler:
```typescript
// In src/scheduler.ts
let postText = post.postText;
if (postText.length > 300) {
  postText = postText.substring(0, 297) + '...';
}
```

---

### Issue: Rate Limiting

**Error:**
```
Too many requests to BlueSky API
```

**Solutions:**
1. ✅ Increase delay between posts:
```typescript
// In scheduler.ts, change delay
await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds
```

2. ✅ Use batch post with proper delays:
```typescript
const results = await blueSkyDebugger.batchPost(
  identifier,
  password,
  posts,
  2000 // Increased delay
);
```

---

### Issue: Session Expired

**Error:**
```
Session expired or invalid
```

**Solutions:**
1. ✅ Re-authenticate fresh session:
```typescript
// Don't reuse old agent, create new one
const agent = new BskyAgent({ service: 'https://bsky.social' });
await agent.login({ identifier, password });
```

2. ✅ In scheduler, always fresh login:
```typescript
// Current implementation already does this ✓
const agent = await this.loginBlueSky();
```

---

### Issue: Network/Connection Errors

**Error:**
```
Failed to connect to bsky.social
ECONNREFUSED or ETIMEDOUT
```

**Solutions:**
1. ✅ Check network connectivity:
```bash
ping bsky.social
curl https://bsky.social
```

2. ✅ Check BlueSky status:
- Visit https://status.bsky.app
- Check for ongoing incidents

3. ✅ Add retry logic in scheduler:
```typescript
async function loginWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await loginBlueSky();
    } catch (error) {
      if (i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }
  throw new Error('Login failed after retries');
}
```

---

## 🧪 Testing Workflows

### Full Integration Test

```typescript
import { blueSkyDebugger } from './src/bluesky-debugger';

async function fullIntegrationTest() {
  console.log('🧪 Starting Full BlueSky Integration Test\n');

  const identifier = process.env.BLUESKY_IDENTIFIER!;
  const password = process.env.BLUESKY_PASSWORD!;

  // Step 1: Test credentials
  console.log('Step 1: Testing credentials...');
  const credTest = await blueSkyDebugger.testCredentials(identifier, password);
  if (!credTest.success) {
    console.error('❌ Credentials test failed:', credTest.errors);
    return;
  }
  console.log(`✅ Authenticated as: ${credTest.handle}\n`);

  // Step 2: Test single post
  console.log('Step 2: Testing single post...');
  const testPost = '🤖 Test post from Bond Market Bot - 123456789';
  const postTest = await blueSkyDebugger.testPosting(
    identifier,
    password,
    testPost
  );
  if (!postTest.success) {
    console.error('❌ Post test failed:', postTest.errors);
    return;
  }
  console.log(`✅ Post created: ${postTest.postUrl}\n`);

  // Step 3: Test batch posting
  console.log('Step 3: Testing batch posting...');
  const batchPosts = [
    { id: 'test-1', text: '📊 Bond Market Test 1 - Testing BlueSky integration' },
    { id: 'test-2', text: '📊 Bond Market Test 2 - Multiple posts in sequence' },
    { id: 'test-3', text: '📊 Bond Market Test 3 - Final test post' }
  ];

  const batchResult = await blueSkyDebugger.batchPost(
    identifier,
    password,
    batchPosts,
    1000
  );
  console.log(`✅ Batch complete: ${batchResult.successful}/${batchResult.total} successful\n`);

  // Step 4: Get diagnostics
  console.log('Step 4: System diagnostics...');
  const diagnostics = blueSkyDebugger.getDiagnostics();
  console.log('Environment:', diagnostics.environment);
  console.log('Recommendations:', diagnostics.recommendations);
  console.log('\n✅ Full integration test complete!');
}

// Run: await fullIntegrationTest();
```

---

## 📋 Environment Configuration Checklist

```bash
# .env.local

# ✅ BlueSky Setup
BLUESKY_IDENTIFIER=your_handle@bsky.social
# Get from: https://bsky.app/settings/app-passwords
BLUESKY_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx xxxx xxxx

# ✅ Verify these work:
# 1. Visit https://bsky.app/settings/app-passwords
# 2. Create new app password
# 3. Test with debugger before deploying
```

---

## 🔍 Debug API Endpoints

### Test BlueSky Connection (POST)

```bash
curl -X POST http://localhost:3000/api/bluesky/test \
  -H "Content-Type: application/json" \
  -d '{
    "loginToken": "your_handle",
    "password": "your_app_password",
    "testText": "🤖 Test post"
  }'
```

### Response

```json
{
  "success": true,
  "message": "Connection successfully verified",
  "profile": {
    "handle": "your_handle.bsky.social",
    "service": "https://bsky.social"
  },
  "postResult": {
    "uri": "at://...",
    "cid": "bafy..."
  }
}
```

---

## 📈 Logging & Monitoring

### Enable Debug Mode

In dashboard or code:
```typescript
const debugger = new BlueSkyDebugger(true); // Enable detailed logging
```

### View Logs

```typescript
const logs = blueSkyDebugger.exportLogs();
console.log(logs);

// Or get last 10 logs
const diagnostics = blueSkyDebugger.getDiagnostics();
console.log(diagnostics.logs.slice(-10));
```

### Clear Logs

```typescript
blueSkyDebugger.clearLogs();
```

---

## ⚠️ Important Notes

### Security
- 🔒 Never commit `.env.local` to git
- 🔒 Use app-specific passwords, NOT account password
- 🔒 Rotate app passwords periodically
- 🔒 Don't share credentials

### Rate Limiting
- 📊 BlueSky has rate limits on posting
- ⏱️ Use 1-2 second delays between posts
- 📈 Monitor error responses for rate limit headers

### Character Limits
- 📝 Strict 300 character limit for BlueSky posts
- ✂️ Always validate before posting
- 🔄 Trim Gemini output if needed

---

## 🆘 Getting Help

If debugging doesn't resolve issues:

1. **Check BlueSky Status**: https://status.bsky.app
2. **Enable Debug Mode**: Set `debugMode: true`
3. **Review Logs**: Export and analyze logs
4. **Test Manually**: Use test posting endpoint
5. **Verify Credentials**: Use credential test method
6. **Check Network**: Verify bsky.social is accessible

---

## 📚 BlueSky SDK Reference

- Official Docs: https://github.com/bluesky-social/atproto
- API Reference: https://docs.bsky.app/
- BlueSky App: https://bsky.app

---

**Last Updated:** May 31, 2026  
**Version:** 1.0.0
