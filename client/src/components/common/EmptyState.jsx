export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-16">
      {Icon && (
        <div className="w-20 h-20 mx-auto rounded-full bg-brand-primary/5 flex items-center justify-center mb-4">
          <Icon size={32} className="text-brand-primary/40" />
        </div>
      )}
      <h3 className="text-xl font-serif mb-2">{title}</h3>
      {description && <p className="text-brand-muted mb-6">{description}</p>}
      {action}
    </div>
  );
}
