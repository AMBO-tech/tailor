import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workshopService } from '@services/api/workshop.service';
import { InviteMemberDto, WorkshopMember } from '@types';
import { toast } from '@services/toast';

export const WORKSHOP_QUERY_KEYS = {
  members: ['workshops', 'members'] as const,
};

export function useMembersQuery(enabled: boolean = true) {
  return useQuery<WorkshopMember[]>({
    queryKey: WORKSHOP_QUERY_KEYS.members,
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
    onError: (err: any) => {
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
    onError: (err: any) => {
      toast.error(err.message || 'Erreur lors de la révocation');
    },
  });
}

export const useRevokeEmployeeMutation = useRevokeMemberMutation;
