import { SpotifyToken } from '@/types';

const ENCRYPTION_KEY = 'navispot-plist-secure-key-32bytes!';

const base64Encode = (str: string): string => {
  return btoa(str);
};

const encryptData = async (data: string, key: string): Promise<string> => {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key.padEnd(32, '0').slice(0, 32));
  const iv = crypto.getRandomValues(new Uint8Array(16));
  
  const dataBuffer = encoder.encode(data);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-CBC' },
    false,
    ['encrypt']
  );
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv: iv },
    cryptoKey,
    dataBuffer
  );
  
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return base64Encode(String.fromCharCode(...combined));
};

const decryptData = async (encryptedData: string, key: string): Promise<string> => {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key.padEnd(32, '0').slice(0, 32));
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(c => c.charCodeAt(0))
    );
    
    const iv = combined.slice(0, 16);
    const data = combined.slice(16);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-CBC' },
      false,
      ['decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: iv },
      cryptoKey,
      data
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch {
    return '';
  }
};

export const encryptToken = async (token: SpotifyToken): Promise<string> => {
  const data = JSON.stringify(token);
  return encryptData(data, ENCRYPTION_KEY);
};

export const decryptToken = async (encrypted: string): Promise<SpotifyToken | null> => {
  try {
    const data = await decryptData(encrypted, ENCRYPTION_KEY);
    if (!data) return null;
    return JSON.parse(data) as SpotifyToken;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: SpotifyToken): boolean => {
  const bufferMs = 60 * 1000;
  return Date.now() + bufferMs >= token.expiresAt;
};
