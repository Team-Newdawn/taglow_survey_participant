import { ProgressBar } from './ProgressBar';
import './css/StepHeader.css';

type StepHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  current: number;
  total: number;
  progressLabel?: string;
};

export function StepHeader({ eyebrow, title, description, current, total, progressLabel }: StepHeaderProps) {
  return (
    <header className="ui-step-header">
      {eyebrow ? <p className="ui-step-header__eyebrow">{eyebrow}</p> : null}
      <h1 className="ui-step-header__title">{title}</h1>
      {description ? <p className="ui-step-header__description">{description}</p> : null}
      <ProgressBar value={current} max={total} label={progressLabel ?? `${current}/${total}`} />
    </header>
  );
}
