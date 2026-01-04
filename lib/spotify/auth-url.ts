import { SPOTIFY_AUTH_URL, SPOTIFY_SCOPES } from '@/types';

const generateCodeVerifier = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
};

const base64URLEncode = (buffer: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const sha256 = async (plain: string): Promise<ArrayBuffer> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
};

export const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
  const hashed = await sha256(codeVerifier);
  return base64URLEncode(new Uint8Array(hashed));
};

export const generateState = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
};

export const createAuthorizationUrl = async (state: string): Promise<string> => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID || '',
    scope: SPOTIFY_SCOPES.join(' '),
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
    state: state,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });

  sessionStorage.setItem('spotify_code_verifier', codeVerifier);
  sessionStorage.setItem('spotify_auth_state', state);

  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
};

export const generateCodeChallengeForServer = async (codeVerifier: string): Promise<string> => {
  return generateCodeChallenge(codeVerifier);
};

export const base64URLEncodeForServer = (buffer: Uint8Array): string => {
  return base64URLEncode(buffer);
};

export const generateCodeVerifierForServer = (): string => {
  return generateCodeVerifier();
};
