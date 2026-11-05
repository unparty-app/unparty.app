'use client';

import { useEffect, useState } from 'react';
import EditorialArticle from '../components/editorial/EditorialArticle';
import { useArticleHeader } from '../contexts/ArticleHeaderContext';
import { useTheme } from '../contexts/ThemeContext';
import { inkOn } from '../components/build-yours/BuildYours';
import type { EditorialArticle as Article } from '../constants/editorial-articles/types';
import BuildLead from './BuildLead';

/**
 * /build's two views of one article: the owner's real data, and YOURS, the
 * same charts at zero, as the visitor's own site would start
 * (project-words-pull-to-build). The toggle sits in the byline row, always in
 * reach, so a chart can flip right where it's being looked at.
 */
export default function BuildView({ article, yours, whyCoverId }: { article: Article; yours: Article; whyCoverId: string | null }) {
  const { colorValue } = useTheme();
  const { setDockAction } = useArticleHeader();
  const [on, setOn] = useState(false);

  useEffect(() => {
    setDockAction(
      <button
        type="button"
        aria-pressed={on}
        aria-label="Show this page as yours would start"
        onClick={() => setOn((value) => !value)}
        className="min-h-8 shrink-0 rounded-full border px-3 py-0.5 font-vt323 text-sm uppercase transition-colors"
        style={{ borderColor: colorValue, backgroundColor: on ? colorValue : 'transparent', color: on ? inkOn(colorValue) : colorValue }}
      >
        yours.
      </button>
    );
    return () => setDockAction(null);
  }, [on, colorValue, setDockAction]);

  return <EditorialArticle article={on ? yours : article} showThoughts={false} lead={<BuildLead key="lead" whyCoverId={whyCoverId} />} />;
}
