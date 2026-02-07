/**
 * Calculate final price after discount
 */
export function calculateDiscountedPrice(
  originalPrice: number,
  discountPercent: number
): { finalPrice: number; discount: number } {
  const discount = Math.round(originalPrice * (discountPercent / 100));
  const finalPrice = originalPrice - discount;

  return {
    finalPrice: Math.max(0, finalPrice),
    discount,
  };
}
