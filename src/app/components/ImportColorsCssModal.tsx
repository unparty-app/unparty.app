'use client';

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Check, Upload, AlertCircle, Cloud, CloudCheck, Globe } from '@/app/components/icons';
import Modal from './Modal';
import SignIn from './SignIn';
import InkPalette from './InkPalette';
import ActionPill from './build-yours/ActionPill';
import { InkUnderline } from './depend/ink';
import { useTheme } from '../contexts/ThemeContext';
import { SignedIn, SignedOut, useUser } from '@/lib/auth-stub.client';
import { ORGANIZATION_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from '../constants/organization';
import {
  countParsedColors,
  paletteToColorSlots,
  parseBrandInfoFromCss,
  parseColorsFromCss,
  ParsedCssBrandInfo,
  ParsedCssPalette,
} from '../utils/importColorsCss';

type SiteSave = { state: 'idle' | 'saving' } | { state: 'error'; message: string } | { state: 'saved'; prUrl?: string };

interface ImportColorsCssModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (colors: string[], brand: ParsedCssBrandInfo) => void;
}

const ImportColorsCssModal = ({ isOpen, onClose, onApply }: ImportColorsCssModalProps) => {
  const { colorValue } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [palette, setPalette] = useState<ParsedCssPalette | null>(null);
  const [brandInfo, setBrandInfo] = useState<ParsedCssBrandInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const { user } = useUser();
  const isOwner = user?.publicMetadata?.role === 'admin';
  const [siteSave, setSiteSave] = useState<SiteSave>({ state: 'idle' });

  const reset = () => {
    setFileName(null);
    setPalette(null);
    setBrandInfo(null);
    setError(null);
    setIsDragging(false);
    setSaveState('idle');
    setSiteSave({ state: 'idle' });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const readFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.css')) {
      setError('Please choose a .css file.');
      setPalette(null);
      setBrandInfo(null);
      setFileName(file.name);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const parsed = parseColorsFromCss(text);
      const parsedBrandInfo = parseBrandInfoFromCss(text);
      setFileName(file.name);
      if (countParsedColors(parsed) === 0) {
        setError('No --color-* variables found in this file.');
        setPalette(null);
        setBrandInfo(null);
        return;
      }
      setPalette(parsed);
      setBrandInfo(parsedBrandInfo);
      setError(null);
    };
    reader.onerror = () => {
      setError('Unable to read that file.');
      setPalette(null);
      setBrandInfo(null);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  };

  const handleApply = () => {
    if (!palette) return;
    onApply(paletteToColorSlots(palette), brandInfo ?? {});
    handleClose();
  };

  // Saves the parsed palette + brand info to the signed-in user's account
  // (UserProfile.brandColors). Distinct from handleApply, which only ever
  // affects this browser's local ColorSelectionContext/localStorage.
  const handleSave = async () => {
    if (!palette) return;
    setSaveState('saving');
    try {
      const res = await fetch('/api/user/brand-colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...palette, ...brandInfo }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaveState('saved');
      // Saved means it's theirs now, so the card behind this shows it too
      onApply(paletteToColorSlots(palette), brandInfo ?? {});
    } catch {
      setSaveState('error');
    }
  };

  // The site's owner can make the imported brand who the site says it is
  const useOnSite = async () => {
    if (!brandInfo) return;
    setSiteSave({ state: 'saving' });
    try {
      const res = await fetch('/api/admin/site-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandInfo),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.line ? `${data.error}: ${data.line}` : data.error);
      setSiteSave({ state: 'saved', prUrl: data.prUrl });
    } catch (e) {
      setSiteSave({ state: 'error', message: e instanceof Error ? e.message : 'Could not save' });
    }
  };

  const siteChanges = brandInfo
    ? ([
        ['name', SITE_NAME, brandInfo.name],
        ['tagline', SITE_TAGLINE, brandInfo.tagline],
        ['description', ORGANIZATION_DESCRIPTION, brandInfo.description],
      ] as const).filter(([, now, next]) => next && next !== now)
    : [];

  const parsedCount = palette ? countParsedColors(palette) : 0;

  return (
    <Modal isOpen={isOpen} onCloseAction={handleClose}>
      <div className="space-y-6 text-left">
        <div>
          <h2 className="font-vt323 text-4xl uppercase leading-none text-[var(--foreground)]">import your colors.</h2>
          <InkUnderline color={colorValue} className="mt-1 h-2 w-28" />
        </div>

        {/* A place to drop the file: the pen line brightens when one is over it */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group/drop relative flex min-h-11 w-full items-center gap-3 rounded pb-3 text-left outline-none focus-visible:ring-2"
            style={{ ['--tw-ring-color' as string]: colorValue }}
          >
            <Upload size={24} color={colorValue} className="shrink-0" />
            <span className="min-w-0 font-space-grotesk text-sm leading-snug text-[var(--foreground)]">
              {fileName ?? 'drop an UNCOLOR .css here, or tap to choose one'}
            </span>
            <InkUnderline
              color={colorValue}
              className={`pointer-events-none absolute bottom-0 left-0 h-2.5 w-44 transition-opacity duration-200 ${isDragging ? 'opacity-100' : 'opacity-50 group-hover/drop:opacity-100'}`}
            />
          </button>
          <input ref={fileInputRef} type="file" accept=".css,text/css" onChange={handleFileChange} className="hidden" />
        </div>

        {error && (
          <p role="alert" className="flex items-start gap-2 font-space-grotesk text-sm text-[var(--foreground)]">
            <AlertCircle size={18} color={colorValue} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        {palette && parsedCount > 0 && (
          <>
            {/* Exactly what they'll get, drawn the way it will be */}
            <InkPalette colors={paletteToColorSlots(palette)} brand={brandInfo ?? undefined} />

            {isOwner && siteChanges.length > 0 && (
              <div className="border-t pt-4" style={{ borderColor: `${colorValue}33` }}>
                <p className="font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]">your site says</p>
                <ul className="mt-2 space-y-2">
                  {siteChanges.map(([field, now, next]) => (
                    <li key={field} className="font-space-grotesk text-sm leading-relaxed text-[var(--foreground)]">
                      <span className="line-through opacity-50">{now}</span> <span style={{ color: colorValue }}>{next}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {siteSave.state !== 'saved' && (
                    <ActionPill
                      verb={siteSave.state === 'saving' ? 'saving…' : 'use on my site'}
                      icon={Globe}
                      color={colorValue}
                      variant="line"
                      label="Use this name and tagline on your site"
                      onClick={siteSave.state === 'saving' ? () => {} : useOnSite}
                    />
                  )}
                  <p className="font-space-grotesk text-xs text-[var(--text-muted)]" aria-live="polite">
                    {siteSave.state === 'error' ? (
                      <span style={{ color: colorValue }}>{siteSave.message}</span>
                    ) : siteSave.state === 'saved' ? (
                      siteSave.prUrl ? (
                        <>
                          saved. live once{' '}
                          <a href={siteSave.prUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4" style={{ color: colorValue }}>the change</a>{' '}
                          deploys.
                        </>
                      ) : (
                        'saved. in your copy now.'
                      )
                    ) : (
                      'changes it everywhere your site says it.'
                    )}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <ActionPill verb="take it" icon={Check} color={colorValue} label="Use these colors" onClick={handleApply} />
              <SignedIn>
                <ActionPill
                  verb={saveState === 'saving' ? 'saving…' : saveState === 'saved' ? 'saved' : 'keep on my account'}
                  icon={saveState === 'saved' ? CloudCheck : Cloud}
                  color={colorValue}
                  variant="line"
                  label="Save these colors to your account"
                  onClick={saveState === 'saving' || saveState === 'saved' ? () => {} : handleSave}
                />
              </SignedIn>
              <SignedOut>
                <button
                  type="button"
                  onClick={() => setIsSignInOpen(true)}
                  className="font-space-grotesk text-sm text-[var(--text-muted)] underline decoration-dotted underline-offset-4 hover:text-[var(--foreground)]"
                >
                  sign in to keep them
                </button>
              </SignedOut>
              {saveState === 'error' && (
                <span role="alert" className="font-space-grotesk text-xs" style={{ color: colorValue }}>that didn&apos;t save. try again.</span>
              )}
            </div>
          </>
        )}
      </div>

      {isSignInOpen && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: 'var(--background)' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-200">
            <SignIn onClose={() => setIsSignInOpen(false)} />
          </div>
        </div>,
        document.body
      )}
    </Modal>
  );
};

export default ImportColorsCssModal;
