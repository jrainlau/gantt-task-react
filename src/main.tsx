import React from 'react';
import ReactDOM from 'react-dom/client';
import { Simple } from '../example/simple'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Simple />
  </React.StrictMode>
);