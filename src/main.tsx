import React from 'react';
import ReactDOM from 'react-dom/client';
import { useState } from 'react';
import App from './App';
import SplashScreen from './components/features/SplashScreen';
import './index.css';

function Root() {
    const [splashDone, setSplashDone] = useState(false);
    return (
        <>
            {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
            <App />
        </>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Root />
    </React.StrictMode>
);
