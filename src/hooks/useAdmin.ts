import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@services/api/admin.service';
import { toast } from '@services/toast';
import { markErrorNotified } from '@utils/errors';
import type { ActivateSubscriptionDto, SubscriptionPaymentStatus } from '@types';

export const ADMIN_QUERY_KEYS = {
  all: ['admin'] as const,
  payments: (status?: SubscriptionPaymentStatus) => ['admin', 'subscription-payments', { status }] as const,
  workshops: ['admin', 'workshops'] as const,
};

/** Signale l'erreur une seule fois (toast) et la marque comme affichée. */
function notifyError(fallback: string) {
  return (err: Error) => {
    markErrorNotified(err);
    toast.error(err.message || fallback);
  };
}

/** Demandes « J'ai déjà payé », filtrées par statut. */
export function useAdminSubscriptionPaymentsQuery(status?: SubscriptionPaymentStatus) {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.payments(status),
    queryFn: () => adminService.listSubscriptionPayments(status),
  });
}

/** Ateliers de la plateforme. */
export function useAdminWorkshopsQuery() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.workshops,
    queryFn: () => adminService.listWorkshops(),
  });
}

/** Valide une demande (prolonge l'abonnement de l'atelier). */
export function useConfirmSubscriptionPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, transactionRef }: { id: string; transactionRef?: string }) =>
      adminService.confirmSubscriptionPayment(id, transactionRef),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.all });
      toast.success('Paiement validé : abonnement prolongé ✨');
    },
    onError: notifyError('Erreur lors de la validation'),
  });
}

/** Refuse une demande avec un motif. */
export function useRejectSubscriptionPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminService.rejectSubscriptionPayment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.all });
      toast.success('Demande refusée.');
    },
    onError: notifyError('Erreur lors du refus'),
  });
}

/** Active manuellement l'abonnement d'un atelier. */
export function useActivateSubscriptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: ActivateSubscriptionDto) => adminService.activateSubscription(dto),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.workshops });
      toast.success(res.message || 'Abonnement activé ✨');
    },
    onError: notifyError("Erreur lors de l'activation"),
  });
}
