"use client";
import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import KeywordsConfig from "../../data/KeywordsConfig.json";

import { Search, BookOpen, Users, Zap, Brain } from "@/app/components/icons";

const Definitions = () => {
  const { colorValue } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const itemsPerPage = 10;

  // Use categories from KeywordsConfig.json
  const categories = KeywordsConfig.categories;
  const definitions = KeywordsConfig.keywords;

  const filteredDefinitions = Object.entries(definitions).filter(([term, definition]) => {
    const matchesSearch = term.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         definition.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedCategory === "all") return matchesSearch;
    
    const categoryTerms = categories[selectedCategory as keyof typeof categories] || [];
    return matchesSearch && categoryTerms.includes(term);
  });

  // Changing a filter starts back on the first page
  const updateSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };
  const updateCategory = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredDefinitions.length / itemsPerPage);
  const displayedDefinitions = showAll 
    ? filteredDefinitions 
    : filteredDefinitions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "technology": return Brain;
      case "people": return Users;
      case "concepts": return Zap;
      default: return BookOpen;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="LEARN..."
            value={searchTerm}
            onChange={(e) => updateSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 font-google-sans-code text-sm text-gray-900 transition-colors placeholder:text-gray-500 focus:border-gray-400 focus:outline-none dark:border-gray-700 dark:bg-black/20 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-gray-500"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateCategory("all")}
            className={`rounded-lg px-3 py-2 font-google-sans-code text-xs font-medium transition-all ${
              selectedCategory === "all"
                ? 'border font-bold text-black'
                : 'border border-gray-700 text-gray-300 hover:bg-white/5 hover:text-white'
            }`}
            style={selectedCategory === "all" ? { backgroundColor: colorValue, borderColor: colorValue } : {}}
          >
            <BookOpen size={12} className="mr-1 inline" />
            ALL ({Object.entries(KeywordsConfig.keywords).length})
          </button>
          
          {Object.entries(categories).map(([category, terms]) => {
            const Icon = getCategoryIcon(category);
            const isActive = selectedCategory === category;
            
            return (
              <button
                key={category}
                onClick={() => updateCategory(category)}
                className={`rounded-lg px-3 py-2 font-google-sans-code text-xs font-medium capitalize transition-all ${
                  isActive
                    ? 'border font-bold text-black'
                    : 'border border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white'
                }`}
                style={isActive ? { backgroundColor: colorValue, borderColor: colorValue } : {}}
              >
                <Icon size={12} className="mr-1 inline" />
                {category} ({terms.length})
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count */}
      <div className="font-vt323 text-sm text-gray-600 dark:text-gray-400">
        {filteredDefinitions.length} definition{filteredDefinitions.length !== 1 ? 's' : ''} found
        {searchTerm && ` for "${searchTerm}"`}
        {!showAll && filteredDefinitions.length > itemsPerPage && (
          <span className="ml-2">· Showing {displayedDefinitions.length} of {filteredDefinitions.length}</span>
        )}
      </div>

      {/* Definition Table */}
      {filteredDefinitions.length === 0 ? (
        <div className="py-8 text-center">
          <BookOpen className="mx-auto mb-3 text-gray-500 dark:text-gray-600" size={32} />
          <p className="font-google-sans-code text-gray-600 dark:text-gray-500">No definitions found.</p>
          <button 
            onClick={() => { updateSearch(""); updateCategory("all"); }}
            className="mt-2 font-google-sans-code text-sm text-gray-600 underline transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            CLEAR.
          </button>
        </div>
      ) : (
        <div className="w-full">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200/20 dark:border-gray-700/20">
                  <th className="py-3 pl-0 pr-4 text-left" style={{ width: '25%' }}>
                    <span className="font-google-sans-code text-xs uppercase tracking-wide" 
                          style={{ color: 'var(--text-muted)' }}>
                      TERM.
                    </span>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <span className="font-google-sans-code text-xs uppercase tracking-wide" 
                          style={{ color: 'var(--text-muted)' }}>
                      DEFINITION.
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedDefinitions.map(([term, definition], index) => {
                  // TODO: USE WELCOMECOLOR HERE - MAP CATEGORY TO COLOR
                  let categoryColor = "#6B7280"; // default gray
                  if (categories.technology.includes(term)) categoryColor = "#3B82F6"; // blue
                  else if (categories.concepts.includes(term)) categoryColor = "#F59E0B"; // amber

                  return (
                    <tr 
                      key={index}
                      className="group border-b border-gray-200/10 transition-colors duration-200 hover:bg-gray-50/20 dark:border-gray-700/10 dark:hover:bg-white/5"
                    >
                      {/* Term column */}
                      <td className="py-3 pl-0 pr-4">
                        <div className="flex items-start gap-2">
                          <div 
                            className="mt-1 h-full w-1 shrink-0 rounded-full"
                            style={{ backgroundColor: categoryColor, minHeight: '16px' }}
                          />
                          <span 
                            className="font-google-sans-code text-sm uppercase font-bold leading-tight"
                            style={{ color: categoryColor }}
                          >
                            {term}
                          </span>
                        </div>
                      </td>
                      
                      {/* Definition column */}
                      <td className="py-3 px-4">
                        <span className="font-google-sans-code text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                          {definition}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination controls */}
          {filteredDefinitions.length > itemsPerPage && (
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || showAll}
                  className="px-3 py-1 font-google-sans-code text-xs uppercase tracking-wide rounded border border-gray-200/20 dark:border-gray-700/20 transition-colors duration-200 hover:bg-gray-50/20 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ color: 'var(--foreground)' }}
                >
                  back
                </button>
                
                {!showAll && (
                  <span className="font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                )}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || showAll}
                  className="px-3 py-1 font-google-sans-code text-xs uppercase tracking-wide rounded border border-gray-200/20 dark:border-gray-700/20 transition-colors duration-200 hover:bg-gray-50/20 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ color: 'var(--foreground)' }}
                >
                  next
                </button>
              </div>
              
              <button
                onClick={() => {
                  setShowAll(!showAll);
                  if (showAll) setCurrentPage(1);
                }}
                className="px-3 py-1 font-google-sans-code text-xs uppercase tracking-wide rounded border border-gray-200/20 dark:border-gray-700/20 transition-colors duration-200 hover:bg-gray-50/20 dark:hover:bg-white/5"
                style={{ color: 'var(--foreground)' }}
              >
                {showAll ? 'Show Pages' : 'Show All'}
              </button>
            </div>
          )}
        </div>
      )}

      
      
    </div>
  );
};

export default Definitions;
