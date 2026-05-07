"use client"

import { animate } from "framer-motion"
import { useEffect, useState } from "react"

type CountUpProps = {
  value: number
  durationSec?: number
  className?: string
  prefix?: string
  suffix?: string
}

export function CountUp({
  value,
  durationSec = 0.8,
  className,
  prefix,
  suffix,
}: CountUpProps) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const controls = animate(0, value, {
      duration: durationSec,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    })
    return () => controls.stop()
  }, [value, durationSec])

  return (
    <span className={className}>
      {prefix ?? ""}
      {display}
      {suffix ?? ""}
    </span>
  )
}
