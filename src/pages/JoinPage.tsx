import React, { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Lock, Phone, Scissors, ShieldCheck, User, UserPlus } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { authService } from '@services/api/auth.service';
import { workshopService } from '@services/api/workshop.service';
import { ApiError } from '@services/api/apiClient';
import { toast } from '@services/toast';
import { getErrorMessage } from '@utils/errors';
import { logger } from '@utils/logger';
import {
  INVALID_INVITATION_MESSAGE,
  extractJoinedWorkshopName,
  prioritizeWorkshop,
  readInvitationToken,
} from '@utils/invitation';

/** Classe commune des champs (identique à `LoginPage`). */
const INPUT_CLASS =
  'w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500';

/** Bloc d'erreur (même rendu que `LoginPage`). */
const ErrorAlert: React.FC<{ message: string }> = ({ message }) => (
  <div
    role="alert"
    className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-start gap-2"
  >
    <span className="font-bold shrink-0" aria-hidden="true">
      ⚠️
    </span>
    <span className="font-medium">{message}</span>
  </div>
);

/**
 * Page publique « Rejoindre un atelier », ouverte depuis le lien WhatsApp
 * (`/join?token=…`, ou `/join/:token`). L'employé saisit son numéro, son nom et
 * son code PIN ; l'invitation est acceptée puis la connexion se fait
 * automatiquement sur l'atelier rejoint.
 *
 * L'API n'expose pas de consultation d'invitation : le nom de l'atelier est donc
 * connu (et affiché) une fois l'invitation acceptée.
 */
export const JoinPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { handleAuthSuccess } = useAuth();
  const [searchParams] = useSearchParams();
  const { token: pathToken } = useParams<{ token?: string }>();
  const token = readInvitationToken(searchParams, pathToken);

  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(token === null);
  const [loading, setLoading] = useState(false);

  /** Connexion automatique après acceptation ; l'atelier rejoint devient actif. */
  const loginAfterJoin = async (workshopName: string | null) => {
    try {
      const res = await authService.login({ phone: phone.replace(/[\s\-.]/g, ''), pin });
      queryClient.clear();
      handleAuthSuccess({
        ...res,
        workshops: prioritizeWorkshop(res.workshops || [], workshopName),
      });
      navigate('/', { replace: true });
    } catch (err: unknown) {
      // Compte existant avec un autre PIN, ou numéro différent de celui invité.
      logger.warn('Connexion automatique impossible après invitation', err);
      toast.error('Connectez-vous avec votre numéro et votre code PIN habituel.');
      navigate('/login', { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const res = await workshopService.acceptInvitation({ token, fullName: fullName.trim(), pin });
      const workshopName = extractJoinedWorkshopName(res.message);
      toast.success(workshopName ? `Bienvenue dans l'atelier ${workshopName} ✨` : res.message);
      await loginAfterJoin(workshopName);
    } catch (err: unknown) {
      logger.error('Invitation refusée :', err);
      if (
        err instanceof ApiError &&
        err.status === 400 &&
        err.message === INVALID_INVITATION_MESSAGE
      ) {
        setIsExpired(true);
      } else {
        setError(getErrorMessage(err, "Impossible de rejoindre l'atelier. Vérifiez votre réseau."));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-center auth-safe px-4 py-8">
      <div className="max-w-sm w-full mx-auto space-y-6 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 shadow-sm mb-1">
            <Scissors className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-display font-black tracking-tight text-slate-900">
            SAMA <span className="text-amber-600">WAAY</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">Invitation à rejoindre un atelier</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          {isExpired ? (
            <div className="space-y-4">
              <ErrorAlert message={INVALID_INVITATION_MESSAGE} />
              <p className="text-xs text-slate-600">
                Ce lien a déjà été utilisé ou n'est plus valable (48 h). Demandez un nouveau lien au
                Maître Tailleur.
              </p>
              <Link
                to="/login"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 transition active:scale-98 text-xs sm:text-sm"
              >
                <span>Aller à la connexion</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              {error && <ErrorAlert message={error} />}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2 border border-amber-200">
                  <UserPlus className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Vous avez déjà un compte ? Saisissez votre code PIN habituel.</span>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Numéro de téléphone invité
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      placeholder="Ex: 77 123 45 67"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`${INPUT_CLASS} font-mono`}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-xs font-bold text-slate-700 mb-1.5"
                  >
                    Nom complet *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      id="fullName"
                      type="text"
                      required
                      placeholder="Ex: Awa Ndiaye"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="pin" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Code PIN secret (4 à 6 chiffres)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      id="pin"
                      name="pin"
                      type="password"
                      autoComplete="new-password"
                      inputMode="numeric"
                      required
                      minLength={4}
                      maxLength={6}
                      pattern="[0-9]{4,6}"
                      placeholder="••••"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm tracking-widest text-center font-mono font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 text-xs sm:text-sm"
                >
                  {loading ? (
                    'Connexion en cours...'
                  ) : (
                    <>
                      <span>Rejoindre l'atelier</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Security Notice */}
        <div className="text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Données sécurisées & hébergées conformément CDP Sénégal</span>
        </div>
      </div>
    </div>
  );
};
