# Content Tables Migration

Apply once Supabase content access is granted:
  supabase db push

Until then, the app reads content from the code adapter (lib/content/source.ts with CONTENT_SOURCE=code).

Tables added: shows, seasons, episodes_content, people, show_people, tags, show_tags, articles, internal_links
