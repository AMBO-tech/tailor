import React, { useId, useState } from 'react';
import { Users, UserPlus, UserX, MessageCircle, X } from 'lucide-react';
import { WorkshopMember } from '@types';
import { ConfirmModal } from '@components/common/ConfirmModal';

export interface TeamMemberListProps {
  members: WorkshopMember[];
  isLoading: boolean;
  onRevoke: (userId: string, name: string) => Promise<void>;
  onInvite?: (phone: string) => Promise<void>;
  isInviting?: boolean;
  inviteLink?: string | null;
  /** Refus de l'invitation (ex. 403 « forfait plein ») affiché sous le champ. */
  inviteError?: string | null;
  isRevoking?: boolean;
}

export const TeamMemberList: React.FC<TeamMemberListProps> = ({
  members,
  isLoading,
  onRevoke,
  onInvite,
  isInviting = false,
  inviteLink = null,
  inviteError = null,
  isRevoking = false,
}) => {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const inviteInputId = useId();
  const [phone, setPhone] = useState('');
  const [memberToRevoke, setMemberToRevoke] = useState<{ userId: string; name: string } | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !onInvite) return;
    await onInvite(phone.trim());
    setPhone('');
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
      {/* Header with Title and 'Nouveau membre' button on top */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Équipe & Apprentis
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              {members.length} collaborateur{members.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {onInvite && (
          <button
            type="button"
            onClick={() => setShowInviteForm(!showInviteForm)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-xs ${
              showInviteForm
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950 border border-amber-400'
            }`}
          >
            {showInviteForm ? (
              <>
                <X className="w-3.5 h-3.5" />
                <span>Fermer</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Nouveau membre</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Expandable Invite Form at top of list */}
      {showInviteForm && onInvite && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3 animate-fade-in">
          <form onSubmit={handleFormSubmit} className="space-y-2">
            <label htmlFor={inviteInputId} className="block text-[11px] font-bold text-slate-700">
              Numéro de téléphone du collaborateur
            </label>
            <div className="flex gap-2">
              <input
                id={inviteInputId}
                type="tel"
                placeholder="Ex: 77 123 45 67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isInviting}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-slate-900 font-mono transition-colors shadow-2xs"
              />
              <button
                type="submit"
                disabled={isInviting || !phone.trim()}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isInviting ? 'Génération...' : 'Inviter'}</span>
              </button>
            </div>
          </form>

          {inviteError && (
            <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-start gap-2">
              <span className="font-bold shrink-0" aria-hidden="true">⚠️</span>
              <span className="font-medium">{inviteError}</span>
            </div>
          )}

          {inviteLink && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2 animate-fade-in">
              <p className="text-xs text-emerald-800 font-medium">
                Lien d'invitation prêt à envoyer :
              </p>
              <a
                href={inviteLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-lg text-xs transition shadow-sm active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Envoyer sur WhatsApp</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Members List */}
      <div className="pt-1">
        {isLoading ? (
          <div className="py-4 text-center text-xs text-slate-400 animate-pulse">
            Chargement de l'équipe...
          </div>
        ) : members.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            Aucun collaborateur pour le moment
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => {
              const isOwner = member.role === 'OWNER';
              const memberName = member.user?.fullName || 'Utilisateur';
              const memberPhone = member.user?.phone || 'Sans numéro';

              return (
                <div
                  key={member.id}
                  className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between text-xs transition hover:bg-slate-100/80"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{memberName}</span>
                      {isOwner && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                          Propriétaire
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500 font-mono text-[11px] mt-0.5 block">
                      {memberPhone}
                    </span>
                  </div>

                  {!isOwner && (
                    <button
                      type="button"
                      onClick={() => setMemberToRevoke({ userId: member.userId, name: memberName })}
                      disabled={isRevoking}
                      className="text-rose-600 hover:text-rose-700 font-bold text-[11px] px-2.5 py-1 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 rounded-lg transition flex items-center gap-1 active:scale-95"
                    >
                      <UserX className="w-3 h-3" />
                      <span>Révoquer</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {memberToRevoke && (
        <ConfirmModal
          isOpen={Boolean(memberToRevoke)}
          title="Révoquer l'accès"
          message={`Êtes-vous sûr de vouloir révoquer l'accès de ${memberToRevoke.name} ? Cet employé ne pourra plus accéder aux commandes ni aux clientes de l'atelier.`}
          confirmLabel="Révoquer l'accès"
          cancelLabel="Annuler"
          variant="danger"
          isLoading={isRevoking}
          onClose={() => setMemberToRevoke(null)}
          onConfirm={async () => {
            if (memberToRevoke) {
              await onRevoke(memberToRevoke.userId, memberToRevoke.name);
              setMemberToRevoke(null);
            }
          }}
        />
      )}
    </div>
  );
};
