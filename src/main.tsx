import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

const Wishboard = lazy(() => import('./wishboard/Wishboard.tsx'));
const WishboardAdmin = lazy(() => import('./wishboard/WishboardAdmin.tsx'));
const legacyRoute = /^\/wishboard(?:(\/manage)\/?|\/|\.html)?$/.exec(window.location.pathname);
if (legacyRoute) {
  window.history.replaceState(window.history.state, '', `/kirti${legacyRoute[1] ?? ''}${window.location.search}${window.location.hash}`);
}
const isWishboard = /^\/kirti(?:\/|\.html)?$/.test(window.location.pathname);
const isWishboardAdmin = /^\/kirti\/manage\/?$/.test(window.location.pathname);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isWishboard || isWishboardAdmin ? (
      <Suspense fallback={<div role="status" style={{ padding: '3rem', textAlign: 'center' }}>Opening Kirti’s little corner...</div>}>
        {isWishboardAdmin ? <WishboardAdmin /> : <Wishboard />}
      </Suspense>
    ) : <App />}
  </StrictMode>,
);