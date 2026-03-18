# 📺 YouTube Integration Guide

## Overview
This guide explains how to integrate YouTube videos into NEET Prep notes for enhanced learning experience.

---

## ✅ **Current Status**

### Completed:
- ✅ VideoBlock component created (`src/components/VideoBlock.tsx`)
- ✅ Schema updated to support video blocks
- ✅ UI ready for YouTube embeds
- ✅ Placeholder for video suggestions

### Pending:
- ⏳ YouTube Data API v3 integration
- ⏳ AI-powered video selection
- ⏳ Video search based on topic relevance

---

## 🔑 **YouTube API Setup Required**

### Step 1: Get YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **YouTube Data API v3**
4. Create credentials → **API Key**
5. Copy the API key

### Step 2: Add to Environment Variables

Add to `.env.local`:
```env
YOUTUBE_API_KEY=your_youtube_api_key_here
```

---

## 📝 **Implementation Plan**

### Phase 1: YouTube Search API
Create `src/lib/youtube/searchVideos.ts`:

```typescript
interface VideoResult {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
}

export async function searchEducationalVideos(
  query: string,
  maxResults: number = 3
): Promise<VideoResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", maxResults.toString());
  url.searchParams.set("videoEmbeddable", "true");
  url.searchParams.set("relevanceLanguage", "en");
  url.searchParams.set("key", apiKey!);
  
  // Educational channels filter
  url.searchParams.set("videoCategoryId", "27"); // Education category
  
  const response = await fetch(url.toString());
  const data = await response.json();
  
  return data.items.map((item: any) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnail: item.snippet.thumbnails.high.url,
    channelTitle: item.snippet.channelTitle,
  }));
}
```

### Phase 2: AI-Powered Video Selection

Update `src/lib/ai/generateNotes.ts` to include video suggestions:

```typescript
// After generating notes, search for relevant videos
const videoQueries = [
  `${topicName} ${subjectName} tutorial`,
  `${topicName} NEET UG preparation`,
  `${topicName} NCERT explained`,
];

const videos: VideoResult[] = [];
for (const query of videoQueries) {
  const results = await searchEducationalVideos(query, 1);
  if (results.length > 0) {
    videos.push(results[0]);
    if (videos.length >= 2) break;
  }
}

// Add video blocks to notes
sections.push({
  id: "recommended-videos",
  title: "📺 Recommended Videos",
  blocks: videos.map(video => ({
    type: "video",
    videoId: video.videoId,
    title: video.title,
    description: video.description,
  })),
});
```

### Phase 3: Curated Educational Channels

Prioritize videos from trusted pharmacy education channels:

```typescript
const TRUSTED_CHANNELS = [
  "UCJ3vGO4z8N0qI5XmE7V7qYA", // Example: NEET education channel
  // Add more trusted channel IDs
];

// Filter search results by trusted channels
const filteredVideos = results.filter(video =>
  TRUSTED_CHANNELS.includes(video.channelId)
);
```

---

## 🎨 **UI Features**

### Current VideoBlock Features:
- ✅ Lazy loading (click to load)
- ✅ Embedded YouTube player
- ✅ Link to open in YouTube
- ✅ Purple gradient theme (matches design)
- ✅ Responsive iframe

### Future Enhancements:
- [ ] Video duration display
- [ ] View count filter (quality indicator)
- [ ] User ratings/reviews
- [ ] Bookmark videos for later
- [ ] Video progress tracking

---

## 🔍 **Search Query Optimization**

### Best Practices for Video Search:

```typescript
// Good queries
const queries = [
  `${topicName} NEET UG`, // NEET context
  `${topicName} ${subjectName} tutorial`, // Subject context
  `${topicName} concept explained`, // Conceptual
  `${topicName} NCERT Class 11 12`, // Domain-specific
];

// Filter criteria
const filters = {
  minDuration: 300, // 5 minutes (avoid too short)
  maxDuration: 1800, // 30 minutes (avoid too long)
  minViews: 1000, // Quality indicator
  uploadedWithin: "year", // Recent content
};
```

---

## 📊 **Quality Assurance**

### Video Relevance Scoring:
```typescript
function calculateRelevanceScore(video: VideoResult, topic: string): number {
  let score = 0;
  
  // Title relevance
  if (video.title.toLowerCase().includes(topic.toLowerCase())) score += 3;
  
  // Educational keywords
  const eduKeywords = ["tutorial", "explained", "lecture", "course", "lesson"];
  if (eduKeywords.some(kw => video.title.toLowerCase().includes(kw))) score += 2;
  
  // NEET/Medical keywords
  const neetKeywords = ["neet", "ncert", "medical", "biology", "physics", "chemistry"];
  if (neetKeywords.some(kw => video.title.toLowerCase().includes(kw))) score += 3;
  
  // Channel credibility (if from trusted channels)
  if (TRUSTED_CHANNELS.includes(video.channelId)) score += 5;
  
  return score;
}
```

---

## 🚀 **Deployment Checklist**

Before going live with YouTube integration:

- [ ] YouTube API key added to environment variables
- [ ] API quota limits configured (10,000 units/day default)
- [ ] Error handling for API failures
- [ ] Caching strategy for video search results
- [ ] Content policy compliance check
- [ ] User feedback mechanism for video quality

---

## 💡 **Next Steps**

**When you provide the YouTube API key:**
1. I'll implement the video search function
2. Integrate it into notes generation
3. Add automatic video suggestions for all topics
4. Enable video recommendations based on NEET UG curriculum

**For now:**
- VideoBlock is ready and can manually embed videos
- Schema supports video blocks
- UI is polished and functional

---

## 📖 **User Benefits**

### With YouTube Integration:
- 🎥 **Visual learning** - Watch concepts in action
- 👨‍🏫 **Expert explanations** - Learn from top educators
- 📚 **Multiple perspectives** - Different teaching styles
- ⏱️ **Flexible learning** - Watch at your own pace
- 🔖 **Supplementary content** - Reinforce AI-generated notes

---

**Ready to integrate as soon as you provide the YouTube API key!** 🚀
