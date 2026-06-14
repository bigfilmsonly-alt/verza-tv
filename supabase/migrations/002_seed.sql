-- ============================================================
-- Seed Channels
-- ============================================================

INSERT INTO public.channels (name, slug, description, is_verified) VALUES
  ('Must-sees', 'must-sees', 'The most binge-worthy micro-dramas on Verza TV', true),
  ('Trending', 'trending', 'What everyone is watching right now', true),
  ('Drama', 'drama', 'Intense storylines and unforgettable characters', true),
  ('Reality', 'reality', 'Unscripted moments, real emotions', true);

-- ============================================================
-- Seed Live Series (9 series — verbatim from spec)
-- ============================================================

INSERT INTO public.series (slug, title, logline, genre, channel, episode_count, free_episodes, coin_per_episode, season_pass_coins, status) VALUES
  (
    'the-missing-piece',
    'The Missing Piece',
    'A widow discovers the stranger who saved her life is the twin of the husband she buried.',
    'Mystery romance',
    'Must-sees',
    62, 5, 49, 1871, 'live'
  ),
  (
    'married-to-a-stranger',
    'Married to a Stranger',
    'A contract marriage to a cold billionaire turns real the night she learns why he chose her.',
    'Contract marriage',
    'Must-sees',
    62, 5, 49, 1871, 'live'
  ),
  (
    'on-one-condition',
    'On One Condition',
    'He will save her father''s company for one price — she becomes his wife for a year.',
    'Billionaire romance',
    'Must-sees',
    62, 5, 49, 1871, 'live'
  ),
  (
    'killer-romance',
    'Killer Romance',
    'She falls for the bodyguard hired to protect her, not knowing he was sent to kill her.',
    'Romantic thriller',
    'Trending',
    59, 5, 49, 1773, 'live'
  ),
  (
    'honey-gold',
    'Honey Gold',
    'A broke waitress inherits an empire and the ruthless board that wants her gone.',
    'Rags-to-riches romance',
    'Trending',
    61, 5, 49, 1838, 'live'
  ),
  (
    'revenge-on-my-cheating-fiance',
    'Revenge on My Cheating Fiance',
    'Jilted at the altar, she returns one year later as her ex''s new boss.',
    'Revenge drama',
    'Trending',
    50, 5, 49, 1477, 'live'
  ),
  (
    'the-billionaires-vow',
    'The Billionaire''s Vow',
    'A fake engagement to settle a debt becomes a war neither can afford to win or lose.',
    'Billionaire romance',
    'Drama',
    60, 5, 49, 1806, 'live'
  ),
  (
    'im-obsessed-with-my-boss',
    'I''m Obsessed with My Boss',
    'One elevator kiss with the CEO upends the assistant''s careful life.',
    'Office romance',
    'Drama',
    50, 5, 49, 1477, 'live'
  ),
  (
    'she-is-mine',
    'She Is Mine',
    'Two rival heirs discover they were promised to the same woman at birth.',
    'Possessive romance',
    'Drama',
    60, 5, 49, 1806, 'live'
  );

-- ============================================================
-- Seed Coming Soon Series (no episodes)
-- ============================================================

INSERT INTO public.series (slug, title, logline, genre, channel, episode_count, free_episodes, coin_per_episode, status) VALUES
  (
    'the-last-cliffhanger',
    'The Last Cliffhanger',
    'A screenwriter discovers her scripts are coming true — and the next one ends in murder.',
    'Mystery',
    'Must-sees',
    0, 5, 49, 'coming_soon'
  ),
  (
    'villains-table',
    'Villains'' Table',
    'Six reality TV villains are locked in a mansion and forced to confront who they really are.',
    'Reality drama',
    'Reality',
    0, 5, 49, 'coming_soon'
  ),
  (
    'studio-21',
    'Studio 21',
    'Behind the camera at a failing streaming network, the real drama is who''s sleeping with whom.',
    'Workplace reality',
    'Reality',
    0, 5, 49, 'coming_soon'
  ),
  (
    'cold-case-files',
    'Cold Case Files',
    'A retired detective reopens the one case that cost her everything — her partner''s unsolved murder.',
    'True crime',
    'Must-sees',
    0, 5, 49, 'coming_soon'
  ),
  (
    'wolf-moon',
    'Wolf Moon',
    'In a small Appalachian town, the new veterinarian discovers the locals are hiding a supernatural secret.',
    'Werewolf fantasy',
    'Trending',
    0, 5, 49, 'coming_soon'
  ),
  (
    'second-time-around',
    'Second Time Around',
    'Divorced at 40, she swore off love — until her college sweetheart moved in next door.',
    'Second-chance romance',
    'Drama',
    0, 5, 49, 'coming_soon'
  ),
  (
    'rewind',
    'Rewind',
    'She wakes up reliving the worst week of her life and must fix everything before time runs out.',
    'Time-travel drama',
    'Drama',
    0, 5, 49, 'coming_soon'
  );

-- ============================================================
-- Seed Episodes for all 9 live series
-- ============================================================

-- the-missing-piece: 62 episodes
DO $$
BEGIN
  FOR i IN 1..62 LOOP
    INSERT INTO public.episodes (series_slug, number, title, duration_s, is_free, unlock_coins)
    VALUES (
      'the-missing-piece',
      i,
      'Episode ' || i,
      60 + floor(random() * 61)::int,
      i <= 5,
      CASE WHEN i <= 5 THEN 0 ELSE 49 END
    );
  END LOOP;
END $$;

-- married-to-a-stranger: 62 episodes
DO $$
BEGIN
  FOR i IN 1..62 LOOP
    INSERT INTO public.episodes (series_slug, number, title, duration_s, is_free, unlock_coins)
    VALUES (
      'married-to-a-stranger',
      i,
      'Episode ' || i,
      60 + floor(random() * 61)::int,
      i <= 5,
      CASE WHEN i <= 5 THEN 0 ELSE 49 END
    );
  END LOOP;
END $$;

-- on-one-condition: 62 episodes
DO $$
BEGIN
  FOR i IN 1..62 LOOP
    INSERT INTO public.episodes (series_slug, number, title, duration_s, is_free, unlock_coins)
    VALUES (
      'on-one-condition',
      i,
      'Episode ' || i,
      60 + floor(random() * 61)::int,
      i <= 5,
      CASE WHEN i <= 5 THEN 0 ELSE 49 END
    );
  END LOOP;
END $$;

-- killer-romance: 59 episodes
DO $$
BEGIN
  FOR i IN 1..59 LOOP
    INSERT INTO public.episodes (series_slug, number, title, duration_s, is_free, unlock_coins)
    VALUES (
      'killer-romance',
      i,
      'Episode ' || i,
      60 + floor(random() * 61)::int,
      i <= 5,
      CASE WHEN i <= 5 THEN 0 ELSE 49 END
    );
  END LOOP;
END $$;

-- honey-gold: 61 episodes
DO $$
BEGIN
  FOR i IN 1..61 LOOP
    INSERT INTO public.episodes (series_slug, number, title, duration_s, is_free, unlock_coins)
    VALUES (
      'honey-gold',
      i,
      'Episode ' || i,
      60 + floor(random() * 61)::int,
      i <= 5,
      CASE WHEN i <= 5 THEN 0 ELSE 49 END
    );
  END LOOP;
END $$;

-- revenge-on-my-cheating-fiance: 50 episodes
DO $$
BEGIN
  FOR i IN 1..50 LOOP
    INSERT INTO public.episodes (series_slug, number, title, duration_s, is_free, unlock_coins)
    VALUES (
      'revenge-on-my-cheating-fiance',
      i,
      'Episode ' || i,
      60 + floor(random() * 61)::int,
      i <= 5,
      CASE WHEN i <= 5 THEN 0 ELSE 49 END
    );
  END LOOP;
END $$;

-- the-billionaires-vow: 60 episodes
DO $$
BEGIN
  FOR i IN 1..60 LOOP
    INSERT INTO public.episodes (series_slug, number, title, duration_s, is_free, unlock_coins)
    VALUES (
      'the-billionaires-vow',
      i,
      'Episode ' || i,
      60 + floor(random() * 61)::int,
      i <= 5,
      CASE WHEN i <= 5 THEN 0 ELSE 49 END
    );
  END LOOP;
END $$;

-- im-obsessed-with-my-boss: 50 episodes
DO $$
BEGIN
  FOR i IN 1..50 LOOP
    INSERT INTO public.episodes (series_slug, number, title, duration_s, is_free, unlock_coins)
    VALUES (
      'im-obsessed-with-my-boss',
      i,
      'Episode ' || i,
      60 + floor(random() * 61)::int,
      i <= 5,
      CASE WHEN i <= 5 THEN 0 ELSE 49 END
    );
  END LOOP;
END $$;

-- she-is-mine: 60 episodes
DO $$
BEGIN
  FOR i IN 1..60 LOOP
    INSERT INTO public.episodes (series_slug, number, title, duration_s, is_free, unlock_coins)
    VALUES (
      'she-is-mine',
      i,
      'Episode ' || i,
      60 + floor(random() * 61)::int,
      i <= 5,
      CASE WHEN i <= 5 THEN 0 ELSE 49 END
    );
  END LOOP;
END $$;
