export default function Panel({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="app-panel">
      {title && <h2 className="app-panel-title">{title}</h2>}
      {children}
    </section>
  );
}
