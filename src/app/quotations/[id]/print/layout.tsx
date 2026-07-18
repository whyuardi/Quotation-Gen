export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Print pages render without the AppShell sidebar/nav
  return <>{children}</>;
}
