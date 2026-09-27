import { useEffect, useId, useRef, type RefObject } from 'react';

/** Éléments pouvant recevoir le focus clavier à l'intérieur d'une modale. */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Pile des modales ouvertes (de la plus ancienne à la plus récente).
 * Seule la modale au sommet réagit à Échap et piège la touche Tab : une modale
 * enfant (ex. création rapide de cliente dans la modale commande) se ferme donc
 * seule, sans fermer sa modale parente.
 */
const openDialogStack: symbol[] = [];

export interface UseModalA11yOptions {
  /** La modale est-elle affichée ? (par défaut `true` : modale montée = ouverte). */
  isOpen?: boolean;
  /** Fermeture demandée (touche Échap). */
  onClose: () => void;
  /** Autorise la fermeture par Échap (ex. `false` pendant un envoi). Par défaut `true`. */
  closeOnEscape?: boolean;
}

/** Attributs à répandre sur le panneau de la modale (`<div {...dialogProps}>`). */
export interface ModalDialogProps<T extends HTMLElement> {
  ref: RefObject<T | null>;
  role: 'dialog';
  'aria-modal': true;
  'aria-labelledby': string;
  tabIndex: -1;
}

export interface ModalA11y<T extends HTMLElement> {
  /** Identifiant à poser sur le titre visible de la modale (`<h2 id={titleId}>`). */
  titleId: string;
  /** Attributs ARIA + référence du panneau de dialogue. */
  dialogProps: ModalDialogProps<T>;
}

/** Renvoie les éléments focalisables visibles d'un conteneur, dans l'ordre du DOM. */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.getAttribute('aria-hidden') !== 'true',
  );
}

/**
 * Maintient le focus clavier à l'intérieur de la modale lors d'un appui sur Tab
 * (boucle du dernier au premier élément, et inversement avec Maj+Tab).
 */
function trapTabKey(event: KeyboardEvent, container: HTMLElement): void {
  const focusables = getFocusableElements(container);
  if (focusables.length === 0) {
    event.preventDefault();
    container.focus();
    return;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;

  if (!container.contains(active)) {
    event.preventDefault();
    first.focus();
  } else if (event.shiftKey && (active === first || active === container)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Accessibilité commune des modales existantes (A11Y-2), sans toucher à leur rendu :
 *
 * - fournit `role="dialog"`, `aria-modal`, `aria-labelledby` (via `titleId`) ;
 * - place le focus sur le panneau à l'ouverture (sans ouvrir le clavier virtuel) ;
 * - ferme la modale avec Échap (seulement la modale au sommet de la pile) ;
 * - piège la touche Tab à l'intérieur de la modale ;
 * - rend le focus à l'élément qui l'avait avant l'ouverture, à la fermeture.
 *
 * @example
 * const { titleId, dialogProps } = useModalA11y({ isOpen, onClose });
 * return (
 *   <div className="overlay">
 *     <div {...dialogProps} className="panneau">
 *       <h2 id={titleId}>Titre</h2>
 *     </div>
 *   </div>
 * );
 */
export function useModalA11y<T extends HTMLElement = HTMLDivElement>({
  isOpen = true,
  onClose,
  closeOnEscape = true,
}: UseModalA11yOptions): ModalA11y<T> {
  const dialogRef = useRef<T>(null);
  const titleId = useId();

  // Référence toujours à jour du callback : évite de réabonner l'écouteur à chaque rendu.
  const onCloseRef = useRef(onClose);
  const closeOnEscapeRef = useRef(closeOnEscape);
  useEffect(() => {
    onCloseRef.current = onClose;
    closeOnEscapeRef.current = closeOnEscape;
  });

  useEffect(() => {
    if (!isOpen) return undefined;

    const token = Symbol('dialog');
    openDialogStack.push(token);

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    if (dialog && !dialog.contains(document.activeElement)) {
      dialog.focus({ preventScroll: true });
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (openDialogStack[openDialogStack.length - 1] !== token) return;

      if (event.key === 'Escape') {
        if (!closeOnEscapeRef.current) return;
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key === 'Tab' && dialogRef.current) {
        trapTabKey(event, dialogRef.current);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const index = openDialogStack.indexOf(token);
      if (index !== -1) openDialogStack.splice(index, 1);
      if (previouslyFocused && previouslyFocused.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [isOpen]);

  return {
    titleId,
    dialogProps: {
      ref: dialogRef,
      role: 'dialog',
      'aria-modal': true,
      'aria-labelledby': titleId,
      tabIndex: -1,
    },
  };
}
