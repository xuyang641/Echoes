import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Cloud, Stars, Html, Float, Sparkles, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useTranslation } from 'react-i18next';

// --- External Model Component ---

function PlantModel({ url, position, scale = 1, onClick, label, rotation = [0, 0, 0] }: any) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => scene.clone(), [scene]);
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Sway animation
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.z = rotation[2] + Math.sin(state.clock.elapsedTime + position[0]) * 0.05;
      group.current.rotation.x = rotation[0] + Math.cos(state.clock.elapsedTime * 0.5 + position[2]) * 0.05;
    }
  });

  return (
    <group 
      ref={group} 
      position={position} 
      onClick={onClick}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; setHovered(true); }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; setHovered(false); }}
    >
      <primitive object={clone} scale={scale} />
      {label && hovered && (
        <Html position={[0, scale * 250, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.9)', padding: '8px 12px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

// Fallback Procedural Components (Keep these for when models fail to load or are missing)
function Stem({ height = 2, color = "#16a34a", thickness = 0.05 }) {
  return (
    <mesh position={[0, height / 2, 0]}>
      <cylinderGeometry args={[thickness, thickness, height, 8]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
}

function Sunflower({ position, scale = 1, onClick, label }: any) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  // Sway animation
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.z = Math.sin(state.clock.elapsedTime + position[0]) * 0.05;
      group.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.5 + position[2]) * 0.05;
    }
  });

  return (
    <group 
      ref={group} 
      position={position} 
      scale={scale} 
      onClick={onClick}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; setHovered(true); }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; setHovered(false); }}
    >
      <Stem height={3} />
      {/* Flower Head */}
      <group position={[0, 3, 0]} rotation={[Math.PI / 4, 0, 0]}>
        {/* Center */}
        <mesh>
          <cylinderGeometry args={[0.6, 0.4, 0.2, 16]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        {/* Petals */}
        {[...Array(12)].map((_, i) => (
          <mesh key={i} rotation={[0, (Math.PI * 2 / 12) * i, 0]} position={[0, 0, 0]}>
             <mesh position={[0.8, 0, 0]} rotation={[0, 0, -0.2]}>
                <boxGeometry args={[1.2, 0.1, 0.4]} />
                <meshStandardMaterial color="#fbbf24" />
             </mesh>
          </mesh>
        ))}
      </group>
      {/* Leaves */}
      <mesh position={[0, 1.5, 0]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.8, 0.05, 0.4]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
      <mesh position={[0, 1, 0]} rotation={[0, 3, -0.5]}>
        <boxGeometry args={[0.8, 0.05, 0.4]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>

      {label && hovered && (
        <Html position={[0, 4, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.9)', padding: '8px 12px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

function Rose({ position, scale = 0.8, color = "#f43f5e", onClick, label }: any) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.2 + position[0]) * 0.03;
    }
  });

  return (
    <group 
      ref={group} 
      position={position} 
      scale={scale} 
      onClick={onClick}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; setHovered(true); }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; setHovered(false); }}
    >
      <Stem height={2.5} color="#064e3b" />
      {/* Flower Head - Abstract shapes */}
      <group position={[0, 2.5, 0]}>
         <mesh position={[0, 0.2, 0]}>
           <dodecahedronGeometry args={[0.5, 0]} />
           <meshStandardMaterial color={color} />
         </mesh>
      </group>
      {/* Thorns/Leaves */}
      <mesh position={[0, 1.2, 0]} rotation={[0, 0, 0.8]}>
        <coneGeometry args={[0.1, 0.4, 4]} />
        <meshStandardMaterial color="#064e3b" />
      </mesh>

      {label && hovered && (
        <Html position={[0, 3.5, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.9)', padding: '8px 12px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

function Tulip({ position, scale = 0.8, color = "#60a5fa", onClick, label }: any) {
   const group = useRef<THREE.Group>(null);
   const [hovered, setHovered] = useState(false);

   useFrame((state) => {
    if (group.current) {
      group.current.rotation.x = Math.sin(state.clock.elapsedTime + position[2]) * 0.05;
    }
   });

   return (
    <group 
      ref={group} 
      position={position} 
      scale={scale} 
      onClick={onClick}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; setHovered(true); }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; setHovered(false); }}
    >
      <Stem height={2} thickness={0.08} />
      {/* Bulb */}
      <mesh position={[0, 2, 0]}>
        <capsuleGeometry args={[0.4, 0.8, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Long Leaves */}
      <mesh position={[0.3, 0.5, 0]} rotation={[0, 0, -0.2]}>
         <boxGeometry args={[0.1, 1.5, 0.1]} />
         <meshStandardMaterial color="#16a34a" />
      </mesh>
      {label && hovered && (
        <Html position={[0, 3, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.9)', padding: '8px 12px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {label}
          </div>
        </Html>
      )}
    </group>
   );
}

function Bamboo({ position, scale = 1, onClick, label }: any) {
  const [hovered, setHovered] = useState(false);
  return (
    <group 
      position={position} 
      scale={scale} 
      onClick={onClick}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; setHovered(true); }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; setHovered(false); }}
    >
       {/* Segmented Stalk */}
       <mesh position={[0, 1, 0]}>
         <cylinderGeometry args={[0.15, 0.2, 2, 6]} />
         <meshStandardMaterial color="#84cc16" />
       </mesh>
       <mesh position={[0, 3.1, 0]}>
         <cylinderGeometry args={[0.12, 0.15, 2, 6]} />
         <meshStandardMaterial color="#84cc16" />
       </mesh>
       {/* Joints */}
       <mesh position={[0, 2.05, 0]}>
         <torusGeometry args={[0.16, 0.02, 4, 6]} />
         <meshStandardMaterial color="#3f6212" />
       </mesh>
       {label && hovered && (
        <Html position={[0, 4.5, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.9)', padding: '8px 12px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

function Cactus({ position, scale = 1, onClick, label }: any) {
  const [hovered, setHovered] = useState(false);
  return (
    <group 
      position={position} 
      scale={scale} 
      onClick={onClick}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; setHovered(true); }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; setHovered(false); }}
    >
      <mesh position={[0, 1, 0]}>
        <capsuleGeometry args={[0.5, 2, 4, 8]} />
        <meshStandardMaterial color="#115e59" roughness={0.9} />
      </mesh>
      <mesh position={[0.6, 1.5, 0]} rotation={[0, 0, -0.5]}>
        <capsuleGeometry args={[0.3, 1, 4, 8]} />
        <meshStandardMaterial color="#115e59" roughness={0.9} />
      </mesh>
      <mesh position={[-0.6, 1.2, 0]} rotation={[0, 0, 0.5]}>
        <capsuleGeometry args={[0.3, 0.8, 4, 8]} />
        <meshStandardMaterial color="#115e59" roughness={0.9} />
      </mesh>
      {label && hovered && (
        <Html position={[0, 2.5, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.9)', padding: '8px 12px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

// --- Weather System ---

function Rain() {
  const count = 1000;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50; // x
      pos[i * 3 + 1] = Math.random() * 40;     // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50; // z
    }
    return pos;
  }, []);

  const ref = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (ref.current) {
      const positions = ref.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        let y = positions[i * 3 + 1];
        y -= 0.5; // Fall speed
        if (y < 0) y = 40; // Reset to top
        positions[i * 3 + 1] = y;
      }
      ref.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#a5f3fc" size={0.1} transparent opacity={0.6} />
    </points>
  );
}

// --- Main Scene ---

interface GardenSceneProps {
  weather: 'sunny' | 'rainy' | 'cloudy' | 'windy';
  plants: Array<{
    id: string;
    type: string;
    position: [number, number, number];
    label?: React.ReactNode;
  }>;
}

export function GardenScene({ weather, plants }: GardenSceneProps) {
  return (
    <Canvas shadows camera={{ position: [0, 8, 15], fov: 50 }}>
      {/* Lighting */}
      <ambientLight intensity={weather === 'rainy' ? 0.2 : 0.6} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={weather === 'sunny' ? 1.5 : 0.5} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      />
      {weather === 'sunny' && <pointLight position={[-10, 5, -10]} intensity={0.5} color="#fbbf24" />}

      {/* Environment */}
      {weather === 'sunny' && <Environment preset="sunset" />}
      {weather === 'cloudy' && <Environment preset="park" />}
      {weather === 'rainy' && <Environment preset="night" />}

      {/* Sky */}
      {weather !== 'rainy' && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
      {weather !== 'sunny' && (
        <Cloud opacity={0.5} speed={0.4} width={10} depth={1.5} segments={20} position={[0, 10, -10]} />
      )}

      {/* Weather Effects */}
      {weather === 'rainy' && <Rain />}
      {weather === 'sunny' && (
        <Sparkles count={50} scale={12} size={4} speed={0.4} opacity={0.5} color="#fef3c7" />
      )}

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color={weather === 'rainy' ? "#14532d" : "#4ade80"} />
      </mesh>
      
      {/* Plants */}
      {plants.map((plant, i) => {
        const props = {
          key: plant.id,
          position: plant.position,
          label: plant.label,
          // Randomize scale slightly for variety
          scale: 0.8 + Math.random() * 0.4
        };

        // Try to use models if available, otherwise fallback
        // Note: In a real app, you would download these GLBs to public/models/
        // Since I cannot browse the web, I've set up the logic.
        // You can drop 'sunflower.glb', 'rose.glb' etc into public/models/
        
        switch (plant.type) {
          // Use the real GLB model for Sunflower
          // Adjusted scale to fit screen better (0.05 -> 0.01)
          case 'Sunflower': 
            return <PlantModel url="/models/sunflower.glb" {...props} scale={0.01} rotation={[0, Math.random() * Math.PI, 0]} />;
          
          case 'Rose': return <Rose {...props} />;
          case 'Rain Lily': return <Tulip {...props} color="#818cf8" />; 
          case 'Bamboo': return <Bamboo {...props} />;
          case 'Cactus': return <Cactus {...props} />;
          default: return <Sunflower {...props} />;
        }
      })}

      {/* Controls */}
      <OrbitControls 
        enableZoom={true} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 2 - 0.1}
        minDistance={5}
        maxDistance={20}
      />
    </Canvas>
  );
}