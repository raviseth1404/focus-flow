import { cn } from '@/lib/utils/cn'
import Image from 'next/image'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }
const pxMap = { sm: 28, md: 36, lg: 48 }

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <div
      className={cn(
        'relative rounded-full flex items-center justify-center overflow-hidden flex-shrink-0',
        'bg-[var(--color-accent-muted)] text-[var(--color-accent)] font-medium',
        sizeMap[size],
        className
      )}
    >
      {src ? (
        <Image src={src} alt={name || 'avatar'} width={pxMap[size]} height={pxMap[size]} className="object-cover" />
      ) : (
        initials
      )}
    </div>
  )
}
