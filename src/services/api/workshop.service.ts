import { request } from './apiClient';
import type {
  WorkshopMember,
  InviteMemberDto,
  InviteMemberResponse,
  AcceptInvitationDto,
  AcceptInvitationResponse,
} from '@types';

export const workshopService = {
  async listMembers(): Promise<WorkshopMember[]> {
    return request<WorkshopMember[]>('/workshops/members');
  },

  async inviteEmployee(data: InviteMemberDto): Promise<InviteMemberResponse> {
    return request<InviteMemberResponse>('/workshops/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * `POST /workshops/join` : accepte une invitation (route publique, sans session).
   * Un 401 éventuel ne doit pas déconnecter l'atelier ouvert sur l'appareil.
   */
  async acceptInvitation(data: AcceptInvitationDto): Promise<AcceptInvitationResponse> {
    return request<AcceptInvitationResponse>(
      '/workshops/join',
      { method: 'POST', body: JSON.stringify(data) },
      { onUnauthorized: () => undefined },
    );
  },

  async revokeEmployee(memberId: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/workshops/members/${memberId}/revoke`, {
      method: 'POST',
    });
  },
};
