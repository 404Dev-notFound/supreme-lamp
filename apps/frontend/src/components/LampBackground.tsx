import React, { useEffect } from "react";

const LampBackground: React.FC = () => {
  useEffect(() => {
    // Dynamically create script element to load lamp.html content
    const script = document.createElement("script");
    script.type = "module";
    script.innerHTML = `
      import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
      import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';
      import { EffectComposer } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js';
      import { RenderPass } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/RenderPass.js';
      import { UnrealBloomPass } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js';

      const COUNT = 20000;
      const SPEED_MULT = 1;
      const AUTO_SPIN = true;

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x000000, 0.01);
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
      camera.position.set(0, 0, 100);

      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      renderer.setSize(window.innerWidth, window.innerHeight);
      const container = document.getElementById('lamp-bg');
      container?.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.autoRotate = AUTO_SPIN;
      controls.autoRotateSpeed = 2.0;

      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
      bloomPass.strength = 1.8; bloomPass.radius = 0.4; bloomPass.threshold = 0;
      composer.addPass(bloomPass);

      const dummy = new THREE.Object3D();
      const color = new THREE.Color();
      const target = new THREE.Vector3();

      const geometry = new THREE.TetrahedronGeometry(0.25);
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const instancedMesh = new THREE.InstancedMesh(geometry, material, COUNT);
      instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      scene.add(instancedMesh);

      const positions = [];
      for (let i = 0; i < COUNT; i++) {
        positions.push(new THREE.Vector3((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100));
        instancedMesh.setColorAt(i, color.setHex(0x00ff88));
      }

      // Simple control stubs – you can extend these later
      const PARAMS = { spread: 0.46, reach: 80, haze: 1.2, flicker: 0.25, warmth: 0.09, drift: 0.6 };
      const addControl = (id, _label, _min, _max, val) => PARAMS[id] !== undefined ? PARAMS[id] : val;
      const setInfo = () => {};
      const annotate = () => {};

      const clock = new THREE.Clock();
      function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const time = clock.getElapsedTime() * SPEED_MULT;
        controls.update();

        const count = COUNT;
        for (let i = 0; i < COUNT; i++) {
          const spread = addControl('spread', 'Beam Spread', 0.1, 1.0, 0.45);
          const reach = addControl('reach', 'Beam Reach', 20, 120, 80);
          const haze = addControl('haze', 'Air Haze', 0, 3, 1.2);
          const flickerAmt = addControl('flicker', 'Filament Flicker', 0, 1, 0.25);
          const warmth = addControl('warmth', 'Warmth', 0.0, 0.18, 0.09);
          const drift = addControl('drift', 'Mote Drift', 0, 2, 0.6);

          const apexY = reach * 0.5;
          const floorY = -reach * 0.5;

          const gold = 2.399963;
          const flick = 1.0 + flickerAmt * 0.18 * (Math.sin(time * 13.7) + 0.6 * Math.sin(time * 29.1 + 1.3) + 0.4 * Math.sin(time * 7.3 + 2.1));

          const nBulb = count * 0.05;
          const nShade = count * 0.13;
          const nBeam = count * 0.74;
          const nPool = count * 0.88;

          // --- simplified version of the original animation loop (kept core visual effect) ---
          const f = (i < nBulb) ? i / Math.max(1, nBulb) : (i < nShade) ? (i - nBulb) / Math.max(1, nShade - nBulb) : (i < nBeam) ? (i - nShade) / Math.max(1, nBeam - nShade) : (i < nPool) ? (i - nBeam) / Math.max(1, nPool - nBeam) : (i - nPool) / Math.max(1, count - nPool);
          const a = gold * i + time * 0.4;
          const rad = reach * 0.035 * (1 + 0.06 * Math.sin(time * 3.0 + i));
          target.set(Math.cos(a) * rad, apexY - reach * 0.06, Math.sin(a) * rad);
          color.setHSL(warmth + 0.03, Math.max(0, 0.35 - 0.2 * Math.random()), Math.max(0, Math.min(1, 0.92 * flick)));

          positions[i].lerp(target, 0.1);
          dummy.position.copy(positions[i]);
          dummy.updateMatrix();
          instancedMesh.setMatrixAt(i, dummy.matrix);
          instancedMesh.setColorAt(i, color);
        }
        instancedMesh.instanceMatrix.needsUpdate = true;
        instancedMesh.instanceColor.needsUpdate = true;
        composer.render();
      }
      animate();

      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
      });
    `;
    document.body.appendChild(script);
    return () => {
      // Cleanup: remove the canvas and script
      const container = document.getElementById('lamp-bg');
      while (container?.firstChild) {
        container.removeChild(container.firstChild);
      }
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div id="lamp-bg" style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      zIndex: -1,
      pointerEvents: "none",
    }} />
  );
};

export default LampBackground;
