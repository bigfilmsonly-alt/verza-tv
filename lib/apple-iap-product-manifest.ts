import "server-only";

/**
 * APPEND-ONLY Apple product registry.
 *
 * Product IDs cannot be edited or reused after App Store Connect creation.
 * Never derive a new runtime product from an arbitrary slug: add it here only
 * after the canonical catalog predicate and rights/release gates pass.
 */
export const APPLE_SERIES_PRODUCT_IDS = {
  "the-mistress-trap": "com.verzatv.app.series.the_mistress_trap",
  "do-not-deceive-me": "com.verzatv.app.series.do_not_deceive_me",
  "collateral-hearts": "com.verzatv.app.series.collateral_hearts",
  "the-billionaires-betrayal": "com.verzatv.app.series.the_billionaires_betrayal",
  "undercovered-heart": "com.verzatv.app.series.undercovered_heart",
  "under-her-control": "com.verzatv.app.series.under_her_control",
  "two-worlds-apart": "com.verzatv.app.series.two_worlds_apart",
  "the-blackthornes": "com.verzatv.app.series.the_blackthornes",
  "marry-the-wrong-bride": "com.verzatv.app.series.marry_the_wrong_bride",
  "destined-to-be": "com.verzatv.app.series.destined_to_be",
  "the-day-we-got-married": "com.verzatv.app.series.the_day_we_got_married",
  "the-winter-veil": "com.verzatv.app.series.the_winter_veil",
  "the-marriage-contract": "com.verzatv.app.series.the_marriage_contract",
  "the-haunted-sisters": "com.verzatv.app.series.the_haunted_sisters",
  "the-missing-piece": "com.verzatv.app.series.the_missing_piece",
  "mysterious-murder": "com.verzatv.app.series.mysterious_murder",
  "married-to-a-stranger": "com.verzatv.app.series.married_to_a_stranger",
  "blood-contract": "com.verzatv.app.series.blood_contract",
  "cleopatra": "com.verzatv.app.series.cleopatra",
  "im-obsessed-with-my-boss": "com.verzatv.app.series.im_obsessed_with_my_boss",
  "duty-of-desire": "com.verzatv.app.series.duty_of_desire",
  "echo-of-vengeance": "com.verzatv.app.series.echo_of_vengeance",
  "faded-threads": "com.verzatv.app.series.faded_threads",
  "hidden-agenda": "com.verzatv.app.series.hidden_agenda",
  "hollywood-stars-fake-girlfriend": "com.verzatv.app.series.hollywood_stars_fake_girlfriend",
  "i-think-my-wife-wants-to-kill-me": "com.verzatv.app.series.i_think_my_wife_wants_to_kill_me",
  "in-love-with-my-godfathers-daughter": "com.verzatv.app.series.in_love_with_my_godfathers_daughter",
  "love-lies-and-bloodline": "com.verzatv.app.series.love_lies_and_bloodline",
  "loves-perfect-crime": "com.verzatv.app.series.loves_perfect_crime",
  "mafia-lords-secret-love": "com.verzatv.app.series.mafia_lords_secret_love",
  "my-celebrity-boyfriend-killed-me": "com.verzatv.app.series.my_celebrity_boyfriend_killed_me",
  "my-handsome-bodyguard": "com.verzatv.app.series.my_handsome_bodyguard",
  "never-mess-with-a-badass-girl": "com.verzatv.app.series.never_mess_with_a_badass_girl",
  "sisters-have-crush-on-the-same-man": "com.verzatv.app.series.sisters_have_crush_on_the_same_man",
  "the-billionaires-vow": "com.verzatv.app.series.the_billionaires_vow",
  "lost-and-found": "com.verzatv.app.series.lost_and_found",
  "help-im-falling-in-love-with-my-rude-ceo": "com.verzatv.app.series.help_im_falling_in_love_with_my_rude_ceo",
  "an-affair-with-my-boss": "com.verzatv.app.series.an_affair_with_my_boss",
  "a-love-once-betrayed": "com.verzatv.app.series.a_love_once_betrayed",
  "in-her-shadow": "com.verzatv.app.series.in_her_shadow",
  "good-for-him": "com.verzatv.app.series.good_for_him",
  "one-night-stand": "com.verzatv.app.series.one_night_stand",
  "if-only-you-were-mine": "com.verzatv.app.series.if_only_you_were_mine",
  "one-night-one-forever": "com.verzatv.app.series.one_night_one_forever",
  "runaway-bride": "com.verzatv.app.series.runaway_bride",
  "the-billionaires-lost-love": "com.verzatv.app.series.the_billionaires_lost_love",
  "camouflage": "com.verzatv.app.series.camouflage",
  "killer-romance": "com.verzatv.app.series.killer_romance",
  "honey-gold": "com.verzatv.app.series.honey_gold",
  "revenge-on-my-cheating-fiance": "com.verzatv.app.series.revenge_on_my_cheating_fiance",
  "the-escort": "com.verzatv.app.series.the_escort",
  "school-hall": "com.verzatv.app.series.school_hall",
  "conflicted-hearts": "com.verzatv.app.series.conflicted_hearts",
  "my-sister-stole-my-man": "com.verzatv.app.series.my_sister_stole_my_man",
  "the-phoenix-conspiracy": "com.verzatv.app.series.the_phoenix_conspiracy",
  "the-chauffeur": "com.verzatv.app.series.the_chauffeur",
  "twisted-fates": "com.verzatv.app.series.twisted_fates",
  "the-dumb-billionaire-heiress-pt-2": "com.verzatv.app.series.the_dumb_billionaire_heiress_pt_2",
  "tied-by-fate": "com.verzatv.app.series.tied_by_fate",
  "the-crown": "com.verzatv.app.series.the_crown",
  "rosy-psycho": "com.verzatv.app.series.rosy_psycho",
  "the-unforgettable-love": "com.verzatv.app.series.the_unforgettable_love",
  "why-i-did-it": "com.verzatv.app.series.why_i_did_it",
  "the-ceo": "com.verzatv.app.series.the_ceo",
  "twist-of-time": "com.verzatv.app.series.twist_of_time",
  "she-is-mine": "com.verzatv.app.series.she_is_mine",
  "the-pendleton-secret": "com.verzatv.app.series.the_pendleton_secret",
  "the-perfect-husband": "com.verzatv.app.series.the_perfect_husband",
  "the-inheritance-game": "com.verzatv.app.series.the_inheritance_game",
  "billionaire-daughters-love-triangle": "com.verzatv.app.series.billionaire_daughters_love_triangle",
  "married-to-my-brothers-ex": "com.verzatv.app.series.married_to_my_brothers_ex",
  "tangled-in-desire": "com.verzatv.app.series.tangled_in_desire",
  "the-escaping-mistress": "com.verzatv.app.series.the_escaping_mistress",
  "trial-marriage-to-a-billionaire-s2": "com.verzatv.app.series.trial_marriage_to_a_billionaire_s2",

  /* Appended 2026-08-27 after App Store approval. Convention matches the
     preceding 74 exactly: com.verzatv.app.series.<slug with underscores>.
     APPEND ONLY — never reorder, edit, or reuse an id above. */
  "im-obsessed-with-my-boss-2": "com.verzatv.app.series.im_obsessed_with_my_boss_2",
  "sentence-of-passion-es": "com.verzatv.app.series.sentence_of_passion_es",
  "i-cheated-on-my-wedding-night-es": "com.verzatv.app.series.i_cheated_on_my_wedding_night_es",
  "i-fell-in-love-with-my-presidential-brother-in-law-es": "com.verzatv.app.series.i_fell_in_love_with_my_presidential_brother_in_law_es",
  "the-goat-mistress-es": "com.verzatv.app.series.the_goat_mistress_es",

  /* Appended 2026-08-27 (Bollywood, restored after branch reset). */
  "falling-for-flatmate": "com.verzatv.app.series.falling_for_flatmate",
  "dil-dosa-dosti": "com.verzatv.app.series.dil_dosa_dosti",

  /* Appended 2026-08-27 (dark-inventory ingest: four Bollywood titles whose
     key art finally landed, plus the Spanish cut of the professor title).
     The English cut of that title is deliberately absent: it exists in Mux
     but has no English key art, so it has no product until art ships. */
  "salt-and-pepper": "com.verzatv.app.series.salt_and_pepper",
  "love-for-sale": "com.verzatv.app.series.love_for_sale",
  "the-breakup-podcast": "com.verzatv.app.series.the_breakup_podcast",
  "reset": "com.verzatv.app.series.reset",
  "im-having-my-professors-baby-es": "com.verzatv.app.series.im_having_my_professors_baby_es",
} as const;

export type AppleSeriesProductSlug = keyof typeof APPLE_SERIES_PRODUCT_IDS;

/**
 * Lifecycle overlay for products no longer offered to new customers.
 * Add a slug here; never delete its permanent registry entry above. Restore,
 * refund, revocation, and notification verification must keep accepting it.
 */
export const APPLE_RETIRED_SERIES_PRODUCT_SLUGS = [] as const satisfies readonly AppleSeriesProductSlug[];
