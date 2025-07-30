"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"

export default function RecurrentNetwork() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [timeStep, setTimeStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [sequence] = useState(["Hello", "world", "this", "is", "RNN"])
  const [zoomLevel, setZoomLevel] = useState([15])
  const [temporalView, setTemporalView] = useState(false)
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
  } | null>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })

    sceneRef.current = { scene, camera }

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x0a0a0a, 1)
    mountRef.current.appendChild(renderer.domElement)

    camera.position.set(0, 0, zoomLevel[0])

    // Create RNN cell structure
    const cellGroup = new THREE.Group()

    // Hidden state
    const hiddenGeometry = new THREE.BoxGeometry(2, 1, 0.5)
    const hiddenMaterial = new THREE.MeshBasicMaterial({
      color: 0x4a90e2,
      transparent: true,
      opacity: 0.8,
    })
    const hiddenState = new THREE.Mesh(hiddenGeometry, hiddenMaterial)
    hiddenState.position.set(0, 1, 0)
    cellGroup.add(hiddenState)

    // Input
    const inputGeometry = new THREE.SphereGeometry(0.3, 16, 16)
    const inputMaterial = new THREE.MeshBasicMaterial({
      color: 0xe24a4a,
      transparent: true,
      opacity: 0.8,
    })
    const inputNode = new THREE.Mesh(inputGeometry, inputMaterial)
    inputNode.position.set(-3, 0, 0)
    cellGroup.add(inputNode)

    // Output
    const outputGeometry = new THREE.SphereGeometry(0.3, 16, 16)
    const outputMaterial = new THREE.MeshBasicMaterial({
      color: 0x4ae24a,
      transparent: true,
      opacity: 0.8,
    })
    const outputNode = new THREE.Mesh(outputGeometry, outputMaterial)
    outputNode.position.set(3, 0, 0)
    cellGroup.add(outputNode)

    // Create connections
    const connections: THREE.Line[] = []

    // Input to hidden
    const inputToHidden = new THREE.BufferGeometry().setFromPoints([inputNode.position, hiddenState.position])
    const inputLine = new THREE.Line(inputToHidden, new THREE.LineBasicMaterial({ color: 0x666666 }))
    cellGroup.add(inputLine)
    connections.push(inputLine)

    // Hidden to output
    const hiddenToOutput = new THREE.BufferGeometry().setFromPoints([hiddenState.position, outputNode.position])
    const outputLine = new THREE.Line(hiddenToOutput, new THREE.LineBasicMaterial({ color: 0x666666 }))
    cellGroup.add(outputLine)
    connections.push(outputLine)

    // Recurrent connection (hidden to hidden)
    const recurrentStart = new THREE.Vector3(1, 1.5, 0)
    const recurrentEnd = new THREE.Vector3(-1, 1.5, 0)
    const recurrentGeometry = new THREE.BufferGeometry().setFromPoints([recurrentStart, recurrentEnd])
    const recurrentLine = new THREE.Line(
      recurrentGeometry,
      new THREE.LineBasicMaterial({
        color: 0xffaa00,
        linewidth: 3,
      }),
    )
    cellGroup.add(recurrentLine)
    connections.push(recurrentLine)

    scene.add(cellGroup)

    // Create time step visualization
    const timeSteps: THREE.Group[] = []
    for (let i = 0; i < sequence.length; i++) {
      const stepGroup = new THREE.Group()

      // Create smaller version of the cell
      const miniCell = cellGroup.clone()
      miniCell.scale.set(0.3, 0.3, 0.3)
      miniCell.position.set((i - sequence.length / 2) * 2, -4, 0)

      stepGroup.add(miniCell)
      scene.add(stepGroup)
      timeSteps.push(stepGroup)
    }

    // Animation loop
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)

      // Animate main cell
      cellGroup.rotation.y += 0.005

      // Highlight current time step
      timeSteps.forEach((step, index) => {
        const opacity = index === timeStep ? 1.0 : 0.3
        step.children.forEach((child) => {
          if (child instanceof THREE.Mesh) {
            ;(child.material as THREE.MeshBasicMaterial).opacity = opacity
          }
        })
      })

      // Animate connections based on time step
      connections.forEach((connection, index) => {
        const material = connection.material as THREE.LineBasicMaterial
        material.opacity = 0.5 + 0.5 * Math.sin(Date.now() * 0.005 + index)
      })

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
      cancelAnimationFrame(animationId)
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [timeStep, zoomLevel])

  const playSequence = () => {
    setIsPlaying(true)
    let step = 0

    const interval = setInterval(() => {
      setTimeStep(step)
      step++

      if (step >= sequence.length) {
        step = 0
        setIsPlaying(false)
        clearInterval(interval)
      }
    }, 1000)
  }

  return (
    <div className="relative w-full h-screen bg-gray-900">
      <div ref={mountRef} className="w-full h-full" />

      {/* Control Panel */}
      <div className="absolute top-4 right-4 w-80">
        <Card className="bg-black/40 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Recurrent Network</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-white">
              <div className="text-sm text-gray-400 mb-2">Current Input</div>
              <div className="text-2xl font-bold">{sequence[timeStep] || "None"}</div>
              <div className="text-sm text-gray-400">
                Time Step: {timeStep + 1} / {sequence.length}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-white text-sm mb-2 block">Camera Distance</label>
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

              <Button
                onClick={() => {
                  setTemporalView(!temporalView)
                  if (sceneRef.current) {
                    if (!temporalView) {
                      // Switch to temporal view showing all time steps
                      sceneRef.current.camera.position.set(0, -2, 20)
                      sceneRef.current.camera.lookAt(0, -4, 0)
                    } else {
                      // Return to main cell view
                      sceneRef.current.camera.position.set(0, 0, zoomLevel[0])
                      sceneRef.current.camera.lookAt(0, 0, 0)
                    }
                  }
                }}
                variant={temporalView ? "default" : "outline"}
                className="w-full"
              >
                {temporalView ? "Cell View" : "Temporal View"}
              </Button>

              <div className="grid grid-cols-3 gap-1">
                <Button
                  onClick={() => {
                    if (sceneRef.current) {
                      sceneRef.current.camera.position.set(-5, 2, 10)
                      sceneRef.current.camera.lookAt(0, 0, 0)
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  Left
                </Button>
                <Button
                  onClick={() => {
                    if (sceneRef.current) {
                      sceneRef.current.camera.position.set(0, 5, 10)
                      sceneRef.current.camera.lookAt(0, 0, 0)
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  Top
                </Button>
                <Button
                  onClick={() => {
                    if (sceneRef.current) {
                      sceneRef.current.camera.position.set(5, 2, 10)
                      sceneRef.current.camera.lookAt(0, 0, 0)
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  Right
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Button onClick={playSequence} disabled={isPlaying} className="w-full">
                {isPlaying ? "Playing..." : "Play Sequence"}
              </Button>

              <div className="grid grid-cols-5 gap-1">
                {sequence.map((word, index) => (
                  <Button
                    key={index}
                    onClick={() => setTimeStep(index)}
                    variant={timeStep === index ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                  >
                    {word}
                  </Button>
                ))}
              </div>
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <div>Type: LSTM/GRU</div>
              <div>Task: Sequence Processing</div>
              <div>Hidden Size: 128</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network Info */}
      <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 p-4 text-white">
        <h3 className="font-semibold mb-2">RNN Components</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-400 rounded"></div>
            <span>Input (Current Token)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded"></div>
            <span>Hidden State (Memory)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded"></div>
            <span>Output (Prediction)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-2 bg-yellow-400"></div>
            <span>Recurrent Connection</span>
          </div>
        </div>
      </div>
    </div>
  )
}
