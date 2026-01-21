import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

type LogoVariant = 'full' | 'icon' | 'abbreviated' | 'stacked'
type LogoSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const logoFiles: Record<LogoVariant, { light: string; dark: string }> = {
  full: {
    light: '/endofszn-logo-full.png',
    dark: '/dark-endofszn-logo-full.png',
  },
  icon: {
    light: '/end-of-szn-logo.png',
    dark: '/end-of-szn-logo.png',
  },
  abbreviated: {
    light: '/endofszn-logo-abbreviated.png',
    dark: '/dark-endofszn-logo-abbreviated.png',
  },
  stacked: {
    light: '/endofszn-logo-icon-text.png',
    dark: '/dark-endofszn-logo-icon-text.png',
  },
}

const sizeClasses: Record<LogoSize, string> = {
  sm: 'h-6',
  md: 'h-8',
  lg: 'h-10',
  xl: 'h-16',
  '2xl': 'h-24',
}

type LogoProps = {
  variant?: LogoVariant
  size?: LogoSize
  className?: string
}

export function Logo({ variant = 'full', size = 'md', className = '' }: LogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className={`${sizeClasses[size]} ${className}`} />
  }

  const isDark = resolvedTheme === 'dark'
  const src = isDark ? logoFiles[variant].dark : logoFiles[variant].light

  return (
    <img
      src={src}
      alt="EndofSzn"
      className={`${sizeClasses[size]} w-auto ${className}`}
    />
  )
}
