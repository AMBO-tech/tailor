import { request } from './apiClient';
import { WorkshopMember, InviteMemberDto, InviteMemberResponse } from '@types';

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

  async revokeEmployee(memberId: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/workshops/members/${memberId}/revoke`, {
      method: 'POST',
    });
  },
};
