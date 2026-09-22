export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="text-sm opacity-70">
      {message}
      {action}
    </div>
  );
}
