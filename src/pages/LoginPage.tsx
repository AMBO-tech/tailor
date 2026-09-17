import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import {
  Scissors,
  Lock,
  Phone,
  User,
  Store,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Upload,
  X,
  Loader2,
} from 'lucide-react';
import { compressImage } from '@utils/imageCompressor';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [fullName, setFullName] = useState('');
  const [workshopName, setWorkshopName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingLogo(true);
      try {
        const compressed = await compressImage(file, 800, 800, 0.75);
        setLogoUrl(compressed);
      } catch (err) {
        console.error('Erreur upload logo:', err);
      } finally {
        setIsUploadingLogo(false);
        e.target.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanPhone = phone.replace(/[\s\-\.]/g, '');

    try {
      if (mode === 'LOGIN') {
        await login({ phone: cleanPhone, pin });
      } else {
        await register({
          phone: cleanPhone,
          pin,
          fullName: fullName.trim(),
          workshopName: workshopName.trim(),
          logo: logoUrl || undefined,
        });
      }
      navigate('/');
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Identifiants incorrects ou problème réseau.');
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
          <p className="text-xs text-slate-500 font-medium">
            L'application des Maîtres-Tailleurs du Sénégal 🇸🇳
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-200/70 p-1 rounded-xl flex">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'LOGIN'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
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
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'REGISTER'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Créer un atelier
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-start gap-2">
              <span className="font-bold shrink-0">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'REGISTER' && (
              <>
                <div>
                  <label htmlFor="fullName" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nom complet (Maître Tailleur) *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      id="fullName"
                      type="text"
                      required
                      placeholder="Ex: Modou Fall"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="workshopName" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nom de l'atelier *
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      id="workshopName"
                      type="text"
                      required
                      placeholder="Ex: Keur Serigne Couture"
                      value={workshopName}
                      onChange={(e) => setWorkshopName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Logo Atelier */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Logo de l'atelier <span className="text-slate-400 font-normal">(Optionnel)</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-1">
                      <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95">
                        {isUploadingLogo ? (
                          <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <span>{isUploadingLogo ? 'Chargement...' : logoUrl ? 'Changer' : 'Importer photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>

                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition"
                          title="Retirer le logo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="phone" className="block text-xs font-bold text-slate-700 mb-1.5">
                Numéro de téléphone
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-mono focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
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
                  autoComplete="current-password"
                  inputMode="numeric"
                  required
                  maxLength={6}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm tracking-widest text-center font-mono font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {mode === 'REGISTER' && (
              <div className="bg-emerald-50 rounded-xl p-3 text-xs text-emerald-800 flex items-center gap-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>14 jours d'essai gratuit inclus.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 text-xs sm:text-sm"
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
                  <span>Créer mon atelier</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
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
