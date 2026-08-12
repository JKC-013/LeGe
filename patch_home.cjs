const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

content = content.replace(
  "const { songs, currentUser } = useStore();",
  "const { songs, currentUser, serviceRequests } = useStore();"
);

const oldTopSongs = `  // Selected songs in this month (mock logic: just sort by approval_count)
  // Since we don't have approval dates easily available, we'll use top approved songs.
  const topSongs = [...approvedSongs].sort((a, b) => b.approval_count - a.approval_count).slice(0, 4);`;

const newTopSongs = `  // Selected songs: songs that have been approved by pastor
  const approvedRequests = serviceRequests.filter(req => req.status === 'approved');
  const selectedSongIds = new Set(approvedRequests.flatMap(req => req.song_ids));
  const topSongs = songs.filter(song => selectedSongIds.has(song.id));`;

content = content.replace(oldTopSongs, newTopSongs);

content = content.replace(
  `className="aspect-[4/3] bg-surface-container rounded-xl overflow-hidden relative flex items-center justify-center group-hover:scale-[1.02] transition-transform"`,
  `className="aspect-[3/4] bg-surface-container rounded-xl overflow-hidden relative flex items-center justify-center group-hover:scale-[1.02] transition-transform"`
);

fs.writeFileSync('src/pages/Home.tsx', content);
