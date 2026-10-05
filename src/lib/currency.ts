const nairaFormatter = new Intl.NumberFormat("en-NG", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export function formatPrice(value: number | string | null | undefined): string {
  const amount = typeof value === "number" ? value : Number(value ?? 0);
  return `₦${nairaFormatter.format(Number.isFinite(amount) ? amount : 0)}`;
}
