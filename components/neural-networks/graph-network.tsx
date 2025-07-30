"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"

interface GraphNode {
  id: number
  position: THREE.Vector3
  features: number[]
  color: number
  connections: number[]
}

export default function GraphNetwork() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [propagationStep, setPropagationStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const [zoomLevel, setZoomLevel] = useState([15])
  const [focusedNode, setFocusedNode] = useState<number | null>(null)
  const [neighborhoodView, setNeighborhoodView] = useState(false)

  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    nodes: GraphNode[]
    nodeMeshes: THREE.Mesh[]
    edgeMeshes: THREE.Line[]
    messages: THREE.Mesh[]
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

    // Create graph structure
    const nodes: GraphNode[] = []
    const nodeMeshes: THREE.Mesh[] = []
    const edgeMeshes: THREE.Line[] = []

    // Generate random graph
    const nodeCount = 20
    for (let i = 0; i < nodeCount; i++) {
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 2,
      )

      const node: GraphNode = {
        id: i,
        position,
        features: Array(4)
          .fill(0)
          .map(() => Math.random()),
        color: Math.random() > 0.5 ? 0x4a90e2 : 0xe24a4a,
        connections: [],
      }

      nodes.push(node)
    }

    // Create connections (edges)
    nodes.forEach((node, i) => {
      // Connect to nearby nodes
      nodes.forEach((otherNode, j) => {
        if (i !== j && node.position.distanceTo(otherNode.position) < 4) {
          node.connections.push(j)
        }
      })
    })

    // Create visual representation
    nodes.forEach((node, index) => {
      // Create node mesh
      const geometry = new THREE.SphereGeometry(0.2, 16, 16)
      const material = new THREE.MeshBasicMaterial({
        color: node.color,
        transparent: true,
        opacity: 0.8,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.copy(node.position)
      scene.add(mesh)
      nodeMeshes.push(mesh)

      // Create edges
      node.connections.forEach((connectionId) => {
        const targetNode = nodes[connectionId]
        const geometry = new THREE.BufferGeometry().setFromPoints([node.position, targetNode.position])
        const material = new THREE.LineBasicMaterial({
          color: 0x666666,
          transparent: true,
          opacity: 0.3,
        })
        const line = new THREE.Line(geometry, material)
        scene.add(line)
        edgeMeshes.push(line)
      })
    })

    // Create message passing visualization
    const messageGeometry = new THREE.SphereGeometry(0.05, 8, 8)
    const messageMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8,
    })

    const messages: THREE.Mesh[] = []
    for (let i = 0; i < 50; i++) {
      const message = new THREE.Mesh(messageGeometry, messageMaterial.clone())
      message.visible = false
      scene.add(message)
      messages.push(message)
    }

    sceneRef.current = {
      scene,
      camera,
      renderer,
      nodes,
      nodeMeshes,
      edgeMeshes,
      messages,
    }

    // Animation loop
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)

      // Rotate the graph
      scene.rotation.y += 0.003

      // Animate message passing
      let messageIndex = 0
      nodes.forEach((node, nodeIndex) => {
        const material = nodeMeshes[nodeIndex].material as THREE.MeshBasicMaterial

        if (nodeIndex === propagationStep) {
          material.opacity = 1.0
          material.color.setHex(0xffff00)

          // Show messages to connected nodes
          node.connections.forEach((connectionId, connIndex) => {
            if (messageIndex < messages.length) {
              const message = messages[messageIndex]
              const targetPos = nodes[connectionId].position
              const t = (Date.now() * 0.002 + connIndex) % 1

              message.position.lerpVectors(node.position, targetPos, t)
              message.visible = true
              messageIndex++
            }
          })
        } else {
          material.opacity = 0.6
          material.color.setHex(node.color)
        }
      })

      // Hide unused messages
      for (let i = messageIndex; i < messages.length; i++) {
        messages[i].visible = false
      }

      // Animate edges based on propagation
      edgeMeshes.forEach((edge, index) => {
        const material = edge.material as THREE.LineBasicMaterial
        material.opacity = 0.1 + 0.2 * Math.sin(Date.now() * 0.005 + index)
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
  }, [propagationStep])

  const startPropagation = () => {
    setIsAnimating(true)
    let step = 0

    const interval = setInterval(() => {
      setPropagationStep(step)
      step++

      if (step >= 20) {
        // Number of nodes
        step = 0
        setIsAnimating(false)
        clearInterval(interval)
      }
    }, 300)
  }

  return (
    <div className="relative w-full h-screen bg-gray-900">
      <div ref={mountRef} className="w-full h-full" />

      {/* Control Panel */}
      <div className="absolute top-4 right-4 w-80">
        <Card className="bg-black/40 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Graph Neural Network</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-white">
              <div className="text-sm text-gray-400 mb-2">Active Node</div>
              <div className="text-2xl font-bold">Node {propagationStep + 1}</div>
              <div className="text-sm text-gray-400">Message Passing Step</div>
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
                  max={30}
                  min={3}
                  step={1}
                  className="w-full"
                />
              </div>

              <Button
                onClick={() => {
                  setNeighborhoodView(!neighborhoodView)
                  if (sceneRef.current) {
                    if (!neighborhoodView && focusedNode !== null) {
                      // Zoom into focused node's neighborhood
                      const nodePos = sceneRef.current.nodes[focusedNode].position
                      sceneRef.current.camera.position.set(nodePos.x, nodePos.y, 5)
                      sceneRef.current.camera.lookAt(nodePos.x, nodePos.y, 0)
                    } else {
                      // Return to full graph view
                      sceneRef.current.camera.position.set(0, 0, zoomLevel[0])
                      sceneRef.current.camera.lookAt(0, 0, 0)
                    }
                  }
                }}
                variant={neighborhoodView ? "default" : "outline"}
                className="w-full"
              >
                {neighborhoodView ? "Full Graph" : "Neighborhood View"}
              </Button>

              <div className="grid grid-cols-5 gap-1">
                {Array.from({ length: 10 }, (_, i) => (
                  <Button
                    key={i}
                    onClick={() => {
                      setFocusedNode(i)
                      setPropagationStep(i)
                      if (sceneRef.current) {
                        const nodePos = sceneRef.current.nodes[i].position
                        sceneRef.current.camera.position.set(nodePos.x, nodePos.y, 8)
                        sceneRef.current.camera.lookAt(nodePos.x, nodePos.y, 0)
                      }
                    }}
                    variant={focusedNode === i ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-1">
                <Button
                  onClick={() => {
                    if (sceneRef.current) {
                      sceneRef.current.camera.position.set(-10, 0, 10)
                      sceneRef.current.camera.lookAt(0, 0, 0)
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  Side
                </Button>
                <Button
                  onClick={() => {
                    if (sceneRef.current) {
                      sceneRef.current.camera.position.set(0, 10, 5)
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
                      sceneRef.current.camera.position.set(0, 0, zoomLevel[0])
                      sceneRef.current.camera.lookAt(0, 0, 0)
                      setFocusedNode(null)
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
              <Button onClick={startPropagation} disabled={isAnimating} className="w-full">
                {isAnimating ? "Propagating..." : "Start Message Passing"}
              </Button>

              <Button
                onClick={() => setPropagationStep(Math.floor(Math.random() * 20))}
                variant="outline"
                className="w-full"
              >
                Random Node
              </Button>
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <div>Nodes: 20</div>
              <div>Avg Degree: ~3</div>
              <div>Task: Node Classification</div>
              <div>Aggregation: Mean</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graph Info */}
      <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 p-4 text-white">
        <h3 className="font-semibold mb-2">GNN Components</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <span>Graph Nodes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <span>Different Node Types</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span>Active Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-gray-400"></div>
            <span>Graph Edges</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <span>Messages</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-400">Nodes aggregate information from their neighbors</div>
      </div>
    </div>
  )
}
