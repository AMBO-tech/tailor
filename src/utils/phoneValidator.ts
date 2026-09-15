/**
 * Validateur et formateur de numéros de téléphone pour le Sénégal (Zone UEMOA).
 * Supporte : Orange (77, 78), Free (76), Expresso (70), Promobile (75), Fixe (33).
 */
export function validateAndNormalizeSenegalPhone(phone: string): {
  isValid: boolean;
  normalized: string;
  display: string;
} {
  const digits = phone.replace(/[^0-9]/g, '');

  let local = digits;
  if (digits.startsWith('221')) {
    local = digits.substring(3);
  } else if (digits.startsWith('00221')) {
    local = digits.substring(5);
  }

  // A Senegalese number is 9 digits starting with 70, 75, 76, 77, 78 or 33
  const regex = /^(7[05678]|33)\d{7}$/;
  const isValid = regex.test(local);

  if (!isValid) {
    return {
      isValid: false,
      normalized: phone,
      display: phone,
    };
  }

  const normalized = `+221${local}`;
  const display = `${local.substring(0, 2)} ${local.substring(2, 5)} ${local.substring(5, 7)} ${local.substring(7, 9)}`;

  return {
    isValid: true,
    normalized,
    display,
  };
}
