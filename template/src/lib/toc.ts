export interface TocEntry {
  depth: number;
  text: string;
  slug: string;
}

export interface TocConfig {
  minHeadingLevel?: number;
  maxHeadingLevel?: number;
}

export function getHeadings(headings: { depth: number; text: string; slug: string }[], config?: TocConfig): TocEntry[] {
  const min = config?.minHeadingLevel ?? 2;
  const max = config?.maxHeadingLevel ?? 3;
  return headings.filter((h) => h.depth >= min && h.depth <= max);
}
