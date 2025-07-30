"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"

interface NetworkLayer {
  neurons: THREE.Vector3[]
  activations: number[]
  weights: number[][][]
}

export default function FeedforwardNetwork() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [isTraining, setIsTraining] = useState(false)
  const [learningRate, setLearningRate] = useState([0.1])
  const [epoch, setEpoch] = useState(0)
  const [loss, setLoss] = useState(0.5)
  const [zoomLevel, setZoomLevel] = useState([15])
  const [focusedLayer, setFocusedLayer] = useState<number | null>(null)

  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    layers: NetworkLayer[]
    neuronMeshes: THREE.Mesh[]
    connectionLines: THREE.Line[]
    activationPulses: THREE.Points[]
  } | null>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x0a0a0a, 1)
    mountRef.current.appendChild(renderer.domElement)

    camera.position.set(0, 0, 15)

    // Network architecture: 4 input, 6 hidden, 4 hidden, 2 output
    const layerSizes = [4, 6, 4, 2]
    const layers: NetworkLayer[] = []
    const neuronMeshes: THREE.Mesh[] = []
    const connectionLines: THREE.Line[] = []

    // Create layers
    layerSizes.forEach((size, layerIndex) => {
      const neurons: THREE.Vector3[] = []
      const activations: number[] = []
      const weights: number[][][] = []

      // Position neurons in layer
      const layerX = (layerIndex - layerSizes.length / 2 + 0.5) * 4
      const startY = (-(size - 1) * 0.8) / 2

      for (let i = 0; i < size; i++) {
        const position = new THREE.Vector3(layerX, startY + i * 0.8, 0)
        neurons.push(position)
        activations.push(Math.random())

        // Create neuron visual
        const geometry = new THREE.SphereGeometry(0.15, 16, 16)
        const material = new THREE.MeshBasicMaterial({
          color: 0x4a90e2,
          transparent: true,
          opacity: 0.8,
        })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.copy(position)
        scene.add(mesh)
        neuronMeshes.push(mesh)

        // Initialize weights for connections to next layer
        if (layerIndex < layerSizes.length - 1) {
          const nextLayerWeights: number[][] = []
          for (let j = 0; j < layerSizes[layerIndex + 1]; j++) {
            nextLayerWeights.push([Math.random() * 2 - 1]) // Random weights between -1 and 1
          }
          weights.push(nextLayerWeights)
        }
      }

      layers.push({ neurons, activations, weights })
    })

    // Create connections
    for (let layerIndex = 0; layerIndex < layers.length - 1; layerIndex++) {
      const currentLayer = layers[layerIndex]
      const nextLayer = layers[layerIndex + 1]

      currentLayer.neurons.forEach((neuron, i) => {
        nextLayer.neurons.forEach((nextNeuron, j) => {
          const geometry = new THREE.BufferGeometry().setFromPoints([neuron, nextNeuron])
          const material = new THREE.LineBasicMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.3,
          })
          const line = new THREE.Line(geometry, material)
          scene.add(line)
          connectionLines.push(line)
        })
      })
    }

    sceneRef.current = {
      scene,
      camera,
      renderer,
      layers,
      neuronMeshes,
      connectionLines,
      activationPulses: [],
    }

    // Animation loop
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)

      // Rotate the network slowly
      scene.rotation.y += 0.005

      // Update neuron colors based on activations
      neuronMeshes.forEach((mesh, index) => {
        const layerIndex = Math.floor(
          index /
            layerSizes.reduce((acc, size, i) => {
              if (i <= Math.floor(index / layerSizes.slice(0, i + 1).reduce((a, b) => a + b, 0))) {
                return i
              }
              return acc
            }, 0),
        )

        const neuronIndex = index % layerSizes[layerIndex]
        const activation = layers[layerIndex]?.activations[neuronIndex] || 0

        const material = mesh.material as THREE.MeshBasicMaterial
        material.color.setRGB(0.2 + activation * 0.8, 0.4 + activation * 0.4, 0.8)
        material.opacity = 0.5 + activation * 0.5
      })

      renderer.render(scene, camera)
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const delta = event.deltaY > 0 ? 1 : -1
      const newZoom = Math.max(5, Math.min(30, camera.position.z + delta))
      camera.position.z = newZoom
      setZoomLevel([newZoom])
    }

    renderer.domElement.addEventListener("wheel", handleWheel)

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
      renderer.domElement.removeEventListener("wheel", handleWheel)
      cancelAnimationFrame(animationId)
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  const forwardPass = () => {
    if (!sceneRef.current) return

    const { layers } = sceneRef.current

    // Simulate forward propagation
    layers.forEach((layer, layerIndex) => {
      if (layerIndex === 0) {
        // Input layer - random input
        layer.activations = layer.activations.map(() => Math.random())
      } else {
        // Hidden/output layers
        const prevLayer = layers[layerIndex - 1]
        layer.activations = layer.neurons.map((_, neuronIndex) => {
          let sum = 0
          prevLayer.activations.forEach((activation, prevNeuronIndex) => {
            const weight = prevLayer.weights[prevNeuronIndex]?.[neuronIndex]?.[0] || 0
            sum += activation * weight
          })
          return 1 / (1 + Math.exp(-sum)) // Sigmoid activation
        })
      }
    })
  }

  const startTraining = () => {
    setIsTraining(true)

    const trainingInterval = setInterval(() => {
      forwardPass()
      setEpoch((prev) => prev + 1)
      setLoss((prev) => Math.max(0.01, prev * 0.995)) // Simulate decreasing loss

      if (epoch > 100) {
        setIsTraining(false)
        clearInterval(trainingInterval)
      }
    }, 100)
  }

  const layerSizes = [4, 6, 4, 2]

  return (
    <div className="relative w-full h-screen bg-gray-900">
      <div ref={mountRef} className="w-full h-full" />

      {/* Control Panel */}
      <div className="absolute top-4 right-4 w-80">
        <Card className="bg-black/40 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Feedforward Network</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-white text-sm mb-2 block">Learning Rate</label>
              <Slider
                value={learningRate}
                onValueChange={setLearningRate}
                max={1}
                min={0.001}
                step={0.001}
                className="w-full"
              />
              <span className="text-gray-400 text-xs">{learningRate[0].toFixed(3)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-white">
              <div>
                <div className="text-sm text-gray-400">Epoch</div>
                <div className="text-xl font-bold">{epoch}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Loss</div>
                <div className="text-xl font-bold">{loss.toFixed(4)}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Button onClick={forwardPass} className="w-full bg-transparent" variant="outline">
                Forward Pass
              </Button>
              <Button onClick={startTraining} disabled={isTraining} className="w-full">
                {isTraining ? "Training..." : "Start Training"}
              </Button>
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <div>Architecture: 4-6-4-2</div>
              <div>Activation: Sigmoid</div>
              <div>Optimizer: SGD</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-white text-sm mb-2 block">Camera Zoom</label>
                <Slider
                  value={zoomLevel}
                  onValueChange={(value) => {
                    setZoomLevel(value)
                    if (sceneRef.current) {
                      sceneRef.current.camera.position.z = value[0]
                    }
                  }}
                  max={30}
                  min={5}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-white text-sm mb-2 block">Focus Layer</label>
                <div className="grid grid-cols-4 gap-1">
                  {layerSizes.map((_, index) => (
                    <Button
                      key={index}
                      onClick={() => {
                        setFocusedLayer(focusedLayer === index ? null : index)
                        if (sceneRef.current && focusedLayer !== index) {
                          const layerX = (index - layerSizes.length / 2 + 0.5) * 4
                          sceneRef.current.camera.position.x = layerX
                          sceneRef.current.camera.position.z = 8
                          sceneRef.current.camera.lookAt(layerX, 0, 0)
                        } else if (sceneRef.current) {
                          sceneRef.current.camera.position.x = 0
                          sceneRef.current.camera.position.z = zoomLevel[0]
                          sceneRef.current.camera.lookAt(0, 0, 0)
                        }
                      }}
                      variant={focusedLayer === index ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                    >
                      L{index + 1}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => {
                  if (sceneRef.current) {
                    sceneRef.current.camera.position.set(0, 0, zoomLevel[0])
                    sceneRef.current.camera.lookAt(0, 0, 0)
                    setFocusedLayer(null)
                  }
                }}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Reset View
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network Info */}
      <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 p-4 text-white">
        <h3 className="font-semibold mb-2">Layer Information</h3>
        <div className="space-y-1 text-sm">
          <div>Input Layer: 4 neurons</div>
          <div>Hidden Layer 1: 6 neurons</div>
          <div>Hidden Layer 2: 4 neurons</div>
          <div>Output Layer: 2 neurons</div>
        </div>
      </div>
    </div>
  )
}
