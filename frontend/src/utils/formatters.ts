/**
 * Format numeric value as currency (default INR / Indian style or generic currency)
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount)) {
    return '₹0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date string (YYYY-MM-DD or ISO) into readable presentation
 */
export function formatDate(dateString?: string): string {
  if (!dateString) {
    return '—';
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format a phone number cleanly
 */
export function formatPhone(phone?: string): string {
  if (!phone) {
    return '—';
  }
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}
