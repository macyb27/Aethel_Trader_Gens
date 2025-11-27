/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - NEXUS MODE (Generative Strategy Matrix)
 * Full-screen 3D visualization with Three.js
 * Node colors = Sharpe Ratio | Z-Axis = Entanglement Score
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Component, onMount, onCleanup, createSignal, Show } from 'solid-js';
import * as THREE from 'three';
import { state, actions, GSMNode } from '../store';

// ─────────────────────────────────────────────────────────────────────────────
// THREE.JS SCENE MANAGER
// ─────────────────────────────────────────────────────────────────────────────

class GSMSceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private grid: THREE.GridHelper | null = null;
  private cage: THREE.LineSegments | null = null;
  private nodes: Map<string, THREE.Mesh> = new Map();
  private selectedNode: THREE.Mesh | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private animationId: number | null = null;
  private time: number = 0;
  private container: HTMLElement;
  
  // Idle camera animation
  private cameraRadius: number = 25;
  private cameraAngle: number = 0;
  private cameraHeight: number = 12;
  
  constructor(container: HTMLElement) {
    this.container = container;
    
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);
    this.scene.fog = new THREE.Fog(0x050505, 30, 80);
    
    // Camera setup
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.set(20, 15, 20);
    this.camera.lookAt(0, 0, 0);
    
    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);
    
    // Raycaster for node selection
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Initialize scene elements
    this.createStrategySpace();
    this.createLighting();
    
    // Event listeners
    window.addEventListener('resize', this.handleResize);
    container.addEventListener('click', this.handleClick);
    container.addEventListener('mousemove', this.handleMouseMove);
  }
  
  private createStrategySpace(): void {
    // Neon cyan grid floor
    const gridSize = 30;
    const gridDivisions = 30;
    this.grid = new THREE.GridHelper(gridSize, gridDivisions, 0x00f3ff, 0x00f3ff);
    (this.grid.material as THREE.Material).opacity = 0.15;
    (this.grid.material as THREE.Material).transparent = true;
    this.grid.position.y = -5;
    this.scene.add(this.grid);
    
    // Strategy space cage (bounding box)
    const cageGeometry = new THREE.BoxGeometry(20, 15, 20);
    const cageEdges = new THREE.EdgesGeometry(cageGeometry);
    const cageMaterial = new THREE.LineBasicMaterial({ 
      color: 0x00f3ff, 
      transparent: true, 
      opacity: 0.3 
    });
    this.cage = new THREE.LineSegments(cageEdges, cageMaterial);
    this.cage.position.y = 2.5;
    this.scene.add(this.cage);
    
    // Axis labels (subtle)
    this.createAxisLabel('RISK', new THREE.Vector3(12, -4, 0), 0x00f3ff);
    this.createAxisLabel('TIME HORIZON', new THREE.Vector3(0, -4, 12), 0xbc13fe);
    this.createAxisLabel('ENTANGLEMENT', new THREE.Vector3(0, 10, 0), 0x00ff88);
  }
  
  private createAxisLabel(text: string, position: THREE.Vector3, color: number): void {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;
    
    context.fillStyle = 'transparent';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.font = 'bold 24px Orbitron, sans-serif';
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ 
      map: texture, 
      transparent: true,
      opacity: 0.6
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.scale.set(8, 2, 1);
    this.scene.add(sprite);
  }
  
  private createLighting(): void {
    // Ambient light
    const ambient = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambient);
    
    // Main directional light
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(10, 20, 10);
    this.scene.add(directional);
    
    // Colored point lights for atmosphere
    const cyanLight = new THREE.PointLight(0x00f3ff, 1, 50);
    cyanLight.position.set(-15, 10, -15);
    this.scene.add(cyanLight);
    
    const purpleLight = new THREE.PointLight(0xbc13fe, 0.8, 50);
    purpleLight.position.set(15, 10, 15);
    this.scene.add(purpleLight);
  }
  
  public updateNodes(gsmNodes: GSMNode[]): void {
    // Remove old nodes not in new list
    const newIds = new Set(gsmNodes.map(n => n.id));
    this.nodes.forEach((mesh, id) => {
      if (!newIds.has(id)) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        this.nodes.delete(id);
      }
    });
    
    // Update or create nodes
    gsmNodes.forEach(node => {
      let mesh = this.nodes.get(node.id);
      
      if (!mesh) {
        // Create new node
        const geometry = new THREE.SphereGeometry(0.4, 32, 32);
        const material = new THREE.MeshPhongMaterial({
          color: new THREE.Color(node.color),
          emissive: new THREE.Color(node.color),
          emissiveIntensity: 0.3,
          shininess: 100,
        });
        mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { nodeId: node.id, genomeId: node.genomeId };
        this.scene.add(mesh);
        this.nodes.set(node.id, mesh);
      }
      
      // Update position (smooth lerp)
      const targetPos = new THREE.Vector3(node.x, node.z, node.y);
      mesh.position.lerp(targetPos, 0.1);
      
      // Update color based on Sharpe ratio
      const color = new THREE.Color(node.color);
      (mesh.material as THREE.MeshPhongMaterial).color = color;
      (mesh.material as THREE.MeshPhongMaterial).emissive = color;
      
      // Update selection state
      if (node.isSelected) {
        mesh.scale.setScalar(1.5);
        (mesh.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.8;
      } else {
        mesh.scale.setScalar(1);
        (mesh.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.3;
      }
    });
  }
  
  private handleResize = (): void => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };
  
  private handleClick = (event: MouseEvent): void => {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(Array.from(this.nodes.values()));
    
    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const nodeId = mesh.userData.nodeId;
      actions.selectNode(nodeId);
      
      // Log selection
      actions.addLog('quantum', 'GSM', `Selected genome node: ${mesh.userData.genomeId.slice(0, 8)}...`);
    }
  };
  
  private handleMouseMove = (event: MouseEvent): void => {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  };
  
  public animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    this.time += 0.005;
    
    // Idle camera drift animation
    this.cameraAngle += 0.002;
    this.camera.position.x = Math.cos(this.cameraAngle) * this.cameraRadius;
    this.camera.position.z = Math.sin(this.cameraAngle) * this.cameraRadius;
    this.camera.position.y = this.cameraHeight + Math.sin(this.time * 0.5) * 2;
    this.camera.lookAt(0, 0, 0);
    
    // Animate grid
    if (this.grid) {
      this.grid.position.y = -5 + Math.sin(this.time) * 0.2;
    }
    
    // Animate cage
    if (this.cage) {
      (this.cage.material as THREE.LineBasicMaterial).opacity = 0.2 + Math.sin(this.time * 2) * 0.1;
    }
    
    // Pulse nodes
    this.nodes.forEach((mesh) => {
      const scale = mesh.userData.nodeId === state.selectedNodeId ? 1.5 : 1;
      const pulse = 1 + Math.sin(this.time * 3 + mesh.position.x) * 0.1;
      mesh.scale.setScalar(scale * pulse);
    });
    
    this.renderer.render(this.scene, this.camera);
  };
  
  public start(): void {
    this.animate();
  }
  
  public stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
  
  public dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    this.container.removeEventListener('click', this.handleClick);
    this.container.removeEventListener('mousemove', this.handleMouseMove);
    
    // Dispose all nodes
    this.nodes.forEach((mesh) => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    this.nodes.clear();
    
    // Dispose renderer
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
  
  // Method for phenotype-to-genotype mapping (GSM GOLD STATUS)
  public get3DSelectionCoordinates(): { x: number, y: number, z: number } | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Create invisible plane at y=0 for coordinate picking
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectionPoint = new THREE.Vector3();
    
    if (this.raycaster.ray.intersectPlane(plane, intersectionPoint)) {
      return {
        x: (intersectionPoint.x + 10) / 20, // Normalize to 0-1
        y: (intersectionPoint.z + 10) / 20, // Normalize to 0-1
        z: intersectionPoint.y / 10         // Normalize to 0-1
      };
    }
    
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NEXUS MODE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const NexusMode: Component = () => {
  let containerRef: HTMLDivElement | undefined;
  let sceneManager: GSMSceneManager | null = null;
  const [isInitialized, setIsInitialized] = createSignal(false);
  const [hoveredNode, setHoveredNode] = createSignal<GSMNode | null>(null);
  
  onMount(() => {
    if (containerRef) {
      sceneManager = new GSMSceneManager(containerRef);
      sceneManager.start();
      setIsInitialized(true);
      
      // Initial node update
      sceneManager.updateNodes(state.gsmNodes);
      
      actions.addLog('info', 'NEXUS', '🌌 GSM 3D Visualization initialized');
      actions.addLog('quantum', 'NEXUS', 'Strategy space rendering active');
    }
    
    onCleanup(() => {
      if (sceneManager) {
        sceneManager.dispose();
        sceneManager = null;
      }
    });
  });
  
  // Update nodes when population changes
  // Note: In production, use createEffect for reactive updates
  
  return (
    <div class="nexus-mode">
      <div ref={containerRef} class="nexus-canvas-container" />
      
      <div class="nexus-overlay">
        {/* Header */}
        <div class="nexus-header">
          <h2 class="nexus-title">
            <span class="nexus-icon">🌌</span>
            GENERATIVE STRATEGY MATRIX
          </h2>
          <span class="nexus-subtitle">3D Strategy Space Visualization</span>
        </div>
        
        {/* Stats Panel */}
        <div class="nexus-stats">
          <div class="gsm-stat">
            <span class="gsm-stat-value">{state.gsmNodes.length}</span>
            <span class="gsm-stat-label">Active Genomes</span>
          </div>
          <div class="gsm-stat">
            <span class="gsm-stat-value">
              {state.population.length > 0 
                ? Math.max(...state.population.map(p => p.sharpeRatio)).toFixed(2)
                : '---'
              }
            </span>
            <span class="gsm-stat-label">Best Sharpe</span>
          </div>
          <div class="gsm-stat">
            <span class="gsm-stat-value">
              {state.population.length > 0
                ? Math.max(...state.population.map(p => p.generation))
                : '0'
              }
            </span>
            <span class="gsm-stat-label">Generation</span>
          </div>
        </div>
        
        {/* Selected Node Info */}
        <Show when={state.selectedNodeId}>
          <div class="nexus-selection-info">
            <div class="selection-header">
              <span class="selection-icon">◈</span>
              Selected Genome
            </div>
            <div class="selection-body">
              <div class="selection-row">
                <span class="selection-label">ID</span>
                <span class="selection-value">{state.selectedNodeId}</span>
              </div>
            </div>
          </div>
        </Show>
        
        {/* Legend */}
        <div class="nexus-legend">
          <div class="legend-title">Sharpe Ratio Color Scale</div>
          <div class="legend-gradient">
            <span class="legend-label">-2.0</span>
            <div class="legend-bar" />
            <span class="legend-label">+4.0</span>
          </div>
          <div class="legend-colors">
            <span class="legend-color" style={{ background: '#ff4040' }}>Poor</span>
            <span class="legend-color" style={{ background: '#bc13fe' }}>Neutral</span>
            <span class="legend-color" style={{ background: '#00f3ff' }}>Excellent</span>
          </div>
        </div>
        
        {/* Instructions */}
        <div class="nexus-instructions">
          <p>Click on nodes to select strategies</p>
          <p>Z-Axis represents Quantum Entanglement Score</p>
        </div>
      </div>
    </div>
  );
};

export default NexusMode;
