export function GlobalNextActions({
  actions
}: {
  actions: string[];
}): React.JSX.Element {
  return (
    <section className="global-actions">
      <span className="section-eyebrow">GLOBAL ACTIONS</span>
      <h2>下一步计划</h2>
      <ul>
        {actions.map((action, index) => (
          <li key={`global-${index}`}>{action}</li>
        ))}
      </ul>
    </section>
  );
}
