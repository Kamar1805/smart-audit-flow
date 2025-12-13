import { useCurrency } from "../../context/CurrencyContext";

export default function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency();
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-muted-foreground">Currency:</label>
      <select
        className="border rounded px-2 py-1 text-sm"
        value={currency}
        onChange={(e) => setCurrency(e.target.value as any)}
      >
        <option value="NGN">Naira (₦)</option>
        <option value="USD">Dollar ($)</option>
        <option value="EUR">Euro (€)</option>
        <option value="GBP">Pounds (£)</option>
      </select>
    </div>
  );
}
