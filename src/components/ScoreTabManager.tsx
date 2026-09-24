import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  ChevronRight, 
  ArrowLeft, 
  Upload, 
  FileText, 
  Search, 
  Music, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Check
} from 'lucide-react';
import { Song, useStore } from '../store';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { parseSongPdfs, serializeSongPdfs } from '../lib/songHelpers';
import { generatePdfThumbnail } from '../lib/pdfThumbnail';

interface ScoreTabManagerProps {
  initialSongId?: string | null;
  onClearInitialSongId?: () => void;
}

const PREDEFINED_KEYS = ['Dd', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#-Gb'];

export function ScoreTabManager({ initialSongId, onClearInitialSongId }: ScoreTabManagerProps) {
  const { t } = useTranslation();
  const { songs, deleteSong, deleteSongVersion, deleteSongKey, editSong } = useStore();

  // Active song and search
  const [selectedSongId, setSelectedSongId] = useState<string>('');
  const [songSearchQuery, setSongSearchQuery] = useState('');

  // 3-step state: 1 = Song & Versions, 2 = Version & Keys, 3 = Edit Details
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

  // Available approved songs
  const approvedSongs = songs.filter(s => s.status === 'approved');

  // Initialize selected song when initialSongId changes
  useEffect(() => {
    if (initialSongId) {
      setSelectedSongId(initialSongId);
      setStep(1);
    } else if (approvedSongs.length > 0 && !selectedSongId) {
      setSelectedSongId(approvedSongs[0].id);
    }
  }, [initialSongId, approvedSongs.length]);

  // Current active song
  const activeSong = approvedSongs.find(s => s.id === selectedSongId) || approvedSongs[0] || null;
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

  // Filter approved songs for search
  const filteredSongs = approvedSongs.filter(s => {
    const q = songSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return s.title.toLowerCase().includes(q) || (s.organization && s.organization.toLowerCase().includes(q));
  });

  // Step 1: Deletion handlers
  const handleDeleteEntireSong = async () => {
    if (!activeSong) return;
    await deleteSong(activeSong.id);
    setConfirmDelete(null);
    if (onClearInitialSongId) onClearInitialSongId();
    const remaining = approvedSongs.filter(s => s.id !== activeSong.id);
    if (remaining.length > 0) {
      setSelectedSongId(remaining[0].id);
    } else {
      setSelectedSongId('');
    }
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

  // Step 2: Deletion handlers
  const handleDeleteAllKeys = async () => {
    if (!activeSong || !selectedVersion) return;
    const currentKeys = parsed.versionKeys[selectedVersion] 
      ? [parsed.versionKeys[selectedVersion]] 
      : (activeSong.keys || []);
    
    for (const k of currentKeys) {
      await deleteSongKey(activeSong.id, selectedVersion, k);
    }
    setConfirmDelete(null);
    setSelectedKey('');
  };

  const handleDeleteKey = async (key: string) => {
    if (!activeSong || !selectedVersion) return;
    await deleteSongKey(activeSong.id, selectedVersion, key);
    setConfirmDelete(null);
    if (selectedKey === key) {
      setSelectedKey('');
    }
  };

  // Step 3: Save edits
  const handleSaveEdit = async () => {
    if (!activeSong) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      let finalPdfUrl = activeSong.pdfUrl;
      let finalThumbnailUrl = activeSong.thumbnailUrl;

      // Handle PDF replacement if uploaded
      if (newPdfFile) {
        const fileExt = newPdfFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `pdfs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('music-sheets')
          .upload(filePath, newPdfFile, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (uploadError) {
          console.error('Upload Error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('music-sheets')
          .getPublicUrl(filePath);

        try {
          finalThumbnailUrl = await generatePdfThumbnail(newPdfFile);
        } catch (err) {
          console.error('Thumbnail generation error:', err);
        }

        const updatedVersionPdfs = { ...parsed.versionPdfs };
        const vKey = formData.versionName || selectedVersion;
        updatedVersionPdfs[vKey] = publicUrl;

        const updatedVersionKeys = { ...parsed.versionKeys };
        if (formData.keyName) {
          updatedVersionKeys[vKey] = formData.keyName;
        }

        finalPdfUrl = serializeSongPdfs(
          updatedVersionPdfs,
          updatedVersionKeys,
          publicUrl
        );
      } else {
        const oldV = selectedVersion;
        const newV = formData.versionName;
        const newK = formData.keyName;

        const updatedVersionPdfs = { ...parsed.versionPdfs };
        const updatedVersionKeys = { ...parsed.versionKeys };

        if (oldV !== newV) {
          if (updatedVersionPdfs[oldV]) {
            updatedVersionPdfs[newV] = updatedVersionPdfs[oldV];
            delete updatedVersionPdfs[oldV];
          }
          if (updatedVersionKeys[oldV]) {
            updatedVersionKeys[newV] = newK || updatedVersionKeys[oldV];
            delete updatedVersionKeys[oldV];
          } else if (newK) {
            updatedVersionKeys[newV] = newK;
          }
        } else if (newK) {
          updatedVersionKeys[newV] = newK;
        }

        finalPdfUrl = serializeSongPdfs(
          updatedVersionPdfs,
          updatedVersionKeys,
          parsed.defaultPdf || activeSong.pdfUrl
        );
      }

      // Update versions and keys arrays
      const currentVersions = activeSong.versions || [];
      const updatedVersions = currentVersions.map(v => v === selectedVersion ? formData.versionName : v);
      if (!updatedVersions.includes(formData.versionName)) {
        updatedVersions.push(formData.versionName);
      }

      const currentKeys = activeSong.keys || [];
      const updatedKeys = Array.from(new Set([...currentKeys, formData.keyName]));

      const updates: Partial<Song> = {
        title: formData.title,
        organization: formData.organization,
        category: formData.category,
        versions: updatedVersions,
        keys: updatedKeys,
        lyrics: formData.lyrics,
        pdfUrl: finalPdfUrl,
        thumbnailUrl: finalThumbnailUrl
      };

      await editSong(activeSong.id, updates);
      setIsSaving(false);
      setSaveSuccess(true);
      setSelectedVersion(formData.versionName);
      setSelectedKey(formData.keyName);
      setNewPdfFile(null);
    } catch (err) {
      console.error('Error saving song edits:', err);
      setIsSaving(false);
      alert('Error updating song: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const getKeysForVersion = (version: string) => {
    if (!activeSong) return [];
    const mappedKey = parsed.versionKeys[version];
    if (mappedKey) return [mappedKey];
    return activeSong.keys && activeSong.keys.length > 0 ? activeSong.keys : ['C'];
  };

  return (
    <div className="space-y-6">
      {/* Step Navigator Header */}
      <div className="bg-surface-container/50 border border-outline-variant/15 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-sm font-medium">
          <button 
            onClick={() => setStep(1)}
            className={`px-3 py-1.5 rounded-xl transition-all ${step === 1 ? 'bg-primary text-on-primary font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'}`}
          >
            1. {t('editSong.step1')}
          </button>
          <ChevronRight className="w-4 h-4 text-outline-variant" />
          <button 
            disabled={!selectedVersion}
            onClick={() => setStep(2)}
            className={`px-3 py-1.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${step === 2 ? 'bg-primary text-on-primary font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'}`}
          >
            2. {t('editSong.step2')} {selectedVersion && `(${selectedVersion})`}
          </button>
          <ChevronRight className="w-4 h-4 text-outline-variant" />
          <button 
            disabled={!selectedVersion || !selectedKey}
            onClick={() => setStep(3)}
            className={`px-3 py-1.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${step === 3 ? 'bg-primary text-on-primary font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'}`}
          >
            3. {t('editSong.step3')} {selectedKey && `(${selectedKey})`}
          </button>
        </div>

        {activeSong && (
          <div className="flex items-center space-x-2 text-xs text-on-surface-variant font-mono bg-surface px-3 py-1.5 rounded-xl border border-outline-variant/15">
            <span className="font-sans font-medium text-on-surface">{activeSong.title}</span>
            {selectedVersion && <span>&bull; v: {selectedVersion}</span>}
            {selectedKey && <span>&bull; key: {selectedKey}</span>}
          </div>
        )}
      </div>

      {/* Confirmation Modal overlay for deletions */}
      {confirmDelete && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-red-600">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div className="text-sm">
              <span className="font-bold">
                {confirmDelete.type === 'song' && t('editSong.confirmDeleteSong')}
                {confirmDelete.type === 'version' && `${t('editSong.confirmDeleteVersion')} "${confirmDelete.target}"?`}
                {confirmDelete.type === 'allKeys' && t('editSong.confirmDeleteAllKeys')}
                {confirmDelete.type === 'key' && `${t('editSong.confirmDeleteKey')} "${confirmDelete.target}"?`}
              </span>
              <p className="text-xs text-red-700/80">{t('editSong.confirmDeleteWarning')}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setConfirmDelete(null)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium border border-outline-variant/20 hover:bg-surface transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={() => {
                if (confirmDelete.type === 'song') handleDeleteEntireSong();
                if (confirmDelete.type === 'version' && confirmDelete.target) handleDeleteVersion(confirmDelete.target);
                if (confirmDelete.type === 'allKeys') handleDeleteAllKeys();
                if (confirmDelete.type === 'key' && confirmDelete.target) handleDeleteKey(confirmDelete.target);
              }}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
            >
              {t('admin.delete')}
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: Search & Song / Version Management */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Search bar for quick selection */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-outline-variant" />
            <input
              type="text"
              value={songSearchQuery}
              onChange={e => setSongSearchQuery(e.target.value)}
              placeholder={t('admin.searchSongPlaceholder')}
              className="w-full bg-surface pl-11 pr-4 py-3 rounded-2xl border border-outline-variant/20 focus:border-primary focus:outline-none text-sm text-on-surface shadow-sm"
            />
          </div>

          {/* Quick song selector pills if searching */}
          {songSearchQuery.trim() && (
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 bg-surface-container/30 rounded-xl border border-outline-variant/15">
              {filteredSongs.length === 0 ? (
                <div className="p-3 text-xs text-on-surface-variant">{t('home.empty')}</div>
              ) : (
                filteredSongs.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedSongId(s.id);
                      setSongSearchQuery('');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-all ${
                      s.id === selectedSongId 
                        ? 'bg-primary text-on-primary border-primary font-bold shadow-sm' 
                        : 'bg-surface border-outline-variant/20 text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span>{s.title}</span>
                    <span className="text-[10px] opacity-75 font-mono">({s.versions?.length || 0} v)</span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Selected Song Card */}
          {activeSong ? (
            <div className="p-6 border border-outline-variant/20 rounded-3xl bg-surface space-y-6 shadow-ambient">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/15">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-on-surface">{activeSong.title}</h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-container font-normal text-on-surface-variant">
                      {activeSong.category}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    {activeSong.organization || 'No organization'}
                  </p>
                </div>

                {/* Delete Entire Song Button */}
                <button
                  onClick={() => setConfirmDelete({ type: 'song' })}
                  className="px-4 py-2 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-xl text-xs font-bold transition-colors flex items-center self-start sm:self-center shrink-0 shadow-sm"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  <span>{t('editSong.deleteEntireSong')}</span>
                </button>
              </div>

              {/* Versions List */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-on-surface">
                  {t('editSong.step1Desc')}
                </h4>

                {(!activeSong.versions || activeSong.versions.length === 0) ? (
                  <div className="p-6 text-center text-xs text-on-surface-variant border border-dashed border-outline-variant/30 rounded-2xl">
                    No versions listed for this song.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeSong.versions.map((ver) => {
                      const verKeys = getKeysForVersion(ver);
                      const hasPdf = !!parsed.versionPdfs[ver];

                      return (
                        <div 
                          key={ver}
                          className="p-4 rounded-2xl border border-outline-variant/15 bg-surface-container-low/60 hover:bg-surface-container-low transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-on-surface">{ver}</span>
                              {hasPdf && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium flex items-center">
                                  <FileText className="w-2.5 h-2.5 mr-0.5" /> PDF
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {verKeys.map(k => (
                                <span key={k} className="text-[10px] px-1.5 py-0.2 bg-surface-container rounded font-mono text-on-surface-variant">
                                  {k}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            {/* Delete specific version */}
                            <button
                              onClick={() => setConfirmDelete({ type: 'version', target: ver })}
                              className="p-2 text-red-600 hover:bg-red-500/10 rounded-xl transition-colors"
                              title={`${t('admin.delete')} ${ver}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            {/* Choose version to proceed to Step 2 */}
                            <button
                              onClick={() => {
                                setSelectedVersion(ver);
                                setStep(2);
                              }}
                              className="px-3.5 py-1.5 bg-primary text-on-primary hover:bg-primary-container rounded-xl text-xs font-bold transition-colors flex items-center shadow-sm"
                            >
                              <span>{t('editSong.chooseVersion')}</span>
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
            <div className="text-center py-16 text-on-surface-variant bg-surface rounded-3xl border border-outline-variant/20">
              <Music className="w-10 h-10 mx-auto text-outline-variant mb-2 opacity-50" />
              <p className="text-sm">{t('home.empty')}</p>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Version & Key Management */}
      {step === 2 && (
        <div className="p-6 border border-outline-variant/20 rounded-3xl bg-surface space-y-6 shadow-ambient">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/15">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setStep(1)}
                className="p-2 rounded-xl border border-outline-variant/20 hover:bg-surface-container transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-on-surface" />
              </button>
              <div>
                <h3 className="text-lg font-bold text-on-surface">
                  {activeSong?.title} &bull; <span className="text-primary">{selectedVersion}</span>
                </h3>
                <p className="text-xs text-on-surface-variant">{t('editSong.step2Desc')}</p>
              </div>
            </div>

            {/* Delete all keys for this version */}
            <button
              onClick={() => setConfirmDelete({ type: 'allKeys' })}
              className="px-4 py-2 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-xl text-xs font-bold transition-colors flex items-center self-start sm:self-center shrink-0 shadow-sm"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              <span>{t('editSong.deleteAllKeys')}</span>
            </button>
          </div>

          {/* Keys list */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-on-surface">
              {t('editSong.step2')}
            </h4>

            {getKeysForVersion(selectedVersion).length === 0 ? (
              <div className="p-6 text-center text-xs text-on-surface-variant border border-dashed border-outline-variant/30 rounded-2xl">
                No keys found for this version.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {getKeysForVersion(selectedVersion).map((keyVal) => (
                  <div 
                    key={keyVal}
                    className="p-4 rounded-2xl border border-outline-variant/15 bg-surface-container-low/60 hover:bg-surface-container-low transition-all flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-sm">
                        {keyVal}
                      </span>
                      <span className="text-xs font-medium text-on-surface">Key {keyVal}</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {/* Delete specific key */}
                      <button
                        onClick={() => setConfirmDelete({ type: 'key', target: keyVal })}
                        className="p-2 text-red-600 hover:bg-red-500/10 rounded-xl transition-colors"
                        title={`${t('admin.delete')} Key ${keyVal}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Choose key to proceed to Step 3 */}
                      <button
                        onClick={() => {
                          setSelectedKey(keyVal);
                          setStep(3);
                        }}
                        className="px-3.5 py-1.5 bg-primary text-on-primary hover:bg-primary-container rounded-xl text-xs font-bold transition-colors flex items-center shadow-sm"
                      >
                        <span>{t('editSong.chooseKey')}</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: Content Editing & PDF Replacement */}
      {step === 3 && (
        <div className="p-6 sm:p-8 border border-outline-variant/20 rounded-3xl bg-surface space-y-6 shadow-ambient">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/15">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setStep(2)}
                className="p-2 rounded-xl border border-outline-variant/20 hover:bg-surface-container transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-on-surface" />
              </button>
              <div>
                <h3 className="text-lg font-bold text-on-surface">
                  {formData.title} &bull; <span className="text-primary">{selectedVersion}</span> (Key: {selectedKey})
                </h3>
                <p className="text-xs text-on-surface-variant">{t('editSong.step3Desc')}</p>
              </div>
            </div>

            {saveSuccess && (
              <div className="flex items-center space-x-1.5 text-xs text-green-700 bg-green-500/10 px-3 py-1.5 rounded-xl border border-green-500/20">
                <Check className="w-4 h-4" />
                <span className="font-bold">{t('editSong.saveSuccess')}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Section A: Replace PDF Sheet */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-on-surface flex items-center">
                <Upload className="w-4 h-4 mr-2 text-primary" />
                {t('editSong.replacePdf')}
              </h4>

              <div className="p-5 border-2 border-dashed border-outline-variant/30 hover:border-primary/50 rounded-2xl bg-surface-container/30 transition-all text-center space-y-3">
                <input
                  type="file"
                  id="pdfReplaceInput"
                  accept="application/pdf"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setNewPdfFile(e.target.files[0]);
                      setSaveSuccess(false);
                    }
                  }}
                  className="hidden"
                />
                <label 
                  htmlFor="pdfReplaceInput"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2 py-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-primary">
                    {newPdfFile ? newPdfFile.name : t('editSong.uploadNewPdf')}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    {t('publisher.pdfHelp')}
                  </span>
                </label>

                {newPdfFile && (
                  <div className="flex items-center justify-center space-x-2 text-xs text-green-600 bg-green-50 p-2 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>File ready to replace: {newPdfFile.name}</span>
                  </div>
                )}
              </div>

              {/* Existing PDF info */}
              {activeSong && parsed.versionPdfs[selectedVersion] && (
                <div className="text-xs text-on-surface-variant flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/15">
                  <div className="flex items-center space-x-2 truncate">
                    <FileText className="w-4 h-4 text-outline-variant shrink-0" />
                    <span className="truncate">Current Sheet: {selectedVersion}</span>
                  </div>
                  <a 
                    href={parsed.versionPdfs[selectedVersion]} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-primary hover:underline font-bold text-xs shrink-0 ml-2"
                  >
                    View
                  </a>
                </div>
              )}
            </div>

            {/* Section B: Fix Text & Metadata */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-on-surface flex items-center">
                <FileText className="w-4 h-4 mr-2 text-primary" />
                {t('editSong.fixText')}
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('editSong.songTitle')}</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-surface-container/40 border border-outline-variant/20 rounded-xl px-3.5 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('editSong.organization')}</label>
                    <input
                      type="text"
                      value={formData.organization}
                      onChange={e => setFormData({ ...formData, organization: e.target.value })}
                      className="w-full bg-surface-container/40 border border-outline-variant/20 rounded-xl px-3.5 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('editSong.category')}</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-surface-container/40 border border-outline-variant/20 rounded-xl px-3.5 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                    >
                      <option value="Worship">Worship</option>
                      <option value="Praise">Praise</option>
                      <option value="Hymn">Hymn</option>
                      <option value="Contemporary">Contemporary</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('editSong.versionName')}</label>
                    <input
                      type="text"
                      value={formData.versionName}
                      onChange={e => setFormData({ ...formData, versionName: e.target.value })}
                      className="w-full bg-surface-container/40 border border-outline-variant/20 rounded-xl px-3.5 py-2 text-sm text-on-surface focus:outline-none focus:border-primary font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('editSong.keyName')}</label>
                    <select
                      value={formData.keyName}
                      onChange={e => setFormData({ ...formData, keyName: e.target.value })}
                      className="w-full bg-surface-container/40 border border-outline-variant/20 rounded-xl px-3.5 py-2 text-sm text-on-surface focus:outline-none focus:border-primary font-mono"
                    >
                      {PREDEFINED_KEYS.map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">{t('editSong.lyrics')}</label>
                  <textarea
                    rows={4}
                    value={formData.lyrics}
                    onChange={e => setFormData({ ...formData, lyrics: e.target.value })}
                    className="w-full bg-surface-container/40 border border-outline-variant/20 rounded-xl p-3 text-xs text-on-surface focus:outline-none focus:border-primary font-sans"
                    placeholder="Enter song lyrics..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-outline-variant/15 flex items-center justify-between gap-4">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Back to Keys</span>
            </button>

            <button
              disabled={isSaving}
              onClick={handleSaveEdit}
              className="px-7 py-2.5 bg-primary text-on-primary rounded-full text-xs font-bold hover:bg-primary-container transition-all shadow-ambient flex items-center disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>{t('editSong.saving')}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1.5" />
                  <span>{t('editSong.saveChanges')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
