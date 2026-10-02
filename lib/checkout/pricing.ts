import { shippingRegions } from "@/lib/checkout/shipping-rates";
import { shippingAdditions } from "@/lib/checkout/shipping-additions";

export const MAX_CARD_INSTALLMENTS = 6;
export const MONTHLY_INSTALLMENT_RATE = 0.0299;

export type ShippingType = "economical" | "express";
export type PaymentMethod = "pix" | "credit";

export type ShippingQuote = {
  id: ShippingType;
  label: string;
  priceCents: number;
  deliveryTime: string;
};

export type InstallmentQuote = {
  installments: number;
  installmentValueCents: number;
  chargedValueCents: number;
  interestCents: number;
  hasInterest: boolean;
};

function getPackagingCost(quantity: number): number {
  if (quantity <= 0) return 0;
  const mediumBoxesCount = Math.floor(quantity / 6);
  const remainder = quantity % 6;
  let cost = mediumBoxesCount * 0.9;
  if (remainder > 0) cost += remainder <= 2 ? 0.7 : 0.9;
  return cost;
}

export function normalizePostalCode(value: unknown) {
  return typeof value === "string" ? value.replace(/\D/g, "").slice(0, 8) : "";
}

export function calculateShipping(postalCode: string, quantity: number): ShippingQuote[] | null {
  const cleanCep = Number(normalizePostalCode(postalCode));
  if (!Number.isFinite(cleanCep) || normalizePostalCode(postalCode).length !== 8) return null;

  // Regra comercial histórica: pedidos de 1.000+ unidades têm frete grátis.
  if (quantity >= 1000) {
    return [
      { id: "economical", label: "Entrega Econômica", priceCents: 0, deliveryTime: "5 a 12 dias úteis" },
      { id: "express", label: "Entrega Expressa", priceCents: 0, deliveryTime: "2 a 5 dias úteis" },
    ];
  }

  const region = shippingRegions.find((item) => cleanCep >= item.cepStart && cleanCep <= item.cepEnd);
  if (!region) return null;

  // Preserva o cálculo do checkout anterior: adicional padrão + embalagem de uma remessa.
  const additional = shippingAdditions[1 as keyof typeof shippingAdditions] || 0;
  const packagingCost = getPackagingCost(1);
  const totalAdditional = additional + packagingCost;
  const economical = Math.max(region.economical, 25.8) + totalAdditional;
  const express = Math.max(region.express, 27.6) + totalAdditional;

  return [
    {
      id: "economical",
      label: "Entrega Econômica",
      priceCents: Math.round(economical * 100),
      deliveryTime: "5 a 12 dias úteis",
    },
    {
      id: "express",
      label: "Entrega Expressa",
      priceCents: Math.round(express * 100),
      deliveryTime: "2 a 5 dias úteis",
    },
  ];
}

export function calculateInstallment(baseCents: number, installments: number): InstallmentQuote {
  const count = Math.max(1, Math.trunc(installments));
  if (count === 1) {
    return {
      installments: 1,
      installmentValueCents: baseCents,
      chargedValueCents: baseCents,
      interestCents: 0,
      hasInterest: false,
    };
  }

  if (count > MAX_CARD_INSTALLMENTS) throw new Error("INVALID_INSTALLMENTS");
  const rate = MONTHLY_INSTALLMENT_RATE;
  const factor = (rate * Math.pow(1 + rate, count)) / (Math.pow(1 + rate, count) - 1);
  const installmentValueCents = Math.round(baseCents * factor);
  const chargedValueCents = installmentValueCents * count;
  return {
    installments: count,
    installmentValueCents,
    chargedValueCents,
    interestCents: Math.max(0, chargedValueCents - baseCents),
    hasInterest: true,
  };
}

export function getInstallmentOptions(baseCents: number, maxInstallments = MAX_CARD_INSTALLMENTS) {
  return Array.from({ length: Math.min(MAX_CARD_INSTALLMENTS, Math.max(1, maxInstallments)) }, (_, index) =>
    calculateInstallment(baseCents, index + 1),
  );
}
