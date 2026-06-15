import type { AgentLog } from '@/types/climate'

const AgentLogTimeline = ({ logs }: { logs: AgentLog[] }) => {
  return (
    <div className="stormy-timeline">
      {logs.map((log) => (
        <div key={`${log.agent}-${log.timestamp}`} className="stormy-timeline-item">
          <div className="stormy-timeline-dot" />
          <div>
            <div className="stormy-timeline-head">
              <strong>{log.agent}</strong>
              <span>{new Date(log.timestamp).toLocaleString()}</span>
            </div>
            <p>{log.message}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default AgentLogTimeline
