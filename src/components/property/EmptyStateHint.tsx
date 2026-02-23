export function EmptyStateHint({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
      {text}
    </div>
  );
}
