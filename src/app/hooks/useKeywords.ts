import KeywordsConfig from '../../data/KeywordsConfig.json';

export const useKeywords = () => {
  return {
    definitions: KeywordsConfig.keywords,
    // Keywords whose modal links to a page of their own
    links: KeywordsConfig.links,
  };
};

export default useKeywords;