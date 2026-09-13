export interface SplashSceneCallbacks {
    onSceneReady?: () => void;
    onSceneProgress?: (progress: number, sceneIndex: number) => void;
    on3DComplete?: () => void;
    onComplete?: () => void;
}

export interface CameraWaypoint {
    position: [number, number, number];
    target: [number, number, number];
    fov?: number;
}

export interface TimelineTimings {
    scene1_characterIntro: number; // 0.0s - 1.5s
    scene2_juiceArrival: number;   // 1.5s - 3.2s
    scene3_orbitAndCouch: number;  // 3.2s - 5.0s
    scene4_juiceDissolve: number;  // 5.0s - 6.0s
    scene5_controllerThrow: number;// 6.0s - 7.3s
    scene6_screenReveal: number;   // 7.3s - 8.8s
    scene7_gamerPose: number;      // 8.8s - 10.3s
    scene8_sceneFadeOut: number;   // 10.3s - 11.2s
    scene9_logoReveal: number;     // 11.2s - 12.4s
}

export interface DeviceProfile {
    isMobile: boolean;
    isTablet: boolean;
    aspectRatio: number;
    dpr: number;
}
