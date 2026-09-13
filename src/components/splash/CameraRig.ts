import * as THREE from 'three';

export class CameraRig {
    public camera: THREE.PerspectiveCamera;
    public target: THREE.Vector3;
    private baseFov: number = 42;
    private mobileFovMultiplier: number = 1.25;

    // Orbit parameters for cinematic circular sweeps
    public orbitRadius: number = 5.2;
    public orbitAngle: number = 0; // in radians
    public orbitHeight: number = 1.35;
    public orbitCenter: THREE.Vector3 = new THREE.Vector3(0, 1.05, 0);
    public useOrbitMode: boolean = false;

    constructor(aspect: number) {
        this.camera = new THREE.PerspectiveCamera(this.baseFov, aspect, 0.1, 100);
        this.target = new THREE.Vector3(0, 1.1, 0);

        // Initial establishing distance
        this.updateAspect(aspect);
        this.camera.position.set(0, 1.4, 5.2);
        this.camera.lookAt(this.target);
    }

    public updateAspect(aspect: number): void {
        this.camera.aspect = aspect;
        if (aspect < 1.0) {
            // Mobile portrait: increase FOV and pull back slightly
            this.camera.fov = this.baseFov * this.mobileFovMultiplier;
            this.orbitRadius = 6.4;
        } else if (aspect < 1.3) {
            // Tablet: slight FOV boost
            this.camera.fov = this.baseFov * 1.1;
            this.orbitRadius = 5.6;
        } else {
            // Desktop widescreen
            this.camera.fov = this.baseFov;
            this.orbitRadius = 5.0;
        }
        this.camera.updateProjectionMatrix();
    }

    public update(): void {
        if (this.useOrbitMode) {
            this.camera.position.x = this.orbitCenter.x + Math.sin(this.orbitAngle) * this.orbitRadius;
            this.camera.position.z = this.orbitCenter.z + Math.cos(this.orbitAngle) * this.orbitRadius;
            this.camera.position.y = this.orbitCenter.y + this.orbitHeight;
        }
        this.camera.lookAt(this.target);
    }
}
