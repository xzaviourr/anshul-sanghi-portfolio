import { useEffect, useState, type FormEvent } from 'react';
import { gifs, gifUrl } from './content.js';
import { isWish, type Wish } from './types.ts';
import './wishboard.css';
import './wishboard-admin.css';

export default function WishboardAdmin() {
  const [password, setPassword] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const busy = loading || deletingId !== null;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Manage Kirti’s corner | Anshul';
    return () => { document.title = previousTitle; };
  }, []);

  function lock() {
    setPassword('');
    setAccessKey('');
    setWishes([]);
    setCursor(null);
    setConfirmId(null);
    setNotice('');
    setError('');
  }

  async function request(key: string, query = '', method = 'GET'): Promise<unknown> {
    const response = await fetch(`/api/wish-admin${query}`, {
      method,
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    if (response.status === 401) lock();
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new Error('The management API could not be reached. Please try again.');
    }
    if (!response.ok) {
      const message = data && typeof data === 'object' && 'error' in data ? data.error : null;
      throw new Error(typeof message === 'string' ? message : 'The request could not be completed. Please try again.');
    }
    return data;
  }

  async function loadNotes(key: string, append = false) {
    if (busy) return;
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const data = await request(key, append && cursor ? `?cursor=${encodeURIComponent(cursor)}` : '');
      if (!data || typeof data !== 'object' || !('wishes' in data) || !Array.isArray(data.wishes)
        || !data.wishes.every(isWish) || !('cursor' in data)
        || !(data.cursor === null || (typeof data.cursor === 'string' && data.cursor.length > 0))) {
        throw new Error('The server returned an unexpected list of notes. Please try again.');
      }
      const incoming: Wish[] = data.wishes;
      setWishes(current => {
        const merged = append
          ? [...current, ...incoming.filter(wish => !current.some(existing => existing.id === wish.id))]
          : incoming;
        return [...merged].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      });
      setCursor(data.cursor);
      setAccessKey(key);
      setPassword('');
      setConfirmId(null);
    } catch (failure: unknown) {
      setError(failure instanceof Error ? failure.message : 'Notes could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadNotes(password);
  }

  async function deleteNote(id: string) {
    if (busy) return;
    setDeletingId(id);
    setError('');
    setNotice('');
    try {
      const data = await request(accessKey, `?id=${encodeURIComponent(id)}`, 'DELETE');
      if (!data || typeof data !== 'object' || !('deletedId' in data) || data.deletedId !== id) {
        throw new Error('Deletion could not be confirmed. Please retry.');
      }
      setWishes(current => current.filter(wish => wish.id !== id));
      setConfirmId(null);
      setNotice('The note and any attached photo have been deleted.');
    } catch (failure: unknown) {
      setError(failure instanceof Error ? failure.message : 'Deletion could not be confirmed. Please retry.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="wb-page">
      <main className="wb-admin">
        <header className="wb-admin-heading">
          <div>
            <p className="wb-eyebrow">JUST FOR ANSHUL</p>
            <h1>Manage Kirti’s notes</h1>
            <p>Review the notes in Kirti’s corner. This management page is not linked from her page.</p>
          </div>
          {accessKey && <button className="wb-secondary" type="button" disabled={busy} onClick={lock}>Lock page</button>}
        </header>
        {!accessKey && <form className="wb-admin-login" onSubmit={unlock}>
          <label htmlFor="wb-admin-password">Admin password</label>
          <input id="wb-admin-password" type="password" autoComplete="current-password" maxLength={256} required value={password} onChange={event => setPassword(event.target.value)} disabled={loading} />
          <p>Only you can manage notes. The password stays in memory and is cleared when you lock or reload this page.</p>
          <button className="wb-primary" type="submit" disabled={loading}>{loading ? 'Unlocking...' : 'Unlock notes'}</button>
        </form>}
        {error && <p className="wb-form-error" role="alert">{error}</p>}
        <p className="wb-admin-notice" role="status">{notice}</p>
        {accessKey && <>
          <div className="wb-admin-toolbar">
            <p>Deletion is permanent and also removes any photo stored with the note.</p>
            <button className="wb-secondary" type="button" disabled={busy} onClick={() => void loadNotes(accessKey)}>Reload list</button>
          </div>
          {!wishes.length && <p className="wb-admin-empty">{cursor ? 'No notes in this batch. Load more to continue.' : 'No notes to manage yet.'}</p>}
          <ul className="wb-admin-list">
            {wishes.map(wish => {
              const gif = gifs.find(item => item.id === wish.gifId);
              return <li key={wish.id} className="wb-admin-note">
                <div className="wb-admin-note-heading">
                  <h2>{wish.name}</h2>
                  <time dateTime={wish.createdAt}>{new Date(wish.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</time>
                </div>
                <p className="wb-admin-message">{wish.message}</p>
                {wish.imageUrl && <a className="wb-admin-photo-link" href={wish.imageUrl} target="_blank" rel="noreferrer">View attached photo</a>}
                {gif && <img className="wb-admin-gif" src={gifUrl(gif.id)} alt={gif.label} loading="lazy" referrerPolicy="no-referrer" />}
                {confirmId === wish.id ? <div className="wb-admin-confirm" role="group" aria-label={`Confirm deleting note from ${wish.name}`}>
                  <p>Delete this note{wish.imageUrl ? ' and its photo' : ''}? This cannot be undone.</p>
                  <button className="wb-admin-delete" type="button" disabled={busy} onClick={() => void deleteNote(wish.id)}>{deletingId === wish.id ? 'Deleting...' : 'Delete permanently'}</button>
                  <button className="wb-secondary" type="button" disabled={busy} onClick={() => setConfirmId(null)}>Cancel</button>
                </div> : <button className="wb-admin-delete" type="button" disabled={busy} onClick={() => { setConfirmId(wish.id); setError(''); setNotice(''); }} aria-label={`Delete note from ${wish.name}`}>Delete note</button>}
              </li>;
            })}
          </ul>
          {cursor && <button className="wb-secondary wb-admin-more" type="button" disabled={busy} onClick={() => void loadNotes(accessKey, true)}>{loading ? 'Loading...' : 'Load more notes'}</button>}
        </>}
      </main>
    </div>
  );
}
