import { useEffect } from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"

export function CountUp({ value, duration = 1.5 }: { value: number, duration?: number }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.round(latest).toString())

  useEffect(() => {
    const controls = animate(count, value, { duration, ease: "easeOut" })
    return controls.stop
  }, [value, duration, count])

  return <motion.span>{rounded}</motion.span>
}
