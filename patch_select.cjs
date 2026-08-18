const fs = require('fs');
let content = fs.readFileSync('src/pages/PublisherDashboard.tsx', 'utf8');

const oldLogic = `  const selectSuggestion = (song: any) => {
    setFormData({
      ...formData,
      title: song.title,
      organization: song.organization || '',
      category: song.category || 'Worship'
    });
    setShowSuggestions(false);
  };`;

const newLogic = `  const selectSuggestion = (song: any) => {
    setFormData({
      ...formData,
      title: song.title,
      organization: song.organization || '',
      category: song.category || 'Worship',
      lyrics: song.lyrics || ''
    });
    setShowSuggestions(false);
  };`;

content = content.replace(oldLogic, newLogic);

fs.writeFileSync('src/pages/PublisherDashboard.tsx', content);
