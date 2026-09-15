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
  const recipient = cleanPhone.startsWith('221') ? cleanPhone : 221;
  const amountFormatted = new Intl.NumberFormat('fr-FR').format(params.amount) + ' FCFA';
  const remainingText = params.remainingBalance !== undefined
    ? \n*Reliquat restant :*  FCFA
    : '';

  const text = (
    **\n +
    Bonjour ,\n\n +
    ✅ Reçu de paiement de **.\n +
    🧾 N° Reçu : **\n +
    (params.orderNumber ? 👗 Commande : *#* ()\n : '') +
    remainingText + '\n\n' +
    Merci pour votre confiance !\n +
    _Atelier _
  );

  return https://wa.me/?text=;
}
