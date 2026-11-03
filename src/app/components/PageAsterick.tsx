"use client";

import { usePathname } from 'next/navigation';
import { useTheme } from '../contexts/ThemeContext';
import UnpppsConfig from '../../data/UnpppsConfig.json';
import BrandWordConfig from '../../data/BrandWordConfig.json';
import { getAllKeywordTerms } from '../utils/keywordDetection';

// Get keyword terms from KeywordsConfig - removing the parts in parentheses for highlighting
const keywordTerms = getAllKeywordTerms();
const definitionKeywords = keywordTerms.map(term => term.replace(/\s\([^)]+\)/, ''));

// Combine all keywords for highlighting
const keywords = [...definitionKeywords, ...BrandWordConfig.brandKeywords];

const PageAsterisk = () => {
  const pathname = usePathname();
  const { colorValue, allColors } = useTheme();
  
  // Find the current unppp based on pathname
  const currentUnppp = UnpppsConfig.unppps.find(unppp => {
    const route = unppp.id === 'theunpartyapp' ? '/' : `/${unppp.id}`;
    return route === pathname;
  });

  // Get title - prefer story title, fallback to tagline, then default
  // Use story title if it exists and is published, otherwise use tagline
  const titleText = (currentUnppp?.storyPublished && currentUnppp?.storyTitle)
    ? currentUnppp.storyTitle
    : currentUnppp?.tagline || 'APP.';

  // Function to highlight keywords in the title
  const highlightTitleKeywords = (text: string) => {
    // Use combined keywords from definitions, KeywordsConfig, and brand words
    const allKeywords = keywords;
    
    // Create a regex to match any of these keywords (case insensitive)
    const regex = new RegExp(`(${allKeywords.join('|')})`, 'gi');
    
    // Split the text by matched keywords
    const parts = text.split(regex);
    
    return parts.map((part, idx) => {
      // Skip undefined or null parts
      if (!part) return null;

      // Case-insensitive check for "UNPARTY" or "unppp."
      if (part.toLowerCase() === 'unparty' || part.toLowerCase() === 'unppp.') {
        return (
          <span key={idx} style={{ color: allColors.brand }} className="relative">
            {part}
          </span>
        );
      }

      // For all other keywords, use the current theme color
      if (allKeywords.some(keyword => keyword.toLowerCase() === part.toLowerCase())) {
        return (
          <span key={idx} style={{ color: colorValue }} className="relative">
            {part}
          </span>
        );
      }

      // For non-keywords, return as-is
      return part;
    });
  };
  
  return (
    <h3
      className="py-6 font-vt323 text-md font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-md xl:text-md"
      style={{ fontSize: "clamp(1.5rem, 5vw, 4rem)" }}
    >
      {highlightTitleKeywords(titleText)}
    </h3>
  );
};

export default PageAsterisk;