"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Focus } from "lucide-react"

export default function ConvolutionalNetwork() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [currentLayer, setCurrentLayer] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [zoomLevel, setZoomLevel] = useState([20])
  const [featureMapFocus, setFeatureMapFocus] = useState<number | null>(null)
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    layerMeshes: THREE.Group[]
  } | null>(null)

  const layers = [
    { name: "Input", size: [28, 28, 1], type: "input" },
    { name: "Conv2D", size: [26, 26, 32], type: "conv", kernel: 3 },
    { name: "MaxPool", size: [13, 13, 32], type: "pool" },
    { name: "Conv2D", size: [11, 11, 64], type: "conv", kernel: 3 },
    { name: "MaxPool", size: [5, 5, 64], type: "pool" },
    { name: "Flatten", size: [1600, 1, 1], type: "flatten" },
    { name: "Dense", size: [128, 1, 1], type: "dense" },
    { name: "Output", size: [10, 1, 1], type: "output" },
  ]

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x0a0a0a, 1)
    mountRef.current.appendChild(renderer.domElement)

    camera.position.set(0, 0, zoomLevel[0])

    // Create layer visualizations
    const layerMeshes: THREE.Group[] = []

    layers.forEach((layer, index) => {
      const group = new THREE.Group()
      const [width, height, depth] = layer.size

      if (layer.type === "input" || layer.type === "conv" || layer.type === "pool") {
        // Create feature maps as planes
        const featureMaps = Math.min(depth, 8) // Limit visualization

        for (let i = 0; i < featureMaps; i++) {
          const geometry = new THREE.PlaneGeometry(Math.log(width + 1) * 0.5, Math.log(height + 1) * 0.5)

          const material = new THREE.MeshBasicMaterial({
            color: layer.type === "input" ? 0x4a90e2 : layer.type === "conv" ? 0xe24a4a : 0x4ae24a,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
          })

          const mesh = new THREE.Mesh(geometry, material)
          mesh.position.z = i * 0.1 - featureMaps * 0.05
          group.add(mesh)
        }
      } else {
        // Create dense layers as spheres
        const neuronCount = Math.min(width, 20)

        for (let i = 0; i < neuronCount; i++) {
          const geometry = new THREE.SphereGeometry(0.1, 8, 8)
          const material = new THREE.MeshBasicMaterial({
            color: layer.type === "output" ? 0xe2e24a : 0x4ae2e2,
            transparent: true,
            opacity: 0.8,
          })

          const mesh = new THREE.Mesh(geometry, material)
          mesh.position.y = (i - neuronCount / 2) * 0.3
          group.add(mesh)
        }
      }

      group.position.x = (index - layers.length / 2) * 4
      group.visible = index === currentLayer
      scene.add(group)
      layerMeshes.push(group)
    })

    // Animation loop
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)

      // Rotate current layer
      if (layerMeshes[currentLayer]) {
        layerMeshes[currentLayer].rotation.y += 0.01
      }

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

    sceneRef.current = { scene, camera, renderer, layerMeshes }

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationId)
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
      sceneRef.current = null
    }
  }, [currentLayer, zoomLevel])

  const processImage = async () => {
    setIsProcessing(true)

    for (let i = 0; i < layers.length; i++) {
      setCurrentLayer(i)
      await new Promise((resolve) => setTimeout(resolve, 800))
    }

    setIsProcessing(false)
  }

  return (
    <div className="relative w-full h-screen bg-gray-900">
      <div ref={mountRef} className="w-full h-full" />

      {/* Control Panel */}
      <div className="absolute top-4 right-4 w-80">
        <Card className="bg-black/40 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Convolutional Network</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-white">
              <div className="text-sm text-gray-400 mb-2">Current Layer</div>
              <div className="text-lg font-bold">{layers[currentLayer].name}</div>
              <div className="text-sm text-gray-400">Shape: {layers[currentLayer].size.join(" × ")}</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-white text-sm mb-2 block">Zoom Level</label>
                <Slider
                  value={zoomLevel}
                  onValueChange={(value) => {
                    setZoomLevel(value)
                    if (sceneRef.current) {
                      sceneRef.current.camera.position.z = value[0]
                    }
                  }}
                  max={50}
                  min={5}
                  step={2}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-white text-sm mb-2 block">Layer Focus</label>
                <div className="grid grid-cols-4 gap-1">
                  {layers.map((layer, index) => (
                    <Button
                      key={index}
                      onClick={() => {
                        setCurrentLayer(index)
                        if (sceneRef.current) {
                          const layerX = (index - layers.length / 2) * 4
                          sceneRef.current.camera.position.x = layerX
                          sceneRef.current.camera.position.z = 10
                          sceneRef.current.camera.lookAt(layerX, 0, 0)
                        }
                      }}
                      variant={currentLayer === index ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                    >
                      {layer.name.slice(0, 4)}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => {
                  if (sceneRef.current) {
                    sceneRef.current.camera.position.set(0, 0, zoomLevel[0])
                    sceneRef.current.camera.lookAt(0, 0, 0)
                  }
                }}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Focus className="w-4 h-4 mr-2" />
                Reset Camera
              </Button>
            </div>

            <div className="space-y-2">
              <Button onClick={processImage} disabled={isProcessing} className="w-full">
                {isProcessing ? "Processing..." : "Process Image"}
              </Button>

              <div className="grid grid-cols-4 gap-1">
                {layers.map((_, index) => (
                  <Button
                    key={index}
                    onClick={() => setCurrentLayer(index)}
                    variant={currentLayer === index ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <div>Task: Image Classification</div>
              <div>Input: 28×28 grayscale</div>
              <div>Output: 10 classes</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Layer Info */}
      <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 p-4 text-white">
        <h3 className="font-semibold mb-2">Layer Details</h3>
        <div className="space-y-2 text-sm">
          <div>
            <strong>Type:</strong> {layers[currentLayer].type.toUpperCase()}
          </div>
          <div>
            <strong>Shape:</strong> {layers[currentLayer].size.join(" × ")}
          </div>
          {layers[currentLayer].kernel && (
            <div>
              <strong>Kernel:</strong> {layers[currentLayer].kernel}×{layers[currentLayer].kernel}
            </div>
          )}
          <div className="mt-2 text-xs text-gray-400">
            {layers[currentLayer].type === "conv" && "Extracts features using convolution"}
            {layers[currentLayer].type === "pool" && "Reduces spatial dimensions"}
            {layers[currentLayer].type === "dense" && "Fully connected layer"}
            {layers[currentLayer].type === "input" && "Raw image data"}
            {layers[currentLayer].type === "output" && "Classification probabilities"}
          </div>
        </div>
      </div>
    </div>
  )
}
