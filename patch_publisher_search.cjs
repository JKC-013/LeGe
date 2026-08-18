const fs = require('fs');
let content = fs.readFileSync('src/pages/PublisherDashboard.tsx', 'utf8');

// 1. Add songs from store
content = content.replace("const { addSong } = useStore();", "const { addSong, songs } = useStore();\n  const [showSuggestions, setShowSuggestions] = useState(false);");

// 2. Add search suggestion logic
const searchSuggestionLogic = `
  const suggestions = songs.filter(s => s.status === 'approved' && s.title.toLowerCase().includes(formData.title.toLowerCase()) && formData.title.length > 0);
  
  // Create a unique list of suggestions by title to avoid duplicates
  const uniqueSuggestions = Array.from(new Map(suggestions.map(s => [s.title, s])).values()).slice(0, 5);

  const selectSuggestion = (song: any) => {
    setFormData({
      ...formData,
      title: song.title,
      organization: song.organization || '',
      category: song.category || 'Worship'
    });
    setShowSuggestions(false);
  };
`;

content = content.replace("const handleSubmit = async (e: React.FormEvent) => {", searchSuggestionLogic + "\n  const handleSubmit = async (e: React.FormEvent) => {");

// 3. Update the Title input to include the dropdown
const titleInputTarget = `            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-on-surface mb-2">{t('publisher.songName')}</label>
              <input required type="text" className="block w-full bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-xl rounded-b-sm py-3 px-4 focus:outline-none focus:ring-0 text-base transition-colors text-on-surface" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>`;

const titleInputReplacement = `            <div className="sm:col-span-2 relative">
              <label className="block text-sm font-bold text-on-surface mb-2">{t('publisher.songName')} <span className="text-xs font-normal text-on-surface-variant ml-2">(Type to search existing songs)</span></label>
              <input 
                required 
                type="text" 
                className="block w-full bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-xl rounded-b-sm py-3 px-4 focus:outline-none focus:ring-0 text-base transition-colors text-on-surface" 
                value={formData.title} 
                onChange={e => {
                  setFormData({...formData, title: e.target.value});
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Search or enter new song name..."
              />
              {showSuggestions && uniqueSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-surface-container shadow-lg rounded-xl overflow-hidden border border-outline-variant/30">
                  {uniqueSuggestions.map(song => (
                    <div 
                      key={song.id} 
                      className="px-4 py-3 cursor-pointer hover:bg-surface-container-highest transition-colors border-b border-outline-variant/10 last:border-0"
                      onClick={() => selectSuggestion(song)}
                    >
                      <div className="font-bold text-on-surface">{song.title}</div>
                      <div className="text-xs text-on-surface-variant">{song.organization} • {song.category}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>`;

content = content.replace(titleInputTarget, titleInputReplacement);

fs.writeFileSync('src/pages/PublisherDashboard.tsx', content);
