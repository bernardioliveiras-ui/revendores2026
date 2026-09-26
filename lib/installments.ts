export const INSTALLMENT_RULES = Object.freeze({
  maxInstallments: 6,
  monthlyInterestRate: 0.0299,
});

export type InstallmentOption = {
  installments: number;
  installmentValueCents: number;
  chargedValueCents: number;
  interestValueCents: number;
  hasInterest: boolean;
};

export function roundCurrencyCents(valueCents: number) {
  return Math.round(valueCents);
}

export function calculateInstallmentPrice(baseCents: number, installments: number): InstallmentOption {
  const n = Math.max(1, Math.min(INSTALLMENT_RULES.maxInstallments, Math.trunc(installments || 1)));
  const base = roundCurrencyCents(baseCents);
  if (n <= 1) {
    return { installments: 1, installmentValueCents: base, chargedValueCents: base, interestValueCents: 0, hasInterest: false };
  }
  const rate = INSTALLMENT_RULES.monthlyInterestRate;
  const factor = (rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
  const installmentValueCents = roundCurrencyCents(base * factor);
  const chargedValueCents = roundCurrencyCents(installmentValueCents * n);
  return {
    installments: n,
    installmentValueCents,
    chargedValueCents,
    interestValueCents: chargedValueCents - base,
    hasInterest: true,
  };
}

export function getInstallmentOptions(baseCents: number) {
  return Array.from({ length: INSTALLMENT_RULES.maxInstallments }, (_, index) => calculateInstallmentPrice(baseCents, index + 1));
}
