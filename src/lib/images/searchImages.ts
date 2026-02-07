/**
 * Search for CC BY licensed educational images
 * Uses Wikimedia Commons API for open-access scientific images
 */

export interface ImageResult {
  url: string;
  alt: string;
  caption?: string;
  source?: string;
  license?: string;
}

/**
 * Search Wikimedia Commons for educational images
 * All images from Wikimedia are CC BY-SA or Public Domain
 */
export async function searchWikimediaImages(
  query: string,
  limit: number = 1
): Promise<ImageResult[]> {
  try {
    // Wikimedia Commons API endpoint
    const apiUrl = new URL("https://commons.wikimedia.org/w/api.php");
    apiUrl.searchParams.set("action", "query");
    apiUrl.searchParams.set("format", "json");
    apiUrl.searchParams.set("generator", "search");
    apiUrl.searchParams.set("gsrsearch", query);
    apiUrl.searchParams.set("gsrlimit", limit.toString());
    apiUrl.searchParams.set("gsrnamespace", "6"); // File namespace
    apiUrl.searchParams.set("prop", "imageinfo");
    apiUrl.searchParams.set("iiprop", "url|extmetadata");
    apiUrl.searchParams.set("origin", "*");

    const response = await fetch(apiUrl.toString(), {
      headers: {
        "User-Agent": "ThinqRx/1.0 (Educational Platform)",
      },
    });

    if (!response.ok) {
      console.warn(`Wikimedia API error: ${response.status}`);
      return [];
    }

    const data = await response.json();

    if (!data.query?.pages) {
      return [];
    }

    const results: ImageResult[] = [];

    for (const page of Object.values(data.query.pages)) {
      const pageData = page as any;
      const imageInfo = pageData.imageinfo?.[0];

      if (!imageInfo?.url) continue;

      const metadata = imageInfo.extmetadata;
      const license =
        metadata?.LicenseShortName?.value || metadata?.License?.value || "CC BY-SA";
      const description = metadata?.ImageDescription?.value || query;
      const artist = metadata?.Artist?.value || "Wikimedia Commons";

      // Clean HTML from description
      const cleanDescription = description.replace(/<[^>]*>/g, "").trim();

      results.push({
        url: imageInfo.url,
        alt: cleanDescription.substring(0, 200),
        caption: cleanDescription.substring(0, 200),
        source: imageInfo.descriptionurl,
        license: license,
      });

      if (results.length >= limit) break;
    }

    return results;
  } catch (error) {
    console.error("Error searching Wikimedia images:", error);
    return [];
  }
}

/**
 * Get relevant educational images for a topic
 */
export async function getTopicImages(
  topicName: string,
  subjectName: string
): Promise<ImageResult[]> {
  const queries = [
    `${topicName} ${subjectName} diagram`,
    `${topicName} chemistry illustration`,
    `${topicName} structure`,
  ];

  const results: ImageResult[] = [];

  for (const query of queries) {
    const images = await searchWikimediaImages(query, 1);
    if (images.length > 0) {
      results.push(...images);
      if (results.length >= 2) break;
    }
  }

  return results;
}

/**
 * Fallback placeholder image data for when no images are found
 */
export function getPlaceholderImage(topicName: string): ImageResult {
  return {
    url: `https://placehold.co/800x400/EEE/999?text=${encodeURIComponent(topicName)}`,
    alt: `${topicName} illustration`,
    caption: `Illustration for ${topicName}`,
    license: "Placeholder",
  };
}
