'use client';
import { useTheme } from "../contexts/ThemeContext";

const AiPage = () => {
  const { colorValue, allColors } = useTheme();
  return (
    <main className="mx-auto w-full max-w-5xl">
      {/* Add your page content here */}
      <div className="flex flex-col gap-6">
      <AIClearDefinition colorValue={colorValue} />
        <CommonAIMisconceptions colorValue={colorValue} />
        <EffectiveAIUseGuidelines allColors={allColors} />
      </div>
    </main>
  );
};


// Clearly defines AI in realistic terms
function AIClearDefinition({ colorValue }: { colorValue: string }) {
  return (
    <div className="flex flex-col gap-4  rounded-xl border border-zinc-700 p-6 font-google-sans-code">
      <h3 className="text-l font-bold tracking-tight sm:text-5xl" style={{ color: colorValue }}>
        WHAT ARTIFICIAL INTELLIGENCE IS (AND IS NOT)
      </h3>
      <p className="text-sm text-white">
      AI tools, such as large language models (LLMs), <span className="font-bold">are trained on vast amounts of data to predict likely next words or sentences</span>, based purely on statistical patterns.
    It&apos;s <span className="text-md">important</span> to stress that these tools do not genuinely understand concepts, possess intentions, or have inherent access to verified facts.
  Though AI-generated outputs often sound confident, they consistently require <span className="font-bold">critical human review</span>, editing, and iteration to ensure accuracy and relevance.
</p>

    </div>
  );
}

// Explicitly states common misconceptions based on your research findings
function CommonAIMisconceptions({ colorValue }: { colorValue: string }) {
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-6 font-vt323">
      <h3 className="text-4xl font-bold tracking-tight sm:text-5xl" style={{ color: colorValue }}>
        define.
      </h3>

      <h4 className="mb-2 mt-4 text-2xl font-bold" style={{ color: colorValue }}>
        how do you plan to use large language models in your build.
      </h4>

      <h4 className="mb-4 mt-6 text-xl font-bold" style={{ color: colorValue }}>
        COMMON MISCONCEPTIONS ABOUT AI
      </h4>

      <ul className="list-inside list-disc space-y-4 text-white">
        <li>
          <span className="font-bold" style={{ color: colorValue }}>AI truly understands concepts or context.</span> AI does <span className="underline">not genuinely understand</span> concepts—it simply predicts likely words based on learned patterns.
          <a href="https://www.oneusefulthing.org/p/what-ai-really-knows" target="_blank" rel="noopener noreferrer" className="text-sm italic text-zinc-400">(Ethan Mollick, 2023)</a>
        </li>

        <li>
          <span className="font-bold" style={{ color: colorValue }}>AI reliably produces accurate facts.</span> AI frequently produces plausible-sounding yet <span className="underline">factually incorrect or hallucinated</span> information.
          <a href="https://www.pewresearch.org/internet/2023/05/24/what-americans-know-about-ai-cybersecurity-and-big-tech/" target="_blank" rel="noopener noreferrer" className="text-sm italic text-zinc-400">(Pew Research, 2023)</a>
        </li>

        <li>
          <span className="font-bold" style={{ color: colorValue }}>AI has intentions or human-like intelligence.</span> AI tools have <span className="underline">no intentions, emotions, or subjective understanding</span>; they merely generate statistically probable text.
          <a href="https://www.pewresearch.org/internet/2023/05/24/what-americans-know-about-ai-cybersecurity-and-big-tech/" target="_blank" rel="noopener noreferrer" className="text-sm italic text-zinc-400">(Pew Research, 2023)</a>
        </li>

        <li>
          <span className="font-bold" style={{ color: colorValue }}>AI fully replaces human judgment and creativity.</span> AI outputs are always <span className="underline">draft-quality at best</span>, requiring human judgment, creativity, and editing.
          <a href="https://www.upstackstudio.com/blog/framer-ai-review" target="_blank" rel="noopener noreferrer" className="text-sm italic text-zinc-400">(Upstack Studio Review, 2024)</a>
        </li>

        <li>
          <span className="font-bold" style={{ color: colorValue }}>AI automatically knows the best solution.</span> AI suggestions reflect general patterns—not necessarily <span className="underline">optimal or contextually perfect solutions</span> for your specific needs.
          <a href="https://bubble.io/blog/bubble-ai-launch" target="_blank" rel="noopener noreferrer" className="text-sm italic text-zinc-400">(Bubble.io, 2024)</a>
        </li>
      </ul>
    </div>
  );
}


// Provide clear guidelines for effective AI use, empowering the user
function EffectiveAIUseGuidelines({ allColors }: { allColors: Record<string, string> }) {
  return (
    <div className="rounded-xl border p-6 font-mono" style={{ borderColor: allColors.brand }}>
      <h4 className="mb-4 text-xl font-bold" style={{ color: allColors.brand }}>
        HOW TO EFFECTIVELY USE AI TOOLS
      </h4>
      <ul className="list-inside list-disc space-y-4 text-white">
        <li>
          <span className="font-bold" style={{ color: allColors.brand }}>Define clear intent upfront</span> — clearly state your goal, and feel empowered to critique or correct AI outputs.
        </li>
        <li>
          <span className="font-bold" style={{ color: allColors.brand }}>Expect to revise and refine</span> — view AI-generated content as a helpful starting point, not a finished solution.
        </li>
        <li>
          <span className="font-bold" style={{ color: allColors.brand }}>Blend AI with your personal experience and creativity</span> — adapt AI suggestions uniquely to your ideas and goals.
        </li>
        <li>
          <span className="font-bold" style={{ color: allColors.brand }}>Always verify independently</span> — remember, AI confidently generates plausible-sounding but sometimes incorrect information.
        </li>
      </ul>
    </div>
  );
}

export default AiPage;
