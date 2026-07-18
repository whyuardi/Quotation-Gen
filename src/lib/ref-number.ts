/**
 * Auto-generate quotation reference numbers in format: NNN/JGD/ROMAN_MONTH/YY
 * Example: "002/JGD/VII/26" (2nd quotation, July, 2026)
 */

const ROMAN_MONTHS: Record<number, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
  6: "VI",
  7: "VII",
  8: "VIII",
  9: "IX",
  10: "X",
  11: "XI",
  12: "XII",
};

/**
 * Generate a ref number from a sequence number and date.
 * @param sequenceNumber - The next sequence number for this year (1-based)
 * @param date - The date of the quotation
 * @returns Formatted ref number like "002/JGD/VII/26"
 */
export function generateRefNumber(
  sequenceNumber: number,
  date: Date = new Date()
): string {
  const seq = String(sequenceNumber).padStart(3, "0");
  const month = date.getMonth() + 1; // 0-indexed → 1-indexed
  const romanMonth = ROMAN_MONTHS[month];
  const year = String(date.getFullYear()).slice(-2); // last 2 digits

  return `${seq}/JGD/${romanMonth}/${year}`;
}

/**
 * Parse a ref number to extract the sequence number.
 * @param refNumber - e.g. "002/JGD/VII/26"
 * @returns The sequence number (e.g. 2)
 */
export function parseRefNumberSequence(refNumber: string): number {
  const parts = refNumber.split("/");
  return parseInt(parts[0], 10);
}

/**
 * Get the next sequence number by finding the max existing for the current year.
 * This should be called inside a transaction for thread-safety.
 */
export async function getNextSequenceNumber(
  prisma: {
    quotation: {
      findMany: (args: {
        where: {
          refNumber: { endsWith: string };
        };
        select: { refNumber: true };
      }) => Promise<{ refNumber: string }[]>;
    };
  },
  date: Date = new Date()
): Promise<number> {
  const yearSuffix = String(date.getFullYear()).slice(-2);

  // Find all quotations from the same year
  const existing = await prisma.quotation.findMany({
    where: {
      refNumber: { endsWith: `/${yearSuffix}` },
    },
    select: { refNumber: true },
  });

  if (existing.length === 0) return 1;

  const maxSeq = Math.max(
    ...existing.map((q) => parseRefNumberSequence(q.refNumber))
  );

  return maxSeq + 1;
}
