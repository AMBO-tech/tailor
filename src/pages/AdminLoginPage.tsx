import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';
import { adminService, ADMIN_LOGIN_ERROR_MESSAGE } from '@services/api/admin.service';
import { ApiError } from '@services/api/apiClient';
import { hasAdminSession, saveAdminSession } from '@utils/adminSession';
import { getErrorMessage } from '@utils/errors';

/**
 * Connexion au back-office (super-administrateur) par e-mail et mot de passe.
 * Même mise en page que `LoginPage` ; la session obtenue est séparée de celle
 * d'un atelier.
 */
export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (hasAdminSession()) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await adminService.login(email.trim(), password);
      if (res.user?.systemRole !== 'SUPER_ADMIN') {
        setError(ADMIN_LOGIN_ERROR_MESSAGE);
        return;
      }
      saveAdminSession(res.accessToken, res.user);
      navigate('/admin', { replace: true });
    } catch (err: unknown) {
      // 401 : message générique de l'API (aucune information sur le compte).
      setError(
        err instanceof ApiError && err.status === 401
          ? ADMIN_LOGIN_ERROR_MESSAGE
          : getErrorMessage(err, 'Connexion impossible. Vérifiez votre réseau.'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-center auth-safe px-4 py-8">
      <div className="max-w-sm w-full mx-auto space-y-6 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 text-amber-400 shadow-sm mb-1">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-display font-black tracking-tight text-slate-900">
            SAMA <span className="text-amber-600">WAAY</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">Espace administrateur</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          {error && (
            <div role="alert" className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-start gap-2">
              <span className="font-bold shrink-0" aria-hidden="true">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                Adresse e-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  placeholder="admin@samawaay.sn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
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
                  <span>Accéder au back-office</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Accès réservé à l'équipe Sama Waay</span>
        </div>
      </div>
    </div>
  );
};
