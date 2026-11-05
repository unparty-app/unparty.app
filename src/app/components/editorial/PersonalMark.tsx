'use client';

import { useTheme } from '../../contexts/ThemeContext';
import { useInView } from '../../hooks/useInView';
import { iconByName } from '../icons/byName';
import StepNumberOverlay from './StepNumberOverlay';

/**
 * The mark at the start of a `personal` row, in the avatar's place: a numbered
 * ring (metadata.step), the same one ChallengeSteps and SetupCurriculum draw,
 * or a hand-drawn icon (metadata.icon). Each draws itself in once it's on
 * screen, one after another down a list; a ring wobbles when its row is
 * pointed at. Reduced motion shows them finished (globals.css).
 */
export default function PersonalMark({ step, icon }: { step?: number; icon?: string }) {
  const { colorValue } = useTheme();
  const [ref, inView] = useInView<HTMLSpanElement>();
  const Icon = iconByName(icon);
  const index = Math.max(0, (step ?? 1) - 1);

  if (step !== undefined) {
    return (
      <span ref={ref} className={`step-rings relative block size-8 shrink-0 ${inView ? 'is-in' : ''}`}>
        <span className="step-ring block size-full" style={{ ['--i' as string]: index }}>
          <StepNumberOverlay number={step} colorValue={colorValue} weight="thin" className="size-full overflow-visible" />
        </span>
      </span>
    );
  }
  if (!Icon) return null;
  return (
    <span ref={ref} className={`grid size-8 shrink-0 place-items-center ${inView ? 'ink-icons' : 'opacity-0'}`}>
      <Icon size={26} color={colorValue} />
    </span>
  );
}
