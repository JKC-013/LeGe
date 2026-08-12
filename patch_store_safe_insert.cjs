const fs = require('fs');
let content = fs.readFileSync('src/store.ts', 'utf8');

content = content.replace(
  "/* thumbnail_url: songData.thumbnailUrl, // Needs ALTER TABLE songs ADD COLUMN thumbnail_url TEXT; */",
  "thumbnail_url: songData.thumbnailUrl,"
);

// We replace the insert line to handle column not found error (code 42703).
content = content.replace(
  "await supabase.from('songs').insert([dbSong]);",
  `const { error: insertError } = await supabase.from('songs').insert([dbSong]);
    if (insertError) {
      if (insertError.code === '42703') {
        // Fallback: missing thumbnail_url column
        const { thumbnail_url, ...fallbackSong } = dbSong;
        const { error: fallbackError } = await supabase.from('songs').insert([fallbackSong]);
        if (fallbackError) throw fallbackError;
      } else {
        throw insertError;
      }
    }`
);

fs.writeFileSync('src/store.ts', content);
