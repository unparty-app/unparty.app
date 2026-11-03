/**
 * Claude Report Parser
 * Extracts conversation data from claude_report.md markdown file
 */

export interface ClaudeConversation {
  id: string;
  timestamp: string;
  title: string;
  firstMessage: string;
  messageCount: number;
  characterCount: number;
  topics: string[];
}

export interface ClaudeSummaryStats {
  totalConversations: number;
  totalMessages: number;
  totalCharacters: number;
  dateRange: string;
  timeSpan: string;
  avgMessagesPerConversation: number;
  avgCharactersPerMessage: number;
}

export interface ClaudeReportData {
  summary: ClaudeSummaryStats;
  conversations: ClaudeConversation[];
}

/**
 * Parse the summary statistics section from claude_report.md
 */
function extractSummaryStats(markdown: string): ClaudeSummaryStats {
  const statsSection = markdown.match(/## 📊 Summary Statistics([\s\S]*?)##/)?.[1] || '';
  
  const totalConversations = parseInt(statsSection.match(/Total Conversations\*\*:\s*([0-9,]+)/)?.[1]?.replace(/,/g, '') || '0');
  const totalMessages = parseInt(statsSection.match(/Total Messages\*\*:\s*([0-9,]+)/)?.[1]?.replace(/,/g, '') || '0');
  const totalCharacters = parseInt(statsSection.match(/Total Characters\*\*:\s*([0-9,]+)/)?.[1]?.replace(/,/g, '') || '0');
  const dateRange = statsSection.match(/Date Range\*\*:\s*(.+?)(?:\n|$)/)?.[1]?.trim() || '';
  const timeSpan = statsSection.match(/Time Span\*\*:\s*(.+?)(?:\n|$)/)?.[1]?.trim() || '';
  const avgMessagesPerConversation = parseFloat(statsSection.match(/Messages per Conversation\*\*:\s*([0-9.]+)/)?.[1] || '0');
  const avgCharactersPerMessage = parseInt(statsSection.match(/Characters per Message\*\*:\s*([0-9,]+)/)?.[1]?.replace(/,/g, '') || '0');

  return {
    totalConversations,
    totalMessages,
    totalCharacters,
    dateRange,
    timeSpan,
    avgMessagesPerConversation,
    avgCharactersPerMessage,
  };
}

/**
 * Parse individual conversation entries from the Complete Timeline section
 */
function extractConversations(markdown: string): ClaudeConversation[] {
  const conversations: ClaudeConversation[] = [];
  
  // Find the Complete Timeline section
  const timelineSection = markdown.match(/## 📝 Complete Timeline([\s\S]*)/)?.[1] || '';
  
  // Match conversation entries with the pattern:
  // **YYYY-MM-DD HH:MM:SS** - *Title*
  //    💬 First message...
  //    📊 N messages • N characters
  //    🏷️ Topics: topic1, topic2, ...
  const conversationPattern = /\*\*(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\*\* - \*(.+?)\*\n\s*💬 (.+?)\n\s*📊 (\d+) messages • (\d+) characters\n\s*🏷️ Topics: (.+?)(?=\n\n|\n\*\*|$)/g;
  
  let match;
  let index = 0;
  
  while ((match = conversationPattern.exec(timelineSection)) !== null) {
    const [, timestamp, title, firstMessage, messagesStr, charactersStr, topicsStr] = match;
    
    conversations.push({
      id: `conv-${index}-${timestamp.replace(/[:\s]/g, '-')}`,
      timestamp,
      title: title.trim(),
      firstMessage: firstMessage.trim(),
      messageCount: parseInt(messagesStr),
      characterCount: parseInt(charactersStr),
      topics: topicsStr.split(',').map(t => t.trim()),
    });
    
    index++;
  }
  
  return conversations;
}

/**
 * Main parser function - parses the entire claude_report.md file
 */
export function parseClaudeReport(markdown: string): ClaudeReportData {
  const summary = extractSummaryStats(markdown);
  const conversations = extractConversations(markdown);
  
  return {
    summary,
    conversations,
  };
}

/**
 * Calculate unique topics across all conversations
 */
export function getUniquTopics(conversations: ClaudeConversation[]): string[] {
  const topicSet = new Set<string>();
  conversations.forEach(conv => {
    conv.topics.forEach(topic => topicSet.add(topic));
  });
  return Array.from(topicSet).sort();
}

/**
 * Calculate topic frequency distribution
 */
export function getTopicFrequency(conversations: ClaudeConversation[]): Map<string, number> {
  const frequencyMap = new Map<string, number>();
  
  conversations.forEach(conv => {
    conv.topics.forEach(topic => {
      frequencyMap.set(topic, (frequencyMap.get(topic) || 0) + 1);
    });
  });
  
  return frequencyMap;
}
