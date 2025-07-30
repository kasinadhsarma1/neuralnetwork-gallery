"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, Network, Layers, GitBranch, Zap, Eye, Settings } from "lucide-react"
import { ThemeToggle, AdvancedThemePanel } from "@/components/ui/theme-toggle"
import InteractiveBrain from "@/components/neural-networks/interactive-brain"
import FeedforwardNetwork from "@/components/neural-networks/feedforward-network"
import ConvolutionalNetwork from "@/components/neural-networks/convolutional-network"
import RecurrentNetwork from "@/components/neural-networks/recurrent-network"
import TransformerNetwork from "@/components/neural-networks/transformer-network"
import GraphNetwork from "@/components/neural-networks/graph-network"

const networkTypes = [
  {
    id: "brain",
    title: "Interactive Brain",
    description: "Anatomical brain simulation with neural cascades and advanced zoom controls",
    icon: Brain,
    color: "neural-glow-red",
    bgColor: "bg-red-500/10",
    complexity: "High",
    category: "Biological",
  },
  {
    id: "feedforward",
    title: "Feedforward Network",
    description: "Classic multilayer perceptron with zoom-to-layer functionality",
    icon: Network,
    color: "neural-glow-blue",
    bgColor: "bg-blue-500/10",
    complexity: "Medium",
    category: "Classical",
  },
  {
    id: "convolutional",
    title: "Convolutional Network",
    description: "CNN with feature map zoom and layer-by-layer exploration",
    icon: Eye,
    color: "neural-glow-green",
    bgColor: "bg-green-500/10",
    complexity: "High",
    category: "Computer Vision",
  },
  {
    id: "recurrent",
    title: "Recurrent Network",
    description: "RNN/LSTM with temporal zoom and sequence focus modes",
    icon: GitBranch,
    color: "neural-glow-purple",
    bgColor: "bg-purple-500/10",
    complexity: "High",
    category: "Sequential",
  },
  {
    id: "transformer",
    title: "Transformer Network",
    description: "Attention mechanism with multi-scale zoom and head isolation",
    icon: Zap,
    color: "neural-glow-yellow",
    bgColor: "bg-yellow-500/10",
    complexity: "Very High",
    category: "Modern",
  },
  {
    id: "graph",
    title: "Graph Network",
    description: "Graph neural network with node-level zoom and neighborhood focus",
    icon: Layers,
    color: "neural-glow-cyan",
    bgColor: "bg-cyan-500/10",
    complexity: "High",
    category: "Graph-based",
  },
]

export default function NeuralNetworkSuite() {
  const [activeNetwork, setActiveNetwork] = useState<string | null>(null)
  const [showAdvancedTheme, setShowAdvancedTheme] = useState(false)

  const renderNetwork = () => {
    switch (activeNetwork) {
      case "brain":
        return <InteractiveBrain />
      case "feedforward":
        return <FeedforwardNetwork />
      case "convolutional":
        return <ConvolutionalNetwork />
      case "recurrent":
        return <RecurrentNetwork />
      case "transformer":
        return <TransformerNetwork />
      case "graph":
        return <GraphNetwork />
      default:
        return null
    }
  }

  if (activeNetwork) {
    return (
      <div className="min-h-screen neural-bg-primary theme-transition">
        <div className="absolute top-4 left-4 z-50 flex gap-2">
          <Button
            onClick={() => setActiveNetwork(null)}
            variant="outline"
            className="neural-bg-secondary/80 backdrop-blur-sm neural-border neural-text-primary hover:neural-bg-tertiary theme-transition"
          >
            ← Back to Networks
          </Button>
          <ThemeToggle />
        </div>
        {renderNetwork()}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-accent theme-transition p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Theme Controls */}
        <div className="flex justify-between items-start mb-8">
          <div className="text-center flex-1">
            <h1 className="text-5xl font-bold neural-text-primary mb-4 theme-transition">
              Neural Network Visualization Suite
            </h1>
            <p className="text-xl neural-text-secondary max-w-3xl mx-auto theme-transition">
              Explore different types of neural networks through interactive 3D visualizations with advanced theming.
              From biological brain simulations to modern transformer architectures.
            </p>
          </div>
          <div className="flex gap-2 items-start">
            <Button
              onClick={() => setShowAdvancedTheme(!showAdvancedTheme)}
              variant="outline"
              size="icon"
              className="neural-border theme-transition"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {/* Advanced Theme Panel */}
        {showAdvancedTheme && (
          <div className="mb-8 max-w-md mx-auto">
            <AdvancedThemePanel />
          </div>
        )}

        {/* Network Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {networkTypes.map((network) => {
            const IconComponent = network.icon
            return (
              <Card
                key={network.id}
                className={`neural-bg-secondary/80 backdrop-blur-sm neural-border hover:neural-border/50 theme-transition cursor-pointer group hover:scale-105 hover:${network.color} ${network.bgColor}`}
                onClick={() => setActiveNetwork(network.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`p-3 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 neural-border theme-transition`}
                    >
                      <IconComponent className="w-6 h-6 neural-text-primary" />
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        variant="secondary"
                        className="neural-bg-tertiary neural-text-primary neural-border theme-transition"
                      >
                        {network.category}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`neural-border neural-text-primary theme-transition ${
                          network.complexity === "Very High"
                            ? "bg-red-500/10 border-red-500/30"
                            : network.complexity === "High"
                              ? "bg-orange-500/10 border-orange-500/30"
                              : "bg-blue-500/10 border-blue-500/30"
                        }`}
                      >
                        {network.complexity}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="neural-text-primary group-hover:text-primary theme-transition">
                    {network.title}
                  </CardTitle>
                  <CardDescription className="neural-text-secondary theme-transition">
                    {network.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full neural-bg-tertiary hover:neural-bg-primary neural-text-primary neural-border theme-transition bg-transparent"
                    variant="outline"
                  >
                    Launch Visualization
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Features Section */}
        <div className="mt-16 text-center">
          <div className="neural-bg-secondary/50 backdrop-blur-sm rounded-lg p-8 neural-border theme-transition neural-shadow">
            <h2 className="text-2xl font-bold neural-text-primary mb-4 theme-transition">Advanced Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 neural-text-secondary">
              <div className="theme-transition">
                <h3 className="font-semibold neural-text-primary mb-2">Interactive 3D</h3>
                <p>Real-time 3D visualizations with mouse controls and animations</p>
              </div>
              <div className="theme-transition">
                <h3 className="font-semibold neural-text-primary mb-2">Advanced Theming</h3>
                <p>Dark/Light modes with smooth transitions and system preference detection</p>
              </div>
              <div className="theme-transition">
                <h3 className="font-semibold neural-text-primary mb-2">Educational</h3>
                <p>Learn how different neural architectures process information</p>
              </div>
              <div className="theme-transition">
                <h3 className="font-semibold neural-text-primary mb-2">Responsive</h3>
                <p>Optimized for desktop and mobile viewing experiences</p>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Preview */}
        <div className="mt-8 text-center">
          <div className="neural-bg-secondary/30 backdrop-blur-sm rounded-lg p-4 neural-border theme-transition">
            <div className="text-sm neural-text-secondary mb-2">Theme Preview</div>
            <div className="flex justify-center gap-4">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-pink-500 neural-glow-red"></div>
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 neural-glow-blue"></div>
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 neural-glow-green"></div>
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 neural-glow-yellow"></div>
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-violet-500 neural-glow-purple"></div>
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 neural-glow-cyan"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
