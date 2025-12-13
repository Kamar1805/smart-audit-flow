import React, { createContext, useContext, useMemo, useState } from "react";

type Currency = "NGN" | "USD" | "EUR" | "GBP";

type CurrencyContextValue = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  format: (amount: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

const symbols: Record<Currency, string> = {
  NGN: "₦",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("NGN");

  const format = useMemo(() => {
    return (amount: number) => `${symbols[currency]}${amount.toLocaleString()}`;
  }, [currency]);

  const value = useMemo(() => ({ currency, setCurrency, format }), [currency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
