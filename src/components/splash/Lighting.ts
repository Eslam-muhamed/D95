import * as THREE from 'three';

export class Lighting {
    public group: THREE.Group;
    public ambientLight: THREE.AmbientLight;
    public keyLight: THREE.SpotLight;
    public rimLight: THREE.SpotLight;
    public fillLight: THREE.DirectionalLight;
    public screenGlowLight: THREE.PointLight;
    public groundMesh: THREE.Mesh;

    constructor(scene: THREE.Scene) {
        this.group = new THREE.Group();

        // Atmospheric Fog
        scene.fog = new THREE.FogExp2(0x080507, 0.085);

        // 1. Ambient Light (Moody deep tone)
        this.ambientLight = new THREE.AmbientLight(0x181016, 0.7);
        this.group.add(this.ambientLight);

        // 2. Key Overhead Spotlight (Casting soft shadows)
        this.keyLight = new THREE.SpotLight(0xfff5ea, 3.2);
        this.keyLight.position.set(2.5, 5.5, 3.0);
        this.keyLight.angle = Math.PI / 4.5;
        this.keyLight.penumbra = 0.8;
        this.keyLight.decay = 1.4;
        this.keyLight.distance = 25;
        this.keyLight.castShadow = true;
        this.keyLight.shadow.mapSize.width = 1024;
        this.keyLight.shadow.mapSize.height = 1024;
        this.keyLight.shadow.camera.near = 0.5;
        this.keyLight.shadow.camera.far = 15;
        this.keyLight.shadow.bias = -0.0005;
        this.group.add(this.keyLight);

        // 3. Rim / Silhouette Light (Signature D95 Crimson Glow)
        this.rimLight = new THREE.SpotLight(0xe5252a, 4.8);
        this.rimLight.position.set(-2.8, 3.2, -3.2);
        this.rimLight.angle = Math.PI / 3.5;
        this.rimLight.penumbra = 0.9;
        this.rimLight.decay = 1.2;
        this.rimLight.distance = 20;
        this.group.add(this.rimLight);

        // 4. Subtle Cool Fill Light
        this.fillLight = new THREE.DirectionalLight(0x283045, 0.8);
        this.fillLight.position.set(-3, 2, 4);
        this.group.add(this.fillLight);

        // 5. Dynamic TV Screen Glow Light (Fires up in Scene 6 & 7)
        this.screenGlowLight = new THREE.PointLight(0x38bdf8, 0, 10);
        this.screenGlowLight.position.set(0, 1.4, 2.2);
        this.group.add(this.screenGlowLight);

        // 6. Premium Reflective Studio Floor
        const groundGeo = new THREE.PlaneGeometry(30, 30, 1, 1);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x090708,
            roughness: 0.28,
            metalness: 0.65,
        });
        this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
        this.groundMesh.rotation.x = -Math.PI / 2;
        this.groundMesh.position.y = 0;
        this.groundMesh.receiveShadow = true;
        this.group.add(this.groundMesh);

        scene.add(this.group);
    }

    public update(elapsedTime: number, gamingActive: boolean = false): void {
        if (gamingActive) {
            // Subtle dynamic flicker representing gameplay on the big screen
            const flicker = Math.sin(elapsedTime * 8) * 0.25 + Math.cos(elapsedTime * 13) * 0.15;
            this.screenGlowLight.intensity = Math.max(1.8, 3.0 + flicker);

            // Shifting game lighting colors (cyan/electric blue to purple to amber)
            const hue = (Math.sin(elapsedTime * 1.5) * 0.15 + 0.58) % 1; // around 0.55-0.7 (blue to purple)
            this.screenGlowLight.color.setHSL(hue, 0.85, 0.55);
        }
    }
}
