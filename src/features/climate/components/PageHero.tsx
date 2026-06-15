import { Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'

type HeroStat = {
  label: string
  value: string
}

type PageHeroProps = {
  eyebrow: string
  title: string
  description: string
  stats: HeroStat[]
  primaryCta?: {
    label: string
    to: string
  }
  secondaryAction?: {
    label: string
    onClick: () => void | Promise<void>
  }
}

const PageHero = ({ eyebrow, title, description, stats, primaryCta, secondaryAction }: PageHeroProps) => {
  return (
    <div className="stormy-hero mb-4">
      <div className="stormy-hero-grid">
        <div>
          <span className="stormy-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
          <div className="d-flex flex-wrap gap-2 mt-3">
            {primaryCta ? (
              <Link to={primaryCta.to} className="btn btn-danger stormy-primary-btn">
                {primaryCta.label}
              </Link>
            ) : null}
            {secondaryAction ? (
              <Button variant="outline-light" onClick={() => void secondaryAction.onClick()}>
                {secondaryAction.label}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="stormy-hero-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="stormy-hero-stat">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PageHero
