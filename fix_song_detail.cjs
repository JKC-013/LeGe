const fs = require('fs');
let content = fs.readFileSync('src/pages/SongDetail.tsx', 'utf8');

// Add isInQueue
content = content.replace(
  'const isFav = currentUser?.favourites.includes(song.id);',
  `const isFav = currentUser?.favourites.includes(song.id);\n  const isInQueue = useStore(state => state.requestQueue.includes(song.id));`
);

// Update handleMicClick
content = content.replace(
  `  const handleMicClick = () => {
    if (!currentUser) {
      alert(t("song.loginFirst"));
      return;
    }
    useStore.getState().addToRequestQueue(song.id);
    alert(t("song.addedToQueue"));
  };`,
  `  const handleMicClick = () => {
    if (!currentUser) {
      alert(t("song.loginFirst"));
      return;
    }
    const store = useStore.getState();
    if (isInQueue) {
      store.removeFromRequestQueue(song.id);
    } else {
      store.addToRequestQueue(song.id);
    }
  };`
);

// Update Mic button rendering
content = content.replace(
  `                <button 
                  onClick={handleMicClick}
                  className="p-3 rounded-full bg-surface-container hover:bg-primary/10 hover:text-primary transition-colors text-on-surface-variant"
                  title={t('song.requestApproval')}
                >
                  <Mic className="w-5 h-5" />
                </button>`,
  `                <button 
                  onClick={handleMicClick}
                  className={\`p-3 rounded-full transition-colors \${isInQueue ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant hover:bg-primary/10 hover:text-primary'}\`}
                  title={t('song.requestApproval')}
                >
                  <Mic className="w-5 h-5" fill={isInQueue ? "currentColor" : "none"} />
                </button>`
);

fs.writeFileSync('src/pages/SongDetail.tsx', content);
