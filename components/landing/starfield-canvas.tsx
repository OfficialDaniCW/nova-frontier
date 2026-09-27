'use client'

import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  z: number
  twinklePhase: number
  twinkleSpeed: number
}

/**
 * Ambient deep-space starfield with slow parallax drift toward the pointer
 * and per-star twinkle. Purely decorative but load-bearing for the landing
 * page's "deep space console" identity — kept to a single canvas, no DOM
 * nodes per star, so it stays cheap on low-end devices.
 */
export function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let stars: Star[] = []
    let pointerX = 0
    let pointerY = 0
    let targetPointerX = 0
    let targetPointerY = 0
    let rafId = 0

    const STAR_COUNT = 220

    function resize() {
      if (!canvas) return
      width = canvas.offsetWidth
      height = canvas.offsetHeight
      canvas.width = width * window.devicePixelRatio
      canvas.height = height * window.devicePixelRatio
      ctx?.scale(window.devicePixelRatio, window.devicePixelRatio)

      stars = Array.from({ length: STAR_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 0.8 + 0.2,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
      }))
    }

    function onPointerMove(event: PointerEvent) {
      const rect = canvas!.getBoundingClientRect()
      targetPointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2
      targetPointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    }

    function draw() {
      if (!ctx) return
      pointerX += (targetPointerX - pointerX) * 0.03
      pointerY += (targetPointerY - pointerY) * 0.03

      ctx.clearRect(0, 0, width, height)

      for (const star of stars) {
        star.twinklePhase += star.twinkleSpeed
        const twinkle = (Math.sin(star.twinklePhase) + 1) / 2
        const parallax = star.z * 14
        const drawX = star.x - pointerX * parallax
        const drawY = star.y - pointerY * parallax
        const radius = star.z * 1.4
        const alpha = 0.25 + twinkle * 0.55 * star.z

        ctx.beginPath()
        ctx.arc(drawX, drawY, radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(103, 232, 249, ${alpha})`
        ctx.fill()
      }

      rafId = requestAnimationFrame(draw)
    }

    resize()
    draw()

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    window.addEventListener('pointermove', onPointerMove)

    return () => {
      cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  )
}
