/**
 * Installment and Interest Rules Configuration & Calculation Utility.
 */

export const INSTALLMENT_RULES = {
  // Max installments per planId (1: Kit 1, 2: Kit 3, 3: Kit 5)
  maxInstallmentsByPlanId: {
    1: 3,  // Kit 1 Caixa -> max 3x
    2: 6,  // Kit 3 Caixas -> max 6x
    3: 10, // Kit 5 Caixas -> max 10x
  } as Record<number, number>,

  // Max installments per planMonths / quantity (1: Kit 1, 3: Kit 3, 5: Kit 5)
  maxInstallmentsByPlanMonths: {
    1: 3,
    3: 6,
    5: 10,
  } as Record<number, number>,

  // Monthly compound interest rate (2.99% per month)
  // 1x is always interest-free. 2x onwards applies this rate using the Price table.
  monthlyInterestRate: 0.0299,
};

export interface InstallmentOption {
  installments: number;
  installmentValue: number;
  chargedValue: number;
  interestValue: number;
  hasInterest: boolean;
}

/**
 * Rounds monetary values to two decimal places to prevent floating-point calculation errors.
 */
export function roundCurrency(val: number): number {
  return Math.round(val * 100) / 100;
}

/**
 * Calculates the total interest-adjusted price and payment value for a given installment count.
 */
export function calculateInstallmentPrice(basePrice: number, installments: number): { installmentValue: number; chargedValue: number; interestValue: number; hasInterest: boolean } {
  if (installments <= 1) {
    const roundedPrice = roundCurrency(basePrice);
    return {
      installmentValue: roundedPrice,
      chargedValue: roundedPrice,
      interestValue: 0,
      hasInterest: false
    };
  }

  const rate = INSTALLMENT_RULES.monthlyInterestRate;
  if (rate > 0) {
    // Standard Price compound interest formula: PMT = PV * [i(1+i)^n] / [(1+i)^n - 1]
    const factor = (rate * Math.pow(1 + rate, installments)) / (Math.pow(1 + rate, installments) - 1);
    const rawInstallmentValue = basePrice * factor;
    
    // Applying unified rounding policy
    const installmentValue = roundCurrency(rawInstallmentValue);
    const chargedValue = roundCurrency(installmentValue * installments);
    const interestValue = roundCurrency(chargedValue - basePrice);

    return {
      installmentValue,
      chargedValue,
      interestValue,
      hasInterest: true
    };
  }

  // Interest-free fallback
  const installmentValue = roundCurrency(basePrice / installments);
  const chargedValue = roundCurrency(installmentValue * installments);
  return {
    installmentValue,
    chargedValue,
    interestValue: 0,
    hasInterest: false
  };
}

/**
 * Gets all available installment options for a given plan, base price, and quantity.
 */
export function getInstallmentOptions(basePrice: number, planId: number, quantity: number = 1): InstallmentOption[] {
  const totalBoxes = (planId === 1 ? 1 : planId === 2 ? 3 : 5) * (quantity || 1);
  const maxInst = totalBoxes >= 5 ? 10 : totalBoxes >= 3 ? 6 : totalBoxes >= 2 ? 6 : (INSTALLMENT_RULES.maxInstallmentsByPlanId[planId] || 3);
  const options: InstallmentOption[] = [];

  for (let n = 1; n <= maxInst; n++) {
    const calc = calculateInstallmentPrice(basePrice, n);
    options.push({
      installments: n,
      installmentValue: calc.installmentValue,
      chargedValue: calc.chargedValue,
      interestValue: calc.interestValue,
      hasInterest: calc.hasInterest
    });
  }

  return options;
}
