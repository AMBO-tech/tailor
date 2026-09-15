/**
 * Génération de liens de partage direct WhatsApp
 */
export interface GenerateWhatsAppReceiptUrlParams {
  phone: string;
  clientName: string;
  amount: number;
  receiptNumber: string;
  orderNumber?: string;
  modelName?: string;
  remainingBalance?: number;
  workshopName: string;
}

export function generateWhatsAppReceiptUrl(params: GenerateWhatsAppReceiptUrlParams): string {
  const cleanPhone = params.phone.replace(/\D/g, '');
  const recipient = cleanPhone.startsWith('221') ? cleanPhone : `221${cleanPhone}`;
  const amountFormatted = new Intl.NumberFormat('fr-FR').format(params.amount) + ' FCFA';
  const remainingText = params.remainingBalance !== undefined
    ? `\n*Reliquat restant :* ${new Intl.NumberFormat('fr-FR').format(params.remainingBalance)} FCFA`
    : '';

  const text = (
    `*${params.workshopName.toUpperCase()}*\n` +
    `Bonjour ${params.clientName},\n\n` +
    `✅ Reçu de paiement de *${amountFormatted}*.\n` +
    `🧾 N° Reçu : *${params.receiptNumber}*\n` +
    (params.orderNumber ? `👗 Commande : *#${params.orderNumber}* (${params.modelName || ''})\n` : '') +
    remainingText + '\n\n' +
    `Merci pour votre confiance !\n` +
    `_Atelier ${params.workshopName}_`
  );

  return `https://wa.me/${recipient}?text=${encodeURIComponent(text)}`;
}
