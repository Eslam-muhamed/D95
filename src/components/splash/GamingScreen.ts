import * as THREE from 'three';

export class GamingScreen {
    public group: THREE.Group;
    public screenMesh: THREE.Mesh;
    public bezelMesh: THREE.Mesh;
    public standGroup: THREE.Group;

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D | null;
    private screenTexture: THREE.CanvasTexture;
    private screenMaterial: THREE.MeshBasicMaterial;
    private bezelMaterial: THREE.MeshStandardMaterial;
    private standMaterial: THREE.MeshStandardMaterial;

    constructor() {
        this.group = new THREE.Group();

        // 1. Dynamic Canvas for Game Display
        this.canvas = document.createElement('canvas');
        this.canvas.width = 512;
        this.canvas.height = 288;
        this.ctx = this.canvas.getContext('2d');

        this.renderGameDisplay(0);
        this.screenTexture = new THREE.CanvasTexture(this.canvas);
        this.screenTexture.generateMipmaps = false;
        this.screenTexture.minFilter = THREE.LinearFilter;

        // 2. Materials
        this.screenMaterial = new THREE.MeshBasicMaterial({
            map: this.screenTexture,
            transparent: true,
            opacity: 0,
        });

        this.bezelMaterial = new THREE.MeshStandardMaterial({
            color: 0x0c0a0e,
            roughness: 0.25,
            metalness: 0.85,
            transparent: true,
            opacity: 0,
        });

        this.standMaterial = new THREE.MeshStandardMaterial({
            color: 0x1f1c22,
            roughness: 0.35,
            metalness: 0.75,
            transparent: true,
            opacity: 0,
        });

        // 3. Ultra-Thin Screen Panel (16:9 ratio, ~2.5m wide)
        const screenGeo = new THREE.PlaneGeometry(2.5, 1.42);
        this.screenMesh = new THREE.Mesh(screenGeo, this.screenMaterial);
        this.screenMesh.position.set(0, 1.48, 0.02);
        this.group.add(this.screenMesh);

        // Bezel frame
        const bezelGeo = new THREE.BoxGeometry(2.56, 1.48, 0.05);
        this.bezelMesh = new THREE.Mesh(bezelGeo, this.bezelMaterial);
        this.bezelMesh.position.set(0, 1.48, 0);
        this.bezelMesh.castShadow = true;
        this.group.add(this.bezelMesh);

        // Sleek Minimalist Stand
        this.standGroup = new THREE.Group();
        const columnGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.78, 16);
        const columnMesh = new THREE.Mesh(columnGeo, this.standMaterial);
        columnMesh.position.set(0, 0.39, 0);
        columnMesh.castShadow = true;
        this.standGroup.add(columnMesh);

        const baseGeo = new THREE.BoxGeometry(0.85, 0.03, 0.38);
        const baseMesh = new THREE.Mesh(baseGeo, this.standMaterial);
        baseMesh.position.set(0, 0.015, 0);
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        this.standGroup.add(baseMesh);

        this.group.add(this.standGroup);

        // Position in front of the couch
        this.group.position.set(0, 0, 2.75);
        this.group.rotation.y = Math.PI; // Faces character
    }

    public update(elapsed: number): void {
        this.renderGameDisplay(elapsed);
        this.screenTexture.needsUpdate = true;
    }

    private renderGameDisplay(elapsed: number): void {
        const ctx = this.ctx;
        if (!ctx) return;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Dark futuristic sci-fi game gradient
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0a0314');
        grad.addColorStop(0.55, '#120a24');
        grad.addColorStop(1, '#05020a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Horizon line & racing grid
        ctx.strokeStyle = 'rgba(229, 37, 42, 0.35)';
        ctx.lineWidth = 1;
        const horizonY = h * 0.62;

        // Perspective speed grid
        const offset = (elapsed * 90) % 30;
        for (let y = horizonY; y < h; y += Math.pow((y - horizonY) / 12, 1.4) + 6) {
            const actualY = y + (offset * ((y - horizonY) / (h - horizonY)));
            if (actualY <= h) {
                ctx.beginPath();
                ctx.moveTo(0, actualY);
                ctx.lineTo(w, actualY);
                ctx.stroke();
            }
        }

        // Perspective rays
        for (let x = 0; x <= w; x += 42) {
            ctx.beginPath();
            ctx.moveTo(w / 2, horizonY);
            ctx.lineTo(x, h);
            ctx.stroke();
        }

        // Futuristic HUD UI: Speedometer arc & Telemetry
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const speedAngle = Math.PI * 0.75 + Math.sin(elapsed * 4) * 0.3;
        ctx.arc(w * 0.85, h * 0.78, 32, Math.PI * 0.75, speedAngle);
        ctx.stroke();

        // Minimap radar in upper corner
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(w * 0.12, h * 0.22, 22, 0, Math.PI * 2);
        ctx.stroke();

        // Blip on radar
        const blipAngle = elapsed * 3;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(w * 0.12 + Math.cos(blipAngle) * 12, h * 0.22 + Math.sin(blipAngle) * 12, 3, 0, Math.PI * 2);
        ctx.fill();

        // Center crosshair / aim reticle
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1;
        const cx = w / 2;
        const cy = h * 0.48;
        ctx.strokeRect(cx - 10, cy - 10, 20, 20);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(cx - 1, cy - 1, 2, 2);
    }

    public setOpacity(opacity: number): void {
        this.screenMaterial.opacity = opacity;
        this.bezelMaterial.opacity = opacity;
        this.standMaterial.opacity = opacity;
    }
}
