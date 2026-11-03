"use client";
import PageAsterisk from "./components/PageAsterick";
import ScrollRow from "../components/HorizontalRow";
import ConditionalHeroSection from "./components/ConditionalHeroSection";
import { SETUP_START_HERE_ARTICLE } from './constants/editorial-articles/articles/setup-start-here';
import { COMPONENT_DISCO_BALL_ARTICLE } from "./constants/editorial-articles";
import EditorialArticle from "./components/editorial/EditorialArticle";
import SponsorCard from "./components/SponsorCard";
import ValuesBadge from "./components/ValuesBadge";
import ArticleCard from "./components/ArticleCard";
import { useTheme } from "./contexts/ThemeContext";

export default function HomeClient() {
  const { colorValue } = useTheme();
  return (
    <main className="mx-auto w-full max-w-5xl">
      <div className="flex flex-col gap-6 py-8 text-left">
         <EditorialArticle 
    article={SETUP_START_HERE_ARTICLE} 
    coverId="cover-036"
  />
         </div>

         <ScrollRow 
  items={[
    
     <PageAsterisk key="page-asterisk" />,
     <ConditionalHeroSection key="conditional-hero-section" />,
     <SponsorCard key="sponsor-card" />,
     <ValuesBadge key="values-badge" />,
     // The disco ball left the homepage for its own article (too heavy to load here)
     <ArticleCard key="disco-ball" article={COMPONENT_DISCO_BALL_ARTICLE} colorValue={colorValue} index={3} />,
     
  ]}
  moreLink="/party"
  fullBleed
  maxItems={5}
/>


    </main>
  );
}
