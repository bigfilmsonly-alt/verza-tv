/* ================================================================== */
/*  i18n — client-side language switching for Verza TV                 */
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
  "tab.drama": "Drama", "tab.new": "New", "tab.popular": "Popular", "tab.music": "Music", "tab.reality": "Reality", "tab.redCarpet": "Red Carpet",
  "shorts.list": "List", "shorts.saved": "Saved", "shorts.share": "Share", "shorts.copied": "Copied!", "shorts.sound": "Sound", "shorts.soundOn": "On", "shorts.soundOff": "Off",
  "horizontal.widescreen": "Widescreen", "horizontal.episodes": "episodes", "horizontal.play": "Play", "horizontal.pause": "Pause",
  "profile.guest": "Guest", "profile.signIn": "Sign In", "profile.signInPrompt": "Sign in to sync your library and purchases",
  "profile.coinBalance": "Coin Balance", "profile.coins": "coins", "profile.buyCoins": "Buy Coins",
  "profile.myList": "My List", "profile.continueWatching": "Continue Watching", "profile.purchaseHistory": "Purchase History",
  "profile.language": "Language", "profile.notifications": "Notifications", "profile.darkMode": "Dark Mode",
  "profile.helpFaq": "Help & FAQs", "profile.sendFeedback": "Send Feedback", "profile.reportProblem": "Report a Problem", "profile.signOut": "Sign Out",
  "library.title": "Library", "library.channels": "Channels", "library.myList": "My List",
  "library.noSavedShows": "No saved shows yet", "library.browseShows": "Browse Shows", "library.comingSoon": "Coming Soon", "library.shows": "shows",
  "auth.signInHeading": "Sign in to Verza TV", "auth.signUpHeading": "Create your account",
  "auth.email": "Email address", "auth.displayName": "Display name",
  "auth.continueWithEmail": "Continue with Email", "auth.continueWithGoogle": "Continue with Google", "auth.continueWithApple": "Continue with Apple",
  "auth.createAccount": "Create Account", "auth.continueAsGuest": "Continue as Guest",
  "auth.noAccount": "Don\u2019t have an account?", "auth.haveAccount": "Already have an account?", "auth.signUp": "Sign Up",
  "legal.terms": "Terms of Service", "legal.privacy": "Privacy Policy", "legal.refund": "Refund Policy",
  "misc.free": "Free", "misc.comingSoon": "Coming Soon", "misc.close": "Close",
};

const es: Translations = {
  "nav.discover": "Descubrir", "nav.shorts": "Cortos", "nav.widescreen": "Panor\u00e1mico",
  "nav.shop": "Tienda", "nav.library": "Biblioteca", "nav.profile": "Perfil",
  "header.followUs": "S\u00edguenos",
  "browse.startWatchingFree": "Empieza a Ver Gratis", "browse.trending": "Tendencia", "browse.episodes": "episodios", "browse.allShows": "Todas las Series",
  "tab.drama": "Drama", "tab.new": "Nuevo", "tab.popular": "Popular", "tab.music": "M\u00fasica", "tab.reality": "Reality", "tab.redCarpet": "Alfombra Roja",
  "shorts.list": "Lista", "shorts.saved": "Guardado", "shorts.share": "Compartir", "shorts.copied": "\u00a1Copiado!", "shorts.sound": "Sonido", "shorts.soundOn": "On", "shorts.soundOff": "Off",
  "horizontal.widescreen": "Panor\u00e1mico", "horizontal.episodes": "episodios", "horizontal.play": "Reproducir", "horizontal.pause": "Pausa",
  "profile.guest": "Invitado", "profile.signIn": "Iniciar Sesi\u00f3n", "profile.signInPrompt": "Inicia sesi\u00f3n para sincronizar tu biblioteca",
  "profile.coinBalance": "Saldo de Monedas", "profile.coins": "monedas", "profile.buyCoins": "Comprar Monedas",
  "profile.myList": "Mi Lista", "profile.continueWatching": "Seguir Viendo", "profile.purchaseHistory": "Historial de Compras",
  "profile.language": "Idioma", "profile.notifications": "Notificaciones", "profile.darkMode": "Modo Oscuro",
  "profile.helpFaq": "Ayuda y Preguntas", "profile.sendFeedback": "Enviar Comentarios", "profile.reportProblem": "Reportar Problema", "profile.signOut": "Cerrar Sesi\u00f3n",
  "library.title": "Biblioteca", "library.channels": "Canales", "library.myList": "Mi Lista",
  "library.noSavedShows": "No hay series guardadas", "library.browseShows": "Ver Series", "library.comingSoon": "Pr\u00f3ximamente", "library.shows": "series",
  "auth.signInHeading": "Inicia sesi\u00f3n en Verza TV", "auth.signUpHeading": "Crea tu cuenta",
  "auth.email": "Correo electr\u00f3nico", "auth.displayName": "Nombre",
  "auth.continueWithEmail": "Continuar con Email", "auth.continueWithGoogle": "Continuar con Google", "auth.continueWithApple": "Continuar con Apple",
  "auth.createAccount": "Crear Cuenta", "auth.continueAsGuest": "Continuar como Invitado",
  "auth.noAccount": "\u00bfNo tienes cuenta?", "auth.haveAccount": "\u00bfYa tienes cuenta?", "auth.signUp": "Registrarse",
  "legal.terms": "T\u00e9rminos de Servicio", "legal.privacy": "Pol\u00edtica de Privacidad", "legal.refund": "Pol\u00edtica de Reembolso",
  "misc.free": "Gratis", "misc.comingSoon": "Pr\u00f3ximamente", "misc.close": "Cerrar",
};

const fr: Translations = {
  "nav.discover": "D\u00e9couvrir", "nav.shorts": "Courts", "nav.widescreen": "\u00c9cran Large",
  "nav.shop": "Boutique", "nav.library": "Biblioth\u00e8que", "nav.profile": "Profil",
  "header.followUs": "Suivez-nous",
  "browse.startWatchingFree": "Regarder Gratuitement", "browse.trending": "Tendances", "browse.episodes": "\u00e9pisodes", "browse.allShows": "Toutes les S\u00e9ries",
  "tab.drama": "Drame", "tab.new": "Nouveau", "tab.popular": "Populaire", "tab.music": "Musique", "tab.reality": "T\u00e9l\u00e9r\u00e9alit\u00e9", "tab.redCarpet": "Tapis Rouge",
  "shorts.list": "Liste", "shorts.saved": "Enregistr\u00e9", "shorts.share": "Partager", "shorts.copied": "Copi\u00e9!", "shorts.sound": "Son", "shorts.soundOn": "On", "shorts.soundOff": "Off",
  "horizontal.widescreen": "\u00c9cran Large", "horizontal.episodes": "\u00e9pisodes", "horizontal.play": "Lire", "horizontal.pause": "Pause",
  "profile.guest": "Invit\u00e9", "profile.signIn": "Se Connecter", "profile.signInPrompt": "Connectez-vous pour synchroniser votre biblioth\u00e8que",
  "profile.coinBalance": "Solde de Pi\u00e8ces", "profile.coins": "pi\u00e8ces", "profile.buyCoins": "Acheter des Pi\u00e8ces",
  "profile.myList": "Ma Liste", "profile.continueWatching": "Continuer \u00e0 Regarder", "profile.purchaseHistory": "Historique d\u2019Achats",
  "profile.language": "Langue", "profile.notifications": "Notifications", "profile.darkMode": "Mode Sombre",
  "profile.helpFaq": "Aide et FAQ", "profile.sendFeedback": "Envoyer un Commentaire", "profile.reportProblem": "Signaler un Probl\u00e8me", "profile.signOut": "Se D\u00e9connecter",
  "library.title": "Biblioth\u00e8que", "library.channels": "Cha\u00eenes", "library.myList": "Ma Liste",
  "library.noSavedShows": "Aucune s\u00e9rie enregistr\u00e9e", "library.browseShows": "Parcourir les S\u00e9ries", "library.comingSoon": "Bient\u00f4t", "library.shows": "s\u00e9ries",
  "auth.signInHeading": "Connectez-vous \u00e0 Verza TV", "auth.signUpHeading": "Cr\u00e9ez votre compte",
  "auth.email": "Adresse email", "auth.displayName": "Nom d\u2019affichage",
  "auth.continueWithEmail": "Continuer par Email", "auth.continueWithGoogle": "Continuer avec Google", "auth.continueWithApple": "Continuer avec Apple",
  "auth.createAccount": "Cr\u00e9er un Compte", "auth.continueAsGuest": "Continuer en tant qu\u2019Invit\u00e9",
  "auth.noAccount": "Pas de compte?", "auth.haveAccount": "D\u00e9j\u00e0 un compte?", "auth.signUp": "S\u2019inscrire",
  "legal.terms": "Conditions d\u2019Utilisation", "legal.privacy": "Politique de Confidentialit\u00e9", "legal.refund": "Politique de Remboursement",
  "misc.free": "Gratuit", "misc.comingSoon": "Bient\u00f4t", "misc.close": "Fermer",
};

const pt: Translations = {
  "nav.discover": "Descobrir", "nav.shorts": "Curtos", "nav.widescreen": "Tela Cheia",
  "nav.shop": "Loja", "nav.library": "Biblioteca", "nav.profile": "Perfil",
  "header.followUs": "Siga-nos",
  "browse.startWatchingFree": "Comece a Assistir Gr\u00e1tis", "browse.trending": "Em Alta", "browse.episodes": "epis\u00f3dios", "browse.allShows": "Todas as S\u00e9ries",
  "tab.drama": "Drama", "tab.new": "Novo", "tab.popular": "Popular", "tab.music": "M\u00fasica", "tab.reality": "Reality", "tab.redCarpet": "Tapete Vermelho",
  "shorts.list": "Lista", "shorts.saved": "Salvo", "shorts.share": "Compartilhar", "shorts.copied": "Copiado!", "shorts.sound": "Som", "shorts.soundOn": "On", "shorts.soundOff": "Off",
  "horizontal.widescreen": "Tela Cheia", "horizontal.episodes": "epis\u00f3dios", "horizontal.play": "Reproduzir", "horizontal.pause": "Pausar",
  "profile.guest": "Convidado", "profile.signIn": "Entrar", "profile.signInPrompt": "Entre para sincronizar sua biblioteca",
  "profile.coinBalance": "Saldo de Moedas", "profile.coins": "moedas", "profile.buyCoins": "Comprar Moedas",
  "profile.myList": "Minha Lista", "profile.continueWatching": "Continuar Assistindo", "profile.purchaseHistory": "Hist\u00f3rico de Compras",
  "profile.language": "Idioma", "profile.notifications": "Notifica\u00e7\u00f5es", "profile.darkMode": "Modo Escuro",
  "profile.helpFaq": "Ajuda e FAQ", "profile.sendFeedback": "Enviar Feedback", "profile.reportProblem": "Reportar Problema", "profile.signOut": "Sair",
  "library.title": "Biblioteca", "library.channels": "Canais", "library.myList": "Minha Lista",
  "library.noSavedShows": "Nenhuma s\u00e9rie salva", "library.browseShows": "Explorar S\u00e9ries", "library.comingSoon": "Em Breve", "library.shows": "s\u00e9ries",
  "auth.signInHeading": "Entre no Verza TV", "auth.signUpHeading": "Crie sua conta",
  "auth.email": "Endere\u00e7o de email", "auth.displayName": "Nome de exibi\u00e7\u00e3o",
  "auth.continueWithEmail": "Continuar com Email", "auth.continueWithGoogle": "Continuar com Google", "auth.continueWithApple": "Continuar com Apple",
  "auth.createAccount": "Criar Conta", "auth.continueAsGuest": "Continuar como Convidado",
  "auth.noAccount": "N\u00e3o tem conta?", "auth.haveAccount": "J\u00e1 tem conta?", "auth.signUp": "Cadastrar",
  "legal.terms": "Termos de Servi\u00e7o", "legal.privacy": "Pol\u00edtica de Privacidade", "legal.refund": "Pol\u00edtica de Reembolso",
  "misc.free": "Gr\u00e1tis", "misc.comingSoon": "Em Breve", "misc.close": "Fechar",
};

/* Other locales fall back to English — add full translations as needed */
export const dictionaries: Record<Locale, Translations> = {
  en, es, fr, pt,
  de: en, it: en, ja: en, ko: en, zh: en, hi: en,
  ar: en, ru: en, tr: en, pl: en, nl: en, th: en,
  vi: en, id: en, tl: en, sw: en,
};

export const DEFAULT_LOCALE: Locale = "en";
export const STORAGE_KEY = "verza-lang";
