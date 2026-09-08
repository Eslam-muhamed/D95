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

