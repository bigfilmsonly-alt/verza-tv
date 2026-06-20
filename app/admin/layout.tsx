export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Admin pages bypass the iPhone frame + Header/Footer/BottomNav
  // by rendering children directly. The root layout still wraps,
  // but this layout uses a CSS class to hide the consumer chrome.
  return (
    <div className="admin-layout">
      {children}
    </div>
  );
}
