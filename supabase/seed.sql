-- Seed CMS defaults (safe to re-run)
insert into public.cms_pages (page_key, content_json)
values (
  'home',
  jsonb_build_object(
    'heroTitle', 'Pharmcards — GPAT 2026 Prep',
    'heroSubtitle', 'AI notes, topic tests, mock/grand tests, and analytics built for exam accuracy.',
    'announcements', jsonb_build_array('GPAT 2026 syllabus-aligned content is being added weekly.'),
    'ctaText', 'Get started'
  )
)
on conflict (page_key) do update
set content_json = excluded.content_json,
    updated_at = now();


