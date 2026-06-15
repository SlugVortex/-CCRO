import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { Card, CardBody, ProgressBar } from 'react-bootstrap'

type ClimateMetricCardProps = {
  title: string
  value: string
  changeText: string
  changeVariant: 'success' | 'danger' | 'warning' | 'primary' | 'info'
  icon: string
  variant: 'success' | 'danger' | 'warning' | 'primary' | 'info'
  progress: number
  footnote?: string
}

const ClimateMetricCard = ({
  title,
  value,
  changeText,
  changeVariant,
  icon,
  variant,
  progress,
  footnote,
}: ClimateMetricCardProps) => {
  return (
    <Card className="overflow-hidden border-top-0 h-100">
      <ProgressBar variant={variant} now={progress} className="progress-sm rounded-0 bg-light" />
      <CardBody>
        <div className="d-flex align-items-start justify-content-between gap-3">
          <div>
            <p className="text-muted fw-semibold fs-16 mb-1">{title}</p>
            <p className="text-muted mb-3">
              <span className={`badge bg-${changeVariant}-subtle text-${changeVariant}`}>{changeText}</span>
            </p>
            <h3 className="mb-1">{value}</h3>
            {footnote ? <p className="text-muted mb-0">{footnote}</p> : null}
          </div>

          <div className="avatar-sm">
            <div className={`avatar-title bg-${variant}-subtle text-${variant} fs-24 rounded`}>
              <IconifyIcon icon={icon} />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

export default ClimateMetricCard
