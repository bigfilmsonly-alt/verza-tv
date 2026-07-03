/**
 * Rich metadata for each series — descriptions, cast, tags, ratings.
 * Keyed by slug for fast lookup. Merged into catalog at query time.
 */

import type { PosterMood } from "./catalog";

export interface SeriesDetail {
  description: string;
  cast: string[];
  tags: string[];
  rating: number;
  year: number;
  posterMood: PosterMood;
}

export const SERIES_DETAIL: Record<string, SeriesDetail> = {
  "the-dumb-billionaire-heiress-in-love": {
    description: "When the matriarch of a glittering dynasty falls ill, her fortune turns her elegant family into rivals willing to lie, seduce, and kill to inherit it. Beneath the chandeliers and champagne, alliances shift by the hour. To claim what's hers — and survive her own bloodline — one heiress will have to be smarter and colder than the people who share her name.",
    cast: ["Sienna Marsh", "Theo Calloway", "Priya Anand"],
    tags: ["billionaire", "enemies-to-lovers", "comedy"],
    rating: 9.2, year: 2025, posterMood: "rose",
  },
  "do-not-deceive-me": {
    description: "As the candles burn down and the guests arrive, every smile in the house hides a knife. She knows what he did. He knows she knows. And somewhere between the first toast and the last course, the marriage they've performed for years finally cracks — leaving only one of them to walk away from the table clean.",
    cast: ["Camila Reyes", "Aaron Whitlock", "Dominic Vale"],
    tags: ["thriller", "marriage", "betrayal"],
    rating: 9.0, year: 2025, posterMood: "noir",
  },
  "collateral-hearts": {
    description: "When a job goes sideways, a getaway driver ends up on the run with the one person he was never supposed to touch — the target. Forced together across state lines, they uncover that the score was never about money. Two people on opposite sides of the law were never meant to share the same car.",
    cast: ["Mara Quinn", "Elias Stone", "Nina Castellano"],
    tags: ["crime", "on-the-run", "slow-burn"],
    rating: 8.7, year: 2025, posterMood: "blood",
  },
  "the-billionaires-betrayal": {
    description: "The empire they built together becomes the battlefield where their marriage will be won — or buried. As hidden clauses surface and old allies switch sides, she learns that the man who promised her everything has been quietly preparing to take it all. Now she'll have to outplay the person who taught her the game.",
    cast: ["Olivia Hart", "Sebastian Cole", "Reza Amir"],
    tags: ["billionaire", "revenge", "power-couple"],
    rating: 8.9, year: 2025, posterMood: "ballroom",
  },
  "undercovered-heart": {
    description: "The deeper she goes undercover in his world, the harder it becomes to remember which feelings are part of the cover and which could get them both killed. He knows she's hiding something. She knows he's more than the case file says. And the closer they get to the truth, the closer they get to a line neither of them should cross.",
    cast: ["Jordan Pryce", "Lucas Marin", "Tasha Bell"],
    tags: ["undercover", "forbidden", "suspense"],
    rating: 8.6, year: 2025, posterMood: "noir",
  },
  "under-her-control": {
    description: "Hired to break her, he becomes the one thing she can command. In a world built on fear and leverage, she's the variable no one accounted for — and the woman who turns his empire on its head. But in a game of control, the one who falls in love first loses everything.",
    cast: ["Valentina Cruz", "Adrian Frost", "Marco Devlin"],
    tags: ["power-dynamics", "mafia", "obsession"],
    rating: 8.8, year: 2025, posterMood: "violet",
  },
  "two-worlds-apart": {
    description: "Years after a love their families forbade, fate drops them back into the same town and the same impossible choice. One is heir to everything; the other to a grudge that predates them both. To be together, they'll have to burn down the only world either of them has ever known.",
    cast: ["Hannah Lowell", "Diego Santos", "Claire Beaumont"],
    tags: ["second-chance", "feud", "small-town"],
    rating: 8.5, year: 2025, posterMood: "sunset",
  },
  "the-blackthornes": {
    description: "She's promised to one brother and falling for the other, and neither man is willing to let her go. As the wedding approaches, love curdles into obsession and the family's fortune becomes a weapon. Caught between two men who'd tear the dynasty apart to have her, the bride must choose — before the choice is made in blood.",
    cast: ["Genevieve Blackthorne", "Roman Blackthorne", "Isla Vance"],
    tags: ["dynasty", "billionaire", "power"],
    rating: 9.4, year: 2025, posterMood: "ballroom",
  },
  "marry-the-wrong-bride": {
    description: "The scandal of the season becomes the love story no one planned. A switched bride, a furious family, and a marriage built on a mistake slowly turn into the truest thing either of them has ever known. But the sister who was supposed to be standing there hasn't forgiven anyone — and she's coming to collect.",
    cast: ["Amara Lin", "Nathaniel Cross", "Bella Rourke"],
    tags: ["marriage", "sisters", "scandal"],
    rating: 8.7, year: 2025, posterMood: "emerald",
  },
  "destined-to-be": {
    description: "A missed train, a rainy doorway, a wedding that isn't theirs — two strangers keep meeting in all the wrong moments. Every time they're pulled together, the world conspires to pull them back. Some loves aren't a choice. They're a destination you can't outrun.",
    cast: ["Sophie Wren", "Gabriel Mota", "Lena Hauser"],
    tags: ["fate", "slow-burn", "wedding"],
    rating: 8.6, year: 2025, posterMood: "rose",
  },
  "the-day-we-got-married": {
    description: "The dress was perfect, the church was full, and the vows were a lie. When she discovers that the man she's marrying — and the people she trusted most — set her up to be destroyed on her wedding day, the humiliated bride stops crying and starts planning. One by one, everyone who betrayed her at the altar will learn exactly what she's capable of.",
    cast: ["Eva Lindgren", "Marcus Reign", "Tessa Pryor"],
    tags: ["fake-marriage", "slow-burn", "contract"],
    rating: 9.1, year: 2025, posterMood: "gold",
  },
  "the-winter-veil": {
    description: "Trapped by a storm with no way out, the wedding party turns on itself as old secrets freeze solid and a killer moves through the halls. The survivors must unmask whoever took the bride before the thaw — or before the killer reaches them first.",
    cast: ["Cordelia Frost", "Henry Ashcombe", "Mira Solenne"],
    tags: ["mystery", "whodunit", "single-location"],
    rating: 8.8, year: 2025, posterMood: "ice",
  },
  "the-marriage-contract": {
    description: "She agreed to be his wife on paper to save her family; he agreed to keep his distance. Neither of them counted on the clauses their hearts would quietly add to the deal. As the thirty days run down, the contract becomes the last thing standing between them and something neither will say out loud.",
    cast: ["Naomi Sterling", "Julian Vance", "Cara Mendes"],
    tags: ["contract-marriage", "billionaire", "slow-burn"],
    rating: 8.7, year: 2025, posterMood: "sunset",
  },
  "the-haunted-sisters": {
    description: "As the walls whisper and the portraits watch, the bond that kept them alive becomes the only thing standing between them and whatever has been waiting in the dark for a hundred years. To break the curse, they'll have to face the truth their family spent generations burying.",
    cast: ["Rowan Ashe", "Lydia Ashe", "Victor Crane"],
    tags: ["gothic", "supernatural", "sisters"],
    rating: 8.4, year: 2025, posterMood: "violet",
  },
  "the-missing-piece": {
    description: "A powerful business magnate is dead, and the headlines call it a tragic accident. But the deeper the truth is dug up, the clearer it becomes: this was murder, and everyone in his glittering world had a reason. As suspicion closes in on the grieving widow, buried revelations surface that could destroy every life the truth touches.",
    cast: ["Eleanor Voss", "Adam Locke", "Celeste Maru"],
    tags: ["mystery", "twins", "second-chance"],
    rating: 9.3, year: 2025, posterMood: "rose",
  },
  "mysterious-murder": {
    description: "As a young investigator peels back layers of old money and older lies, she realizes the killer isn't hiding among the family — the killer invited her in. Every answer she finds rewrites the question, until the only way out is to become the trap.",
    cast: ["Penelope Sharpe", "Graham Wilder", "Anya Petrov"],
    tags: ["thriller", "whodunit", "old-money"],
    rating: 8.6, year: 2025, posterMood: "noir",
  },
  "lost-and-found": {
    description: "Rebuilding from nothing, two broken people discover that the thing each of them lost was the other. As his old life claws its way back and threatens what they've built, they have to decide whether some people are worth losing everything else to keep.",
    cast: ["Iris Kane", "Owen Brandt", "Maya Coles"],
    tags: ["second-chance", "redemption", "slow-burn"],
    rating: 8.5, year: 2025, posterMood: "ice",
  },
  "help-im-falling-in-love-with-my-rude-ceo": {
    description: "One forced business trip, one shared umbrella, and her careful hatred starts to feel a lot like something else. He's impossible, infuriating, and the worst person she's ever met. So why does the way he looks at her when he thinks no one's watching keep her up at night?",
    cast: ["Daisy Park", "Vincent Hale", "Robin Cho"],
    tags: ["office-romance", "enemies-to-lovers", "comedy"],
    rating: 8.8, year: 2025, posterMood: "sunset",
  },
  "an-affair-with-my-boss": {
    description: "Now she has to face him across the conference table every morning and pretend the most dangerous thing in her life isn't the man signing her paychecks. But secrets in a glass tower never stay secret for long — and someone is watching the door.",
    cast: ["Grace Yoon", "Liam Decker", "Sasha Nguyen"],
    tags: ["office-romance", "forbidden", "drama"],
    rating: 8.4, year: 2025, posterMood: "noir",
  },
  "a-love-once-betrayed": {
    description: "She returns richer, colder, and impossible to ignore. Revenge has a way of looking like longing, and the line between making him pay and making him hers is thinner than she'll ever admit. He gave her away once. He won't survive doing it twice.",
    cast: ["Selene Marsh", "Dominik Roth", "Farah Aziz"],
    tags: ["revenge", "second-chance", "comeback"],
    rating: 8.7, year: 2025, posterMood: "blood",
  },
  "in-her-shadow": {
    description: "In a small town where everyone is watching, a quiet woman finally steps into the light — and discovers the price of being seen. The sister whose shadow she escaped isn't ready to be eclipsed, and she'll remind everyone exactly who the town belongs to.",
    cast: ["Hazel Moore", "Caleb Ward", "Vivian Moore"],
    tags: ["sisters", "small-town", "slow-burn"],
    rating: 8.6, year: 2025, posterMood: "emerald",
  },
  "good-for-him": {
    description: "His perfect life is built on her silence and a string of secrets he thinks she'll never untangle. She's done being good for him. The revenge she's been quietly assembling is flawless — and by the time he realizes it, there won't be a piece of his perfect life left standing.",
    cast: ["Brooke Sutton", "Mason Reed", "Talia Ford"],
    tags: ["revenge", "marriage", "betrayal"],
    rating: 8.7, year: 2025, posterMood: "noir",
  },
  "the-mistress-trap": {
    description: "Hired for a single night, she wakes to a dead body and her face on every screen — the perfect scapegoat for a powerful family's darkest secret. Framed for a murder she didn't commit, the escort refuses to take the fall. To clear her name she'll have to unravel the dynasty that set her up and burn their flawless reputations to the ground.",
    cast: ["Scarlett Vega", "Andre Lockhart", "Bianca Reyes"],
    tags: ["betrayal", "scandal", "revenge"],
    rating: 9.2, year: 2025, posterMood: "blood",
  },
  "camouflage": {
    description: "As their cover romance deepens into the real thing, the mission that brought them together becomes the only thing that can tear them apart. Every word is a lie with a true thing buried inside it — and the moment either of them breaks character, the whole operation, and both their lives, come down.",
    cast: ["Dahlia West", "Kai Mercer", "Sloane Pierce"],
    tags: ["spy", "fake-relationship", "thriller"],
    rating: 8.9, year: 2025, posterMood: "emerald",
  },
  "killer-romance": {
    description: "Every tender moment is a countdown; every kiss a delay of the inevitable. As the deadline closes in, he faces an impossible choice: finish the job, or burn down the people who ordered it. The only thing more dangerous than loving her is the truth he's been hired to hide.",
    cast: ["Aurora Sage", "Nikolai Renn", "Jade Castellano"],
    tags: ["thriller", "bodyguard", "forbidden"],
    rating: 9.0, year: 2025, posterMood: "ice",
  },
  "honey-gold": {
    description: "With no allies and no experience, she has one weapon the boardroom never saw coming. And a cold, brilliant rival who can't decide whether to destroy her or fall for her. The empire is a snake pit; she's about to find out she was born for it.",
    cast: ["Goldie Bennett", "Tristan Ko", "Renata Salas"],
    tags: ["rags-to-riches", "billionaire", "boardroom"],
    rating: 9.0, year: 2025, posterMood: "gold",
  },
  "revenge-on-my-cheating-fiance": {
    description: "Poised, powerful, and holding his entire career in her manicured hands, she's spent a year becoming the woman who could ruin him with a signature. Payback has never looked this good — but the closer she gets to destroying him, the more she has to decide what she actually wants when it's done.",
    cast: ["Marisol Vane", "Chase Bennett", "Lara Kim"],
    tags: ["revenge", "comeback", "boss"],
    rating: 8.9, year: 2025, posterMood: "blood",
  },
  "the-escort": {
    description: "Sold into the escort life by the one man she believed loved her, she trades her name for survival in the city's most dangerous circles. Every client, every secret, and every debt brings her closer to the people who bought and betrayed her — and she intends to make them pay in full. Behind the red dress is a woman with nothing left to lose.",
    cast: ["Eden Cross", "Lucian Hale", "Margot Devereux"],
    tags: ["fake-relationship", "high-society", "secrets"],
    rating: 8.6, year: 2025, posterMood: "violet",
  },
  "i-think-my-wife-wants-to-kill-me": {
    description: "Every night he notices another small thing — the locked drawer, the new life-insurance policy, the way she smiles when she thinks he's asleep. He could be paranoid. Or he could be the next missing husband on the evening news. The clock is ticking, and only one of them knows the truth.",
    cast: ["Derek Mallory", "Vanessa Mallory", "Officer Pike"],
    tags: ["thriller", "marriage", "suspense"],
    rating: 8.8, year: 2025, posterMood: "blood",
  },
  "school-hall": {
    description: "As one outsider digs into the school's golden reputation, she learns that the most dangerous lessons are the ones the faculty will kill to keep quiet. Everyone here is protecting something. She's about to find out which secret the missing student died knowing.",
    cast: ["Quinn Adler", "Professor Vane", "Theo Marsh"],
    tags: ["mystery", "academy", "drama"],
    rating: 8.5, year: 2025, posterMood: "noir",
  },
  "conflicted-hearts": {
    description: "Caught between the safe choice and the one that sets her on fire, she has to decide what kind of love she can actually live with — before the choice is made for her. Every heart in this story is divided, and someone is going to walk away in pieces.",
    cast: ["Aria Belle", "Jonah Reyes", "Elliot Vance"],
    tags: ["love-triangle", "romance", "drama"],
    rating: 8.4, year: 2025, posterMood: "blood",
  },

  /* ---- Extended catalog (titles not in the original 34) ---- */

  "married-to-a-stranger": {
    description: "What started as a cold arrangement between two powerful families becomes a slow-burning fire neither of them can put out. Behind closed doors, the contract marriage reveals more truth than either of them was prepared for — and the billionaire who never shows emotion is about to break every rule he set.",
    cast: ["Celeste Monroe", "Damien Ashworth", "Rita Huang"],
    tags: ["contract-marriage", "billionaire", "slow-burn"],
    rating: 8.8, year: 2025, posterMood: "ballroom",
  },
  "billionaire-daughters-love-triangle": {
    description: "Caught between her father's empire and two men who would reshape her world, she must decide whether love is a luxury she can afford — or the only currency that matters.",
    cast: ["Natasha Orlov", "James Chen", "Rafael Diaz"],
    tags: ["billionaire", "love-triangle", "drama"],
    rating: 8.6, year: 2025, posterMood: "gold",
  },
  "blood-contract": {
    description: "A blood oath between families seals her fate — married to a man she's never met, bound to a world she can never leave. But when she discovers the contract hides a darker clause, escape becomes the only option, and the man she married becomes the only person who can help her run.",
    cast: ["Elena Torres", "Viktor Kael", "Misha Voss"],
    tags: ["dark-romance", "arranged-marriage", "thriller"],
    rating: 8.7, year: 2025, posterMood: "blood",
  },
  "cleopatra": {
    description: "A broke waitress wakes up to discover she's inherited a billion-dollar empire — and a boardroom full of people who would rather see her destroyed than seated at the head of the table. With nothing but instinct and nerve, she'll prove that power isn't inherited. It's taken.",
    cast: ["Cleo Ramírez", "Maxwell Thorn", "Zara Osei"],
    tags: ["rags-to-riches", "boardroom", "power"],
    rating: 9.1, year: 2025, posterMood: "gold",
  },
  "im-obsessed-with-my-boss": {
    description: "One secret. One damning message. Two powerful men who will do anything to keep her silent. Trapped in a spiral of blackmail, desire, and lies, she plays a game where every move has consequences — and learns that some secrets don't just ruin reputations, they destroy everything. Love was never supposed to be this dangerous.",
    cast: ["Mina Park", "Alexander Cross", "Jenna Liu"],
    tags: ["office-romance", "forbidden", "obsession"],
    rating: 8.5, year: 2025, posterMood: "noir",
  },
  "duty-of-desire": {
    description: "With her husband deployed overseas, a military wife finds herself drawn to the one man she should never touch — his commanding officer. Every stolen glance is a betrayal; every moment apart is agony. Duty demands one thing. Desire demands another.",
    cast: ["Sarah Hawkins", "Colonel James Merritt", "Sgt. David Hawkins"],
    tags: ["forbidden", "military", "slow-burn"],
    rating: 8.6, year: 2025, posterMood: "sunset",
  },
  "echo-of-vengeance": {
    description: "Betrayed by the people she trusted and cast out of the fashion empire she built with her own hands, she vanishes from the spotlight — but not for long. She returns down the runway in flawless couture: colder, sharper, and impossible to ignore. One collection at a time, she'll dismantle the industry that ruined her and make every rival pay for the throne they stole.",
    cast: ["Aria Voss", "Kane Blackwell", "Lyra Chen"],
    tags: ["revenge", "comeback", "thriller"],
    rating: 9.0, year: 2025, posterMood: "blood",
  },
  "faded-threads": {
    description: "When the eldest daughter leaks the family's darkest secrets on live television, a fashion dynasty crumbles in real time. As the threads unravel, every sibling must choose between loyalty to the brand and loyalty to the truth.",
    cast: ["Diana Laurent", "Hugo Laurent", "Kira Patel"],
    tags: ["family-drama", "fashion", "scandal"],
    rating: 8.5, year: 2025, posterMood: "violet",
  },
  "hidden-agenda": {
    description: "She's the nurse every family prays for — patient, gentle, endlessly kind. She's also buried more of her patients than anyone will ever count. When a sharp-eyed young heir survives her care and begins to notice the pattern, he realizes the woman keeping him alive is the same one quietly trying to kill him. Now staying awake might be the only thing that saves his life.",
    cast: ["Nora Vasquez", "Ian Blackwell", "Tomas Reyes"],
    tags: ["undercover", "forbidden", "thriller"],
    rating: 8.6, year: 2025, posterMood: "noir",
  },
  "hollywood-stars-fake-girlfriend": {
    description: "Hired to play America's sweetheart on his arm, she expected paparazzi and press junkets. She didn't expect the cameras to stop rolling and the feelings to stay. He's the biggest star in the world. She's nobody. And that's exactly why it works.",
    cast: ["Lily Chang", "Ryan Steele", "Monica Pryor"],
    tags: ["fake-relationship", "celebrity", "comedy"],
    rating: 8.7, year: 2025, posterMood: "sunset",
  },
  "one-night-stand": {
    description: "One night. No names. No strings. That was the deal — until she walks into her new office and discovers he's the CEO she now reports to. The chemistry is undeniable. The complications are catastrophic. And someone in the office already knows their secret.",
    cast: ["Zoe Martin", "Alex Rivera", "Tanya Brooks"],
    tags: ["office-romance", "one-night-stand", "steamy"],
    rating: 8.8, year: 2025, posterMood: "rose",
  },
  "if-only-you-were-mine": {
    description: "Best friends since childhood, they swore never to cross the line. But one drunken confession changes everything — and now neither of them can pretend the feelings aren't real. The hardest part isn't falling in love. It's risking the only person who's always been there.",
    cast: ["Mia Torres", "Jake Sullivan", "Emma Chen"],
    tags: ["friends-to-lovers", "slow-burn", "emotional"],
    rating: 8.7, year: 2025, posterMood: "rose",
  },
  "in-love-with-my-godfathers-daughter": {
    description: "He owes the Don everything — his life, his name, his future. Falling for his daughter is the one debt that could cost him all of it. In a world where loyalty is blood and love is weakness, they're playing the most dangerous game of all.",
    cast: ["Marco Vitale", "Sofia Benedetti", "Don Enzo Benedetti"],
    tags: ["mafia", "forbidden", "romance"],
    rating: 8.6, year: 2025, posterMood: "noir",
  },
  "love-lies-and-bloodline": {
    description: "A DNA test cracks the family wide open. The patriarch isn't who he says he is, and someone in the house already knew. As the bloodline unravels, so does every alliance, every promise, and every secret the family swore would stay buried.",
    cast: ["Victoria Thornton", "David Thornton", "Mei-Lin Wu"],
    tags: ["family-thriller", "secrets", "DNA"],
    rating: 8.5, year: 2025, posterMood: "blood",
  },
  "loves-perfect-crime": {
    description: "A detective falls for the prime suspect in a murder case — and the evidence keeps pointing back to her. Every lead he follows brings him closer to either solving the case or losing his badge, his freedom, and the woman he can't stop protecting.",
    cast: ["Detective Nolan Cross", "Isabelle Moreau", "Captain Harris"],
    tags: ["detective", "romance", "crime"],
    rating: 8.6, year: 2025, posterMood: "noir",
  },
  "mafia-lords-secret-love": {
    description: "In a crime family where loyalty is blood, his forbidden obsession with his father's young wife could ignite a war that burns the entire empire. Some secrets are too dangerous to keep — and too powerful to let go.",
    cast: ["Dante Romano", "Isabella Romano", "Don Luciano Romano"],
    tags: ["mafia", "dark-romance", "forbidden"],
    rating: 8.8, year: 2025, posterMood: "blood",
  },
  "married-to-my-brothers-ex": {
    description: "He married her to get revenge on his brother. She married him to get closer to the truth. Neither expected the lie they built their marriage on to become the most honest thing in their lives.",
    cast: ["Jasmine Cole", "Derek Cole", "Marcus Cole"],
    tags: ["revenge", "brothers", "slow-burn"],
    rating: 8.5, year: 2025, posterMood: "emerald",
  },
  "my-celebrity-boyfriend-killed-me": {
    description: "She wakes up in a hospital with no memory — and her famous boyfriend is telling the world she's dead. The deeper she digs into her own past, the more she realizes the man everyone loves may be the monster no one suspects.",
    cast: ["Nina Grey", "Zander Cole", "Detective Rivera"],
    tags: ["psychological-thriller", "celebrity", "amnesia"],
    rating: 8.8, year: 2025, posterMood: "noir",
  },
  "my-handsome-bodyguard": {
    description: "A pop star hires a bodyguard to protect her from a stalker. But the stalker knows things only the bodyguard would know — and the line between protector and threat blurs with every passing night.",
    cast: ["Lexi Storm", "Agent Cole Walker", "Detective Marsh"],
    tags: ["bodyguard", "suspense", "romance"],
    rating: 8.7, year: 2025, posterMood: "ice",
  },
  "never-mess-with-a-badass-girl": {
    description: "They underestimated the quiet girl from the wrong side of town. She lost everything — her job, her dignity, her name. Now she owns the company that fired her, and she's just getting started. Revenge is a dish best served in a designer suit.",
    cast: ["Raven Blake", "Nolan Pierce", "Victoria Sterling"],
    tags: ["revenge", "comeback", "boss"],
    rating: 8.8, year: 2025, posterMood: "emerald",
  },
  "sisters-have-crush-on-the-same-man": {
    description: "One man. Two sisters. A love that could destroy them all. The bond they thought was unbreakable shatters the moment he walks into their lives — and only one of them can walk away with him.",
    cast: ["Luna Torres", "Maya Torres", "Christian Reeves"],
    tags: ["sisters", "love-triangle", "family-drama"],
    rating: 8.4, year: 2025, posterMood: "rose",
  },
  "the-billionaires-vow": {
    description: "Two men. One vow. A choice that could cost her everything — love, loyalty, or her fortune. When a billionaire makes a promise, empires move. When he breaks one, worlds collapse.",
    cast: ["Aria Blackwood", "Alexander Voss", "Marcus Grey"],
    tags: ["billionaire", "love-triangle", "drama"],
    rating: 8.6, year: 2025, posterMood: "gold",
  },
  "one-night-one-forever": {
    description: "A one-night stand with a stranger becomes a lifetime when she discovers he's her new stepbrother. The family that brought them together is the only thing keeping them apart — and every holiday is a test of how long they can pretend.",
    cast: ["Jade Chen", "Ryan Brooks", "Helen Chen-Brooks"],
    tags: ["forbidden", "step-siblings", "slow-burn"],
    rating: 8.4, year: 2025, posterMood: "sunset",
  },
  "runaway-bride": {
    description: "She ran from the altar. Fate led her to the stranger who saved her life — and ruined it. Now she's caught between the wedding she escaped and the love she never expected, and the groom she left is not the kind of man who lets go.",
    cast: ["Clara Ashton", "Rhys Callahan", "Daniel Morton"],
    tags: ["runaway-bride", "romance", "suspense"],
    rating: 8.5, year: 2025, posterMood: "rose",
  },
  "the-billionaires-lost-love": {
    description: "He lost her once. This time, he'll fight to keep her — even if it means burning his empire down. Years apart taught him that wealth means nothing without the one person who saw him before the money. She's moved on. He hasn't.",
    cast: ["Sophia Laurent", "Ethan Cross", "Diana Price"],
    tags: ["second-chance", "billionaire", "romance"],
    rating: 8.7, year: 2025, posterMood: "ballroom",
  },
  "my-sister-stole-my-man": {
    description: "Twin sisters. One fiancé. The wrong twin said yes — and the right one wants blood. In a family where everything is shared, there's one thing that should have been sacred. Now the gloves are off, and only one sister will be left standing.",
    cast: ["Lily Park", "Rose Park", "James Whitfield"],
    tags: ["twins", "betrayal", "family-drama"],
    rating: 8.5, year: 2025, posterMood: "blood",
  },
  "the-phoenix-conspiracy": {
    description: "A dead billionaire's daughter returns from the grave — and everyone who profited from her death is terrified. She's alive, she remembers everything, and she has a list.",
    cast: ["Phoenix Ashford", "Leon Drake", "Helena Voss"],
    tags: ["conspiracy", "revenge", "thriller"],
    rating: 8.9, year: 2025, posterMood: "blood",
  },
  "tangled-in-desire": {
    description: "Two strangers share one reckless night. Months later, she's his new business partner — and she's carrying his secret. The boardroom was supposed to be neutral ground. It became a battlefield of longing.",
    cast: ["Serena Cole", "Tristan Blake", "Maya Reid"],
    tags: ["steamy", "office-romance", "secret"],
    rating: 8.5, year: 2025, posterMood: "rose",
  },
  "the-escaping-mistress": {
    description: "She was his secret for five years. Now she's running — and he'll burn the city down to bring her back. Freedom has never been more dangerous, or more intoxicating.",
    cast: ["Vivienne Grey", "Alexander Noir", "Detective Hale"],
    tags: ["dark-romance", "escape", "obsession"],
    rating: 8.7, year: 2025, posterMood: "noir",
  },
  "the-chauffeur": {
    description: "He drives her everywhere. She trusts him with her life. He's been reporting every move to her enemies. But somewhere between the lies and the leather seats, the driver fell for the passenger.",
    cast: ["James Carter", "Elena Vandermeer", "Mr. Black"],
    tags: ["betrayal", "romance", "suspense"],
    rating: 8.4, year: 2025, posterMood: "noir",
  },
  "twisted-fates": {
    description: "Switched at birth, two women discover the truth at 30 — and one will do anything to keep the life she stole. Identity is the prize. The truth is the weapon. And both of them are willing to fight dirty.",
    cast: ["Naomi Cross", "Rachel Cross", "Dr. Ellen Pierce"],
    tags: ["switched-at-birth", "identity", "thriller"],
    rating: 8.6, year: 2025, posterMood: "violet",
  },
  "the-dumb-billionaire-heiress-pt-2": {
    description: "She dropped the act. Now the real heiress is playing for keeps — and her enemies aren't ready. Season 2 raises the stakes as Quinn takes control of the empire she pretended to stumble into.",
    cast: ["Sienna Marsh", "Theo Calloway", "Priya Anand"],
    tags: ["billionaire", "sequel", "power"],
    rating: 9.0, year: 2025, posterMood: "gold",
  },
  "tied-by-fate": {
    description: "A red thread connects them across lifetimes. In this one, he's the detective investigating her disappearance. The past bleeds into the present, and the only way to save her is to remember a love that transcends time.",
    cast: ["Mei-Ling Sato", "Detective James Wren", "The Oracle"],
    tags: ["supernatural", "romance", "fate"],
    rating: 8.7, year: 2025, posterMood: "violet",
  },
  "the-crown": {
    description: "Two ruthless heirs. One empire worth killing for. And a woman standing between them, holding promises that could crown a king or bury one. In a world where loyalty is bought and every vow hides a blade, she'll have to decide who to trust before the wrong choice costs her everything.",
    cast: ["Bianca Love", "Judge Harrison", "Maya Sterling"],
    tags: ["pageant", "scandal", "drama"],
    rating: 8.4, year: 2025, posterMood: "gold",
  },
  "rosy-psycho": {
    description: "She's sweet, beautiful, and everyone loves her. Her exes keep disappearing — and no one connects the dots. The most dangerous person in the room is always the one you'd never suspect.",
    cast: ["Rosalind Hart", "Detective Kane", "Victim #4"],
    tags: ["psychological-thriller", "serial", "twist"],
    rating: 8.9, year: 2025, posterMood: "blood",
  },
  "the-unforgettable-love": {
    description: "He erased her from his memory to survive. She walks back into his life and he feels everything — without knowing why. Some love stories survive even amnesia.",
    cast: ["David Loren", "Hannah Grey", "Dr. Miriam Fields"],
    tags: ["amnesia", "romance", "emotional"],
    rating: 8.6, year: 2025, posterMood: "ice",
  },
  "why-i-did-it": {
    description: "A woman confesses to murder on live television. The real question is: who is she protecting? Every episode peels back another layer until the truth is more devastating than the crime.",
    cast: ["Catherine Bell", "DA Marcus Cole", "The Victim"],
    tags: ["crime", "confession", "twist"],
    rating: 8.8, year: 2025, posterMood: "noir",
  },
  "the-ceo": {
    description: "At 26 she runs a billion-dollar empire. At night she's the woman no one is allowed to love. Power and loneliness share the same corner office — until someone breaks through.",
    cast: ["Diana Zhao", "Matteo Rios", "Board Chair Helen Wu"],
    tags: ["billionaire", "romance", "power"],
    rating: 8.5, year: 2025, posterMood: "gold",
  },
  "twist-of-time": {
    description: "She wakes up ten years in the past — married to the man who will one day destroy her family. Armed with knowledge of the future, she must decide: change her fate, or change his.",
    cast: ["Clara Novak", "Roman Ashford", "Young Clara"],
    tags: ["time-travel", "romance", "sci-fi"],
    rating: 8.7, year: 2025, posterMood: "violet",
  },
  "she-is-mine": {
    description: "Desire. Obsession. Betrayal. She always gets what she wants — and not every love story has a happy ending. When possession masquerades as passion, the line between love and control disappears entirely.",
    cast: ["Scarlett Vane", "Noah Cross", "Detective Grant"],
    tags: ["obsession", "dark-romance", "thriller"],
    rating: 8.6, year: 2025, posterMood: "blood",
  },
  "the-pendleton-secret": {
    description: "The Pendleton estate holds a fortune, a family of liars, and a secret that could bring down a dynasty. When the youngest heir starts digging, she discovers that the family's greatest asset is also its greatest sin.",
    cast: ["Eloise Pendleton", "James Mercer", "Lady Pendleton"],
    tags: ["family-thriller", "estate", "mystery"],
    rating: 8.5, year: 2025, posterMood: "emerald",
  },
  "the-perfect-husband": {
    description: "He cooks. He cleans. He remembers every anniversary. He also has a second family across town. The perfect husband isn't perfect — he's performing. And his wife just found the script.",
    cast: ["Rachel Ford", "Michael Ford", "The Other Wife"],
    tags: ["betrayal", "marriage", "double-life"],
    rating: 8.7, year: 2025, posterMood: "noir",
  },
  "trial-marriage-to-a-billionaire-s2": {
    description: "The trial is over. The feelings are real. But his first wife is back — and she has receipts. Season 2 explodes the careful peace they built and forces them to fight for a love that was never supposed to last past the contract.",
    cast: ["Ava Chen", "Kingston Wells", "Miranda Wells"],
    tags: ["contract-marriage", "billionaire", "sequel"],
    rating: 8.8, year: 2025, posterMood: "gold",
  },
  "the-inheritance-game": {
    description: "She came for answers. They have everything to lose. A fortune favors the clever — if she survives the family. When an outsider is named in a billionaire's will, the heirs will stop at nothing to uncover why — and eliminate the threat.",
    cast: ["Avery Grambs", "Jameson Hawthorne", "Grayson Hawthorne"],
    tags: ["mystery", "inheritance", "thriller"],
    rating: 9.1, year: 2025, posterMood: "gold",
  },
  "im-obsessed-with-my-boss-2": {
    description: "She thought leaving the company would end it. He followed her to the new one. The obsession deepens, the stakes rise, and the line between professional and personal is permanently erased.",
    cast: ["Mina Park", "Alexander Cross", "Jenna Liu"],
    tags: ["office-romance", "sequel", "obsession"],
    rating: 8.6, year: 2025, posterMood: "noir",
  },
};
