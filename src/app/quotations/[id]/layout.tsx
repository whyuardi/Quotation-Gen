// This layout intentionally does NOT include AppShell
// The [id]/print route uses its own bare layout
export default function QuotationDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
