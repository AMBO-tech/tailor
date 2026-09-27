import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { subscriptionService } from '@services/api/subscription.service';
import { runOrQueue } from '@services/offlineQueue';
import { toast } from '@services/toast';
import { getActiveWorkshopId } from '@utils/storage';
import { markErrorNotified } from '@utils/errors';
import type {
  CreateManualPaymentDto,
  ManualPaymentResponse,
  PublicConfig,
  SubscriptionPlanCode,
  SubscriptionTransferMethod,
} from '@types';

/** Valeurs de repli tant que `/public/config` n'a pas répondu (tarifs officiels). */
export const DEFAULT_PUBLIC_CONFIG: PublicConfig = {
  subscriptionTransferPhone: null,
  currency: 'XOF',
  prices: { SOLO: 3000, EQUIPE: 5000 },
  maxSubscriptionMonths: 12,
  onlinePaymentEnabled: false,
};

/** Numéro WhatsApp de l'administrateur (repli si l'API ne fournit pas de lien). */
export const ADMIN_WHATSAPP_PHONE: string =
  import.meta.env.VITE_ADMIN_WHATSAPP_PHONE || '221776723136';

/** Libellés des moyens de transfert. */
export const TRANSFER_METHOD_LABELS: Record<SubscriptionTransferMethod, string> = {
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  FREE_MONEY: 'Free Money',
};

export const SUBSCRIPTION_QUERY_KEYS = {
  all: ['subscription'] as const,
  publicConfig: ['public-config'] as const,
  current: () => ['subscription', getActiveWorkshopId(), 'current'] as const,
};

/** Configuration publique (tarifs, numéro de transfert) ; repli sur les tarifs officiels. */
export function usePublicConfigQuery() {
  return useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.publicConfig,
    queryFn: () => subscriptionService.getPublicConfig(),
    staleTime: 60 * 60 * 1000,
    placeholderData: DEFAULT_PUBLIC_CONFIG,
  });
}

/** Abonnement courant (jours restants, lecture seule) et demandes en attente. */
export function useCurrentSubscriptionQuery(enabled = true) {
  return useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.current(),
    queryFn: () => subscriptionService.getCurrentSubscription(),
    enabled,
  });
}

/** Paramètres du message WhatsApp de repli (lien construit localement). */
export interface ManualPaymentMessageParams {
  workshopName: string;
  codePrefix: string;
  plan: SubscriptionPlanCode;
  months: number;
  amount: number;
  method: SubscriptionTransferMethod;
  reference?: string;
  transactionRef?: string;
}

/**
 * Lien `wa.me` vers l'administrateur, utilisé quand l'API ne renvoie pas de
 * `whatsAppUrl` (numéro non configuré) ou quand la demande est mise en file hors ligne.
 */
export function buildManualPaymentWhatsAppUrl(params: ManualPaymentMessageParams): string {
  const lines = [
    'Bonjour, je viens de payer mon abonnement Sama Waay.',
    `Atelier : ${params.workshopName}`,
    `Code atelier : ${params.codePrefix}`,
    `Forfait : ${params.plan} (${params.months} mois)`,
    `Montant : ${new Intl.NumberFormat('fr-FR').format(params.amount)} FCFA`,
    `Moyen : ${TRANSFER_METHOD_LABELS[params.method]}`,
    ...(params.reference ? [`Référence : ${params.reference}`] : []),
    ...(params.transactionRef ? [`Transaction : ${params.transactionRef}`] : []),
  ];
  return `https://wa.me/${ADMIN_WHATSAPP_PHONE}?text=${encodeURIComponent(lines.join('\n'))}`;
}

/**
 * « J'ai déjà payé » : déclare un paiement d'abonnement (idempotent par
 * `clientMutationId`). Hors ligne ou en cas d'erreur réseau, la demande est mise
 * en file et renvoyée à la synchronisation.
 */
export function useCreateManualPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    networkMode: 'always',
    mutationFn: async (data: CreateManualPaymentDto): Promise<ManualPaymentResponse> => {
      const payload = { ...data, id: data.clientMutationId || uuidv4() };
      const { result } = await runOrQueue(
        'CREATE_SUBSCRIPTION_PAYMENT',
        payload,
        () => subscriptionService.createManualPayment(data),
        (): ManualPaymentResponse => ({
          id: payload.id,
          reference: '',
          amount: 0,
          status: 'PENDING',
          whatsAppUrl: null,
          isSynced: false,
        }),
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEYS.all });
    },
    onError: (err: Error) => {
      markErrorNotified(err);
      toast.error(err.message || "Erreur lors de l'envoi de la demande");
    },
  });
}
