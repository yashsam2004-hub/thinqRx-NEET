import { headers } from 'next/headers';
import crypto from 'crypto';

/**
 * Generate a stable device fingerprint based on User-Agent and IP subnet
 * This creates a consistent identifier per device while handling dynamic IPs
 */
export async function generateDeviceFingerprint(): Promise<string> {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || 'unknown';
  const ip = headersList.get('x-forwarded-for') || 
             headersList.get('x-real-ip') || 'unknown';
  
  // Create stable fingerprint from UA + simplified IP subnet
  // Using first 3 octets of IP (e.g., 192.168.1.x) handles dynamic IPs
  const ipPrefix = ip.split('.').slice(0, 3).join('.');
  const fingerprint = `${userAgent}|${ipPrefix}`;
  
  // Hash for privacy and consistent length
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
}

/**
 * Parse device name from User-Agent string
 * Returns human-readable device description like "Chrome on Windows"
 */
export function parseDeviceName(userAgent: string): string {
  if (!userAgent || userAgent === 'unknown') {
    return 'Unknown Device';
  }

  // Detect browser
  let browser = 'Unknown Browser';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    browser = 'Opera';
  }

  // Detect OS
  let os = 'Unknown OS';
  if (userAgent.includes('Windows NT 10')) {
    os = 'Windows 10/11';
  } else if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS X')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
  }

  return `${browser} on ${os}`;
}

/**
 * Get device information from headers for logging
 */
export async function getDeviceInfo(): Promise<{
  userAgent: string;
  ip: string;
  deviceName: string;
}> {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || 'unknown';
  const ip = headersList.get('x-forwarded-for') || 
             headersList.get('x-real-ip') || 'unknown';
  
  return {
    userAgent,
    ip,
    deviceName: parseDeviceName(userAgent),
  };
}
