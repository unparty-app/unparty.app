
const MazeInstructions = () => {
  return (
    <ol className="list-inside list-decimal text-center font-google-sans-code text-sm text-black sm:text-left dark:text-white">
      <li className="mb-2">
        Move the player{" "}
        <code className="rounded bg-black/[.05] px-1 py-0.5 font-semibold text-black dark:bg-white/[.06] dark:text-white">
          using arrow keys
        </code>
        .
      </li>
      <li className="mb-2">
        Avoid the{" "}
        <code className="rounded bg-black/[.05] px-1 py-0.5 font-semibold text-black dark:bg-white/[.06] dark:text-white">
          (umbrella squares)
        </code>
        .
      </li>
      <li className="mb-2">
        Reach the goal{" "}
        <code className="rounded bg-black/[.05] px-1 py-0.5 font-semibold text-black dark:bg-white/[.06] dark:text-white">
          (unparty square)
        </code>
        .
      </li>
    </ol>
  );
};

export default MazeInstructions;