import gsap from 'gsap';
import * as THREE from 'three';
import { CameraRig } from './CameraRig';
import { Lighting } from './Lighting';
import { Character } from './Character';
import { JuiceCup } from './JuiceCup';
import { Couch } from './Couch';
import { Controller } from './Controller';
import { GamingScreen } from './GamingScreen';
import { TimelineTimings } from './types';

export const SPLASH_TIMINGS: TimelineTimings = {
    scene1_characterIntro: 1.4,
    scene2_juiceArrival: 1.6,
    scene3_orbitAndCouch: 1.8,
    scene4_juiceDissolve: 1.0,
    scene5_controllerThrow: 1.3,
    scene6_screenReveal: 1.4,
    scene7_gamerPose: 1.6,
    scene8_sceneFadeOut: 1.0,
    scene9_logoReveal: 1.4,
};

export interface SceneObjects {
    cameraRig: CameraRig;
    lighting: Lighting;
    character: Character;
    juiceCup: JuiceCup;
    couch: Couch;
    controller: Controller;
    gamingScreen: GamingScreen;
}

export function createCinematicTimeline(
    objects: SceneObjects,
    callbacks: {
        on3DComplete?: () => void;
        onProgress?: (progress: number, sceneIndex: number) => void;
    }
): gsap.core.Timeline {
    const { cameraRig, lighting, character, juiceCup, couch, controller, gamingScreen } = objects;

    const tl = gsap.timeline({
        paused: true,
        onUpdate: () => {
            const totalProgress = tl.progress();
            // Determine current scene index 1..8
            const time = tl.time();
            let sceneIndex = 1;
            let cumTime = 0;

            const sceneDurations = [
                SPLASH_TIMINGS.scene1_characterIntro,
                SPLASH_TIMINGS.scene2_juiceArrival,
                SPLASH_TIMINGS.scene3_orbitAndCouch,
                SPLASH_TIMINGS.scene4_juiceDissolve,
                SPLASH_TIMINGS.scene5_controllerThrow,
                SPLASH_TIMINGS.scene6_screenReveal,
                SPLASH_TIMINGS.scene7_gamerPose,
                SPLASH_TIMINGS.scene8_sceneFadeOut,
            ];

            for (let i = 0; i < sceneDurations.length; i++) {
                cumTime += sceneDurations[i];
                if (time <= cumTime) {
                    sceneIndex = i + 1;
                    break;
                }
            }

            callbacks.onProgress?.(totalProgress, sceneIndex);
        },
        onComplete: () => {
            callbacks.on3DComplete?.();
        },
    });

    // ----------------------------------------------------
    // SCENE 1: CHARACTER INTRODUCTION (0.0s -> 1.4s)
    // ----------------------------------------------------
    tl.to(
        cameraRig.camera.position,
        {
            y: 1.35,
            z: cameraRig.orbitRadius,
            duration: SPLASH_TIMINGS.scene1_characterIntro,
            ease: 'sine.out',
        },
        0
    );

    // ----------------------------------------------------
    // SCENE 2: JUICE CUP FLIGHT & CATCH (1.4s -> 3.0s)
    // ----------------------------------------------------
    const s2Start = SPLASH_TIMINGS.scene1_characterIntro;
    const s2Dur = SPLASH_TIMINGS.scene2_juiceArrival;

    // Cup swoops in along curved arc towards character's right hand
    tl.to(
        juiceCup.group.position,
        {
            x: 0.32,
            y: 1.05,
            z: 0.26,
            duration: s2Dur,
            ease: 'power2.out',
        },
        s2Start
    );

    // Natural rotation during flight
    tl.to(
        juiceCup.group.rotation,
        {
            x: 0,
            y: 0.1,
            z: -0.05,
            duration: s2Dur,
            ease: 'power2.out',
        },
        s2Start
    );

    // Character raises arm to receive cup
    tl.to(
        character,
        {
            cupReachProgress: 1,
            duration: s2Dur * 0.75,
            delay: s2Dur * 0.25,
            ease: 'back.out(1.2)',
        },
        s2Start
    );

    // Subtle camera tracking adjustment
    tl.to(
        cameraRig.target,
        {
            x: 0.08,
            y: 1.15,
            z: 0,
            duration: s2Dur,
            ease: 'power1.inOut',
        },
        s2Start
    );

    // ----------------------------------------------------
    // SCENE 3: 360-DEGREE CAMERA ROTATION + COUCH REVEAL + SITTING (3.0s -> 4.8s)
    // ----------------------------------------------------
    const s3Start = s2Start + s2Dur;
    const s3Dur = SPLASH_TIMINGS.scene3_orbitAndCouch;

    // Switch camera to orbit mode at start of Scene 3
    tl.call(() => {
        cameraRig.useOrbitMode = true;
        cameraRig.orbitAngle = 0;
    }, [], s3Start);

    // Orbit 360 degrees (0 -> 2 * PI)
    tl.to(
        cameraRig,
        {
            orbitAngle: Math.PI * 2,
            duration: s3Dur,
            ease: 'power2.inOut',
        },
        s3Start
    );

    // Couch rises beneath character during second half of orbit
    const couchRevealStart = s3Start + s3Dur * 0.45;
    const couchRevealDur = s3Dur * 0.55;

    tl.to(
        couch.group.position,
        {
            y: 0,
            duration: couchRevealDur,
            ease: 'power2.out',
            onStart: () => {
                couch.setOpacity(1);
            },
        },
        couchRevealStart
    );

    // Character transitions from standing to sitting on couch
    tl.to(
        character,
        {
            sitProgress: 1,
            duration: couchRevealDur,
            ease: 'power2.inOut',
        },
        couchRevealStart
    );

    // Keep juice cup attached/synced to character's hand while sitting
    tl.to(
        juiceCup.group.position,
        {
            y: 0.72,
            z: 0.18,
            duration: couchRevealDur,
            ease: 'power2.inOut',
        },
        couchRevealStart
    );

    // ----------------------------------------------------
    // SCENE 4: SITTING & JUICE CUP DISSOLVE (4.8s -> 5.8s)
    // ----------------------------------------------------
    const s4Start = s3Start + s3Dur;
    const s4Dur = SPLASH_TIMINGS.scene4_juiceDissolve;

    // Switch off orbit mode and anchor camera position
    tl.call(() => {
        cameraRig.useOrbitMode = false;
        cameraRig.camera.position.set(0, 1.25, cameraRig.orbitRadius * 0.88);
        cameraRig.target.set(0, 0.85, 0);
    }, [], s4Start);

    // Juice cup dissolves smoothly (scale, float, opacity)
    tl.to(
        juiceCup,
        {
            dissolveProgress: 1,
            duration: s4Dur * 0.75,
            ease: 'power1.in',
        },
        s4Start + 0.15
    );

    // Character lowers hand back naturally
    tl.to(
        character,
        {
            cupReachProgress: 0,
            duration: s4Dur * 0.7,
            ease: 'power2.out',
        },
        s4Start + 0.3
    );

    // ----------------------------------------------------
    // SCENE 5: PLAYSTATION CONTROLLER FLIGHT & CATCH (5.8s -> 7.1s)
    // ----------------------------------------------------
    const s5Start = s4Start + s4Dur;
    const s5Dur = SPLASH_TIMINGS.scene5_controllerThrow;

    // Character prepares both hands to catch controller
    tl.to(
        character,
        {
            controllerCatchProgress: 1,
            duration: s5Dur * 0.7,
            ease: 'back.out(1.1)',
        },
        s5Start + 0.15
    );

    // Controller flies into hands along parabolic trajectory with physical tumble
    tl.to(
        controller.group.position,
        {
            x: 0,
            y: 0.74,
            z: 0.18,
            duration: s5Dur,
            ease: 'power2.out',
        },
        s5Start
    );

    tl.to(
        controller.rotationPivot.rotation,
        {
            x: 0.1,
            y: 0,
            z: 0,
            duration: s5Dur,
            ease: 'back.out(1.4)', // tactile landing settle
            onComplete: () => {
                controller.isHeld = true;
            },
        },
        s5Start
    );

    // ----------------------------------------------------
    // SCENE 6: 180-DEGREE ROTATION & GAMING SCREEN REVEAL (7.1s -> 8.5s)
    // ----------------------------------------------------
    const s6Start = s5Start + s5Dur;
    const s6Dur = SPLASH_TIMINGS.scene6_screenReveal;

    // Character, Couch, and Controller rotate 180 degrees
    tl.to(
        character.group.rotation,
        {
            y: Math.PI,
            duration: s6Dur,
            ease: 'power2.inOut',
        },
        s6Start
    );

    tl.to(
        couch.rotationPivot.rotation,
        {
            y: Math.PI,
            duration: s6Dur,
            ease: 'power2.inOut',
        },
        s6Start
    );

    // Controller rotates with character
    tl.to(
        controller.group.position,
        {
            x: 0,
            z: -0.18,
            duration: s6Dur,
            ease: 'power2.inOut',
        },
        s6Start
    );

    tl.to(
        controller.group.rotation,
        {
            y: Math.PI,
            duration: s6Dur,
            ease: 'power2.inOut',
        },
        s6Start
    );

    // Camera transitions dynamically to an over-the-shoulder / 3/4 cinematic angle
    tl.to(
        cameraRig.camera.position,
        {
            x: 1.6,
            y: 1.45,
            z: -2.3,
            duration: s6Dur,
            ease: 'power2.inOut',
        },
        s6Start
    );

    tl.to(
        cameraRig.target,
        {
            x: 0,
            y: 1.25,
            z: 1.8, // Looking forward past the character towards the screen
            duration: s6Dur,
            ease: 'power2.inOut',
        },
        s6Start
    );

    // Gaming Screen is revealed smoothly in front of the character
    tl.to(
        gamingScreen.group.position,
        {
            y: 0,
            duration: s6Dur,
            ease: 'power2.out',
            onStart: () => {
                gamingScreen.setOpacity(1);
            },
        },
        s6Start + 0.15
    );

    // Screen light turns on and illuminates the character
    tl.to(
        lighting.screenGlowLight,
        {
            intensity: 2.8,
            duration: s6Dur * 0.8,
            ease: 'power1.in',
        },
        s6Start + 0.3
    );

    // ----------------------------------------------------
    // SCENE 7: FOCUSED GAMER POSE & ACTIVE GAMEPLAY (8.5s -> 10.1s)
    // ----------------------------------------------------
    const s7Start = s6Start + s6Dur;
    const s7Dur = SPLASH_TIMINGS.scene7_gamerPose;

    // Gamer leans upper body forward towards screen
    tl.to(
        character,
        {
            gamerLeanProgress: 1,
            gameplayJitter: 1,
            duration: s7Dur * 0.5,
            ease: 'power2.out',
        },
        s7Start
    );

    // Active controller micro-jitter
    tl.to(
        controller,
        {
            gameplayJitter: 1,
            duration: s7Dur * 0.5,
            ease: 'power1.out',
        },
        s7Start
    );

    // Subtle cinematic camera drift
    tl.to(
        cameraRig.camera.position,
        {
            x: 1.4,
            y: 1.4,
            z: -2.1,
            duration: s7Dur,
            ease: 'sine.inOut',
        },
        s7Start
    );

    // ----------------------------------------------------
    // SCENE 8: SCENE FADE OUT TO PURE DARK (10.1s -> 11.1s)
    // ----------------------------------------------------
    const s8Start = s7Start + s7Dur;
    const s8Dur = SPLASH_TIMINGS.scene8_sceneFadeOut;

    // Fade all 3D objects to 0 opacity
    const fadeObj = { opacity: 1 };
    tl.to(
        fadeObj,
        {
            opacity: 0,
            duration: s8Dur,
            ease: 'power2.inOut',
            onUpdate: () => {
                character.setOpacity(fadeObj.opacity);
                couch.setOpacity(fadeObj.opacity);
                controller.setOpacity(fadeObj.opacity);
                gamingScreen.setOpacity(fadeObj.opacity);
            },
        },
        s8Start
    );

    // Fade lights
    tl.to(
        [lighting.ambientLight, lighting.keyLight, lighting.rimLight, lighting.fillLight, lighting.screenGlowLight],
        {
            intensity: 0,
            duration: s8Dur,
            ease: 'power2.inOut',
        },
        s8Start
    );

    return tl;
}
