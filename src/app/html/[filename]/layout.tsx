export default function HtmlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div suppressHydrationWarning={true}>
      {children}
    </div>
  );
}