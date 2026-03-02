import logo from '../assets/logo.png'

type BrandLockupProps = {
  title?: string
  subtitle?: string
  eyebrow?: string
  compact?: boolean
  className?: string
}

export default function BrandLockup({
  title = 'CVDE Platform',
  subtitle,
  eyebrow,
  compact = false,
  className,
}: BrandLockupProps) {
  const classes = ['brand-lockup', compact ? 'compact' : '', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <span aria-hidden="true" className="brand-logo-shell">
        <img alt="" className="brand-logo-image" src={logo} />
      </span>
      <span className="brand-copy">
        {eyebrow ? <span className="brand-eyebrow">{eyebrow}</span> : null}
        <span className="brand-name">{title}</span>
        {subtitle ? <span className="brand-subtitle">{subtitle}</span> : null}
      </span>
    </div>
  )
}
