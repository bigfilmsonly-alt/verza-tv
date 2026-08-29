/* ================================================================== */
/*  i18n — client-side language switching for VERZA TV                 */
/*  No URL routing — uses localStorage + React context                 */
/* ================================================================== */

export type Locale =
  | "en" | "es" | "fr" | "pt" | "de" | "it" | "ja" | "ko"
  | "zh" | "hi" | "ar" | "ru" | "tr" | "pl" | "nl" | "th"
  | "vi" | "id" | "tl" | "sw";

export const LOCALES: { code: Locale; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "es", label: "Spanish", native: "Espa\u00f1ol" },
  { code: "fr", label: "French", native: "Fran\u00e7ais" },
  { code: "pt", label: "Portuguese", native: "Portugu\u00eas" },
  { code: "de", label: "German", native: "Deutsch" },
  { code: "it", label: "Italian", native: "Italiano" },
  { code: "ja", label: "Japanese", native: "\u65e5\u672c\u8a9e" },
  { code: "ko", label: "Korean", native: "\ud55c\uad6d\uc5b4" },
  { code: "zh", label: "Chinese", native: "\u4e2d\u6587" },
  { code: "hi", label: "Hindi", native: "\u0939\u093f\u0928\u094d\u0926\u0940" },
  { code: "ar", label: "Arabic", native: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" },
  { code: "ru", label: "Russian", native: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439" },
  { code: "tr", label: "Turkish", native: "T\u00fcrk\u00e7e" },
  { code: "pl", label: "Polish", native: "Polski" },
  { code: "nl", label: "Dutch", native: "Nederlands" },
  { code: "th", label: "Thai", native: "\u0e44\u0e17\u0e22" },
  { code: "vi", label: "Vietnamese", native: "Ti\u1ebfng Vi\u1ec7t" },
  { code: "id", label: "Indonesian", native: "Bahasa Indonesia" },
  { code: "tl", label: "Filipino", native: "Filipino" },
  { code: "sw", label: "Swahili", native: "Kiswahili" },
];

/* Flat translation keys */
export interface Translations {
  /* Nav */
  "nav.discover": string;
  "nav.shorts": string;
  "nav.widescreen": string;
  "nav.shop": string;
  "nav.library": string;
  "nav.profile": string;
  /* Header */
  "header.followUs": string;
  /* Browse */
  "browse.startWatchingFree": string;
  "browse.trending": string;
  "browse.episodes": string;
  "browse.allShows": string;
  /* Category tabs */
  "tab.drama": string;
  "tab.new": string;
  "tab.popular": string;
  "tab.music": string;
  "tab.reality": string;
  "tab.redCarpet": string;
  /* Shorts rail */
  "shorts.like": string;
  "shorts.liked": string;
  "shorts.list": string;
  "shorts.saved": string;
  "shorts.share": string;
  "shorts.copied": string;
  "shorts.sound": string;
  "shorts.soundOn": string;
  "shorts.soundOff": string;
  /* Horizontal */
  "horizontal.widescreen": string;
  "horizontal.episodes": string;
  "horizontal.play": string;
  "horizontal.pause": string;
  /* Profile */
  "profile.guest": string;
  "profile.signIn": string;
  "profile.signInPrompt": string;
  "profile.coinBalance": string;
  "profile.coins": string;
  "profile.buyCoins": string;
  "profile.myList": string;
  "profile.continueWatching": string;
  "profile.purchaseHistory": string;
  "profile.language": string;
  "profile.notifications": string;
  "profile.darkMode": string;
  "profile.helpFaq": string;
  "profile.sendFeedback": string;
  "profile.reportProblem": string;
  "profile.signOut": string;
  /* Library */
  "library.title": string;
  "library.channels": string;
  "library.myList": string;
  "library.noSavedShows": string;
  "library.browseShows": string;
  "library.comingSoon": string;
  "library.shows": string;
  /* Auth */
  "auth.signInHeading": string;
  "auth.signUpHeading": string;
  "auth.email": string;
  "auth.displayName": string;
  "auth.continueWithEmail": string;
  "auth.continueWithGoogle": string;
  "auth.continueWithApple": string;
  "auth.createAccount": string;
  "auth.continueAsGuest": string;
  "auth.noAccount": string;
  "auth.haveAccount": string;
  "auth.signUp": string;
  /* Legal */
  "legal.terms": string;
  "legal.privacy": string;
  "legal.refund": string;
  /* Content pages */
  "content.synopsis": string;
  "content.episodes": string;
  "content.cast": string;
  "content.moreLikeThis": string;
  "content.views": string;
  "content.now": string;
  "content.info": string;
  "content.allEpisodes": string;
  "content.previous": string;
  "content.next": string;
  "content.episodeOf": string;
  "content.freeEpisodeOf": string;
  "content.trending": string;
  "content.watchFree": string;
  "content.unlockSeries": string;
  "content.oneTimePayment": string;
  "content.allEpisodesIncluded": string;
  "content.episodeLocked": string;
  "content.unlockPrompt": string;
  "content.tryAgain": string;
  /* Paywall + checkout — the payment screen, in the viewer's language */
  "paywall.unlockAll": string;
  "paywall.unavailableTitle": string;
  "paywall.unavailableBody": string;
  "paywall.previewOver": string;
  "paywall.benefitEpisodes": string;
  "paywall.benefitAccess": string;
  "paywall.oneTimeUnlock": string;
  "paywall.cta": string;
  "paywall.ctaLoading": string;
  "paywall.secure": string;
  "paywall.goBack": string;
  "checkout.errorStart": string;
  "checkout.errorNotOpened": string;
  "checkout.errorNetwork": string;
  "checkout.errorAuth": string;
  "checkout.errorNotPurchasable": string;
  "checkout.errorEligibility": string;
  "checkout.errorAccountDeletion": string;
  "checkout.errorPaymentReview": string;
  "checkout.errorCheckoutUnusable": string;
  "checkout.errorRefunded": string;
  "checkout.errorNotFound": string;
  /* Audio-language labelling */
  "language.audio": string;
  "language.audioSubs": string;
  /* Misc */
  "misc.free": string;
  "misc.comingSoon": string;
  "misc.close": string;
}

export type TranslationKey = keyof Translations;

const en: Translations = {
  "nav.discover": "Discover", "nav.shorts": "Shorts", "nav.widescreen": "Widescreen",
  "nav.shop": "Shop", "nav.library": "Library", "nav.profile": "Profile",
  "header.followUs": "Follow us",
  "browse.startWatchingFree": "Start Watching Free", "browse.trending": "Trending", "browse.episodes": "episodes", "browse.allShows": "All Shows",
  "tab.drama": "Drama", "tab.new": "New", "tab.popular": "Hot", "tab.music": "Music", "tab.reality": "Reality", "tab.redCarpet": "Red Carpet",
  "shorts.list": "List", "shorts.saved": "Saved", "shorts.share": "Share", "shorts.copied": "Copied!", "shorts.sound": "Sound", "shorts.soundOn": "On", "shorts.soundOff": "Off",
  "horizontal.widescreen": "Widescreen", "horizontal.episodes": "episodes", "horizontal.play": "Play", "horizontal.pause": "Pause",
  "profile.guest": "Guest", "profile.signIn": "Sign In", "profile.signInPrompt": "Sign in to sync your library and purchases",
  "profile.coinBalance": "Coin Balance", "profile.coins": "coins", "profile.buyCoins": "Buy Coins",
  "profile.myList": "My List", "profile.continueWatching": "Continue Watching", "profile.purchaseHistory": "Purchase History",
  "profile.language": "Language", "profile.notifications": "Notifications", "profile.darkMode": "Dark Mode",
  "profile.helpFaq": "Help & FAQs", "profile.sendFeedback": "Send Feedback", "profile.reportProblem": "Report a Problem", "profile.signOut": "Sign Out",
  "library.title": "Library", "library.channels": "Channels", "library.myList": "My List",
  "library.noSavedShows": "No saved shows yet", "library.browseShows": "Browse Shows", "library.comingSoon": "Coming Soon", "library.shows": "shows",
  "auth.signInHeading": "Sign in to VERZA TV", "auth.signUpHeading": "Create your account",
  "auth.email": "Email address", "auth.displayName": "Display name",
  "auth.continueWithEmail": "Continue with Email", "auth.continueWithGoogle": "Continue with Google", "auth.continueWithApple": "Continue with Apple",
  "auth.createAccount": "Create Account", "auth.continueAsGuest": "Continue as Guest",
  "auth.noAccount": "Don\u2019t have an account?", "auth.haveAccount": "Already have an account?", "auth.signUp": "Sign Up",
  "legal.terms": "Terms of Service", "legal.privacy": "Privacy Policy", "legal.refund": "Refund Policy",
  "misc.free": "Free", "misc.comingSoon": "Coming Soon", "misc.close": "Close",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.freeEpisodeOf": "Free episode {n} of {total}", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "Free-preview availability varies by title. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
  "paywall.unlockAll": "Unlock All Episodes",
  "paywall.unavailableTitle": "Episode Unavailable",
  "paywall.unavailableBody": "This episode isn\u2019t available in this app.",
  "paywall.previewOver": "You just watched the free preview of {title}. Don\u2019t stop now \u2014 the story is just getting good.",
  "paywall.benefitEpisodes": "All {count} episodes, instantly",
  "paywall.benefitAccess": "Access on your Verza account while this title remains available",
  "paywall.oneTimeUnlock": "one-time Series Unlock",
  "paywall.cta": "Series Unlock \u2014 {price} one-time",
  "paywall.ctaLoading": "Opening secure checkout\u2026",
  "paywall.secure": "Secure checkout via Stripe",
  "paywall.goBack": "Go Back",
  "checkout.errorStart": "Couldn\u2019t start checkout. Please try again.",
  "checkout.errorNotOpened": "Checkout did not open. Please try again.",
  "checkout.errorNetwork": "Network error. Check your connection and try again.",
  "checkout.errorAuth": "Please sign in to finish this purchase.",
  "checkout.errorNotPurchasable": "This series is not available for purchase.",
  "checkout.errorEligibility": "We could not check your purchase eligibility. Please try again.",
  "checkout.errorAccountDeletion": "Account deletion is in progress.",
  "checkout.errorPaymentReview": "An earlier payment is still being reviewed. Contact support before trying again.",
  "checkout.errorCheckoutUnusable": "An earlier checkout could not be safely reused. Contact support.",
  "checkout.errorRefunded": "This payment was refunded or disputed.",
  "checkout.errorNotFound": "This series could not be found.",
  "language.audio": "{language} audio",
  "language.audioSubs": "{language} audio \u00b7 {subtitles} subtitles",
  "shorts.like": "Like", "shorts.liked": "Liked",
};

const es: Translations = {
  "nav.discover": "Descubrir", "nav.shorts": "Cortos", "nav.widescreen": "Panor\u00e1mico",
  "nav.shop": "Tienda", "nav.library": "Biblioteca", "nav.profile": "Perfil",
  "header.followUs": "S\u00edguenos",
  "browse.startWatchingFree": "Empieza a Ver Gratis", "browse.trending": "Tendencia", "browse.episodes": "episodios", "browse.allShows": "Todas las Series",
  "tab.drama": "Drama", "tab.new": "Nuevo", "tab.popular": "Hot", "tab.music": "M\u00fasica", "tab.reality": "Reality", "tab.redCarpet": "Alfombra Roja",
  "shorts.list": "Lista", "shorts.saved": "Guardado", "shorts.share": "Compartir", "shorts.copied": "\u00a1Copiado!", "shorts.sound": "Sonido", "shorts.soundOn": "On", "shorts.soundOff": "Off",
  "horizontal.widescreen": "Panor\u00e1mico", "horizontal.episodes": "episodios", "horizontal.play": "Reproducir", "horizontal.pause": "Pausa",
  "profile.guest": "Invitado", "profile.signIn": "Iniciar Sesi\u00f3n", "profile.signInPrompt": "Inicia sesi\u00f3n para sincronizar tu biblioteca",
  "profile.coinBalance": "Saldo de Monedas", "profile.coins": "monedas", "profile.buyCoins": "Comprar Monedas",
  "profile.myList": "Mi Lista", "profile.continueWatching": "Seguir Viendo", "profile.purchaseHistory": "Historial de Compras",
  "profile.language": "Idioma", "profile.notifications": "Notificaciones", "profile.darkMode": "Modo Oscuro",
  "profile.helpFaq": "Ayuda y Preguntas", "profile.sendFeedback": "Enviar Comentarios", "profile.reportProblem": "Reportar Problema", "profile.signOut": "Cerrar Sesi\u00f3n",
  "library.title": "Biblioteca", "library.channels": "Canales", "library.myList": "Mi Lista",
  "library.noSavedShows": "No hay series guardadas", "library.browseShows": "Ver Series", "library.comingSoon": "Pr\u00f3ximamente", "library.shows": "series",
  "auth.signInHeading": "Inicia sesi\u00f3n en VERZA TV", "auth.signUpHeading": "Crea tu cuenta",
  "auth.email": "Correo electr\u00f3nico", "auth.displayName": "Nombre",
  "auth.continueWithEmail": "Continuar con Email", "auth.continueWithGoogle": "Continuar con Google", "auth.continueWithApple": "Continuar con Apple",
  "auth.createAccount": "Crear Cuenta", "auth.continueAsGuest": "Continuar como Invitado",
  "auth.noAccount": "\u00bfNo tienes cuenta?", "auth.haveAccount": "\u00bfYa tienes cuenta?", "auth.signUp": "Registrarse",
  "legal.terms": "T\u00e9rminos de Servicio", "legal.privacy": "Pol\u00edtica de Privacidad", "legal.refund": "Pol\u00edtica de Reembolso",
  "misc.free": "Gratis", "misc.comingSoon": "Pr\u00f3ximamente", "misc.close": "Cerrar",
  "content.synopsis": "Sinopsis", "content.episodes": "Episodios", "content.cast": "Reparto", "content.moreLikeThis": "M\u00e1s Como Esto", "content.views": "vistas", "content.now": "AHORA", "content.info": "Info", "content.allEpisodes": "Todos los Episodios", "content.previous": "Anterior", "content.next": "Siguiente", "content.episodeOf": "Episodio {n} de {total}", "content.freeEpisodeOf": "Episodio gratis {n} de {total}", "content.trending": "Tendencia", "content.watchFree": "Ver Episodio 1 Gratis", "content.unlockSeries": "Desbloquear Serie Completa", "content.oneTimePayment": "Pago \u00fanico", "content.allEpisodesIncluded": "Todos los episodios incluidos", "content.episodeLocked": "El episodio {n} est\u00e1 bloqueado", "content.unlockPrompt": "La cantidad de episodios gratuitos varía según el título. Desbloquea la serie completa.", "content.tryAgain": "Intentar de Nuevo",
  "paywall.unlockAll": "Desbloquea todos los episodios",
  "paywall.unavailableTitle": "Episodio no disponible",
  "paywall.unavailableBody": "Este episodio no est\u00e1 disponible en esta app.",
  "paywall.previewOver": "Acabas de ver la vista previa gratuita de {title}. No pares ahora: la historia reci\u00e9n se pone buena.",
  "paywall.benefitEpisodes": "Los {count} episodios, al instante",
  "paywall.benefitAccess": "Acceso desde tu cuenta Verza mientras este t\u00edtulo siga disponible",
  "paywall.oneTimeUnlock": "desbloqueo de la serie, pago \u00fanico",
  "paywall.cta": "Desbloquear la serie \u2014 {price}, pago \u00fanico",
  "paywall.ctaLoading": "Abriendo el pago seguro\u2026",
  "paywall.secure": "Pago seguro con Stripe",
  "paywall.goBack": "Volver",
  "checkout.errorStart": "No se pudo iniciar el pago. Int\u00e9ntalo de nuevo.",
  "checkout.errorNotOpened": "El pago no se abri\u00f3. Int\u00e9ntalo de nuevo.",
  "checkout.errorNetwork": "Error de red. Revisa tu conexi\u00f3n e int\u00e9ntalo de nuevo.",
  "checkout.errorAuth": "Inicia sesi\u00f3n para completar esta compra.",
  "checkout.errorNotPurchasable": "Esta serie no est\u00e1 a la venta.",
  "checkout.errorEligibility": "No pudimos verificar tu elegibilidad de compra. Int\u00e9ntalo de nuevo.",
  "checkout.errorAccountDeletion": "La eliminaci\u00f3n de la cuenta est\u00e1 en curso.",
  "checkout.errorPaymentReview": "Un pago anterior sigue en revisi\u00f3n. Contacta con soporte antes de volver a intentarlo.",
  "checkout.errorCheckoutUnusable": "No se pudo reutilizar un pago anterior de forma segura. Contacta con soporte.",
  "checkout.errorRefunded": "Este pago fue reembolsado o disputado.",
  "checkout.errorNotFound": "No se encontr\u00f3 esta serie.",
  "language.audio": "Audio en {language}",
  "language.audioSubs": "Audio en {language} \u00b7 subt\u00edtulos en {subtitles}",
  "shorts.like": "Me gusta", "shorts.liked": "Te gusta",
};

const fr: Translations = {
  "nav.discover": "D\u00e9couvrir", "nav.shorts": "Courts", "nav.widescreen": "\u00c9cran Large",
  "nav.shop": "Boutique", "nav.library": "Biblioth\u00e8que", "nav.profile": "Profil",
  "header.followUs": "Suivez-nous",
  "browse.startWatchingFree": "Regarder Gratuitement", "browse.trending": "Tendances", "browse.episodes": "\u00e9pisodes", "browse.allShows": "Toutes les S\u00e9ries",
  "tab.drama": "Drame", "tab.new": "Nouveau", "tab.popular": "Hot", "tab.music": "Musique", "tab.reality": "T\u00e9l\u00e9r\u00e9alit\u00e9", "tab.redCarpet": "Tapis Rouge",
  "shorts.list": "Liste", "shorts.saved": "Enregistr\u00e9", "shorts.share": "Partager", "shorts.copied": "Copi\u00e9!", "shorts.sound": "Son", "shorts.soundOn": "On", "shorts.soundOff": "Off",
  "horizontal.widescreen": "\u00c9cran Large", "horizontal.episodes": "\u00e9pisodes", "horizontal.play": "Lire", "horizontal.pause": "Pause",
  "profile.guest": "Invit\u00e9", "profile.signIn": "Se Connecter", "profile.signInPrompt": "Connectez-vous pour synchroniser votre biblioth\u00e8que",
  "profile.coinBalance": "Solde de Pi\u00e8ces", "profile.coins": "pi\u00e8ces", "profile.buyCoins": "Acheter des Pi\u00e8ces",
  "profile.myList": "Ma Liste", "profile.continueWatching": "Continuer \u00e0 Regarder", "profile.purchaseHistory": "Historique d\u2019Achats",
  "profile.language": "Langue", "profile.notifications": "Notifications", "profile.darkMode": "Mode Sombre",
  "profile.helpFaq": "Aide et FAQ", "profile.sendFeedback": "Envoyer un Commentaire", "profile.reportProblem": "Signaler un Probl\u00e8me", "profile.signOut": "Se D\u00e9connecter",
  "library.title": "Biblioth\u00e8que", "library.channels": "Cha\u00eenes", "library.myList": "Ma Liste",
  "library.noSavedShows": "Aucune s\u00e9rie enregistr\u00e9e", "library.browseShows": "Parcourir les S\u00e9ries", "library.comingSoon": "Bient\u00f4t", "library.shows": "s\u00e9ries",
  "auth.signInHeading": "Connectez-vous \u00e0 VERZA TV", "auth.signUpHeading": "Cr\u00e9ez votre compte",
  "auth.email": "Adresse email", "auth.displayName": "Nom d\u2019affichage",
  "auth.continueWithEmail": "Continuer par Email", "auth.continueWithGoogle": "Continuer avec Google", "auth.continueWithApple": "Continuer avec Apple",
  "auth.createAccount": "Cr\u00e9er un Compte", "auth.continueAsGuest": "Continuer en tant qu\u2019Invit\u00e9",
  "auth.noAccount": "Pas de compte?", "auth.haveAccount": "D\u00e9j\u00e0 un compte?", "auth.signUp": "S\u2019inscrire",
  "legal.terms": "Conditions d\u2019Utilisation", "legal.privacy": "Politique de Confidentialit\u00e9", "legal.refund": "Politique de Remboursement",
  "misc.free": "Gratuit", "misc.comingSoon": "Bient\u00f4t", "misc.close": "Fermer",
  "content.synopsis": "Synopsis", "content.episodes": "\u00c9pisodes", "content.cast": "Distribution", "content.moreLikeThis": "Dans le M\u00eame Genre", "content.views": "vues", "content.now": "EN COURS", "content.info": "Info", "content.allEpisodes": "Tous les \u00c9pisodes", "content.previous": "Pr\u00e9c\u00e9dent", "content.next": "Suivant", "content.episodeOf": "\u00c9pisode {n} sur {total}", "content.freeEpisodeOf": "Épisode gratuit {n} sur {total}", "content.trending": "Tendances", "content.watchFree": "Regarder l\u2019\u00c9pisode 1 Gratuitement", "content.unlockSeries": "D\u00e9bloquer la S\u00e9rie", "content.oneTimePayment": "Paiement unique", "content.allEpisodesIncluded": "Tous les \u00e9pisodes inclus", "content.episodeLocked": "L\u2019\u00e9pisode {n} est verrouill\u00e9", "content.unlockPrompt": "Le nombre d’épisodes gratuits varie selon le titre. Débloquez la série complète.", "content.tryAgain": "R\u00e9essayer",
  "paywall.unlockAll": "D\u00e9bloquer tous les \u00e9pisodes",
  "paywall.unavailableTitle": "\u00c9pisode indisponible",
  "paywall.unavailableBody": "Cet \u00e9pisode n\u2019est pas disponible dans cette application.",
  "paywall.previewOver": "Vous venez de voir l\u2019aper\u00e7u gratuit de {title}. Ne vous arr\u00eatez pas \u2014 l\u2019histoire commence \u00e0 peine.",
  "paywall.benefitEpisodes": "Les {count} \u00e9pisodes, imm\u00e9diatement",
  "paywall.benefitAccess": "Acc\u00e8s depuis votre compte Verza tant que ce titre reste disponible",
  "paywall.oneTimeUnlock": "achat unique de la s\u00e9rie",
  "paywall.cta": "D\u00e9bloquer la s\u00e9rie \u2014 {price}, achat unique",
  "paywall.ctaLoading": "Ouverture du paiement s\u00e9curis\u00e9\u2026",
  "paywall.secure": "Paiement s\u00e9curis\u00e9 via Stripe",
  "paywall.goBack": "Retour",
  "checkout.errorStart": "Impossible de d\u00e9marrer le paiement. Veuillez r\u00e9essayer.",
  "checkout.errorNotOpened": "Le paiement ne s\u2019est pas ouvert. Veuillez r\u00e9essayer.",
  "checkout.errorNetwork": "Erreur r\u00e9seau. V\u00e9rifiez votre connexion et r\u00e9essayez.",
  "checkout.errorAuth": "Connectez-vous pour finaliser cet achat.",
  "checkout.errorNotPurchasable": "Cette s\u00e9rie n\u2019est pas en vente.",
  "checkout.errorEligibility": "Impossible de v\u00e9rifier votre \u00e9ligibilit\u00e9 \u00e0 l\u2019achat. Veuillez r\u00e9essayer.",
  "checkout.errorAccountDeletion": "La suppression du compte est en cours.",
  "checkout.errorPaymentReview": "Un paiement pr\u00e9c\u00e9dent est encore en cours d\u2019examen. Contactez le support avant de r\u00e9essayer.",
  "checkout.errorCheckoutUnusable": "Un paiement pr\u00e9c\u00e9dent n\u2019a pas pu \u00eatre r\u00e9utilis\u00e9 en toute s\u00e9curit\u00e9. Contactez le support.",
  "checkout.errorRefunded": "Ce paiement a \u00e9t\u00e9 rembours\u00e9 ou contest\u00e9.",
  "checkout.errorNotFound": "Cette s\u00e9rie est introuvable.",
  "language.audio": "Audio en {language}",
  "language.audioSubs": "Audio en {language} \u00b7 sous-titres en {subtitles}",
  "shorts.like": "J\u2019aime", "shorts.liked": "Aim\u00e9",
};

const pt: Translations = {
  "nav.discover": "Descobrir", "nav.shorts": "Curtos", "nav.widescreen": "Tela Cheia",
  "nav.shop": "Loja", "nav.library": "Biblioteca", "nav.profile": "Perfil",
  "header.followUs": "Siga-nos",
  "browse.startWatchingFree": "Comece a Assistir Gr\u00e1tis", "browse.trending": "Em Alta", "browse.episodes": "epis\u00f3dios", "browse.allShows": "Todas as S\u00e9ries",
  "tab.drama": "Drama", "tab.new": "Novo", "tab.popular": "Hot", "tab.music": "M\u00fasica", "tab.reality": "Reality", "tab.redCarpet": "Tapete Vermelho",
  "shorts.list": "Lista", "shorts.saved": "Salvo", "shorts.share": "Compartilhar", "shorts.copied": "Copiado!", "shorts.sound": "Som", "shorts.soundOn": "On", "shorts.soundOff": "Off",
  "horizontal.widescreen": "Tela Cheia", "horizontal.episodes": "epis\u00f3dios", "horizontal.play": "Reproduzir", "horizontal.pause": "Pausar",
  "profile.guest": "Convidado", "profile.signIn": "Entrar", "profile.signInPrompt": "Entre para sincronizar sua biblioteca",
  "profile.coinBalance": "Saldo de Moedas", "profile.coins": "moedas", "profile.buyCoins": "Comprar Moedas",
  "profile.myList": "Minha Lista", "profile.continueWatching": "Continuar Assistindo", "profile.purchaseHistory": "Hist\u00f3rico de Compras",
  "profile.language": "Idioma", "profile.notifications": "Notifica\u00e7\u00f5es", "profile.darkMode": "Modo Escuro",
  "profile.helpFaq": "Ajuda e FAQ", "profile.sendFeedback": "Enviar Feedback", "profile.reportProblem": "Reportar Problema", "profile.signOut": "Sair",
  "library.title": "Biblioteca", "library.channels": "Canais", "library.myList": "Minha Lista",
  "library.noSavedShows": "Nenhuma s\u00e9rie salva", "library.browseShows": "Explorar S\u00e9ries", "library.comingSoon": "Em Breve", "library.shows": "s\u00e9ries",
  "auth.signInHeading": "Entre no VERZA TV", "auth.signUpHeading": "Crie sua conta",
  "auth.email": "Endere\u00e7o de email", "auth.displayName": "Nome de exibi\u00e7\u00e3o",
  "auth.continueWithEmail": "Continuar com Email", "auth.continueWithGoogle": "Continuar com Google", "auth.continueWithApple": "Continuar com Apple",
  "auth.createAccount": "Criar Conta", "auth.continueAsGuest": "Continuar como Convidado",
  "auth.noAccount": "N\u00e3o tem conta?", "auth.haveAccount": "J\u00e1 tem conta?", "auth.signUp": "Cadastrar",
  "legal.terms": "Termos de Servi\u00e7o", "legal.privacy": "Pol\u00edtica de Privacidade", "legal.refund": "Pol\u00edtica de Reembolso",
  "misc.free": "Gr\u00e1tis", "misc.comingSoon": "Em Breve", "misc.close": "Fechar",
  "content.synopsis": "Sinopse", "content.episodes": "Epis\u00f3dios", "content.cast": "Elenco", "content.moreLikeThis": "Mais Como Isto", "content.views": "visualiza\u00e7\u00f5es", "content.now": "AGORA", "content.info": "Info", "content.allEpisodes": "Todos os Epis\u00f3dios", "content.previous": "Anterior", "content.next": "Pr\u00f3ximo", "content.episodeOf": "Epis\u00f3dio {n} de {total}", "content.freeEpisodeOf": "Episódio grátis {n} de {total}", "content.trending": "Em Alta", "content.watchFree": "Assistir Epis\u00f3dio 1 Gr\u00e1tis", "content.unlockSeries": "Desbloquear S\u00e9rie", "content.oneTimePayment": "Pagamento \u00fanico", "content.allEpisodesIncluded": "Todos os epis\u00f3dios inclu\u00eddos", "content.episodeLocked": "O epis\u00f3dio {n} est\u00e1 bloqueado", "content.unlockPrompt": "A quantidade de episódios grátis varia por título. Desbloqueie a série completa.", "content.tryAgain": "Tentar Novamente",
  "paywall.unlockAll": "Desbloquear todos os epis\u00f3dios",
  "paywall.unavailableTitle": "Epis\u00f3dio indispon\u00edvel",
  "paywall.unavailableBody": "Este epis\u00f3dio n\u00e3o est\u00e1 dispon\u00edvel neste app.",
  "paywall.previewOver": "Voc\u00ea acabou de ver a pr\u00e9via gratuita de {title}. N\u00e3o pare agora \u2014 a hist\u00f3ria est\u00e1 s\u00f3 come\u00e7ando.",
  "paywall.benefitEpisodes": "Todos os {count} epis\u00f3dios, na hora",
  "paywall.benefitAccess": "Acesso pela sua conta Verza enquanto este t\u00edtulo estiver dispon\u00edvel",
  "paywall.oneTimeUnlock": "desbloqueio da s\u00e9rie, pagamento \u00fanico",
  "paywall.cta": "Desbloquear a s\u00e9rie \u2014 {price}, pagamento \u00fanico",
  "paywall.ctaLoading": "Abrindo o pagamento seguro\u2026",
  "paywall.secure": "Pagamento seguro via Stripe",
  "paywall.goBack": "Voltar",
  "checkout.errorStart": "N\u00e3o foi poss\u00edvel iniciar o pagamento. Tente novamente.",
  "checkout.errorNotOpened": "O pagamento n\u00e3o abriu. Tente novamente.",
  "checkout.errorNetwork": "Erro de rede. Verifique sua conex\u00e3o e tente novamente.",
  "checkout.errorAuth": "Entre na sua conta para concluir esta compra.",
  "checkout.errorNotPurchasable": "Esta s\u00e9rie n\u00e3o est\u00e1 \u00e0 venda.",
  "checkout.errorEligibility": "N\u00e3o foi poss\u00edvel verificar sua elegibilidade de compra. Tente novamente.",
  "checkout.errorAccountDeletion": "A exclus\u00e3o da conta est\u00e1 em andamento.",
  "checkout.errorPaymentReview": "Um pagamento anterior ainda est\u00e1 em an\u00e1lise. Fale com o suporte antes de tentar de novo.",
  "checkout.errorCheckoutUnusable": "Um pagamento anterior n\u00e3o p\u00f4de ser reaproveitado com seguran\u00e7a. Fale com o suporte.",
  "checkout.errorRefunded": "Este pagamento foi reembolsado ou contestado.",
  "checkout.errorNotFound": "Esta s\u00e9rie n\u00e3o foi encontrada.",
  "language.audio": "\u00c1udio em {language}",
  "language.audioSubs": "\u00c1udio em {language} \u00b7 legendas em {subtitles}",
  "shorts.like": "Curtir", "shorts.liked": "Curtido",
};

const de: Translations = {
  "nav.discover": "Entdecken", "nav.shorts": "Kurzfilme", "nav.widescreen": "Breitbild",
  "nav.shop": "Shop", "nav.library": "Bibliothek", "nav.profile": "Profil",
  "header.followUs": "Folgt uns",
  "browse.startWatchingFree": "Jetzt kostenlos ansehen", "browse.trending": "Im Trend", "browse.episodes": "Episoden", "browse.allShows": "Alle Serien",
  "tab.drama": "Drama", "tab.new": "Neu", "tab.popular": "Hot", "tab.music": "Musik", "tab.reality": "Reality", "tab.redCarpet": "Roter Teppich",
  "shorts.list": "Liste", "shorts.saved": "Gespeichert", "shorts.share": "Teilen", "shorts.copied": "Kopiert!", "shorts.sound": "Ton", "shorts.soundOn": "An", "shorts.soundOff": "Aus",
  "horizontal.widescreen": "Breitbild", "horizontal.episodes": "Episoden", "horizontal.play": "Abspielen", "horizontal.pause": "Pause",
  "profile.guest": "Gast", "profile.signIn": "Anmelden", "profile.signInPrompt": "Melden Sie sich an, um Ihre Bibliothek zu synchronisieren",
  "profile.coinBalance": "Kontostand", "profile.coins": "M\u00fcnzen", "profile.buyCoins": "M\u00fcnzen kaufen",
  "profile.myList": "Meine Liste", "profile.continueWatching": "Weiterschauen", "profile.purchaseHistory": "Kaufverlauf",
  "profile.language": "Sprache", "profile.notifications": "Benachrichtigungen", "profile.darkMode": "Dunkler Modus",
  "profile.helpFaq": "Hilfe & FAQ", "profile.sendFeedback": "Feedback senden", "profile.reportProblem": "Problem melden", "profile.signOut": "Abmelden",
  "library.title": "Bibliothek", "library.channels": "Kan\u00e4le", "library.myList": "Meine Liste",
  "library.noSavedShows": "Noch keine gespeicherten Serien", "library.browseShows": "Serien durchsuchen", "library.comingSoon": "Demn\u00e4chst", "library.shows": "Serien",
  "auth.signInHeading": "Bei VERZA TV anmelden", "auth.signUpHeading": "Konto erstellen",
  "auth.email": "E-Mail-Adresse", "auth.displayName": "Anzeigename",
  "auth.continueWithEmail": "Weiter mit E-Mail", "auth.continueWithGoogle": "Weiter mit Google", "auth.continueWithApple": "Weiter mit Apple",
  "auth.createAccount": "Konto erstellen", "auth.continueAsGuest": "Als Gast fortfahren",
  "auth.noAccount": "Noch kein Konto?", "auth.haveAccount": "Bereits ein Konto?", "auth.signUp": "Registrieren",
  "legal.terms": "Nutzungsbedingungen", "legal.privacy": "Datenschutzrichtlinie", "legal.refund": "R\u00fcckerstattungsrichtlinie",
  "misc.free": "Kostenlos", "misc.comingSoon": "Demn\u00e4chst", "misc.close": "Schlie\u00dfen",
  "content.synopsis": "Zusammenfassung", "content.episodes": "Episoden", "content.cast": "Besetzung", "content.moreLikeThis": "\u00c4hnliches", "content.views": "Aufrufe", "content.now": "JETZT", "content.info": "Info", "content.allEpisodes": "Alle Episoden", "content.previous": "Zur\u00fcck", "content.next": "Weiter", "content.episodeOf": "Episode {n} von {total}", "content.freeEpisodeOf": "Gratis-Episode {n} von {total}", "content.trending": "Im Trend", "content.watchFree": "Episode 1 Kostenlos Ansehen", "content.unlockSeries": "Serie Freischalten", "content.oneTimePayment": "Einmalzahlung", "content.allEpisodesIncluded": "Alle Episoden enthalten", "content.episodeLocked": "Episode {n} ist gesperrt", "content.unlockPrompt": "Die Anzahl kostenloser Episoden variiert je nach Titel. Schalte die ganze Serie frei.", "content.tryAgain": "Erneut Versuchen",
  "paywall.unlockAll": "Alle Folgen freischalten",
  "paywall.unavailableTitle": "Folge nicht verf\u00fcgbar",
  "paywall.unavailableBody": "Diese Folge ist in dieser App nicht verf\u00fcgbar.",
  "paywall.previewOver": "Du hast gerade die kostenlose Vorschau von {title} gesehen. H\u00f6r jetzt nicht auf \u2014 die Geschichte wird gerade erst gut.",
  "paywall.benefitEpisodes": "Alle {count} Folgen, sofort",
  "paywall.benefitAccess": "Zugriff \u00fcber dein Verza-Konto, solange dieser Titel verf\u00fcgbar bleibt",
  "paywall.oneTimeUnlock": "einmaliger Serien-Kauf",
  "paywall.cta": "Serie freischalten \u2014 {price}, einmalig",
  "paywall.ctaLoading": "Sichere Kasse wird ge\u00f6ffnet\u2026",
  "paywall.secure": "Sichere Zahlung \u00fcber Stripe",
  "paywall.goBack": "Zur\u00fcck",
  "checkout.errorStart": "Zahlung konnte nicht gestartet werden. Bitte versuche es erneut.",
  "checkout.errorNotOpened": "Die Kasse wurde nicht ge\u00f6ffnet. Bitte versuche es erneut.",
  "checkout.errorNetwork": "Netzwerkfehler. Pr\u00fcfe deine Verbindung und versuche es erneut.",
  "checkout.errorAuth": "Melde dich an, um diesen Kauf abzuschlie\u00dfen.",
  "checkout.errorNotPurchasable": "Diese Serie steht nicht zum Verkauf.",
  "checkout.errorEligibility": "Wir konnten deine Kaufberechtigung nicht pr\u00fcfen. Bitte versuche es erneut.",
  "checkout.errorAccountDeletion": "Die Kontol\u00f6schung l\u00e4uft.",
  "checkout.errorPaymentReview": "Eine fr\u00fchere Zahlung wird noch gepr\u00fcft. Wende dich an den Support, bevor du es erneut versuchst.",
  "checkout.errorCheckoutUnusable": "Eine fr\u00fchere Zahlung konnte nicht sicher wiederverwendet werden. Wende dich an den Support.",
  "checkout.errorRefunded": "Diese Zahlung wurde erstattet oder angefochten.",
  "checkout.errorNotFound": "Diese Serie wurde nicht gefunden.",
  "language.audio": "Ton auf {language}",
  "language.audioSubs": "Ton auf {language} \u00b7 Untertitel auf {subtitles}",
  "shorts.like": "Gef\u00e4llt mir", "shorts.liked": "Gef\u00e4llt dir",
};

const it: Translations = {
  "nav.discover": "Scopri", "nav.shorts": "Corti", "nav.widescreen": "Panoramico",
  "nav.shop": "Negozio", "nav.library": "Libreria", "nav.profile": "Profilo",
  "header.followUs": "Seguici",
  "browse.startWatchingFree": "Inizia a Guardare Gratis", "browse.trending": "Di Tendenza", "browse.episodes": "episodi", "browse.allShows": "Tutte le Serie",
  "tab.drama": "Drama", "tab.new": "Nuovo", "tab.popular": "Hot", "tab.music": "Musica", "tab.reality": "Reality", "tab.redCarpet": "Red Carpet",
  "shorts.list": "Lista", "shorts.saved": "Salvato", "shorts.share": "Condividi", "shorts.copied": "Copiato!", "shorts.sound": "Audio", "shorts.soundOn": "On", "shorts.soundOff": "Off",
  "horizontal.widescreen": "Panoramico", "horizontal.episodes": "episodi", "horizontal.play": "Riproduci", "horizontal.pause": "Pausa",
  "profile.guest": "Ospite", "profile.signIn": "Accedi", "profile.signInPrompt": "Accedi per sincronizzare la tua libreria",
  "profile.coinBalance": "Saldo Monete", "profile.coins": "monete", "profile.buyCoins": "Acquista Monete",
  "profile.myList": "La Mia Lista", "profile.continueWatching": "Continua a Guardare", "profile.purchaseHistory": "Cronologia Acquisti",
  "profile.language": "Lingua", "profile.notifications": "Notifiche", "profile.darkMode": "Modalit\u00e0 Scura",
  "profile.helpFaq": "Aiuto e FAQ", "profile.sendFeedback": "Invia Feedback", "profile.reportProblem": "Segnala un Problema", "profile.signOut": "Esci",
  "library.title": "Libreria", "library.channels": "Canali", "library.myList": "La Mia Lista",
  "library.noSavedShows": "Nessuna serie salvata", "library.browseShows": "Sfoglia le Serie", "library.comingSoon": "In Arrivo", "library.shows": "serie",
  "auth.signInHeading": "Accedi a VERZA TV", "auth.signUpHeading": "Crea il tuo account",
  "auth.email": "Indirizzo email", "auth.displayName": "Nome visualizzato",
  "auth.continueWithEmail": "Continua con Email", "auth.continueWithGoogle": "Continua con Google", "auth.continueWithApple": "Continua con Apple",
  "auth.createAccount": "Crea Account", "auth.continueAsGuest": "Continua come Ospite",
  "auth.noAccount": "Non hai un account?", "auth.haveAccount": "Hai gi\u00e0 un account?", "auth.signUp": "Registrati",
  "legal.terms": "Termini di Servizio", "legal.privacy": "Informativa sulla Privacy", "legal.refund": "Politica di Rimborso",
  "misc.free": "Gratuito", "misc.comingSoon": "In Arrivo", "misc.close": "Chiudi",
  "content.synopsis": "Trama", "content.episodes": "Episodi", "content.cast": "Cast", "content.moreLikeThis": "Simili", "content.views": "visualizzazioni", "content.now": "ORA", "content.info": "Info", "content.allEpisodes": "Tutti gli Episodi", "content.previous": "Precedente", "content.next": "Successivo", "content.episodeOf": "Episodio {n} di {total}", "content.freeEpisodeOf": "Episodio gratis {n} di {total}", "content.trending": "Di Tendenza", "content.watchFree": "Guarda Episodio 1 Gratis", "content.unlockSeries": "Sblocca la Serie", "content.oneTimePayment": "Pagamento unico", "content.allEpisodesIncluded": "Tutti gli episodi inclusi", "content.episodeLocked": "L\u2019episodio {n} \u00e8 bloccato", "content.unlockPrompt": "Il numero di episodi gratuiti varia in base al titolo. Sblocca la serie completa.", "content.tryAgain": "Riprova",
  "paywall.unlockAll": "Sblocca tutti gli episodi",
  "paywall.unavailableTitle": "Episodio non disponibile",
  "paywall.unavailableBody": "Questo episodio non \u00e8 disponibile in questa app.",
  "paywall.previewOver": "Hai appena visto l\u2019anteprima gratuita di {title}. Non fermarti ora: la storia sta appena diventando interessante.",
  "paywall.benefitEpisodes": "Tutti i {count} episodi, subito",
  "paywall.benefitAccess": "Accesso dal tuo account Verza finch\u00e9 questo titolo resta disponibile",
  "paywall.oneTimeUnlock": "sblocco della serie, pagamento unico",
  "paywall.cta": "Sblocca la serie \u2014 {price}, pagamento unico",
  "paywall.ctaLoading": "Apertura del pagamento sicuro\u2026",
  "paywall.secure": "Pagamento sicuro tramite Stripe",
  "paywall.goBack": "Indietro",
  "checkout.errorStart": "Impossibile avviare il pagamento. Riprova.",
  "checkout.errorNotOpened": "Il pagamento non si \u00e8 aperto. Riprova.",
  "checkout.errorNetwork": "Errore di rete. Controlla la connessione e riprova.",
  "checkout.errorAuth": "Accedi per completare questo acquisto.",
  "checkout.errorNotPurchasable": "Questa serie non \u00e8 in vendita.",
  "checkout.errorEligibility": "Non siamo riusciti a verificare la tua idoneit\u00e0 all\u2019acquisto. Riprova.",
  "checkout.errorAccountDeletion": "L\u2019eliminazione dell\u2019account \u00e8 in corso.",
  "checkout.errorPaymentReview": "Un pagamento precedente \u00e8 ancora in revisione. Contatta l\u2019assistenza prima di riprovare.",
  "checkout.errorCheckoutUnusable": "Non \u00e8 stato possibile riutilizzare in sicurezza un pagamento precedente. Contatta l\u2019assistenza.",
  "checkout.errorRefunded": "Questo pagamento \u00e8 stato rimborsato o contestato.",
  "checkout.errorNotFound": "Serie non trovata.",
  "language.audio": "Audio in {language}",
  "language.audioSubs": "Audio in {language} \u00b7 sottotitoli in {subtitles}",
  "shorts.like": "Mi piace", "shorts.liked": "Piaciuto",
};

const ja: Translations = {
  "nav.discover": "\u767a\u898b", "nav.shorts": "\u30b7\u30e7\u30fc\u30c8", "nav.widescreen": "\u30ef\u30a4\u30c9\u30b9\u30af\u30ea\u30fc\u30f3",
  "nav.shop": "\u30b7\u30e7\u30c3\u30d7", "nav.library": "\u30e9\u30a4\u30d6\u30e9\u30ea", "nav.profile": "\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb",
  "header.followUs": "\u30d5\u30a9\u30ed\u30fc\u3059\u308b",
  "browse.startWatchingFree": "\u7121\u6599\u3067\u8996\u8074\u958b\u59cb", "browse.trending": "\u30c8\u30ec\u30f3\u30c9", "browse.episodes": "\u30a8\u30d4\u30bd\u30fc\u30c9", "browse.allShows": "\u3059\u3079\u3066\u306e\u756a\u7d44",
  "tab.drama": "\u30c9\u30e9\u30de", "tab.new": "\u65b0\u7740", "tab.popular": "Hot", "tab.music": "\u97f3\u697d", "tab.reality": "\u30ea\u30a2\u30ea\u30c6\u30a3", "tab.redCarpet": "\u30ec\u30c3\u30c9\u30ab\u30fc\u30da\u30c3\u30c8",
  "shorts.list": "\u30ea\u30b9\u30c8", "shorts.saved": "\u4fdd\u5b58\u6e08\u307f", "shorts.share": "\u5171\u6709", "shorts.copied": "\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f\uff01", "shorts.sound": "\u30b5\u30a6\u30f3\u30c9", "shorts.soundOn": "\u30aa\u30f3", "shorts.soundOff": "\u30aa\u30d5",
  "horizontal.widescreen": "\u30ef\u30a4\u30c9\u30b9\u30af\u30ea\u30fc\u30f3", "horizontal.episodes": "\u30a8\u30d4\u30bd\u30fc\u30c9", "horizontal.play": "\u518d\u751f", "horizontal.pause": "\u4e00\u6642\u505c\u6b62",
  "profile.guest": "\u30b2\u30b9\u30c8", "profile.signIn": "\u30b5\u30a4\u30f3\u30a4\u30f3", "profile.signInPrompt": "\u30e9\u30a4\u30d6\u30e9\u30ea\u3092\u540c\u671f\u3059\u308b\u306b\u306f\u30b5\u30a4\u30f3\u30a4\u30f3",
  "profile.coinBalance": "\u30b3\u30a4\u30f3\u6b8b\u9ad8", "profile.coins": "\u30b3\u30a4\u30f3", "profile.buyCoins": "\u30b3\u30a4\u30f3\u3092\u8cfc\u5165",
  "profile.myList": "\u30de\u30a4\u30ea\u30b9\u30c8", "profile.continueWatching": "\u8996\u8074\u3092\u7d9a\u3051\u308b", "profile.purchaseHistory": "\u8cfc\u5165\u5c65\u6b74",
  "profile.language": "\u8a00\u8a9e", "profile.notifications": "\u901a\u77e5", "profile.darkMode": "\u30c0\u30fc\u30af\u30e2\u30fc\u30c9",
  "profile.helpFaq": "\u30d8\u30eb\u30d7\u3068FAQ", "profile.sendFeedback": "\u30d5\u30a3\u30fc\u30c9\u30d0\u30c3\u30af\u3092\u9001\u4fe1", "profile.reportProblem": "\u554f\u984c\u3092\u5831\u544a", "profile.signOut": "\u30b5\u30a4\u30f3\u30a2\u30a6\u30c8",
  "library.title": "\u30e9\u30a4\u30d6\u30e9\u30ea", "library.channels": "\u30c1\u30e3\u30f3\u30cd\u30eb", "library.myList": "\u30de\u30a4\u30ea\u30b9\u30c8",
  "library.noSavedShows": "\u4fdd\u5b58\u3055\u308c\u305f\u756a\u7d44\u306f\u3042\u308a\u307e\u305b\u3093", "library.browseShows": "\u756a\u7d44\u3092\u63a2\u3059", "library.comingSoon": "\u8fd1\u65e5\u516c\u958b", "library.shows": "\u756a\u7d44",
  "auth.signInHeading": "VERZA TV\u306b\u30b5\u30a4\u30f3\u30a4\u30f3", "auth.signUpHeading": "\u30a2\u30ab\u30a6\u30f3\u30c8\u3092\u4f5c\u6210",
  "auth.email": "\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9", "auth.displayName": "\u8868\u793a\u540d",
  "auth.continueWithEmail": "\u30e1\u30fc\u30eb\u3067\u7d9a\u884c", "auth.continueWithGoogle": "Google\u3067\u7d9a\u884c", "auth.continueWithApple": "Apple\u3067\u7d9a\u884c",
  "auth.createAccount": "\u30a2\u30ab\u30a6\u30f3\u30c8\u4f5c\u6210", "auth.continueAsGuest": "\u30b2\u30b9\u30c8\u3068\u3057\u3066\u7d9a\u884c",
  "auth.noAccount": "\u30a2\u30ab\u30a6\u30f3\u30c8\u3092\u304a\u6301\u3061\u3067\u306a\u3044\u65b9", "auth.haveAccount": "\u30a2\u30ab\u30a6\u30f3\u30c8\u3092\u304a\u6301\u3061\u306e\u65b9", "auth.signUp": "\u65b0\u898f\u767b\u9332",
  "legal.terms": "\u5229\u7528\u898f\u7d04", "legal.privacy": "\u30d7\u30e9\u30a4\u30d0\u30b7\u30fc\u30dd\u30ea\u30b7\u30fc", "legal.refund": "\u8fd4\u91d1\u30dd\u30ea\u30b7\u30fc",
  "misc.free": "\u7121\u6599", "misc.comingSoon": "\u8fd1\u65e5\u516c\u958b", "misc.close": "\u9589\u3058\u308b",
  "content.synopsis": "\u3042\u3089\u3059\u3058", "content.episodes": "\u30a8\u30d4\u30bd\u30fc\u30c9", "content.cast": "\u30ad\u30e3\u30b9\u30c8", "content.moreLikeThis": "\u985e\u4f3c\u4f5c\u54c1", "content.views": "\u56de\u8996\u8074", "content.now": "\u518d\u751f\u4e2d", "content.info": "\u60c5\u5831", "content.allEpisodes": "\u5168\u30a8\u30d4\u30bd\u30fc\u30c9", "content.previous": "\u524d\u3078", "content.next": "\u6b21\u3078", "content.episodeOf": "\u30a8\u30d4\u30bd\u30fc\u30c9{n}/{total}", "content.freeEpisodeOf": "無料エピソード {n}/{total}", "content.trending": "\u30c8\u30ec\u30f3\u30c9", "content.watchFree": "\u30a8\u30d4\u30bd\u30fc\u30c91\u3092\u7121\u6599\u3067\u898b\u308b", "content.unlockSeries": "\u30b7\u30ea\u30fc\u30ba\u3092\u89e3\u9664", "content.oneTimePayment": "\u4e00\u56de\u6255\u3044", "content.allEpisodesIncluded": "\u5168\u30a8\u30d4\u30bd\u30fc\u30c9\u542b\u3080", "content.episodeLocked": "\u30a8\u30d4\u30bd\u30fc\u30c9{n}\u306f\u30ed\u30c3\u30af\u3055\u308c\u3066\u3044\u307e\u3059", "content.unlockPrompt": "\u7121\u6599\u30a8\u30d4\u30bd\u30fc\u30c9\u6570\u306f\u4f5c\u54c1\u306b\u3088\u3063\u3066\u7570\u306a\u308a\u307e\u3059\u3002\u30b7\u30ea\u30fc\u30ba\u5168\u4f53\u3092\u89e3\u9664\u3057\u3066\u304f\u3060\u3055\u3044\u3002", "content.tryAgain": "\u3082\u3046\u4e00\u5ea6",
  "paywall.unlockAll": "\u5168\u30a8\u30d4\u30bd\u30fc\u30c9\u3092\u30a2\u30f3\u30ed\u30c3\u30af",
  "paywall.unavailableTitle": "\u3053\u306e\u30a8\u30d4\u30bd\u30fc\u30c9\u306f\u5229\u7528\u3067\u304d\u307e\u305b\u3093",
  "paywall.unavailableBody": "\u3053\u306e\u30a2\u30d7\u30ea\u3067\u306f\u3053\u306e\u30a8\u30d4\u30bd\u30fc\u30c9\u3092\u3054\u89a7\u3044\u305f\u3060\u3051\u307e\u305b\u3093\u3002",
  "paywall.previewOver": "{title} \u306e\u7121\u6599\u30d7\u30ec\u30d3\u30e5\u30fc\u306f\u3053\u3053\u307e\u3067\u3067\u3059\u3002\u7269\u8a9e\u306f\u3053\u308c\u304b\u3089\u3067\u3059\u3002",
  "paywall.benefitEpisodes": "\u5168 {count} \u8a71\u3092\u3059\u3050\u306b",
  "paywall.benefitAccess": "\u3053\u306e\u4f5c\u54c1\u306e\u914d\u4fe1\u304c\u7d9a\u304f\u9650\u308a\u3001Verza \u30a2\u30ab\u30a6\u30f3\u30c8\u3067\u8996\u8074\u3067\u304d\u307e\u3059",
  "paywall.oneTimeUnlock": "\u30b7\u30ea\u30fc\u30ba\u4e00\u62ec\u8cfc\u5165\uff08\u4e00\u56de\u9650\u308a\uff09",
  "paywall.cta": "\u30b7\u30ea\u30fc\u30ba\u3092\u30a2\u30f3\u30ed\u30c3\u30af \u2014 {price}\uff08\u4e00\u56de\u9650\u308a\uff09",
  "paywall.ctaLoading": "\u5b89\u5168\u306a\u6c7a\u6e08\u753b\u9762\u3092\u958b\u3044\u3066\u3044\u307e\u3059\u2026",
  "paywall.secure": "Stripe \u306b\u3088\u308b\u5b89\u5168\u306a\u6c7a\u6e08",
  "paywall.goBack": "\u623b\u308b",
  "checkout.errorStart": "\u6c7a\u6e08\u3092\u958b\u59cb\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\u3002\u3082\u3046\u4e00\u5ea6\u304a\u8a66\u3057\u304f\u3060\u3055\u3044\u3002",
  "checkout.errorNotOpened": "\u6c7a\u6e08\u753b\u9762\u304c\u958b\u304d\u307e\u305b\u3093\u3067\u3057\u305f\u3002\u3082\u3046\u4e00\u5ea6\u304a\u8a66\u3057\u304f\u3060\u3055\u3044\u3002",
  "checkout.errorNetwork": "\u30cd\u30c3\u30c8\u30ef\u30fc\u30af\u30a8\u30e9\u30fc\u3067\u3059\u3002\u63a5\u7d9a\u3092\u78ba\u8a8d\u3057\u3066\u3082\u3046\u4e00\u5ea6\u304a\u8a66\u3057\u304f\u3060\u3055\u3044\u3002",
  "checkout.errorAuth": "\u3053\u306e\u8cfc\u5165\u3092\u5b8c\u4e86\u3059\u308b\u306b\u306f\u30b5\u30a4\u30f3\u30a4\u30f3\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
  "checkout.errorNotPurchasable": "\u3053\u306e\u30b7\u30ea\u30fc\u30ba\u306f\u8ca9\u58f2\u3055\u308c\u3066\u3044\u307e\u305b\u3093\u3002",
  "checkout.errorEligibility": "\u8cfc\u5165\u8cc7\u683c\u3092\u78ba\u8a8d\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\u3002\u3082\u3046\u4e00\u5ea6\u304a\u8a66\u3057\u304f\u3060\u3055\u3044\u3002",
  "checkout.errorAccountDeletion": "\u30a2\u30ab\u30a6\u30f3\u30c8\u306e\u524a\u9664\u51e6\u7406\u4e2d\u3067\u3059\u3002",
  "checkout.errorPaymentReview": "\u4ee5\u524d\u306e\u304a\u652f\u6255\u3044\u3092\u78ba\u8a8d\u4e2d\u3067\u3059\u3002\u518d\u5ea6\u304a\u8a66\u3057\u306e\u524d\u306b\u30b5\u30dd\u30fc\u30c8\u3078\u3054\u9023\u7d61\u304f\u3060\u3055\u3044\u3002",
  "checkout.errorCheckoutUnusable": "\u4ee5\u524d\u306e\u6c7a\u6e08\u3092\u5b89\u5168\u306b\u518d\u5229\u7528\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\u3002\u30b5\u30dd\u30fc\u30c8\u3078\u3054\u9023\u7d61\u304f\u3060\u3055\u3044\u3002",
  "checkout.errorRefunded": "\u3053\u306e\u304a\u652f\u6255\u3044\u306f\u8fd4\u91d1\u307e\u305f\u306f\u7570\u8b70\u7533\u3057\u7acb\u3066\u6e08\u307f\u3067\u3059\u3002",
  "checkout.errorNotFound": "\u3053\u306e\u30b7\u30ea\u30fc\u30ba\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3002",
  "language.audio": "{language}\u97f3\u58f0",
  "language.audioSubs": "{language}\u97f3\u58f0 \u00b7 {subtitles}\u5b57\u5e55",
  "shorts.like": "\u3044\u3044\u306d", "shorts.liked": "\u3044\u3044\u306d\u6e08\u307f",
};

const ko: Translations = {
  "nav.discover": "\ubc1c\uacac", "nav.shorts": "\uc1fc\uce20", "nav.widescreen": "\uc640\uc774\ub4dc\uc2a4\ud06c\ub9b0",
  "nav.shop": "\uc1fc\ud551", "nav.library": "\ub77c\uc774\ube0c\ub7ec\ub9ac", "nav.profile": "\ud504\ub85c\ud544",
  "header.followUs": "\ud314\ub85c\uc6b0",
  "browse.startWatchingFree": "\ubb34\ub8cc\ub85c \uc2dc\uccad", "browse.trending": "\ud2b8\ub80c\ub4dc", "browse.episodes": "\uc5d0\ud53c\uc18c\ub4dc", "browse.allShows": "\ubaa8\ub4e0 \ud504\ub85c\uadf8\ub7a8",
  "tab.drama": "\ub4dc\ub77c\ub9c8", "tab.new": "\uc2e0\uaddc", "tab.popular": "Hot", "tab.music": "\uc74c\uc545", "tab.reality": "\ub9ac\uc5bc\ub9ac\ud2f0", "tab.redCarpet": "\ub808\ub4dc\uce74\ud3ab",
  "shorts.list": "\ub9ac\uc2a4\ud2b8", "shorts.saved": "\uc800\uc7a5\ub428", "shorts.share": "\uacf5\uc720", "shorts.copied": "\ubcf5\uc0ac\ub428!", "shorts.sound": "\uc18c\ub9ac", "shorts.soundOn": "\ucf1c\uae30", "shorts.soundOff": "\ub044\uae30",
  "horizontal.widescreen": "\uc640\uc774\ub4dc\uc2a4\ud06c\ub9b0", "horizontal.episodes": "\uc5d0\ud53c\uc18c\ub4dc", "horizontal.play": "\uc7ac\uc0dd", "horizontal.pause": "\uc77c\uc2dc\uc815\uc9c0",
  "profile.guest": "\uac8c\uc2a4\ud2b8", "profile.signIn": "\ub85c\uadf8\uc778", "profile.signInPrompt": "\ub77c\uc774\ube0c\ub7ec\ub9ac\ub97c \ub3d9\uae30\ud654\ud558\ub824\uba74 \ub85c\uadf8\uc778",
  "profile.coinBalance": "\ucf54\uc778 \uc794\uc561", "profile.coins": "\ucf54\uc778", "profile.buyCoins": "\ucf54\uc778 \uad6c\ub9e4",
  "profile.myList": "\ub0b4 \ub9ac\uc2a4\ud2b8", "profile.continueWatching": "\uc774\uc5b4\uc11c \ubcf4\uae30", "profile.purchaseHistory": "\uad6c\ub9e4 \ub0b4\uc5ed",
  "profile.language": "\uc5b8\uc5b4", "profile.notifications": "\uc54c\ub9bc", "profile.darkMode": "\ub2e4\ud06c \ubaa8\ub4dc",
  "profile.helpFaq": "\ub3c4\uc6c0\ub9d0 \ubc0f FAQ", "profile.sendFeedback": "\ud53c\ub4dc\ubc31 \ubcf4\ub0b4\uae30", "profile.reportProblem": "\ubb38\uc81c \uc2e0\uace0", "profile.signOut": "\ub85c\uadf8\uc544\uc6c3",
  "library.title": "\ub77c\uc774\ube0c\ub7ec\ub9ac", "library.channels": "\ucc44\ub110", "library.myList": "\ub0b4 \ub9ac\uc2a4\ud2b8",
  "library.noSavedShows": "\uc800\uc7a5\ub41c \ud504\ub85c\uadf8\ub7a8\uc774 \uc5c6\uc2b5\ub2c8\ub2e4", "library.browseShows": "\ud504\ub85c\uadf8\ub7a8 \ud0d0\uc0c9", "library.comingSoon": "\uacf5\uac1c \uc608\uc815", "library.shows": "\ud504\ub85c\uadf8\ub7a8",
  "auth.signInHeading": "VERZA TV\uc5d0 \ub85c\uadf8\uc778", "auth.signUpHeading": "\uacc4\uc815 \ub9cc\ub4e4\uae30",
  "auth.email": "\uc774\uba54\uc77c \uc8fc\uc18c", "auth.displayName": "\ud45c\uc2dc \uc774\ub984",
  "auth.continueWithEmail": "\uc774\uba54\uc77c\ub85c \uacc4\uc18d", "auth.continueWithGoogle": "Google\ub85c \uacc4\uc18d", "auth.continueWithApple": "Apple\ub85c \uacc4\uc18d",
  "auth.createAccount": "\uacc4\uc815 \ub9cc\ub4e4\uae30", "auth.continueAsGuest": "\uac8c\uc2a4\ud2b8\ub85c \uacc4\uc18d",
  "auth.noAccount": "\uacc4\uc815\uc774 \uc5c6\uc73c\uc2e0\uac00\uc694?", "auth.haveAccount": "\uc774\ubbf8 \uacc4\uc815\uc774 \uc788\uc73c\uc2e0\uac00\uc694?", "auth.signUp": "\ud68c\uc6d0\uac00\uc785",
  "legal.terms": "\uc774\uc6a9\uc57d\uad00", "legal.privacy": "\uac1c\uc778\uc815\ubcf4\ucc98\ub9ac\ubc29\uce68", "legal.refund": "\ud658\ubd88 \uc815\ucc45",
  "misc.free": "\ubb34\ub8cc", "misc.comingSoon": "\uacf5\uac1c \uc608\uc815", "misc.close": "\ub2eb\uae30",
  "content.synopsis": "\uc904\uac70\ub9ac", "content.episodes": "\uc5d0\ud53c\uc18c\ub4dc", "content.cast": "\ucd9c\uc5f0\uc9c4", "content.moreLikeThis": "\ube44\uc2b7\ud55c \uc791\ud488", "content.views": "\uc870\ud68c", "content.now": "\uc7ac\uc0dd\uc911", "content.info": "\uc815\ubcf4", "content.allEpisodes": "\uc804\uccb4 \uc5d0\ud53c\uc18c\ub4dc", "content.previous": "\uc774\uc804", "content.next": "\ub2e4\uc74c", "content.episodeOf": "\uc5d0\ud53c\uc18c\ub4dc {n}/{total}", "content.freeEpisodeOf": "무료 에피소드 {n}/{total}", "content.trending": "\ud2b8\ub80c\ub4dc", "content.watchFree": "\uc5d0\ud53c\uc18c\ub4dc 1 \ubb34\ub8cc \uc2dc\uccad", "content.unlockSeries": "\uc2dc\ub9ac\uc988 \uc7a0\uae08 \ud574\uc81c", "content.oneTimePayment": "\uc77c\ud68c\uc131 \uacb0\uc81c", "content.allEpisodesIncluded": "\ubaa8\ub4e0 \uc5d0\ud53c\uc18c\ub4dc \ud3ec\ud568", "content.episodeLocked": "\uc5d0\ud53c\uc18c\ub4dc {n}\uc740 \uc7a0\uaca8 \uc788\uc2b5\ub2c8\ub2e4", "content.unlockPrompt": "\ubb34\ub8cc \uc5d0\ud53c\uc18c\ub4dc \uc218\ub294 \uc791\ud488\ub9c8\ub2e4 \ub2e4\ub985\ub2c8\ub2e4. \uc804\uccb4 \uc2dc\ub9ac\uc988\ub97c \uc7a0\uae08 \ud574\uc81c\ud558\uc138\uc694.", "content.tryAgain": "\ub2e4\uc2dc \uc2dc\ub3c4",
  "paywall.unlockAll": "\uc804\uccb4 \uc5d0\ud53c\uc18c\ub4dc \uc7a0\uae08 \ud574\uc81c",
  "paywall.unavailableTitle": "\uc5d0\ud53c\uc18c\ub4dc\ub97c \ubcfc \uc218 \uc5c6\uc74c",
  "paywall.unavailableBody": "\uc774 \uc571\uc5d0\uc11c\ub294 \uc774 \uc5d0\ud53c\uc18c\ub4dc\ub97c \ubcfc \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.",
  "paywall.previewOver": "{title}\uc758 \ubb34\ub8cc \ubbf8\ub9ac\ubcf4\uae30\uac00 \ub05d\ub0ac\uc2b5\ub2c8\ub2e4. \uc774\uc57c\uae30\ub294 \uc9c0\uae08\ubd80\ud130\uc785\ub2c8\ub2e4.",
  "paywall.benefitEpisodes": "\uc804\uccb4 {count}\ud654\ub97c \ubc14\ub85c",
  "paywall.benefitAccess": "\uc774 \uc791\ud488\uc774 \uc11c\ube44\uc2a4\ub418\ub294 \ub3d9\uc548 Verza \uacc4\uc815\uc73c\ub85c \uc2dc\uccad",
  "paywall.oneTimeUnlock": "\uc2dc\ub9ac\uc988 1\ud68c \uad6c\ub9e4",
  "paywall.cta": "\uc2dc\ub9ac\uc988 \uc7a0\uae08 \ud574\uc81c \u2014 {price}, 1\ud68c \uacb0\uc81c",
  "paywall.ctaLoading": "\uc548\uc804\uacb0\uc81c \ucc3d\uc744 \uc5ec\ub294 \uc911\u2026",
  "paywall.secure": "Stripe\ub97c \ud1b5\ud55c \uc548\uc804\uacb0\uc81c",
  "paywall.goBack": "\ub4a4\ub85c",
  "checkout.errorStart": "\uacb0\uc81c\ub97c \uc2dc\uc791\ud558\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4. \ub2e4\uc2dc \uc2dc\ub3c4\ud574 \uc8fc\uc138\uc694.",
  "checkout.errorNotOpened": "\uacb0\uc81c \ucc3d\uc774 \uc5f4\ub9ac\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4. \ub2e4\uc2dc \uc2dc\ub3c4\ud574 \uc8fc\uc138\uc694.",
  "checkout.errorNetwork": "\ub124\ud2b8\uc6cc\ud06c \uc624\ub958\uc785\ub2c8\ub2e4. \uc5f0\uacb0\uc744 \ud655\uc778\ud558\uace0 \ub2e4\uc2dc \uc2dc\ub3c4\ud574 \uc8fc\uc138\uc694.",
  "checkout.errorAuth": "\uad6c\ub9e4\ub97c \ub9c8\uce58\ub824\uba74 \ub85c\uadf8\uc778\ud574 \uc8fc\uc138\uc694.",
  "checkout.errorNotPurchasable": "\uc774 \uc2dc\ub9ac\uc988\ub294 \ud310\ub9e4\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.",
  "checkout.errorEligibility": "\uad6c\ub9e4 \uc790\uaca9\uc744 \ud655\uc778\ud558\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4. \ub2e4\uc2dc \uc2dc\ub3c4\ud574 \uc8fc\uc138\uc694.",
  "checkout.errorAccountDeletion": "\uacc4\uc815 \uc0ad\uc81c\uac00 \uc9c4\ud589 \uc911\uc785\ub2c8\ub2e4.",
  "checkout.errorPaymentReview": "\uc774\uc804 \uacb0\uc81c\uac00 \uc544\uc9c1 \uac80\ud1a0 \uc911\uc785\ub2c8\ub2e4. \ub2e4\uc2dc \uc2dc\ub3c4\ud558\uae30 \uc804\uc5d0 \uace0\uac1d\uc13c\ud130\ub85c \ubb38\uc758\ud574 \uc8fc\uc138\uc694.",
  "checkout.errorCheckoutUnusable": "\uc774\uc804 \uacb0\uc81c\ub97c \uc548\uc804\ud558\uac8c \uc7ac\uc0ac\uc6a9\ud560 \uc218 \uc5c6\uc5c8\uc2b5\ub2c8\ub2e4. \uace0\uac1d\uc13c\ud130\ub85c \ubb38\uc758\ud574 \uc8fc\uc138\uc694.",
  "checkout.errorRefunded": "\uc774 \uacb0\uc81c\ub294 \ud658\ubd88\ub418\uc5c8\uac70\ub098 \uc774\uc758\uac00 \uc81c\uae30\ub418\uc5c8\uc2b5\ub2c8\ub2e4.",
  "checkout.errorNotFound": "\uc774 \uc2dc\ub9ac\uc988\ub97c \ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.",
  "language.audio": "{language} \uc74c\uc131",
  "language.audioSubs": "{language} \uc74c\uc131 \u00b7 {subtitles} \uc790\ub9c9",
  "shorts.like": "\uc88b\uc544\uc694", "shorts.liked": "\uc88b\uc544\uc694 \uc644\ub8cc",
};

const zh: Translations = {
  "nav.discover": "\u53d1\u73b0", "nav.shorts": "\u77ed\u5267", "nav.widescreen": "\u5bbd\u5c4f",
  "nav.shop": "\u5546\u5e97", "nav.library": "\u5a92\u4f53\u5e93", "nav.profile": "\u4e2a\u4eba",
  "header.followUs": "\u5173\u6ce8\u6211\u4eec",
  "browse.startWatchingFree": "\u514d\u8d39\u5f00\u59cb\u89c2\u770b", "browse.trending": "\u70ed\u95e8", "browse.episodes": "\u96c6", "browse.allShows": "\u6240\u6709\u5267\u96c6",
  "tab.drama": "\u5267\u60c5", "tab.new": "\u6700\u65b0", "tab.popular": "Hot", "tab.music": "\u97f3\u4e50", "tab.reality": "\u771f\u4eba\u79c0", "tab.redCarpet": "\u7ea2\u6bef",
  "shorts.list": "\u6536\u85cf", "shorts.saved": "\u5df2\u4fdd\u5b58", "shorts.share": "\u5206\u4eab", "shorts.copied": "\u5df2\u590d\u5236\uff01", "shorts.sound": "\u58f0\u97f3", "shorts.soundOn": "\u5f00", "shorts.soundOff": "\u5173",
  "horizontal.widescreen": "\u5bbd\u5c4f", "horizontal.episodes": "\u96c6", "horizontal.play": "\u64ad\u653e", "horizontal.pause": "\u6682\u505c",
  "profile.guest": "\u8bbf\u5ba2", "profile.signIn": "\u767b\u5f55", "profile.signInPrompt": "\u767b\u5f55\u4ee5\u540c\u6b65\u60a8\u7684\u5a92\u4f53\u5e93",
  "profile.coinBalance": "\u786c\u5e01\u4f59\u989d", "profile.coins": "\u786c\u5e01", "profile.buyCoins": "\u8d2d\u4e70\u786c\u5e01",
  "profile.myList": "\u6211\u7684\u5217\u8868", "profile.continueWatching": "\u7ee7\u7eed\u89c2\u770b", "profile.purchaseHistory": "\u8d2d\u4e70\u8bb0\u5f55",
  "profile.language": "\u8bed\u8a00", "profile.notifications": "\u901a\u77e5", "profile.darkMode": "\u6df1\u8272\u6a21\u5f0f",
  "profile.helpFaq": "\u5e2e\u52a9\u4e0e\u5e38\u89c1\u95ee\u9898", "profile.sendFeedback": "\u53d1\u9001\u53cd\u9988", "profile.reportProblem": "\u62a5\u544a\u95ee\u9898", "profile.signOut": "\u9000\u51fa\u767b\u5f55",
  "library.title": "\u5a92\u4f53\u5e93", "library.channels": "\u9891\u9053", "library.myList": "\u6211\u7684\u5217\u8868",
  "library.noSavedShows": "\u8fd8\u6ca1\u6709\u4fdd\u5b58\u7684\u5267\u96c6", "library.browseShows": "\u6d4f\u89c8\u5267\u96c6", "library.comingSoon": "\u5373\u5c06\u4e0a\u7ebf", "library.shows": "\u5267\u96c6",
  "auth.signInHeading": "\u767b\u5f55 VERZA TV", "auth.signUpHeading": "\u521b\u5efa\u60a8\u7684\u8d26\u6237",
  "auth.email": "\u7535\u5b50\u90ae\u7bb1", "auth.displayName": "\u663e\u793a\u540d\u79f0",
  "auth.continueWithEmail": "\u4f7f\u7528\u90ae\u7bb1\u7ee7\u7eed", "auth.continueWithGoogle": "\u4f7f\u7528 Google \u7ee7\u7eed", "auth.continueWithApple": "\u4f7f\u7528 Apple \u7ee7\u7eed",
  "auth.createAccount": "\u521b\u5efa\u8d26\u6237", "auth.continueAsGuest": "\u4ee5\u8bbf\u5ba2\u8eab\u4efd\u7ee7\u7eed",
  "auth.noAccount": "\u6ca1\u6709\u8d26\u6237\uff1f", "auth.haveAccount": "\u5df2\u6709\u8d26\u6237\uff1f", "auth.signUp": "\u6ce8\u518c",
  "legal.terms": "\u670d\u52a1\u6761\u6b3e", "legal.privacy": "\u9690\u79c1\u653f\u7b56", "legal.refund": "\u9000\u6b3e\u653f\u7b56",
  "misc.free": "\u514d\u8d39", "misc.comingSoon": "\u5373\u5c06\u4e0a\u7ebf", "misc.close": "\u5173\u95ed",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.freeEpisodeOf": "免费第 {n} 集，共 {total} 集", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "Free-preview availability varies by title. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
  "paywall.unlockAll": "\u89e3\u9501\u5168\u90e8\u5267\u96c6",
  "paywall.unavailableTitle": "\u672c\u96c6\u6682\u4e0d\u53ef\u770b",
  "paywall.unavailableBody": "\u672c\u5e94\u7528\u5185\u65e0\u6cd5\u89c2\u770b\u8fd9\u4e00\u96c6\u3002",
  "paywall.previewOver": "\u4f60\u521a\u770b\u5b8c\u300a{title}\u300b\u7684\u514d\u8d39\u8bd5\u770b\u3002\u522b\u505c\uff0c\u6545\u4e8b\u624d\u521a\u521a\u5f00\u59cb\u3002",
  "paywall.benefitEpisodes": "\u5168\u90e8 {count} \u96c6\uff0c\u7acb\u5373\u89c2\u770b",
  "paywall.benefitAccess": "\u53ea\u8981\u672c\u7247\u5728\u7ebf\uff0c\u5c31\u53ef\u4ee5\u7528 Verza \u8d26\u53f7\u89c2\u770b",
  "paywall.oneTimeUnlock": "\u6574\u5267\u89e3\u9501\uff0c\u4e00\u6b21\u6027\u4ed8\u8d39",
  "paywall.cta": "\u6574\u5267\u89e3\u9501 \u2014 {price}\uff0c\u4e00\u6b21\u6027\u4ed8\u8d39",
  "paywall.ctaLoading": "\u6b63\u5728\u6253\u5f00\u5b89\u5168\u652f\u4ed8\u2026",
  "paywall.secure": "\u7531 Stripe \u63d0\u4f9b\u5b89\u5168\u652f\u4ed8",
  "paywall.goBack": "\u8fd4\u56de",
  "checkout.errorStart": "\u65e0\u6cd5\u5f00\u59cb\u652f\u4ed8\uff0c\u8bf7\u91cd\u8bd5\u3002",
  "checkout.errorNotOpened": "\u652f\u4ed8\u9875\u9762\u672a\u80fd\u6253\u5f00\uff0c\u8bf7\u91cd\u8bd5\u3002",
  "checkout.errorNetwork": "\u7f51\u7edc\u9519\u8bef\u3002\u8bf7\u68c0\u67e5\u7f51\u7edc\u540e\u91cd\u8bd5\u3002",
  "checkout.errorAuth": "\u8bf7\u5148\u767b\u5f55\u4ee5\u5b8c\u6210\u672c\u6b21\u8d2d\u4e70\u3002",
  "checkout.errorNotPurchasable": "\u672c\u5267\u76ee\u524d\u4e0d\u5bf9\u5916\u9500\u552e\u3002",
  "checkout.errorEligibility": "\u65e0\u6cd5\u6838\u5b9e\u4f60\u7684\u8d2d\u4e70\u8d44\u683c\uff0c\u8bf7\u91cd\u8bd5\u3002",
  "checkout.errorAccountDeletion": "\u8d26\u53f7\u6b63\u5728\u5220\u9664\u4e2d\u3002",
  "checkout.errorPaymentReview": "\u5148\u524d\u7684\u4e00\u7b14\u4ed8\u6b3e\u4ecd\u5728\u5ba1\u6838\u3002\u91cd\u8bd5\u524d\u8bf7\u8054\u7cfb\u5ba2\u670d\u3002",
  "checkout.errorCheckoutUnusable": "\u65e0\u6cd5\u5b89\u5168\u5730\u590d\u7528\u5148\u524d\u7684\u652f\u4ed8\uff0c\u8bf7\u8054\u7cfb\u5ba2\u670d\u3002",
  "checkout.errorRefunded": "\u8be5\u7b14\u4ed8\u6b3e\u5df2\u9000\u6b3e\u6216\u88ab\u4e89\u8bae\u3002",
  "checkout.errorNotFound": "\u627e\u4e0d\u5230\u8fd9\u90e8\u5267\u3002",
  "language.audio": "{language}\u914d\u97f3",
  "language.audioSubs": "{language}\u914d\u97f3 \u00b7 {subtitles}\u5b57\u5e55",
  "shorts.like": "\u70b9\u8d5e", "shorts.liked": "\u5df2\u70b9\u8d5e",
};

const hi: Translations = {
  "nav.discover": "\u0916\u094b\u091c\u0947\u0902", "nav.shorts": "\u0936\u0949\u0930\u094d\u091f\u094d\u0938", "nav.widescreen": "\u0935\u093e\u0907\u0921\u0938\u094d\u0915\u094d\u0930\u0940\u0928",
  "nav.shop": "\u0926\u0941\u0915\u093e\u0928", "nav.library": "\u0932\u093e\u0907\u092c\u094d\u0930\u0947\u0930\u0940", "nav.profile": "\u092a\u094d\u0930\u094b\u095e\u093e\u0907\u0932",
  "header.followUs": "\u0939\u092e\u0947\u0902 \u095e\u0949\u0932\u094b \u0915\u0930\u0947\u0902",
  "browse.startWatchingFree": "\u092e\u0941\u095e\u094d\u0924 \u092e\u0947\u0902 \u0926\u0947\u0916\u0947\u0902", "browse.trending": "\u091f\u094d\u0930\u0947\u0902\u0921\u093f\u0902\u0917", "browse.episodes": "\u090f\u092a\u093f\u0938\u094b\u0921", "browse.allShows": "\u0938\u092d\u0940 \u0936\u094b",
  "tab.drama": "\u0921\u094d\u0930\u093e\u092e\u093e", "tab.new": "\u0928\u092f\u093e", "tab.popular": "Hot", "tab.music": "\u0938\u0902\u0917\u0940\u0924", "tab.reality": "\u0930\u093f\u092f\u0932\u093f\u091f\u0940", "tab.redCarpet": "\u0930\u0947\u0921 \u0915\u093e\u0930\u094d\u092a\u0947\u091f",
  "shorts.list": "\u0938\u0942\u091a\u0940", "shorts.saved": "\u0938\u0947\u0935 \u0915\u093f\u092f\u093e", "shorts.share": "\u0936\u0947\u092f\u0930", "shorts.copied": "\u0915\u0949\u092a\u0940 \u0939\u094b \u0917\u092f\u093e!", "shorts.sound": "\u0927\u094d\u0935\u0928\u093f", "shorts.soundOn": "\u091a\u093e\u0932\u0942", "shorts.soundOff": "\u092c\u0902\u0926",
  "horizontal.widescreen": "\u0935\u093e\u0907\u0921\u0938\u094d\u0915\u094d\u0930\u0940\u0928", "horizontal.episodes": "\u090f\u092a\u093f\u0938\u094b\u0921", "horizontal.play": "\u091a\u0932\u093e\u090f\u0902", "horizontal.pause": "\u0930\u094b\u0915\u0947\u0902",
  "profile.guest": "\u0905\u0924\u093f\u0925\u093f", "profile.signIn": "\u0938\u093e\u0907\u0928 \u0907\u0928", "profile.signInPrompt": "\u0932\u093e\u0907\u092c\u094d\u0930\u0947\u0930\u0940 \u0938\u093f\u0902\u0915 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f \u0938\u093e\u0907\u0928 \u0907\u0928 \u0915\u0930\u0947\u0902",
  "profile.coinBalance": "\u0938\u093f\u0915\u094d\u0915\u093e \u0936\u0947\u0937", "profile.coins": "\u0938\u093f\u0915\u094d\u0915\u0947", "profile.buyCoins": "\u0938\u093f\u0915\u094d\u0915\u0947 \u0916\u0930\u0940\u0926\u0947\u0902",
  "profile.myList": "\u092e\u0947\u0930\u0940 \u0938\u0942\u091a\u0940", "profile.continueWatching": "\u0926\u0947\u0916\u0928\u093e \u091c\u093e\u0930\u0940 \u0930\u0916\u0947\u0902", "profile.purchaseHistory": "\u0916\u0930\u0940\u0926 \u0907\u0924\u093f\u0939\u093e\u0938",
  "profile.language": "\u092d\u093e\u0937\u093e", "profile.notifications": "\u0938\u0942\u091a\u0928\u093e\u090f\u0902", "profile.darkMode": "\u0921\u093e\u0930\u094d\u0915 \u092e\u094b\u0921",
  "profile.helpFaq": "\u0938\u0939\u093e\u092f\u0924\u093e \u0914\u0930 FAQ", "profile.sendFeedback": "\u092a\u094d\u0930\u0924\u093f\u0915\u094d\u0930\u093f\u092f\u093e \u092d\u0947\u091c\u0947\u0902", "profile.reportProblem": "\u0938\u092e\u0938\u094d\u092f\u093e \u0930\u093f\u092a\u094b\u0930\u094d\u091f \u0915\u0930\u0947\u0902", "profile.signOut": "\u0938\u093e\u0907\u0928 \u0906\u0909\u091f",
  "library.title": "\u0932\u093e\u0907\u092c\u094d\u0930\u0947\u0930\u0940", "library.channels": "\u091a\u0948\u0928\u0932", "library.myList": "\u092e\u0947\u0930\u0940 \u0938\u0942\u091a\u0940",
  "library.noSavedShows": "\u0915\u094b\u0908 \u0938\u0947\u0935 \u0915\u093f\u092f\u093e \u0936\u094b \u0928\u0939\u0940\u0902", "library.browseShows": "\u0936\u094b \u092c\u094d\u0930\u093e\u0909\u095b \u0915\u0930\u0947\u0902", "library.comingSoon": "\u091c\u0932\u094d\u0926 \u0906 \u0930\u0939\u093e \u0939\u0948", "library.shows": "\u0936\u094b",
  "auth.signInHeading": "VERZA TV \u092e\u0947\u0902 \u0938\u093e\u0907\u0928 \u0907\u0928 \u0915\u0930\u0947\u0902", "auth.signUpHeading": "\u0905\u092a\u0928\u093e \u0916\u093e\u0924\u093e \u092c\u0928\u093e\u090f\u0902",
  "auth.email": "\u0908\u092e\u0947\u0932 \u092a\u0924\u093e", "auth.displayName": "\u092a\u094d\u0930\u0926\u0930\u094d\u0936\u0928 \u0928\u093e\u092e",
  "auth.continueWithEmail": "\u0908\u092e\u0947\u0932 \u0938\u0947 \u091c\u093e\u0930\u0940 \u0930\u0916\u0947\u0902", "auth.continueWithGoogle": "Google \u0938\u0947 \u091c\u093e\u0930\u0940 \u0930\u0916\u0947\u0902", "auth.continueWithApple": "Apple \u0938\u0947 \u091c\u093e\u0930\u0940 \u0930\u0916\u0947\u0902",
  "auth.createAccount": "\u0916\u093e\u0924\u093e \u092c\u0928\u093e\u090f\u0902", "auth.continueAsGuest": "\u0905\u0924\u093f\u0925\u093f \u0915\u0947 \u0930\u0942\u092a \u092e\u0947\u0902 \u091c\u093e\u0930\u0940 \u0930\u0916\u0947\u0902",
  "auth.noAccount": "\u0916\u093e\u0924\u093e \u0928\u0939\u0940\u0902 \u0939\u0948?", "auth.haveAccount": "\u092a\u0939\u0932\u0947 \u0938\u0947 \u0916\u093e\u0924\u093e \u0939\u0948?", "auth.signUp": "\u0938\u093e\u0907\u0928 \u0905\u092a",
  "legal.terms": "\u0938\u0947\u0935\u093e \u0915\u0940 \u0936\u0930\u094d\u0924\u0947\u0902", "legal.privacy": "\u0917\u094b\u092a\u0928\u0940\u092f\u0924\u093e \u0928\u0940\u0924\u093f", "legal.refund": "\u0930\u093f\u095e\u0902\u0921 \u0928\u0940\u0924\u093f",
  "misc.free": "\u092e\u0941\u095e\u094d\u0924", "misc.comingSoon": "\u091c\u0932\u094d\u0926 \u0906 \u0930\u0939\u093e \u0939\u0948", "misc.close": "\u092c\u0902\u0926 \u0915\u0930\u0947\u0902",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.freeEpisodeOf": "मुफ़्त एपिसोड {n} / {total}", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "Free-preview availability varies by title. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
  "paywall.unlockAll": "\u0938\u092d\u0940 \u090f\u092a\u093f\u0938\u094b\u0921 \u0905\u0928\u0932\u0949\u0915 \u0915\u0930\u0947\u0902",
  "paywall.unavailableTitle": "\u090f\u092a\u093f\u0938\u094b\u0921 \u0909\u092a\u0932\u092c\u094d\u0927 \u0928\u0939\u0940\u0902",
  "paywall.unavailableBody": "\u092f\u0939 \u090f\u092a\u093f\u0938\u094b\u0921 \u0907\u0938 \u0910\u092a \u092e\u0947\u0902 \u0909\u092a\u0932\u092c\u094d\u0927 \u0928\u0939\u0940\u0902 \u0939\u0948\u0964",
  "paywall.previewOver": "\u0906\u092a\u0928\u0947 \u0905\u092d\u0940 {title} \u0915\u093e \u092e\u0941\u092b\u094d\u0924 \u092a\u094d\u0930\u0940\u0935\u094d\u092f\u0942 \u0926\u0947\u0916\u093e\u0964 \u0905\u092c \u0930\u0941\u0915\u093f\u090f \u092e\u0924 \u2014 \u0915\u0939\u093e\u0928\u0940 \u0905\u092d\u0940 \u0936\u0941\u0930\u0942 \u0939\u0941\u0908 \u0939\u0948\u0964",
  "paywall.benefitEpisodes": "\u0938\u092d\u0940 {count} \u090f\u092a\u093f\u0938\u094b\u0921, \u0924\u0941\u0930\u0902\u0924",
  "paywall.benefitAccess": "\u091c\u092c \u0924\u0915 \u092f\u0939 \u091f\u093e\u0907\u091f\u0932 \u0909\u092a\u0932\u092c\u094d\u0927 \u0939\u0948, \u0905\u092a\u0928\u0947 Verza \u0916\u093e\u0924\u0947 \u0938\u0947 \u0926\u0947\u0916\u0947\u0902",
  "paywall.oneTimeUnlock": "\u090f\u0915\u092c\u093e\u0930\u0917\u0940 \u0938\u0940\u0930\u0940\u091c\u093c \u0905\u0928\u0932\u0949\u0915",
  "paywall.cta": "\u0938\u0940\u0930\u0940\u091c\u093c \u0905\u0928\u0932\u0949\u0915 \u2014 {price}, \u090f\u0915 \u092c\u093e\u0930",
  "paywall.ctaLoading": "\u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924 \u091a\u0947\u0915\u0906\u0909\u091f \u0916\u094b\u0932 \u0930\u0939\u0947 \u0939\u0948\u0902\u2026",
  "paywall.secure": "Stripe \u0915\u0947 \u091c\u093c\u0930\u093f\u090f \u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924 \u092d\u0941\u0917\u0924\u093e\u0928",
  "paywall.goBack": "\u0935\u093e\u092a\u0938 \u091c\u093e\u090f\u0902",
  "checkout.errorStart": "\u091a\u0947\u0915\u0906\u0909\u091f \u0936\u0941\u0930\u0942 \u0928\u0939\u0940\u0902 \u0939\u094b \u0938\u0915\u093e\u0964 \u0915\u0943\u092a\u092f\u093e \u092b\u093f\u0930 \u0915\u094b\u0936\u093f\u0936 \u0915\u0930\u0947\u0902\u0964",
  "checkout.errorNotOpened": "\u091a\u0947\u0915\u0906\u0909\u091f \u0928\u0939\u0940\u0902 \u0916\u0941\u0932\u093e\u0964 \u0915\u0943\u092a\u092f\u093e \u092b\u093f\u0930 \u0915\u094b\u0936\u093f\u0936 \u0915\u0930\u0947\u0902\u0964",
  "checkout.errorNetwork": "\u0928\u0947\u091f\u0935\u0930\u094d\u0915 \u0924\u094d\u0930\u0941\u091f\u093f\u0964 \u0905\u092a\u0928\u093e \u0915\u0928\u0947\u0915\u094d\u0936\u0928 \u091c\u093e\u0902\u091a\u0915\u0930 \u092b\u093f\u0930 \u0915\u094b\u0936\u093f\u0936 \u0915\u0930\u0947\u0902\u0964",
  "checkout.errorAuth": "\u092f\u0939 \u0916\u0930\u0940\u0926 \u092a\u0942\u0930\u0940 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f \u0938\u093e\u0907\u0928 \u0907\u0928 \u0915\u0930\u0947\u0902\u0964",
  "checkout.errorNotPurchasable": "\u092f\u0939 \u0938\u0940\u0930\u0940\u091c\u093c \u092c\u093f\u0915\u094d\u0930\u0940 \u0915\u0947 \u0932\u093f\u090f \u0909\u092a\u0932\u092c\u094d\u0927 \u0928\u0939\u0940\u0902 \u0939\u0948\u0964",
  "checkout.errorEligibility": "\u0939\u092e \u0906\u092a\u0915\u0940 \u0916\u0930\u0940\u0926 \u092a\u093e\u0924\u094d\u0930\u0924\u093e \u0915\u0940 \u091c\u093e\u0902\u091a \u0928\u0939\u0940\u0902 \u0915\u0930 \u0938\u0915\u0947\u0964 \u0915\u0943\u092a\u092f\u093e \u092b\u093f\u0930 \u0915\u094b\u0936\u093f\u0936 \u0915\u0930\u0947\u0902\u0964",
  "checkout.errorAccountDeletion": "\u0916\u093e\u0924\u093e \u0939\u091f\u093e\u0928\u0947 \u0915\u0940 \u092a\u094d\u0930\u0915\u094d\u0930\u093f\u092f\u093e \u091a\u0932 \u0930\u0939\u0940 \u0939\u0948\u0964",
  "checkout.errorPaymentReview": "\u092a\u093f\u091b\u0932\u093e \u092d\u0941\u0917\u0924\u093e\u0928 \u0905\u092d\u0940 \u091c\u093e\u0902\u091a \u092e\u0947\u0902 \u0939\u0948\u0964 \u0926\u094b\u092c\u093e\u0930\u093e \u0915\u094b\u0936\u093f\u0936 \u0915\u0930\u0928\u0947 \u0938\u0947 \u092a\u0939\u0932\u0947 \u0938\u092a\u094b\u0930\u094d\u091f \u0938\u0947 \u0938\u0902\u092a\u0930\u094d\u0915 \u0915\u0930\u0947\u0902\u0964",
  "checkout.errorCheckoutUnusable": "\u092a\u093f\u091b\u0932\u0947 \u091a\u0947\u0915\u0906\u0909\u091f \u0915\u094b \u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924 \u0922\u0902\u0917 \u0938\u0947 \u0926\u094b\u092c\u093e\u0930\u093e \u0907\u0938\u094d\u0924\u0947\u092e\u093e\u0932 \u0928\u0939\u0940\u0902 \u0915\u093f\u092f\u093e \u091c\u093e \u0938\u0915\u093e\u0964 \u0938\u092a\u094b\u0930\u094d\u091f \u0938\u0947 \u0938\u0902\u092a\u0930\u094d\u0915 \u0915\u0930\u0947\u0902\u0964",
  "checkout.errorRefunded": "\u092f\u0939 \u092d\u0941\u0917\u0924\u093e\u0928 \u0935\u093e\u092a\u0938 \u0915\u093f\u092f\u093e \u0917\u092f\u093e \u092f\u093e \u0935\u093f\u0935\u093e\u0926\u093f\u0924 \u0939\u0948\u0964",
  "checkout.errorNotFound": "\u092f\u0939 \u0938\u0940\u0930\u0940\u091c\u093c \u0928\u0939\u0940\u0902 \u092e\u093f\u0932\u0940\u0964",
  "language.audio": "{language} \u0911\u0921\u093f\u092f\u094b",
  "language.audioSubs": "{language} \u0911\u0921\u093f\u092f\u094b \u00b7 {subtitles} \u0938\u092c\u091f\u093e\u0907\u091f\u0932",
  "shorts.like": "\u092a\u0938\u0902\u0926", "shorts.liked": "\u092a\u0938\u0902\u0926 \u0915\u093f\u092f\u093e",
};

const ar: Translations = {
  "nav.discover": "\u0627\u0643\u062a\u0634\u0641", "nav.shorts": "\u0645\u0642\u0627\u0637\u0639", "nav.widescreen": "\u0634\u0627\u0634\u0629 \u0639\u0631\u064a\u0636\u0629",
  "nav.shop": "\u0645\u062a\u062c\u0631", "nav.library": "\u0645\u0643\u062a\u0628\u0629", "nav.profile": "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062e\u0635\u064a",
  "header.followUs": "\u062a\u0627\u0628\u0639\u0648\u0646\u0627",
  "browse.startWatchingFree": "\u0627\u0628\u062f\u0623 \u0627\u0644\u0645\u0634\u0627\u0647\u062f\u0629 \u0645\u062c\u0627\u0646\u064b\u0627", "browse.trending": "\u0631\u0627\u0626\u062c", "browse.episodes": "\u062d\u0644\u0642\u0627\u062a", "browse.allShows": "\u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0633\u0644\u0633\u0644\u0627\u062a",
  "tab.drama": "\u062f\u0631\u0627\u0645\u0627", "tab.new": "\u062c\u062f\u064a\u062f", "tab.popular": "Hot", "tab.music": "\u0645\u0648\u0633\u064a\u0642\u0649", "tab.reality": "\u0648\u0627\u0642\u0639\u064a", "tab.redCarpet": "\u0627\u0644\u0633\u062c\u0627\u062f\u0629 \u0627\u0644\u062d\u0645\u0631\u0627\u0621",
  "shorts.list": "\u0642\u0627\u0626\u0645\u0629", "shorts.saved": "\u0645\u062d\u0641\u0648\u0638", "shorts.share": "\u0645\u0634\u0627\u0631\u0643\u0629", "shorts.copied": "\u062a\u0645 \u0627\u0644\u0646\u0633\u062e!", "shorts.sound": "\u0627\u0644\u0635\u0648\u062a", "shorts.soundOn": "\u062a\u0634\u063a\u064a\u0644", "shorts.soundOff": "\u0625\u064a\u0642\u0627\u0641",
  "horizontal.widescreen": "\u0634\u0627\u0634\u0629 \u0639\u0631\u064a\u0636\u0629", "horizontal.episodes": "\u062d\u0644\u0642\u0627\u062a", "horizontal.play": "\u062a\u0634\u063a\u064a\u0644", "horizontal.pause": "\u0625\u064a\u0642\u0627\u0641 \u0645\u0624\u0642\u062a",
  "profile.guest": "\u0632\u0627\u0626\u0631", "profile.signIn": "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644", "profile.signInPrompt": "\u0633\u062c\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0644\u0645\u0632\u0627\u0645\u0646\u0629 \u0645\u0643\u062a\u0628\u062a\u0643",
  "profile.coinBalance": "\u0631\u0635\u064a\u062f \u0627\u0644\u0639\u0645\u0644\u0627\u062a", "profile.coins": "\u0639\u0645\u0644\u0627\u062a", "profile.buyCoins": "\u0634\u0631\u0627\u0621 \u0639\u0645\u0644\u0627\u062a",
  "profile.myList": "\u0642\u0627\u0626\u0645\u062a\u064a", "profile.continueWatching": "\u0645\u062a\u0627\u0628\u0639\u0629 \u0627\u0644\u0645\u0634\u0627\u0647\u062f\u0629", "profile.purchaseHistory": "\u0633\u062c\u0644 \u0627\u0644\u0645\u0634\u062a\u0631\u064a\u0627\u062a",
  "profile.language": "\u0627\u0644\u0644\u063a\u0629", "profile.notifications": "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062a", "profile.darkMode": "\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u062f\u0627\u0643\u0646",
  "profile.helpFaq": "\u0627\u0644\u0645\u0633\u0627\u0639\u062f\u0629 \u0648\u0627\u0644\u0623\u0633\u0626\u0644\u0629", "profile.sendFeedback": "\u0625\u0631\u0633\u0627\u0644 \u0645\u0644\u0627\u062d\u0638\u0627\u062a", "profile.reportProblem": "\u0627\u0644\u0625\u0628\u0644\u0627\u063a \u0639\u0646 \u0645\u0634\u0643\u0644\u0629", "profile.signOut": "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c",
  "library.title": "\u0627\u0644\u0645\u0643\u062a\u0628\u0629", "library.channels": "\u0627\u0644\u0642\u0646\u0648\u0627\u062a", "library.myList": "\u0642\u0627\u0626\u0645\u062a\u064a",
  "library.noSavedShows": "\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0633\u0644\u0633\u0644\u0627\u062a \u0645\u062d\u0641\u0648\u0638\u0629", "library.browseShows": "\u062a\u0635\u0641\u062d \u0627\u0644\u0645\u0633\u0644\u0633\u0644\u0627\u062a", "library.comingSoon": "\u0642\u0631\u064a\u0628\u064b\u0627", "library.shows": "\u0645\u0633\u0644\u0633\u0644\u0627\u062a",
  "auth.signInHeading": "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0625\u0644\u0649 VERZA TV", "auth.signUpHeading": "\u0623\u0646\u0634\u0626 \u062d\u0633\u0627\u0628\u0643",
  "auth.email": "\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a", "auth.displayName": "\u0627\u0633\u0645 \u0627\u0644\u0639\u0631\u0636",
  "auth.continueWithEmail": "\u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0629 \u0628\u0627\u0644\u0628\u0631\u064a\u062f", "auth.continueWithGoogle": "\u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0629 \u0628\u0640 Google", "auth.continueWithApple": "\u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0629 \u0628\u0640 Apple",
  "auth.createAccount": "\u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628", "auth.continueAsGuest": "\u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0629 \u0643\u0632\u0627\u0626\u0631",
  "auth.noAccount": "\u0644\u064a\u0633 \u0644\u062f\u064a\u0643 \u062d\u0633\u0627\u0628\u061f", "auth.haveAccount": "\u0644\u062f\u064a\u0643 \u062d\u0633\u0627\u0628 \u0628\u0627\u0644\u0641\u0639\u0644\u061f", "auth.signUp": "\u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628",
  "legal.terms": "\u0634\u0631\u0648\u0637 \u0627\u0644\u062e\u062f\u0645\u0629", "legal.privacy": "\u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u062e\u0635\u0648\u0635\u064a\u0629", "legal.refund": "\u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u0627\u0633\u062a\u0631\u062f\u0627\u062f",
  "misc.free": "\u0645\u062c\u0627\u0646\u064a", "misc.comingSoon": "\u0642\u0631\u064a\u0628\u064b\u0627", "misc.close": "\u0625\u063a\u0644\u0627\u0642",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.freeEpisodeOf": "الحلقة المجانية {n} من {total}", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "Free-preview availability varies by title. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
  "paywall.unlockAll": "\u0641\u062a\u062d \u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0644\u0642\u0627\u062a",
  "paywall.unavailableTitle": "\u0627\u0644\u062d\u0644\u0642\u0629 \u063a\u064a\u0631 \u0645\u062a\u0627\u062d\u0629",
  "paywall.unavailableBody": "\u0647\u0630\u0647 \u0627\u0644\u062d\u0644\u0642\u0629 \u063a\u064a\u0631 \u0645\u062a\u0627\u062d\u0629 \u0641\u064a \u0647\u0630\u0627 \u0627\u0644\u062a\u0637\u0628\u064a\u0642.",
  "paywall.previewOver": "\u0644\u0642\u062f \u0634\u0627\u0647\u062f\u062a \u0627\u0644\u0645\u0639\u0627\u064a\u0646\u0629 \u0627\u0644\u0645\u062c\u0627\u0646\u064a\u0629 \u0645\u0646 {title}. \u0644\u0627 \u062a\u062a\u0648\u0642\u0641 \u0627\u0644\u0622\u0646 \u2014 \u0627\u0644\u0642\u0635\u0629 \u062a\u0628\u062f\u0623 \u0644\u0644\u062a\u0648.",
  "paywall.benefitEpisodes": "\u0643\u0644 \u0627\u0644\u062d\u0644\u0642\u0627\u062a \u0627\u0644\u0640 {count}\u060c \u0641\u0648\u0631\u064b\u0627",
  "paywall.benefitAccess": "\u0627\u0644\u0645\u0634\u0627\u0647\u062f\u0629 \u0639\u0628\u0631 \u062d\u0633\u0627\u0628\u0643 \u0641\u064a Verza \u0645\u0627 \u062f\u0627\u0645 \u0647\u0630\u0627 \u0627\u0644\u0639\u0645\u0644 \u0645\u062a\u0627\u062d\u064b\u0627",
  "paywall.oneTimeUnlock": "\u0634\u0631\u0627\u0621 \u0627\u0644\u0645\u0633\u0644\u0633\u0644 \u0645\u0631\u0629 \u0648\u0627\u062d\u062f\u0629",
  "paywall.cta": "\u0641\u062a\u062d \u0627\u0644\u0645\u0633\u0644\u0633\u0644 \u2014 {price}\u060c \u062f\u0641\u0639\u0629 \u0648\u0627\u062d\u062f\u0629",
  "paywall.ctaLoading": "\u062c\u0627\u0631\u064d \u0641\u062a\u062d \u0627\u0644\u062f\u0641\u0639 \u0627\u0644\u0622\u0645\u0646\u2026",
  "paywall.secure": "\u062f\u0641\u0639 \u0622\u0645\u0646 \u0639\u0628\u0631 Stripe",
  "paywall.goBack": "\u0631\u062c\u0648\u0639",
  "checkout.errorStart": "\u062a\u0639\u0630\u0631 \u0628\u062f\u0621 \u0639\u0645\u0644\u064a\u0629 \u0627\u0644\u062f\u0641\u0639. \u064a\u0631\u062c\u0649 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0645\u062c\u062f\u062f\u064b\u0627.",
  "checkout.errorNotOpened": "\u0644\u0645 \u062a\u064f\u0641\u062a\u062d \u0635\u0641\u062d\u0629 \u0627\u0644\u062f\u0641\u0639. \u064a\u0631\u062c\u0649 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0645\u062c\u062f\u062f\u064b\u0627.",
  "checkout.errorNetwork": "\u062e\u0637\u0623 \u0641\u064a \u0627\u0644\u0634\u0628\u0643\u0629. \u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u062a\u0635\u0627\u0644\u0643 \u0648\u0623\u0639\u062f \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629.",
  "checkout.errorAuth": "\u0633\u062c\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0644\u0625\u062a\u0645\u0627\u0645 \u0639\u0645\u0644\u064a\u0629 \u0627\u0644\u0634\u0631\u0627\u0621.",
  "checkout.errorNotPurchasable": "\u0647\u0630\u0627 \u0627\u0644\u0645\u0633\u0644\u0633\u0644 \u063a\u064a\u0631 \u0645\u0639\u0631\u0648\u0636 \u0644\u0644\u0628\u064a\u0639.",
  "checkout.errorEligibility": "\u062a\u0639\u0630\u0631 \u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0623\u0647\u0644\u064a\u062a\u0643 \u0644\u0644\u0634\u0631\u0627\u0621. \u064a\u0631\u062c\u0649 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0645\u062c\u062f\u062f\u064b\u0627.",
  "checkout.errorAccountDeletion": "\u062c\u0627\u0631\u064d \u062d\u0630\u0641 \u0627\u0644\u062d\u0633\u0627\u0628.",
  "checkout.errorPaymentReview": "\u0644\u0627 \u062a\u0632\u0627\u0644 \u062f\u0641\u0639\u0629 \u0633\u0627\u0628\u0642\u0629 \u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629. \u062a\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u062f\u0639\u0645 \u0642\u0628\u0644 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629.",
  "checkout.errorCheckoutUnusable": "\u062a\u0639\u0630\u0631 \u0625\u0639\u0627\u062f\u0629 \u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0639\u0645\u0644\u064a\u0629 \u062f\u0641\u0639 \u0633\u0627\u0628\u0642\u0629 \u0628\u0623\u0645\u0627\u0646. \u062a\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u062f\u0639\u0645.",
  "checkout.errorRefunded": "\u062a\u0645 \u0627\u0633\u062a\u0631\u062f\u0627\u062f \u0647\u0630\u0647 \u0627\u0644\u062f\u0641\u0639\u0629 \u0623\u0648 \u0627\u0644\u0627\u0639\u062a\u0631\u0627\u0636 \u0639\u0644\u064a\u0647\u0627.",
  "checkout.errorNotFound": "\u062a\u0639\u0630\u0631 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u0645\u0633\u0644\u0633\u0644.",
  "language.audio": "\u0627\u0644\u0635\u0648\u062a \u0628\u0627\u0644{language}",
  "language.audioSubs": "\u0627\u0644\u0635\u0648\u062a \u0628\u0627\u0644{language} \u00b7 \u062a\u0631\u062c\u0645\u0629 \u0628\u0627\u0644{subtitles}",
  "shorts.like": "\u0625\u0639\u062c\u0627\u0628", "shorts.liked": "\u0623\u0639\u062c\u0628\u0646\u064a",
};

const ru: Translations = {
  "nav.discover": "\u0413\u043b\u0430\u0432\u043d\u0430\u044f", "nav.shorts": "\u0428\u043e\u0440\u0442\u0441", "nav.widescreen": "\u0428\u0438\u0440\u043e\u043a\u0438\u0439 \u044d\u043a\u0440\u0430\u043d",
  "nav.shop": "\u041c\u0430\u0433\u0430\u0437\u0438\u043d", "nav.library": "\u0411\u0438\u0431\u043b\u0438\u043e\u0442\u0435\u043a\u0430", "nav.profile": "\u041f\u0440\u043e\u0444\u0438\u043b\u044c",
  "header.followUs": "\u041f\u043e\u0434\u043f\u0438\u0448\u0438\u0442\u0435\u0441\u044c",
  "browse.startWatchingFree": "\u0421\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e", "browse.trending": "\u0412 \u0442\u0440\u0435\u043d\u0434\u0435", "browse.episodes": "\u0441\u0435\u0440\u0438\u0439", "browse.allShows": "\u0412\u0441\u0435 \u0441\u0435\u0440\u0438\u0430\u043b\u044b",
  "tab.drama": "\u0414\u0440\u0430\u043c\u0430", "tab.new": "\u041d\u043e\u0432\u043e\u0435", "tab.popular": "Hot", "tab.music": "\u041c\u0443\u0437\u044b\u043a\u0430", "tab.reality": "\u0420\u0435\u0430\u043b\u0438\u0442\u0438", "tab.redCarpet": "\u041a\u0440\u0430\u0441\u043d\u0430\u044f \u0434\u043e\u0440\u043e\u0436\u043a\u0430",
  "shorts.list": "\u0421\u043f\u0438\u0441\u043e\u043a", "shorts.saved": "\u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u043e", "shorts.share": "\u041f\u043e\u0434\u0435\u043b\u0438\u0442\u044c\u0441\u044f", "shorts.copied": "\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u043e!", "shorts.sound": "\u0417\u0432\u0443\u043a", "shorts.soundOn": "\u0412\u043a\u043b", "shorts.soundOff": "\u0412\u044b\u043a\u043b",
  "horizontal.widescreen": "\u0428\u0438\u0440\u043e\u043a\u0438\u0439 \u044d\u043a\u0440\u0430\u043d", "horizontal.episodes": "\u0441\u0435\u0440\u0438\u0439", "horizontal.play": "\u0412\u043e\u0441\u043f\u0440\u043e\u0438\u0437\u0432\u0435\u0441\u0442\u0438", "horizontal.pause": "\u041f\u0430\u0443\u0437\u0430",
  "profile.guest": "\u0413\u043e\u0441\u0442\u044c", "profile.signIn": "\u0412\u043e\u0439\u0442\u0438", "profile.signInPrompt": "\u0412\u043e\u0439\u0434\u0438\u0442\u0435 \u0434\u043b\u044f \u0441\u0438\u043d\u0445\u0440\u043e\u043d\u0438\u0437\u0430\u0446\u0438\u0438 \u0431\u0438\u0431\u043b\u0438\u043e\u0442\u0435\u043a\u0438",
  "profile.coinBalance": "\u0411\u0430\u043b\u0430\u043d\u0441", "profile.coins": "\u043c\u043e\u043d\u0435\u0442", "profile.buyCoins": "\u041a\u0443\u043f\u0438\u0442\u044c \u043c\u043e\u043d\u0435\u0442\u044b",
  "profile.myList": "\u041c\u043e\u0439 \u0441\u043f\u0438\u0441\u043e\u043a", "profile.continueWatching": "\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c \u043f\u0440\u043e\u0441\u043c\u043e\u0442\u0440", "profile.purchaseHistory": "\u0418\u0441\u0442\u043e\u0440\u0438\u044f \u043f\u043e\u043a\u0443\u043f\u043e\u043a",
  "profile.language": "\u042f\u0437\u044b\u043a", "profile.notifications": "\u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f", "profile.darkMode": "\u0422\u0451\u043c\u043d\u0430\u044f \u0442\u0435\u043c\u0430",
  "profile.helpFaq": "\u041f\u043e\u043c\u043e\u0449\u044c \u0438 FAQ", "profile.sendFeedback": "\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u043e\u0442\u0437\u044b\u0432", "profile.reportProblem": "\u0421\u043e\u043e\u0431\u0449\u0438\u0442\u044c \u043e \u043f\u0440\u043e\u0431\u043b\u0435\u043c\u0435", "profile.signOut": "\u0412\u044b\u0439\u0442\u0438",
  "library.title": "\u0411\u0438\u0431\u043b\u0438\u043e\u0442\u0435\u043a\u0430", "library.channels": "\u041a\u0430\u043d\u0430\u043b\u044b", "library.myList": "\u041c\u043e\u0439 \u0441\u043f\u0438\u0441\u043e\u043a",
  "library.noSavedShows": "\u041d\u0435\u0442 \u0441\u043e\u0445\u0440\u0430\u043d\u0451\u043d\u043d\u044b\u0445 \u0441\u0435\u0440\u0438\u0430\u043b\u043e\u0432", "library.browseShows": "\u041e\u0431\u0437\u043e\u0440 \u0441\u0435\u0440\u0438\u0430\u043b\u043e\u0432", "library.comingSoon": "\u0421\u043a\u043e\u0440\u043e", "library.shows": "\u0441\u0435\u0440\u0438\u0430\u043b\u043e\u0432",
  "auth.signInHeading": "\u0412\u043e\u0439\u0442\u0438 \u0432 VERZA TV", "auth.signUpHeading": "\u0421\u043e\u0437\u0434\u0430\u0439\u0442\u0435 \u0430\u043a\u043a\u0430\u0443\u043d\u0442",
  "auth.email": "\u042d\u043b\u0435\u043a\u0442\u0440\u043e\u043d\u043d\u0430\u044f \u043f\u043e\u0447\u0442\u0430", "auth.displayName": "\u0418\u043c\u044f",
  "auth.continueWithEmail": "\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c \u0447\u0435\u0440\u0435\u0437 Email", "auth.continueWithGoogle": "\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c \u0447\u0435\u0440\u0435\u0437 Google", "auth.continueWithApple": "\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c \u0447\u0435\u0440\u0435\u0437 Apple",
  "auth.createAccount": "\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442", "auth.continueAsGuest": "\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c \u043a\u0430\u043a \u0433\u043e\u0441\u0442\u044c",
  "auth.noAccount": "\u041d\u0435\u0442 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0430?", "auth.haveAccount": "\u0423\u0436\u0435 \u0435\u0441\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442?", "auth.signUp": "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f",
  "legal.terms": "\u0423\u0441\u043b\u043e\u0432\u0438\u044f \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u044f", "legal.privacy": "\u041f\u043e\u043b\u0438\u0442\u0438\u043a\u0430 \u043a\u043e\u043d\u0444\u0438\u0434\u0435\u043d\u0446\u0438\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u0438", "legal.refund": "\u041f\u043e\u043b\u0438\u0442\u0438\u043a\u0430 \u0432\u043e\u0437\u0432\u0440\u0430\u0442\u0430",
  "misc.free": "\u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e", "misc.comingSoon": "\u0421\u043a\u043e\u0440\u043e", "misc.close": "\u0417\u0430\u043a\u0440\u044b\u0442\u044c",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.freeEpisodeOf": "Бесплатная серия {n} из {total}", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "Free-preview availability varies by title. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
  "paywall.unlockAll": "\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u0432\u0441\u0435 \u0441\u0435\u0440\u0438\u0438",
  "paywall.unavailableTitle": "\u0421\u0435\u0440\u0438\u044f \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0430",
  "paywall.unavailableBody": "\u042d\u0442\u0430 \u0441\u0435\u0440\u0438\u044f \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0430 \u0432 \u044d\u0442\u043e\u043c \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u0438.",
  "paywall.previewOver": "\u0412\u044b \u0442\u043e\u043b\u044c\u043a\u043e \u0447\u0442\u043e \u043f\u043e\u0441\u043c\u043e\u0442\u0440\u0435\u043b\u0438 \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u044b\u0439 \u0444\u0440\u0430\u0433\u043c\u0435\u043d\u0442 \u00ab{title}\u00bb. \u041d\u0435 \u043e\u0441\u0442\u0430\u043d\u0430\u0432\u043b\u0438\u0432\u0430\u0439\u0442\u0435\u0441\u044c \u2014 \u0438\u0441\u0442\u043e\u0440\u0438\u044f \u0442\u043e\u043b\u044c\u043a\u043e \u043d\u0430\u0447\u0438\u043d\u0430\u0435\u0442\u0441\u044f.",
  "paywall.benefitEpisodes": "\u0412\u0441\u0435 {count} \u0441\u0435\u0440\u0438\u0439 \u0441\u0440\u0430\u0437\u0443",
  "paywall.benefitAccess": "\u0414\u043e\u0441\u0442\u0443\u043f \u0432 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0435 Verza, \u043f\u043e\u043a\u0430 \u044d\u0442\u043e\u0442 \u0442\u0438\u0442\u0443\u043b \u043e\u0441\u0442\u0430\u0451\u0442\u0441\u044f \u0432 \u043a\u0430\u0442\u0430\u043b\u043e\u0433\u0435",
  "paywall.oneTimeUnlock": "\u0440\u0430\u0437\u043e\u0432\u0430\u044f \u043f\u043e\u043a\u0443\u043f\u043a\u0430 \u0441\u0435\u0440\u0438\u0430\u043b\u0430",
  "paywall.cta": "\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u0441\u0435\u0440\u0438\u0430\u043b \u2014 {price}, \u0440\u0430\u0437\u043e\u0432\u044b\u0439 \u043f\u043b\u0430\u0442\u0451\u0436",
  "paywall.ctaLoading": "\u041e\u0442\u043a\u0440\u044b\u0432\u0430\u0435\u043c \u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u0443\u044e \u043e\u043f\u043b\u0430\u0442\u0443\u2026",
  "paywall.secure": "\u0411\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u0430\u044f \u043e\u043f\u043b\u0430\u0442\u0430 \u0447\u0435\u0440\u0435\u0437 Stripe",
  "paywall.goBack": "\u041d\u0430\u0437\u0430\u0434",
  "checkout.errorStart": "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043d\u0430\u0447\u0430\u0442\u044c \u043e\u043f\u043b\u0430\u0442\u0443. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437.",
  "checkout.errorNotOpened": "\u0421\u0442\u0440\u0430\u043d\u0438\u0446\u0430 \u043e\u043f\u043b\u0430\u0442\u044b \u043d\u0435 \u043e\u0442\u043a\u0440\u044b\u043b\u0430\u0441\u044c. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437.",
  "checkout.errorNetwork": "\u041e\u0448\u0438\u0431\u043a\u0430 \u0441\u0435\u0442\u0438. \u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u0441\u043e\u0435\u0434\u0438\u043d\u0435\u043d\u0438\u0435 \u0438 \u043f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u0435.",
  "checkout.errorAuth": "\u0412\u043e\u0439\u0434\u0438\u0442\u0435 \u0432 \u0430\u043a\u043a\u0430\u0443\u043d\u0442, \u0447\u0442\u043e\u0431\u044b \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044c \u043f\u043e\u043a\u0443\u043f\u043a\u0443.",
  "checkout.errorNotPurchasable": "\u042d\u0442\u043e\u0442 \u0441\u0435\u0440\u0438\u0430\u043b \u043d\u0435 \u043f\u0440\u043e\u0434\u0430\u0451\u0442\u0441\u044f.",
  "checkout.errorEligibility": "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043f\u0440\u043e\u0432\u0435\u0440\u0438\u0442\u044c \u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e\u0441\u0442\u044c \u043f\u043e\u043a\u0443\u043f\u043a\u0438. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437.",
  "checkout.errorAccountDeletion": "\u0418\u0434\u0451\u0442 \u0443\u0434\u0430\u043b\u0435\u043d\u0438\u0435 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0430.",
  "checkout.errorPaymentReview": "\u041f\u0440\u0435\u0434\u044b\u0434\u0443\u0449\u0438\u0439 \u043f\u043b\u0430\u0442\u0451\u0436 \u0435\u0449\u0451 \u043f\u0440\u043e\u0432\u0435\u0440\u044f\u0435\u0442\u0441\u044f. \u0421\u0432\u044f\u0436\u0438\u0442\u0435\u0441\u044c \u0441 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u043e\u0439 \u043f\u0435\u0440\u0435\u0434 \u043f\u043e\u0432\u0442\u043e\u0440\u043e\u043c.",
  "checkout.errorCheckoutUnusable": "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u043e \u043f\u043e\u0432\u0442\u043e\u0440\u043d\u043e \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u044c \u043f\u0440\u0435\u0434\u044b\u0434\u0443\u0449\u0443\u044e \u043e\u043f\u043b\u0430\u0442\u0443. \u0421\u0432\u044f\u0436\u0438\u0442\u0435\u0441\u044c \u0441 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u043e\u0439.",
  "checkout.errorRefunded": "\u042d\u0442\u043e\u0442 \u043f\u043b\u0430\u0442\u0451\u0436 \u0432\u043e\u0437\u0432\u0440\u0430\u0449\u0451\u043d \u0438\u043b\u0438 \u043e\u0441\u043f\u043e\u0440\u0435\u043d.",
  "checkout.errorNotFound": "\u042d\u0442\u043e\u0442 \u0441\u0435\u0440\u0438\u0430\u043b \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d.",
  "language.audio": "\u0417\u0432\u0443\u043a: {language}",
  "language.audioSubs": "\u0417\u0432\u0443\u043a: {language} \u00b7 \u0441\u0443\u0431\u0442\u0438\u0442\u0440\u044b: {subtitles}",
  "shorts.like": "\u041d\u0440\u0430\u0432\u0438\u0442\u0441\u044f", "shorts.liked": "\u041f\u043e\u043d\u0440\u0430\u0432\u0438\u043b\u043e\u0441\u044c",
};

const tr: Translations = {
  "nav.discover": "Ke\u015ffet", "nav.shorts": "K\u0131salar", "nav.widescreen": "Geni\u015f Ekran",
  "nav.shop": "Ma\u011faza", "nav.library": "K\u00fct\u00fcphane", "nav.profile": "Profil",
  "header.followUs": "Bizi takip edin",
  "browse.startWatchingFree": "\u00dccretsiz \u0130zlemeye Ba\u015fla", "browse.trending": "Trend", "browse.episodes": "b\u00f6l\u00fcm", "browse.allShows": "T\u00fcm Diziler",
  "tab.drama": "Dram", "tab.new": "Yeni", "tab.popular": "Hot", "tab.music": "M\u00fczik", "tab.reality": "Realite", "tab.redCarpet": "K\u0131rm\u0131z\u0131 Hal\u0131",
  "shorts.list": "Liste", "shorts.saved": "Kaydedildi", "shorts.share": "Payla\u015f", "shorts.copied": "Kopyaland\u0131!", "shorts.sound": "Ses", "shorts.soundOn": "A\u00e7\u0131k", "shorts.soundOff": "Kapal\u0131",
  "horizontal.widescreen": "Geni\u015f Ekran", "horizontal.episodes": "b\u00f6l\u00fcm", "horizontal.play": "Oynat", "horizontal.pause": "Duraklat",
  "profile.guest": "Misafir", "profile.signIn": "Giri\u015f Yap", "profile.signInPrompt": "Kitapl\u0131\u011f\u0131n\u0131z\u0131 senkronize etmek i\u00e7in giri\u015f yap\u0131n",
  "profile.coinBalance": "Jeton Bakiyesi", "profile.coins": "jeton", "profile.buyCoins": "Jeton Al",
  "profile.myList": "Listem", "profile.continueWatching": "\u0130zlemeye Devam Et", "profile.purchaseHistory": "Al\u0131m Ge\u00e7mi\u015fi",
  "profile.language": "Dil", "profile.notifications": "Bildirimler", "profile.darkMode": "Karanl\u0131k Mod",
  "profile.helpFaq": "Yard\u0131m ve SSS", "profile.sendFeedback": "Geri Bildirim G\u00f6nder", "profile.reportProblem": "Sorun Bildir", "profile.signOut": "\u00c7\u0131k\u0131\u015f Yap",
  "library.title": "K\u00fct\u00fcphane", "library.channels": "Kanallar", "library.myList": "Listem",
  "library.noSavedShows": "Hen\u00fcz kaydedilen dizi yok", "library.browseShows": "Dizilere G\u00f6z At", "library.comingSoon": "\u00c7ok Yak\u0131nda", "library.shows": "dizi",
  "auth.signInHeading": "VERZA TV\u2019ye giri\u015f yap\u0131n", "auth.signUpHeading": "Hesab\u0131n\u0131z\u0131 olu\u015fturun",
  "auth.email": "E-posta adresi", "auth.displayName": "G\u00f6r\u00fcnen ad",
  "auth.continueWithEmail": "E-posta ile Devam Et", "auth.continueWithGoogle": "Google ile Devam Et", "auth.continueWithApple": "Apple ile Devam Et",
  "auth.createAccount": "Hesap Olu\u015ftur", "auth.continueAsGuest": "Misafir Olarak Devam Et",
  "auth.noAccount": "Hesab\u0131n\u0131z yok mu?", "auth.haveAccount": "Zaten hesab\u0131n\u0131z var m\u0131?", "auth.signUp": "Kay\u0131t Ol",
  "legal.terms": "Hizmet \u015eartlar\u0131", "legal.privacy": "Gizlilik Politikas\u0131", "legal.refund": "\u0130ade Politikas\u0131",
  "misc.free": "\u00dccretsiz", "misc.comingSoon": "\u00c7ok Yak\u0131nda", "misc.close": "Kapat",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.freeEpisodeOf": "Ücretsiz bölüm {n} / {total}", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "Free-preview availability varies by title. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
  "paywall.unlockAll": "T\u00fcm b\u00f6l\u00fcmlerin kilidini a\u00e7",
  "paywall.unavailableTitle": "B\u00f6l\u00fcm kullan\u0131lam\u0131yor",
  "paywall.unavailableBody": "Bu b\u00f6l\u00fcm bu uygulamada kullan\u0131lam\u0131yor.",
  "paywall.previewOver": "{title} dizisinin \u00fccretsiz \u00f6nizlemesini izlediniz. \u015eimdi durmay\u0131n \u2014 hikaye daha yeni ba\u015fl\u0131yor.",
  "paywall.benefitEpisodes": "{count} b\u00f6l\u00fcm\u00fcn hepsi, an\u0131nda",
  "paywall.benefitAccess": "Bu yap\u0131m yay\u0131nda kald\u0131\u011f\u0131 s\u00fcrece Verza hesab\u0131n\u0131zdan eri\u015fim",
  "paywall.oneTimeUnlock": "tek seferlik dizi sat\u0131n al\u0131m\u0131",
  "paywall.cta": "Dizinin kilidini a\u00e7 \u2014 {price}, tek seferlik",
  "paywall.ctaLoading": "G\u00fcvenli \u00f6deme a\u00e7\u0131l\u0131yor\u2026",
  "paywall.secure": "Stripe ile g\u00fcvenli \u00f6deme",
  "paywall.goBack": "Geri d\u00f6n",
  "checkout.errorStart": "\u00d6deme ba\u015flat\u0131lamad\u0131. L\u00fctfen tekrar deneyin.",
  "checkout.errorNotOpened": "\u00d6deme sayfas\u0131 a\u00e7\u0131lmad\u0131. L\u00fctfen tekrar deneyin.",
  "checkout.errorNetwork": "A\u011f hatas\u0131. Ba\u011flant\u0131n\u0131z\u0131 kontrol edip tekrar deneyin.",
  "checkout.errorAuth": "Bu sat\u0131n alma i\u015flemini tamamlamak i\u00e7in giri\u015f yap\u0131n.",
  "checkout.errorNotPurchasable": "Bu dizi sat\u0131\u015fta de\u011fil.",
  "checkout.errorEligibility": "Sat\u0131n alma uygunlu\u011funuzu do\u011frulayamad\u0131k. L\u00fctfen tekrar deneyin.",
  "checkout.errorAccountDeletion": "Hesap silme i\u015flemi s\u00fcr\u00fcyor.",
  "checkout.errorPaymentReview": "\u00d6nceki bir \u00f6deme h\u00e2l\u00e2 inceleniyor. Tekrar denemeden \u00f6nce destek ekibiyle ileti\u015fime ge\u00e7in.",
  "checkout.errorCheckoutUnusable": "\u00d6nceki bir \u00f6deme g\u00fcvenle yeniden kullan\u0131lamad\u0131. Destek ekibiyle ileti\u015fime ge\u00e7in.",
  "checkout.errorRefunded": "Bu \u00f6deme iade edildi veya itiraz edildi.",
  "checkout.errorNotFound": "Bu dizi bulunamad\u0131.",
  "language.audio": "{language} ses",
  "language.audioSubs": "{language} ses \u00b7 {subtitles} altyaz\u0131",
  "shorts.like": "Be\u011fen", "shorts.liked": "Be\u011fenildi",
};

const pl: Translations = {
  "nav.discover": "Odkryj", "nav.shorts": "Szorty", "nav.widescreen": "Panoramiczny",
  "nav.shop": "Sklep", "nav.library": "Biblioteka", "nav.profile": "Profil",
  "header.followUs": "Obserwuj nas",
  "browse.startWatchingFree": "Zacznij Ogl\u0105da\u0107 Za Darmo", "browse.trending": "Na Czasie", "browse.episodes": "odcink\u00f3w", "browse.allShows": "Wszystkie Seriale",
  "tab.drama": "Dramat", "tab.new": "Nowe", "tab.popular": "Hot", "tab.music": "Muzyka", "tab.reality": "Reality", "tab.redCarpet": "Czerwony Dywan",
  "shorts.list": "Lista", "shorts.saved": "Zapisano", "shorts.share": "Udost\u0119pnij", "shorts.copied": "Skopiowano!", "shorts.sound": "D\u017awi\u0119k", "shorts.soundOn": "W\u0142.", "shorts.soundOff": "Wy\u0142.",
  "horizontal.widescreen": "Panoramiczny", "horizontal.episodes": "odcink\u00f3w", "horizontal.play": "Odtw\u00f3rz", "horizontal.pause": "Pauza",
  "profile.guest": "Go\u015b\u0107", "profile.signIn": "Zaloguj si\u0119", "profile.signInPrompt": "Zaloguj si\u0119, aby zsynchronizowa\u0107 bibliotek\u0119",
  "profile.coinBalance": "Saldo Monet", "profile.coins": "monety", "profile.buyCoins": "Kup Monety",
  "profile.myList": "Moja Lista", "profile.continueWatching": "Kontynuuj Ogl\u0105danie", "profile.purchaseHistory": "Historia Zakup\u00f3w",
  "profile.language": "J\u0119zyk", "profile.notifications": "Powiadomienia", "profile.darkMode": "Tryb Ciemny",
  "profile.helpFaq": "Pomoc i FAQ", "profile.sendFeedback": "Wy\u015blij Opini\u0119", "profile.reportProblem": "Zg\u0142o\u015b Problem", "profile.signOut": "Wyloguj si\u0119",
  "library.title": "Biblioteka", "library.channels": "Kana\u0142y", "library.myList": "Moja Lista",
  "library.noSavedShows": "Brak zapisanych seriali", "library.browseShows": "Przegl\u0105daj Seriale", "library.comingSoon": "Wkr\u00f3tce", "library.shows": "seriale",
  "auth.signInHeading": "Zaloguj si\u0119 do VERZA TV", "auth.signUpHeading": "Utw\u00f3rz swoje konto",
  "auth.email": "Adres e-mail", "auth.displayName": "Wy\u015bwietlana nazwa",
  "auth.continueWithEmail": "Kontynuuj przez E-mail", "auth.continueWithGoogle": "Kontynuuj przez Google", "auth.continueWithApple": "Kontynuuj przez Apple",
  "auth.createAccount": "Utw\u00f3rz Konto", "auth.continueAsGuest": "Kontynuuj jako Go\u015b\u0107",
  "auth.noAccount": "Nie masz konta?", "auth.haveAccount": "Masz ju\u017c konto?", "auth.signUp": "Zarejestruj si\u0119",
  "legal.terms": "Regulamin", "legal.privacy": "Polityka Prywatno\u015bci", "legal.refund": "Polityka Zwrot\u00f3w",
  "misc.free": "Za Darmo", "misc.comingSoon": "Wkr\u00f3tce", "misc.close": "Zamknij",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.freeEpisodeOf": "Darmowy odcinek {n} z {total}", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "Free-preview availability varies by title. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
  "paywall.unlockAll": "Odblokuj wszystkie odcinki",
  "paywall.unavailableTitle": "Odcinek niedost\u0119pny",
  "paywall.unavailableBody": "Ten odcinek nie jest dost\u0119pny w tej aplikacji.",
  "paywall.previewOver": "W\u0142a\u015bnie obejrza\u0142e\u015b darmowy fragment {title}. Nie przerywaj \u2014 historia dopiero si\u0119 rozkr\u0119ca.",
  "paywall.benefitEpisodes": "Wszystkie {count} odcink\u00f3w, od razu",
  "paywall.benefitAccess": "Dost\u0119p na koncie Verza, dop\u00f3ki ten tytu\u0142 pozostaje dost\u0119pny",
  "paywall.oneTimeUnlock": "jednorazowy zakup serialu",
  "paywall.cta": "Odblokuj serial \u2014 {price}, jednorazowo",
  "paywall.ctaLoading": "Otwieram bezpieczn\u0105 p\u0142atno\u015b\u0107\u2026",
  "paywall.secure": "Bezpieczna p\u0142atno\u015b\u0107 przez Stripe",
  "paywall.goBack": "Wr\u00f3\u0107",
  "checkout.errorStart": "Nie uda\u0142o si\u0119 rozpocz\u0105\u0107 p\u0142atno\u015bci. Spr\u00f3buj ponownie.",
  "checkout.errorNotOpened": "P\u0142atno\u015b\u0107 si\u0119 nie otworzy\u0142a. Spr\u00f3buj ponownie.",
  "checkout.errorNetwork": "B\u0142\u0105d sieci. Sprawd\u017a po\u0142\u0105czenie i spr\u00f3buj ponownie.",
  "checkout.errorAuth": "Zaloguj si\u0119, aby doko\u0144czy\u0107 zakup.",
  "checkout.errorNotPurchasable": "Ten serial nie jest w sprzeda\u017cy.",
  "checkout.errorEligibility": "Nie mogli\u015bmy zweryfikowa\u0107 Twojego prawa do zakupu. Spr\u00f3buj ponownie.",
  "checkout.errorAccountDeletion": "Trwa usuwanie konta.",
  "checkout.errorPaymentReview": "Wcze\u015bniejsza p\u0142atno\u015b\u0107 jest wci\u0105\u017c weryfikowana. Skontaktuj si\u0119 z pomoc\u0105 przed kolejn\u0105 pr\u00f3b\u0105.",
  "checkout.errorCheckoutUnusable": "Nie da\u0142o si\u0119 bezpiecznie ponowi\u0107 wcze\u015bniejszej p\u0142atno\u015bci. Skontaktuj si\u0119 z pomoc\u0105.",
  "checkout.errorRefunded": "Ta p\u0142atno\u015b\u0107 zosta\u0142a zwr\u00f3cona lub zakwestionowana.",
  "checkout.errorNotFound": "Nie znaleziono tego serialu.",
  "language.audio": "D\u017awi\u0119k: {language}",
  "language.audioSubs": "D\u017awi\u0119k: {language} \u00b7 napisy: {subtitles}",
  "shorts.like": "Lubi\u0119 to", "shorts.liked": "Polubione",
};

const nl: Translations = {
  "nav.discover": "Ontdekken", "nav.shorts": "Shorts", "nav.widescreen": "Breedbeeld",
  "nav.shop": "Winkel", "nav.library": "Bibliotheek", "nav.profile": "Profiel",
  "header.followUs": "Volg ons",
  "browse.startWatchingFree": "Begin Gratis te Kijken", "browse.trending": "Trending", "browse.episodes": "afleveringen", "browse.allShows": "Alle Series",
  "tab.drama": "Drama", "tab.new": "Nieuw", "tab.popular": "Hot", "tab.music": "Muziek", "tab.reality": "Reality", "tab.redCarpet": "Rode Loper",
  "shorts.list": "Lijst", "shorts.saved": "Opgeslagen", "shorts.share": "Delen", "shorts.copied": "Gekopieerd!", "shorts.sound": "Geluid", "shorts.soundOn": "Aan", "shorts.soundOff": "Uit",
  "horizontal.widescreen": "Breedbeeld", "horizontal.episodes": "afleveringen", "horizontal.play": "Afspelen", "horizontal.pause": "Pauzeren",
  "profile.guest": "Gast", "profile.signIn": "Inloggen", "profile.signInPrompt": "Log in om je bibliotheek te synchroniseren",
  "profile.coinBalance": "Munten Saldo", "profile.coins": "munten", "profile.buyCoins": "Munten Kopen",
  "profile.myList": "Mijn Lijst", "profile.continueWatching": "Verder Kijken", "profile.purchaseHistory": "Aankoopgeschiedenis",
  "profile.language": "Taal", "profile.notifications": "Meldingen", "profile.darkMode": "Donkere Modus",
  "profile.helpFaq": "Help & FAQ", "profile.sendFeedback": "Feedback Versturen", "profile.reportProblem": "Probleem Melden", "profile.signOut": "Uitloggen",
  "library.title": "Bibliotheek", "library.channels": "Kanalen", "library.myList": "Mijn Lijst",
  "library.noSavedShows": "Nog geen opgeslagen series", "library.browseShows": "Series Bekijken", "library.comingSoon": "Binnenkort", "library.shows": "series",
  "auth.signInHeading": "Log in bij VERZA TV", "auth.signUpHeading": "Maak je account aan",
  "auth.email": "E-mailadres", "auth.displayName": "Weergavenaam",
  "auth.continueWithEmail": "Doorgaan met E-mail", "auth.continueWithGoogle": "Doorgaan met Google", "auth.continueWithApple": "Doorgaan met Apple",
  "auth.createAccount": "Account Aanmaken", "auth.continueAsGuest": "Doorgaan als Gast",
  "auth.noAccount": "Geen account?", "auth.haveAccount": "Heb je al een account?", "auth.signUp": "Registreren",
  "legal.terms": "Servicevoorwaarden", "legal.privacy": "Privacybeleid", "legal.refund": "Restitutiebeleid",
  "misc.free": "Gratis", "misc.comingSoon": "Binnenkort", "misc.close": "Sluiten",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.freeEpisodeOf": "Gratis aflevering {n} van {total}", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "Free-preview availability varies by title. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
  "paywall.unlockAll": "Ontgrendel alle afleveringen",
  "paywall.unavailableTitle": "Aflevering niet beschikbaar",
  "paywall.unavailableBody": "Deze aflevering is niet beschikbaar in deze app.",
  "paywall.previewOver": "Je hebt net de gratis preview van {title} gezien. Stop nu niet \u2014 het verhaal begint pas.",
  "paywall.benefitEpisodes": "Alle {count} afleveringen, direct",
  "paywall.benefitAccess": "Toegang via je Verza-account zolang deze titel beschikbaar blijft",
  "paywall.oneTimeUnlock": "eenmalige serie-aankoop",
  "paywall.cta": "Serie ontgrendelen \u2014 {price}, eenmalig",
  "paywall.ctaLoading": "Veilig afrekenen wordt geopend\u2026",
  "paywall.secure": "Veilig betalen via Stripe",
  "paywall.goBack": "Terug",
  "checkout.errorStart": "Afrekenen kon niet worden gestart. Probeer het opnieuw.",
  "checkout.errorNotOpened": "Het afrekenscherm ging niet open. Probeer het opnieuw.",
  "checkout.errorNetwork": "Netwerkfout. Controleer je verbinding en probeer het opnieuw.",
  "checkout.errorAuth": "Log in om deze aankoop af te ronden.",
  "checkout.errorNotPurchasable": "Deze serie is niet te koop.",
  "checkout.errorEligibility": "We konden je aankooprecht niet controleren. Probeer het opnieuw.",
  "checkout.errorAccountDeletion": "Het account wordt verwijderd.",
  "checkout.errorPaymentReview": "Een eerdere betaling wordt nog beoordeeld. Neem contact op met support voordat je het opnieuw probeert.",
  "checkout.errorCheckoutUnusable": "Een eerdere betaling kon niet veilig worden hergebruikt. Neem contact op met support.",
  "checkout.errorRefunded": "Deze betaling is terugbetaald of betwist.",
  "checkout.errorNotFound": "Deze serie is niet gevonden.",
  "language.audio": "Audio in {language}",
  "language.audioSubs": "Audio in {language} \u00b7 ondertiteling in {subtitles}",
  "shorts.like": "Vind ik leuk", "shorts.liked": "Leuk",
};

const th: Translations = {
  "nav.discover": "\u0e04\u0e49\u0e19\u0e1e\u0e1a", "nav.shorts": "\u0e04\u0e25\u0e34\u0e1b\u0e2a\u0e31\u0e49\u0e19", "nav.widescreen": "\u0e08\u0e2d\u0e01\u0e27\u0e49\u0e32\u0e07",
  "nav.shop": "\u0e23\u0e49\u0e32\u0e19\u0e04\u0e49\u0e32", "nav.library": "\u0e04\u0e25\u0e31\u0e07\u0e40\u0e19\u0e37\u0e49\u0e2d\u0e2b\u0e32", "nav.profile": "\u0e42\u0e1b\u0e23\u0e44\u0e1f\u0e25\u0e4c",
  "header.followUs": "\u0e15\u0e34\u0e14\u0e15\u0e32\u0e21\u0e40\u0e23\u0e32",
  "browse.startWatchingFree": "\u0e40\u0e23\u0e34\u0e48\u0e21\u0e14\u0e39\u0e1f\u0e23\u0e35", "browse.trending": "\u0e01\u0e33\u0e25\u0e31\u0e07\u0e21\u0e32\u0e41\u0e23\u0e07", "browse.episodes": "\u0e15\u0e2d\u0e19", "browse.allShows": "\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14",
  "tab.drama": "\u0e14\u0e23\u0e32\u0e21\u0e48\u0e32", "tab.new": "\u0e43\u0e2b\u0e21\u0e48", "tab.popular": "Hot", "tab.music": "\u0e40\u0e1e\u0e25\u0e07", "tab.reality": "\u0e40\u0e23\u0e35\u0e22\u0e25\u0e34\u0e15\u0e35\u0e49", "tab.redCarpet": "\u0e1e\u0e23\u0e21\u0e41\u0e14\u0e07",
  "shorts.list": "\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23", "shorts.saved": "\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e41\u0e25\u0e49\u0e27", "shorts.share": "\u0e41\u0e0a\u0e23\u0e4c", "shorts.copied": "\u0e04\u0e31\u0e14\u0e25\u0e2d\u0e01\u0e41\u0e25\u0e49\u0e27!", "shorts.sound": "\u0e40\u0e2a\u0e35\u0e22\u0e07", "shorts.soundOn": "\u0e40\u0e1b\u0e34\u0e14", "shorts.soundOff": "\u0e1b\u0e34\u0e14",
  "horizontal.widescreen": "\u0e08\u0e2d\u0e01\u0e27\u0e49\u0e32\u0e07", "horizontal.episodes": "\u0e15\u0e2d\u0e19", "horizontal.play": "\u0e40\u0e25\u0e48\u0e19", "horizontal.pause": "\u0e2b\u0e22\u0e38\u0e14",
  "profile.guest": "\u0e1c\u0e39\u0e49\u0e40\u0e22\u0e35\u0e48\u0e22\u0e21\u0e0a\u0e21", "profile.signIn": "\u0e40\u0e02\u0e49\u0e32\u0e2a\u0e39\u0e48\u0e23\u0e30\u0e1a\u0e1a", "profile.signInPrompt": "\u0e40\u0e02\u0e49\u0e32\u0e2a\u0e39\u0e48\u0e23\u0e30\u0e1a\u0e1a\u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e0b\u0e34\u0e07\u0e04\u0e4c\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25",
  "profile.coinBalance": "\u0e22\u0e2d\u0e14\u0e40\u0e2b\u0e23\u0e35\u0e22\u0e0d", "profile.coins": "\u0e40\u0e2b\u0e23\u0e35\u0e22\u0e0d", "profile.buyCoins": "\u0e0b\u0e37\u0e49\u0e2d\u0e40\u0e2b\u0e23\u0e35\u0e22\u0e0d",
  "profile.myList": "\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e02\u0e2d\u0e07\u0e09\u0e31\u0e19", "profile.continueWatching": "\u0e14\u0e39\u0e15\u0e48\u0e2d", "profile.purchaseHistory": "\u0e1b\u0e23\u0e30\u0e27\u0e31\u0e15\u0e34\u0e01\u0e32\u0e23\u0e0b\u0e37\u0e49\u0e2d",
  "profile.language": "\u0e20\u0e32\u0e29\u0e32", "profile.notifications": "\u0e01\u0e32\u0e23\u0e41\u0e08\u0e49\u0e07\u0e40\u0e15\u0e37\u0e2d\u0e19", "profile.darkMode": "\u0e42\u0e2b\u0e21\u0e14\u0e21\u0e37\u0e14",
  "profile.helpFaq": "\u0e0a\u0e48\u0e27\u0e22\u0e40\u0e2b\u0e25\u0e37\u0e2d\u0e41\u0e25\u0e30 FAQ", "profile.sendFeedback": "\u0e2a\u0e48\u0e07\u0e04\u0e27\u0e32\u0e21\u0e04\u0e34\u0e14\u0e40\u0e2b\u0e47\u0e19", "profile.reportProblem": "\u0e23\u0e32\u0e22\u0e07\u0e32\u0e19\u0e1b\u0e31\u0e0d\u0e2b\u0e32", "profile.signOut": "\u0e2d\u0e2d\u0e01\u0e08\u0e32\u0e01\u0e23\u0e30\u0e1a\u0e1a",
  "library.title": "\u0e04\u0e25\u0e31\u0e07\u0e40\u0e19\u0e37\u0e49\u0e2d\u0e2b\u0e32", "library.channels": "\u0e0a\u0e48\u0e2d\u0e07", "library.myList": "\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e02\u0e2d\u0e07\u0e09\u0e31\u0e19",
  "library.noSavedShows": "\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e17\u0e35\u0e48\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01", "library.browseShows": "\u0e40\u0e23\u0e35\u0e22\u0e01\u0e14\u0e39\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23", "library.comingSoon": "\u0e40\u0e23\u0e47\u0e27\u0e46 \u0e19\u0e35\u0e49", "library.shows": "\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23",
  "auth.signInHeading": "\u0e40\u0e02\u0e49\u0e32\u0e2a\u0e39\u0e48\u0e23\u0e30\u0e1a\u0e1a VERZA TV", "auth.signUpHeading": "\u0e2a\u0e23\u0e49\u0e32\u0e07\u0e1a\u0e31\u0e0d\u0e0a\u0e35",
  "auth.email": "\u0e2d\u0e35\u0e40\u0e21\u0e25", "auth.displayName": "\u0e0a\u0e37\u0e48\u0e2d\u0e17\u0e35\u0e48\u0e41\u0e2a\u0e14\u0e07",
  "auth.continueWithEmail": "\u0e14\u0e33\u0e40\u0e19\u0e34\u0e19\u0e01\u0e32\u0e23\u0e14\u0e49\u0e27\u0e22\u0e2d\u0e35\u0e40\u0e21\u0e25", "auth.continueWithGoogle": "\u0e14\u0e33\u0e40\u0e19\u0e34\u0e19\u0e01\u0e32\u0e23\u0e14\u0e49\u0e27\u0e22 Google", "auth.continueWithApple": "\u0e14\u0e33\u0e40\u0e19\u0e34\u0e19\u0e01\u0e32\u0e23\u0e14\u0e49\u0e27\u0e22 Apple",
  "auth.createAccount": "\u0e2a\u0e23\u0e49\u0e32\u0e07\u0e1a\u0e31\u0e0d\u0e0a\u0e35", "auth.continueAsGuest": "\u0e14\u0e33\u0e40\u0e19\u0e34\u0e19\u0e01\u0e32\u0e23\u0e43\u0e19\u0e10\u0e32\u0e19\u0e30\u0e1c\u0e39\u0e49\u0e40\u0e22\u0e35\u0e48\u0e22\u0e21\u0e0a\u0e21",
  "auth.noAccount": "\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e1a\u0e31\u0e0d\u0e0a\u0e35?", "auth.haveAccount": "\u0e21\u0e35\u0e1a\u0e31\u0e0d\u0e0a\u0e35\u0e2d\u0e22\u0e39\u0e48\u0e41\u0e25\u0e49\u0e27?", "auth.signUp": "\u0e2a\u0e21\u0e31\u0e04\u0e23\u0e2a\u0e21\u0e32\u0e0a\u0e34\u0e01",
  "legal.terms": "\u0e02\u0e49\u0e2d\u0e01\u0e33\u0e2b\u0e19\u0e14\u0e01\u0e32\u0e23\u0e43\u0e2b\u0e49\u0e1a\u0e23\u0e34\u0e01\u0e32\u0e23", "legal.privacy": "\u0e19\u0e42\u0e22\u0e1a\u0e32\u0e22\u0e04\u0e27\u0e32\u0e21\u0e40\u0e1b\u0e47\u0e19\u0e2a\u0e48\u0e27\u0e19\u0e15\u0e31\u0e27", "legal.refund": "\u0e19\u0e42\u0e22\u0e1a\u0e32\u0e22\u0e01\u0e32\u0e23\u0e04\u0e37\u0e19\u0e40\u0e07\u0e34\u0e19",
  "misc.free": "\u0e1f\u0e23\u0e35", "misc.comingSoon": "\u0e40\u0e23\u0e47\u0e27\u0e46 \u0e19\u0e35\u0e49", "misc.close": "\u0e1b\u0e34\u0e14",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.freeEpisodeOf": "ตอนฟรี {n} จาก {total}", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "Free-preview availability varies by title. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
  "paywall.unlockAll": "\u0e1b\u0e25\u0e14\u0e25\u0e47\u0e2d\u0e01\u0e17\u0e38\u0e01\u0e15\u0e2d\u0e19",
  "paywall.unavailableTitle": "\u0e15\u0e2d\u0e19\u0e19\u0e35\u0e49\u0e44\u0e21\u0e48\u0e1e\u0e23\u0e49\u0e2d\u0e21\u0e43\u0e2b\u0e49\u0e0a\u0e21",
  "paywall.unavailableBody": "\u0e15\u0e2d\u0e19\u0e19\u0e35\u0e49\u0e44\u0e21\u0e48\u0e21\u0e35\u0e43\u0e2b\u0e49\u0e0a\u0e21\u0e43\u0e19\u0e41\u0e2d\u0e1b\u0e19\u0e35\u0e49",
  "paywall.previewOver": "\u0e04\u0e38\u0e13\u0e40\u0e1e\u0e34\u0e48\u0e07\u0e14\u0e39\u0e15\u0e31\u0e27\u0e2d\u0e22\u0e48\u0e32\u0e07\u0e1f\u0e23\u0e35\u0e02\u0e2d\u0e07 {title} \u0e2d\u0e22\u0e48\u0e32\u0e2b\u0e22\u0e38\u0e14\u0e15\u0e2d\u0e19\u0e19\u0e35\u0e49 \u2014 \u0e40\u0e23\u0e37\u0e48\u0e2d\u0e07\u0e01\u0e33\u0e25\u0e31\u0e07\u0e08\u0e30\u0e2a\u0e19\u0e38\u0e01",
  "paywall.benefitEpisodes": "\u0e04\u0e23\u0e1a\u0e17\u0e31\u0e49\u0e07 {count} \u0e15\u0e2d\u0e19 \u0e17\u0e31\u0e19\u0e17\u0e35",
  "paywall.benefitAccess": "\u0e14\u0e39\u0e44\u0e14\u0e49\u0e08\u0e32\u0e01\u0e1a\u0e31\u0e0d\u0e0a\u0e35 Verza \u0e15\u0e23\u0e32\u0e1a\u0e40\u0e17\u0e48\u0e32\u0e17\u0e35\u0e48\u0e40\u0e23\u0e37\u0e48\u0e2d\u0e07\u0e19\u0e35\u0e49\u0e22\u0e31\u0e07\u0e43\u0e2b\u0e49\u0e1a\u0e23\u0e34\u0e01\u0e32\u0e23",
  "paywall.oneTimeUnlock": "\u0e0b\u0e37\u0e49\u0e2d\u0e0b\u0e35\u0e23\u0e35\u0e2a\u0e4c\u0e04\u0e23\u0e31\u0e49\u0e07\u0e40\u0e14\u0e35\u0e22\u0e27",
  "paywall.cta": "\u0e1b\u0e25\u0e14\u0e25\u0e47\u0e2d\u0e01\u0e0b\u0e35\u0e23\u0e35\u0e2a\u0e4c \u2014 {price} \u0e08\u0e48\u0e32\u0e22\u0e04\u0e23\u0e31\u0e49\u0e07\u0e40\u0e14\u0e35\u0e22\u0e27",
  "paywall.ctaLoading": "\u0e01\u0e33\u0e25\u0e31\u0e07\u0e40\u0e1b\u0e34\u0e14\u0e2b\u0e19\u0e49\u0e32\u0e0a\u0e33\u0e23\u0e30\u0e40\u0e07\u0e34\u0e19\u0e17\u0e35\u0e48\u0e1b\u0e25\u0e2d\u0e14\u0e20\u0e31\u0e22\u2026",
  "paywall.secure": "\u0e0a\u0e33\u0e23\u0e30\u0e40\u0e07\u0e34\u0e19\u0e2d\u0e22\u0e48\u0e32\u0e07\u0e1b\u0e25\u0e2d\u0e14\u0e20\u0e31\u0e22\u0e1c\u0e48\u0e32\u0e19 Stripe",
  "paywall.goBack": "\u0e01\u0e25\u0e31\u0e1a",
  "checkout.errorStart": "\u0e40\u0e23\u0e34\u0e48\u0e21\u0e0a\u0e33\u0e23\u0e30\u0e40\u0e07\u0e34\u0e19\u0e44\u0e21\u0e48\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08 \u0e01\u0e23\u0e38\u0e13\u0e32\u0e25\u0e2d\u0e07\u0e2d\u0e35\u0e01\u0e04\u0e23\u0e31\u0e49\u0e07",
  "checkout.errorNotOpened": "\u0e2b\u0e19\u0e49\u0e32\u0e0a\u0e33\u0e23\u0e30\u0e40\u0e07\u0e34\u0e19\u0e44\u0e21\u0e48\u0e40\u0e1b\u0e34\u0e14 \u0e01\u0e23\u0e38\u0e13\u0e32\u0e25\u0e2d\u0e07\u0e2d\u0e35\u0e01\u0e04\u0e23\u0e31\u0e49\u0e07",
  "checkout.errorNetwork": "\u0e40\u0e04\u0e23\u0e37\u0e2d\u0e02\u0e48\u0e32\u0e22\u0e02\u0e31\u0e14\u0e02\u0e49\u0e2d\u0e07 \u0e15\u0e23\u0e27\u0e08\u0e2a\u0e2d\u0e1a\u0e01\u0e32\u0e23\u0e40\u0e0a\u0e37\u0e48\u0e2d\u0e21\u0e15\u0e48\u0e2d\u0e41\u0e25\u0e49\u0e27\u0e25\u0e2d\u0e07\u0e2d\u0e35\u0e01\u0e04\u0e23\u0e31\u0e49\u0e07",
  "checkout.errorAuth": "\u0e01\u0e23\u0e38\u0e13\u0e32\u0e40\u0e02\u0e49\u0e32\u0e2a\u0e39\u0e48\u0e23\u0e30\u0e1a\u0e1a\u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e17\u0e33\u0e01\u0e32\u0e23\u0e0b\u0e37\u0e49\u0e2d\u0e43\u0e2b\u0e49\u0e40\u0e2a\u0e23\u0e47\u0e08",
  "checkout.errorNotPurchasable": "\u0e0b\u0e35\u0e23\u0e35\u0e2a\u0e4c\u0e19\u0e35\u0e49\u0e44\u0e21\u0e48\u0e44\u0e14\u0e49\u0e27\u0e32\u0e07\u0e08\u0e33\u0e2b\u0e19\u0e48\u0e32\u0e22",
  "checkout.errorEligibility": "\u0e40\u0e23\u0e32\u0e15\u0e23\u0e27\u0e08\u0e2a\u0e2d\u0e1a\u0e2a\u0e34\u0e17\u0e18\u0e34\u0e4c\u0e01\u0e32\u0e23\u0e0b\u0e37\u0e49\u0e2d\u0e02\u0e2d\u0e07\u0e04\u0e38\u0e13\u0e44\u0e21\u0e48\u0e44\u0e14\u0e49 \u0e01\u0e23\u0e38\u0e13\u0e32\u0e25\u0e2d\u0e07\u0e2d\u0e35\u0e01\u0e04\u0e23\u0e31\u0e49\u0e07",
  "checkout.errorAccountDeletion": "\u0e01\u0e33\u0e25\u0e31\u0e07\u0e14\u0e33\u0e40\u0e19\u0e34\u0e19\u0e01\u0e32\u0e23\u0e25\u0e1a\u0e1a\u0e31\u0e0d\u0e0a\u0e35",
  "checkout.errorPaymentReview": "\u0e01\u0e32\u0e23\u0e0a\u0e33\u0e23\u0e30\u0e40\u0e07\u0e34\u0e19\u0e01\u0e48\u0e2d\u0e19\u0e2b\u0e19\u0e49\u0e32\u0e22\u0e31\u0e07\u0e2d\u0e22\u0e39\u0e48\u0e23\u0e30\u0e2b\u0e27\u0e48\u0e32\u0e07\u0e15\u0e23\u0e27\u0e08\u0e2a\u0e2d\u0e1a \u0e01\u0e23\u0e38\u0e13\u0e32\u0e15\u0e34\u0e14\u0e15\u0e48\u0e2d\u0e1d\u0e48\u0e32\u0e22\u0e0a\u0e48\u0e27\u0e22\u0e40\u0e2b\u0e25\u0e37\u0e2d\u0e01\u0e48\u0e2d\u0e19\u0e25\u0e2d\u0e07\u0e2d\u0e35\u0e01\u0e04\u0e23\u0e31\u0e49\u0e07",
  "checkout.errorCheckoutUnusable": "\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e19\u0e33\u0e01\u0e32\u0e23\u0e0a\u0e33\u0e23\u0e30\u0e40\u0e07\u0e34\u0e19\u0e01\u0e48\u0e2d\u0e19\u0e2b\u0e19\u0e49\u0e32\u0e21\u0e32\u0e43\u0e0a\u0e49\u0e0b\u0e49\u0e33\u0e44\u0e14\u0e49\u0e2d\u0e22\u0e48\u0e32\u0e07\u0e1b\u0e25\u0e2d\u0e14\u0e20\u0e31\u0e22 \u0e01\u0e23\u0e38\u0e13\u0e32\u0e15\u0e34\u0e14\u0e15\u0e48\u0e2d\u0e1d\u0e48\u0e32\u0e22\u0e0a\u0e48\u0e27\u0e22\u0e40\u0e2b\u0e25\u0e37\u0e2d",
  "checkout.errorRefunded": "\u0e01\u0e32\u0e23\u0e0a\u0e33\u0e23\u0e30\u0e40\u0e07\u0e34\u0e19\u0e19\u0e35\u0e49\u0e16\u0e39\u0e01\u0e04\u0e37\u0e19\u0e40\u0e07\u0e34\u0e19\u0e2b\u0e23\u0e37\u0e2d\u0e42\u0e15\u0e49\u0e41\u0e22\u0e49\u0e07",
  "checkout.errorNotFound": "\u0e44\u0e21\u0e48\u0e1e\u0e1a\u0e0b\u0e35\u0e23\u0e35\u0e2a\u0e4c\u0e19\u0e35\u0e49",
  "language.audio": "\u0e40\u0e2a\u0e35\u0e22\u0e07 {language}",
  "language.audioSubs": "\u0e40\u0e2a\u0e35\u0e22\u0e07 {language} \u00b7 \u0e04\u0e33\u0e1a\u0e23\u0e23\u0e22\u0e32\u0e22 {subtitles}",
  "shorts.like": "\u0e16\u0e39\u0e01\u0e43\u0e08", "shorts.liked": "\u0e16\u0e39\u0e01\u0e43\u0e08\u0e41\u0e25\u0e49\u0e27",
};

const vi: Translations = {
  "nav.discover": "Kh\u00e1m ph\u00e1", "nav.shorts": "Video ng\u1eafn", "nav.widescreen": "M\u00e0n h\u00ecnh r\u1ed9ng",
  "nav.shop": "C\u1eeda h\u00e0ng", "nav.library": "Th\u01b0 vi\u1ec7n", "nav.profile": "H\u1ed3 s\u01a1",
  "header.followUs": "Theo d\u00f5i ch\u00fang t\u00f4i",
  "browse.startWatchingFree": "B\u1eaft \u0111\u1ea7u xem mi\u1ec5n ph\u00ed", "browse.trending": "Th\u1ecbnh h\u00e0nh", "browse.episodes": "t\u1eadp", "browse.allShows": "T\u1ea5t c\u1ea3",
  "tab.drama": "K\u1ecbch", "tab.new": "M\u1edbi", "tab.popular": "Hot", "tab.music": "\u00c2m nh\u1ea1c", "tab.reality": "Th\u1ef1c t\u1ebf", "tab.redCarpet": "Th\u1ea3m \u0111\u1ecf",
  "shorts.list": "Danh s\u00e1ch", "shorts.saved": "\u0110\u00e3 l\u01b0u", "shorts.share": "Chia s\u1ebb", "shorts.copied": "\u0110\u00e3 sao ch\u00e9p!", "shorts.sound": "\u00c2m thanh", "shorts.soundOn": "B\u1eadt", "shorts.soundOff": "T\u1eaft",
  "horizontal.widescreen": "M\u00e0n h\u00ecnh r\u1ed9ng", "horizontal.episodes": "t\u1eadp", "horizontal.play": "Ph\u00e1t", "horizontal.pause": "D\u1eebng",
  "profile.guest": "Kh\u00e1ch", "profile.signIn": "\u0110\u0103ng nh\u1eadp", "profile.signInPrompt": "\u0110\u0103ng nh\u1eadp \u0111\u1ec3 \u0111\u1ed3ng b\u1ed9 th\u01b0 vi\u1ec7n",
  "profile.coinBalance": "S\u1ed1 d\u01b0 xu", "profile.coins": "xu", "profile.buyCoins": "Mua xu",
  "profile.myList": "Danh s\u00e1ch c\u1ee7a t\u00f4i", "profile.continueWatching": "Xem ti\u1ebfp", "profile.purchaseHistory": "L\u1ecbch s\u1eed mua",
  "profile.language": "Ng\u00f4n ng\u1eef", "profile.notifications": "Th\u00f4ng b\u00e1o", "profile.darkMode": "Ch\u1ebf \u0111\u1ed9 t\u1ed1i",
  "profile.helpFaq": "Tr\u1ee3 gi\u00fap & FAQ", "profile.sendFeedback": "G\u1eedi ph\u1ea3n h\u1ed3i", "profile.reportProblem": "B\u00e1o c\u00e1o s\u1ef1 c\u1ed1", "profile.signOut": "\u0110\u0103ng xu\u1ea5t",
  "library.title": "Th\u01b0 vi\u1ec7n", "library.channels": "K\u00eanh", "library.myList": "Danh s\u00e1ch c\u1ee7a t\u00f4i",
  "library.noSavedShows": "Ch\u01b0a c\u00f3 ch\u01b0\u01a1ng tr\u00ecnh n\u00e0o", "library.browseShows": "Duy\u1ec7t ch\u01b0\u01a1ng tr\u00ecnh", "library.comingSoon": "S\u1eafp ra m\u1eaft", "library.shows": "ch\u01b0\u01a1ng tr\u00ecnh",
  "auth.signInHeading": "\u0110\u0103ng nh\u1eadp VERZA TV", "auth.signUpHeading": "T\u1ea1o t\u00e0i kho\u1ea3n",
  "auth.email": "\u0110\u1ecba ch\u1ec9 email", "auth.displayName": "T\u00ean hi\u1ec3n th\u1ecb",
  "auth.continueWithEmail": "Ti\u1ebfp t\u1ee5c v\u1edbi Email", "auth.continueWithGoogle": "Ti\u1ebfp t\u1ee5c v\u1edbi Google", "auth.continueWithApple": "Ti\u1ebfp t\u1ee5c v\u1edbi Apple",
  "auth.createAccount": "T\u1ea1o t\u00e0i kho\u1ea3n", "auth.continueAsGuest": "Ti\u1ebfp t\u1ee5c nh\u01b0 kh\u00e1ch",
  "auth.noAccount": "Ch\u01b0a c\u00f3 t\u00e0i kho\u1ea3n?", "auth.haveAccount": "\u0110\u00e3 c\u00f3 t\u00e0i kho\u1ea3n?", "auth.signUp": "\u0110\u0103ng k\u00fd",
  "legal.terms": "\u0110i\u1ec1u kho\u1ea3n d\u1ecbch v\u1ee5", "legal.privacy": "Ch\u00ednh s\u00e1ch b\u1ea3o m\u1eadt", "legal.refund": "Ch\u00ednh s\u00e1ch ho\u00e0n ti\u1ec1n",
  "misc.free": "Mi\u1ec5n ph\u00ed", "misc.comingSoon": "S\u1eafp ra m\u1eaft", "misc.close": "\u0110\u00f3ng",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.freeEpisodeOf": "Tập miễn phí {n} trên {total}", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "Free-preview availability varies by title. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
  "paywall.unlockAll": "M\u1edf kh\u00f3a to\u00e0n b\u1ed9 t\u1eadp",
  "paywall.unavailableTitle": "T\u1eadp n\u00e0y kh\u00f4ng kh\u1ea3 d\u1ee5ng",
  "paywall.unavailableBody": "T\u1eadp n\u00e0y kh\u00f4ng c\u00f3 s\u1eb5n trong \u1ee9ng d\u1ee5ng n\u00e0y.",
  "paywall.previewOver": "B\u1ea1n v\u1eeba xem xong ph\u1ea7n xem th\u1eed mi\u1ec5n ph\u00ed c\u1ee7a {title}. \u0110\u1eebng d\u1eebng l\u1ea1i \u2014 c\u00e2u chuy\u1ec7n m\u1edbi ch\u1ec9 b\u1eaft \u0111\u1ea7u.",
  "paywall.benefitEpisodes": "To\u00e0n b\u1ed9 {count} t\u1eadp, ngay l\u1eadp t\u1ee9c",
  "paywall.benefitAccess": "Xem b\u1eb1ng t\u00e0i kho\u1ea3n Verza c\u1ee7a b\u1ea1n khi phim c\u00f2n tr\u00ean h\u1ec7 th\u1ed1ng",
  "paywall.oneTimeUnlock": "mua tr\u1ecdn b\u1ed9 m\u1ed9t l\u1ea7n",
  "paywall.cta": "M\u1edf kh\u00f3a tr\u1ecdn b\u1ed9 \u2014 {price}, thanh to\u00e1n m\u1ed9t l\u1ea7n",
  "paywall.ctaLoading": "\u0110ang m\u1edf trang thanh to\u00e1n an to\u00e0n\u2026",
  "paywall.secure": "Thanh to\u00e1n an to\u00e0n qua Stripe",
  "paywall.goBack": "Quay l\u1ea1i",
  "checkout.errorStart": "Kh\u00f4ng th\u1ec3 b\u1eaft \u0111\u1ea7u thanh to\u00e1n. Vui l\u00f2ng th\u1eed l\u1ea1i.",
  "checkout.errorNotOpened": "Trang thanh to\u00e1n kh\u00f4ng m\u1edf. Vui l\u00f2ng th\u1eed l\u1ea1i.",
  "checkout.errorNetwork": "L\u1ed7i m\u1ea1ng. Ki\u1ec3m tra k\u1ebft n\u1ed1i v\u00e0 th\u1eed l\u1ea1i.",
  "checkout.errorAuth": "Vui l\u00f2ng \u0111\u0103ng nh\u1eadp \u0111\u1ec3 ho\u00e0n t\u1ea5t giao d\u1ecbch.",
  "checkout.errorNotPurchasable": "Phim n\u00e0y hi\u1ec7n kh\u00f4ng b\u00e1n.",
  "checkout.errorEligibility": "Ch\u00fang t\u00f4i kh\u00f4ng x\u00e1c minh \u0111\u01b0\u1ee3c \u0111i\u1ec1u ki\u1ec7n mua c\u1ee7a b\u1ea1n. Vui l\u00f2ng th\u1eed l\u1ea1i.",
  "checkout.errorAccountDeletion": "T\u00e0i kho\u1ea3n \u0111ang \u0111\u01b0\u1ee3c x\u00f3a.",
  "checkout.errorPaymentReview": "M\u1ed9t giao d\u1ecbch tr\u01b0\u1edbc \u0111\u00f3 v\u1eabn \u0111ang \u0111\u01b0\u1ee3c xem x\u00e9t. Li\u00ean h\u1ec7 h\u1ed7 tr\u1ee3 tr\u01b0\u1edbc khi th\u1eed l\u1ea1i.",
  "checkout.errorCheckoutUnusable": "Kh\u00f4ng th\u1ec3 t\u00e1i s\u1eed d\u1ee5ng an to\u00e0n giao d\u1ecbch tr\u01b0\u1edbc \u0111\u00f3. Li\u00ean h\u1ec7 h\u1ed7 tr\u1ee3.",
  "checkout.errorRefunded": "Giao d\u1ecbch n\u00e0y \u0111\u00e3 \u0111\u01b0\u1ee3c ho\u00e0n ti\u1ec1n ho\u1eb7c b\u1ecb khi\u1ebfu n\u1ea1i.",
  "checkout.errorNotFound": "Kh\u00f4ng t\u00ecm th\u1ea5y phim n\u00e0y.",
  "language.audio": "Ti\u1ebfng {language}",
  "language.audioSubs": "Ti\u1ebfng {language} \u00b7 ph\u1ee5 \u0111\u1ec1 {subtitles}",
  "shorts.like": "Th\u00edch", "shorts.liked": "\u0110\u00e3 th\u00edch",
};

const id: Translations = {
  "nav.discover": "Temukan", "nav.shorts": "Pendek", "nav.widescreen": "Layar Lebar",
  "nav.shop": "Toko", "nav.library": "Perpustakaan", "nav.profile": "Profil",
  "header.followUs": "Ikuti kami",
  "browse.startWatchingFree": "Mulai Nonton Gratis", "browse.trending": "Trending", "browse.episodes": "episode", "browse.allShows": "Semua Acara",
  "tab.drama": "Drama", "tab.new": "Baru", "tab.popular": "Hot", "tab.music": "Musik", "tab.reality": "Realitas", "tab.redCarpet": "Karpet Merah",
  "shorts.list": "Daftar", "shorts.saved": "Tersimpan", "shorts.share": "Bagikan", "shorts.copied": "Disalin!", "shorts.sound": "Suara", "shorts.soundOn": "On", "shorts.soundOff": "Off",
  "horizontal.widescreen": "Layar Lebar", "horizontal.episodes": "episode", "horizontal.play": "Putar", "horizontal.pause": "Jeda",
  "profile.guest": "Tamu", "profile.signIn": "Masuk", "profile.signInPrompt": "Masuk untuk menyinkronkan perpustakaan Anda",
  "profile.coinBalance": "Saldo Koin", "profile.coins": "koin", "profile.buyCoins": "Beli Koin",
  "profile.myList": "Daftar Saya", "profile.continueWatching": "Lanjut Menonton", "profile.purchaseHistory": "Riwayat Pembelian",
  "profile.language": "Bahasa", "profile.notifications": "Notifikasi", "profile.darkMode": "Mode Gelap",
  "profile.helpFaq": "Bantuan & FAQ", "profile.sendFeedback": "Kirim Masukan", "profile.reportProblem": "Laporkan Masalah", "profile.signOut": "Keluar",
  "library.title": "Perpustakaan", "library.channels": "Kanal", "library.myList": "Daftar Saya",
  "library.noSavedShows": "Belum ada acara tersimpan", "library.browseShows": "Jelajahi Acara", "library.comingSoon": "Segera Hadir", "library.shows": "acara",
  "auth.signInHeading": "Masuk ke VERZA TV", "auth.signUpHeading": "Buat akun Anda",
  "auth.email": "Alamat email", "auth.displayName": "Nama tampilan",
  "auth.continueWithEmail": "Lanjutkan dengan Email", "auth.continueWithGoogle": "Lanjutkan dengan Google", "auth.continueWithApple": "Lanjutkan dengan Apple",
  "auth.createAccount": "Buat Akun", "auth.continueAsGuest": "Lanjutkan sebagai Tamu",
  "auth.noAccount": "Belum punya akun?", "auth.haveAccount": "Sudah punya akun?", "auth.signUp": "Daftar",
  "legal.terms": "Ketentuan Layanan", "legal.privacy": "Kebijakan Privasi", "legal.refund": "Kebijakan Pengembalian",
  "misc.free": "Gratis", "misc.comingSoon": "Segera Hadir", "misc.close": "Tutup",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.freeEpisodeOf": "Episode gratis {n} dari {total}", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "Free-preview availability varies by title. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
  "paywall.unlockAll": "Buka semua episode",
  "paywall.unavailableTitle": "Episode tidak tersedia",
  "paywall.unavailableBody": "Episode ini tidak tersedia di aplikasi ini.",
  "paywall.previewOver": "Kamu baru saja menonton pratinjau gratis {title}. Jangan berhenti sekarang \u2014 ceritanya baru saja seru.",
  "paywall.benefitEpisodes": "Semua {count} episode, langsung",
  "paywall.benefitAccess": "Akses lewat akun Verza-mu selama judul ini masih tersedia",
  "paywall.oneTimeUnlock": "pembelian serial sekali bayar",
  "paywall.cta": "Buka serial \u2014 {price}, sekali bayar",
  "paywall.ctaLoading": "Membuka pembayaran aman\u2026",
  "paywall.secure": "Pembayaran aman lewat Stripe",
  "paywall.goBack": "Kembali",
  "checkout.errorStart": "Pembayaran tidak dapat dimulai. Silakan coba lagi.",
  "checkout.errorNotOpened": "Halaman pembayaran tidak terbuka. Silakan coba lagi.",
  "checkout.errorNetwork": "Kesalahan jaringan. Periksa koneksimu lalu coba lagi.",
  "checkout.errorAuth": "Masuk dulu untuk menyelesaikan pembelian ini.",
  "checkout.errorNotPurchasable": "Serial ini tidak dijual.",
  "checkout.errorEligibility": "Kami tidak dapat memverifikasi kelayakan pembelianmu. Silakan coba lagi.",
  "checkout.errorAccountDeletion": "Penghapusan akun sedang berlangsung.",
  "checkout.errorPaymentReview": "Pembayaran sebelumnya masih ditinjau. Hubungi dukungan sebelum mencoba lagi.",
  "checkout.errorCheckoutUnusable": "Pembayaran sebelumnya tidak dapat dipakai ulang dengan aman. Hubungi dukungan.",
  "checkout.errorRefunded": "Pembayaran ini telah dikembalikan atau disengketakan.",
  "checkout.errorNotFound": "Serial ini tidak ditemukan.",
  "language.audio": "Audio {language}",
  "language.audioSubs": "Audio {language} \u00b7 subtitle {subtitles}",
  "shorts.like": "Suka", "shorts.liked": "Disukai",
};

const tl: Translations = {
  "nav.discover": "Tuklasin", "nav.shorts": "Shorts", "nav.widescreen": "Widescreen",
  "nav.shop": "Tindahan", "nav.library": "Aklatan", "nav.profile": "Profile",
  "header.followUs": "Sundan kami",
  "browse.startWatchingFree": "Magsimulang Manood Nang Libre", "browse.trending": "Trending", "browse.episodes": "mga episodyo", "browse.allShows": "Lahat ng Palabas",
  "tab.drama": "Drama", "tab.new": "Bago", "tab.popular": "Hot", "tab.music": "Musika", "tab.reality": "Reality", "tab.redCarpet": "Red Carpet",
  "shorts.list": "Listahan", "shorts.saved": "Nai-save", "shorts.share": "I-share", "shorts.copied": "Nakopya!", "shorts.sound": "Tunog", "shorts.soundOn": "On", "shorts.soundOff": "Off",
  "horizontal.widescreen": "Widescreen", "horizontal.episodes": "mga episodyo", "horizontal.play": "I-play", "horizontal.pause": "I-pause",
  "profile.guest": "Bisita", "profile.signIn": "Mag-sign In", "profile.signInPrompt": "Mag-sign in para ma-sync ang iyong aklatan",
  "profile.coinBalance": "Balanse ng Coins", "profile.coins": "coins", "profile.buyCoins": "Bumili ng Coins",
  "profile.myList": "Aking Listahan", "profile.continueWatching": "Ipagpatuloy ang Panonood", "profile.purchaseHistory": "Kasaysayan ng Pagbili",
  "profile.language": "Wika", "profile.notifications": "Mga Abiso", "profile.darkMode": "Dark Mode",
  "profile.helpFaq": "Tulong at FAQ", "profile.sendFeedback": "Magpadala ng Feedback", "profile.reportProblem": "Mag-ulat ng Problema", "profile.signOut": "Mag-sign Out",
  "library.title": "Aklatan", "library.channels": "Mga Channel", "library.myList": "Aking Listahan",
  "library.noSavedShows": "Wala pang naka-save na palabas", "library.browseShows": "Mag-browse ng Palabas", "library.comingSoon": "Malapit Na", "library.shows": "mga palabas",
  "auth.signInHeading": "Mag-sign in sa VERZA TV", "auth.signUpHeading": "Gumawa ng iyong account",
  "auth.email": "Email address", "auth.displayName": "Display name",
  "auth.continueWithEmail": "Magpatuloy gamit ang Email", "auth.continueWithGoogle": "Magpatuloy gamit ang Google", "auth.continueWithApple": "Magpatuloy gamit ang Apple",
  "auth.createAccount": "Gumawa ng Account", "auth.continueAsGuest": "Magpatuloy bilang Bisita",
  "auth.noAccount": "Wala pang account?", "auth.haveAccount": "May account na?", "auth.signUp": "Mag-sign Up",
  "legal.terms": "Mga Tuntunin ng Serbisyo", "legal.privacy": "Patakaran sa Privacy", "legal.refund": "Patakaran sa Refund",
  "misc.free": "Libre", "misc.comingSoon": "Malapit Na", "misc.close": "Isara",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.freeEpisodeOf": "Libreng episode {n} ng {total}", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "Free-preview availability varies by title. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
  "paywall.unlockAll": "I-unlock ang lahat ng episode",
  "paywall.unavailableTitle": "Hindi available ang episode",
  "paywall.unavailableBody": "Hindi available ang episode na ito sa app na ito.",
  "paywall.previewOver": "Katatapos mo lang panoorin ang libreng preview ng {title}. Huwag tumigil \u2014 kasisimula pa lang ng kuwento.",
  "paywall.benefitEpisodes": "Lahat ng {count} episode, agad",
  "paywall.benefitAccess": "Access mula sa iyong Verza account habang available pa ang titulong ito",
  "paywall.oneTimeUnlock": "isang beses na pagbili ng serye",
  "paywall.cta": "I-unlock ang serye \u2014 {price}, isang bayad lang",
  "paywall.ctaLoading": "Binubuksan ang secure na bayad\u2026",
  "paywall.secure": "Secure na bayad sa pamamagitan ng Stripe",
  "paywall.goBack": "Bumalik",
  "checkout.errorStart": "Hindi masimulan ang bayad. Pakisubukan ulit.",
  "checkout.errorNotOpened": "Hindi bumukas ang bayad. Pakisubukan ulit.",
  "checkout.errorNetwork": "May problema sa network. Tingnan ang koneksyon at subukan ulit.",
  "checkout.errorAuth": "Mag-sign in para tapusin ang pagbili.",
  "checkout.errorNotPurchasable": "Hindi ibinebenta ang seryeng ito.",
  "checkout.errorEligibility": "Hindi namin na-verify ang iyong pagiging kwalipikado sa pagbili. Pakisubukan ulit.",
  "checkout.errorAccountDeletion": "Isinasagawa ang pagtanggal ng account.",
  "checkout.errorPaymentReview": "May naunang bayad na sinusuri pa. Makipag-ugnayan sa support bago subukan ulit.",
  "checkout.errorCheckoutUnusable": "Hindi ligtas na magamit muli ang naunang bayad. Makipag-ugnayan sa support.",
  "checkout.errorRefunded": "Na-refund o kinuwestiyon ang bayad na ito.",
  "checkout.errorNotFound": "Hindi mahanap ang seryeng ito.",
  "language.audio": "Audio na {language}",
  "language.audioSubs": "Audio na {language} \u00b7 subtitle na {subtitles}",
  "shorts.like": "Gusto", "shorts.liked": "Nagustuhan",
};

const sw: Translations = {
  "nav.discover": "Gundua", "nav.shorts": "Fupi", "nav.widescreen": "Skrini Pana",
  "nav.shop": "Duka", "nav.library": "Maktaba", "nav.profile": "Wasifu",
  "header.followUs": "Tufuate",
  "browse.startWatchingFree": "Anza Kutazama Bure", "browse.trending": "Inayoendelea", "browse.episodes": "vipindi", "browse.allShows": "Vipindi Vyote",
  "tab.drama": "Drama", "tab.new": "Mpya", "tab.popular": "Hot", "tab.music": "Muziki", "tab.reality": "Uhalisia", "tab.redCarpet": "Zulia Jekundu",
  "shorts.list": "Orodha", "shorts.saved": "Imehifadhiwa", "shorts.share": "Shiriki", "shorts.copied": "Imenakiliwa!", "shorts.sound": "Sauti", "shorts.soundOn": "Washa", "shorts.soundOff": "Zima",
  "horizontal.widescreen": "Skrini Pana", "horizontal.episodes": "vipindi", "horizontal.play": "Cheza", "horizontal.pause": "Sitisha",
  "profile.guest": "Mgeni", "profile.signIn": "Ingia", "profile.signInPrompt": "Ingia ili kusawazisha maktaba yako",
  "profile.coinBalance": "Salio la Sarafu", "profile.coins": "sarafu", "profile.buyCoins": "Nunua Sarafu",
  "profile.myList": "Orodha Yangu", "profile.continueWatching": "Endelea Kutazama", "profile.purchaseHistory": "Historia ya Ununuzi",
  "profile.language": "Lugha", "profile.notifications": "Arifa", "profile.darkMode": "Hali ya Giza",
  "profile.helpFaq": "Msaada na Maswali", "profile.sendFeedback": "Tuma Maoni", "profile.reportProblem": "Ripoti Tatizo", "profile.signOut": "Ondoka",
  "library.title": "Maktaba", "library.channels": "Vituo", "library.myList": "Orodha Yangu",
  "library.noSavedShows": "Hakuna vipindi vilivyohifadhiwa", "library.browseShows": "Vinjari Vipindi", "library.comingSoon": "Inakuja Hivi Karibuni", "library.shows": "vipindi",
  "auth.signInHeading": "Ingia kwenye VERZA TV", "auth.signUpHeading": "Fungua akaunti yako",
  "auth.email": "Anwani ya barua pepe", "auth.displayName": "Jina la kuonyesha",
  "auth.continueWithEmail": "Endelea na Barua Pepe", "auth.continueWithGoogle": "Endelea na Google", "auth.continueWithApple": "Endelea na Apple",
  "auth.createAccount": "Fungua Akaunti", "auth.continueAsGuest": "Endelea kama Mgeni",
  "auth.noAccount": "Huna akaunti?", "auth.haveAccount": "Una akaunti tayari?", "auth.signUp": "Jisajili",
  "legal.terms": "Masharti ya Huduma", "legal.privacy": "Sera ya Faragha", "legal.refund": "Sera ya Kurejesha Pesa",
  "misc.free": "Bure", "misc.comingSoon": "Inakuja Hivi Karibuni", "misc.close": "Funga",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.freeEpisodeOf": "Kipindi cha bure {n} kati ya {total}", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "Free-preview availability varies by title. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
  "paywall.unlockAll": "Fungua vipindi vyote",
  "paywall.unavailableTitle": "Kipindi hakipatikani",
  "paywall.unavailableBody": "Kipindi hiki hakipatikani katika programu hii.",
  "paywall.previewOver": "Umemaliza kutazama onyesho la bure la {title}. Usisimame sasa \u2014 hadithi ndiyo kwanza inanoga.",
  "paywall.benefitEpisodes": "Vipindi vyote {count}, papo hapo",
  "paywall.benefitAccess": "Tazama kupitia akaunti yako ya Verza kwa muda ambao kichwa hiki kinapatikana",
  "paywall.oneTimeUnlock": "ununuzi wa mfululizo wa mara moja",
  "paywall.cta": "Fungua mfululizo \u2014 {price}, malipo ya mara moja",
  "paywall.ctaLoading": "Inafungua malipo salama\u2026",
  "paywall.secure": "Malipo salama kupitia Stripe",
  "paywall.goBack": "Rudi nyuma",
  "checkout.errorStart": "Malipo hayakuweza kuanza. Tafadhali jaribu tena.",
  "checkout.errorNotOpened": "Ukurasa wa malipo haukufunguka. Tafadhali jaribu tena.",
  "checkout.errorNetwork": "Hitilafu ya mtandao. Angalia muunganisho wako kisha ujaribu tena.",
  "checkout.errorAuth": "Ingia ili kukamilisha ununuzi huu.",
  "checkout.errorNotPurchasable": "Mfululizo huu hauuzwi.",
  "checkout.errorEligibility": "Hatukuweza kuthibitisha ustahiki wako wa ununuzi. Tafadhali jaribu tena.",
  "checkout.errorAccountDeletion": "Ufutaji wa akaunti unaendelea.",
  "checkout.errorPaymentReview": "Malipo ya awali bado yanakaguliwa. Wasiliana na usaidizi kabla ya kujaribu tena.",
  "checkout.errorCheckoutUnusable": "Malipo ya awali hayakuweza kutumika tena kwa usalama. Wasiliana na usaidizi.",
  "checkout.errorRefunded": "Malipo haya yamerejeshwa au yamepingwa.",
  "checkout.errorNotFound": "Mfululizo huu haukupatikana.",
  "language.audio": "Sauti ya {language}",
  "language.audioSubs": "Sauti ya {language} \u00b7 manukuu ya {subtitles}",
  "shorts.like": "Penda", "shorts.liked": "Umependa",
};

/* All 20 languages fully translated */
export const dictionaries: Record<Locale, Translations> = {
  en, es, fr, pt, de, it, ja, ko, zh, hi,
  ar, ru, tr, pl, nl, th, vi, id, tl, sw,
};

export const DEFAULT_LOCALE: Locale = "en";
export const STORAGE_KEY = "verza-lang";

/* ================================================================== */
/*  Interpolation                                                      */
/* ================================================================== */

/**
 * Substitute {name} placeholders in a translated string.
 *
 * Every locale's copy is authored around the SAME placeholder names, so the
 * word order can differ per language without the call site knowing. This is
 * why the paywall's price, series title and episode count are placeholders
 * rather than JSX concatenation: "Series Unlock — $1.99 one-time" built by
 * gluing three JSX fragments together cannot be reordered by a translator, and
 * German, Japanese and Arabic all need to reorder it.
 *
 * An unknown placeholder is left verbatim rather than replaced with
 * "undefined" — a missing variable must read as a bug, not as a price.
 */
export function interpolate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    Object.hasOwn(vars, name) ? String(vars[name]) : whole,
  );
}

/* ================================================================== */
/*  Locale detection                                                   */
/* ================================================================== */

/**
 * Resolve the first supported locale from a list of BCP-47 tags.
 *
 * LangProvider used to start at "en" and hydrate ONLY from localStorage, so a
 * first-time visitor whose browser says `Accept-Language: es-ES` got English
 * and had to find the language switcher — which is hidden entirely on the
 * episode route (`app/globals.css` hides the header under `.episode-immersive`).
 *
 * Matching is on the primary subtag: "es-419", "es-MX" and "es-ES" all resolve
 * to "es", because the dictionary is per-language, not per-region.
 */
export function resolveLocale(tags: readonly string[]): Locale | null {
  for (const tag of tags) {
    if (!tag) continue;
    const primary = tag.toLowerCase().split(/[-_]/)[0];
    const hit = LOCALES.find((l) => l.code === primary);
    if (hit) return hit.code;
  }
  return null;
}

/* ================================================================== */
/*  Language names                                                     */
/* ================================================================== */

/**
 * The name of a language, written in the viewer's language.
 *
 * "Hindi" for an English viewer, "hindi" for a Spanish one, "हिन्दी" for a
 * Hindi one. Intl.DisplayNames carries all 20 UI locales, so this needs no
 * dictionary entries and cannot drift out of sync with the locale list.
 *
 * The fallback is the LOCALES table's English label and then the raw tag, so
 * an engine without DisplayNames (or an unusual tag) still labels the audio
 * track with a word rather than with nothing.
 */
export function languageName(uiLocale: string, languageTag: string): string {
  try {
    const name = new Intl.DisplayNames([uiLocale], { type: "language" }).of(
      languageTag,
    );
    if (name && name !== languageTag) return name;
  } catch {
    /* fall through */
  }
  return LOCALES.find((l) => l.code === languageTag)?.label ?? languageTag;
}
