-- ============================================================================
-- Larpinator — 002: seed data
-- Run AFTER 001_schema.sql (Supabase Dashboard → SQL Editor).
-- Seeds achievements, daily LARP challenges, and the quiz question bank.
-- Safe to re-run: rows are upserted by natural keys.
-- ============================================================================

-- ============================== achievements ================================
insert into public.achievements (key, name, description, icon) values
  ('buzzword_merchant', 'Buzzword Merchant', 'Scored 90+ on Buzzword LARP in a single analysis.', '🧢'),
  ('certified_cringe', 'Certified Cringe', 'Scored 90+ on Cringe in a single analysis.', '🤡'),
  ('delusion_maxxing', 'Delusion Maxxing', 'Scored 90+ on Fakeness in a single analysis.', '💀'),
  ('aura_farmer', 'Aura Farmer', 'Scored 90+ on Aura in a single analysis.', '⚡'),
  ('no_larp_detected', 'No LARP Detected', 'Held an overall LARP score of 20 or below with at least one completed analysis.', '🧘'),
  ('larp_slayer', 'LARP Slayer', 'Won 3 LARP battles.', '⚔️'),
  ('larp_god', 'LARP GOD', 'Reached an overall LARP score of 100.', '👑')
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon;

-- ============================= daily challenges =============================
-- Challenges rotate deterministically by UTC day. Add more rows freely.
insert into public.daily_larps (prompt, sort_order)
select * from (values
  ('Explain Docker without saying "container."', 1),
  ('Describe your project without using "AI".', 2),
  ('Convince us you are productive in exactly 20 words.', 3),
  ('Explain blockchain to a 5-year-old.', 4),
  ('Pitch yourself as a superhero. Your power must be a real skill you have.', 5),
  ('Explain what you do for work to your grandmother, without jargon.', 6),
  ('Roast your own resume in 2 sentences. Be honest.', 7),
  ('Describe your ideal Friday night like a corporate earnings call.', 8),
  ('Sell us a pen. The pen is broken.', 9),
  ('Explain Kubernetes using only food metaphors.', 10),
  ('Write your LinkedIn bio in exactly 5 words. No buzzwords allowed.', 11),
  ('Describe your last bug fix as an epic movie trailer.', 12),
  ('Explain recursion without using the words "recursion" or "itself".', 13),
  ('Give us a TED talk title for your life, then its opening line.', 14),
  ('Describe your music taste as a government warning label.', 15),
  ('Explain your GitHub profile like a nature documentary narrator.', 16),
  ('Write a haiku about your unread emails.', 17),
  ('Describe your sleep schedule like a stock market report.', 18),
  ('Convince us your most useless skill is actually valuable.', 19),
  ('Explain "cloud computing" to someone from 1950.', 20),
  ('Write an apology letter from your procrastination to your deadlines.', 21),
  ('Describe your gym routine (or lack of one) like a fantasy novel.', 22),
  ('Pitch a startup that solves a problem nobody has.', 23),
  ('Explain what a compiler does using only emojis and 10 words.', 24),
  ('Describe your caffeine dependency as a love story.', 25),
  ('Give us your 10-year plan in exactly 3 sentences. No "AI startup".', 26),
  ('Explain APIs like you are a restaurant owner.', 27),
  ('Write your own performance review. Be the villain.', 28),
  ('Describe your code review style as a weather forecast.', 29),
  ('Explain why your side project is "almost done" using legal language.', 30),
  ('Summarize the plot of your career as a 3-line fortune cookie.', 31),
  ('Describe your debugging process as a five-star restaurant review.', 32),
  ('Explain the difference between HTTP and HTTPS like a nightclub bouncer.', 33),
  ('Write a breakup text to your unfinished projects.', 34),
  ('Describe your browser tabs as a hoarding documentary.', 35)
) as v(prompt, sort_order)
where not exists (select 1 from public.daily_larps limit 1);

-- ============================ quiz questions ================================
-- 50 questions across 10 categories. Add more freely; the quiz samples randomly.
insert into public.quiz_questions (category, question, options, correct_index, difficulty)
select * from (values
  -- Tech
  ('Tech', 'What does "HTTP" stand for?', '["High Transfer Text Process", "HyperText Transfer Protocol", "HyperText Transmission Process", "HyperTerminal Transfer Protocol"]'::jsonb, 1, 'easy'),
  ('Tech', 'Which company created the React library?', '["Google", "Microsoft", "Meta", "Amazon"]'::jsonb, 2, 'easy'),
  ('Tech', 'In Git, what does "git bisect" do?', '["Splits a branch in two", "Merges two repositories", "Deletes the last commit", "Finds the commit that introduced a bug via binary search"]'::jsonb, 3, 'medium'),
  ('Tech', 'Which of these is NOT a JavaScript runtime?', '["Node.js", "Nginx", "Deno", "Bun"]'::jsonb, 1, 'medium'),
  ('Tech', 'What does "SSD" stand for?', '["Solid State Drive", "Super Speed Disk", "Secure System Data", "Static Storage Device"]'::jsonb, 0, 'easy'),
  -- Internet culture
  ('Internet culture', 'What does getting "ratioed" mean on X/Twitter?', '["Your post went viral", "Replies outnumber likes", "You got verified", "You were shadowbanned"]'::jsonb, 1, 'easy'),
  ('Internet culture', '"Touch grass" is an instruction to...', '["Water your plants", "Delete your account", "Go outside and reconnect with reality", "Change your profile picture"]'::jsonb, 2, 'easy'),
  ('Internet culture', 'What does "based" usually mean online?', '["Being a basic user", "Having no followers", "Getting banned", "Approving of an unapologetic opinion"]'::jsonb, 3, 'medium'),
  ('Internet culture', 'A "copypasta" is...', '["Text copied and pasted around as a meme", "An Italian pasta dish", "A password-stealing tool", "A pasta recipe blog"]'::jsonb, 0, 'easy'),
  ('Internet culture', '"Delulu" is slang for...', '["Delicious", "Delusional, affectionately", "Delayed", "Deleted"]'::jsonb, 1, 'easy'),
  -- Science
  ('Science', 'The speed of light is roughly...', '["150,000 km/s", "3,000 km/s", "300,000 km/s", "30,000 km/s"]'::jsonb, 2, 'easy'),
  ('Science', 'What does DNA stand for?', '["Dinucleic acid", "Deoxyribose nucleic atom", "Double nucleic acid", "Deoxyribonucleic acid"]'::jsonb, 3, 'easy'),
  ('Science', 'Which planet has the most confirmed moons?', '["Saturn", "Jupiter", "Uranus", "Neptune"]'::jsonb, 0, 'medium'),
  ('Science', 'The "powerhouse of the cell" (per every biology meme) is the...', '["Nucleus", "Mitochondria", "Ribosome", "Golgi apparatus"]'::jsonb, 1, 'easy'),
  ('Science', 'What is the chemical formula of water?', '["CO2", "O2", "H2O", "H2O2"]'::jsonb, 2, 'easy'),
  -- Gaming
  ('Gaming', 'In Minecraft, what can mine obsidian?', '["An iron pickaxe", "A gold pickaxe", "Any pickaxe", "A diamond or netherite pickaxe"]'::jsonb, 3, 'medium'),
  ('Gaming', 'Which game is most credited with popularizing the modern battle royale?', '["PUBG", "Fortnite", "Among Us", "Minecraft"]'::jsonb, 0, 'medium'),
  ('Gaming', 'GLaDOS is the antagonist of which game?', '["Half-Life", "Portal", "BioShock", "Doom"]'::jsonb, 1, 'medium'),
  ('Gaming', 'In chess, what is "castling"?', '["A checkmate pattern", "Capturing en passant", "A single move involving the king and a rook", "Promoting a pawn"]'::jsonb, 2, 'medium'),
  ('Gaming', 'In gaming slang, "NPC" means...', '["New Player Challenge", "Next Phase Combat", "Network Ping Check", "Non-player character"]'::jsonb, 3, 'easy'),
  -- Music
  ('Music', 'Which Beatles album features "Come Together"?', '["Abbey Road", "Let It Be", "Revolver", "Help!"]'::jsonb, 0, 'medium'),
  ('Music', 'What does "BPM" mean in music?', '["Bass per measure", "Beats per minute", "Bars per mix", "Beat pattern mode"]'::jsonb, 1, 'easy'),
  ('Music', 'The famous lo-fi study stream character is called...', '["Chill Cow", "Study Bunny", "Lofi Girl", "Beats Bear"]'::jsonb, 2, 'easy'),
  ('Music', '"OK Computer" is an album by...', '["Coldplay", "Muse", "Oasis", "Radiohead"]'::jsonb, 3, 'medium'),
  ('Music', 'A "diss track" is...', '["A song insulting another artist", "A remix", "A film soundtrack", "A deleted song"]'::jsonb, 0, 'easy'),
  -- Indian culture
  ('Indian culture', 'Which festival is known as the "festival of lights"?', '["Holi", "Diwali", "Eid", "Onam"]'::jsonb, 1, 'easy'),
  ('Indian culture', '"Jugaad" refers to...', '["A folk dance", "A dessert", "A clever improvised workaround", "A card game"]'::jsonb, 2, 'medium'),
  ('Indian culture', 'The Taj Mahal is located in which city?', '["Delhi", "Jaipur", "Lucknow", "Agra"]'::jsonb, 3, 'easy'),
  ('Indian culture', 'What does "chai" mean?', '["Tea", "Coffee", "Milk", "Water"]'::jsonb, 0, 'easy'),
  ('Indian culture', 'Sachin Tendulkar is a legend of which sport?', '["Hockey", "Cricket", "Badminton", "Football"]'::jsonb, 1, 'easy'),
  -- Developer lore
  ('Developer lore', 'What is "rubber duck debugging"?', '["Testing against a fake server", "Deleting code until it works", "Explaining code to a duck to find bugs", "A type of unit test"]'::jsonb, 2, 'easy'),
  ('Developer lore', '"It works on my machine" is a classic...', '["Testing framework", "Compiler flag", "Deployment strategy", "Excuse"]'::jsonb, 3, 'easy'),
  ('Developer lore', 'In code review, "LGTM" means...', '["Looks good to me", "Let''s get this merged", "Last git tag missing", "Let''s go touch memory"]'::jsonb, 0, 'easy'),
  ('Developer lore', 'Who created Linux?', '["Richard Stallman", "Linus Torvalds", "Ken Thompson", "Dennis Ritchie"]'::jsonb, 1, 'medium'),
  ('Developer lore', '"Spaghetti code" describes...', '["An Italian framework", "A CSS preprocessor", "Tangled, disorganized code", "A pasta API"]'::jsonb, 2, 'easy'),
  -- Random obscure topics
  ('Random obscure topics', 'How many holes does a standard bowling ball have?', '["2", "4", "5", "3"]'::jsonb, 3, 'easy'),
  ('Random obscure topics', 'What is the fear of long words called?', '["Hippopotomonstrosesquippedaliophobia", "Arachnophobia", "Triskaidekaphobia", "Ailurophobia"]'::jsonb, 0, 'hard'),
  ('Random obscure topics', 'What color is a polar bear''s skin?', '["White", "Black", "Pink", "Grey"]'::jsonb, 1, 'medium'),
  ('Random obscure topics', 'Which is heavier: a kilogram of feathers or a kilogram of steel?', '["Steel", "Feathers", "They weigh the same", "Depends on gravity"]'::jsonb, 2, 'easy'),
  ('Random obscure topics', 'How long is a "New York minute"?', '["Exactly 60 seconds", "90 seconds", "2 minutes", "An instant"]'::jsonb, 3, 'medium'),
  -- Brainrot
  ('Brainrot', 'Where does "skibidi" come from?', '["A YouTube series with toilet-headed characters", "A K-pop song", "A horror movie", "A mobile game"]'::jsonb, 0, 'easy'),
  ('Brainrot', '"Fanum tax" refers to...', '["A government levy", "Stealing a friend''s food", "A crypto transaction fee", "A music genre"]'::jsonb, 1, 'easy'),
  ('Brainrot', 'What are "the backrooms"?', '["A nightclub chain", "A game studio", "An internet liminal-space creepypasta", "A retail brand"]'::jsonb, 2, 'medium'),
  ('Brainrot', 'In brainrot slang, a "sigma" is...', '["A math symbol, exclusively", "A Greek deity", "A software metric", "A lone-wolf alpha type, usually said ironically"]'::jsonb, 3, 'medium'),
  ('Brainrot', '"Gyatt" is used to express...', '["Surprise or emphasis", "Goodbye", "A formal greeting", "A type of dance"]'::jsonb, 0, 'easy'),
  -- Completely useless knowledge
  ('Completely useless knowledge', 'What is the national animal of Scotland?', '["Lion", "Unicorn", "Stag", "Golden eagle"]'::jsonb, 1, 'medium'),
  ('Completely useless knowledge', 'Honey never spoils. What makes it last?', '["Refrigeration", "A natural preservative added by bees", "Its low water content and acidity", "It does spoil, actually"]'::jsonb, 2, 'medium'),
  ('Completely useless knowledge', 'The classic "save" icon depicts a...', '["Cassette tape", "Hard drive", "USB stick", "Floppy disk"]'::jsonb, 3, 'easy'),
  ('Completely useless knowledge', 'Botanically speaking, a banana is a...', '["Berry", "Nut", "Drupe", "Vegetable"]'::jsonb, 0, 'hard'),
  ('Completely useless knowledge', 'How many times does the average person blink per day?', '["Around 1,000", "Around 14,000", "Around 50,000", "Around 500"]'::jsonb, 1, 'hard')
) as v(category, question, options, correct_index, difficulty)
where not exists (select 1 from public.quiz_questions limit 1);
