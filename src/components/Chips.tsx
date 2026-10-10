import { ACTION_STYLE, CLASS_INFO, PRIORITY_STYLE } from '../lib/classes';
import type { Action, PanelClass, Priority } from '../lib/types';
import Icon, { type IconName } from './Icon';

export const ACTION_ICON: Record<Action, IconName> = {
  Tunggu: 'clock',
  Hembus: 'wind',
  Semprot: 'drop',
  Lapor: 'send',
};

export function ClassChip({ cls }: { cls: PanelClass }) {
  const info = CLASS_INFO[cls];
  return (
    <span className="chip chip-class">
      <span className="dot" style={{ background: info.color }} aria-hidden="true" />
      {info.label}
    </span>
  );
}

export function ActionChip({ action }: { action: Action }) {
  const s = ACTION_STYLE[action];
  return (
    <span className="chip" style={{ background: s.bg, color: s.fg }}>
      <Icon name={ACTION_ICON[action]} size={14} />
      {action}
    </span>
  );
}

export function PriorityChip({ priority }: { priority: Priority }) {
  const s = PRIORITY_STYLE[priority];
  return (
    <span className="chip" style={{ background: s.bg, color: s.fg }}>
      {priority}
    </span>
  );
}
