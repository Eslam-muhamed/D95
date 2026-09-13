import * as THREE from 'three';

export class Controller {
    public group: THREE.Group;
    public rotationPivot: THREE.Group;

    private materials: THREE.Material[] = [];
    public leftStick: THREE.Mesh;
    public rightStick: THREE.Mesh;
    public lightbarMesh: THREE.Mesh;

    public isHeld: boolean = false;
    public gameplayJitter: number = 0;

    constructor() {
        this.group = new THREE.Group();
        this.rotationPivot = new THREE.Group();
        this.group.add(this.rotationPivot);

        // 1. DualSense Styling Materials
        const whiteShellMat = new THREE.MeshStandardMaterial({
            color: 0xf3f4f8,
            roughness: 0.35,
            metalness: 0.1,
        });

        const darkShellMat = new THREE.MeshStandardMaterial({
            color: 0x161418,
            roughness: 0.5,
            metalness: 0.2,
        });

        const buttonMat = new THREE.MeshStandardMaterial({
            color: 0x221f24,
            roughness: 0.3,
            metalness: 0.3,
        });

        const lightbarMat = new THREE.MeshBasicMaterial({
            color: 0x00f0ff, // PlayStation Signature Cyan Lightbar
        });

        const stickMat = new THREE.MeshStandardMaterial({
            color: 0x1f1d22,
            roughness: 0.6,
            metalness: 0.1,
        });

        this.materials.push(whiteShellMat, darkShellMat, buttonMat, lightbarMat, stickMat);

        // 2. Controller Central Body
        const bodyGeo = new THREE.BoxGeometry(0.18, 0.045, 0.11);
        const bodyMesh = new THREE.Mesh(bodyGeo, whiteShellMat);
        bodyMesh.castShadow = true;
        this.rotationPivot.add(bodyMesh);

        // Dark underside accent
        const underGeo = new THREE.BoxGeometry(0.16, 0.02, 0.09);
        const underMesh = new THREE.Mesh(underGeo, darkShellMat);
        underMesh.position.y = -0.025;
        this.rotationPivot.add(underMesh);

        // 3. Ergonomic Handgrips (Left & Right)
        const gripGeo = new THREE.CylinderGeometry(0.028, 0.034, 0.16, 16);

        const leftGrip = new THREE.Mesh(gripGeo, whiteShellMat);
        leftGrip.position.set(-0.11, -0.05, 0.035);
        leftGrip.rotation.set(0.35, 0, 0.42);
        leftGrip.castShadow = true;
        this.rotationPivot.add(leftGrip);

        const rightGrip = new THREE.Mesh(gripGeo, whiteShellMat);
        rightGrip.position.set(0.11, -0.05, 0.035);
        rightGrip.rotation.set(0.35, 0, -0.42);
        rightGrip.castShadow = true;
        this.rotationPivot.add(rightGrip);

        // 4. Central Touchpad & Glowing Lightbar
        const padGeo = new THREE.BoxGeometry(0.08, 0.008, 0.045);
        const padMesh = new THREE.Mesh(padGeo, darkShellMat);
        padMesh.position.set(0, 0.025, -0.01);
        this.rotationPivot.add(padMesh);

        // Glowing Lightbar border
        const lightbarGeo = new THREE.BoxGeometry(0.086, 0.006, 0.006);
        this.lightbarMesh = new THREE.Mesh(lightbarGeo, lightbarMat);
        this.lightbarMesh.position.set(0, 0.028, 0.015);
        this.rotationPivot.add(this.lightbarMesh);

        // 5. Dual Analog Thumbsticks
        const stickGeo = new THREE.CylinderGeometry(0.018, 0.014, 0.025, 16);

        this.leftStick = new THREE.Mesh(stickGeo, stickMat);
        this.leftStick.position.set(-0.045, 0.032, 0.022);
        this.rotationPivot.add(this.leftStick);

        this.rightStick = new THREE.Mesh(stickGeo, stickMat);
        this.rightStick.position.set(0.045, 0.032, 0.022);
        this.rotationPivot.add(this.rightStick);

        // 6. D-Pad & Face Buttons
        // Left D-Pad Cross
        const dpadGeo = new THREE.BoxGeometry(0.032, 0.01, 0.032);
        const dpadMesh = new THREE.Mesh(dpadGeo, buttonMat);
        dpadMesh.position.set(-0.065, 0.028, -0.015);
        this.rotationPivot.add(dpadMesh);

        // Right Face Buttons
        const buttonClusterGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.01, 12);
        const btnOffsets = [
            [0, -0.012],
            [0, 0.012],
            [-0.012, 0],
            [0.012, 0],
        ];
        btnOffsets.forEach(([bx, bz]) => {
            const btn = new THREE.Mesh(buttonClusterGeo, buttonMat);
            btn.position.set(0.065 + bx, 0.028, -0.015 + bz);
            this.rotationPivot.add(btn);
        });

        // Initial off-screen spawn position (approaching from high distance)
        this.group.position.set(2.8, 3.4, 2.8);
        this.rotationPivot.rotation.set(-0.6, 1.2, 0.8);
        this.group.scale.set(1, 1, 1);
    }

    public update(elapsed: number): void {
        if (this.isHeld) {
            // Thumbstick twitching and controller micro-sway
            const p = this.gameplayJitter;
            if (p > 0.001) {
                const t = elapsed * 12;
                this.leftStick.rotation.x = Math.sin(t * 1.5) * 0.25 * p;
                this.leftStick.rotation.z = Math.cos(t * 2.1) * 0.25 * p;

                this.rightStick.rotation.x = Math.cos(t * 1.8) * 0.25 * p;
                this.rightStick.rotation.z = Math.sin(t * 2.4) * 0.25 * p;

                // Subtle controller angle micro-wobble in character's hands
                this.rotationPivot.rotation.z = Math.sin(t * 0.8) * 0.04 * p;
                this.rotationPivot.rotation.x = Math.cos(t * 0.9) * 0.03 * p;
            }
        }
    }

    public setOpacity(opacity: number): void {
        this.materials.forEach((mat) => {
            mat.transparent = true;
            mat.opacity = opacity;
        });
    }
}
