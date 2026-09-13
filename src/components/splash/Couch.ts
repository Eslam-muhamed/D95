import * as THREE from 'three';

export class Couch {
    public group: THREE.Group;
    public rotationPivot: THREE.Group;

    private materials: THREE.Material[] = [];
    public seatMesh: THREE.Mesh;
    public backrestMesh: THREE.Mesh;
    public leftArmMesh: THREE.Mesh;
    public rightArmMesh: THREE.Mesh;

    constructor() {
        this.group = new THREE.Group();
        this.rotationPivot = new THREE.Group();
        this.group.add(this.rotationPivot);

        // Materials
        const leatherMat = new THREE.MeshStandardMaterial({
            color: 0x151316,
            roughness: 0.55,
            metalness: 0.2,
        });

        const cushionMat = new THREE.MeshStandardMaterial({
            color: 0x1b181d,
            roughness: 0.65,
            metalness: 0.15,
        });

        const legMat = new THREE.MeshStandardMaterial({
            color: 0x221f24,
            roughness: 0.3,
            metalness: 0.85,
        });

        const accentMat = new THREE.MeshStandardMaterial({
            color: 0xe5252a,
            roughness: 0.3,
            metalness: 0.5,
            emissive: 0x44080b,
            emissiveIntensity: 0.3,
        });

        this.materials.push(leatherMat, cushionMat, legMat, accentMat);

        // 1. Seat Base & Cushion
        const baseGeo = new THREE.BoxGeometry(0.96, 0.16, 0.88);
        const baseMesh = new THREE.Mesh(baseGeo, leatherMat);
        baseMesh.position.y = 0.22;
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        this.rotationPivot.add(baseMesh);

        const seatGeo = new THREE.BoxGeometry(0.88, 0.14, 0.80);
        this.seatMesh = new THREE.Mesh(seatGeo, cushionMat);
        this.seatMesh.position.set(0, 0.36, 0.02);
        this.seatMesh.castShadow = true;
        this.rotationPivot.add(this.seatMesh);

        // 2. Ergonomic Backrest (Angled slightly)
        const backGeo = new THREE.BoxGeometry(0.88, 0.58, 0.18);
        this.backrestMesh = new THREE.Mesh(backGeo, cushionMat);
        this.backrestMesh.position.set(0, 0.64, -0.36);
        this.backrestMesh.rotation.x = -0.12;
        this.backrestMesh.castShadow = true;
        this.rotationPivot.add(this.backrestMesh);

        // Crimson Accent Trim along Backrest
        const trimGeo = new THREE.BoxGeometry(0.88, 0.02, 0.02);
        const trimMesh = new THREE.Mesh(trimGeo, accentMat);
        trimMesh.position.set(0, 0.92, -0.42);
        this.rotationPivot.add(trimMesh);

        // 3. Side Armrests
        const armGeo = new THREE.BoxGeometry(0.14, 0.36, 0.84);

        this.leftArmMesh = new THREE.Mesh(armGeo, leatherMat);
        this.leftArmMesh.position.set(-0.48, 0.44, 0);
        this.leftArmMesh.castShadow = true;
        this.rotationPivot.add(this.leftArmMesh);

        this.rightArmMesh = new THREE.Mesh(armGeo, leatherMat);
        this.rightArmMesh.position.set(0.48, 0.44, 0);
        this.rightArmMesh.castShadow = true;
        this.rotationPivot.add(this.rightArmMesh);

        // 4. Modern Minimalist Metal Legs
        const legGeo = new THREE.CylinderGeometry(0.025, 0.018, 0.16, 12);
        const legPositions: [number, number, number][] = [
            [-0.42, 0.08, 0.35],
            [0.42, 0.08, 0.35],
            [-0.42, 0.08, -0.35],
            [0.42, 0.08, -0.35],
        ];

        legPositions.forEach(([x, y, z]) => {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(x, y, z);
            leg.castShadow = true;
            this.rotationPivot.add(leg);
        });

        // Position under character sitting position
        this.group.position.set(0, 0, -0.15);

        // Initially hidden below floor / ready to emerge in Scene 3
        this.group.position.y = -1.2;
        this.setOpacity(0);
    }

    public setOpacity(opacity: number): void {
        this.materials.forEach((mat) => {
            mat.transparent = true;
            mat.opacity = opacity;
        });
    }
}
