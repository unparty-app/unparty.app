'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ColorPicker from '../components/ColorPicker';
import ColorMatchingGame from '../components/ColorMatchingGame';
import ActionPill from '../components/build-yours/ActionPill';
import { InkUnderline } from '../components/depend/ink';
import { useTheme } from '../contexts/ThemeContext';
import { ColorSelectionProvider, useColorSelection } from '../contexts/ColorSelectionContext';
import { useConnectModal } from '../hooks/useConnectModal';
import { downloadColorSlotsCss } from '../utils/importColorsCss';
import { SITE_NAME } from '../constants/organization';
import { Download } from '@/app/components/icons';

const HEADING = 'font-vt323 text-4xl uppercase leading-none text-[var(--foreground)]';

/**
 * /color: one page, read from the top. Your five colors, as lines. With all
 * five picked, what you can do with them appears under them: keep them as a
 * .css any copy can load, or play with them. Nothing is locked behind anything
 * else, and each step shows up when there's something to do with it.
 */
const ColorPageContent = () => {
  const { colorValue } = useTheme();
  const { allColors, selectedColors } = useColorSelection();
  const { openModal: openConnectModal, ConnectModal } = useConnectModal();
  const pathname = usePathname();
  // The five lines you can see, not colors kept from before
  const hasFive = selectedColors.filter(Boolean).length === 5;

  // The first five as a .css in UNCOLOR's roles: the brand color setup and
  // the import on any copy load it back (#247)
  const keepThem = () => {
    const date = new Date().toISOString().split('T')[0];
    downloadColorSlotsCss(allColors.slice(0, 5), `my colors from ${SITE_NAME}, ${date}`, `my-colors-${date}.css`);
  };

  return (
    <main className="min-h-screen px-4 py-12 md:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-16 text-left">
        <ColorPicker headingLevel="h1" />

        {hasFive && (
          <section aria-labelledby="keep-them">
            <h2 id="keep-them" className={HEADING}>keep them.</h2>
            <InkUnderline color={colorValue} className="mt-1 h-2 w-28" />
            <p className="mt-4 max-w-xl font-space-grotesk text-sm leading-relaxed text-[var(--text-muted)]">
              a .css file any copy of this site can load. they become that site&apos;s colors.{' '}
              <Link href="/article/setup-identity" className="underline decoration-dotted underline-offset-4 hover:text-[var(--foreground)]">see how</Link>.
            </p>
            <div className="mt-5">
              <ActionPill verb="take it" note=".CSS" icon={Download} color={colorValue} label="Download your five colors as a .css file" onClick={keepThem} />
            </div>
          </section>
        )}

        {hasFive && (
          <section aria-labelledby="play-them">
            <h2 id="play-them" className={HEADING}>remember them.</h2>
            <InkUnderline color={colorValue} className="mt-1 h-2 w-28" />
            <div className="mt-6">
              <ColorMatchingGame />
            </div>
          </section>
        )}

        <p className="font-space-grotesk text-sm text-[var(--text-muted)]">
          <button
            type="button"
            onClick={() => openConnectModal(`Feedback from ${pathname}`)}
            className="underline decoration-dotted underline-offset-4 hover:text-[var(--foreground)]"
          >
            tell us what&apos;s working, or what isn&apos;t
          </button>
          .
        </p>
      </div>

      {ConnectModal}
    </main>
  );
};

// Wrapper component with ColorSelectionProvider
const ColorPage = () => {
  return (
    <ColorSelectionProvider>
      <ColorPageContent />
    </ColorSelectionProvider>
  );
};

export default ColorPage;
