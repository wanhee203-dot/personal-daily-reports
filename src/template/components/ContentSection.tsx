interface ContentSectionProps {
  title: string;
  items: string[];
  emptyText?: string;
}

export function ContentSection({
  title,
  items,
  emptyText
}: ContentSectionProps): React.JSX.Element {
  const visibleItems =
    items.length > 0 ? items : emptyText ? [emptyText] : [];

  return (
    <section className="content-section">
      <h3>{title}</h3>
      <ul>
        {visibleItems.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
