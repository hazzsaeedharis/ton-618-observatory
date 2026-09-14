import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { vertex, fragment } from "./shader";

export class BlackHoleViewer {
  renderer: THREE.WebGLRenderer;
  camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  controls: OrbitControls;
  scene = new THREE.Scene();
  composer: EffectComposer;
  bloom: UnrealBloomPass;
  material: THREE.ShaderMaterial;
  paused = matchMedia("(prefers-reduced-motion: reduce)").matches;
  orbit = false;
  ready = false;
  suspended = false;
  elapsed = 0;
  onFrame?: (time: number) => void;
  private frame = 0;
  private previous = performance.now();
  private resizeObserver: ResizeObserver;
  private destroyed = false;
  private geometry = new THREE.PlaneGeometry(2, 2);
  private screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private goal?: THREE.Vector3;
  private width = 1;
  private height = 1;
  private compact = false;
  private quality = 1;
  private smoothFrame = 16;
  constructor(
    private host: HTMLElement,
    cinematic = false,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x080909);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.domElement.setAttribute(
      "aria-label",
      "Interactive artistic visualization of TON 618. Drag to orbit; scroll to zoom.",
    );
    this.renderer.domElement.setAttribute("role", "img");
    host.appendChild(this.renderer.domElement);
    this.camera.position.set(0, 7, 27);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.enablePan = false;
    this.controls.minDistance = 13;
    this.controls.maxDistance = 40;
    this.controls.minPolarAngle = 0.12;
    this.controls.maxPolarAngle = Math.PI - 0.12;
    this.controls.rotateSpeed = 0.4;
    this.controls.zoomSpeed = 0.65;
    this.controls.addEventListener("start", () => {
      this.goal = undefined;
    });
    this.material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        uResolution: { value: new THREE.Vector2() },
        uTime: { value: 0 },
        uEye: { value: new THREE.Vector3() },
        uRight: { value: new THREE.Vector3() },
        uUp: { value: new THREE.Vector3() },
        uForward: { value: new THREE.Vector3() },
        uLens: { value: 1 },
        uDisk: { value: 1 },
        uExposure: { value: 1 },
        uShift: { value: cinematic ? 0 : 0.47 },
        uHighlight: { value: 0 },
        uBeaming: { value: 1 },
        uFov: { value: 0.48 },
      },
    });
    this.scene.add(new THREE.Mesh(this.geometry, this.material));
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.screenCamera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.19, 0.35, 1.1);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.compact = cinematic;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
    this.animate();
  }
  private resize() {
    this.width = this.host.clientWidth;
    this.height = this.host.clientHeight;
    const ratio = Math.min(devicePixelRatio, 1.4) * this.quality;
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(this.width, this.height);
    this.composer.setPixelRatio(ratio);
    this.composer.setSize(this.width, this.height);
    this.material.uniforms.uResolution.value.set(this.width, this.height);
    this.material.uniforms.uFov.value = this.width < 600 ? 0.8 : 0.48;
    this.material.uniforms.uShift.value =
      this.compact || this.width < 900 ? 0 : 0.5;
  }
  setLens(value: boolean) {
    this.material.uniforms.uLens.value = value ? 1 : 0;
  }
  setDisk(value: boolean) {
    this.material.uniforms.uDisk.value = value ? 1 : 0;
  }
  setBeaming(value: boolean) {
    this.material.uniforms.uBeaming.value = value ? 1 : 0;
  }
  setExposure(value: number) {
    this.material.uniforms.uExposure.value = value;
  }
  highlight(value: boolean) {
    this.material.uniforms.uHighlight.value = value ? 1 : 0;
  }
  setPose(x: number, y: number, z: number) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.camera.position.set(x, y, z);
      this.goal = undefined;
      return;
    }
    this.goal = new THREE.Vector3(x, y, z);
  }
  reset() {
    this.setPose(0, 7, 27);
  }
  setQuality(value: number) {
    this.quality = value;
    this.resize();
  }
  center(value: boolean) {
    this.compact = value;
    this.resize();
  }
  capture() {
    this.composer.render();
    return this.renderer.domElement.toDataURL("image/png");
  }
  private animate = () => {
    if (this.destroyed) return;
    this.frame = requestAnimationFrame(this.animate);
    const now = performance.now(),
      delta = Math.min((now - this.previous) / 1000, 0.06);
    this.previous = now;
    if (!document.hidden) {
      this.smoothFrame = this.smoothFrame * 0.98 + delta * 1000 * 0.02;
      if (this.elapsed > 3 && this.smoothFrame > 38 && this.quality > 0.6) {
        this.quality -= 0.1;
        this.smoothFrame = 20;
        this.resize();
      }
    }
    if (!this.paused) this.elapsed += delta;
    this.controls.autoRotate = this.orbit && !this.paused && !this.goal;
    this.controls.autoRotateSpeed = 0.35;
    if (this.goal) {
      this.camera.position.lerp(this.goal, 1 - Math.exp(-delta * 3));
      if (this.camera.position.distanceTo(this.goal) < 0.03) {
        this.camera.position.copy(this.goal);
        this.goal = undefined;
      }
    }
    this.controls.update(delta);
    this.camera.updateMatrixWorld();
    const u = this.material.uniforms;
    u.uEye.value.copy(this.camera.position);
    u.uRight.value.setFromMatrixColumn(this.camera.matrixWorld, 0);
    u.uUp.value.setFromMatrixColumn(this.camera.matrixWorld, 1);
    u.uForward.value.setFromMatrixColumn(this.camera.matrixWorld, 2).negate();
    u.uTime.value = this.elapsed;
    if (!this.suspended) this.composer.render();
    this.ready = true;
    this.onFrame?.(this.elapsed);
  };
  dispose() {
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.material.dispose();
    this.geometry.dispose();
    this.composer.passes.forEach((p) => p.dispose());
    this.composer.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
