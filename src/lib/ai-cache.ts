/**
 * AI Cache Utility
 * Reduces OpenAI/Anthropic API costs by caching AI-generated content
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';

export type CacheContentType = 'note' | 'explanation' | 'summary' | 'revision';

export interface CacheConfig {
  contentType: CacheContentType;
  exam: string;
  subject: string;
  topic?: string;
  version?: string;
}

export interface CachedContent {
  id: string;
  cache_key: string;
  content: any; // JSONB content
  content_type: string;
  exam: string;
  subject: string;
  topic: string | null;
  version: string;
  metadata: any;
  created_at: string;
}

/**
 * Generate deterministic cache key
 */
export function generateCacheKey(config: CacheConfig): string {
  const { contentType, exam, subject, topic, version = 'V1' } = config;
  
  if (topic) {
    return `${contentType}:${exam}:${subject}:${topic}:${version}`;
  }
  return `${contentType}:${exam}:${subject}:${version}`;
}

/**
 * Get cached AI content
 * Returns null if not found
 */
export async function getCachedContent(
  cacheKey: string
): Promise<CachedContent | null> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('ai_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .single();

    if (error || !data) {
      return null;
    }

    return data as CachedContent;
  } catch (error) {
    console.error('[AI Cache] Error fetching cached content:', error);
    return null;
  }
}

/**
 * Set cached AI content
 * Only callable by service role (backend only)
 */
export async function setCachedContent(
  config: CacheConfig,
  content: any,
  metadata?: any
): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const cacheKey = generateCacheKey(config);

    const { error } = await supabase
      .from('ai_cache')
      .upsert({
        cache_key: cacheKey,
        content,
        content_type: config.contentType,
        exam: config.exam,
        subject: config.subject,
        topic: config.topic || null,
        version: config.version || 'V1',
        metadata: metadata || {},
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'cache_key',
      });

    if (error) {
      console.error('[AI Cache] Error setting cached content:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[AI Cache] Error setting cached content:', error);
    return false;
  }
}

/**
 * Wrapper function for AI calls with automatic caching
 * 
 * Usage:
 * const content = await withAICache(
 *   { contentType: 'note', exam: 'GPAT', subject: 'Pharmacology', topic: 'ANS' },
 *   async () => {
 *     return await callOpenAI(...);
 *   }
 * );
 */
export async function withAICache<T>(
  config: CacheConfig,
  aiCallFn: () => Promise<T>
): Promise<T> {
  const cacheKey = generateCacheKey(config);

  // Try to get from cache first
  const cached = await getCachedContent(cacheKey);
  if (cached) {
    console.log(`[AI Cache] Cache HIT for key: ${cacheKey}`);
    return cached.content as T;
  }

  console.log(`[AI Cache] Cache MISS for key: ${cacheKey}, calling AI...`);

  // Call AI if not cached
  const aiResponse = await aiCallFn();

  // Store in cache for future use
  await setCachedContent(config, aiResponse);

  return aiResponse;
}

/**
 * Invalidate cache by key pattern
 * Useful for content regeneration
 */
export async function invalidateCache(
  pattern: {
    contentType?: string;
    exam?: string;
    subject?: string;
    topic?: string;
  }
): Promise<number> {
  try {
    const supabase = await createSupabaseServerClient();
    
    let query = supabase.from('ai_cache').delete();

    if (pattern.contentType) query = query.eq('content_type', pattern.contentType);
    if (pattern.exam) query = query.eq('exam', pattern.exam);
    if (pattern.subject) query = query.eq('subject', pattern.subject);
    if (pattern.topic) query = query.eq('topic', pattern.topic);

    const { error, count } = query;

    if (error) {
      console.error('[AI Cache] Error invalidating cache:', error);
      return 0;
    }

    console.log(`[AI Cache] Invalidated ${count || 0} cache entries`);
    return count || 0;
  } catch (error) {
    console.error('[AI Cache] Error invalidating cache:', error);
    return 0;
  }
}
