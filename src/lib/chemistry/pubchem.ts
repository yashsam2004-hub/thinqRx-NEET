/**
 * PubChem Chemical Structure API
 * Free service to get chemical structure images
 */

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  timeoutMs: number = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ThinqR/1.0',
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Get chemical structure image URL from PubChem
 * @param chemicalName - Name of the chemical (e.g., "Thalidomide")
 * @returns Image URL from PubChem or null if not found
 */
export async function getChemicalStructureUrl(
  chemicalName: string
): Promise<string | null> {
  try {
    // Step 1: Search for the chemical by name with timeout
    const searchUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(chemicalName)}/cids/JSON`;
    
    const searchResponse = await fetchWithTimeout(searchUrl, 3000); // 3 second timeout
    if (!searchResponse.ok) return null;
    
    const searchData = await searchResponse.json();
    const cid = searchData?.IdentifierList?.CID?.[0];
    
    if (!cid) return null;
    
    // Step 2: Return PNG image URL for this compound
    return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG?image_size=large`;
  } catch (error: any) {
    // Fail silently for network errors - don't block notes generation
    if (error?.name === 'AbortError') {
      console.warn(`Timeout fetching structure for ${chemicalName}`);
    } else {
      console.warn(`Error fetching structure for ${chemicalName}:`, error?.message);
    }
    return null;
  }
}

/**
 * Batch get chemical structures with timeout protection
 */
export async function getChemicalStructures(
  chemicals: Array<{ name: string }>
): Promise<Array<{ name: string; imageUrl: string }>> {
  // Limit concurrent requests to avoid overload
  const MAX_CONCURRENT = 3;
  const results: Array<{ name: string; imageUrl: string }> = [];
  
  for (let i = 0; i < chemicals.length; i += MAX_CONCURRENT) {
    const batch = chemicals.slice(i, i + MAX_CONCURRENT);
    const batchResults = await Promise.allSettled(
      batch.map(async (chem) => {
        try {
          const url = await getChemicalStructureUrl(chem.name);
          return url ? { name: chem.name, imageUrl: url } : null;
        } catch (error) {
          console.warn(`Failed to fetch ${chem.name}`);
          return null;
        }
      })
    );
    
    const successfulResults = batchResults
      .filter((r) => r.status === "fulfilled" && r.value !== null)
      .map((r: any) => r.value);
    
    results.push(...successfulResults);
  }

  return results;
}
