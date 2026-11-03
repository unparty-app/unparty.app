import SprintArticle from './SprintArticle';

export const metadata = {
  title: 'SPRINT.',
  description: 'How unparty-app uses sprints to measure time, effort, and cost to prioritize goals. ',
};

export default function SprintPage() {
  return (
    <main className="flex flex-col gap-4 pt-2">
      <div className="w-full flex flex-col gap-6">
        <SprintArticle />
      </div>
    </main>
  );
}
