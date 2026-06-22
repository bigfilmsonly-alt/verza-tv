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
  "content.trending": string;
  "content.watchFree": string;
  "content.unlockSeries": string;
  "content.oneTimePayment": string;
  "content.allEpisodesIncluded": string;
  "content.episodeLocked": string;
  "content.unlockPrompt": string;
  "content.tryAgain": string;
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
  "auth.signInHeading": "Sign in to Verza TV", "auth.signUpHeading": "Create your account",
  "auth.email": "Email address", "auth.displayName": "Display name",
  "auth.continueWithEmail": "Continue with Email", "auth.continueWithGoogle": "Continue with Google", "auth.continueWithApple": "Continue with Apple",
  "auth.createAccount": "Create Account", "auth.continueAsGuest": "Continue as Guest",
  "auth.noAccount": "Don\u2019t have an account?", "auth.haveAccount": "Already have an account?", "auth.signUp": "Sign Up",
  "legal.terms": "Terms of Service", "legal.privacy": "Privacy Policy", "legal.refund": "Refund Policy",
  "misc.free": "Free", "misc.comingSoon": "Coming Soon", "misc.close": "Close",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "The first 5 episodes are free. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
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
  "content.synopsis": "Sinopsis", "content.episodes": "Episodios", "content.cast": "Reparto", "content.moreLikeThis": "M\u00e1s Como Esto", "content.views": "vistas", "content.now": "AHORA", "content.info": "Info", "content.allEpisodes": "Todos los Episodios", "content.previous": "Anterior", "content.next": "Siguiente", "content.episodeOf": "Episodio {n} de {total}", "content.trending": "Tendencia", "content.watchFree": "Ver Episodio 1 Gratis", "content.unlockSeries": "Desbloquear Serie Completa", "content.oneTimePayment": "Pago \u00fanico", "content.allEpisodesIncluded": "Todos los episodios incluidos", "content.episodeLocked": "El episodio {n} est\u00e1 bloqueado", "content.unlockPrompt": "Los primeros 5 episodios son gratis. Desbloquea la serie completa.", "content.tryAgain": "Intentar de Nuevo",
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
  "content.synopsis": "Synopsis", "content.episodes": "\u00c9pisodes", "content.cast": "Distribution", "content.moreLikeThis": "Dans le M\u00eame Genre", "content.views": "vues", "content.now": "EN COURS", "content.info": "Info", "content.allEpisodes": "Tous les \u00c9pisodes", "content.previous": "Pr\u00e9c\u00e9dent", "content.next": "Suivant", "content.episodeOf": "\u00c9pisode {n} sur {total}", "content.trending": "Tendances", "content.watchFree": "Regarder l\u2019\u00c9pisode 1 Gratuitement", "content.unlockSeries": "D\u00e9bloquer la S\u00e9rie", "content.oneTimePayment": "Paiement unique", "content.allEpisodesIncluded": "Tous les \u00e9pisodes inclus", "content.episodeLocked": "L\u2019\u00e9pisode {n} est verrouill\u00e9", "content.unlockPrompt": "Les 5 premiers \u00e9pisodes sont gratuits. D\u00e9bloquez la s\u00e9rie compl\u00e8te.", "content.tryAgain": "R\u00e9essayer",
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
  "content.synopsis": "Sinopse", "content.episodes": "Epis\u00f3dios", "content.cast": "Elenco", "content.moreLikeThis": "Mais Como Isto", "content.views": "visualiza\u00e7\u00f5es", "content.now": "AGORA", "content.info": "Info", "content.allEpisodes": "Todos os Epis\u00f3dios", "content.previous": "Anterior", "content.next": "Pr\u00f3ximo", "content.episodeOf": "Epis\u00f3dio {n} de {total}", "content.trending": "Em Alta", "content.watchFree": "Assistir Epis\u00f3dio 1 Gr\u00e1tis", "content.unlockSeries": "Desbloquear S\u00e9rie", "content.oneTimePayment": "Pagamento \u00fanico", "content.allEpisodesIncluded": "Todos os epis\u00f3dios inclu\u00eddos", "content.episodeLocked": "O epis\u00f3dio {n} est\u00e1 bloqueado", "content.unlockPrompt": "Os primeiros 5 epis\u00f3dios s\u00e3o gr\u00e1tis. Desbloqueie a s\u00e9rie completa.", "content.tryAgain": "Tentar Novamente",
};

const de: Translations = {
  "nav.discover": "Entdecken", "nav.shorts": "Kurzfilme", "nav.widescreen": "Breitbild",
  "nav.shop": "Shop", "nav.library": "Bibliothek", "nav.profile": "Profil",
  "header.followUs": "Folgt uns",
  "browse.startWatchingFree": "Jetzt kostenlos ansehen", "browse.trending": "Im Trend", "browse.episodes": "Episoden", "browse.allShows": "Alle Serien",
  "tab.drama": "Drama", "tab.new": "Neu", "tab.popular": "Beliebt", "tab.music": "Musik", "tab.reality": "Reality", "tab.redCarpet": "Roter Teppich",
  "shorts.list": "Liste", "shorts.saved": "Gespeichert", "shorts.share": "Teilen", "shorts.copied": "Kopiert!", "shorts.sound": "Ton", "shorts.soundOn": "An", "shorts.soundOff": "Aus",
  "horizontal.widescreen": "Breitbild", "horizontal.episodes": "Episoden", "horizontal.play": "Abspielen", "horizontal.pause": "Pause",
  "profile.guest": "Gast", "profile.signIn": "Anmelden", "profile.signInPrompt": "Melden Sie sich an, um Ihre Bibliothek zu synchronisieren",
  "profile.coinBalance": "Kontostand", "profile.coins": "M\u00fcnzen", "profile.buyCoins": "M\u00fcnzen kaufen",
  "profile.myList": "Meine Liste", "profile.continueWatching": "Weiterschauen", "profile.purchaseHistory": "Kaufverlauf",
  "profile.language": "Sprache", "profile.notifications": "Benachrichtigungen", "profile.darkMode": "Dunkler Modus",
  "profile.helpFaq": "Hilfe & FAQ", "profile.sendFeedback": "Feedback senden", "profile.reportProblem": "Problem melden", "profile.signOut": "Abmelden",
  "library.title": "Bibliothek", "library.channels": "Kan\u00e4le", "library.myList": "Meine Liste",
  "library.noSavedShows": "Noch keine gespeicherten Serien", "library.browseShows": "Serien durchsuchen", "library.comingSoon": "Demn\u00e4chst", "library.shows": "Serien",
  "auth.signInHeading": "Bei Verza TV anmelden", "auth.signUpHeading": "Konto erstellen",
  "auth.email": "E-Mail-Adresse", "auth.displayName": "Anzeigename",
  "auth.continueWithEmail": "Weiter mit E-Mail", "auth.continueWithGoogle": "Weiter mit Google", "auth.continueWithApple": "Weiter mit Apple",
  "auth.createAccount": "Konto erstellen", "auth.continueAsGuest": "Als Gast fortfahren",
  "auth.noAccount": "Noch kein Konto?", "auth.haveAccount": "Bereits ein Konto?", "auth.signUp": "Registrieren",
  "legal.terms": "Nutzungsbedingungen", "legal.privacy": "Datenschutzrichtlinie", "legal.refund": "R\u00fcckerstattungsrichtlinie",
  "misc.free": "Kostenlos", "misc.comingSoon": "Demn\u00e4chst", "misc.close": "Schlie\u00dfen",
  "content.synopsis": "Zusammenfassung", "content.episodes": "Episoden", "content.cast": "Besetzung", "content.moreLikeThis": "\u00c4hnliches", "content.views": "Aufrufe", "content.now": "JETZT", "content.info": "Info", "content.allEpisodes": "Alle Episoden", "content.previous": "Zur\u00fcck", "content.next": "Weiter", "content.episodeOf": "Episode {n} von {total}", "content.trending": "Im Trend", "content.watchFree": "Episode 1 Kostenlos Ansehen", "content.unlockSeries": "Serie Freischalten", "content.oneTimePayment": "Einmalzahlung", "content.allEpisodesIncluded": "Alle Episoden enthalten", "content.episodeLocked": "Episode {n} ist gesperrt", "content.unlockPrompt": "Die ersten 5 Episoden sind kostenlos. Schalte die ganze Serie frei.", "content.tryAgain": "Erneut Versuchen",
};

const it: Translations = {
  "nav.discover": "Scopri", "nav.shorts": "Corti", "nav.widescreen": "Panoramico",
  "nav.shop": "Negozio", "nav.library": "Libreria", "nav.profile": "Profilo",
  "header.followUs": "Seguici",
  "browse.startWatchingFree": "Inizia a Guardare Gratis", "browse.trending": "Di Tendenza", "browse.episodes": "episodi", "browse.allShows": "Tutte le Serie",
  "tab.drama": "Drama", "tab.new": "Nuovo", "tab.popular": "Popolare", "tab.music": "Musica", "tab.reality": "Reality", "tab.redCarpet": "Red Carpet",
  "shorts.list": "Lista", "shorts.saved": "Salvato", "shorts.share": "Condividi", "shorts.copied": "Copiato!", "shorts.sound": "Audio", "shorts.soundOn": "On", "shorts.soundOff": "Off",
  "horizontal.widescreen": "Panoramico", "horizontal.episodes": "episodi", "horizontal.play": "Riproduci", "horizontal.pause": "Pausa",
  "profile.guest": "Ospite", "profile.signIn": "Accedi", "profile.signInPrompt": "Accedi per sincronizzare la tua libreria",
  "profile.coinBalance": "Saldo Monete", "profile.coins": "monete", "profile.buyCoins": "Acquista Monete",
  "profile.myList": "La Mia Lista", "profile.continueWatching": "Continua a Guardare", "profile.purchaseHistory": "Cronologia Acquisti",
  "profile.language": "Lingua", "profile.notifications": "Notifiche", "profile.darkMode": "Modalit\u00e0 Scura",
  "profile.helpFaq": "Aiuto e FAQ", "profile.sendFeedback": "Invia Feedback", "profile.reportProblem": "Segnala un Problema", "profile.signOut": "Esci",
  "library.title": "Libreria", "library.channels": "Canali", "library.myList": "La Mia Lista",
  "library.noSavedShows": "Nessuna serie salvata", "library.browseShows": "Sfoglia le Serie", "library.comingSoon": "In Arrivo", "library.shows": "serie",
  "auth.signInHeading": "Accedi a Verza TV", "auth.signUpHeading": "Crea il tuo account",
  "auth.email": "Indirizzo email", "auth.displayName": "Nome visualizzato",
  "auth.continueWithEmail": "Continua con Email", "auth.continueWithGoogle": "Continua con Google", "auth.continueWithApple": "Continua con Apple",
  "auth.createAccount": "Crea Account", "auth.continueAsGuest": "Continua come Ospite",
  "auth.noAccount": "Non hai un account?", "auth.haveAccount": "Hai gi\u00e0 un account?", "auth.signUp": "Registrati",
  "legal.terms": "Termini di Servizio", "legal.privacy": "Informativa sulla Privacy", "legal.refund": "Politica di Rimborso",
  "misc.free": "Gratuito", "misc.comingSoon": "In Arrivo", "misc.close": "Chiudi",
  "content.synopsis": "Trama", "content.episodes": "Episodi", "content.cast": "Cast", "content.moreLikeThis": "Simili", "content.views": "visualizzazioni", "content.now": "ORA", "content.info": "Info", "content.allEpisodes": "Tutti gli Episodi", "content.previous": "Precedente", "content.next": "Successivo", "content.episodeOf": "Episodio {n} di {total}", "content.trending": "Di Tendenza", "content.watchFree": "Guarda Episodio 1 Gratis", "content.unlockSeries": "Sblocca la Serie", "content.oneTimePayment": "Pagamento unico", "content.allEpisodesIncluded": "Tutti gli episodi inclusi", "content.episodeLocked": "L\u2019episodio {n} \u00e8 bloccato", "content.unlockPrompt": "I primi 5 episodi sono gratuiti. Sblocca la serie completa.", "content.tryAgain": "Riprova",
};

const ja: Translations = {
  "nav.discover": "\u767a\u898b", "nav.shorts": "\u30b7\u30e7\u30fc\u30c8", "nav.widescreen": "\u30ef\u30a4\u30c9\u30b9\u30af\u30ea\u30fc\u30f3",
  "nav.shop": "\u30b7\u30e7\u30c3\u30d7", "nav.library": "\u30e9\u30a4\u30d6\u30e9\u30ea", "nav.profile": "\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb",
  "header.followUs": "\u30d5\u30a9\u30ed\u30fc\u3059\u308b",
  "browse.startWatchingFree": "\u7121\u6599\u3067\u8996\u8074\u958b\u59cb", "browse.trending": "\u30c8\u30ec\u30f3\u30c9", "browse.episodes": "\u30a8\u30d4\u30bd\u30fc\u30c9", "browse.allShows": "\u3059\u3079\u3066\u306e\u756a\u7d44",
  "tab.drama": "\u30c9\u30e9\u30de", "tab.new": "\u65b0\u7740", "tab.popular": "\u4eba\u6c17", "tab.music": "\u97f3\u697d", "tab.reality": "\u30ea\u30a2\u30ea\u30c6\u30a3", "tab.redCarpet": "\u30ec\u30c3\u30c9\u30ab\u30fc\u30da\u30c3\u30c8",
  "shorts.list": "\u30ea\u30b9\u30c8", "shorts.saved": "\u4fdd\u5b58\u6e08\u307f", "shorts.share": "\u5171\u6709", "shorts.copied": "\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f\uff01", "shorts.sound": "\u30b5\u30a6\u30f3\u30c9", "shorts.soundOn": "\u30aa\u30f3", "shorts.soundOff": "\u30aa\u30d5",
  "horizontal.widescreen": "\u30ef\u30a4\u30c9\u30b9\u30af\u30ea\u30fc\u30f3", "horizontal.episodes": "\u30a8\u30d4\u30bd\u30fc\u30c9", "horizontal.play": "\u518d\u751f", "horizontal.pause": "\u4e00\u6642\u505c\u6b62",
  "profile.guest": "\u30b2\u30b9\u30c8", "profile.signIn": "\u30b5\u30a4\u30f3\u30a4\u30f3", "profile.signInPrompt": "\u30e9\u30a4\u30d6\u30e9\u30ea\u3092\u540c\u671f\u3059\u308b\u306b\u306f\u30b5\u30a4\u30f3\u30a4\u30f3",
  "profile.coinBalance": "\u30b3\u30a4\u30f3\u6b8b\u9ad8", "profile.coins": "\u30b3\u30a4\u30f3", "profile.buyCoins": "\u30b3\u30a4\u30f3\u3092\u8cfc\u5165",
  "profile.myList": "\u30de\u30a4\u30ea\u30b9\u30c8", "profile.continueWatching": "\u8996\u8074\u3092\u7d9a\u3051\u308b", "profile.purchaseHistory": "\u8cfc\u5165\u5c65\u6b74",
  "profile.language": "\u8a00\u8a9e", "profile.notifications": "\u901a\u77e5", "profile.darkMode": "\u30c0\u30fc\u30af\u30e2\u30fc\u30c9",
  "profile.helpFaq": "\u30d8\u30eb\u30d7\u3068FAQ", "profile.sendFeedback": "\u30d5\u30a3\u30fc\u30c9\u30d0\u30c3\u30af\u3092\u9001\u4fe1", "profile.reportProblem": "\u554f\u984c\u3092\u5831\u544a", "profile.signOut": "\u30b5\u30a4\u30f3\u30a2\u30a6\u30c8",
  "library.title": "\u30e9\u30a4\u30d6\u30e9\u30ea", "library.channels": "\u30c1\u30e3\u30f3\u30cd\u30eb", "library.myList": "\u30de\u30a4\u30ea\u30b9\u30c8",
  "library.noSavedShows": "\u4fdd\u5b58\u3055\u308c\u305f\u756a\u7d44\u306f\u3042\u308a\u307e\u305b\u3093", "library.browseShows": "\u756a\u7d44\u3092\u63a2\u3059", "library.comingSoon": "\u8fd1\u65e5\u516c\u958b", "library.shows": "\u756a\u7d44",
  "auth.signInHeading": "Verza TV\u306b\u30b5\u30a4\u30f3\u30a4\u30f3", "auth.signUpHeading": "\u30a2\u30ab\u30a6\u30f3\u30c8\u3092\u4f5c\u6210",
  "auth.email": "\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9", "auth.displayName": "\u8868\u793a\u540d",
  "auth.continueWithEmail": "\u30e1\u30fc\u30eb\u3067\u7d9a\u884c", "auth.continueWithGoogle": "Google\u3067\u7d9a\u884c", "auth.continueWithApple": "Apple\u3067\u7d9a\u884c",
  "auth.createAccount": "\u30a2\u30ab\u30a6\u30f3\u30c8\u4f5c\u6210", "auth.continueAsGuest": "\u30b2\u30b9\u30c8\u3068\u3057\u3066\u7d9a\u884c",
  "auth.noAccount": "\u30a2\u30ab\u30a6\u30f3\u30c8\u3092\u304a\u6301\u3061\u3067\u306a\u3044\u65b9", "auth.haveAccount": "\u30a2\u30ab\u30a6\u30f3\u30c8\u3092\u304a\u6301\u3061\u306e\u65b9", "auth.signUp": "\u65b0\u898f\u767b\u9332",
  "legal.terms": "\u5229\u7528\u898f\u7d04", "legal.privacy": "\u30d7\u30e9\u30a4\u30d0\u30b7\u30fc\u30dd\u30ea\u30b7\u30fc", "legal.refund": "\u8fd4\u91d1\u30dd\u30ea\u30b7\u30fc",
  "misc.free": "\u7121\u6599", "misc.comingSoon": "\u8fd1\u65e5\u516c\u958b", "misc.close": "\u9589\u3058\u308b",
  "content.synopsis": "\u3042\u3089\u3059\u3058", "content.episodes": "\u30a8\u30d4\u30bd\u30fc\u30c9", "content.cast": "\u30ad\u30e3\u30b9\u30c8", "content.moreLikeThis": "\u985e\u4f3c\u4f5c\u54c1", "content.views": "\u56de\u8996\u8074", "content.now": "\u518d\u751f\u4e2d", "content.info": "\u60c5\u5831", "content.allEpisodes": "\u5168\u30a8\u30d4\u30bd\u30fc\u30c9", "content.previous": "\u524d\u3078", "content.next": "\u6b21\u3078", "content.episodeOf": "\u30a8\u30d4\u30bd\u30fc\u30c9{n}/{total}", "content.trending": "\u30c8\u30ec\u30f3\u30c9", "content.watchFree": "\u30a8\u30d4\u30bd\u30fc\u30c91\u3092\u7121\u6599\u3067\u898b\u308b", "content.unlockSeries": "\u30b7\u30ea\u30fc\u30ba\u3092\u89e3\u9664", "content.oneTimePayment": "\u4e00\u56de\u6255\u3044", "content.allEpisodesIncluded": "\u5168\u30a8\u30d4\u30bd\u30fc\u30c9\u542b\u3080", "content.episodeLocked": "\u30a8\u30d4\u30bd\u30fc\u30c9{n}\u306f\u30ed\u30c3\u30af\u3055\u308c\u3066\u3044\u307e\u3059", "content.unlockPrompt": "\u6700\u521d\u306e5\u30a8\u30d4\u30bd\u30fc\u30c9\u306f\u7121\u6599\u3067\u3059\u3002\u30b7\u30ea\u30fc\u30ba\u5168\u4f53\u3092\u89e3\u9664\u3057\u3066\u304f\u3060\u3055\u3044\u3002", "content.tryAgain": "\u3082\u3046\u4e00\u5ea6",
};

const ko: Translations = {
  "nav.discover": "\ubc1c\uacac", "nav.shorts": "\uc1fc\uce20", "nav.widescreen": "\uc640\uc774\ub4dc\uc2a4\ud06c\ub9b0",
  "nav.shop": "\uc1fc\ud551", "nav.library": "\ub77c\uc774\ube0c\ub7ec\ub9ac", "nav.profile": "\ud504\ub85c\ud544",
  "header.followUs": "\ud314\ub85c\uc6b0",
  "browse.startWatchingFree": "\ubb34\ub8cc\ub85c \uc2dc\uccad", "browse.trending": "\ud2b8\ub80c\ub4dc", "browse.episodes": "\uc5d0\ud53c\uc18c\ub4dc", "browse.allShows": "\ubaa8\ub4e0 \ud504\ub85c\uadf8\ub7a8",
  "tab.drama": "\ub4dc\ub77c\ub9c8", "tab.new": "\uc2e0\uaddc", "tab.popular": "\uc778\uae30", "tab.music": "\uc74c\uc545", "tab.reality": "\ub9ac\uc5bc\ub9ac\ud2f0", "tab.redCarpet": "\ub808\ub4dc\uce74\ud3ab",
  "shorts.list": "\ub9ac\uc2a4\ud2b8", "shorts.saved": "\uc800\uc7a5\ub428", "shorts.share": "\uacf5\uc720", "shorts.copied": "\ubcf5\uc0ac\ub428!", "shorts.sound": "\uc18c\ub9ac", "shorts.soundOn": "\ucf1c\uae30", "shorts.soundOff": "\ub044\uae30",
  "horizontal.widescreen": "\uc640\uc774\ub4dc\uc2a4\ud06c\ub9b0", "horizontal.episodes": "\uc5d0\ud53c\uc18c\ub4dc", "horizontal.play": "\uc7ac\uc0dd", "horizontal.pause": "\uc77c\uc2dc\uc815\uc9c0",
  "profile.guest": "\uac8c\uc2a4\ud2b8", "profile.signIn": "\ub85c\uadf8\uc778", "profile.signInPrompt": "\ub77c\uc774\ube0c\ub7ec\ub9ac\ub97c \ub3d9\uae30\ud654\ud558\ub824\uba74 \ub85c\uadf8\uc778",
  "profile.coinBalance": "\ucf54\uc778 \uc794\uc561", "profile.coins": "\ucf54\uc778", "profile.buyCoins": "\ucf54\uc778 \uad6c\ub9e4",
  "profile.myList": "\ub0b4 \ub9ac\uc2a4\ud2b8", "profile.continueWatching": "\uc774\uc5b4\uc11c \ubcf4\uae30", "profile.purchaseHistory": "\uad6c\ub9e4 \ub0b4\uc5ed",
  "profile.language": "\uc5b8\uc5b4", "profile.notifications": "\uc54c\ub9bc", "profile.darkMode": "\ub2e4\ud06c \ubaa8\ub4dc",
  "profile.helpFaq": "\ub3c4\uc6c0\ub9d0 \ubc0f FAQ", "profile.sendFeedback": "\ud53c\ub4dc\ubc31 \ubcf4\ub0b4\uae30", "profile.reportProblem": "\ubb38\uc81c \uc2e0\uace0", "profile.signOut": "\ub85c\uadf8\uc544\uc6c3",
  "library.title": "\ub77c\uc774\ube0c\ub7ec\ub9ac", "library.channels": "\ucc44\ub110", "library.myList": "\ub0b4 \ub9ac\uc2a4\ud2b8",
  "library.noSavedShows": "\uc800\uc7a5\ub41c \ud504\ub85c\uadf8\ub7a8\uc774 \uc5c6\uc2b5\ub2c8\ub2e4", "library.browseShows": "\ud504\ub85c\uadf8\ub7a8 \ud0d0\uc0c9", "library.comingSoon": "\uacf5\uac1c \uc608\uc815", "library.shows": "\ud504\ub85c\uadf8\ub7a8",
  "auth.signInHeading": "Verza TV\uc5d0 \ub85c\uadf8\uc778", "auth.signUpHeading": "\uacc4\uc815 \ub9cc\ub4e4\uae30",
  "auth.email": "\uc774\uba54\uc77c \uc8fc\uc18c", "auth.displayName": "\ud45c\uc2dc \uc774\ub984",
  "auth.continueWithEmail": "\uc774\uba54\uc77c\ub85c \uacc4\uc18d", "auth.continueWithGoogle": "Google\ub85c \uacc4\uc18d", "auth.continueWithApple": "Apple\ub85c \uacc4\uc18d",
  "auth.createAccount": "\uacc4\uc815 \ub9cc\ub4e4\uae30", "auth.continueAsGuest": "\uac8c\uc2a4\ud2b8\ub85c \uacc4\uc18d",
  "auth.noAccount": "\uacc4\uc815\uc774 \uc5c6\uc73c\uc2e0\uac00\uc694?", "auth.haveAccount": "\uc774\ubbf8 \uacc4\uc815\uc774 \uc788\uc73c\uc2e0\uac00\uc694?", "auth.signUp": "\ud68c\uc6d0\uac00\uc785",
  "legal.terms": "\uc774\uc6a9\uc57d\uad00", "legal.privacy": "\uac1c\uc778\uc815\ubcf4\ucc98\ub9ac\ubc29\uce68", "legal.refund": "\ud658\ubd88 \uc815\ucc45",
  "misc.free": "\ubb34\ub8cc", "misc.comingSoon": "\uacf5\uac1c \uc608\uc815", "misc.close": "\ub2eb\uae30",
  "content.synopsis": "\uc904\uac70\ub9ac", "content.episodes": "\uc5d0\ud53c\uc18c\ub4dc", "content.cast": "\ucd9c\uc5f0\uc9c4", "content.moreLikeThis": "\ube44\uc2b7\ud55c \uc791\ud488", "content.views": "\uc870\ud68c", "content.now": "\uc7ac\uc0dd\uc911", "content.info": "\uc815\ubcf4", "content.allEpisodes": "\uc804\uccb4 \uc5d0\ud53c\uc18c\ub4dc", "content.previous": "\uc774\uc804", "content.next": "\ub2e4\uc74c", "content.episodeOf": "\uc5d0\ud53c\uc18c\ub4dc {n}/{total}", "content.trending": "\ud2b8\ub80c\ub4dc", "content.watchFree": "\uc5d0\ud53c\uc18c\ub4dc 1 \ubb34\ub8cc \uc2dc\uccad", "content.unlockSeries": "\uc2dc\ub9ac\uc988 \uc7a0\uae08 \ud574\uc81c", "content.oneTimePayment": "\uc77c\ud68c\uc131 \uacb0\uc81c", "content.allEpisodesIncluded": "\ubaa8\ub4e0 \uc5d0\ud53c\uc18c\ub4dc \ud3ec\ud568", "content.episodeLocked": "\uc5d0\ud53c\uc18c\ub4dc {n}\uc740 \uc7a0\uaca8 \uc788\uc2b5\ub2c8\ub2e4", "content.unlockPrompt": "\ucc98\uc74c 5\uac1c \uc5d0\ud53c\uc18c\ub4dc\ub294 \ubb34\ub8cc\uc785\ub2c8\ub2e4. \uc804\uccb4 \uc2dc\ub9ac\uc988\ub97c \uc7a0\uae08 \ud574\uc81c\ud558\uc138\uc694.", "content.tryAgain": "\ub2e4\uc2dc \uc2dc\ub3c4",
};

const zh: Translations = {
  "nav.discover": "\u53d1\u73b0", "nav.shorts": "\u77ed\u5267", "nav.widescreen": "\u5bbd\u5c4f",
  "nav.shop": "\u5546\u5e97", "nav.library": "\u5a92\u4f53\u5e93", "nav.profile": "\u4e2a\u4eba",
  "header.followUs": "\u5173\u6ce8\u6211\u4eec",
  "browse.startWatchingFree": "\u514d\u8d39\u5f00\u59cb\u89c2\u770b", "browse.trending": "\u70ed\u95e8", "browse.episodes": "\u96c6", "browse.allShows": "\u6240\u6709\u5267\u96c6",
  "tab.drama": "\u5267\u60c5", "tab.new": "\u6700\u65b0", "tab.popular": "\u70ed\u95e8", "tab.music": "\u97f3\u4e50", "tab.reality": "\u771f\u4eba\u79c0", "tab.redCarpet": "\u7ea2\u6bef",
  "shorts.list": "\u6536\u85cf", "shorts.saved": "\u5df2\u4fdd\u5b58", "shorts.share": "\u5206\u4eab", "shorts.copied": "\u5df2\u590d\u5236\uff01", "shorts.sound": "\u58f0\u97f3", "shorts.soundOn": "\u5f00", "shorts.soundOff": "\u5173",
  "horizontal.widescreen": "\u5bbd\u5c4f", "horizontal.episodes": "\u96c6", "horizontal.play": "\u64ad\u653e", "horizontal.pause": "\u6682\u505c",
  "profile.guest": "\u8bbf\u5ba2", "profile.signIn": "\u767b\u5f55", "profile.signInPrompt": "\u767b\u5f55\u4ee5\u540c\u6b65\u60a8\u7684\u5a92\u4f53\u5e93",
  "profile.coinBalance": "\u786c\u5e01\u4f59\u989d", "profile.coins": "\u786c\u5e01", "profile.buyCoins": "\u8d2d\u4e70\u786c\u5e01",
  "profile.myList": "\u6211\u7684\u5217\u8868", "profile.continueWatching": "\u7ee7\u7eed\u89c2\u770b", "profile.purchaseHistory": "\u8d2d\u4e70\u8bb0\u5f55",
  "profile.language": "\u8bed\u8a00", "profile.notifications": "\u901a\u77e5", "profile.darkMode": "\u6df1\u8272\u6a21\u5f0f",
  "profile.helpFaq": "\u5e2e\u52a9\u4e0e\u5e38\u89c1\u95ee\u9898", "profile.sendFeedback": "\u53d1\u9001\u53cd\u9988", "profile.reportProblem": "\u62a5\u544a\u95ee\u9898", "profile.signOut": "\u9000\u51fa\u767b\u5f55",
  "library.title": "\u5a92\u4f53\u5e93", "library.channels": "\u9891\u9053", "library.myList": "\u6211\u7684\u5217\u8868",
  "library.noSavedShows": "\u8fd8\u6ca1\u6709\u4fdd\u5b58\u7684\u5267\u96c6", "library.browseShows": "\u6d4f\u89c8\u5267\u96c6", "library.comingSoon": "\u5373\u5c06\u4e0a\u7ebf", "library.shows": "\u5267\u96c6",
  "auth.signInHeading": "\u767b\u5f55 Verza TV", "auth.signUpHeading": "\u521b\u5efa\u60a8\u7684\u8d26\u6237",
  "auth.email": "\u7535\u5b50\u90ae\u7bb1", "auth.displayName": "\u663e\u793a\u540d\u79f0",
  "auth.continueWithEmail": "\u4f7f\u7528\u90ae\u7bb1\u7ee7\u7eed", "auth.continueWithGoogle": "\u4f7f\u7528 Google \u7ee7\u7eed", "auth.continueWithApple": "\u4f7f\u7528 Apple \u7ee7\u7eed",
  "auth.createAccount": "\u521b\u5efa\u8d26\u6237", "auth.continueAsGuest": "\u4ee5\u8bbf\u5ba2\u8eab\u4efd\u7ee7\u7eed",
  "auth.noAccount": "\u6ca1\u6709\u8d26\u6237\uff1f", "auth.haveAccount": "\u5df2\u6709\u8d26\u6237\uff1f", "auth.signUp": "\u6ce8\u518c",
  "legal.terms": "\u670d\u52a1\u6761\u6b3e", "legal.privacy": "\u9690\u79c1\u653f\u7b56", "legal.refund": "\u9000\u6b3e\u653f\u7b56",
  "misc.free": "\u514d\u8d39", "misc.comingSoon": "\u5373\u5c06\u4e0a\u7ebf", "misc.close": "\u5173\u95ed",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "The first 5 episodes are free. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
};

const hi: Translations = {
  "nav.discover": "\u0916\u094b\u091c\u0947\u0902", "nav.shorts": "\u0936\u0949\u0930\u094d\u091f\u094d\u0938", "nav.widescreen": "\u0935\u093e\u0907\u0921\u0938\u094d\u0915\u094d\u0930\u0940\u0928",
  "nav.shop": "\u0926\u0941\u0915\u093e\u0928", "nav.library": "\u0932\u093e\u0907\u092c\u094d\u0930\u0947\u0930\u0940", "nav.profile": "\u092a\u094d\u0930\u094b\u095e\u093e\u0907\u0932",
  "header.followUs": "\u0939\u092e\u0947\u0902 \u095e\u0949\u0932\u094b \u0915\u0930\u0947\u0902",
  "browse.startWatchingFree": "\u092e\u0941\u095e\u094d\u0924 \u092e\u0947\u0902 \u0926\u0947\u0916\u0947\u0902", "browse.trending": "\u091f\u094d\u0930\u0947\u0902\u0921\u093f\u0902\u0917", "browse.episodes": "\u090f\u092a\u093f\u0938\u094b\u0921", "browse.allShows": "\u0938\u092d\u0940 \u0936\u094b",
  "tab.drama": "\u0921\u094d\u0930\u093e\u092e\u093e", "tab.new": "\u0928\u092f\u093e", "tab.popular": "\u0932\u094b\u0915\u092a\u094d\u0930\u093f\u092f", "tab.music": "\u0938\u0902\u0917\u0940\u0924", "tab.reality": "\u0930\u093f\u092f\u0932\u093f\u091f\u0940", "tab.redCarpet": "\u0930\u0947\u0921 \u0915\u093e\u0930\u094d\u092a\u0947\u091f",
  "shorts.list": "\u0938\u0942\u091a\u0940", "shorts.saved": "\u0938\u0947\u0935 \u0915\u093f\u092f\u093e", "shorts.share": "\u0936\u0947\u092f\u0930", "shorts.copied": "\u0915\u0949\u092a\u0940 \u0939\u094b \u0917\u092f\u093e!", "shorts.sound": "\u0927\u094d\u0935\u0928\u093f", "shorts.soundOn": "\u091a\u093e\u0932\u0942", "shorts.soundOff": "\u092c\u0902\u0926",
  "horizontal.widescreen": "\u0935\u093e\u0907\u0921\u0938\u094d\u0915\u094d\u0930\u0940\u0928", "horizontal.episodes": "\u090f\u092a\u093f\u0938\u094b\u0921", "horizontal.play": "\u091a\u0932\u093e\u090f\u0902", "horizontal.pause": "\u0930\u094b\u0915\u0947\u0902",
  "profile.guest": "\u0905\u0924\u093f\u0925\u093f", "profile.signIn": "\u0938\u093e\u0907\u0928 \u0907\u0928", "profile.signInPrompt": "\u0932\u093e\u0907\u092c\u094d\u0930\u0947\u0930\u0940 \u0938\u093f\u0902\u0915 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f \u0938\u093e\u0907\u0928 \u0907\u0928 \u0915\u0930\u0947\u0902",
  "profile.coinBalance": "\u0938\u093f\u0915\u094d\u0915\u093e \u0936\u0947\u0937", "profile.coins": "\u0938\u093f\u0915\u094d\u0915\u0947", "profile.buyCoins": "\u0938\u093f\u0915\u094d\u0915\u0947 \u0916\u0930\u0940\u0926\u0947\u0902",
  "profile.myList": "\u092e\u0947\u0930\u0940 \u0938\u0942\u091a\u0940", "profile.continueWatching": "\u0926\u0947\u0916\u0928\u093e \u091c\u093e\u0930\u0940 \u0930\u0916\u0947\u0902", "profile.purchaseHistory": "\u0916\u0930\u0940\u0926 \u0907\u0924\u093f\u0939\u093e\u0938",
  "profile.language": "\u092d\u093e\u0937\u093e", "profile.notifications": "\u0938\u0942\u091a\u0928\u093e\u090f\u0902", "profile.darkMode": "\u0921\u093e\u0930\u094d\u0915 \u092e\u094b\u0921",
  "profile.helpFaq": "\u0938\u0939\u093e\u092f\u0924\u093e \u0914\u0930 FAQ", "profile.sendFeedback": "\u092a\u094d\u0930\u0924\u093f\u0915\u094d\u0930\u093f\u092f\u093e \u092d\u0947\u091c\u0947\u0902", "profile.reportProblem": "\u0938\u092e\u0938\u094d\u092f\u093e \u0930\u093f\u092a\u094b\u0930\u094d\u091f \u0915\u0930\u0947\u0902", "profile.signOut": "\u0938\u093e\u0907\u0928 \u0906\u0909\u091f",
  "library.title": "\u0932\u093e\u0907\u092c\u094d\u0930\u0947\u0930\u0940", "library.channels": "\u091a\u0948\u0928\u0932", "library.myList": "\u092e\u0947\u0930\u0940 \u0938\u0942\u091a\u0940",
  "library.noSavedShows": "\u0915\u094b\u0908 \u0938\u0947\u0935 \u0915\u093f\u092f\u093e \u0936\u094b \u0928\u0939\u0940\u0902", "library.browseShows": "\u0936\u094b \u092c\u094d\u0930\u093e\u0909\u095b \u0915\u0930\u0947\u0902", "library.comingSoon": "\u091c\u0932\u094d\u0926 \u0906 \u0930\u0939\u093e \u0939\u0948", "library.shows": "\u0936\u094b",
  "auth.signInHeading": "Verza TV \u092e\u0947\u0902 \u0938\u093e\u0907\u0928 \u0907\u0928 \u0915\u0930\u0947\u0902", "auth.signUpHeading": "\u0905\u092a\u0928\u093e \u0916\u093e\u0924\u093e \u092c\u0928\u093e\u090f\u0902",
  "auth.email": "\u0908\u092e\u0947\u0932 \u092a\u0924\u093e", "auth.displayName": "\u092a\u094d\u0930\u0926\u0930\u094d\u0936\u0928 \u0928\u093e\u092e",
  "auth.continueWithEmail": "\u0908\u092e\u0947\u0932 \u0938\u0947 \u091c\u093e\u0930\u0940 \u0930\u0916\u0947\u0902", "auth.continueWithGoogle": "Google \u0938\u0947 \u091c\u093e\u0930\u0940 \u0930\u0916\u0947\u0902", "auth.continueWithApple": "Apple \u0938\u0947 \u091c\u093e\u0930\u0940 \u0930\u0916\u0947\u0902",
  "auth.createAccount": "\u0916\u093e\u0924\u093e \u092c\u0928\u093e\u090f\u0902", "auth.continueAsGuest": "\u0905\u0924\u093f\u0925\u093f \u0915\u0947 \u0930\u0942\u092a \u092e\u0947\u0902 \u091c\u093e\u0930\u0940 \u0930\u0916\u0947\u0902",
  "auth.noAccount": "\u0916\u093e\u0924\u093e \u0928\u0939\u0940\u0902 \u0939\u0948?", "auth.haveAccount": "\u092a\u0939\u0932\u0947 \u0938\u0947 \u0916\u093e\u0924\u093e \u0939\u0948?", "auth.signUp": "\u0938\u093e\u0907\u0928 \u0905\u092a",
  "legal.terms": "\u0938\u0947\u0935\u093e \u0915\u0940 \u0936\u0930\u094d\u0924\u0947\u0902", "legal.privacy": "\u0917\u094b\u092a\u0928\u0940\u092f\u0924\u093e \u0928\u0940\u0924\u093f", "legal.refund": "\u0930\u093f\u095e\u0902\u0921 \u0928\u0940\u0924\u093f",
  "misc.free": "\u092e\u0941\u095e\u094d\u0924", "misc.comingSoon": "\u091c\u0932\u094d\u0926 \u0906 \u0930\u0939\u093e \u0939\u0948", "misc.close": "\u092c\u0902\u0926 \u0915\u0930\u0947\u0902",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "The first 5 episodes are free. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
};

const ar: Translations = {
  "nav.discover": "\u0627\u0643\u062a\u0634\u0641", "nav.shorts": "\u0645\u0642\u0627\u0637\u0639", "nav.widescreen": "\u0634\u0627\u0634\u0629 \u0639\u0631\u064a\u0636\u0629",
  "nav.shop": "\u0645\u062a\u062c\u0631", "nav.library": "\u0645\u0643\u062a\u0628\u0629", "nav.profile": "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062e\u0635\u064a",
  "header.followUs": "\u062a\u0627\u0628\u0639\u0648\u0646\u0627",
  "browse.startWatchingFree": "\u0627\u0628\u062f\u0623 \u0627\u0644\u0645\u0634\u0627\u0647\u062f\u0629 \u0645\u062c\u0627\u0646\u064b\u0627", "browse.trending": "\u0631\u0627\u0626\u062c", "browse.episodes": "\u062d\u0644\u0642\u0627\u062a", "browse.allShows": "\u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0633\u0644\u0633\u0644\u0627\u062a",
  "tab.drama": "\u062f\u0631\u0627\u0645\u0627", "tab.new": "\u062c\u062f\u064a\u062f", "tab.popular": "\u0634\u0627\u0626\u0639", "tab.music": "\u0645\u0648\u0633\u064a\u0642\u0649", "tab.reality": "\u0648\u0627\u0642\u0639\u064a", "tab.redCarpet": "\u0627\u0644\u0633\u062c\u0627\u062f\u0629 \u0627\u0644\u062d\u0645\u0631\u0627\u0621",
  "shorts.list": "\u0642\u0627\u0626\u0645\u0629", "shorts.saved": "\u0645\u062d\u0641\u0648\u0638", "shorts.share": "\u0645\u0634\u0627\u0631\u0643\u0629", "shorts.copied": "\u062a\u0645 \u0627\u0644\u0646\u0633\u062e!", "shorts.sound": "\u0627\u0644\u0635\u0648\u062a", "shorts.soundOn": "\u062a\u0634\u063a\u064a\u0644", "shorts.soundOff": "\u0625\u064a\u0642\u0627\u0641",
  "horizontal.widescreen": "\u0634\u0627\u0634\u0629 \u0639\u0631\u064a\u0636\u0629", "horizontal.episodes": "\u062d\u0644\u0642\u0627\u062a", "horizontal.play": "\u062a\u0634\u063a\u064a\u0644", "horizontal.pause": "\u0625\u064a\u0642\u0627\u0641 \u0645\u0624\u0642\u062a",
  "profile.guest": "\u0632\u0627\u0626\u0631", "profile.signIn": "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644", "profile.signInPrompt": "\u0633\u062c\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0644\u0645\u0632\u0627\u0645\u0646\u0629 \u0645\u0643\u062a\u0628\u062a\u0643",
  "profile.coinBalance": "\u0631\u0635\u064a\u062f \u0627\u0644\u0639\u0645\u0644\u0627\u062a", "profile.coins": "\u0639\u0645\u0644\u0627\u062a", "profile.buyCoins": "\u0634\u0631\u0627\u0621 \u0639\u0645\u0644\u0627\u062a",
  "profile.myList": "\u0642\u0627\u0626\u0645\u062a\u064a", "profile.continueWatching": "\u0645\u062a\u0627\u0628\u0639\u0629 \u0627\u0644\u0645\u0634\u0627\u0647\u062f\u0629", "profile.purchaseHistory": "\u0633\u062c\u0644 \u0627\u0644\u0645\u0634\u062a\u0631\u064a\u0627\u062a",
  "profile.language": "\u0627\u0644\u0644\u063a\u0629", "profile.notifications": "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062a", "profile.darkMode": "\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u062f\u0627\u0643\u0646",
  "profile.helpFaq": "\u0627\u0644\u0645\u0633\u0627\u0639\u062f\u0629 \u0648\u0627\u0644\u0623\u0633\u0626\u0644\u0629", "profile.sendFeedback": "\u0625\u0631\u0633\u0627\u0644 \u0645\u0644\u0627\u062d\u0638\u0627\u062a", "profile.reportProblem": "\u0627\u0644\u0625\u0628\u0644\u0627\u063a \u0639\u0646 \u0645\u0634\u0643\u0644\u0629", "profile.signOut": "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c",
  "library.title": "\u0627\u0644\u0645\u0643\u062a\u0628\u0629", "library.channels": "\u0627\u0644\u0642\u0646\u0648\u0627\u062a", "library.myList": "\u0642\u0627\u0626\u0645\u062a\u064a",
  "library.noSavedShows": "\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0633\u0644\u0633\u0644\u0627\u062a \u0645\u062d\u0641\u0648\u0638\u0629", "library.browseShows": "\u062a\u0635\u0641\u062d \u0627\u0644\u0645\u0633\u0644\u0633\u0644\u0627\u062a", "library.comingSoon": "\u0642\u0631\u064a\u0628\u064b\u0627", "library.shows": "\u0645\u0633\u0644\u0633\u0644\u0627\u062a",
  "auth.signInHeading": "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0625\u0644\u0649 Verza TV", "auth.signUpHeading": "\u0623\u0646\u0634\u0626 \u062d\u0633\u0627\u0628\u0643",
  "auth.email": "\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a", "auth.displayName": "\u0627\u0633\u0645 \u0627\u0644\u0639\u0631\u0636",
  "auth.continueWithEmail": "\u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0629 \u0628\u0627\u0644\u0628\u0631\u064a\u062f", "auth.continueWithGoogle": "\u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0629 \u0628\u0640 Google", "auth.continueWithApple": "\u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0629 \u0628\u0640 Apple",
  "auth.createAccount": "\u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628", "auth.continueAsGuest": "\u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0629 \u0643\u0632\u0627\u0626\u0631",
  "auth.noAccount": "\u0644\u064a\u0633 \u0644\u062f\u064a\u0643 \u062d\u0633\u0627\u0628\u061f", "auth.haveAccount": "\u0644\u062f\u064a\u0643 \u062d\u0633\u0627\u0628 \u0628\u0627\u0644\u0641\u0639\u0644\u061f", "auth.signUp": "\u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628",
  "legal.terms": "\u0634\u0631\u0648\u0637 \u0627\u0644\u062e\u062f\u0645\u0629", "legal.privacy": "\u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u062e\u0635\u0648\u0635\u064a\u0629", "legal.refund": "\u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u0627\u0633\u062a\u0631\u062f\u0627\u062f",
  "misc.free": "\u0645\u062c\u0627\u0646\u064a", "misc.comingSoon": "\u0642\u0631\u064a\u0628\u064b\u0627", "misc.close": "\u0625\u063a\u0644\u0627\u0642",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "The first 5 episodes are free. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
};

const ru: Translations = {
  "nav.discover": "\u0413\u043b\u0430\u0432\u043d\u0430\u044f", "nav.shorts": "\u0428\u043e\u0440\u0442\u0441", "nav.widescreen": "\u0428\u0438\u0440\u043e\u043a\u0438\u0439 \u044d\u043a\u0440\u0430\u043d",
  "nav.shop": "\u041c\u0430\u0433\u0430\u0437\u0438\u043d", "nav.library": "\u0411\u0438\u0431\u043b\u0438\u043e\u0442\u0435\u043a\u0430", "nav.profile": "\u041f\u0440\u043e\u0444\u0438\u043b\u044c",
  "header.followUs": "\u041f\u043e\u0434\u043f\u0438\u0448\u0438\u0442\u0435\u0441\u044c",
  "browse.startWatchingFree": "\u0421\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e", "browse.trending": "\u0412 \u0442\u0440\u0435\u043d\u0434\u0435", "browse.episodes": "\u0441\u0435\u0440\u0438\u0439", "browse.allShows": "\u0412\u0441\u0435 \u0441\u0435\u0440\u0438\u0430\u043b\u044b",
  "tab.drama": "\u0414\u0440\u0430\u043c\u0430", "tab.new": "\u041d\u043e\u0432\u043e\u0435", "tab.popular": "\u041f\u043e\u043f\u0443\u043b\u044f\u0440\u043d\u043e\u0435", "tab.music": "\u041c\u0443\u0437\u044b\u043a\u0430", "tab.reality": "\u0420\u0435\u0430\u043b\u0438\u0442\u0438", "tab.redCarpet": "\u041a\u0440\u0430\u0441\u043d\u0430\u044f \u0434\u043e\u0440\u043e\u0436\u043a\u0430",
  "shorts.list": "\u0421\u043f\u0438\u0441\u043e\u043a", "shorts.saved": "\u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u043e", "shorts.share": "\u041f\u043e\u0434\u0435\u043b\u0438\u0442\u044c\u0441\u044f", "shorts.copied": "\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u043e!", "shorts.sound": "\u0417\u0432\u0443\u043a", "shorts.soundOn": "\u0412\u043a\u043b", "shorts.soundOff": "\u0412\u044b\u043a\u043b",
  "horizontal.widescreen": "\u0428\u0438\u0440\u043e\u043a\u0438\u0439 \u044d\u043a\u0440\u0430\u043d", "horizontal.episodes": "\u0441\u0435\u0440\u0438\u0439", "horizontal.play": "\u0412\u043e\u0441\u043f\u0440\u043e\u0438\u0437\u0432\u0435\u0441\u0442\u0438", "horizontal.pause": "\u041f\u0430\u0443\u0437\u0430",
  "profile.guest": "\u0413\u043e\u0441\u0442\u044c", "profile.signIn": "\u0412\u043e\u0439\u0442\u0438", "profile.signInPrompt": "\u0412\u043e\u0439\u0434\u0438\u0442\u0435 \u0434\u043b\u044f \u0441\u0438\u043d\u0445\u0440\u043e\u043d\u0438\u0437\u0430\u0446\u0438\u0438 \u0431\u0438\u0431\u043b\u0438\u043e\u0442\u0435\u043a\u0438",
  "profile.coinBalance": "\u0411\u0430\u043b\u0430\u043d\u0441", "profile.coins": "\u043c\u043e\u043d\u0435\u0442", "profile.buyCoins": "\u041a\u0443\u043f\u0438\u0442\u044c \u043c\u043e\u043d\u0435\u0442\u044b",
  "profile.myList": "\u041c\u043e\u0439 \u0441\u043f\u0438\u0441\u043e\u043a", "profile.continueWatching": "\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c \u043f\u0440\u043e\u0441\u043c\u043e\u0442\u0440", "profile.purchaseHistory": "\u0418\u0441\u0442\u043e\u0440\u0438\u044f \u043f\u043e\u043a\u0443\u043f\u043e\u043a",
  "profile.language": "\u042f\u0437\u044b\u043a", "profile.notifications": "\u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f", "profile.darkMode": "\u0422\u0451\u043c\u043d\u0430\u044f \u0442\u0435\u043c\u0430",
  "profile.helpFaq": "\u041f\u043e\u043c\u043e\u0449\u044c \u0438 FAQ", "profile.sendFeedback": "\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u043e\u0442\u0437\u044b\u0432", "profile.reportProblem": "\u0421\u043e\u043e\u0431\u0449\u0438\u0442\u044c \u043e \u043f\u0440\u043e\u0431\u043b\u0435\u043c\u0435", "profile.signOut": "\u0412\u044b\u0439\u0442\u0438",
  "library.title": "\u0411\u0438\u0431\u043b\u0438\u043e\u0442\u0435\u043a\u0430", "library.channels": "\u041a\u0430\u043d\u0430\u043b\u044b", "library.myList": "\u041c\u043e\u0439 \u0441\u043f\u0438\u0441\u043e\u043a",
  "library.noSavedShows": "\u041d\u0435\u0442 \u0441\u043e\u0445\u0440\u0430\u043d\u0451\u043d\u043d\u044b\u0445 \u0441\u0435\u0440\u0438\u0430\u043b\u043e\u0432", "library.browseShows": "\u041e\u0431\u0437\u043e\u0440 \u0441\u0435\u0440\u0438\u0430\u043b\u043e\u0432", "library.comingSoon": "\u0421\u043a\u043e\u0440\u043e", "library.shows": "\u0441\u0435\u0440\u0438\u0430\u043b\u043e\u0432",
  "auth.signInHeading": "\u0412\u043e\u0439\u0442\u0438 \u0432 Verza TV", "auth.signUpHeading": "\u0421\u043e\u0437\u0434\u0430\u0439\u0442\u0435 \u0430\u043a\u043a\u0430\u0443\u043d\u0442",
  "auth.email": "\u042d\u043b\u0435\u043a\u0442\u0440\u043e\u043d\u043d\u0430\u044f \u043f\u043e\u0447\u0442\u0430", "auth.displayName": "\u0418\u043c\u044f",
  "auth.continueWithEmail": "\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c \u0447\u0435\u0440\u0435\u0437 Email", "auth.continueWithGoogle": "\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c \u0447\u0435\u0440\u0435\u0437 Google", "auth.continueWithApple": "\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c \u0447\u0435\u0440\u0435\u0437 Apple",
  "auth.createAccount": "\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442", "auth.continueAsGuest": "\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c \u043a\u0430\u043a \u0433\u043e\u0441\u0442\u044c",
  "auth.noAccount": "\u041d\u0435\u0442 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0430?", "auth.haveAccount": "\u0423\u0436\u0435 \u0435\u0441\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442?", "auth.signUp": "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f",
  "legal.terms": "\u0423\u0441\u043b\u043e\u0432\u0438\u044f \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u044f", "legal.privacy": "\u041f\u043e\u043b\u0438\u0442\u0438\u043a\u0430 \u043a\u043e\u043d\u0444\u0438\u0434\u0435\u043d\u0446\u0438\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u0438", "legal.refund": "\u041f\u043e\u043b\u0438\u0442\u0438\u043a\u0430 \u0432\u043e\u0437\u0432\u0440\u0430\u0442\u0430",
  "misc.free": "\u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e", "misc.comingSoon": "\u0421\u043a\u043e\u0440\u043e", "misc.close": "\u0417\u0430\u043a\u0440\u044b\u0442\u044c",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "The first 5 episodes are free. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
};

const tr: Translations = {
  "nav.discover": "Ke\u015ffet", "nav.shorts": "K\u0131salar", "nav.widescreen": "Geni\u015f Ekran",
  "nav.shop": "Ma\u011faza", "nav.library": "K\u00fct\u00fcphane", "nav.profile": "Profil",
  "header.followUs": "Bizi takip edin",
  "browse.startWatchingFree": "\u00dccretsiz \u0130zlemeye Ba\u015fla", "browse.trending": "Trend", "browse.episodes": "b\u00f6l\u00fcm", "browse.allShows": "T\u00fcm Diziler",
  "tab.drama": "Dram", "tab.new": "Yeni", "tab.popular": "Pop\u00fcler", "tab.music": "M\u00fczik", "tab.reality": "Realite", "tab.redCarpet": "K\u0131rm\u0131z\u0131 Hal\u0131",
  "shorts.list": "Liste", "shorts.saved": "Kaydedildi", "shorts.share": "Payla\u015f", "shorts.copied": "Kopyaland\u0131!", "shorts.sound": "Ses", "shorts.soundOn": "A\u00e7\u0131k", "shorts.soundOff": "Kapal\u0131",
  "horizontal.widescreen": "Geni\u015f Ekran", "horizontal.episodes": "b\u00f6l\u00fcm", "horizontal.play": "Oynat", "horizontal.pause": "Duraklat",
  "profile.guest": "Misafir", "profile.signIn": "Giri\u015f Yap", "profile.signInPrompt": "Kitapl\u0131\u011f\u0131n\u0131z\u0131 senkronize etmek i\u00e7in giri\u015f yap\u0131n",
  "profile.coinBalance": "Jeton Bakiyesi", "profile.coins": "jeton", "profile.buyCoins": "Jeton Al",
  "profile.myList": "Listem", "profile.continueWatching": "\u0130zlemeye Devam Et", "profile.purchaseHistory": "Al\u0131m Ge\u00e7mi\u015fi",
  "profile.language": "Dil", "profile.notifications": "Bildirimler", "profile.darkMode": "Karanl\u0131k Mod",
  "profile.helpFaq": "Yard\u0131m ve SSS", "profile.sendFeedback": "Geri Bildirim G\u00f6nder", "profile.reportProblem": "Sorun Bildir", "profile.signOut": "\u00c7\u0131k\u0131\u015f Yap",
  "library.title": "K\u00fct\u00fcphane", "library.channels": "Kanallar", "library.myList": "Listem",
  "library.noSavedShows": "Hen\u00fcz kaydedilen dizi yok", "library.browseShows": "Dizilere G\u00f6z At", "library.comingSoon": "\u00c7ok Yak\u0131nda", "library.shows": "dizi",
  "auth.signInHeading": "Verza TV\u2019ye giri\u015f yap\u0131n", "auth.signUpHeading": "Hesab\u0131n\u0131z\u0131 olu\u015fturun",
  "auth.email": "E-posta adresi", "auth.displayName": "G\u00f6r\u00fcnen ad",
  "auth.continueWithEmail": "E-posta ile Devam Et", "auth.continueWithGoogle": "Google ile Devam Et", "auth.continueWithApple": "Apple ile Devam Et",
  "auth.createAccount": "Hesap Olu\u015ftur", "auth.continueAsGuest": "Misafir Olarak Devam Et",
  "auth.noAccount": "Hesab\u0131n\u0131z yok mu?", "auth.haveAccount": "Zaten hesab\u0131n\u0131z var m\u0131?", "auth.signUp": "Kay\u0131t Ol",
  "legal.terms": "Hizmet \u015eartlar\u0131", "legal.privacy": "Gizlilik Politikas\u0131", "legal.refund": "\u0130ade Politikas\u0131",
  "misc.free": "\u00dccretsiz", "misc.comingSoon": "\u00c7ok Yak\u0131nda", "misc.close": "Kapat",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "The first 5 episodes are free. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
};

const pl: Translations = {
  "nav.discover": "Odkryj", "nav.shorts": "Szorty", "nav.widescreen": "Panoramiczny",
  "nav.shop": "Sklep", "nav.library": "Biblioteka", "nav.profile": "Profil",
  "header.followUs": "Obserwuj nas",
  "browse.startWatchingFree": "Zacznij Ogl\u0105da\u0107 Za Darmo", "browse.trending": "Na Czasie", "browse.episodes": "odcink\u00f3w", "browse.allShows": "Wszystkie Seriale",
  "tab.drama": "Dramat", "tab.new": "Nowe", "tab.popular": "Popularne", "tab.music": "Muzyka", "tab.reality": "Reality", "tab.redCarpet": "Czerwony Dywan",
  "shorts.list": "Lista", "shorts.saved": "Zapisano", "shorts.share": "Udost\u0119pnij", "shorts.copied": "Skopiowano!", "shorts.sound": "D\u017awi\u0119k", "shorts.soundOn": "W\u0142.", "shorts.soundOff": "Wy\u0142.",
  "horizontal.widescreen": "Panoramiczny", "horizontal.episodes": "odcink\u00f3w", "horizontal.play": "Odtw\u00f3rz", "horizontal.pause": "Pauza",
  "profile.guest": "Go\u015b\u0107", "profile.signIn": "Zaloguj si\u0119", "profile.signInPrompt": "Zaloguj si\u0119, aby zsynchronizowa\u0107 bibliotek\u0119",
  "profile.coinBalance": "Saldo Monet", "profile.coins": "monety", "profile.buyCoins": "Kup Monety",
  "profile.myList": "Moja Lista", "profile.continueWatching": "Kontynuuj Ogl\u0105danie", "profile.purchaseHistory": "Historia Zakup\u00f3w",
  "profile.language": "J\u0119zyk", "profile.notifications": "Powiadomienia", "profile.darkMode": "Tryb Ciemny",
  "profile.helpFaq": "Pomoc i FAQ", "profile.sendFeedback": "Wy\u015blij Opini\u0119", "profile.reportProblem": "Zg\u0142o\u015b Problem", "profile.signOut": "Wyloguj si\u0119",
  "library.title": "Biblioteka", "library.channels": "Kana\u0142y", "library.myList": "Moja Lista",
  "library.noSavedShows": "Brak zapisanych seriali", "library.browseShows": "Przegl\u0105daj Seriale", "library.comingSoon": "Wkr\u00f3tce", "library.shows": "seriale",
  "auth.signInHeading": "Zaloguj si\u0119 do Verza TV", "auth.signUpHeading": "Utw\u00f3rz swoje konto",
  "auth.email": "Adres e-mail", "auth.displayName": "Wy\u015bwietlana nazwa",
  "auth.continueWithEmail": "Kontynuuj przez E-mail", "auth.continueWithGoogle": "Kontynuuj przez Google", "auth.continueWithApple": "Kontynuuj przez Apple",
  "auth.createAccount": "Utw\u00f3rz Konto", "auth.continueAsGuest": "Kontynuuj jako Go\u015b\u0107",
  "auth.noAccount": "Nie masz konta?", "auth.haveAccount": "Masz ju\u017c konto?", "auth.signUp": "Zarejestruj si\u0119",
  "legal.terms": "Regulamin", "legal.privacy": "Polityka Prywatno\u015bci", "legal.refund": "Polityka Zwrot\u00f3w",
  "misc.free": "Za Darmo", "misc.comingSoon": "Wkr\u00f3tce", "misc.close": "Zamknij",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "The first 5 episodes are free. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
};

const nl: Translations = {
  "nav.discover": "Ontdekken", "nav.shorts": "Shorts", "nav.widescreen": "Breedbeeld",
  "nav.shop": "Winkel", "nav.library": "Bibliotheek", "nav.profile": "Profiel",
  "header.followUs": "Volg ons",
  "browse.startWatchingFree": "Begin Gratis te Kijken", "browse.trending": "Trending", "browse.episodes": "afleveringen", "browse.allShows": "Alle Series",
  "tab.drama": "Drama", "tab.new": "Nieuw", "tab.popular": "Populair", "tab.music": "Muziek", "tab.reality": "Reality", "tab.redCarpet": "Rode Loper",
  "shorts.list": "Lijst", "shorts.saved": "Opgeslagen", "shorts.share": "Delen", "shorts.copied": "Gekopieerd!", "shorts.sound": "Geluid", "shorts.soundOn": "Aan", "shorts.soundOff": "Uit",
  "horizontal.widescreen": "Breedbeeld", "horizontal.episodes": "afleveringen", "horizontal.play": "Afspelen", "horizontal.pause": "Pauzeren",
  "profile.guest": "Gast", "profile.signIn": "Inloggen", "profile.signInPrompt": "Log in om je bibliotheek te synchroniseren",
  "profile.coinBalance": "Munten Saldo", "profile.coins": "munten", "profile.buyCoins": "Munten Kopen",
  "profile.myList": "Mijn Lijst", "profile.continueWatching": "Verder Kijken", "profile.purchaseHistory": "Aankoopgeschiedenis",
  "profile.language": "Taal", "profile.notifications": "Meldingen", "profile.darkMode": "Donkere Modus",
  "profile.helpFaq": "Help & FAQ", "profile.sendFeedback": "Feedback Versturen", "profile.reportProblem": "Probleem Melden", "profile.signOut": "Uitloggen",
  "library.title": "Bibliotheek", "library.channels": "Kanalen", "library.myList": "Mijn Lijst",
  "library.noSavedShows": "Nog geen opgeslagen series", "library.browseShows": "Series Bekijken", "library.comingSoon": "Binnenkort", "library.shows": "series",
  "auth.signInHeading": "Log in bij Verza TV", "auth.signUpHeading": "Maak je account aan",
  "auth.email": "E-mailadres", "auth.displayName": "Weergavenaam",
  "auth.continueWithEmail": "Doorgaan met E-mail", "auth.continueWithGoogle": "Doorgaan met Google", "auth.continueWithApple": "Doorgaan met Apple",
  "auth.createAccount": "Account Aanmaken", "auth.continueAsGuest": "Doorgaan als Gast",
  "auth.noAccount": "Geen account?", "auth.haveAccount": "Heb je al een account?", "auth.signUp": "Registreren",
  "legal.terms": "Servicevoorwaarden", "legal.privacy": "Privacybeleid", "legal.refund": "Restitutiebeleid",
  "misc.free": "Gratis", "misc.comingSoon": "Binnenkort", "misc.close": "Sluiten",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "The first 5 episodes are free. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
};

const th: Translations = {
  "nav.discover": "\u0e04\u0e49\u0e19\u0e1e\u0e1a", "nav.shorts": "\u0e04\u0e25\u0e34\u0e1b\u0e2a\u0e31\u0e49\u0e19", "nav.widescreen": "\u0e08\u0e2d\u0e01\u0e27\u0e49\u0e32\u0e07",
  "nav.shop": "\u0e23\u0e49\u0e32\u0e19\u0e04\u0e49\u0e32", "nav.library": "\u0e04\u0e25\u0e31\u0e07\u0e40\u0e19\u0e37\u0e49\u0e2d\u0e2b\u0e32", "nav.profile": "\u0e42\u0e1b\u0e23\u0e44\u0e1f\u0e25\u0e4c",
  "header.followUs": "\u0e15\u0e34\u0e14\u0e15\u0e32\u0e21\u0e40\u0e23\u0e32",
  "browse.startWatchingFree": "\u0e40\u0e23\u0e34\u0e48\u0e21\u0e14\u0e39\u0e1f\u0e23\u0e35", "browse.trending": "\u0e01\u0e33\u0e25\u0e31\u0e07\u0e21\u0e32\u0e41\u0e23\u0e07", "browse.episodes": "\u0e15\u0e2d\u0e19", "browse.allShows": "\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14",
  "tab.drama": "\u0e14\u0e23\u0e32\u0e21\u0e48\u0e32", "tab.new": "\u0e43\u0e2b\u0e21\u0e48", "tab.popular": "\u0e22\u0e2d\u0e14\u0e19\u0e34\u0e22\u0e21", "tab.music": "\u0e40\u0e1e\u0e25\u0e07", "tab.reality": "\u0e40\u0e23\u0e35\u0e22\u0e25\u0e34\u0e15\u0e35\u0e49", "tab.redCarpet": "\u0e1e\u0e23\u0e21\u0e41\u0e14\u0e07",
  "shorts.list": "\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23", "shorts.saved": "\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e41\u0e25\u0e49\u0e27", "shorts.share": "\u0e41\u0e0a\u0e23\u0e4c", "shorts.copied": "\u0e04\u0e31\u0e14\u0e25\u0e2d\u0e01\u0e41\u0e25\u0e49\u0e27!", "shorts.sound": "\u0e40\u0e2a\u0e35\u0e22\u0e07", "shorts.soundOn": "\u0e40\u0e1b\u0e34\u0e14", "shorts.soundOff": "\u0e1b\u0e34\u0e14",
  "horizontal.widescreen": "\u0e08\u0e2d\u0e01\u0e27\u0e49\u0e32\u0e07", "horizontal.episodes": "\u0e15\u0e2d\u0e19", "horizontal.play": "\u0e40\u0e25\u0e48\u0e19", "horizontal.pause": "\u0e2b\u0e22\u0e38\u0e14",
  "profile.guest": "\u0e1c\u0e39\u0e49\u0e40\u0e22\u0e35\u0e48\u0e22\u0e21\u0e0a\u0e21", "profile.signIn": "\u0e40\u0e02\u0e49\u0e32\u0e2a\u0e39\u0e48\u0e23\u0e30\u0e1a\u0e1a", "profile.signInPrompt": "\u0e40\u0e02\u0e49\u0e32\u0e2a\u0e39\u0e48\u0e23\u0e30\u0e1a\u0e1a\u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e0b\u0e34\u0e07\u0e04\u0e4c\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25",
  "profile.coinBalance": "\u0e22\u0e2d\u0e14\u0e40\u0e2b\u0e23\u0e35\u0e22\u0e0d", "profile.coins": "\u0e40\u0e2b\u0e23\u0e35\u0e22\u0e0d", "profile.buyCoins": "\u0e0b\u0e37\u0e49\u0e2d\u0e40\u0e2b\u0e23\u0e35\u0e22\u0e0d",
  "profile.myList": "\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e02\u0e2d\u0e07\u0e09\u0e31\u0e19", "profile.continueWatching": "\u0e14\u0e39\u0e15\u0e48\u0e2d", "profile.purchaseHistory": "\u0e1b\u0e23\u0e30\u0e27\u0e31\u0e15\u0e34\u0e01\u0e32\u0e23\u0e0b\u0e37\u0e49\u0e2d",
  "profile.language": "\u0e20\u0e32\u0e29\u0e32", "profile.notifications": "\u0e01\u0e32\u0e23\u0e41\u0e08\u0e49\u0e07\u0e40\u0e15\u0e37\u0e2d\u0e19", "profile.darkMode": "\u0e42\u0e2b\u0e21\u0e14\u0e21\u0e37\u0e14",
  "profile.helpFaq": "\u0e0a\u0e48\u0e27\u0e22\u0e40\u0e2b\u0e25\u0e37\u0e2d\u0e41\u0e25\u0e30 FAQ", "profile.sendFeedback": "\u0e2a\u0e48\u0e07\u0e04\u0e27\u0e32\u0e21\u0e04\u0e34\u0e14\u0e40\u0e2b\u0e47\u0e19", "profile.reportProblem": "\u0e23\u0e32\u0e22\u0e07\u0e32\u0e19\u0e1b\u0e31\u0e0d\u0e2b\u0e32", "profile.signOut": "\u0e2d\u0e2d\u0e01\u0e08\u0e32\u0e01\u0e23\u0e30\u0e1a\u0e1a",
  "library.title": "\u0e04\u0e25\u0e31\u0e07\u0e40\u0e19\u0e37\u0e49\u0e2d\u0e2b\u0e32", "library.channels": "\u0e0a\u0e48\u0e2d\u0e07", "library.myList": "\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e02\u0e2d\u0e07\u0e09\u0e31\u0e19",
  "library.noSavedShows": "\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e17\u0e35\u0e48\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01", "library.browseShows": "\u0e40\u0e23\u0e35\u0e22\u0e01\u0e14\u0e39\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23", "library.comingSoon": "\u0e40\u0e23\u0e47\u0e27\u0e46 \u0e19\u0e35\u0e49", "library.shows": "\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23",
  "auth.signInHeading": "\u0e40\u0e02\u0e49\u0e32\u0e2a\u0e39\u0e48\u0e23\u0e30\u0e1a\u0e1a Verza TV", "auth.signUpHeading": "\u0e2a\u0e23\u0e49\u0e32\u0e07\u0e1a\u0e31\u0e0d\u0e0a\u0e35",
  "auth.email": "\u0e2d\u0e35\u0e40\u0e21\u0e25", "auth.displayName": "\u0e0a\u0e37\u0e48\u0e2d\u0e17\u0e35\u0e48\u0e41\u0e2a\u0e14\u0e07",
  "auth.continueWithEmail": "\u0e14\u0e33\u0e40\u0e19\u0e34\u0e19\u0e01\u0e32\u0e23\u0e14\u0e49\u0e27\u0e22\u0e2d\u0e35\u0e40\u0e21\u0e25", "auth.continueWithGoogle": "\u0e14\u0e33\u0e40\u0e19\u0e34\u0e19\u0e01\u0e32\u0e23\u0e14\u0e49\u0e27\u0e22 Google", "auth.continueWithApple": "\u0e14\u0e33\u0e40\u0e19\u0e34\u0e19\u0e01\u0e32\u0e23\u0e14\u0e49\u0e27\u0e22 Apple",
  "auth.createAccount": "\u0e2a\u0e23\u0e49\u0e32\u0e07\u0e1a\u0e31\u0e0d\u0e0a\u0e35", "auth.continueAsGuest": "\u0e14\u0e33\u0e40\u0e19\u0e34\u0e19\u0e01\u0e32\u0e23\u0e43\u0e19\u0e10\u0e32\u0e19\u0e30\u0e1c\u0e39\u0e49\u0e40\u0e22\u0e35\u0e48\u0e22\u0e21\u0e0a\u0e21",
  "auth.noAccount": "\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e1a\u0e31\u0e0d\u0e0a\u0e35?", "auth.haveAccount": "\u0e21\u0e35\u0e1a\u0e31\u0e0d\u0e0a\u0e35\u0e2d\u0e22\u0e39\u0e48\u0e41\u0e25\u0e49\u0e27?", "auth.signUp": "\u0e2a\u0e21\u0e31\u0e04\u0e23\u0e2a\u0e21\u0e32\u0e0a\u0e34\u0e01",
  "legal.terms": "\u0e02\u0e49\u0e2d\u0e01\u0e33\u0e2b\u0e19\u0e14\u0e01\u0e32\u0e23\u0e43\u0e2b\u0e49\u0e1a\u0e23\u0e34\u0e01\u0e32\u0e23", "legal.privacy": "\u0e19\u0e42\u0e22\u0e1a\u0e32\u0e22\u0e04\u0e27\u0e32\u0e21\u0e40\u0e1b\u0e47\u0e19\u0e2a\u0e48\u0e27\u0e19\u0e15\u0e31\u0e27", "legal.refund": "\u0e19\u0e42\u0e22\u0e1a\u0e32\u0e22\u0e01\u0e32\u0e23\u0e04\u0e37\u0e19\u0e40\u0e07\u0e34\u0e19",
  "misc.free": "\u0e1f\u0e23\u0e35", "misc.comingSoon": "\u0e40\u0e23\u0e47\u0e27\u0e46 \u0e19\u0e35\u0e49", "misc.close": "\u0e1b\u0e34\u0e14",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "The first 5 episodes are free. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
};

const vi: Translations = {
  "nav.discover": "Kh\u00e1m ph\u00e1", "nav.shorts": "Video ng\u1eafn", "nav.widescreen": "M\u00e0n h\u00ecnh r\u1ed9ng",
  "nav.shop": "C\u1eeda h\u00e0ng", "nav.library": "Th\u01b0 vi\u1ec7n", "nav.profile": "H\u1ed3 s\u01a1",
  "header.followUs": "Theo d\u00f5i ch\u00fang t\u00f4i",
  "browse.startWatchingFree": "B\u1eaft \u0111\u1ea7u xem mi\u1ec5n ph\u00ed", "browse.trending": "Th\u1ecbnh h\u00e0nh", "browse.episodes": "t\u1eadp", "browse.allShows": "T\u1ea5t c\u1ea3",
  "tab.drama": "K\u1ecbch", "tab.new": "M\u1edbi", "tab.popular": "Ph\u1ed5 bi\u1ebfn", "tab.music": "\u00c2m nh\u1ea1c", "tab.reality": "Th\u1ef1c t\u1ebf", "tab.redCarpet": "Th\u1ea3m \u0111\u1ecf",
  "shorts.list": "Danh s\u00e1ch", "shorts.saved": "\u0110\u00e3 l\u01b0u", "shorts.share": "Chia s\u1ebb", "shorts.copied": "\u0110\u00e3 sao ch\u00e9p!", "shorts.sound": "\u00c2m thanh", "shorts.soundOn": "B\u1eadt", "shorts.soundOff": "T\u1eaft",
  "horizontal.widescreen": "M\u00e0n h\u00ecnh r\u1ed9ng", "horizontal.episodes": "t\u1eadp", "horizontal.play": "Ph\u00e1t", "horizontal.pause": "D\u1eebng",
  "profile.guest": "Kh\u00e1ch", "profile.signIn": "\u0110\u0103ng nh\u1eadp", "profile.signInPrompt": "\u0110\u0103ng nh\u1eadp \u0111\u1ec3 \u0111\u1ed3ng b\u1ed9 th\u01b0 vi\u1ec7n",
  "profile.coinBalance": "S\u1ed1 d\u01b0 xu", "profile.coins": "xu", "profile.buyCoins": "Mua xu",
  "profile.myList": "Danh s\u00e1ch c\u1ee7a t\u00f4i", "profile.continueWatching": "Xem ti\u1ebfp", "profile.purchaseHistory": "L\u1ecbch s\u1eed mua",
  "profile.language": "Ng\u00f4n ng\u1eef", "profile.notifications": "Th\u00f4ng b\u00e1o", "profile.darkMode": "Ch\u1ebf \u0111\u1ed9 t\u1ed1i",
  "profile.helpFaq": "Tr\u1ee3 gi\u00fap & FAQ", "profile.sendFeedback": "G\u1eedi ph\u1ea3n h\u1ed3i", "profile.reportProblem": "B\u00e1o c\u00e1o s\u1ef1 c\u1ed1", "profile.signOut": "\u0110\u0103ng xu\u1ea5t",
  "library.title": "Th\u01b0 vi\u1ec7n", "library.channels": "K\u00eanh", "library.myList": "Danh s\u00e1ch c\u1ee7a t\u00f4i",
  "library.noSavedShows": "Ch\u01b0a c\u00f3 ch\u01b0\u01a1ng tr\u00ecnh n\u00e0o", "library.browseShows": "Duy\u1ec7t ch\u01b0\u01a1ng tr\u00ecnh", "library.comingSoon": "S\u1eafp ra m\u1eaft", "library.shows": "ch\u01b0\u01a1ng tr\u00ecnh",
  "auth.signInHeading": "\u0110\u0103ng nh\u1eadp Verza TV", "auth.signUpHeading": "T\u1ea1o t\u00e0i kho\u1ea3n",
  "auth.email": "\u0110\u1ecba ch\u1ec9 email", "auth.displayName": "T\u00ean hi\u1ec3n th\u1ecb",
  "auth.continueWithEmail": "Ti\u1ebfp t\u1ee5c v\u1edbi Email", "auth.continueWithGoogle": "Ti\u1ebfp t\u1ee5c v\u1edbi Google", "auth.continueWithApple": "Ti\u1ebfp t\u1ee5c v\u1edbi Apple",
  "auth.createAccount": "T\u1ea1o t\u00e0i kho\u1ea3n", "auth.continueAsGuest": "Ti\u1ebfp t\u1ee5c nh\u01b0 kh\u00e1ch",
  "auth.noAccount": "Ch\u01b0a c\u00f3 t\u00e0i kho\u1ea3n?", "auth.haveAccount": "\u0110\u00e3 c\u00f3 t\u00e0i kho\u1ea3n?", "auth.signUp": "\u0110\u0103ng k\u00fd",
  "legal.terms": "\u0110i\u1ec1u kho\u1ea3n d\u1ecbch v\u1ee5", "legal.privacy": "Ch\u00ednh s\u00e1ch b\u1ea3o m\u1eadt", "legal.refund": "Ch\u00ednh s\u00e1ch ho\u00e0n ti\u1ec1n",
  "misc.free": "Mi\u1ec5n ph\u00ed", "misc.comingSoon": "S\u1eafp ra m\u1eaft", "misc.close": "\u0110\u00f3ng",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "The first 5 episodes are free. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
};

const id: Translations = {
  "nav.discover": "Temukan", "nav.shorts": "Pendek", "nav.widescreen": "Layar Lebar",
  "nav.shop": "Toko", "nav.library": "Perpustakaan", "nav.profile": "Profil",
  "header.followUs": "Ikuti kami",
  "browse.startWatchingFree": "Mulai Nonton Gratis", "browse.trending": "Trending", "browse.episodes": "episode", "browse.allShows": "Semua Acara",
  "tab.drama": "Drama", "tab.new": "Baru", "tab.popular": "Populer", "tab.music": "Musik", "tab.reality": "Realitas", "tab.redCarpet": "Karpet Merah",
  "shorts.list": "Daftar", "shorts.saved": "Tersimpan", "shorts.share": "Bagikan", "shorts.copied": "Disalin!", "shorts.sound": "Suara", "shorts.soundOn": "On", "shorts.soundOff": "Off",
  "horizontal.widescreen": "Layar Lebar", "horizontal.episodes": "episode", "horizontal.play": "Putar", "horizontal.pause": "Jeda",
  "profile.guest": "Tamu", "profile.signIn": "Masuk", "profile.signInPrompt": "Masuk untuk menyinkronkan perpustakaan Anda",
  "profile.coinBalance": "Saldo Koin", "profile.coins": "koin", "profile.buyCoins": "Beli Koin",
  "profile.myList": "Daftar Saya", "profile.continueWatching": "Lanjut Menonton", "profile.purchaseHistory": "Riwayat Pembelian",
  "profile.language": "Bahasa", "profile.notifications": "Notifikasi", "profile.darkMode": "Mode Gelap",
  "profile.helpFaq": "Bantuan & FAQ", "profile.sendFeedback": "Kirim Masukan", "profile.reportProblem": "Laporkan Masalah", "profile.signOut": "Keluar",
  "library.title": "Perpustakaan", "library.channels": "Kanal", "library.myList": "Daftar Saya",
  "library.noSavedShows": "Belum ada acara tersimpan", "library.browseShows": "Jelajahi Acara", "library.comingSoon": "Segera Hadir", "library.shows": "acara",
  "auth.signInHeading": "Masuk ke Verza TV", "auth.signUpHeading": "Buat akun Anda",
  "auth.email": "Alamat email", "auth.displayName": "Nama tampilan",
  "auth.continueWithEmail": "Lanjutkan dengan Email", "auth.continueWithGoogle": "Lanjutkan dengan Google", "auth.continueWithApple": "Lanjutkan dengan Apple",
  "auth.createAccount": "Buat Akun", "auth.continueAsGuest": "Lanjutkan sebagai Tamu",
  "auth.noAccount": "Belum punya akun?", "auth.haveAccount": "Sudah punya akun?", "auth.signUp": "Daftar",
  "legal.terms": "Ketentuan Layanan", "legal.privacy": "Kebijakan Privasi", "legal.refund": "Kebijakan Pengembalian",
  "misc.free": "Gratis", "misc.comingSoon": "Segera Hadir", "misc.close": "Tutup",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "The first 5 episodes are free. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
};

const tl: Translations = {
  "nav.discover": "Tuklasin", "nav.shorts": "Shorts", "nav.widescreen": "Widescreen",
  "nav.shop": "Tindahan", "nav.library": "Aklatan", "nav.profile": "Profile",
  "header.followUs": "Sundan kami",
  "browse.startWatchingFree": "Magsimulang Manood Nang Libre", "browse.trending": "Trending", "browse.episodes": "mga episodyo", "browse.allShows": "Lahat ng Palabas",
  "tab.drama": "Drama", "tab.new": "Bago", "tab.popular": "Sikat", "tab.music": "Musika", "tab.reality": "Reality", "tab.redCarpet": "Red Carpet",
  "shorts.list": "Listahan", "shorts.saved": "Nai-save", "shorts.share": "I-share", "shorts.copied": "Nakopya!", "shorts.sound": "Tunog", "shorts.soundOn": "On", "shorts.soundOff": "Off",
  "horizontal.widescreen": "Widescreen", "horizontal.episodes": "mga episodyo", "horizontal.play": "I-play", "horizontal.pause": "I-pause",
  "profile.guest": "Bisita", "profile.signIn": "Mag-sign In", "profile.signInPrompt": "Mag-sign in para ma-sync ang iyong aklatan",
  "profile.coinBalance": "Balanse ng Coins", "profile.coins": "coins", "profile.buyCoins": "Bumili ng Coins",
  "profile.myList": "Aking Listahan", "profile.continueWatching": "Ipagpatuloy ang Panonood", "profile.purchaseHistory": "Kasaysayan ng Pagbili",
  "profile.language": "Wika", "profile.notifications": "Mga Abiso", "profile.darkMode": "Dark Mode",
  "profile.helpFaq": "Tulong at FAQ", "profile.sendFeedback": "Magpadala ng Feedback", "profile.reportProblem": "Mag-ulat ng Problema", "profile.signOut": "Mag-sign Out",
  "library.title": "Aklatan", "library.channels": "Mga Channel", "library.myList": "Aking Listahan",
  "library.noSavedShows": "Wala pang naka-save na palabas", "library.browseShows": "Mag-browse ng Palabas", "library.comingSoon": "Malapit Na", "library.shows": "mga palabas",
  "auth.signInHeading": "Mag-sign in sa Verza TV", "auth.signUpHeading": "Gumawa ng iyong account",
  "auth.email": "Email address", "auth.displayName": "Display name",
  "auth.continueWithEmail": "Magpatuloy gamit ang Email", "auth.continueWithGoogle": "Magpatuloy gamit ang Google", "auth.continueWithApple": "Magpatuloy gamit ang Apple",
  "auth.createAccount": "Gumawa ng Account", "auth.continueAsGuest": "Magpatuloy bilang Bisita",
  "auth.noAccount": "Wala pang account?", "auth.haveAccount": "May account na?", "auth.signUp": "Mag-sign Up",
  "legal.terms": "Mga Tuntunin ng Serbisyo", "legal.privacy": "Patakaran sa Privacy", "legal.refund": "Patakaran sa Refund",
  "misc.free": "Libre", "misc.comingSoon": "Malapit Na", "misc.close": "Isara",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "The first 5 episodes are free. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
};

const sw: Translations = {
  "nav.discover": "Gundua", "nav.shorts": "Fupi", "nav.widescreen": "Skrini Pana",
  "nav.shop": "Duka", "nav.library": "Maktaba", "nav.profile": "Wasifu",
  "header.followUs": "Tufuate",
  "browse.startWatchingFree": "Anza Kutazama Bure", "browse.trending": "Inayoendelea", "browse.episodes": "vipindi", "browse.allShows": "Vipindi Vyote",
  "tab.drama": "Drama", "tab.new": "Mpya", "tab.popular": "Maarufu", "tab.music": "Muziki", "tab.reality": "Uhalisia", "tab.redCarpet": "Zulia Jekundu",
  "shorts.list": "Orodha", "shorts.saved": "Imehifadhiwa", "shorts.share": "Shiriki", "shorts.copied": "Imenakiliwa!", "shorts.sound": "Sauti", "shorts.soundOn": "Washa", "shorts.soundOff": "Zima",
  "horizontal.widescreen": "Skrini Pana", "horizontal.episodes": "vipindi", "horizontal.play": "Cheza", "horizontal.pause": "Sitisha",
  "profile.guest": "Mgeni", "profile.signIn": "Ingia", "profile.signInPrompt": "Ingia ili kusawazisha maktaba yako",
  "profile.coinBalance": "Salio la Sarafu", "profile.coins": "sarafu", "profile.buyCoins": "Nunua Sarafu",
  "profile.myList": "Orodha Yangu", "profile.continueWatching": "Endelea Kutazama", "profile.purchaseHistory": "Historia ya Ununuzi",
  "profile.language": "Lugha", "profile.notifications": "Arifa", "profile.darkMode": "Hali ya Giza",
  "profile.helpFaq": "Msaada na Maswali", "profile.sendFeedback": "Tuma Maoni", "profile.reportProblem": "Ripoti Tatizo", "profile.signOut": "Ondoka",
  "library.title": "Maktaba", "library.channels": "Vituo", "library.myList": "Orodha Yangu",
  "library.noSavedShows": "Hakuna vipindi vilivyohifadhiwa", "library.browseShows": "Vinjari Vipindi", "library.comingSoon": "Inakuja Hivi Karibuni", "library.shows": "vipindi",
  "auth.signInHeading": "Ingia kwenye Verza TV", "auth.signUpHeading": "Fungua akaunti yako",
  "auth.email": "Anwani ya barua pepe", "auth.displayName": "Jina la kuonyesha",
  "auth.continueWithEmail": "Endelea na Barua Pepe", "auth.continueWithGoogle": "Endelea na Google", "auth.continueWithApple": "Endelea na Apple",
  "auth.createAccount": "Fungua Akaunti", "auth.continueAsGuest": "Endelea kama Mgeni",
  "auth.noAccount": "Huna akaunti?", "auth.haveAccount": "Una akaunti tayari?", "auth.signUp": "Jisajili",
  "legal.terms": "Masharti ya Huduma", "legal.privacy": "Sera ya Faragha", "legal.refund": "Sera ya Kurejesha Pesa",
  "misc.free": "Bure", "misc.comingSoon": "Inakuja Hivi Karibuni", "misc.close": "Funga",
  "content.synopsis": "Synopsis", "content.episodes": "Episodes", "content.cast": "Cast", "content.moreLikeThis": "More Like This", "content.views": "views", "content.now": "NOW", "content.info": "Info", "content.allEpisodes": "All Episodes", "content.previous": "Previous", "content.next": "Next", "content.episodeOf": "Episode {n} of {total}", "content.trending": "Trending", "content.watchFree": "Watch Episode 1 Free", "content.unlockSeries": "Unlock Full Series", "content.oneTimePayment": "One-time payment", "content.allEpisodesIncluded": "All episodes included", "content.episodeLocked": "Episode {n} is locked", "content.unlockPrompt": "The first 5 episodes are free. Unlock the full series to keep watching.", "content.tryAgain": "Try Again",
};

/* All 20 languages fully translated */
export const dictionaries: Record<Locale, Translations> = {
  en, es, fr, pt, de, it, ja, ko, zh, hi,
  ar, ru, tr, pl, nl, th, vi, id, tl, sw,
};

export const DEFAULT_LOCALE: Locale = "en";
export const STORAGE_KEY = "verza-lang";
