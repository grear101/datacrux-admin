export function DiamondBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="diamond-bullet mt-2" />
      <span>{children}</span>
    </li>
  );
}
