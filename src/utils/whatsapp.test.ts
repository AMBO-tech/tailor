import { describe, expect, it } from 'vitest';
import { generateWhatsAppReceiptUrl } from './whatsapp';

const base = {
  phone: '77 123 45 67',
  clientName: 'Awa Ndiaye',
  amount: 15000,
  receiptNumber: 'REC-001',
  workshopName: 'Atelier Awa',
};

function decodeText(url: string): string {
  return decodeURIComponent(new URL(url).searchParams.get('text') ?? '');
}

describe('generateWhatsAppReceiptUrl', () => {
  it('ajoute l’indicatif 221 et encode le message', () => {
    const url = generateWhatsAppReceiptUrl(base);
    expect(url.startsWith('https://wa.me/221771234567?text=')).toBe(true);
    const text = decodeText(url);
    expect(text).toContain('*ATELIER AWA*');
    expect(text).toContain('Bonjour Awa Ndiaye');
    expect(text).toContain('REC-001');
    expect(text).not.toContain('Reliquat');
  });

  it('ne double pas l’indicatif déjà présent et inclut commande et reliquat', () => {
    const url = generateWhatsAppReceiptUrl({
      ...base,
      phone: '+221 77 123 45 67',
      orderNumber: 'AW-12',
      modelName: 'Boubou',
      remainingBalance: 5000,
    });
    expect(url.startsWith('https://wa.me/221771234567?')).toBe(true);
    const text = decodeText(url);
    expect(text).toContain('#AW-12* (Boubou)');
    expect(text).toMatch(/Reliquat restant :\* 5\s000 FCFA/);
  });
});
