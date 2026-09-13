import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { CameraRig } from './CameraRig';
import { Lighting } from './Lighting';
import { Character } from './Character';
import { JuiceCup } from './JuiceCup';
import { Couch } from './Couch';
import { Controller } from './Controller';
import { GamingScreen } from './GamingScreen';
import { createCinematicTimeline } from './animationTimeline';
import { SplashSceneCallbacks } from './types';

interface SplashSceneProps extends SplashSceneCallbacks {
    onSceneFallback?: () => void;
}

export default function SplashScene({
    onSceneReady,
    onSceneProgress,
    on3DComplete,
    onSceneFallback,
}: SplashSceneProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const timelineRef = useRef<gsap.core.Timeline | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // 1. WebGL Support Verification
        const checkWebGL = () => {
            try {
                const testCanvas = document.createElement('canvas');
                return !!(
                    window.WebGLRenderingContext &&
                    (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl'))
                );
            } catch {
                return false;
            }
        };

        if (!checkWebGL()) {
            console.warn('[D95 Splash] WebGL unsupported, falling back to 2D intro');
            onSceneFallback?.();
            return;
        }

        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;
        const aspect = width / height;

        // 2. Three.js Scene Setup
        const scene = new THREE.Scene();

        // 3. Camera Rig
        const cameraRig = new CameraRig(aspect);

        // 4. WebGL Renderer
        let renderer: THREE.WebGLRenderer;
        try {
            renderer = new THREE.WebGLRenderer({
                powerPreference: 'high-performance',
                antialias: true,
                alpha: true,
            });
        } catch {
            onSceneFallback?.();
            return;
        }

        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        container.appendChild(renderer.domElement);

        // 5. Instantiate Scene Objects & Lighting
        const lighting = new Lighting(scene);
        const character = new Character();
        const juiceCup = new JuiceCup();
        const couch = new Couch();
        const controller = new Controller();
        const gamingScreen = new GamingScreen();

        scene.add(character.group);
        scene.add(juiceCup.group);
        scene.add(couch.group);
        scene.add(controller.group);
        scene.add(gamingScreen.group);

        // 6. Build Cinematic GSAP Timeline
        let gamingActive = false;
        const timeline = createCinematicTimeline(
            {
                cameraRig,
                lighting,
                character,
                juiceCup,
                couch,
                controller,
                gamingScreen,
            },
            {
                onProgress: (prog, sceneIdx) => {
                    gamingActive = sceneIdx >= 6 && sceneIdx <= 7;
                    onSceneProgress?.(prog, sceneIdx);
                },
                on3DComplete: () => {
                    on3DComplete?.();
                },
            }
        );
        timelineRef.current = timeline;

        // 7. Render Loop
        let animationFrameId: number;
        const clock = new THREE.Clock();

        const render = () => {
            const elapsed = clock.getElapsedTime();

            cameraRig.update();
            lighting.update(elapsed, gamingActive);
            character.update(elapsed);
            juiceCup.update(elapsed);
            controller.update(elapsed);
            gamingScreen.update(elapsed);

            renderer.render(scene, cameraRig.camera);
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        // 8. Start GSAP timeline & notify ready
        timeline.play();
        onSceneReady?.();

        // 9. Resize Handling
        const handleResize = () => {
            if (!container) return;
            const w = container.clientWidth || window.innerWidth;
            const h = container.clientHeight || window.innerHeight;
            const newAspect = w / h;

            cameraRig.updateAspect(newAspect);
            renderer.setSize(w, h);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        };

        window.addEventListener('resize', handleResize);

        // 10. Cleanup on unmount
        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);

            if (timelineRef.current) {
                timelineRef.current.kill();
                timelineRef.current = null;
            }

            // Dispose Three.js resources
            scene.traverse((obj) => {
                if (obj instanceof THREE.Mesh) {
                    obj.geometry?.dispose();
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach((m) => m.dispose());
                    } else {
                        obj.material?.dispose();
                    }
                }
            });

            if (renderer.domElement.parentElement) {
                renderer.domElement.parentElement.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [on3DComplete, onSceneFallback, onSceneProgress, onSceneReady]);

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden"
            style={{ touchAction: 'none' }}
        />
    );
}
