import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './quiet-drafting-desk.css';
import './restore-writing-alignment.css';
import './quiet-drafting-desk-final.css';
import './align-desk-context.css';
import './quiet-drafting-desk-layout.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
