const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminHub.tsx', 'utf8');

// 1. Add currentUser
content = content.replace(
  "const { users, songs, updateUserRole, approveSong, declineSong, deleteSong, editSong } = useStore();",
  "const { currentUser, users, songs, updateUserRole, approveSong, declineSong, deleteSong, editSong } = useStore();"
);

// 2. Replace the actions column
const oldTd = `                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {user.role === 'user' && (
                          <>
                            <button onClick={() => updateUserRole(user.email, 'pastor')} className="text-primary hover:text-primary-container">{t('admin.upgradePastor')}</button>
                            <span className="text-outline-variant">|</span>
                            <button onClick={() => updateUserRole(user.email, 'collaborator')} className="text-primary hover:text-primary-container">{t('admin.upgradeCollaborator')}</button>
                          </>
                        )}
                        {user.role !== 'admin' && (
                          <>
                            <span className="text-outline-variant">|</span>
                            <button onClick={() => updateUserRole(user.email, 'admin')} className="text-primary hover:text-primary-container">{t('admin.upgradeAdmin')}</button>
                          </>
                        )}
                      </td>`;

const newTd = `                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <select
                          className="bg-surface border border-outline-variant/30 rounded-lg px-3 py-1.5 text-on-surface focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          value={user.role}
                          disabled={user.role === 'admin' && currentUser?.email !== 'khiemvinhtran1112@gmail.com'}
                          onChange={(e) => updateUserRole(user.email, e.target.value as any)}
                        >
                          <option value="user">User</option>
                          <option value="pastor">Pastor</option>
                          <option value="collaborator">Collaborator</option>
                          <option value="publisher">Publisher</option>
                          {(currentUser?.email === 'khiemvinhtran1112@gmail.com' || user.role === 'admin') && (
                            <option value="admin">Admin</option>
                          )}
                        </select>
                      </td>`;

content = content.replace(oldTd, newTd);

fs.writeFileSync('src/pages/AdminHub.tsx', content);
