import { ResumeItem } from '../../types/Resume';

/**
 * Normalizes and unifies data across different parsers
 * Ensures consistent data structure regardless of source format
 */
export class ParserNormalizer {
  /**
   * Normalizes a resume item to ensure consistent structure
   * Prioritizes certain fields and consolidates data when needed
   *
   * @param item The resume item to normalize
   * @returns The normalized resume item
   */
  static normalizeResumeItem(item: ResumeItem): ResumeItem {
    // Create a copy to avoid modifying the original
    const normalized = { ...item };

    // For skills, ensure content is in the details field
    if (item.content && item.content.length > 0) {
      normalized.details = normalized.details || [];

      // Only add non-duplicate content
      for (const content of item.content) {
        if (!normalized.details.includes(content)) {
          normalized.details.push(content);
        }
      }
    }

    // Process tags field similarly
    if (item.tags && item.tags.length > 0) {
      normalized.details = normalized.details || [];

      // Only add non-duplicate tags
      for (const tag of item.tags) {
        if (!normalized.details.includes(tag)) {
          normalized.details.push(tag);
        }
      }
    }

    // Process nested items if they exist
    if (normalized.items && normalized.items.length > 0) {
      normalized.items = normalized.items.map(this.normalizeResumeItem);
    }

    return normalized;
  }
}
