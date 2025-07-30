"use client"

import { useEffect, useRef, useState,useMemo} from "react"
import * as THREE from "three"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"

export default function TransformerNetwork() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [attentionStep, setAttentionStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const tokens = useMemo(() => ["The", "cat", "sat", "on", "the", "mat"], [])
  const [zoomLevel, setZoomLevel] = useState([12])
  const [focusedHead, setFocusedHead] = useState<number | null>(null)
  const [attentionScale, setAttentionScale] = useState([1])
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
  } | null>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const mountNode = mountRef.current

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x0a0a0a, 1)
    mountNode.appendChild(renderer.domElement)

    camera.position.set(0, 0, zoomLevel[0])
    camera.lookAt(0, 0, 0)

    sceneRef.current = { scene, camera }

    // Create token embeddings
    const tokenMeshes: THREE.Mesh[] = []
    const attentionLines: THREE.Line[] = []

    tokens.forEach((token, index) => {
      // Create token representation
      const geometry = new THREE.BoxGeometry(1.5, 0.3, 0.3)
      const material = new THREE.MeshBasicMaterial({
        color: 0x4a90e2,
        transparent: true,
        opacity: 0.8,
      })
      const mesh = new THREE.Mesh(geometry, material)

      const angle = (index / tokens.length) * Math.PI * 2
      const radius = 4
      mesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0)

      scene.add(mesh)
      tokenMeshes.push(mesh)
    })

    // Create attention connections
    for (let i = 0; i < tokens.length; i++) {
      for (let j = 0; j < tokens.length; j++) {
        if (i !== j) {
          const geometry = new THREE.BufferGeometry().setFromPoints([tokenMeshes[i].position, tokenMeshes[j].position])
          const material = new THREE.LineBasicMaterial({
            color: 0x666666,
            transparent: true,
            opacity: 0.1,
          })
          const line = new THREE.Line(geometry, material)
          scene.add(line)
          attentionLines.push(line)
        }
      }
    }

    // Create multi-head attention visualization
    const heads = 8
    const headColors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf7b801, 0x96ceb4, 0xfeca57, 0xff9ff3, 0x54a0ff]

    const headGroups: THREE.Group[] = []
    for (let h = 0; h < heads; h++) {
      const group = new THREE.Group()
      group.position.z = h * 0.5 - heads * 0.25

      // Create smaller attention connections for each head
      for (let i = 0; i < tokens.length; i++) {
        for (let j = 0; j < tokens.length; j++) {
          if (i !== j) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
              tokenMeshes[i].position,
              tokenMeshes[j].position,
            ])
            const material = new THREE.LineBasicMaterial({
              color: headColors[h],
              transparent: true,
              opacity: 0.05,
            })
            const line = new THREE.Line(geometry, material)
            group.add(line)
          }
        }
      }

      scene.add(group)
      headGroups.push(group)
    }

    // Animation loop
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)

      // Rotate the entire structure
      scene.rotation.z += 0.002

      // Highlight current attention focus
      tokenMeshes.forEach((mesh, index) => {
        const material = mesh.material as THREE.MeshBasicMaterial
        if (index === attentionStep) {
          material.color.setHex(0xff6b6b)
          material.opacity = 1.0
        } else {
          material.color.setHex(0x4a90e2)
          material.opacity = 0.6
        }
      })

      // Animate attention lines
      attentionLines.forEach((line, index) => {
        const material = line.material as THREE.LineBasicMaterial
        const sourceToken = Math.floor(index / (tokens.length - 1))

        if (sourceToken === attentionStep) {
          material.opacity = 0.8 * (0.5 + 0.5 * Math.sin(Date.now() * 0.01 + index)) * attentionScale[0]
          material.color.setHex(0xff6b6b)
        } else {
          material.opacity = 0.1 * attentionScale[0]
          material.color.setHex(0x666666)
        }
      })

      // Animate multi-head attention
      headGroups.forEach((group, headIndex) => {
        group.rotation.y += 0.001 * (headIndex + 1)

        group.children.forEach((line, lineIndex) => {
          const material = (line as THREE.Line).material as THREE.LineBasicMaterial
          const sourceToken = Math.floor(lineIndex / (tokens.length - 1))

          if (sourceToken === attentionStep) {
            material.opacity = 0.3 * (0.5 + 0.5 * Math.sin(Date.now() * 0.005 + lineIndex + headIndex))
          } else {
            material.opacity = 0.02
          }
        })
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

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationId)
      if (mountNode && renderer.domElement) {
        mountNode.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
      renderer.dispose()

  }, [attentionStep, zoomLevel, attentionScale, tokens])

  const animateAttention = () => {
    setIsAnimating(true)
    let step = 0

    const interval = setInterval(() => {
      setAttentionStep(step)
      step++

      if (step >= tokens.length) {
        step = 0
        setIsAnimating(false)
        clearInterval(interval)
      }
    }, 800)
  }

  return (
    <div className="relative w-full h-screen bg-gray-900">
      <div ref={mountRef} className="w-full h-full" />

      {/* Control Panel */}
      <div className="absolute top-4 right-4 w-80">
        <Card className="bg-black/40 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Transformer Network</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-white">
              <div className="text-sm text-gray-400 mb-2">Attending to Token</div>
              <div className="text-2xl font-bold">&quot;{tokens[attentionStep]}&quot;</div>
              <div className="text-sm text-gray-400">
                Position: {attentionStep + 1} / {tokens.length}
              </div>
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
                  max={25}
                  min={5}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-white text-sm mb-2 block">Attention Scale</label>
                <Slider
                  value={attentionScale}
                  onValueChange={setAttentionScale}
                  max={3}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-white text-sm mb-2 block">Focus Head</label>
                <div className="grid grid-cols-4 gap-1">
                  {Array.from({ length: 8 }, (_, i) => (
                    <Button
                      key={i}
                      onClick={() => {
                        setFocusedHead(focusedHead === i ? null : i)
                        if (sceneRef.current && focusedHead !== i) {
                          sceneRef.current.camera.position.z = i * 0.5 - 8 * 0.25 + 8
                          sceneRef.current.camera.lookAt(0, 0, i * 0.5 - 8 * 0.25)
                        }
                      }}
                      variant={focusedHead === i ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                    >
                      H{i + 1}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => {
                    if (sceneRef.current) {
                      sceneRef.current.camera.position.set(0, 8, 8)
                      sceneRef.current.camera.lookAt(0, 0, 0)
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  Top View
                </Button>
                <Button
                  onClick={() => {
                    if (sceneRef.current) {
                      sceneRef.current.camera.position.set(0, 0, zoomLevel[0])
                      sceneRef.current.camera.lookAt(0, 0, 0)
                      setFocusedHead(null)
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  Reset
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Button onClick={animateAttention} disabled={isAnimating} className="w-full">
                {isAnimating ? "Animating..." : "Animate Attention"}
              </Button>

              <div className="grid grid-cols-3 gap-1">
                {tokens.map((token, index) => (
                  <Button
                    key={index}
                    onClick={() => setAttentionStep(index)}
                    variant={attentionStep === index ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                  >
                    {token}
                  </Button>
                ))}
              </div>
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <div>Architecture: Multi-Head Attention</div>
              <div>Heads: 8</div>
              <div>Model Dim: 512</div>
              <div>Context Length: {tokens.length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attention Info */}
      <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 p-4 text-white">
        <h3 className="font-semibold mb-2">Attention Mechanism</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded"></div>
            <span>Token Embeddings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-400 rounded"></div>
            <span>Current Focus</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-gray-400"></div>
            <span>Attention Weights</span>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Each token attends to all other tokens with different weights
          </div>
        </div>
      </div>
    </div>
  )
}
