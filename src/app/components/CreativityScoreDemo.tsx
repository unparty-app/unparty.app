import { promises as fs } from "fs";
import path from "path";
import { parseClaudeReport, type ClaudeReportData } from "../utils/claudeReportParser";
import CreativityScoreDisplay from "./CreativityScoreDisplay";

/**
 * CreativityScoreDemo - Server Component
 * Loads and parses Claude conversation data from claude_report.md
 * Displays creativity metrics based on conversation patterns
 */
const CreativityScoreDemo: React.FC = async () => {
  // Read the claude_report.md file from the theunpartycrawler directory
  const reportPath = path.join(
    process.cwd(),
    "src/app/theunpartycrawler/claude_report.md"
  );
  
  let markdown = "";
  let reportData: ClaudeReportData = {
    summary: {
      totalConversations: 0,
      totalMessages: 0,
      totalCharacters: 0,
      dateRange: "",
      timeSpan: "",
      avgMessagesPerConversation: 0,
      avgCharactersPerMessage: 0,
    },
    conversations: [],
  };

  try {
    markdown = await fs.readFile(reportPath, "utf-8");
    reportData = parseClaudeReport(markdown);
  } catch (error) {
    console.error("Error loading claude_report.md:", error);
    // Return error state component if file can't be loaded
    return (
      <div className="w-full max-w-3xl rounded border border-red-500/20 bg-red-500/5 p-6">
        <h2 className="mb-2 font-google-sans-code text-lg font-bold uppercase tracking-wide text-red-400">
          Error Loading Data
        </h2>
        <p className="font-google-sans-code text-sm text-gray-300">
          Unable to load conversation data from claude_report.md
        </p>
      </div>
    );
  }

  // Pass the parsed data to the client component for interactive display
  return (
    <CreativityScoreDisplay
      conversations={reportData.conversations}
      summaryStats={reportData.summary}
    />
  );
};

export default CreativityScoreDemo;
