import './ui.css';

interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
}

/** Simple labeled progress bar, e.g. "12 / 30 gelernt". */
export function ProgressBar({ value, max, label }: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="progress-bar">
      <div className="progress-bar-head">
        <span>{label}</span>
        <span>
          {value} / {max}
        </span>
      </div>
      <div
        className="progress-bar-track"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
