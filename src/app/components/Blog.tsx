"use client";
import React from 'react';

import { useTheme } from "../contexts/ThemeContext";
import { getAllKeywordTerms } from "../utils/keywordDetection";
import Image from 'next/image';

const posts = [
    {
        id: 1,
        title: 'unppp.',
        href: '#',
        mvp: 'Write. Think. UNPPP.',
        powered: 'powered by UNPARTY\'s SMART KNOWLEDGE BASE',
        goal: 'NEXT STEP BUILDER FOR THOSE STARTING SOMEWHERE.',
        description: `


unppp. is an iOS app that fuses artificial intelligence, machine learning, and deep learning into a dynamic space where users build journals, spark ideas, and chat with their own evolving unppp.
        `.trim(),
        imageUrl:
            'https://o0taaguaxcxz7rhu.public.blob.vercel-storage.com/unppp_screenshot_wire_web-QUTBP2CwExNSPRY614OiqyDLwlYz28.svg',
        date: 'Apr 28, 2025',
        datetime: '2025-04-28',
        category: { title: 'app', href: '#' },
        app: {
            name: 'unppp.',
            platform: 'iOS',
            audience: 'founders',
            ai: '#dumbai',
            href: 'https://testflight.apple.com/join/GJvG1pDU', // ✅ UNPPP TESTFLIGHT LINK
            imageUrl:
                'https://o0taaguaxcxz7rhu.public.blob.vercel-storage.com/unpartydisco%403x.png',
        },
    },
];

// Get keyword terms from KeywordsConfig - removing the parts in parentheses for highlighting
const keywordTerms = getAllKeywordTerms();
const definitionKeywords = keywordTerms.map(term => term.replace(/\s\([^)]+\)/, ''));

// Combine all keywords
const keywords = definitionKeywords;

const app = [
    'unppp.'
];

const ai = [
    'unparty',
    "UNPARTY"
];

export default function Blog() {
    const { colorValue, allColors } = useTheme();
    
    function highlightKeywords(text: string, keywords: string[], apps: string[], ai: string[] = []) {
        // Filter out falsy values and escape special regex characters
        const allWords = [...keywords, ...apps, ...ai]
            .filter(Boolean)
            .map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        
        const regex = new RegExp(`(${allWords.join('|')})`, 'gi');
      
        const parts = text.split(regex);
      
        return parts.map((part, idx) => {
          // Skip undefined, null, or empty parts
          if (!part) return null;
          
          if (keywords.some(keyword => keyword && keyword.toLowerCase() === part.toLowerCase())) {
            return (
              <span key={idx} style={{ color: colorValue }} className="font-rounded">
                {part}
              </span>
            );
          }
          if (apps.some(app => app && app.toLowerCase() === part.toLowerCase())) {
            return (
              <span key={idx} className="font-rounded text-xl text-white">
                {part}
              </span>
            );
          }
          if (ai.some(aiTerm => aiTerm && aiTerm.toLowerCase() === part.toLowerCase())) {
            return (
              <span key={idx} style={{ color: allColors.electricPurple }} className="text-xl font-extrabold">
                {part}
              </span>
            );
          }
          return part;
        });
    }

    return (
        <div className="flex w-full max-w-full flex-col gap-4 text-center sm:text-left">
            {posts.map((post) => (
                <article key={post.id} className="relative isolate mx-auto flex w-full max-w-screen-lg flex-row flex-wrap items-center gap-8 px-4 sm:flex-nowrap">





                    <div className="min-w-0 flex-1 py-6 text-left">

                        <div className="flex items-start gap-x-4 text-xs">
                            <div className="mt-6 flex border-t border-gray-900/5">
                                <div className="relative flex items-center gap-x-4">
                                    <Image
                                        alt=""
                                        src={post.app.imageUrl}
                                        width={40}
                                        height={40}
                                        className="size-10 rounded-full bg-gray-50"
                                    />
                                    <div className="flex flex-wrap items-center gap-x-2 text-sm text-gray-400">
                                        {[post.app.name].map((item, idx) => (
                                            <React.Fragment key={idx}>
                                                {idx !== 0 && <span className="text-gray-500">•</span>}
                                                <p className={idx === 0 ? "font-rounded text-gray-100" : ""}>
                                                    {idx === 0 ? (
                                                        <a
                                                            href={post.app.href}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="whitespace-nowrap text-3xl font-bold text-black transition-opacity hover:opacity-80 dark:text-white"
                                                        >
                                                            {post.app.name}
                                                        </a>
                                                    ) : (
                                                        item
                                                    )}
                                                </p>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="group relative w-full break-words">
                            <div className="mt-3 font-vt323 text-sm uppercase text-gray-100  group-hover:text-gray-400">
                                <a href={post.href}>
                                    <span className="absolute inset-0" />
                                    {post.mvp}
                                </a>
                            </div>
                            <div className="mt-5 font-rounded text-sm/6 text-gray-400">
                                {post.description.split('\n\n').map((paragraph, idx) => (
                                    <p key={idx} className="mb-4">
                                        {highlightKeywords(paragraph, keywords, app, ai)}
                                    </p>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 py-6">
                            <a
                                href="/platform"
                                className="font-small relative z-10 rounded-full bg-transparent px-3 py-1.5 transition-opacity hover:opacity-80"
                                style={{ color: allColors.electricGreen, border: `1px solid ${allColors.electricGreen}` }}
                            >
                                {post.app.platform}
                            </a>
                            <a
                                href="/audience"
                                className="font-small relative z-10 rounded-full bg-transparent px-3 py-1.5 transition-opacity hover:opacity-80"
                                style={{ color: allColors.electricBlue, border: `1px solid ${allColors.electricBlue}` }}
                            >
                                {post.app.audience}
                            </a>
                            <a
                                href="/ai"
                                className="font-small relative z-10 rounded-full bg-transparent px-3 py-1.5 transition-opacity hover:opacity-80"
                                style={{ color: allColors.electricPurple, border: `1px solid ${allColors.electricPurple}` }}
                            >
                                {post.app.ai}
                            </a>
                        </div>
                    </div>
                    <div className="relative aspect-[9/19.5] w-40 shrink-0 overflow-hidden rounded-[2.75rem] border-[5px] border-neutral-900 bg-black shadow-2xl sm:w-56">
  <Image
    alt="iPhone screenshot"
    src={post.imageUrl}
    fill
    sizes="160px"
    unoptimized // SVG screenshots
    className="rounded-[2.25rem]"
    style={{
      objectFit: "contain",
      imageRendering: "auto", // prevent pixelation or over-smoothing
    }}
  />
</div>
                </article>
            ))}
        </div>
    );
}

