import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 max-w-sm mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
        <Scissors className="w-7 h-7 stroke-[2.5]" />
      </div>
      <h1 className="text-xl font-display font-black text-slate-900 mb-1">
        Page Introuvable (404)
      </h1>
      <p className="text-xs text-slate-500 mb-6">
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition active:scale-95 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour à l'accueil</span>
      </button>
    </div>
  );
};
