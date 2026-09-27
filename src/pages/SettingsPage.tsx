import React, { useState } from 'react';
import { useAuth } from '@hooks/useAuth';
import { useOfflineStatus } from '@hooks/useOfflineSync';
import { getErrorMessage, wasErrorNotified } from '@utils/errors';
import {
  useMembersQuery,
  useInviteEmployeeMutation,
  useRevokeEmployeeMutation,
  isInvitationRefused,
  INVITATION_REFUSED_MESSAGE,
} from '@hooks/useWorkshops';
import {
  WorkshopInfoCard,
  UserProfileCard,
  TeamMemberList,
  SubscriptionModal,
  PendingSyncCard,
} from '@components';
import { LogOut } from 'lucide-react';
import { toast } from '@services/toast';

export const SettingsPage: React.FC = () => {
  const { user, currentWorkshop, logout } = useAuth();
  const isOwner = currentWorkshop?.role === 'OWNER';
  const { failedMutations, retryMutation, discardMutation } = useOfflineStatus();

  const { data: members = [], isLoading: loadingMembers } = useMembersQuery(isOwner);
  const inviteEmployeeMutation = useInviteEmployeeMutation();
  const revokeEmployeeMutation = useRevokeEmployeeMutation();

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  const handleInvite = async (phone: string) => {
    setInviteError(null);
    try {
      // Le toast de succès est émis par la mutation (plus de double message).
      const res = await inviteEmployeeMutation.mutateAsync({ phone });
      setInviteLink(res.whatsAppLink || res.inviteUrl || res.inviteLink || null);
    } catch (err: unknown) {
      setInviteLink(null);
      // 403 : invitation refusée (forfait plein…) → message clair de l'API sous le champ.
      if (isInvitationRefused(err)) {
        setInviteError(getErrorMessage(err, INVITATION_REFUSED_MESSAGE));
        return;
      }
      // Déjà affichée par la mutation ? On ne répète pas le message.
      if (!wasErrorNotified(err)) toast.error(getErrorMessage(err, "Erreur lors de l'invitation"));
    }
  };

  const handleRevoke = async (userId: string, memberName: string) => {
    try {
      await revokeEmployeeMutation.mutateAsync(userId);
      toast.success(`Accès de ${memberName} révoqué.`);
    } catch (err: unknown) {
      // Déjà affichée par la mutation ? On ne répète pas le message.
      if (!wasErrorNotified(err)) toast.error(getErrorMessage(err, 'Erreur lors de la révocation'));
    }
  };

  return (
    <div className="space-y-4">
      {/* Atelier Card */}
      <WorkshopInfoCard
        workshop={currentWorkshop}
        onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
      />

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
          inviteError={inviteError}
          isRevoking={revokeEmployeeMutation.isPending}
        />
      )}

      {/* Éléments hors ligne refusés par le serveur (rien n'est affiché sinon) */}
      <PendingSyncCard
        failedMutations={failedMutations}
        onRetry={(id) => void retryMutation(id)}
        onDiscard={(id) => void discardMutation(id)}
      />

      {/* Logout Action */}
      <button
        onClick={logout}
        type="button"
        className="w-full bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-600 font-bold py-3.5 rounded-2xl transition text-xs flex items-center justify-center gap-2 shadow-sm active:scale-98"
      >
        <LogOut className="w-4 h-4" />
        <span>Se déconnecter</span>
      </button>

      {/* Subscription Modal */}
      {isSubscriptionModalOpen && (
        <SubscriptionModal
          isOpen={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
          workshop={currentWorkshop}
        />
      )}
    </div>
  );
};
