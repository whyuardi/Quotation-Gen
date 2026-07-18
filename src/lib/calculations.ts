import Decimal from "decimal.js";

// Configure Decimal.js for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface PriceItemInput {
  description: string;
  qtyIn1Set: number;
  pricePerUnitUsd: number | string; // accept string from Prisma Decimal
  sortOrder: number;
  unit: string;
}

export interface CalculatedLineItem {
  description: string;
  qtyIn1Set: number;
  totalQty: number;
  pricePerUnit: number;
  totalPrice: number;
  unit: string;
}

export interface QuotationCalculation {
  lineItems: CalculatedLineItem[];
  grandTotal: number;
  numPumpsets: number;
}

/**
 * Calculate quotation totals using server-side decimal.js for precision.
 * All monetary math avoids floating-point issues.
 */
export function calculateQuotationTotals(
  priceItems: PriceItemInput[],
  numPumpsets: number
): QuotationCalculation {
  let grandTotal = new Decimal(0);

  const lineItems: CalculatedLineItem[] = priceItems.map((item) => {
    const qty = new Decimal(item.qtyIn1Set);
    const totalQty = qty.times(numPumpsets);
    const pricePerUnit = new Decimal(item.pricePerUnitUsd);
    const totalPrice = totalQty.times(pricePerUnit);

    grandTotal = grandTotal.plus(totalPrice);

    return {
      description: item.description,
      qtyIn1Set: item.qtyIn1Set,
      totalQty: totalQty.toNumber(),
      pricePerUnit: pricePerUnit.toNumber(),
      totalPrice: totalPrice.toDecimalPlaces(2).toNumber(),
      unit: item.unit,
    };
  });

  return {
    lineItems,
    grandTotal: grandTotal.toDecimalPlaces(2).toNumber(),
    numPumpsets,
  };
}

/**
 * Format a number as USD currency string (no $ sign, just the formatted number).
 */
export function formatUSD(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
