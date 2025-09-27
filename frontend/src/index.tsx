import React from 'react';
import { createRoot } from 'react-dom/client';
import AppSimple from './AppSimple';
// import './styles.css';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <AppSimple />
  </React.StrictMode>
);
