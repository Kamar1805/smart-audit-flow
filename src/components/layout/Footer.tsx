export default function Footer() {
  return (
    <footer className="border-t bg-background text-muted-foreground mt-6">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
        <p className="text-sm">© {new Date().getFullYear()} Smart Audit Flow</p>
        <div className="flex items-center gap-4 text-sm">
          <a className="hover:underline" href="#about">About</a>
          <a className="hover:underline" href="#privacy">Privacy</a>
          <a className="hover:underline" href="#terms">Terms</a>
        </div>
      </div>
    </footer>
  );
}
