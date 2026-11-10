import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { colors, gifs, gifUrl, IMAGE_TYPES, MAX_MESSAGE, MAX_NAME, MAX_WISHES } from './content.js';
import { preparePhoto } from './images.ts';
import { isWish, type Wish } from './types.ts';
import './wishboard.css';

const isLocalPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).get('demo') === '1';
const sampleWishes: Wish[] = import.meta.env.DEV ? [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Anshul',
    message: 'Kirti, you turn ordinary days into my favourite memories. Here is to more coffee dates, terrible jokes, and little adventures together.\n\nThis little corner is for you. All my love, always.',
    color: 'rose',
    gifId: null,
    imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=700&q=85',
    createdAt: new Date().toISOString(),
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Your cheer squad',
    message: 'Kirti, a little reminder that you make this world a warmer, happier place just by being in it.\n\nKeep chasing the things that light you up. We are always cheering for you!',
    color: 'butter',
    gifId: null,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Riya',
    message: 'Kirti, you are my favourite person to do absolutely nothing with. Never change.',
    color: 'lavender',
    gifId: null,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'A very proud friend',
    message: 'For all the times you showed up, listened without judging, and somehow knew exactly what to say: thank you.\n\nYou deserve the kind of happiness you keep giving everyone else.',
    color: 'mint',
    gifId: 'VbawWIGNtKYwOFXF7U',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    name: 'Kabir',
    message: 'May your coffee always be perfect and your playlist always understand the assignment, Kirti.',
    color: 'butter',
    gifId: null,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    name: 'Meera',
    message: 'Some people feel like sunshine. You feel like sunshine, a warm blanket, and the first bite of your favourite dessert. All at once.',
    color: 'rose',
    gifId: 'gDfteqLchLcRTtjAD7',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: '77777777-7777-4777-8777-777777777777',
    name: 'Your partner in crime',
    message: 'More spontaneous plans.\nMore photos we forget to take.\nMore laughing until our stomachs hurt.\n\nMore of this, please.',
    color: 'mint',
    gifId: null,
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: '88888888-8888-4888-8888-888888888888',
    name: 'Aditi',
    message: 'The world is better with your laugh in it, Kirti.',
    color: 'lavender',
    gifId: null,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: '99999999-9999-4999-8999-999999999999',
    name: 'Arjun',
    message: 'Sending you a whole lot of love and absolutely no sensible advice. You already have everything it takes.',
    color: 'butter',
    gifId: 'R6gvnAxj2ISzJdbA63',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    name: 'Someone in your corner',
    message: 'I hope this next chapter brings you quiet mornings, exciting adventures, the courage to try something new, and people who love you exactly as you are.\n\nYou have so many lovely things ahead of you.',
    color: 'rose',
    gifId: null,
    createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    name: 'Naina',
    message: 'A tiny note for a very big heart. Thank you for being you, Kirti.',
    color: 'lavender',
    gifId: null,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    name: 'All of us',
    message: 'Consider this your permission slip to celebrate the little wins, eat the extra slice of cake, and believe all the nice things people say about you.\n\nYou are so, so loved.',
    color: 'mint',
    gifId: null,
    createdAt: new Date(Date.now() - 11 * 86400000).toISOString(),
  },
] : [];

async function requestWishes(options?: RequestInit): Promise<unknown> {
  const response = await fetch('/api/wishes', options);
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error('Kirti’s page could not be reached. Please try again in a moment.');
  }
  if (!response.ok) {
    const message = data && typeof data === 'object' && 'error' in data ? data.error : null;
    throw new Error(typeof message === 'string' ? message : 'Something went wrong. Please try again.');
  }
  return data;
}

function Envelope() {
  return (
    <div className="wb-envelope" aria-hidden="true">
      <span className="wb-orbit wb-orbit-one">✦</span>
      <span className="wb-orbit wb-orbit-two">♡</span>
      <span className="wb-orbit wb-orbit-three">✧</span>
      <svg viewBox="0 0 280 230">
        <path d="M37 99 137 25a7 7 0 0 1 8 0l100 74v105H37Z" fill="#eaa1aa" />
        <rect x="64" y="46" width="154" height="144" rx="8" fill="#fffdf7" transform="rotate(7 141 118)" />
        <path d="M110 100c-17-25-43 5 0 28 43-23 17-53 0-28Z" fill="#d36a7c" transform="translate(30 -17)" />
        <path d="M103 134h74m-66 12h58" stroke="#e8c9c5" strokeWidth="5" />
        <path d="m37 99 104 73L245 99v105H37Z" fill="#f3bdc2" />
        <path d="m37 204 91-75a21 21 0 0 1 26 0l91 75" fill="#f8cdd0" />
        <path d="m37 99 64 46m144-46-64 46" stroke="#e7a5ae" strokeWidth="1.5" />
        <circle cx="142" cy="170" r="20" fill="#b34f65" />
        <path d="M142 166c-9-13-22 3 0 15 22-12 9-28 0-15Z" fill="#ffe5e6" />
      </svg>
      <span className="wb-envelope-caption">to Kirti, with all my love</span>
    </div>
  );
}

function WishCard({ wish }: { wish: Wish }) {
  const gif = gifs.find(item => item.id === wish.gifId);
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <article className={`wb-note wb-note--${wish.color}`}>
      <span className="wb-tape" aria-hidden="true" />
      <span className="wb-note-heart" aria-hidden="true">♡</span>
      <p className="wb-note-message">{wish.message}</p>
      {wish.imageUrl && (imageFailed
        ? <p className="wb-image-error" role="status">This photo could not be loaded. Please reload the page to try again.</p>
        : <div className="wb-photo-frame"><img className="wb-note-image" src={wish.imageUrl} alt={`A photo from ${wish.name} for Kirti`} loading="lazy" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} /></div>)}
      {gif && <img className="wb-note-gif" src={gifUrl(gif.id)} alt={gif.label} loading="lazy" referrerPolicy="no-referrer" />}
      <footer>
        <time dateTime={wish.createdAt}>{new Date(wish.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time>
        <p className="wb-note-signature"><span aria-hidden="true">— </span>{wish.name}</p>
      </footer>
    </article>
  );
}

export default function Wishboard() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [notice, setNotice] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [color, setColor] = useState('rose');
  const [gifId, setGifId] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');
  const [preparingImage, setPreparingImage] = useState(false);
  const [showGifs, setShowGifs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const submissionId = useRef<string | null>(null);

  useEffect(() => {
    const previousTitle = document.title;
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
    document.title = "Kirti's corner | Anshul";
    return () => { document.title = previousTitle; robots.remove(); };
  }, []);

  useEffect(() => {
    if (isLocalPreview) {
      setWishes(sampleWishes);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setLoadError('');
    requestWishes({ signal: controller.signal })
      .then(data => {
        if (!data || typeof data !== 'object' || !('wishes' in data)
          || !Array.isArray(data.wishes) || !data.wishes.every(isWish)) {
          throw new Error('The board returned an unexpected response. Please try again.');
        }
        setWishes(data.wishes);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : 'Unable to load wishes.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);

  function openComposer(event: React.MouseEvent<HTMLButtonElement>) {
    triggerRef.current = event.currentTarget;
    setSubmitError('');
    dialogRef.current?.showModal();
    nameRef.current?.focus();
  }

  function closeComposer() {
    dialogRef.current?.close();
  }

  async function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file || preparingImage || submitting) return;
    setPreparingImage(true);
    setImageError('');
    setSubmitError('');
    try {
      setImageDataUrl(await preparePhoto(file));
      setGifId(null);
      setShowGifs(false);
      submissionId.current = null;
    } catch (error: unknown) {
      setImageError(error instanceof Error ? error.message : 'Your photo could not be prepared. Please try another image.');
    } finally {
      setPreparingImage(false);
    }
  }

  function removePhoto() {
    setImageDataUrl(null);
    setImageError('');
    setSubmitError('');
    submissionId.current = null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || preparingImage) return;
    if (imageError) {
      setSubmitError('Please choose a valid photo, or continue without a photo.');
      return;
    }
    if (!name.trim() || !message.trim()) {
      setSubmitError('Add your name and a little message before sending.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    submissionId.current ??= crypto.randomUUID();
    try {
      const pendingWish = { id: submissionId.current, name: name.trim(), message: message.trim(), color, gifId };
      let saved: Wish;
      if (isLocalPreview) {
        saved = { ...pendingWish, imageUrl: imageDataUrl, createdAt: new Date().toISOString() };
      } else {
        const data = await requestWishes({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...pendingWish, imageDataUrl }),
        });
        if (!data || typeof data !== 'object' || !('wish' in data) || !isWish(data.wish)) {
          throw new Error('We could not confirm your wish was saved. Please try sending again.');
        }
        saved = data.wish;
      }
      setWishes(current => [saved, ...current.filter(wish => wish.id !== saved.id)].slice(0, MAX_WISHES));
      setName(''); setMessage(''); setGifId(null); setColor('rose'); setShowGifs(false);
      setImageDataUrl(null); setImageError('');
      submissionId.current = null;
      setNotice(isLocalPreview
        ? 'Preview note added locally. It is not saved or shared and will reset on refresh.'
        : 'Your note is here for Kirti. Thank you for making her feel loved!');
      closeComposer();
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : 'Your wish could not be sent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function shareBoard() {
    const url = `${window.location.origin}/kirti${isLocalPreview ? '?demo=1' : ''}`;
    try {
      await navigator.clipboard.writeText(url);
      setNotice(isLocalPreview ? 'Local preview link copied. This is not Kirti’s live page.' : 'Link copied. Invite someone to leave Kirti a note.');
    } catch {
      setNotice(`Copy this link to share the ${isLocalPreview ? 'local preview' : 'board'}: ${url}`);
    }
  }

  return (
    <div className="wb-page">
      <header className="wb-header">
        <a className="wb-brand" href={isLocalPreview ? '/kirti?demo=1' : '/kirti'} aria-label="Kirti’s corner"><span>♡</span> Kirti’s corner<span className="wb-brand-dot">.</span></a>
        <button className="wb-share" onClick={shareBoard}><span aria-hidden="true">↗</span> Share this corner</button>
      </header>

      <main className="wb-main">
        {isLocalPreview && <aside className="wb-preview-notice"><strong>Local preview</strong> · These 12 sample notes are just for trying the design. You can add test notes, too. Nothing is sent to the live page, and reloading the page restores the samples.</aside>}
        <section className="wb-hero" aria-labelledby="wb-title">
          <div className="wb-hero-copy">
            <p className="wb-eyebrow"><span aria-hidden="true">✦</span> A LITTLE SPACE, JUST FOR YOU</p>
            <h1 id="wb-title">Kirti’s<br /><em>corner.</em><span className="wb-title-star" aria-hidden="true">✳</span></h1>
            <p className="wb-hero-description">A little space for you, in my corner of the internet.<br />Notes and memories from your people.</p>
            <button className="wb-primary" onClick={openComposer}><span aria-hidden="true">♡</span> Write to Kirti <span aria-hidden="true">↗</span></button>
            <p className="wb-hero-footnote">No sign-up. Just your words, for Kirti.</p>
          </div>
          <div className="wb-hero-art">
            <aside className="wb-love-letter" aria-label="A little letter from Anshul">
              <span className="wb-letter-label">JUST FOR YOU</span>
              <p>This little corner<br />of my world<br /><em>is yours.</em></p>
              <span className="wb-letter-signature">— Anshul</span>
            </aside>
            <Envelope />
          </div>
        </section>

        <div className="wb-divider"><span /> for all the ways you make life lovelier <span /></div>

        <section className="wb-board" aria-labelledby="wb-board-title">
          <div className="wb-board-heading">
            <div><p className="wb-eyebrow">FROM THE PEOPLE WHO LOVE YOU</p><h2 id="wb-board-title">Little notes for Kirti <span aria-hidden="true">♡</span></h2></div>
          </div>
          <div className="wb-notice" role="status">{notice}</div>
          {loading ? <div className="wb-empty" role="status"><span aria-hidden="true">♡</span><h3>Gathering a little love for Kirti...</h3><p>Her people have some lovely things to say.</p></div>
            : loadError ? <div className="wb-error" role="alert"><h3>This corner needs a moment</h3><p>{loadError}</p><button className="wb-secondary" onClick={() => setRefresh(value => value + 1)}>Try again</button></div>
              : wishes.length ? <div className="wb-notes">{wishes.map(wish => <WishCard key={wish.id} wish={wish} />)}</div>
                : <div className="wb-empty"><span aria-hidden="true">✉</span><h3>Kirti’s first little note starts with you.</h3><p>A memory you share, a reason she makes you smile, or something you wish for her. Leave Kirti a little love.</p><button className="wb-secondary" onClick={openComposer}>Write to Kirti <span aria-hidden="true">↗</span></button></div>}

          {!loading && !loadError && wishes.length > 0 && <button className="wb-add-note" onClick={openComposer}><span aria-hidden="true">+</span> One more little reason to make Kirti smile</button>}
        </section>
        <section className="wb-bottom-note"><span aria-hidden="true">✧</span><p>A little space here,<br /><em>that’s always yours.</em></p><span aria-hidden="true">✧</span></section>
      </main>
      <footer className="wb-footer"><span>A little corner for Kirti, by Anshul.</span><span>Make yourself at home. <span aria-hidden="true">♡</span></span></footer>

      <dialog className="wb-dialog" ref={dialogRef} aria-labelledby="wb-compose-title"
        onCancel={event => { if (submitting) event.preventDefault(); }}
        onKeyDown={event => {
          if (event.key === 'Escape') {
            event.preventDefault();
            if (!submitting) closeComposer();
          }
        }}
        onClose={() => triggerRef.current?.focus()}>
        <div className="wb-compose">
          <button className="wb-close" type="button" onClick={closeComposer} disabled={submitting} aria-label="Close note">×</button>
          <p className="wb-eyebrow">A LITTLE LOVE, JUST FOR KIRTI</p>
          <h2 id="wb-compose-title">Dear <em>Kirti,</em></h2>
          <p className="wb-compose-intro">A favourite memory, an inside joke, or something you’ve always wanted to tell her.</p>
          <form onSubmit={submit}>
            <fieldset disabled={submitting}>
              <label htmlFor="wb-name">Your name <span>so Kirti knows who it’s from</span></label>
              <input ref={nameRef} id="wb-name" name="name" autoComplete="name" placeholder="The name Kirti knows you by" maxLength={MAX_NAME} value={name} onChange={event => { setName(event.target.value); submissionId.current = null; }} required />
              <label htmlFor="wb-message">Your note to Kirti</label>
              <textarea id="wb-message" name="message" rows={5} placeholder="Kirti, one thing I hope you always remember is..." maxLength={MAX_MESSAGE} value={message} onChange={event => { setMessage(event.target.value); submissionId.current = null; }} required />
              <div className="wb-character-count">{message.length}/{MAX_MESSAGE}</div>
              <div className="wb-extras">
                <div className="wb-color-picker" role="group" aria-label="Note colour">{colors.map(item => <button key={item} type="button" className={`wb-swatch wb-swatch--${item}`} aria-label={`${item} note`} aria-pressed={color === item} onClick={() => { setColor(item); submissionId.current = null; }}>{color === item ? '✓' : ''}</button>)}</div>
                <div className="wb-attachment-actions">
                  <button className="wb-image-toggle" type="button" disabled={preparingImage} onClick={() => imageInputRef.current?.click()}>{preparingImage ? 'Preparing photo…' : imageDataUrl ? 'Change photo' : gifId ? 'Use a photo instead' : 'Add a photo'}</button>
                  <button className="wb-gif-toggle" type="button" disabled={preparingImage} onClick={() => setShowGifs(current => !current)} aria-expanded={showGifs} aria-controls="wb-gif-picker">✧ {gifId ? 'Change GIF' : imageDataUrl ? 'Use a GIF instead' : 'Add a GIF'}</button>
                </div>
              </div>
              <input ref={imageInputRef} type="file" accept={IMAGE_TYPES.join(',')} aria-label="Choose a photo" hidden disabled={preparingImage} onChange={selectPhoto} />
              <p className="wb-image-help">Just words are lovely, too. Or add one photo or GIF—not both.</p>
              <p className="wb-image-help">JPG, PNG or WebP, up to 10 MB. We’ll resize your photo for you.</p>
              {imageError && <p className="wb-form-error" role="alert">{imageError} <button className="wb-dismiss-photo" type="button" onClick={removePhoto}>Continue without a photo</button></p>}
              {imageDataUrl && <div className="wb-selected-image"><div className="wb-photo-frame"><img className="wb-note-image" src={imageDataUrl} alt="Photo to include in your note to Kirti" /></div><button type="button" onClick={removePhoto} disabled={preparingImage} aria-label="Remove photo">×</button></div>}
              {showGifs && <div id="wb-gif-picker" className="wb-gif-picker"><p>A tiny bit of extra happiness <span>via GIPHY</span></p><div>{gifs.map(gif => <button key={gif.id} type="button" disabled={preparingImage} aria-label={gif.label} aria-pressed={gif.id === gifId} onClick={() => { removePhoto(); setGifId(gif.id); setShowGifs(false); }}><img src={gifUrl(gif.id)} alt={gif.label} loading="lazy" referrerPolicy="no-referrer" /></button>)}</div></div>}
              {gifId && <div className="wb-selected-gif"><img src={gifUrl(gifId)} alt={gifs.find(gif => gif.id === gifId)?.label} /><button type="button" onClick={() => { setGifId(null); submissionId.current = null; }} aria-label="Remove GIF">×</button></div>}
              <p className="wb-publishing-note">{isLocalPreview
                ? 'This is a local preview. Your test note stays on this page only and is not saved or shared.'
                : 'Your note, name, and any photo will be visible to anyone with this link. Only share photos you have permission to post, and don’t include private information.'}</p>
              {submitError && <p className="wb-form-error" role="alert">{submitError}</p>}
              <button className="wb-primary wb-send" type="submit" disabled={preparingImage}>{submitting ? 'Sending your love…' : preparingImage ? 'Preparing your photo…' : 'Send a little love to Kirti'} <span aria-hidden="true">♡</span></button>
            </fieldset>
          </form>
        </div>
      </dialog>
    </div>
  );
}
