"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeNetwork() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;

    // Get parent dimensions
    let width = container.clientWidth || 500;
    let height = container.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 12;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x3b82f6, 2, 50);
    pointLight.position.set(5, 5, 10);
    scene.add(pointLight);

    // Node colors corresponding to citizen report categories
    const colors = [
      0xef4444, // Red: Jalan Rusak
      0x3b82f6, // Blue: Penerangan / Fasum
      0xf59e0b, // Amber: Penerangan
      0x10b981, // Green: Lingkungan
      0x8b5cf6, // Purple: Banjir
    ];

    // Nodes (small glowing spheres)
    const nodeCount = 35;
    const nodes = [];
    const sphereGeometry = new THREE.SphereGeometry(0.18, 12, 12);

    for (let i = 0; i < nodeCount; i++) {
      // Pick random category color
      const color = colors[Math.floor(Math.random() * colors.length)];
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.85,
      });

      const mesh = new THREE.Mesh(sphereGeometry, material);
      
      // Random coordinates in space
      mesh.position.set(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6
      );

      // Add velocity for floating animation
      mesh.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.015,
          (Math.random() - 0.5) * 0.015,
          (Math.random() - 0.5) * 0.015
        ),
        originalScale: 1.0,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulseOffset: Math.random() * Math.PI * 2,
        color: color
      };

      scene.add(mesh);
      nodes.push(mesh);
    }

    // Lines connecting nearby nodes
    const maxDistance = 3.6;
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.18,
      linewidth: 1, // Note: linewidth > 1 usually ignored by WebGL implementations
    });

    // Create a dynamic geometry for lines
    const lineGeometry = new THREE.BufferGeometry();
    const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineMesh);

    // Mouse Tracking
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      // Normalize mouse coordinates (-1 to 1)
      mouse.targetX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.targetY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      width = container.clientWidth;
      height = container.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Animation Loop
    let animationFrameId;
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.01;

      // Smooth mouse transition
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Animate Nodes
      nodes.forEach((node) => {
        // Move floating nodes
        node.position.add(node.userData.velocity);

        // Bounds check & bounce
        if (Math.abs(node.position.x) > 7.5) node.userData.velocity.x *= -1;
        if (Math.abs(node.position.y) > 4.5) node.userData.velocity.y *= -1;
        if (Math.abs(node.position.z) > 4) node.userData.velocity.z *= -1;

        // Mouse attraction/repulsion effect in 3D
        const mouse3D = new THREE.Vector3(mouse.x * 6, mouse.y * 4, 0);
        const distToMouse = node.position.distanceTo(mouse3D);
        if (distToMouse < 4) {
          // Gently pull particles slightly towards mouse
          const dir = new THREE.Vector3().subVectors(mouse3D, node.position).normalize();
          const force = (4 - distToMouse) * 0.003;
          node.position.addScaledVector(dir, force);
        }

        // Pulse scale
        const pulse = Math.sin(time * 5 + node.userData.pulseOffset) * 0.25 + 1;
        node.scale.set(pulse, pulse, pulse);

        // Highlight random node intensely
        if (Math.random() < 0.001) {
          node.scale.set(2.5, 2.5, 2.5);
        }
      });

      // Update Lines
      const linePositions = [];
      const lineColors = [];

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dist = nodes[i].position.distanceTo(nodes[j].position);
          if (dist < maxDistance) {
            // Add coordinates for line segment [Node A, Node B]
            linePositions.push(
              nodes[i].position.x, nodes[i].position.y, nodes[i].position.z,
              nodes[j].position.x, nodes[j].position.y, nodes[j].position.z
            );

            // Add colors (gradient between connected node colors)
            const c1 = new THREE.Color(nodes[i].userData.color);
            const c2 = new THREE.Color(nodes[j].userData.color);
            lineColors.push(c1.r, c1.g, c1.b, c2.r, c2.g, c2.b);
          }
        }
      }

      // Update Buffer Geometry
      lineGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(linePositions, 3)
      );
      
      // Update geometry parameters
      lineGeometry.computeBoundingSphere();
      lineGeometry.computeBoundingBox();

      // Rotate whole scene slowly
      scene.rotation.y = time * 0.05;
      scene.rotation.x = Math.sin(time * 0.02) * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();

      // Dispose of Three.js objects
      scene.remove(lineMesh);
      lineGeometry.dispose();
      lineMaterial.dispose();

      nodes.forEach((node) => {
        scene.remove(node);
        node.geometry.dispose();
        node.material.dispose();
      });

      sphereGeometry.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[350px] md:min-h-[500px]"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block touch-none" />
      
      {/* City nodes stats decoration overlay */}
      <div className="absolute bottom-4 left-4 bg-ink/70 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-[10px] text-white/80 font-mono flex items-center gap-2 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
        <span>WebGL Node-Graph: 35 Kelurahan Terkoneksi</span>
      </div>
    </div>
  );
}
