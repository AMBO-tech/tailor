import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workshopService } from '@services/api/workshop.service';
import { InviteMemberDto, WorkshopMember } from '@types';
import { toast } from '@services/toast';
import { markErrorNotified } from '@utils/errors';
import { getActiveWorkshopId } from '@utils/storage';
import { ApiError } from '@services/api/apiClient';

/** Message par défaut d'une invitation refusée par le serveur (403). */
export const INVITATION_REFUSED_MESSAGE =
  "Invitation refusée : la limite d'employés de votre forfait est atteinte.";

/** Vrai si l'invitation a été refusée par le serveur (403 : forfait plein, non propriétaire). */
export function isInvitationRefused(err: unknown): boolean {
  return err instanceof ApiError && err.status === 403;
}

/** Clés du cache de l'équipe (`members` = préfixe d'invalidation, ARC-1). */
export const WORKSHOP_QUERY_KEYS = {
  members: ['workshops', 'members'] as const,
  memberList: () => ['workshops', 'members', getActiveWorkshopId()] as const,
};

export function useMembersQuery(enabled: boolean = true) {
  return useQuery<WorkshopMember[]>({
    queryKey: WORKSHOP_QUERY_KEYS.memberList(),
    queryFn: () => workshopService.listMembers(),
    enabled,
  });
}

export function useInviteMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteMemberDto) => workshopService.inviteEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSHOP_QUERY_KEYS.members });
      toast.success('Invitation générée avec succès ✨');
    },
    onError: (err: Error) => {
      // 403 (forfait plein) : affiché en clair dans le formulaire, pas en toast.
      if (isInvitationRefused(err)) return;
      markErrorNotified(err);
      toast.error(err.message || "Erreur lors de l'invitation");
    },
  });
}

export const useInviteEmployeeMutation = useInviteMemberMutation;

export function useRevokeMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => workshopService.revokeEmployee(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSHOP_QUERY_KEYS.members });
      toast.success('Accès révoqué avec succès.');
    },
    onError: (err: Error) => {
      markErrorNotified(err);
      toast.error(err.message || 'Erreur lors de la révocation');
    },
  });
}

export const useRevokeEmployeeMutation = useRevokeMemberMutation;
