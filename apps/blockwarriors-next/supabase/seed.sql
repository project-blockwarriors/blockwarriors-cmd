-- Add default settings
INSERT INTO public.settings (id, start_tournament, show_banner, banner_text_content, banner_button_content)
VALUES 
  (gen_random_uuid(), false, false, 'Welcome to BlockWarriors', 'Learn More')
ON CONFLICT (id) DO NOTHING;
