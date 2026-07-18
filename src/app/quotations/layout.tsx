// Quotations layout - minimal wrapper
// AppShell is applied at the page level since print routes need bare layout
export default function QuotationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
