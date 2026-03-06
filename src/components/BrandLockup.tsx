import logo from '../assets/logo.png'
import { useI18n } from '../i18n'

type BrandLockupProps = {
  title?: string
  subtitle?: string
  eyebrow?: string
  compact?: boolean
  className?: string
}

export default function BrandLockup({
  title,
  subtitle,
  eyebrow,
  compact = false,
  className,
}: BrandLockupProps) {
  const { t } = useI18n()
  const resolvedTitle = title ?? t('brand.defaultTitle')
  const classes = ['brand-lockup', compact ? 'compact' : '', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <span aria-hidden="true" className="brand-logo-shell">
        <img alt="" className="brand-logo-image" src={logo} />
      </span>
      <span className="brand-copy">
        {eyebrow ? <span className="brand-eyebrow">{eyebrow}</span> : null}
        <span className="brand-name">{resolvedTitle}</span>
        {subtitle ? <span className="brand-subtitle">{subtitle}</span> : null}
      </span>
    </div>
  )
}
