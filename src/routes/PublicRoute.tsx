import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';

/**
 * Routes publiques (connexion) : redirige vers l'accueil une fois connecté.
 *
 * `isLoading` n'est volontairement pas utilisé : il ne reflète que la requête
 * de connexion en cours. Remplacer la page par un indicateur démontait le
 * formulaire, qui perdait alors son message d'erreur (identifiants
 * incorrects, compte verrouillé...) : l'utilisateur ne le voyait jamais.
 * Le bouton du formulaire affiche déjà « Connexion en cours... ».
 */
export const PublicRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
