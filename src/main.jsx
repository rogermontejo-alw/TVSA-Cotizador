import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // Importación corregida con la extensión explícita .jsx

// El archivo index.css ya no es necesario porque usamos el CDN de Tailwind

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App /> {/* Llamada al componente renombrado */}
  </React.StrictMode>,
)