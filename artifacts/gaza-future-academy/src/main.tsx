import { setBaseUrl } from "../../lib/api-client-react";
setBaseUrl('https://gaza-future-academy-api-server-8juedfqei.vercel.app');
import { createRoot } from 'react-dom/client';

import App from './App';

import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
