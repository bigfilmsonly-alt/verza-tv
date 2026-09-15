/* ==================================================================== */
/*  Transaction copy for the web purchase journey.                       */
/* ==================================================================== */

/**
 * WEB ONLY. These strings deliberately do NOT live in `lib/i18n.ts`.
 *
 * `lib/i18n.ts` is byte-identical with `~/verza-native/src/lib/i18n.ts` and is
 * one of the 29 files the native `test:data-sync` gate hashes. Editing it here
 * would fail that gate until someone re-synced the native repo, and the native
 * app is frozen.
 *
 * These strings are also genuinely web-only. Native sells through StoreKit and
 * has no sign-in redirect and no Stripe hand-off, so "after signing in you
 * continue to checkout" has no native counterpart. The existing `paywall.*`
 * keys stay in i18n.ts untouched, still serving the native paywall.
 *
 * Non-ASCII is written as \uXXXX escapes, matching i18n.ts. A file that is
 * pure ASCII on disk cannot turn into mojibake when a charset header goes
 * missing, and that failure only ever shows up over HTTP, never from disk.
 */

import type { Locale } from "@/lib/i18n";

export type PurchaseCopyKey =
  | "readyForRest"
  | "unlockAllCount"
  | "oneTimePurchase"
  | "oneTimeWithPrice"
  | "secureCheckout"
  | "backToEpisodes"
  | "alreadyPurchased"
  | "signInAction"
  | "oneStepAway"
  | "signInToUnlockRest"
  | "continueToCheckout"
  | "newToVerza"
  | "createAccountAction";

const COPY: Record<Locale, Record<PurchaseCopyKey, string>> = {
  en: {
    readyForRest: "Ready for the rest?",
    unlockAllCount: "Unlock all {count} episodes",
    oneTimePurchase: "One-time purchase",
    oneTimeWithPrice: "{price} one-time",
    secureCheckout: "Secure checkout",
    backToEpisodes: "Back to episodes",
    alreadyPurchased: "Already purchased?",
    signInAction: "Sign in",
    oneStepAway: "One step away",
    signInToUnlockRest: "Sign in to unlock the rest",
    continueToCheckout: "After signing in, you'll continue directly to checkout.",
    newToVerza: "New to Verza?",
    createAccountAction: "Create account",
  },
  es: {
    readyForRest: "\u00bfListo para el resto?",
    unlockAllCount: "Desbloquea los {count} episodios",
    oneTimePurchase: "Pago \u00fanico",
    oneTimeWithPrice: "{price}, pago \u00fanico",
    secureCheckout: "Pago seguro",
    backToEpisodes: "Volver a los episodios",
    alreadyPurchased: "\u00bfYa lo compraste?",
    signInAction: "Inicia sesi\u00f3n",
    oneStepAway: "A un paso",
    signInToUnlockRest: "Inicia sesi\u00f3n para desbloquear el resto",
    continueToCheckout: "Despu\u00e9s de iniciar sesi\u00f3n, continuar\u00e1s directo al pago.",
    newToVerza: "\u00bfNuevo en Verza?",
    createAccountAction: "Crear cuenta",
  },
  fr: {
    readyForRest: "Pr\u00eat pour la suite ?",
    unlockAllCount: "D\u00e9bloquez les {count} \u00e9pisodes",
    oneTimePurchase: "Paiement unique",
    oneTimeWithPrice: "{price}, paiement unique",
    secureCheckout: "Paiement s\u00e9curis\u00e9",
    backToEpisodes: "Retour aux \u00e9pisodes",
    alreadyPurchased: "D\u00e9j\u00e0 achet\u00e9 ?",
    signInAction: "Se connecter",
    oneStepAway: "Plus qu'une \u00e9tape",
    signInToUnlockRest: "Connectez-vous pour d\u00e9bloquer la suite",
    continueToCheckout: "Apr\u00e8s connexion, vous passerez directement au paiement.",
    newToVerza: "Nouveau sur Verza ?",
    createAccountAction: "Cr\u00e9er un compte",
  },
  pt: {
    readyForRest: "Pronto para o resto?",
    unlockAllCount: "Desbloqueie os {count} epis\u00f3dios",
    oneTimePurchase: "Pagamento \u00fanico",
    oneTimeWithPrice: "{price}, pagamento \u00fanico",
    secureCheckout: "Pagamento seguro",
    backToEpisodes: "Voltar aos epis\u00f3dios",
    alreadyPurchased: "J\u00e1 comprou?",
    signInAction: "Entrar",
    oneStepAway: "A um passo",
    signInToUnlockRest: "Entre para desbloquear o resto",
    continueToCheckout: "Ap\u00f3s entrar, voc\u00ea vai direto para o pagamento.",
    newToVerza: "Novo na Verza?",
    createAccountAction: "Criar conta",
  },
  de: {
    readyForRest: "Bereit f\u00fcr den Rest?",
    unlockAllCount: "Alle {count} Folgen freischalten",
    oneTimePurchase: "Einmalige Zahlung",
    oneTimeWithPrice: "{price}, einmalig",
    secureCheckout: "Sichere Zahlung",
    backToEpisodes: "Zur\u00fcck zu den Folgen",
    alreadyPurchased: "Schon gekauft?",
    signInAction: "Anmelden",
    oneStepAway: "Nur noch ein Schritt",
    signInToUnlockRest: "Melde dich an, um den Rest freizuschalten",
    continueToCheckout: "Nach der Anmeldung geht es direkt zur Zahlung.",
    newToVerza: "Neu bei Verza?",
    createAccountAction: "Konto erstellen",
  },
  it: {
    readyForRest: "Pronto per il resto?",
    unlockAllCount: "Sblocca tutti i {count} episodi",
    oneTimePurchase: "Pagamento unico",
    oneTimeWithPrice: "{price}, una tantum",
    secureCheckout: "Pagamento sicuro",
    backToEpisodes: "Torna agli episodi",
    alreadyPurchased: "Gi\u00e0 acquistato?",
    signInAction: "Accedi",
    oneStepAway: "Manca un passo",
    signInToUnlockRest: "Accedi per sbloccare il resto",
    continueToCheckout: "Dopo l'accesso andrai direttamente al pagamento.",
    newToVerza: "Nuovo su Verza?",
    createAccountAction: "Crea un account",
  },
  ja: {
    readyForRest: "\u7d9a\u304d\u3092\u898b\u307e\u3059\u304b\uff1f",
    unlockAllCount: "\u5168{count}\u8a71\u3092\u30a2\u30f3\u30ed\u30c3\u30af",
    oneTimePurchase: "\u4e00\u5ea6\u3060\u3051\u306e\u304a\u652f\u6255\u3044",
    oneTimeWithPrice: "{price} \u8cb7\u3044\u5207\u308a",
    secureCheckout: "\u5b89\u5168\u306a\u304a\u652f\u6255\u3044",
    backToEpisodes: "\u30a8\u30d4\u30bd\u30fc\u30c9\u306b\u623b\u308b",
    alreadyPurchased: "\u8cfc\u5165\u6e08\u307f\u3067\u3059\u304b\uff1f",
    signInAction: "\u30ed\u30b0\u30a4\u30f3",
    oneStepAway: "\u3042\u3068\u4e00\u6b69",
    signInToUnlockRest: "\u30ed\u30b0\u30a4\u30f3\u3057\u3066\u6b8b\u308a\u3092\u30a2\u30f3\u30ed\u30c3\u30af",
    continueToCheckout: "\u30ed\u30b0\u30a4\u30f3\u5f8c\u3001\u305d\u306e\u307e\u307e\u304a\u652f\u6255\u3044\u306b\u9032\u307f\u307e\u3059\u3002",
    newToVerza: "Verza\u306f\u521d\u3081\u3066\u3067\u3059\u304b\uff1f",
    createAccountAction: "\u30a2\u30ab\u30a6\u30f3\u30c8\u3092\u4f5c\u6210",
  },
  ko: {
    readyForRest: "\ub098\uba38\uc9c0\ub3c4 \ubcf4\uc2dc\uaca0\uc5b4\uc694?",
    unlockAllCount: "\uc804\uccb4 {count}\ud654 \uc7a0\uae08 \ud574\uc81c",
    oneTimePurchase: "1\ud68c \uacb0\uc81c",
    oneTimeWithPrice: "{price} 1\ud68c \uacb0\uc81c",
    secureCheckout: "\uc548\uc804\ud55c \uacb0\uc81c",
    backToEpisodes: "\uc5d0\ud53c\uc18c\ub4dc\ub85c \ub3cc\uc544\uac00\uae30",
    alreadyPurchased: "\uc774\ubbf8 \uad6c\ub9e4\ud558\uc168\ub098\uc694?",
    signInAction: "\ub85c\uadf8\uc778",
    oneStepAway: "\ud55c \ub2e8\uacc4 \ub0a8\uc558\uc5b4\uc694",
    signInToUnlockRest: "\ub85c\uadf8\uc778\ud558\uace0 \ub098\uba38\uc9c0\ub97c \uc7a0\uae08 \ud574\uc81c",
    continueToCheckout: "\ub85c\uadf8\uc778\ud558\uba74 \ubc14\ub85c \uacb0\uc81c\ub85c \uc774\ub3d9\ud569\ub2c8\ub2e4.",
    newToVerza: "Verza\uac00 \ucc98\uc74c\uc774\uc2e0\uac00\uc694?",
    createAccountAction: "\uacc4\uc815 \ub9cc\ub4e4\uae30",
  },
  zh: {
    readyForRest: "\u60f3\u770b\u5b8c\u6574\u6545\u4e8b\u5417\uff1f",
    unlockAllCount: "\u89e3\u9501\u5168\u90e8 {count} \u96c6",
    oneTimePurchase: "\u4e00\u6b21\u6027\u4ed8\u6b3e",
    oneTimeWithPrice: "{price} \u4e00\u6b21\u6027",
    secureCheckout: "\u5b89\u5168\u652f\u4ed8",
    backToEpisodes: "\u8fd4\u56de\u5267\u96c6",
    alreadyPurchased: "\u5df2\u7ecf\u8d2d\u4e70\uff1f",
    signInAction: "\u767b\u5f55",
    oneStepAway: "\u53ea\u5dee\u4e00\u6b65",
    signInToUnlockRest: "\u767b\u5f55\u540e\u89e3\u9501\u5269\u4f59\u5267\u96c6",
    continueToCheckout: "\u767b\u5f55\u540e\u5c06\u76f4\u63a5\u8fdb\u5165\u652f\u4ed8\u3002",
    newToVerza: "\u7b2c\u4e00\u6b21\u4f7f\u7528 Verza\uff1f",
    createAccountAction: "\u521b\u5efa\u8d26\u6237",
  },
  hi: {
    readyForRest: "\u092c\u093e\u0915\u0940 \u0926\u0947\u0916\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f \u0924\u0948\u092f\u093e\u0930?",
    unlockAllCount: "\u0938\u092d\u0940 {count} \u090f\u092a\u093f\u0938\u094b\u0921 \u0905\u0928\u0932\u0949\u0915 \u0915\u0930\u0947\u0902",
    oneTimePurchase: "\u090f\u0915 \u092c\u093e\u0930 \u0915\u093e \u092d\u0941\u0917\u0924\u093e\u0928",
    oneTimeWithPrice: "{price} \u090f\u0915 \u092c\u093e\u0930",
    secureCheckout: "\u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924 \u092d\u0941\u0917\u0924\u093e\u0928",
    backToEpisodes: "\u090f\u092a\u093f\u0938\u094b\u0921 \u092a\u0930 \u0935\u093e\u092a\u0938 \u091c\u093e\u090f\u0902",
    alreadyPurchased: "\u092a\u0939\u0932\u0947 \u0916\u0930\u0940\u0926 \u091a\u0941\u0915\u0947 \u0939\u0948\u0902?",
    signInAction: "\u0938\u093e\u0907\u0928 \u0907\u0928 \u0915\u0930\u0947\u0902",
    oneStepAway: "\u092c\u0938 \u090f\u0915 \u0915\u0926\u092e \u0926\u0942\u0930",
    signInToUnlockRest: "\u092c\u093e\u0915\u0940 \u0905\u0928\u0932\u0949\u0915 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f \u0938\u093e\u0907\u0928 \u0907\u0928 \u0915\u0930\u0947\u0902",
    continueToCheckout: "\u0938\u093e\u0907\u0928 \u0907\u0928 \u0915\u0947 \u092c\u093e\u0926 \u0906\u092a \u0938\u0940\u0927\u0947 \u092d\u0941\u0917\u0924\u093e\u0928 \u092a\u0930 \u091c\u093e\u090f\u0902\u0917\u0947\u0964",
    newToVerza: "Verza \u092a\u0930 \u0928\u090f \u0939\u0948\u0902?",
    createAccountAction: "\u0916\u093e\u0924\u093e \u092c\u0928\u093e\u090f\u0902",
  },
  ar: {
    readyForRest: "\u0647\u0644 \u0623\u0646\u062a \u0645\u0633\u062a\u0639\u062f \u0644\u0644\u0628\u0627\u0642\u064a\u061f",
    unlockAllCount: "\u0627\u0641\u062a\u062d \u0643\u0644 \u0627\u0644\u062d\u0644\u0642\u0627\u062a {count}",
    oneTimePurchase: "\u062f\u0641\u0639\u0629 \u0648\u0627\u062d\u062f\u0629",
    oneTimeWithPrice: "{price} \u062f\u0641\u0639\u0629 \u0648\u0627\u062d\u062f\u0629",
    secureCheckout: "\u062f\u0641\u0639 \u0622\u0645\u0646",
    backToEpisodes: "\u0627\u0644\u0639\u0648\u062f\u0629 \u0625\u0644\u0649 \u0627\u0644\u062d\u0644\u0642\u0627\u062a",
    alreadyPurchased: "\u0627\u0634\u062a\u0631\u064a\u062a\u0647\u0627 \u0645\u0646 \u0642\u0628\u0644\u061f",
    signInAction: "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644",
    oneStepAway: "\u062e\u0637\u0648\u0629 \u0648\u0627\u062d\u062f\u0629 \u0641\u0642\u0637",
    signInToUnlockRest: "\u0633\u062c\u0651\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0644\u0641\u062a\u062d \u0628\u0627\u0642\u064a \u0627\u0644\u062d\u0644\u0642\u0627\u062a",
    continueToCheckout: "\u0628\u0639\u062f \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0633\u062a\u0646\u062a\u0642\u0644 \u0645\u0628\u0627\u0634\u0631\u0629 \u0625\u0644\u0649 \u0627\u0644\u062f\u0641\u0639.",
    newToVerza: "\u062c\u062f\u064a\u062f \u0639\u0644\u0649 Verza\u061f",
    createAccountAction: "\u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628",
  },
  ru: {
    readyForRest: "\u0413\u043e\u0442\u043e\u0432\u044b \u043a \u043f\u0440\u043e\u0434\u043e\u043b\u0436\u0435\u043d\u0438\u044e?",
    unlockAllCount: "\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u0432\u0441\u0435 {count} \u0441\u0435\u0440\u0438\u0439",
    oneTimePurchase: "\u0420\u0430\u0437\u043e\u0432\u044b\u0439 \u043f\u043b\u0430\u0442\u0451\u0436",
    oneTimeWithPrice: "{price}, \u0440\u0430\u0437\u043e\u0432\u044b\u0439 \u043f\u043b\u0430\u0442\u0451\u0436",
    secureCheckout: "\u0411\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u0430\u044f \u043e\u043f\u043b\u0430\u0442\u0430",
    backToEpisodes: "\u0412\u0435\u0440\u043d\u0443\u0442\u044c\u0441\u044f \u043a \u0441\u0435\u0440\u0438\u044f\u043c",
    alreadyPurchased: "\u0423\u0436\u0435 \u043a\u0443\u043f\u0438\u043b\u0438?",
    signInAction: "\u0412\u043e\u0439\u0442\u0438",
    oneStepAway: "\u041e\u0441\u0442\u0430\u043b\u0441\u044f \u043e\u0434\u0438\u043d \u0448\u0430\u0433",
    signInToUnlockRest: "\u0412\u043e\u0439\u0434\u0438\u0442\u0435, \u0447\u0442\u043e\u0431\u044b \u043e\u0442\u043a\u0440\u044b\u0442\u044c \u043e\u0441\u0442\u0430\u043b\u044c\u043d\u043e\u0435",
    continueToCheckout: "\u041f\u043e\u0441\u043b\u0435 \u0432\u0445\u043e\u0434\u0430 \u0432\u044b \u0441\u0440\u0430\u0437\u0443 \u043f\u0435\u0440\u0435\u0439\u0434\u0451\u0442\u0435 \u043a \u043e\u043f\u043b\u0430\u0442\u0435.",
    newToVerza: "\u0412\u043f\u0435\u0440\u0432\u044b\u0435 \u043d\u0430 Verza?",
    createAccountAction: "\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442",
  },
  tr: {
    readyForRest: "Devam\u0131na haz\u0131r m\u0131s\u0131n?",
    unlockAllCount: "{count} b\u00f6l\u00fcm\u00fcn tamam\u0131n\u0131n kilidini a\u00e7",
    oneTimePurchase: "Tek seferlik \u00f6deme",
    oneTimeWithPrice: "{price} tek seferlik",
    secureCheckout: "G\u00fcvenli \u00f6deme",
    backToEpisodes: "B\u00f6l\u00fcmlere d\u00f6n",
    alreadyPurchased: "Zaten sat\u0131n ald\u0131n m\u0131?",
    signInAction: "Giri\u015f yap",
    oneStepAway: "Tek ad\u0131m kald\u0131",
    signInToUnlockRest: "Geri kalan\u0131n kilidini a\u00e7mak i\u00e7in giri\u015f yap",
    continueToCheckout: "Giri\u015f yapt\u0131ktan sonra do\u011frudan \u00f6demeye ge\u00e7eceksin.",
    newToVerza: "Verza'da yeni misin?",
    createAccountAction: "Hesap olu\u015ftur",
  },
  pl: {
    readyForRest: "Gotowy na reszt\u0119?",
    unlockAllCount: "Odblokuj wszystkie odcinki ({count})",
    oneTimePurchase: "P\u0142atno\u015b\u0107 jednorazowa",
    oneTimeWithPrice: "{price} jednorazowo",
    secureCheckout: "Bezpieczna p\u0142atno\u015b\u0107",
    backToEpisodes: "Wr\u00f3\u0107 do odcink\u00f3w",
    alreadyPurchased: "Masz ju\u017c zakup?",
    signInAction: "Zaloguj si\u0119",
    oneStepAway: "Zosta\u0142 jeden krok",
    signInToUnlockRest: "Zaloguj si\u0119, aby odblokowa\u0107 reszt\u0119",
    continueToCheckout: "Po zalogowaniu przejdziesz prosto do p\u0142atno\u015bci.",
    newToVerza: "Pierwszy raz w Verza?",
    createAccountAction: "Za\u0142\u00f3\u017c konto",
  },
  nl: {
    readyForRest: "Klaar voor de rest?",
    unlockAllCount: "Ontgrendel alle {count} afleveringen",
    oneTimePurchase: "Eenmalige betaling",
    oneTimeWithPrice: "{price} eenmalig",
    secureCheckout: "Veilig betalen",
    backToEpisodes: "Terug naar afleveringen",
    alreadyPurchased: "Al gekocht?",
    signInAction: "Inloggen",
    oneStepAway: "Nog \u00e9\u00e9n stap",
    signInToUnlockRest: "Log in om de rest te ontgrendelen",
    continueToCheckout: "Na het inloggen ga je direct door naar de betaling.",
    newToVerza: "Nieuw bij Verza?",
    createAccountAction: "Account aanmaken",
  },
  th: {
    readyForRest: "\u0e1e\u0e23\u0e49\u0e2d\u0e21\u0e14\u0e39\u0e15\u0e48\u0e2d\u0e44\u0e2b\u0e21?",
    unlockAllCount: "\u0e1b\u0e25\u0e14\u0e25\u0e47\u0e2d\u0e01\u0e04\u0e23\u0e1a\u0e17\u0e31\u0e49\u0e07 {count} \u0e15\u0e2d\u0e19",
    oneTimePurchase: "\u0e0a\u0e33\u0e23\u0e30\u0e04\u0e23\u0e31\u0e49\u0e07\u0e40\u0e14\u0e35\u0e22\u0e27",
    oneTimeWithPrice: "{price} \u0e04\u0e23\u0e31\u0e49\u0e07\u0e40\u0e14\u0e35\u0e22\u0e27",
    secureCheckout: "\u0e0a\u0e33\u0e23\u0e30\u0e40\u0e07\u0e34\u0e19\u0e1b\u0e25\u0e2d\u0e14\u0e20\u0e31\u0e22",
    backToEpisodes: "\u0e01\u0e25\u0e31\u0e1a\u0e44\u0e1b\u0e17\u0e35\u0e48\u0e15\u0e2d\u0e19",
    alreadyPurchased: "\u0e0b\u0e37\u0e49\u0e2d\u0e44\u0e27\u0e49\u0e41\u0e25\u0e49\u0e27?",
    signInAction: "\u0e40\u0e02\u0e49\u0e32\u0e2a\u0e39\u0e48\u0e23\u0e30\u0e1a\u0e1a",
    oneStepAway: "\u0e2d\u0e35\u0e01\u0e02\u0e31\u0e49\u0e19\u0e40\u0e14\u0e35\u0e22\u0e27",
    signInToUnlockRest: "\u0e40\u0e02\u0e49\u0e32\u0e2a\u0e39\u0e48\u0e23\u0e30\u0e1a\u0e1a\u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e1b\u0e25\u0e14\u0e25\u0e47\u0e2d\u0e01\u0e15\u0e2d\u0e19\u0e17\u0e35\u0e48\u0e40\u0e2b\u0e25\u0e37\u0e2d",
    continueToCheckout: "\u0e2b\u0e25\u0e31\u0e07\u0e40\u0e02\u0e49\u0e32\u0e2a\u0e39\u0e48\u0e23\u0e30\u0e1a\u0e1a \u0e04\u0e38\u0e13\u0e08\u0e30\u0e44\u0e1b\u0e17\u0e35\u0e48\u0e2b\u0e19\u0e49\u0e32\u0e0a\u0e33\u0e23\u0e30\u0e40\u0e07\u0e34\u0e19\u0e17\u0e31\u0e19\u0e17\u0e35",
    newToVerza: "\u0e40\u0e1e\u0e34\u0e48\u0e07\u0e40\u0e23\u0e34\u0e48\u0e21\u0e43\u0e0a\u0e49 Verza?",
    createAccountAction: "\u0e2a\u0e23\u0e49\u0e32\u0e07\u0e1a\u0e31\u0e0d\u0e0a\u0e35",
  },
  vi: {
    readyForRest: "S\u1eb5n s\u00e0ng xem ti\u1ebfp?",
    unlockAllCount: "M\u1edf kh\u00f3a to\u00e0n b\u1ed9 {count} t\u1eadp",
    oneTimePurchase: "Thanh to\u00e1n m\u1ed9t l\u1ea7n",
    oneTimeWithPrice: "{price} m\u1ed9t l\u1ea7n",
    secureCheckout: "Thanh to\u00e1n an to\u00e0n",
    backToEpisodes: "Quay l\u1ea1i c\u00e1c t\u1eadp",
    alreadyPurchased: "\u0110\u00e3 mua r\u1ed3i?",
    signInAction: "\u0110\u0103ng nh\u1eadp",
    oneStepAway: "Ch\u1ec9 c\u00f2n m\u1ed9t b\u01b0\u1edbc",
    signInToUnlockRest: "\u0110\u0103ng nh\u1eadp \u0111\u1ec3 m\u1edf kh\u00f3a ph\u1ea7n c\u00f2n l\u1ea1i",
    continueToCheckout: "Sau khi \u0111\u0103ng nh\u1eadp, b\u1ea1n s\u1ebd t\u1edbi th\u1eb3ng trang thanh to\u00e1n.",
    newToVerza: "M\u1edbi d\u00f9ng Verza?",
    createAccountAction: "T\u1ea1o t\u00e0i kho\u1ea3n",
  },
  id: {
    readyForRest: "Siap lanjut?",
    unlockAllCount: "Buka semua {count} episode",
    oneTimePurchase: "Pembayaran sekali",
    oneTimeWithPrice: "{price} sekali bayar",
    secureCheckout: "Pembayaran aman",
    backToEpisodes: "Kembali ke episode",
    alreadyPurchased: "Sudah beli?",
    signInAction: "Masuk",
    oneStepAway: "Tinggal satu langkah",
    signInToUnlockRest: "Masuk untuk membuka sisanya",
    continueToCheckout: "Setelah masuk, kamu langsung menuju pembayaran.",
    newToVerza: "Baru di Verza?",
    createAccountAction: "Buat akun",
  },
  tl: {
    readyForRest: "Handa na ba sa susunod?",
    unlockAllCount: "I-unlock lahat ng {count} episode",
    oneTimePurchase: "Isang beses na bayad",
    oneTimeWithPrice: "{price} isang beses",
    secureCheckout: "Ligtas na bayad",
    backToEpisodes: "Balik sa mga episode",
    alreadyPurchased: "Nabili mo na?",
    signInAction: "Mag sign in",
    oneStepAway: "Isang hakbang na lang",
    signInToUnlockRest: "Mag sign in para i-unlock ang natitira",
    continueToCheckout: "Pagkatapos mag sign in, diretso ka na sa bayad.",
    newToVerza: "Bago sa Verza?",
    createAccountAction: "Gumawa ng account",
  },
  sw: {
    readyForRest: "Tayari kwa zilizobaki?",
    unlockAllCount: "Fungua vipindi vyote {count}",
    oneTimePurchase: "Malipo ya mara moja",
    oneTimeWithPrice: "{price} mara moja",
    secureCheckout: "Malipo salama",
    backToEpisodes: "Rudi kwenye vipindi",
    alreadyPurchased: "Ulishanunua?",
    signInAction: "Ingia",
    oneStepAway: "Hatua moja tu",
    signInToUnlockRest: "Ingia ili kufungua zilizobaki",
    continueToCheckout: "Baada ya kuingia, utaelekea moja kwa moja kwenye malipo.",
    newToVerza: "Mgeni kwenye Verza?",
    createAccountAction: "Fungua akaunti",
  },
};

/**
 * Resolve one transaction string, interpolating {count} / {price}.
 *
 * Falls back to English for an unknown locale rather than rendering a raw key:
 * this is the screen that takes money, so a missing translation must still be
 * a sentence.
 */
export function purchaseCopy(
  locale: Locale,
  key: PurchaseCopyKey,
  vars?: Record<string, string | number>,
): string {
  const table = COPY[locale] ?? COPY.en;
  let out = table[key] ?? COPY.en[key];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      out = out.split(`{${name}}`).join(String(value));
    }
  }
  return out;
}

export const PURCHASE_COPY_LOCALES = Object.keys(COPY) as Locale[];
