import * as THREE from 'three';

export class Character {
    public group: THREE.Group;

    // Hierarchy nodes
    public pelvis: THREE.Group;
    public spine: THREE.Group;
    public chest: THREE.Group;
    public head: THREE.Group;
    public headsetGroup: THREE.Group;

    // Arms
    public leftShoulder: THREE.Group;
    public leftElbow: THREE.Group;
    public leftHand: THREE.Group;

    public rightShoulder: THREE.Group;
    public rightElbow: THREE.Group;
    public rightHand: THREE.Group;

    // Legs
    public leftHip: THREE.Group;
    public leftKnee: THREE.Group;
    public rightHip: THREE.Group;
    public rightKnee: THREE.Group;

    // Materials (for opacity control)
    private materials: THREE.Material[] = [];

    // Animation progress values (for GSAP binding)
    public sitProgress: number = 0;
    public cupReachProgress: number = 0;
    public controllerCatchProgress: number = 0;
    public gamerLeanProgress: number = 0;
    public gameplayJitter: number = 0;

    constructor() {
        this.group = new THREE.Group();

        // High-end PBR materials
        const darkSkinMat = new THREE.MeshStandardMaterial({
            color: 0x1f1a1d,
            roughness: 0.65,
            metalness: 0.1,
        });
        const jacketMat = new THREE.MeshStandardMaterial({
            color: 0x161418,
            roughness: 0.5,
            metalness: 0.25,
        });
        const pantsMat = new THREE.MeshStandardMaterial({
            color: 0x0e0d10,
            roughness: 0.7,
            metalness: 0.15,
        });
        const crimsonMat = new THREE.MeshStandardMaterial({
            color: 0xe5252a,
            roughness: 0.35,
            metalness: 0.4,
            emissive: 0x5a090b,
            emissiveIntensity: 0.4,
        });
        const sneakerMat = new THREE.MeshStandardMaterial({
            color: 0x2b2729,
            roughness: 0.4,
            metalness: 0.2,
        });
        const headsetGlowMat = new THREE.MeshBasicMaterial({
            color: 0xff1e38,
        });

        this.materials.push(darkSkinMat, jacketMat, pantsMat, crimsonMat, sneakerMat, headsetGlowMat);

        // 1. Pelvis (Center Root of Movement)
        this.pelvis = new THREE.Group();
        this.pelvis.position.y = 0.96;
        this.group.add(this.pelvis);

        const pelvisMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.16, 16), pantsMat);
        pelvisMesh.castShadow = true;
        this.pelvis.add(pelvisMesh);

        // 2. Spine & Torso
        this.spine = new THREE.Group();
        this.spine.position.y = 0.08;
        this.pelvis.add(this.spine);

        this.chest = new THREE.Group();
        this.chest.position.y = 0.22;
        this.spine.add(this.chest);

        // Stylized Torso / Jacket
        const torsoGeo = new THREE.CylinderGeometry(0.20, 0.16, 0.34, 16);
        const torsoMesh = new THREE.Mesh(torsoGeo, jacketMat);
        torsoMesh.castShadow = true;
        this.chest.add(torsoMesh);

        // Crimson Accent Stripe on Jacket
        const stripeGeo = new THREE.TorusGeometry(0.185, 0.012, 8, 24);
        const stripeMesh = new THREE.Mesh(stripeGeo, crimsonMat);
        stripeMesh.rotation.x = Math.PI / 2;
        stripeMesh.position.y = 0.04;
        this.chest.add(stripeMesh);

        // 3. Neck and Head
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 12), darkSkinMat);
        neck.position.y = 0.22;
        this.chest.add(neck);

        this.head = new THREE.Group();
        this.head.position.y = 0.34;
        this.chest.add(this.head);

        const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 18), darkSkinMat);
        headMesh.scale.set(1.0, 1.15, 1.05);
        headMesh.castShadow = true;
        this.head.add(headMesh);

        // Sleek Gaming Headset
        this.headsetGroup = new THREE.Group();
        const headbandGeo = new THREE.TorusGeometry(0.145, 0.018, 8, 24, Math.PI);
        const headband = new THREE.Mesh(headbandGeo, jacketMat);
        headband.rotation.z = Math.PI;
        headband.position.y = 0.02;
        this.headsetGroup.add(headband);

        // Headset Earcups with Crimson LED Ring
        const earcupGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.04, 16);
        const leftEarcup = new THREE.Mesh(earcupGeo, jacketMat);
        leftEarcup.rotation.z = Math.PI / 2;
        leftEarcup.position.set(-0.135, 0, 0);
        this.headsetGroup.add(leftEarcup);

        const leftGlow = new THREE.Mesh(new THREE.RingGeometry(0.025, 0.045, 16), headsetGlowMat);
        leftGlow.rotation.y = -Math.PI / 2;
        leftGlow.position.set(-0.156, 0, 0);
        this.headsetGroup.add(leftGlow);

        const rightEarcup = new THREE.Mesh(earcupGeo, jacketMat);
        rightEarcup.rotation.z = Math.PI / 2;
        rightEarcup.position.set(0.135, 0, 0);
        this.headsetGroup.add(rightEarcup);

        const rightGlow = new THREE.Mesh(new THREE.RingGeometry(0.025, 0.045, 16), headsetGlowMat);
        rightGlow.rotation.y = Math.PI / 2;
        rightGlow.position.set(0.156, 0, 0);
        this.headsetGroup.add(rightGlow);

        this.head.add(this.headsetGroup);

        // 4. Arms (Left & Right)
        // LEFT ARM
        this.leftShoulder = new THREE.Group();
        this.leftShoulder.position.set(-0.25, 0.12, 0);
        this.chest.add(this.leftShoulder);

        const leftUpperArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.26, 12), jacketMat);
        leftUpperArmMesh.position.y = -0.13;
        leftUpperArmMesh.castShadow = true;
        this.leftShoulder.add(leftUpperArmMesh);

        this.leftElbow = new THREE.Group();
        this.leftElbow.position.y = -0.26;
        this.leftShoulder.add(this.leftElbow);

        const leftForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.24, 12), jacketMat);
        leftForearmMesh.position.y = -0.12;
        leftForearmMesh.castShadow = true;
        this.leftElbow.add(leftForearmMesh);

        this.leftHand = new THREE.Group();
        this.leftHand.position.y = -0.24;
        this.leftElbow.add(this.leftHand);
        const leftHandMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.04), darkSkinMat);
        leftHandMesh.position.y = -0.04;
        this.leftHand.add(leftHandMesh);

        // RIGHT ARM
        this.rightShoulder = new THREE.Group();
        this.rightShoulder.position.set(0.25, 0.12, 0);
        this.chest.add(this.rightShoulder);

        const rightUpperArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.26, 12), jacketMat);
        rightUpperArmMesh.position.y = -0.13;
        rightUpperArmMesh.castShadow = true;
        this.rightShoulder.add(rightUpperArmMesh);

        this.rightElbow = new THREE.Group();
        this.rightElbow.position.y = -0.26;
        this.rightShoulder.add(this.rightElbow);

        const rightForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.24, 12), jacketMat);
        rightForearmMesh.position.y = -0.12;
        rightForearmMesh.castShadow = true;
        this.rightElbow.add(rightForearmMesh);

        this.rightHand = new THREE.Group();
        this.rightHand.position.y = -0.24;
        this.rightElbow.add(this.rightHand);
        const rightHandMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.04), darkSkinMat);
        rightHandMesh.position.y = -0.04;
        this.rightHand.add(rightHandMesh);

        // 5. Legs (Left & Right)
        // LEFT LEG
        this.leftHip = new THREE.Group();
        this.leftHip.position.set(-0.11, -0.06, 0);
        this.pelvis.add(this.leftHip);

        const leftThighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.44, 12), pantsMat);
        leftThighMesh.position.y = -0.22;
        leftThighMesh.castShadow = true;
        this.leftHip.add(leftThighMesh);

        this.leftKnee = new THREE.Group();
        this.leftKnee.position.y = -0.44;
        this.leftHip.add(this.leftKnee);

        const leftShinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.42, 12), pantsMat);
        leftShinMesh.position.y = -0.21;
        leftShinMesh.castShadow = true;
        this.leftKnee.add(leftShinMesh);

        const leftSneaker = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.22), sneakerMat);
        leftSneaker.position.set(0, -0.44, 0.05);
        leftSneaker.castShadow = true;
        this.leftKnee.add(leftSneaker);

        // RIGHT LEG
        this.rightHip = new THREE.Group();
        this.rightHip.position.set(0.11, -0.06, 0);
        this.pelvis.add(this.rightHip);

        const rightThighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.44, 12), pantsMat);
        rightThighMesh.position.y = -0.22;
        rightThighMesh.castShadow = true;
        this.rightHip.add(rightThighMesh);

        this.rightKnee = new THREE.Group();
        this.rightKnee.position.y = -0.44;
        this.rightHip.add(this.rightKnee);

        const rightShinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.42, 12), pantsMat);
        rightShinMesh.position.y = -0.21;
        rightShinMesh.castShadow = true;
        this.rightKnee.add(rightShinMesh);

        const rightSneaker = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.22), sneakerMat);
        rightSneaker.position.set(0, -0.44, 0.05);
        rightSneaker.castShadow = true;
        this.rightKnee.add(rightSneaker);
    }

    public update(elapsed: number): void {
        // Idle breathing & micro-sway
        const breath = Math.sin(elapsed * 2.2) * 0.015;
        this.chest.scale.set(1.0 + breath * 0.5, 1.0 + breath, 1.0 + breath * 0.5);

        // 1. Sitting Pose Interpolation (Driven by sitProgress: 0 -> 1)
        const pSit = this.sitProgress;
        this.pelvis.position.y = 0.96 * (1 - pSit) + 0.52 * pSit;
        this.pelvis.position.z = -0.16 * pSit;

        // Thighs bend forward (-90 deg), shins bend down (+90 deg)
        this.leftHip.rotation.x = -Math.PI / 2 * pSit * 0.95;
        this.rightHip.rotation.x = -Math.PI / 2 * pSit * 0.95;
        this.leftKnee.rotation.x = Math.PI / 2 * pSit * 0.95;
        this.rightKnee.rotation.x = Math.PI / 2 * pSit * 0.95;

        // Spread legs slightly when sitting naturally
        this.leftHip.rotation.z = -0.12 * pSit;
        this.rightHip.rotation.z = 0.12 * pSit;

        // 2. Right Hand Cup Reaching / Holding (Driven by cupReachProgress: 0 -> 1)
        const pCup = this.cupReachProgress;
        if (pCup > 0.001) {
            this.rightShoulder.rotation.x = -0.65 * pCup;
            this.rightShoulder.rotation.z = -0.25 * pCup;
            this.rightElbow.rotation.x = -0.85 * pCup;
            this.rightHand.rotation.x = -0.2 * pCup;
        }

        // 3. Controller Catch & Hold Pose (Driven by controllerCatchProgress: 0 -> 1)
        const pCtrl = this.controllerCatchProgress;
        if (pCtrl > 0.001) {
            // Bring both hands to center in front of chest
            this.leftShoulder.rotation.x = -0.55 * pCtrl;
            this.leftShoulder.rotation.z = 0.28 * pCtrl;
            this.leftElbow.rotation.x = -0.95 * pCtrl;
            this.leftElbow.rotation.y = 0.35 * pCtrl;

            this.rightShoulder.rotation.x = -0.55 * pCtrl;
            this.rightShoulder.rotation.z = -0.28 * pCtrl;
            this.rightElbow.rotation.x = -0.95 * pCtrl;
            this.rightElbow.rotation.y = -0.35 * pCtrl;
        }

        // 4. Focused Gamer Lean (Driven by gamerLeanProgress: 0 -> 1)
        const pLean = this.gamerLeanProgress;
        if (pLean > 0.001) {
            this.spine.rotation.x = 0.28 * pLean; // lean upper body forward towards TV
            this.head.rotation.x = -0.18 * pLean; // tilt head up to look straight at screen
        }

        // 5. Active Gameplay Micro-Motion (Driven by gameplayJitter: 0 -> 1)
        const pJitter = this.gameplayJitter;
        if (pJitter > 0.001) {
            const t = elapsed * 10;
            const twitchLeft = Math.sin(t * 1.8) * 0.05 * pJitter;
            const twitchRight = Math.cos(t * 2.3) * 0.05 * pJitter;
            this.leftHand.rotation.z = twitchLeft;
            this.rightHand.rotation.z = twitchRight;

            // Subtle head tracking movements
            this.head.rotation.y = Math.sin(elapsed * 2.5) * 0.04 * pJitter;
            this.head.rotation.z = Math.cos(elapsed * 1.8) * 0.02 * pJitter;
        }
    }

    public setOpacity(opacity: number): void {
        this.materials.forEach((mat) => {
            mat.transparent = true;
            mat.opacity = opacity;
        });
    }
}
