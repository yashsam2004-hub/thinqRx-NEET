import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { generateDeviceFingerprint, getDeviceInfo } from '@/lib/device/fingerprint';

const MAX_DEVICES = 2;
const DEVICE_EXPIRY_DAYS = 90; // Auto-expire inactive devices after 90 days

export interface DeviceLimitResult {
  allowed: boolean;
  deviceCount: number;
  message?: string;
}

/**
 * Check if user has exceeded device limit
 * - Allows up to 2 active devices per user
 * - Auto-expires devices inactive for 90+ days
 * - Returns existing device if already registered
 */
export async function checkDeviceLimit(userId: string): Promise<DeviceLimitResult> {
  const supabase = createSupabaseAdminClient();
  const deviceFingerprint = await generateDeviceFingerprint();
  
  console.log('[DeviceLimit] Checking device limit for user:', userId);
  
  // 1. Clean up expired devices (inactive for 90+ days)
  const expiryDate = new Date(Date.now() - DEVICE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const { error: expiryError } = await supabase
    .from('user_devices')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true)
    .lt('last_seen', expiryDate.toISOString());
  
  if (expiryError) {
    console.error('[DeviceLimit] Error expiring old devices:', expiryError);
  }
  
  // 2. Check if current device already exists
  const { data: existingDevice, error: existingError } = await supabase
    .from('user_devices')
    .select('id')
    .eq('user_id', userId)
    .eq('device_fingerprint', deviceFingerprint)
    .eq('is_active', true)
    .maybeSingle();
  
  if (existingError) {
    console.error('[DeviceLimit] Error checking existing device:', existingError);
  }
  
  if (existingDevice) {
    // Update last_seen for existing device
    console.log('[DeviceLimit] Existing device found, updating last_seen');
    await supabase
      .from('user_devices')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', existingDevice.id);
    
    return { allowed: true, deviceCount: 1 };
  }
  
  // 3. Count active devices
  const { count, error: countError } = await supabase
    .from('user_devices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true);
  
  if (countError) {
    console.error('[DeviceLimit] Error counting devices:', countError);
    // Allow login on error to prevent false lockouts
    return { allowed: true, deviceCount: 0 };
  }
  
  const deviceCount = count || 0;
  console.log('[DeviceLimit] Active device count:', deviceCount);
  
  if (deviceCount >= MAX_DEVICES) {
    console.log('[DeviceLimit] Device limit exceeded');
    return {
      allowed: false,
      deviceCount,
      message: `Maximum ${MAX_DEVICES} devices allowed. Please contact support at support@neetprep.com to reset your devices.`
    };
  }
  
  // 4. Register new device
  console.log('[DeviceLimit] Registering new device');
  const deviceInfo = await getDeviceInfo();
  
  const { error: insertError } = await supabase.from('user_devices').insert({
    user_id: userId,
    device_fingerprint: deviceFingerprint,
    device_name: deviceInfo.deviceName,
    ip_address: deviceInfo.ip,
    user_agent: deviceInfo.userAgent,
  });
  
  if (insertError) {
    console.error('[DeviceLimit] Error registering device:', insertError);
    // Allow login even if registration fails (graceful degradation)
    return { allowed: true, deviceCount: deviceCount };
  }
  
  console.log('[DeviceLimit] New device registered successfully');
  return { allowed: true, deviceCount: deviceCount + 1 };
}

/**
 * Reset all devices for a user (admin only)
 * Deactivates all existing devices so user can login fresh
 */
export async function resetUserDevices(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createSupabaseAdminClient();
  
  console.log('[DeviceLimit] Resetting all devices for user:', userId);
  
  const { error } = await supabase
    .from('user_devices')
    .update({ is_active: false })
    .eq('user_id', userId);
  
  if (error) {
    console.error('[DeviceLimit] Error resetting devices:', error);
    return { success: false, error: error.message };
  }
  
  console.log('[DeviceLimit] All devices reset successfully');
  return { success: true };
}

/**
 * Get active device count for a user
 */
export async function getActiveDeviceCount(userId: string): Promise<number> {
  const supabase = createSupabaseAdminClient();
  
  const { count, error } = await supabase
    .from('user_devices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true);
  
  if (error) {
    console.error('[DeviceLimit] Error counting devices:', error);
    return 0;
  }
  
  return count || 0;
}
