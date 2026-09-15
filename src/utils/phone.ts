/**
 * Formatage et détection des opérateurs télécoms sénégalais
 */
export function formatSenegalPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return ${digits.slice(0, 2)} ;
  if (digits.length <= 7) return ${digits.slice(0, 2)}  ;
  return ${digits.slice(0, 2)}   ;
}

export function detectSenegalOperator(phone: string): 'ORANGE' | 'FREE' | 'EXPRESSO' | 'PROXICACHE' | 'UNKNOWN' {
  const clean = phone.replace(/\D/g, '');
  if (/^(?:77|78)/.test(clean)) return 'ORANGE';
  if (/^(?:76)/.test(clean)) return 'FREE';
  if (/^(?:70)/.test(clean)) return 'EXPRESSO';
  if (/^(?:75)/.test(clean)) return 'PROXICACHE';
  return 'UNKNOWN';
}
