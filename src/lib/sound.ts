let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

export function playCartChime(): void {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        const playNote = (freq: number, startTime: number, duration: number) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.18, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.start(startTime);
            osc.stop(startTime + duration);
        };

        playNote(880, now, 0.15);
        playNote(1100, now + 0.08, 0.15);
        playNote(1320, now + 0.16, 0.20);
    } catch {
        // Silently fail if audio not available
    }
}

/**
 * Plays an authentic, cinematic PlayStation 5 startup & game boot sound effect.
 * Features:
 * 1. Low sub-bass ignition pulse (console powering on rumble)
 * 2. Signature sparkling crystalline chime cascade (ascending ethereal notes)
 * 3. Warm sweeping resonant synth chord pad (cosmic horizon filter sweep)
 */
export function playPs5StartupSound(): void {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        // Master output gain
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.9, now);
        masterGain.connect(ctx.destination);

        // 1. SUB-BASS BOOT PULSE (Deep console power ignition)
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(85, now);
        subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.6);

        subGain.gain.setValueAtTime(0, now);
        subGain.gain.linearRampToValueAtTime(0.28, now + 0.04);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

        subOsc.connect(subGain);
        subGain.connect(masterGain);
        subOsc.start(now);
        subOsc.stop(now + 1.7);

        // 2. CRYSTALLINE CHIME CASCADE (High-definition PS5 crystal sparkle)
        const chimeNotes = [
            { freq: 880.0, time: 0.00, dur: 1.1, gain: 0.15 },   // A5
            { freq: 1108.73, time: 0.04, dur: 1.2, gain: 0.18 }, // C#6
            { freq: 1318.51, time: 0.08, dur: 1.3, gain: 0.22 }, // E6
            { freq: 1760.00, time: 0.13, dur: 1.4, gain: 0.24 }, // A6 (Signature PS confirmation)
            { freq: 2217.46, time: 0.18, dur: 1.2, gain: 0.16 }, // C#7
            { freq: 2637.02, time: 0.24, dur: 1.6, gain: 0.18 }, // E7 (High shimmer)
            { freq: 3520.00, time: 0.30, dur: 1.0, gain: 0.08 }, // A7 (Sparkle overtone)
        ];

        chimeNotes.forEach((n) => {
            const osc = ctx.createOscillator();
            const noteGain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(n.freq, now + n.time);

            noteGain.gain.setValueAtTime(0, now + n.time);
            noteGain.gain.linearRampToValueAtTime(n.gain, now + n.time + 0.012);
            noteGain.gain.exponentialRampToValueAtTime(0.0001, now + n.time + n.dur);

            osc.connect(noteGain);
            noteGain.connect(masterGain);

            osc.start(now + n.time);
            osc.stop(now + n.time + n.dur);
        });

        // 3. WARM ETHEREAL SYNTH SWELL (Resonant cosmic sweep pad)
        const padFilter = ctx.createBiquadFilter();
        padFilter.type = 'lowpass';
        padFilter.Q.setValueAtTime(2.6, now);
        padFilter.frequency.setValueAtTime(170, now);
        padFilter.frequency.exponentialRampToValueAtTime(2700, now + 0.38); // Soaring opening sweep
        padFilter.frequency.exponentialRampToValueAtTime(360, now + 2.1);   // Smooth decay

        const padGain = ctx.createGain();
        padGain.gain.setValueAtTime(0, now);
        padGain.gain.linearRampToValueAtTime(0.2, now + 0.22);
        padGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

        padFilter.connect(padGain);
        padGain.connect(masterGain);

        // Chord frequencies: A-Major (A2, E3, A3, C#4, E4)
        const chordFrequencies = [110.0, 164.81, 220.0, 277.18, 329.63];
        chordFrequencies.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            osc.detune.setValueAtTime((idx - 2) * 5, now); // Detune for rich chorus

            osc.connect(padFilter);
            osc.start(now);
            osc.stop(now + 2.3);
        });
    } catch {
        // Silently fail if audio not supported
    }
}

/**
 * Plays an authentic, cozy Café entrance sound:
 * 1. Realistic ceramic coffee cups / porcelain saucers clinking together (crisp high-frequency clinks).
 * 2. Subtle, warm acoustic café welcoming resonance (warm jazz-café harmonic chord).
 * 3. Soft barista steam whisper transient.
 */
export function playCafeEntranceSound(): void {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.85, now);
        masterGain.connect(ctx.destination);

        // --- 1. CERAMIC CUP CLINK 1 (Crisp porcelain tap) ---
        const clink1Osc = ctx.createOscillator();
        const clink1Over = ctx.createOscillator();
        const clink1Gain = ctx.createGain();

        clink1Osc.type = 'sine';
        clink1Osc.frequency.setValueAtTime(2180, now); // Porcelain fundamental
        clink1Osc.frequency.exponentialRampToValueAtTime(2050, now + 0.35);

        clink1Over.type = 'triangle';
        clink1Over.frequency.setValueAtTime(4720, now); // Ceramic inharmonic overtone

        clink1Gain.gain.setValueAtTime(0, now);
        clink1Gain.gain.linearRampToValueAtTime(0.35, now + 0.002); // Instant tap transient
        clink1Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        clink1Osc.connect(clink1Gain);
        clink1Over.connect(clink1Gain);
        clink1Gain.connect(masterGain);

        clink1Osc.start(now);
        clink1Over.start(now);
        clink1Osc.stop(now + 0.45);
        clink1Over.stop(now + 0.45);

        // --- 2. CERAMIC CUP CLINK 2 (Second cup meeting the first at +0.10s) ---
        const t2 = now + 0.10;
        const clink2Osc = ctx.createOscillator();
        const clink2Over = ctx.createOscillator();
        const clink2Gain = ctx.createGain();

        clink2Osc.type = 'sine';
        clink2Osc.frequency.setValueAtTime(2540, t2); // Higher second cup rim
        clink2Osc.frequency.exponentialRampToValueAtTime(2420, t2 + 0.4);

        clink2Over.type = 'triangle';
        clink2Over.frequency.setValueAtTime(5380, t2);

        clink2Gain.gain.setValueAtTime(0, t2);
        clink2Gain.gain.linearRampToValueAtTime(0.38, t2 + 0.002);
        clink2Gain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.5);

        clink2Osc.connect(clink2Gain);
        clink2Over.connect(clink2Gain);
        clink2Gain.connect(masterGain);

        clink2Osc.start(t2);
        clink2Over.start(t2);
        clink2Osc.stop(t2 + 0.5);
        clink2Over.stop(t2 + 0.5);

        // --- 3. SAUCER SETTLE CLINK (Subtle porcelain ring at +0.22s) ---
        const t3 = now + 0.22;
        const saucerOsc = ctx.createOscillator();
        const saucerGain = ctx.createGain();

        saucerOsc.type = 'sine';
        saucerOsc.frequency.setValueAtTime(1760, t3);
        saucerOsc.frequency.exponentialRampToValueAtTime(1720, t3 + 0.6);

        saucerGain.gain.setValueAtTime(0, t3);
        saucerGain.gain.linearRampToValueAtTime(0.22, t3 + 0.003);
        saucerGain.gain.exponentialRampToValueAtTime(0.0008, t3 + 0.65);

        saucerOsc.connect(saucerGain);
        saucerGain.connect(masterGain);

        saucerOsc.start(t3);
        saucerOsc.stop(t3 + 0.7);

        // --- 4. SOFT STEAM / ESPRESSO TRANSIENT (Filtered noise puff) ---
        const bufferSize = Math.floor(ctx.sampleRate * 0.25);
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(3200, now);
        noiseFilter.Q.setValueAtTime(3.0, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(0.06, now + 0.03);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

        whiteNoise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);

        whiteNoise.start(now);
        whiteNoise.stop(now + 0.25);

        // --- 5. WARM CAFÉ WELCOME CHIME (Cozy vibraphone harmonic resonance) ---
        const warmNotes = [
            { freq: 523.25, time: 0.04, dur: 1.1, gain: 0.12 }, // C5
            { freq: 659.25, time: 0.08, dur: 1.2, gain: 0.14 }, // E5
            { freq: 783.99, time: 0.14, dur: 1.3, gain: 0.15 }, // G5
            { freq: 987.77, time: 0.20, dur: 1.4, gain: 0.12 }, // B5
        ];

        warmNotes.forEach((n) => {
            const osc = ctx.createOscillator();
            const noteGain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(n.freq, now + n.time);

            noteGain.gain.setValueAtTime(0, now + n.time);
            noteGain.gain.linearRampToValueAtTime(n.gain, now + n.time + 0.02);
            noteGain.gain.exponentialRampToValueAtTime(0.0001, now + n.time + n.dur);

            osc.connect(noteGain);
            noteGain.connect(masterGain);

            osc.start(now + n.time);
            osc.stop(now + n.time + n.dur);
        });
    } catch {
        // Silently fail if audio not supported
    }
}

let lastNavTime = 0;
let consecutiveNavIndex = 0;

/**
 * Plays the authentic, tactile PlayStation 5 UI game navigation sound
 * (the crisp, glassy shimmer-tick when browsing game cards on the PS5 dashboard).
 * Features:
 * 1. Ultra-fast high-frequency glassy transient (mechanical haptic click)
 * 2. Signature Sony PS5 melodic acoustic harmonic body note with fluid pentatonic pitch shift
 * 3. Warm acoustic sub-tick giving DualSense controller tactile punch
 */
export function playPs5NavigateSound(slotIndex?: number): void {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        // Reset or step consecutive counter for dynamic musical browsing across slots
        if (now - lastNavTime < 0.7) {
            consecutiveNavIndex = (consecutiveNavIndex + 1) % 7;
        } else {
            consecutiveNavIndex = 0;
        }
        lastNavTime = now;

        // PS5 signature crystalline navigation scale (Pentatonic A-Major: A5, B5, C#6, E6, F#6, A6, B6)
        const scale = [880.0, 987.77, 1108.73, 1318.51, 1479.98, 1760.0, 1975.53];
        const baseFreq = slotIndex !== undefined
            ? scale[Math.abs(slotIndex) % scale.length]
            : scale[consecutiveNavIndex];

        // Master gain
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.55, now);
        masterGain.connect(ctx.destination);

        // 1. HIGH-FREQUENCY HAPTIC GLASS CLICK (Instant controller tick)
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = 'triangle';
        clickOsc.frequency.setValueAtTime(3200, now);
        clickOsc.frequency.exponentialRampToValueAtTime(1200, now + 0.016);

        clickGain.gain.setValueAtTime(0, now);
        clickGain.gain.linearRampToValueAtTime(0.4, now + 0.001);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.026);

        clickOsc.connect(clickGain);
        clickGain.connect(masterGain);
        clickOsc.start(now);
        clickOsc.stop(now + 0.03);

        // 2. SIGNATURE PS5 MELODIC BODY CHIME (Glassy resonant harmonic)
        const bodyOsc = ctx.createOscillator();
        const bodyGain = ctx.createGain();
        bodyOsc.type = 'sine';
        bodyOsc.frequency.setValueAtTime(baseFreq, now);

        bodyGain.gain.setValueAtTime(0, now);
        bodyGain.gain.linearRampToValueAtTime(0.32, now + 0.003);
        bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.095);

        bodyOsc.connect(bodyGain);
        bodyGain.connect(masterGain);
        bodyOsc.start(now);
        bodyOsc.stop(now + 0.1);

        // 3. WARM ACOUSTIC SUB-TICK (DualSense haptic actuator punch)
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(220, now);
        subOsc.frequency.exponentialRampToValueAtTime(75, now + 0.032);

        subGain.gain.setValueAtTime(0, now);
        subGain.gain.linearRampToValueAtTime(0.24, now + 0.002);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.036);

        subOsc.connect(subGain);
        subGain.connect(masterGain);
        subOsc.start(now);
        subOsc.stop(now + 0.04);

        // 4. MICRO AIR-SWIPE TRANSIENT (Flicking through game tiles on PS5 ribbon)
        const bufferSize = Math.floor(ctx.sampleRate * 0.032);
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        const swipeNoise = ctx.createBufferSource();
        swipeNoise.buffer = noiseBuffer;

        const swipeFilter = ctx.createBiquadFilter();
        swipeFilter.type = 'bandpass';
        swipeFilter.frequency.setValueAtTime(5200, now);
        swipeFilter.frequency.exponentialRampToValueAtTime(1600, now + 0.028);
        swipeFilter.Q.setValueAtTime(2.2, now);

        const swipeGain = ctx.createGain();
        swipeGain.gain.setValueAtTime(0, now);
        swipeGain.gain.linearRampToValueAtTime(0.14, now + 0.002);
        swipeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

        swipeNoise.connect(swipeFilter);
        swipeFilter.connect(swipeGain);
        swipeGain.connect(masterGain);

        swipeNoise.start(now);
        swipeNoise.stop(now + 0.032);
    } catch {
        // Silently fail if audio not supported
    }
}

/**
 * Plays the signature PS5 "Confirm / Select (X)" chime
 * Ascending crisp dual-tone confirmation chime.
 */
export function playPs5SelectSound(): void {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.55, now);
        masterGain.connect(ctx.destination);

        const playChime = (freq: number, startDelay: number, dur: number, vol: number) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + startDelay);

            g.gain.setValueAtTime(0, now + startDelay);
            g.gain.linearRampToValueAtTime(vol, now + startDelay + 0.002);
            g.gain.exponentialRampToValueAtTime(0.0001, now + startDelay + dur);

            osc.connect(g);
            g.connect(masterGain);
            osc.start(now + startDelay);
            osc.stop(now + startDelay + dur);
        };

        // Note 1: E6 (1318.51 Hz) -> Note 2: A6 (1760.00 Hz)
        playChime(1318.51, 0.00, 0.08, 0.28);
        playChime(1760.00, 0.032, 0.16, 0.35);
    } catch {
        // Silently fail if audio not supported
    }
}


