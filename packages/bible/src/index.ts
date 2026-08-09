export interface ScriptureReference {
  book: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  display: string;
}

export interface ScripturePassage {
  reference: string;
  translationId: string;
  provider: string;
  text: string;
  copyrightNotice?: string;
  canonicalUrl?: string;
}

export interface BibleProvider {
  getPassage(reference: string, translationId: string): Promise<ScripturePassage>;
}

const referencePattern = /^([1-3]?\s?[A-Za-z]+(?:\s[A-Za-z]+)*)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/;

export function parseScriptureReference(input: string): ScriptureReference {
  const normalized = input.trim().replace(/\s+/g, " ");
  const match = referencePattern.exec(normalized);
  if (!match) throw new Error(`Invalid Scripture reference: ${input}`);

  const [, book, chapter, verseStart, verseEnd] = match;
  if (!book || !chapter) throw new Error(`Invalid Scripture reference: ${input}`);
  return {
    book,
    chapter: Number(chapter),
    ...(verseStart ? { verseStart: Number(verseStart) } : {}),
    ...(verseEnd ? { verseEnd: Number(verseEnd) } : {}),
    display: normalized,
  };
}

export class ReferenceOnlyBibleProvider implements BibleProvider {
  async getPassage(reference: string, translationId: string): Promise<ScripturePassage> {
    parseScriptureReference(reference);
    return {
      reference,
      translationId,
      provider: "reference-only",
      text: "Licensed Bible text is not bundled. Configure an approved provider before displaying passage text.",
      copyrightNotice: "Reference-only development response.",
    };
  }
}
