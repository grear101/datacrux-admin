export function NodeLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="node-loader" role="status" aria-label={label || "Loading"}>
        <span className="node" />
        <span className="node" />
        <span className="node" />
        <span className="node" />
        <span className="node" />
      </div>
      {label && <p className="text-sm text-slate-400">{label}</p>}
    </div>
  );
}
