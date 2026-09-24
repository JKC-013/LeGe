import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  ChevronRight, 
  ArrowLeft, 
  Upload, 
  FileText, 
  Search, 
  Music, 
  CheckCircle2, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Song, useStore } from '../store';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { parseSongPdfs, serializeSongPdfs } from '../lib/songHelpers';
import { generatePdfThumbnail } from '../lib/pdfThumbnail';

interface EditSongModalProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedSong: Partial<Song>) => Promise<void>;
}

const PREDEFINED_KEYS = ['Dd', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#-Gb'];

export function EditSongModal({ song: initialSong, isOpen, onClose }: EditSongModalProps) {
  const { t } = useTranslation();
  const { songs, deleteSong, deleteSongVersion, deleteSongKey, editSong } = useStore();

  // Selected song state (can change via search/switcher)
  const [selectedSongId, setSelectedSongId] = useState<string>('');
  const [songSearchQuery, setSongSearchQuery] = useState('');

  // 3-step hierarchy: 1 = Song & Versions, 2 = Version & Keys, 3 = Edit Details
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [selectedKey, setSelectedKey] = useState<string>('');

  // Step 3 editing form state
  const [formData, setFormData] = useState({
    title: '',
    organization: '',
    category: 'Worship',
    versionName: '',
    keyName: '',
    lyrics: ''
  });

  // File upload state for Step 3
  const [newPdfFile, setNewPdfFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'song' | 'version' | 'allKeys' | 'key';
    target?: string;
  } | null>(null);

  // Initialize selected song when modal opens or initialSong changes
  useEffect(() => {
    if (initialSong) {
      setSelectedSongId(initialSong.id);
    } else if (songs.length > 0 && !selectedSongId) {
      setSelectedSongId(songs[0].id);
    }
    setStep(1);
    setSelectedVersion('');
    setSelectedKey('');
    setConfirmDelete(null);
    setSaveSuccess(false);
    setNewPdfFile(null);
  }, [initialSong, isOpen]);

  // Current active song from store
  const activeSong = songs.find(s => s.id === selectedSongId) || null;
  const parsed = parseSongPdfs(activeSong?.pdfUrl, activeSong?.versions);

  // Populate form fields when entering Step 3
  useEffect(() => {
    if (activeSong && step === 3) {
      const v = selectedVersion || (activeSong.versions && activeSong.versions[0]) || 'Vietnamese';
      const k = selectedKey || parsed.versionKeys[v] || (activeSong.keys && activeSong.keys[0]) || 'C';
      setFormData({
        title: activeSong.title,
        organization: activeSong.organization,
        category: activeSong.category || 'Worship',
        versionName: v,
        keyName: k,
        lyrics: activeSong.lyrics || ''
      });
      setNewPdfFile(null);
      setSaveSuccess(false);
    }
  }, [step, selectedVersion, selectedKey, activeSong?.id]);

  if (!isOpen) return null;

  // Filter songs for search
  const filteredSongs = songs.filter(s => {
    const q = songSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return s.title.toLowerCase().includes(q) || s.organization.toLowerCase().includes(q);
  });

  // 1. Handlers for Step 1
  const handleDeleteEntireSong = async () => {
    if (!activeSong) return;
    await deleteSong(activeSong.id);
    setConfirmDelete(null);
    onClose();
  };

  const handleDeleteVersion = async (version: string) => {
    if (!activeSong) return;
    await deleteSongVersion(activeSong.id, version);
    setConfirmDelete(null);
    if (selectedVersion === version) {
      setSelectedVersion('');
      setStep(1);
    }
  };

  const handleSelectVersion = (version: string) => {
    setSelectedVersion(version);
    // Find key for this version
    const mappedKey = parsed.versionKeys[version] || (activeSong?.keys && activeSong.keys[0]) || '';
    setSelectedKey(mappedKey);
    setStep(2);
  };

  // 2. Handlers for Step 2
  const handleDeleteAllKeys = async () => {
    if (!activeSong || !selectedVersion) return;
    await deleteSongKey(activeSong.id, selectedVersion);
    setConfirmDelete(null);
  };

  const handleDeleteKey = async (key: string) => {
    if (!activeSong || !selectedVersion) return;
    await deleteSongKey(activeSong.id, selectedVersion, key);
    setConfirmDelete(null);
    if (selectedKey === key) {
      setSelectedKey('');
    }
  };

  const handleSelectKey = (key: string) => {
    setSelectedKey(key);
    setStep(3);
  };

  // 3. Handlers for Step 3
  const handleSaveStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSong) return;
    setIsSaving(true);

    try {
      let updatedPdfUrl = parsed.versionPdfs[selectedVersion] || parsed.defaultPdf;
      let newThumbnailUrl = activeSong.thumbnailUrl;

      // If user uploaded a replacement PDF
      if (newPdfFile) {
        const fileExt = newPdfFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `pdfs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('music-sheets')
          .upload(filePath, newPdfFile, { contentType: 'application/pdf', upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('music-sheets')
          .getPublicUrl(filePath);

        updatedPdfUrl = publicUrl;

        try {
          newThumbnailUrl = await generatePdfThumbnail(newPdfFile);
        } catch (err) {
          console.error('Thumbnail generation error:', err);
        }
      }

      // Handle rename of version
      const oldVersion = selectedVersion;
      const newVersion = formData.versionName.trim() || oldVersion;
      const updatedVersions = (activeSong.versions || []).map(v => v === oldVersion ? newVersion : v);
      if (!updatedVersions.includes(newVersion)) {
        updatedVersions.push(newVersion);
      }

      // Handle key updates
      const oldKey = selectedKey;
      const newKey = formData.keyName.trim() || oldKey;
      const updatedKeys = Array.from(new Set([...(activeSong.keys || []).map(k => k === oldKey ? newKey : k), newKey]));

      const newVersionPdfs = { ...parsed.versionPdfs };
      if (oldVersion !== newVersion) {
        delete newVersionPdfs[oldVersion];
      }
      newVersionPdfs[newVersion] = updatedPdfUrl;

      const newVersionKeys = { ...parsed.versionKeys };
      if (oldVersion !== newVersion) {
        delete newVersionKeys[oldVersion];
      }
      newVersionKeys[newVersion] = newKey;

      const serializedPdf = serializeSongPdfs(newVersionPdfs, newVersionKeys, updatedPdfUrl);

      // Save without touching status (preserves approved state!)
      await editSong(activeSong.id, {
        title: formData.title.trim(),
        organization: formData.organization.trim(),
        category: formData.category,
        lyrics: formData.lyrics,
        versions: updatedVersions,
        keys: updatedKeys,
        pdfUrl: serializedPdf,
        versionPdfs: newVersionPdfs,
        versionKeys: newVersionKeys,
        thumbnailUrl: newThumbnailUrl
      });

      setSelectedVersion(newVersion);
      setSelectedKey(newKey);
      setSaveSuccess(true);
      setNewPdfFile(null);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving song edits:', err);
      alert(`Error saving changes: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-surface-container-lowest w-full max-w-3xl rounded-3xl shadow-ambient relative my-8 border border-outline-variant/15 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/15 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-on-surface">
                {t('admin.editSongTitle')}
              </h2>
              <p className="text-xs text-on-surface-variant">
                {activeSong ? `${activeSong.title} (${activeSong.organization || 'Church'})` : t('admin.searchSongPlaceholder')}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator & Breadcrumb */}
        <div className="bg-surface-container px-6 py-3 border-b border-outline-variant/10 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 overflow-x-auto py-1">
            <button
              onClick={() => setStep(1)}
              className={`font-semibold flex items-center px-2.5 py-1 rounded-lg transition-colors ${
                step === 1 ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              1. {t('admin.step1Title')}
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-outline-variant shrink-0" />

            <button
              disabled={!selectedVersion}
              onClick={() => selectedVersion && setStep(2)}
              className={`font-semibold flex items-center px-2.5 py-1 rounded-lg transition-colors ${
                step === 2 
                  ? 'bg-primary text-on-primary' 
                  : selectedVersion 
                    ? 'text-on-surface-variant hover:bg-surface-container-highest' 
                    : 'text-outline-variant opacity-50 cursor-not-allowed'
              }`}
            >
              2. {t('admin.step2Title')} {selectedVersion ? `(${selectedVersion})` : ''}
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-outline-variant shrink-0" />

            <button
              disabled={!selectedVersion}
              onClick={() => selectedVersion && setStep(3)}
              className={`font-semibold flex items-center px-2.5 py-1 rounded-lg transition-colors ${
                step === 3 
                  ? 'bg-primary text-on-primary' 
                  : selectedVersion 
                    ? 'text-on-surface-variant hover:bg-surface-container-highest' 
                    : 'text-outline-variant opacity-50 cursor-not-allowed'
              }`}
            >
              3. {t('admin.step3Title')} {selectedKey ? `(${selectedKey})` : ''}
            </button>
          </div>

          {step > 1 && (
            <button
              onClick={() => setStep(step === 3 ? 2 : 1)}
              className="flex items-center text-primary font-medium hover:underline text-xs shrink-0 ml-2"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              {t('admin.back')}
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* ========================================================================= */}
          {/* STEP 1: Search Song, Delete Song & All Versions, or Choose / Delete Version */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="space-y-6">
              
              {/* Song Search Bar */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  {t('admin.searchSongPlaceholder')}
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant" />
                  <input
                    type="text"
                    value={songSearchQuery}
                    onChange={e => setSongSearchQuery(e.target.value)}
                    placeholder={t('admin.searchSongPlaceholder')}
                    className="w-full bg-surface-container pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/20 focus:border-primary focus:outline-none text-sm text-on-surface"
                  />
                </div>

                {/* Song Quick Selector */}
                {filteredSongs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                    {filteredSongs.slice(0, 10).map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSongId(s.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                          selectedSongId === s.id
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-surface border-outline-variant/20 text-on-surface-variant hover:bg-surface-container'
                        }`}
                      >
                        <span className="truncate max-w-[160px]">{s.title}</span>
                        {s.versions && s.versions.length > 0 && (
                          <span className="text-[10px] opacity-75">({s.versions.length} v)</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Song Details */}
              {activeSong ? (
                <div className="bg-surface rounded-2xl p-5 border border-outline-variant/15 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant/10">
                    <div>
                      <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                        {activeSong.title}
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-container font-normal text-on-surface-variant">
                          {activeSong.category}
                        </span>
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {activeSong.organization} &bull; {activeSong.keys?.join(', ') || 'No keys'}
                      </p>
                    </div>

                    {/* Delete entire song & all versions */}
                    <button
                      type="button"
                      onClick={() => setConfirmDelete({ type: 'song' })}
                      className="px-3.5 py-2 bg-error/10 text-error hover:bg-error/20 rounded-xl text-xs font-bold transition-colors flex items-center self-start shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      {t('admin.deleteEntireSong')}
                    </button>
                  </div>

                  {/* Versions List */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
                      {t('publisher.version')} ({activeSong.versions?.length || 0})
                    </h4>

                    {(!activeSong.versions || activeSong.versions.length === 0) ? (
                      <div className="text-sm text-outline-variant italic p-4 text-center bg-surface-container rounded-xl">
                        {t('admin.noVersionsFound')}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeSong.versions.map(version => {
                          const vPdf = parsed.versionPdfs[version] || parsed.defaultPdf;
                          const vKey = parsed.versionKeys[version] || '';
                          return (
                            <div 
                              key={version}
                              className="p-3.5 bg-surface-container rounded-xl border border-outline-variant/15 flex items-center justify-between gap-2 hover:border-primary/40 transition-colors"
                            >
                              <div className="min-w-0">
                                <div className="font-bold text-sm text-on-surface truncate flex items-center gap-1.5">
                                  <span>{version}</span>
                                  {vKey && (
                                    <span className="text-[11px] px-1.5 py-0.2 bg-primary/10 text-primary rounded font-mono">
                                      Key: {vKey}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-on-surface-variant truncate">
                                  {vPdf ? 'PDF available' : 'No PDF attached'}
                                </p>
                              </div>

                              <div className="flex items-center space-x-1.5 shrink-0">
                                {/* Delete Version button */}
                                <button
                                  type="button"
                                  onClick={() => setConfirmDelete({ type: 'version', target: version })}
                                  className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                                  title={t('admin.deleteVersion')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>

                                {/* Choose / Continue with Version button */}
                                <button
                                  type="button"
                                  onClick={() => handleSelectVersion(version)}
                                  className="px-3 py-1.5 bg-primary text-on-primary hover:bg-primary-container rounded-lg text-xs font-bold transition-colors flex items-center"
                                >
                                  <span>{t('admin.continueWithVersion')}</span>
                                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-outline-variant">
                  {t('admin.selectSongToEdit')}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: Manage Keys for Version (Delete All Keys, Delete One, or Choose)   */}
          {/* ========================================================================= */}
          {step === 2 && activeSong && (
            <div className="space-y-6">
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-primary text-base flex items-center gap-2">
                    <span>{t('publisher.version')}: {selectedVersion}</span>
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {t('admin.step2Title')} &bull; {activeSong.title}
                  </p>
                </div>

                {/* Delete all keys for this version */}
                <button
                  type="button"
                  onClick={() => setConfirmDelete({ type: 'allKeys', target: selectedVersion })}
                  className="px-3.5 py-1.5 bg-error/10 text-error hover:bg-error/20 rounded-xl text-xs font-bold transition-colors flex items-center shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  {t('admin.deleteAllKeys')}
                </button>
              </div>

              {/* Keys list */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
                  {t('song.key')} ({activeSong.keys?.length || 0})
                </h4>

                {(!activeSong.keys || activeSong.keys.length === 0) ? (
                  <div className="text-sm text-outline-variant italic p-6 text-center bg-surface-container rounded-xl">
                    {t('admin.noKeysFound')}
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => { setSelectedKey('C'); setStep(3); }}
                        className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold"
                      >
                        + {t('admin.continueWithKey')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeSong.keys.map(keyName => {
                      const isCurrentForVersion = parsed.versionKeys[selectedVersion] === keyName;
                      return (
                        <div 
                          key={keyName}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                            isCurrentForVersion 
                              ? 'bg-surface-container-highest border-primary' 
                              : 'bg-surface-container border-outline-variant/15'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center font-bold text-sm text-on-surface font-mono shadow-sm">
                              {keyName}
                            </span>
                            {isCurrentForVersion && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                Active Key
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-1.5">
                            {/* Delete single key */}
                            <button
                              type="button"
                              onClick={() => setConfirmDelete({ type: 'key', target: keyName })}
                              className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                              title={t('admin.deleteKey')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            {/* Choose key & proceed to Step 3 */}
                            <button
                              type="button"
                              onClick={() => handleSelectKey(keyName)}
                              className="px-3 py-1.5 bg-primary text-on-primary hover:bg-primary-container rounded-lg text-xs font-bold transition-colors flex items-center"
                            >
                              <span>{t('admin.continueWithKey')}</span>
                              <ChevronRight className="w-3.5 h-3.5 ml-1" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: Edit Song Content (Replace PDF, Fix Text) & Save (Keeps Status)    */}
          {/* ========================================================================= */}
          {step === 3 && activeSong && (
            <form onSubmit={handleSaveStep3} className="space-y-6">
              
              {saveSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-600 shrink-0" />
                  <span>{t('admin.savedSuccessfully')}</span>
                </div>
              )}

              {/* Replace PDF Section */}
              <div className="p-4 bg-surface rounded-2xl border border-outline-variant/15 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-primary" />
                    {t('admin.replacePdf')} ({selectedVersion})
                  </h4>
                  {parsed.versionPdfs[selectedVersion] && (
                    <a
                      href={parsed.versionPdfs[selectedVersion]}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      {t('admin.currentPdf')} &rarr;
                    </a>
                  )}
                </div>

                <div className="mt-1 flex justify-center px-4 py-4 border-2 border-outline-variant/30 border-dashed rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer relative">
                  <div className="text-center space-y-1">
                    <Upload className="mx-auto h-6 w-6 text-outline-variant" />
                    <div className="text-xs text-on-surface-variant font-medium">
                      <label htmlFor="replace-pdf" className="cursor-pointer text-primary hover:underline">
                        <span>{newPdfFile ? newPdfFile.name : t('admin.uploadNewPdf')}</span>
                        <input
                          id="replace-pdf"
                          type="file"
                          accept=".pdf"
                          className="sr-only"
                          onChange={e => e.target.files?.[0] && setNewPdfFile(e.target.files[0])}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fix Text Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    {t('publisher.songName')}
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-3.5 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    {t('publisher.organization')}
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.organization}
                    onChange={e => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-3.5 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    {t('publisher.category')}
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-3.5 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                  >
                    <option value="Worship">{t('song.worship')}</option>
                    <option value="Others">{t('song.others')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    {t('publisher.version')} (Rename / Custom)
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.versionName}
                    onChange={e => setFormData({ ...formData, versionName: e.target.value })}
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-3.5 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    {t('publisher.key')}
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={PREDEFINED_KEYS.includes(formData.keyName) ? formData.keyName : 'custom'}
                      onChange={e => {
                        if (e.target.value !== 'custom') {
                          setFormData({ ...formData, keyName: e.target.value });
                        }
                      }}
                      className="w-1/2 bg-surface-container border border-outline-variant/20 rounded-xl px-3.5 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                    >
                      {PREDEFINED_KEYS.map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                      <option value="custom">Custom Key</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Custom"
                      value={formData.keyName}
                      onChange={e => setFormData({ ...formData, keyName: e.target.value })}
                      className="w-1/2 bg-surface-container border border-outline-variant/20 rounded-xl px-3.5 py-2 text-sm text-on-surface focus:border-primary focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    {t('publisher.lyrics')}
                  </label>
                  <textarea
                    rows={5}
                    value={formData.lyrics}
                    onChange={e => setFormData({ ...formData, lyrics: e.target.value })}
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-xl p-3 text-sm text-on-surface focus:border-primary focus:outline-none font-sans"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/15">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  &larr; {t('admin.back')}
                </button>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                  >
                    {t('publisher.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-primary text-on-primary hover:bg-primary-container rounded-xl text-xs font-bold transition-colors shadow-ambient flex items-center disabled:opacity-50"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                    {t('admin.saveChanges')}
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>

        {/* Confirmation Modal for Deletions */}
        {confirmDelete && (
          <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 rounded-3xl">
            <div className="bg-surface-container-lowest border border-outline-variant/20 p-6 rounded-2xl shadow-xl max-w-md w-full space-y-4">
              <div className="flex items-center space-x-3 text-error">
                <AlertTriangle className="w-6 h-6" />
                <h4 className="font-bold text-base text-on-surface">Confirm Deletion</h4>
              </div>
              <p className="text-xs text-on-surface-variant">
                {confirmDelete.type === 'song' && t('admin.confirmDeleteSong', { title: activeSong?.title })}
                {confirmDelete.type === 'version' && t('admin.confirmDeleteVersion', { version: confirmDelete.target })}
                {confirmDelete.type === 'allKeys' && t('admin.confirmDeleteAllKeys', { version: confirmDelete.target })}
                {confirmDelete.type === 'key' && t('admin.confirmDeleteKey', { key: confirmDelete.target })}
              </p>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  {t('publisher.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmDelete.type === 'song') handleDeleteEntireSong();
                    else if (confirmDelete.type === 'version' && confirmDelete.target) handleDeleteVersion(confirmDelete.target);
                    else if (confirmDelete.type === 'allKeys') handleDeleteAllKeys();
                    else if (confirmDelete.type === 'key' && confirmDelete.target) handleDeleteKey(confirmDelete.target);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-error text-on-error hover:bg-error/90 transition-colors shadow-sm"
                >
                  {t('admin.delete')}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
