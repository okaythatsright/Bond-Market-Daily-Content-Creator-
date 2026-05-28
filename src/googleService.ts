import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add required Workspace scopes
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/documents');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Since Firebase token persists but the OAuth access token needs to be retrieved,
        // we ask the client to re-login if the OAuth access token is not cached.
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Initiate Google Sign-in popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token from OAuth.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign-in Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

/**
 * Find or create a Google Spreadsheet titled "Bond Market Bluesky Log"
 */
export async function findOrCreateSpreadsheet(accessToken: string): Promise<string> {
  const query = encodeURIComponent("name = 'Bond Market Bluesky Log' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;
  
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (!searchRes.ok) {
    const errText = await searchRes.text();
    throw new Error(`Failed to search Google Drive: ${errText}`);
  }
  
  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }
  
  // Create spreadsheet if it doesn't exist
  const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: 'Bond Market Bluesky Log'
      }
    })
  });
  
  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Spreadsheet: ${errText}`);
  }
  
  const createData = await createRes.json();
  return createData.spreadsheetId;
}

/**
 * Ensure all required section sheets (tabs) exist inside the spreadsheet
 */
export async function ensureSheetsExist(
  accessToken: string,
  spreadsheetId: string,
  sectionTitles: string[]
): Promise<void> {
  // Get current sheets
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(title,sheetId))`;
  const metaRes = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (!metaRes.ok) {
    throw new Error(`Failed to fetch spreadsheet metadata: ${await metaRes.text()}`);
  }
  
  const metaData = await metaRes.json();
  const existingSheets = metaData.sheets || [];
  const existingTitles = new Set<string>(existingSheets.map((s: any) => s.properties.title));
  
  const requests: any[] = [];
  
  for (const title of sectionTitles) {
    if (!existingTitles.has(title)) {
      requests.push({
        addSheet: {
          properties: { title }
        }
      });
    }
  }

  // Delete the default 'Sheet1' tab if it exists and we have other sheets present or being added
  const sheet1 = existingSheets.find((s: any) => s.properties.title === 'Sheet1');
  if (sheet1 && (existingSheets.length > 1 || requests.length > 0)) {
    requests.push({
      deleteSheet: {
        sheetId: sheet1.properties.sheetId
      }
    });
  }
  
  if (requests.length > 0) {
    // Create the sheets and delete Sheet1 in a single transactional batch
    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    const batchRes = await fetch(batchUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });
    
    if (!batchRes.ok) {
      throw new Error(`Failed to add sheets or remove default tab in batch: ${await batchRes.text()}`);
    }
  }

  // Set the structural headers 'Entry #', 'Date', 'Time', 'Category', 'BlueSky Post' on Row 1 (A1:E1) for all section tabs
  const batchValueUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const headers = ['Entry #', 'Date', 'Time', 'Category', 'BlueSky Post'];
  const valueRanges = sectionTitles.map(title => ({
    range: `${title}!A1:E1`,
    values: [headers]
  }));

  const valueRes = await fetch(batchValueUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: valueRanges
    })
  });

  if (!valueRes.ok) {
    console.warn(`Failed to set structural log headers in batch: ${await valueRes.text()}`);
  }
}

/**
 * Append a row to a specified category sheet tab. Automatically determines high-fidelity increments for 'Entry #' (Output 01).
 */
export async function appendLogEntry(
  accessToken: string,
  spreadsheetId: string,
  sectionTitle: string,
  postText: string,
  entryDateTimeUTC: Date
): Promise<{ entryNumber: number }> {
  const range = `${sectionTitle}!A:E`;
  const valUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  
  const getValuesRes = await fetch(valUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  let entryNumber = 1;
  let valuesExist = false;
  
  if (getValuesRes.ok) {
    const valData = await getValuesRes.json();
    if (valData.values && valData.values.length > 0) {
      valuesExist = true;
      // Filter out empty rows or headers to find last numerical entry
      const rows = valData.values;
      for (let i = rows.length - 1; i >= 1; i--) {
        const lastEntryNumVal = parseInt(rows[i][0], 10);
        if (!isNaN(lastEntryNumVal)) {
          entryNumber = lastEntryNumVal + 1;
          break;
        }
      }
      // If there's only headers
      if (rows.length === 1) {
        entryNumber = 1;
      }
    }
  }
  
  // Format Date and Time
  // Prompt specifies 4:30pm Central Time daily log.
  // We can write both the general GMT string and the customized central time string.
  const centralDateStr = entryDateTimeUTC.toLocaleDateString('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const centralTimeStr = entryDateTimeUTC.toLocaleTimeString('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }); // returns e.g. "4:30 PM"
  
  const headers = ['Entry #', 'Date', 'Time', 'Category', 'BlueSky Post'];
  const valuesToAppend: any[][] = [];
  
  // If the sheet values did not exist or we are restarting, write headers if it looks completely empty
  const writeHeaders = !valuesExist;
  if (writeHeaders) {
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sectionTitle + '!A1:E1')}?valueInputOption=USER_ENTERED`;
    await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: `${sectionTitle}!A1:E1`,
        majorDimension: 'ROWS',
        values: [headers]
      })
    });
  }
  
  valuesToAppend.push([
    entryNumber,
    centralDateStr,
    centralTimeStr,
    sectionTitle, // 'Category' column, identifying the category for each post dynamically
    postText
  ]);
  
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sectionTitle + '!A:E')}:append?valueInputOption=USER_ENTERED`;
  const appendRes = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: `${sectionTitle}!A:E`,
      majorDimension: 'ROWS',
      values: valuesToAppend
    })
  });
  
  if (!appendRes.ok) {
    throw new Error(`Failed to append log entry: ${await appendRes.text()}`);
  }
  
  return { entryNumber };
}
