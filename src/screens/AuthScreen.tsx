import React, { useState } from 'react';
import { api } from '../services/api';
import { Scissors, Lock, Phone, User, Store, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AuthScreenProps {
  onSuccess: (data: { user: any; token: string; workshops: any[] }) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [fullName, setFullName] = useState('');
  const [workshopName, setWorkshopName] = useState('');
  const [codePrefix, setCodePrefix] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        const res = await api.login({ phone, pin });
        localStorage.setItem('tailor_token', res.accessToken);
        if (res.workshops && res.workshops.length > 0) {
          localStorage.setItem('tailor_workshop_id', res.workshops[0].workshopId);
        }
        onSuccess(res);
      } else {
        const res = await api.register({
          phone,
          pin,
          fullName,
          workshopName,
          codePrefix: codePrefix.toUpperCase(),
        });
        localStorage.setItem('tailor_token', res.accessToken);
        if (res.workshops && res.workshops.length > 0) {
          localStorage.setItem('tailor_workshop_id', res.workshops[0].workshopId);
        }
        onSuccess(res);
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-amber-500 shadow-xl shadow-emerald-900/30 text-white mb-2">
            <Scissors className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            <span className="text-amber-400">KOBA</span> TAILOR OS
          </h2>
          <p className="text-sm text-slate-400">
            L'outil de gestion d'atelier de couture moderne pour le Sénégal 🇸🇳
          </p>
        </div>

        {/* Auth Mode Toggle */}
        <div className="bg-slate-900 p-1 rounded-xl flex border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setError(null);
            }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${
              mode === 'LOGIN'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('REGISTER');
              setError(null);
            }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${
              mode === 'REGISTER'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Créer un atelier
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
          {error && (
            <div className="mb-5 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs p-3.5 rounded-xl flex items-start gap-2">
              <span className="font-bold shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'REGISTER' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nom complet (Maître / Tailleur)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Modou Fall"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 text-slate-100 placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Nom de l'atelier
                    </label>
                    <div className="relative">
                      <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="Ex: Couture Prestige"
                        value={workshopName}
                        onChange={(e) => setWorkshopName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 text-slate-100 placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Code (2-4 let.)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      placeholder="CP"
                      value={codePrefix}
                      onChange={(e) => setCodePrefix(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm uppercase text-center font-mono font-bold focus:outline-none focus:border-emerald-500 text-amber-400 placeholder-slate-600"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Numéro de téléphone (Sénégal)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  placeholder="Ex: 77 123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 text-slate-100 placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Code PIN secret (4 à 6 chiffres)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  inputMode="numeric"
                  required
                  maxLength={6}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm tracking-widest text-center font-mono focus:outline-none focus:border-emerald-500 text-slate-100 placeholder-slate-600"
                />
              </div>
            </div>

            {mode === 'REGISTER' && (
              <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-3 text-[11px] text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>
                  <strong>14 jours d'essai gratuit</strong> sans carte bancaire ni engagement.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition disabled:opacity-50 text-sm"
            >
              {loading ? (
                'Connexion en cours...'
              ) : mode === 'LOGIN' ? (
                <>
                  <span>Accéder à mon atelier</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Créer mon atelier (14j gratuits)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security / Compliance Badge */}
        <div className="text-center flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Données chiffrées & conformes CDP Sénégal (Loi 2008-12)</span>
        </div>
      </div>
    </div>
  );
};
