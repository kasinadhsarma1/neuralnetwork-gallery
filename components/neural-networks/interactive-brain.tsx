"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import * as THREE from "three"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { ZoomIn, ZoomOut, RotateCcw, Eye, Brain, Activity, Zap, Settings } from "lucide-react"

interface NeuronData {
  position: THREE.Vector3
  region: string
  neuronType: "pyramidal" | "interneuron" | "motor" | "sensory" | "dopaminergic" | "cholinergic"
  color: number
  connections: number[]
  activity: number
  threshold: number
  refractory: number
  plasticity: number
}

interface Synapse {
  presynaptic: number
  postsynaptic: number
  weight: number
  neurotransmitter: "dopamine" | "serotonin" | "acetylcholine" | "gaba" | "glutamate"
  position: THREE.Vector3
}

interface NeuralPulse {
  start: number
  end: number
  progress: number
  strength: number
  neurotransmitter: string
  color: number
  speed: number
}

interface BrainWave {
  frequency: number
  amplitude: number
  phase: number
  type: "alpha" | "beta" | "gamma" | "theta" | "delta"
}

const BRAIN_REGIONS = {
  PREFRONTAL_CORTEX: {
    color: 0xff4757,
    name: "Prefrontal Cortex",
    function: "Executive Control",
    position: { x: 0, y: 60, z: 40 },
  },
  MOTOR_CORTEX: {
    color: 0x3742fa,
    name: "Motor Cortex",
    function: "Movement Control",
    position: { x: 0, y: 40, z: 20 },
  },
  SOMATOSENSORY: {
    color: 0x2ed573,
    name: "Somatosensory",
    function: "Touch Processing",
    position: { x: 0, y: 20, z: 0 },
  },
  VISUAL_CORTEX: {
    color: 0xffa502,
    name: "Visual Cortex",
    function: "Vision Processing",
    position: { x: 0, y: 0, z: -60 },
  },
  AUDITORY_CORTEX: {
    color: 0x5f27cd,
    name: "Auditory Cortex",
    function: "Sound Processing",
    position: { x: 70, y: 0, z: 0 },
  },
  HIPPOCAMPUS: {
    color: 0x00d2d3,
    name: "Hippocampus",
    function: "Memory Formation",
    position: { x: 30, y: -20, z: -10 },
  },
  AMYGDALA: {
    color: 0xff6348,
    name: "Amygdala",
    function: "Emotion Processing",
    position: { x: 25, y: -10, z: -20 },
  },
  THALAMUS: {
    color: 0x7bed9f,
    name: "Thalamus",
    function: "Sensory Relay",
    position: { x: 0, y: 0, z: 0 },
  },
  BRAINSTEM: {
    color: 0x70a1ff,
    name: "Brainstem",
    function: "Vital Functions",
    position: { x: 0, y: -80, z: -20 },
  },
  CEREBELLUM: {
    color: 0xa4b0be,
    name: "Cerebellum",
    function: "Balance & Coordination",
    position: { x: 0, y: -90, z: -30 },
  },
}

const NEUROTRANSMITTERS = {
  dopamine: { color: 0xff6b6b, name: "Dopamine", speed: 1.2 },
  serotonin: { color: 0x4ecdc4, name: "Serotonin", speed: 0.8 },
  acetylcholine: { color: 0x45b7d1, name: "Acetylcholine", speed: 1.5 },
  gaba: { color: 0x96ceb4, name: "GABA", speed: 0.6 },
  glutamate: { color: 0xfeca57, name: "Glutamate", speed: 1.8 },
}

export default function InteractiveBrain() {
  const { theme, resolvedTheme } = useTheme()
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    neurons: NeuronData[]
    synapses: Synapse[]
    activePulses: NeuralPulse[]
    brainWaves: BrainWave[]
    neuronMeshes: THREE.Points
    synapseMeshes: THREE.Points
    pulseMeshes: THREE.Points
    brainGroup: THREE.Group
    raycaster: THREE.Raycaster
    mouse: THREE.Vector2
  } | null>(null)

  const [zoomLevel, setZoomLevel] = useState([300])
  const [focusedRegion, setFocusedRegion] = useState<string | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const [neuralActivity, setNeuralActivity] = useState([0.5])
  const [brainwaveType, setBrainwaveType] = useState<"alpha" | "beta" | "gamma" | "theta" | "delta">("alpha")
  const [showSynapses, setShowSynapses] = useState(true)
  const [showNeurotransmitters, setShowNeurotransmitters] = useState(true)
  const [plasticityMode, setPlasticityMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Get theme-appropriate colors
  const getThemeColors = () => {
    const isDark = resolvedTheme === "dark"
    return {
      background: isDark ? 0x0a0a0a : 0xf8fafc,
      synapses: isDark ? 0x2c3e50 : 0x7f8c8d,
      synapseOpacity: isDark ? 0.15 : 0.25,
      neurons: isDark ? 1.0 : 0.8,
    }
  }

  useEffect(() => {
    if (!mountRef.current || !mounted) return

    const themeColors = getThemeColors()
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })

    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(themeColors.background, 1)
    mountRef.current.appendChild(renderer.domElement)

    camera.position.z = 300

    const brainGroup = new THREE.Group()
    scene.add(brainGroup)

    const raycaster = new THREE.Raycaster()
    raycaster.params.Points!.threshold = 8
    const mouse = new THREE.Vector2()

    // Enhanced neural network generation
    const neurons: NeuronData[] = []
    const synapses: Synapse[] = []
    const activePulses: NeuralPulse[] = []
    const brainWaves: BrainWave[] = []

    // Initialize brainwaves
    Object.keys(["alpha", "beta", "gamma", "theta", "delta"]).forEach((type, index) => {
      brainWaves.push({
        frequency: [8, 15, 30, 6, 3][index],
        amplitude: Math.random() * 0.5 + 0.3,
        phase: Math.random() * Math.PI * 2,
        type: type as any,
      })
    })

    // Generate anatomically accurate neurons
    const neuronCount = 6000
    const neuronPositions: number[] = []
    const neuronColors: number[] = []
    const neuronSizes: number[] = []

    Object.entries(BRAIN_REGIONS).forEach(([regionKey, region]) => {
      const regionNeuronCount = Math.floor(neuronCount / Object.keys(BRAIN_REGIONS).length)

      for (let i = 0; i < regionNeuronCount; i++) {
        // Create region-specific neuron distribution
        const pos = new THREE.Vector3(
          region.position.x + (Math.random() - 0.5) * 80,
          region.position.y + (Math.random() - 0.5) * 60,
          region.position.z + (Math.random() - 0.5) * 40,
        )

        // Add anatomical variation
        if (regionKey === "CEREBELLUM") {
          pos.y -= 20
          pos.z -= 10
        } else if (regionKey === "HIPPOCAMPUS") {
          // Curved hippocampal structure
          const angle = (i / regionNeuronCount) * Math.PI
          pos.x += Math.cos(angle) * 15
          pos.z += Math.sin(angle) * 10
        }

        // Determine neuron type based on region
        let neuronType: NeuronData["neuronType"] = "pyramidal"
        if (regionKey === "MOTOR_CORTEX") neuronType = "motor"
        else if (regionKey === "SOMATOSENSORY") neuronType = "sensory"
        else if (regionKey === "BRAINSTEM") neuronType = "dopaminergic"
        else if (Math.random() < 0.2) neuronType = "interneuron"

        const neuron: NeuronData = {
          position: pos,
          region: regionKey,
          neuronType,
          color: region.color,
          connections: [],
          activity: Math.random() * 0.3,
          threshold: 0.7 + Math.random() * 0.2,
          refractory: 0,
          plasticity: Math.random(),
        }

        neurons.push(neuron)
        neuronPositions.push(pos.x, pos.y, pos.z)

        const color = new THREE.Color(region.color)
        neuronColors.push(color.r, color.g, color.b)

        // Size based on neuron type
        const size =
          neuronType === "pyramidal" ? 1.2 : neuronType === "motor" ? 1.5 : neuronType === "interneuron" ? 0.8 : 1.0
        neuronSizes.push(size)
      }
    })

    // Create realistic synaptic connections
    neurons.forEach((neuron, index) => {
      const connectionCount = Math.floor(Math.random() * 8) + 3

      for (let i = 0; i < connectionCount; i++) {
        // Prefer connections within same region or nearby regions
        const candidates = neurons.filter((other, otherIndex) => {
          if (otherIndex === index) return false
          const distance = neuron.position.distanceTo(other.position)
          const sameRegion = neuron.region === other.region
          return distance < (sameRegion ? 60 : 40)
        })

        if (candidates.length > 0) {
          const target = candidates[Math.floor(Math.random() * candidates.length)]
          const targetIndex = neurons.indexOf(target)

          if (!neuron.connections.includes(targetIndex)) {
            neuron.connections.push(targetIndex)

            // Create synapse
            const midpoint = new THREE.Vector3().addVectors(neuron.position, target.position).multiplyScalar(0.5)

            const neurotransmitterTypes = Object.keys(NEUROTRANSMITTERS) as Array<keyof typeof NEUROTRANSMITTERS>
            const neurotransmitter = neurotransmitterTypes[Math.floor(Math.random() * neurotransmitterTypes.length)]

            synapses.push({
              presynaptic: index,
              postsynaptic: targetIndex,
              weight: Math.random() * 0.8 + 0.2,
              neurotransmitter,
              position: midpoint,
            })
          }
        }
      }
    })

    // Create neuron visualization
    const neuronGeometry = new THREE.BufferGeometry()
    neuronGeometry.setAttribute("position", new THREE.Float32BufferAttribute(neuronPositions, 3))
    neuronGeometry.setAttribute("color", new THREE.Float32BufferAttribute(neuronColors, 3))
    neuronGeometry.setAttribute("size", new THREE.Float32BufferAttribute(neuronSizes, 1))

    const neuronMaterial = new THREE.PointsMaterial({
      size: 1.0,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: themeColors.neurons,
      sizeAttenuation: true,
    })

    const neuronMeshes = new THREE.Points(neuronGeometry, neuronMaterial)
    brainGroup.add(neuronMeshes)

    // Create synapse visualization
    const synapsePositions: number[] = []
    const synapseColors: number[] = []

    synapses.forEach((synapse) => {
      synapsePositions.push(synapse.position.x, synapse.position.y, synapse.position.z)
      const ntColor = new THREE.Color(NEUROTRANSMITTERS[synapse.neurotransmitter].color)
      synapseColors.push(ntColor.r, ntColor.g, ntColor.b)
    })

    const synapseGeometry = new THREE.BufferGeometry()
    synapseGeometry.setAttribute("position", new THREE.Float32BufferAttribute(synapsePositions, 3))
    synapseGeometry.setAttribute("color", new THREE.Float32BufferAttribute(synapseColors, 3))

    const synapseMaterial = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    })

    const synapseMeshes = new THREE.Points(synapseGeometry, synapseMaterial)
    brainGroup.add(synapseMeshes)

    // Create neural pathway connections
    const connectionPositions: number[] = []
    synapses.forEach((synapse) => {
      const preNeuron = neurons[synapse.presynaptic]
      const postNeuron = neurons[synapse.postsynaptic]
      connectionPositions.push(...preNeuron.position.toArray(), ...postNeuron.position.toArray())
    })

    const connectionGeometry = new THREE.BufferGeometry()
    connectionGeometry.setAttribute("position", new THREE.Float32BufferAttribute(connectionPositions, 3))
    const connectionMaterial = new THREE.LineBasicMaterial({
      color: themeColors.synapses,
      transparent: true,
      opacity: themeColors.synapseOpacity,
    })
    const connections = new THREE.LineSegments(connectionGeometry, connectionMaterial)
    brainGroup.add(connections)

    // Create pulse system for neural signals
    const maxPulses = 500
    const pulseGeometry = new THREE.BufferGeometry()
    pulseGeometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(maxPulses * 3), 3))
    pulseGeometry.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(maxPulses * 3), 3))

    const pulseMaterial = new THREE.PointsMaterial({
      size: 2.5,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
    })

    const pulseMeshes = new THREE.Points(pulseGeometry, pulseMaterial)
    brainGroup.add(pulseMeshes)

    sceneRef.current = {
      scene,
      camera,
      renderer,
      neurons,
      synapses,
      activePulses,
      brainWaves,
      neuronMeshes,
      synapseMeshes,
      pulseMeshes,
      brainGroup,
      raycaster,
      mouse,
    }

    // Enhanced mouse interactions
    let isDragging = false
    let previousMousePosition = { x: 0, y: 0 }

    const onMouseDown = (event: MouseEvent) => {
      isDragging = true
      previousMousePosition = { x: event.clientX, y: event.clientY }
    }

    const onMouseMove = (event: MouseEvent) => {
      if (!isDragging) return

      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y,
      }

      brainGroup.rotation.y += deltaMove.x * 0.01
      brainGroup.rotation.x += deltaMove.y * 0.01

      previousMousePosition = { x: event.clientX, y: event.clientY }
    }

    const onMouseUp = () => {
      isDragging = false
    }

    const onMouseClick = (event: MouseEvent) => {
      if (isDragging) return

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObject(neuronMeshes)

      if (intersects.length > 0) {
        const clickedNeuronIndex = intersects[0].index!
        const clickedNeuron = neurons[clickedNeuronIndex]

        // Trigger neural cascade based on neuron type and region
        const cascadeStrength =
          clickedNeuron.neuronType === "motor" ? 2.0 : clickedNeuron.neuronType === "sensory" ? 1.5 : 1.0

        // Propagate through connected neurons
        const propagateSignal = (neuronIndex: number, strength: number, depth: number) => {
          if (depth > 3 || strength < 0.1) return

          const neuron = neurons[neuronIndex]
          neuron.connections.forEach((connectedIndex) => {
            const synapse = synapses.find((s) => s.presynaptic === neuronIndex && s.postsynaptic === connectedIndex)

            if (synapse && activePulses.length < maxPulses) {
              const ntData = NEUROTRANSMITTERS[synapse.neurotransmitter]
              activePulses.push({
                start: neuronIndex,
                end: connectedIndex,
                progress: 0,
                strength: strength * synapse.weight,
                neurotransmitter: synapse.neurotransmitter,
                color: ntData.color,
                speed: ntData.speed,
              })

              // Continue propagation
              setTimeout(() => {
                propagateSignal(connectedIndex, strength * 0.7, depth + 1)
              }, 100 / ntData.speed)
            }
          })
        }

        propagateSignal(clickedNeuronIndex, cascadeStrength, 0)
      }
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const delta = event.deltaY > 0 ? 20 : -20
      const newZoom = Math.max(100, Math.min(800, camera.position.z + delta))
      camera.position.z = newZoom
      setZoomLevel([newZoom])
    }

    renderer.domElement.addEventListener("mousedown", onMouseDown)
    renderer.domElement.addEventListener("mousemove", onMouseMove)
    renderer.domElement.addEventListener("mouseup", onMouseUp)
    renderer.domElement.addEventListener("click", onMouseClick)
    renderer.domElement.addEventListener("wheel", onWheel)

    // Enhanced animation loop
    const animate = () => {
      requestAnimationFrame(animate)

      const time = Date.now() * 0.001

      // Auto rotation
      if (autoRotate) {
        brainGroup.rotation.y += 0.0003
      }

      // Update brainwaves
      brainWaves.forEach((wave) => {
        wave.phase += wave.frequency * 0.01
        if (wave.type === brainwaveType) {
          wave.amplitude = Math.min(1.0, wave.amplitude + 0.01)
        } else {
          wave.amplitude = Math.max(0.1, wave.amplitude - 0.005)
        }
      })

      // Update neural activity based on brainwaves
      const activeWave = brainWaves.find((w) => w.type === brainwaveType)
      if (activeWave) {
        const waveInfluence = Math.sin(activeWave.phase) * activeWave.amplitude * neuralActivity[0]

        neurons.forEach((neuron, index) => {
          // Update neuron activity
          neuron.activity += (Math.random() - 0.5) * 0.02 + waveInfluence * 0.01
          neuron.activity = Math.max(0, Math.min(1, neuron.activity))

          // Handle refractory period
          if (neuron.refractory > 0) {
            neuron.refractory -= 0.02
          }

          // Spontaneous firing based on activity
          if (neuron.activity > neuron.threshold && neuron.refractory <= 0 && Math.random() < 0.001) {
            neuron.refractory = 0.5

            // Create spontaneous pulses
            neuron.connections.slice(0, 3).forEach((targetIndex) => {
              if (activePulses.length < maxPulses) {
                const synapse = synapses.find((s) => s.presynaptic === index && s.postsynaptic === targetIndex)
                if (synapse) {
                  const ntData = NEUROTRANSMITTERS[synapse.neurotransmitter]
                  activePulses.push({
                    start: index,
                    end: targetIndex,
                    progress: 0,
                    strength: neuron.activity * synapse.weight,
                    neurotransmitter: synapse.neurotransmitter,
                    color: ntData.color,
                    speed: ntData.speed,
                  })
                }
              }
            })
          }
        })
      }

      // Update neural pulses
      const pulsePositions = pulseMeshes.geometry.attributes.position
      const pulseColors = pulseMeshes.geometry.attributes.color
      let activePulseCount = 0

      for (let i = activePulses.length - 1; i >= 0; i--) {
        const pulse = activePulses[i]
        pulse.progress += pulse.speed * 0.02

        if (pulse.progress >= 1) {
          // Pulse reached target - trigger plasticity
          const targetNeuron = neurons[pulse.end]
          targetNeuron.activity += pulse.strength * 0.1

          if (plasticityMode) {
            const synapse = synapses.find((s) => s.presynaptic === pulse.start && s.postsynaptic === pulse.end)
            if (synapse) {
              synapse.weight = Math.min(1.0, synapse.weight + 0.01) // Hebbian learning
            }
          }

          activePulses.splice(i, 1)
          continue
        }

        const startPos = neurons[pulse.start].position
        const endPos = neurons[pulse.end].position
        const currentPos = new THREE.Vector3().lerpVectors(startPos, endPos, pulse.progress)

        pulsePositions.setXYZ(activePulseCount, currentPos.x, currentPos.y, currentPos.z)

        const color = new THREE.Color(pulse.color)
        const intensity = pulse.strength * (1 - pulse.progress * 0.5)
        pulseColors.setXYZ(activePulseCount, color.r * intensity, color.g * intensity, color.b * intensity)

        activePulseCount++
      }

      pulseMeshes.geometry.setDrawRange(0, activePulseCount)
      pulsePositions.needsUpdate = true
      pulseColors.needsUpdate = true

      // Update neuron colors based on activity
      const neuronColors = neuronMeshes.geometry.attributes.color
      neurons.forEach((neuron, index) => {
        const baseColor = new THREE.Color(neuron.color)
        const activity = neuron.activity
        const brightness = 0.5 + activity * 0.5

        neuronColors.setXYZ(index, baseColor.r * brightness, baseColor.g * brightness, baseColor.b * brightness)
      })
      neuronColors.needsUpdate = true

      // Update synapse visibility
      synapseMeshes.visible = showSynapses
      connections.visible = showSynapses

      renderer.render(scene, camera)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      renderer.domElement.removeEventListener("mousedown", onMouseDown)
      renderer.domElement.removeEventListener("mousemove", onMouseMove)
      renderer.domElement.removeEventListener("mouseup", onMouseUp)
      renderer.domElement.removeEventListener("click", onMouseClick)
      renderer.domElement.removeEventListener("wheel", onWheel)

      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [resolvedTheme, mounted, neuralActivity, brainwaveType, showSynapses, plasticityMode])

  if (!mounted) {
    return (
      <div className="w-full h-screen neural-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 neural-text-secondary">Initializing Neural Networks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen neural-bg-primary theme-transition">
      <div ref={mountRef} className="w-full h-full" />

      {/* Enhanced Info Panel */}
      <div className="absolute top-4 left-4 w-80 neural-bg-secondary/90 backdrop-blur-sm rounded-lg neural-border p-4 neural-text-primary theme-transition neural-shadow">
        <h1 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Human Neural Network
        </h1>
        <p className="text-sm neural-text-secondary mb-4">
          Anatomically accurate brain simulation with realistic neural pathways and neurotransmitter systems.
        </p>

        <div className="space-y-3">
          <div className="text-xs font-semibold neural-text-primary mb-2">Brain Regions:</div>
          {Object.entries(BRAIN_REGIONS)
            .slice(0, 5)
            .map(([key, region]) => (
              <div key={key} className="flex items-center gap-3 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: `#${region.color.toString(16)}` }}
                ></div>
                <div className="flex-1">
                  <div className="font-medium">{region.name}</div>
                  <div className="neural-text-secondary text-xs">{region.function}</div>
                </div>
              </div>
            ))}

          <div className="pt-2 border-t neural-border">
            <div className="text-xs font-semibold neural-text-primary mb-2">Neurotransmitters:</div>
            {Object.entries(NEUROTRANSMITTERS)
              .slice(0, 3)
              .map(([key, nt]) => (
                <div key={key} className="flex items-center gap-3 text-xs mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `#${nt.color.toString(16)}` }}></div>
                  <span className="capitalize">{nt.name}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Advanced Control Panel */}
      <div className="absolute top-4 right-4 w-80">
        <Card className="neural-bg-secondary/90 backdrop-blur-sm neural-border theme-transition neural-shadow">
          <CardHeader>
            <CardTitle className="neural-text-primary flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Neural Control Center
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Zoom Control */}
            <div>
              <label className="neural-text-primary text-sm mb-2 block flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Camera Zoom
              </label>
              <Slider
                value={zoomLevel}
                onValueChange={(value) => {
                  setZoomLevel(value)
                  if (sceneRef.current) {
                    sceneRef.current.camera.position.z = value[0]
                  }
                }}
                max={800}
                min={100}
                step={20}
                className="w-full"
              />
              <span className="neural-text-secondary text-xs">{zoomLevel[0]}px</span>
            </div>

            {/* Neural Activity */}
            <div>
              <label className="neural-text-primary text-sm mb-2 block flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Neural Activity Level
              </label>
              <Slider
                value={neuralActivity}
                onValueChange={setNeuralActivity}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
              <span className="neural-text-secondary text-xs">{(neuralActivity[0] * 100).toFixed(0)}%</span>
            </div>

            {/* Brainwave Type */}
            <div>
              <label className="neural-text-primary text-sm mb-2 block flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Brainwave Pattern
              </label>
              <div className="grid grid-cols-5 gap-1">
                {(["alpha", "beta", "gamma", "theta", "delta"] as const).map((wave) => (
                  <Button
                    key={wave}
                    onClick={() => setBrainwaveType(wave)}
                    variant={brainwaveType === wave ? "default" : "outline"}
                    size="sm"
                    className="text-xs theme-transition"
                  >
                    {wave.charAt(0).toUpperCase()}
                  </Button>
                ))}
              </div>
              <div className="text-xs neural-text-secondary mt-1">
                {brainwaveType === "alpha" && "Relaxed awareness (8-13 Hz)"}
                {brainwaveType === "beta" && "Active thinking (13-30 Hz)"}
                {brainwaveType === "gamma" && "High-level cognition (30+ Hz)"}
                {brainwaveType === "theta" && "Deep meditation (4-8 Hz)"}
                {brainwaveType === "delta" && "Deep sleep (0.5-4 Hz)"}
              </div>
            </div>

            {/* Quick Controls */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => {
                  const newZoom = Math.max(100, zoomLevel[0] - 100)
                  setZoomLevel([newZoom])
                  if (sceneRef.current) {
                    sceneRef.current.camera.position.z = newZoom
                  }
                }}
                variant="outline"
                size="sm"
                className="neural-bg-tertiary neural-border theme-transition"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => {
                  const newZoom = Math.min(800, zoomLevel[0] + 100)
                  setZoomLevel([newZoom])
                  if (sceneRef.current) {
                    sceneRef.current.camera.position.z = newZoom
                  }
                }}
                variant="outline"
                size="sm"
                className="neural-bg-tertiary neural-border theme-transition"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
            </div>

            {/* Advanced Features */}
            <div className="space-y-2">
              <Button
                onClick={() => setAutoRotate(!autoRotate)}
                variant={autoRotate ? "default" : "outline"}
                size="sm"
                className="w-full theme-transition"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Auto Rotate
              </Button>

              <Button
                onClick={() => setShowSynapses(!showSynapses)}
                variant={showSynapses ? "default" : "outline"}
                size="sm"
                className="w-full theme-transition"
              >
                Show Synapses
              </Button>

              <Button
                onClick={() => setPlasticityMode(!plasticityMode)}
                variant={plasticityMode ? "default" : "outline"}
                size="sm"
                className="w-full theme-transition"
              >
                Plasticity Mode
              </Button>
            </div>

            {/* Region Focus */}
            <div>
              <label className="neural-text-primary text-sm mb-2 block">Focus Region</label>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(BRAIN_REGIONS)
                  .slice(0, 6)
                  .map(([key, region]) => (
                    <Button
                      key={key}
                      onClick={() => {
                        setFocusedRegion(focusedRegion === key ? null : key)
                        if (sceneRef.current && focusedRegion !== key) {
                          const pos = region.position
                          sceneRef.current.camera.position.set(pos.x + 100, pos.y + 50, pos.z + 100)
                          sceneRef.current.camera.lookAt(pos.x, pos.y, pos.z)
                        } else if (sceneRef.current) {
                          sceneRef.current.camera.position.set(0, 0, zoomLevel[0])
                          sceneRef.current.camera.lookAt(0, 0, 0)
                        }
                      }}
                      variant={focusedRegion === key ? "default" : "outline"}
                      size="sm"
                      className="text-xs theme-transition"
                      style={{
                        backgroundColor: focusedRegion === key ? `#${region.color.toString(16)}40` : undefined,
                      }}
                    >
                      {region.name.split(" ")[0].slice(0, 4)}
                    </Button>
                  ))}
              </div>
            </div>

            <div className="text-xs neural-text-secondary space-y-1">
              <div>• Click neurons to trigger cascades</div>
              <div>• Drag to rotate the brain</div>
              <div>• Scroll to zoom in/out</div>
              <div>• Watch synaptic plasticity in action</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Display */}
      <div className="absolute bottom-4 left-4 neural-bg-secondary/80 backdrop-blur-sm rounded-lg neural-border p-4 neural-text-primary theme-transition">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Neural Status
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Active Neurons:</span>
            <span className="font-mono">{sceneRef.current?.neurons.filter((n) => n.activity > 0.5).length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Active Pulses:</span>
            <span className="font-mono">{sceneRef.current?.activePulses.length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Brainwave:</span>
            <span className="font-mono capitalize">{brainwaveType}</span>
          </div>
          <div className="flex justify-between">
            <span>Plasticity:</span>
            <span className={`font-mono ${plasticityMode ? "text-green-400" : "text-gray-400"}`}>
              {plasticityMode ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 neural-text-secondary text-center theme-transition">
        <p>Click neurons to stimulate • Drag to rotate • Scroll to zoom • Experience realistic neural dynamics</p>
      </div>
    </div>
  )
}
