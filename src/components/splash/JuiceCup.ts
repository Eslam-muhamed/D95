import * as THREE from 'three';

export class JuiceCup {
    public group: THREE.Group;
    public cupMesh: THREE.Mesh;
    public juiceMesh: THREE.Mesh;
    public lidMesh: THREE.Mesh;
    public strawGroup: THREE.Group;

    private materials: THREE.Material[] = [];
    public dissolveProgress: number = 0; // 0 = fully visible, 1 = dissolved

    constructor() {
        this.group = new THREE.Group();

        // 1. Transparent Cup Body Material
        const cupMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            roughness: 0.1,
            metalness: 0.1,
            transmission: 0.8,
            transparent: true,
            opacity: 0.65,
            ior: 1.45,
        });

        // 2. Liquid Material (Signature D95 Iced Ruby Beverage)
        const juiceMat = new THREE.MeshStandardMaterial({
            color: 0x991b1b,
            roughness: 0.2,
            metalness: 0.15,
            transparent: true,
            opacity: 0.85,
        });

        // 3. Frosted Lid Material
        const lidMat = new THREE.MeshStandardMaterial({
            color: 0xf3f4f6,
            roughness: 0.35,
            metalness: 0.05,
            transparent: true,
            opacity: 0.8,
        });

        // 4. Accent Straw Material (Translucent Red)
        const strawMat = new THREE.MeshStandardMaterial({
            color: 0xef4444,
            roughness: 0.25,
            metalness: 0.2,
            transparent: true,
            opacity: 0.9,
        });

        this.materials.push(cupMat, juiceMat, lidMat, strawMat);

        // Cup Body (Tapered Cylinder)
        const cupGeo = new THREE.CylinderGeometry(0.065, 0.048, 0.22, 24);
        this.cupMesh = new THREE.Mesh(cupGeo, cupMat);
        this.cupMesh.position.y = 0.11;
        this.cupMesh.castShadow = true;
        this.group.add(this.cupMesh);

        // Liquid inside
        const juiceGeo = new THREE.CylinderGeometry(0.061, 0.046, 0.17, 24);
        this.juiceMesh = new THREE.Mesh(juiceGeo, juiceMat);
        this.juiceMesh.position.y = 0.09;
        this.group.add(this.juiceMesh);

        // Snap-fit Lid
        const lidGeo = new THREE.CylinderGeometry(0.068, 0.068, 0.02, 24);
        this.lidMesh = new THREE.Mesh(lidGeo, lidMat);
        this.lidMesh.position.y = 0.22;
        this.lidMesh.castShadow = true;
        this.group.add(this.lidMesh);

        // Straw (Angled drinking straw)
        this.strawGroup = new THREE.Group();
        this.strawGroup.position.set(0.02, 0.22, 0);

        // Lower straight section
        const strawLower = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.22, 12), strawMat);
        strawLower.position.y = 0.02;
        this.strawGroup.add(strawLower);

        // Upper angled bent section
        const strawUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.09, 12), strawMat);
        strawUpper.position.set(0.025, 0.15, 0);
        strawUpper.rotation.z = -0.45;
        this.strawGroup.add(strawUpper);

        this.group.add(this.strawGroup);

        // Initial off-screen spawn position (Far right / top / background)
        this.group.position.set(3.8, 2.6, -1.2);
        this.group.rotation.set(0.2, 0.4, 0.3);
        this.group.scale.set(1, 1, 1);
    }

    public update(elapsed: number): void {
        // Floating drink idle motion
        if (this.dissolveProgress > 0) {
            const p = this.dissolveProgress;
            // Subtle upward dissipation + scale shrink + opacity drop
            this.group.position.y += 0.003 * p;
            const currentScale = Math.max(0.001, 1 - p * 0.95);
            this.group.scale.set(currentScale, currentScale, currentScale);

            this.materials.forEach((mat) => {
                mat.opacity = (1 - p);
            });
        }
    }

    public setOpacity(opacity: number): void {
        this.materials.forEach((mat) => {
            mat.opacity = opacity;
        });
    }
}
