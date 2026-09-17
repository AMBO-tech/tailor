import React, { useState } from 'react';
import { useAuth } from '@hooks/useAuth';
import {
  useMembersQuery,
  useInviteEmployeeMutation,
  useRevokeEmployeeMutation,
} from '@hooks/useWorkshops';
import {
  WorkshopInfoCard,
  UserProfileCard,
  TeamMemberList,
} from '@components';
import { LogOut } from 'lucide-react';
import { toast } from '@services/toast';

export const SettingsPage: React.FC = () => {
  const { user, currentWorkshop, logout } = useAuth();
  const isOwner = currentWorkshop?.role === 'OWNER';

  const { data: members = [], isLoading: loadingMembers } = useMembersQuery(isOwner);
  const inviteEmployeeMutation = useInviteEmployeeMutation();
  const revokeEmployeeMutation = useRevokeEmployeeMutation();

  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const handleInvite = async (phone: string) => {
    try {
      const res = await inviteEmployeeMutation.mutateAsync({ phone });
      setInviteLink(res.whatsAppLink || null);
      toast.success('Invitation générée avec succès ✨');
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'invitation");
    }
  };

  const handleRevoke = async (userId: string, memberName: string) => {
    try {
      await revokeEmployeeMutation.mutateAsync(userId);
      toast.success(`Accès de ${memberName} révoqué.`);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la révocation');
    }
  };

  return (
    <div className="space-y-4">
      {/* Atelier Card */}
      <WorkshopInfoCard workshop={currentWorkshop} />

      {/* Profil Compte Card */}
      <UserProfileCard user={user} />

      {/* Team Management Card with 'Nouveau membre' button on top (Owner Only) */}
      {isOwner && (
        <TeamMemberList
          members={members}
          isLoading={loadingMembers}
          onRevoke={handleRevoke}
          onInvite={handleInvite}
          isInviting={inviteEmployeeMutation.isPending}
          inviteLink={inviteLink}
          isRevoking={revokeEmployeeMutation.isPending}
        />
      )}

      {/* Logout Action */}
      <button
        onClick={logout}
        type="button"
        className="w-full bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-600 font-bold py-3.5 rounded-2xl transition text-xs flex items-center justify-center gap-2 shadow-sm active:scale-98"
      >
        <LogOut className="w-4 h-4" />
        <span>Se déconnecter</span>
      </button>
    </div>
  );
};
