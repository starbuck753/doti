export function DotiBrand() {
  return <span className="doti-brand" aria-label="Doti">
    <span className="doti-priority-dots" aria-hidden="true">
      <span className="doti-priority-dot priority-green" />
      <span className="doti-priority-dot priority-yellow" />
      <span className="doti-priority-dot priority-orange" />
    </span>
    <span aria-hidden="true">D<span className="doti-priority-dot priority-red" />ti</span>
  </span>
}