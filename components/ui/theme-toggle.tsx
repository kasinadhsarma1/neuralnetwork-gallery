"use client"

import * as React from "react"
import { Moon, Sun, Monitor, Palette, Zap } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ThemeToggle() {
  const { theme, setTheme, systemTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="theme-transition bg-transparent">
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const currentTheme = theme === "system" ? systemTheme : theme

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="theme-transition neural-border bg-transparent">
          {currentTheme === "dark" ? (
            <Moon className="h-[1.2rem] w-[1.2rem] neural-text-primary" />
          ) : (
            <Sun className="h-[1.2rem] w-[1.2rem] neural-text-primary" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 neural-bg-secondary neural-border theme-transition">
        <div className="p-2">
          <div className="text-sm font-medium neural-text-primary mb-2">Theme Settings</div>
          <div className="text-xs neural-text-secondary mb-3">
            Current: {currentTheme === "dark" ? "Dark Mode" : "Light Mode"}
          </div>
        </div>
        <DropdownMenuSeparator className="neural-border" />
        <DropdownMenuItem onClick={() => setTheme("light")} className="theme-transition-fast cursor-pointer">
          <Sun className="mr-2 h-4 w-4" />
          <span>Light Mode</span>
          {theme === "light" && <Zap className="ml-auto h-4 w-4 text-yellow-500" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="theme-transition-fast cursor-pointer">
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark Mode</span>
          {theme === "dark" && <Zap className="ml-auto h-4 w-4 text-blue-500" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="theme-transition-fast cursor-pointer">
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
          {theme === "system" && <Zap className="ml-auto h-4 w-4 text-green-500" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="neural-border" />
        <div className="p-2">
          <div className="text-xs neural-text-secondary">
            System preference: {systemTheme === "dark" ? "Dark" : "Light"}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AdvancedThemePanel() {
  const { theme, setTheme, systemTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const currentTheme = theme === "system" ? systemTheme : theme

  return (
    <Card className="neural-bg-secondary neural-border theme-transition neural-shadow">
      <CardHeader>
        <CardTitle className="neural-text-primary flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Advanced Theme Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={() => setTheme("light")}
            variant={theme === "light" ? "default" : "outline"}
            size="sm"
            className="theme-transition-fast"
          >
            <Sun className="w-4 h-4 mr-1" />
            Light
          </Button>
          <Button
            onClick={() => setTheme("dark")}
            variant={theme === "dark" ? "default" : "outline"}
            size="sm"
            className="theme-transition-fast"
          >
            <Moon className="w-4 h-4 mr-1" />
            Dark
          </Button>
          <Button
            onClick={() => setTheme("system")}
            variant={theme === "system" ? "default" : "outline"}
            size="sm"
            className="theme-transition-fast"
          >
            <Monitor className="w-4 h-4 mr-1" />
            Auto
          </Button>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between neural-text-secondary">
            <span>Current Theme:</span>
            <span className="neural-text-primary font-medium">
              {currentTheme === "dark" ? "Dark Mode" : "Light Mode"}
            </span>
          </div>
          <div className="flex justify-between neural-text-secondary">
            <span>System Preference:</span>
            <span className="neural-text-primary font-medium">{systemTheme === "dark" ? "Dark" : "Light"}</span>
          </div>
          <div className="flex justify-between neural-text-secondary">
            <span>Setting:</span>
            <span className="neural-text-primary font-medium capitalize">{theme}</span>
          </div>
        </div>

        <div className="pt-2 border-t neural-border">
          <div className="text-xs neural-text-secondary">Theme changes apply instantly with smooth transitions</div>
        </div>
      </CardContent>
    </Card>
  )
}
