/**
 * Clean and normalize search query for Lavashark / Lavalink
 * Handles Discord link wrappers like `<https://...>`, trims whitespace,
 * and extracts clean URLs or search terms.
 */
export function cleanSearchQuery(query: string): string {
    if (!query) return '';

    let cleaned = query.trim();

    // Remove Discord link wrapper brackets: <https://...> -> https://...
    cleaned = cleaned.replace(/^<(.+)>$/, '$1').trim();

    return cleaned;
}
