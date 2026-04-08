import { getIdToken } from './firebase';

// TODO: Replace with your Cloud Functions URL after deployment
const FUNCTIONS_BASE_URL = 'https://asia-northeast3-YOUR_PROJECT_ID.cloudfunctions.net';

export async function authenticatedFetch(
  path: string,
  body: object,
  retries = 2
): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const token = await getIdToken(i > 0); // forceRefresh on retry
    const res = await fetch(`${FUNCTIONS_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (res.status === 401 && i < retries) continue; // token expired → refresh & retry
    return res;
  }

  throw new Error('Authentication failed after retries');
}

export { FUNCTIONS_BASE_URL };
