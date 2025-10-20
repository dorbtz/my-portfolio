export default function Footer() {
  return (
    <footer className="mt-16 border-t border-black/5 dark:border-white/10">
      <div className="wrap py-8 text-sm opacity-80 flex items-center justify-between">
        <p>© {new Date().getFullYear()} YourName • Last updated {new Date().toLocaleDateString()}</p>
        <div className="flex gap-4">
          <a className="hover:text-accent" href="#projects">Projects</a>
          <a className="hover:text-accent" href="https://github.com/your">GitHub</a>
          <a className="hover:text-accent" href="https://www.linkedin.com/in/your">LinkedIn</a>
          <a className="hover:text-accent" href="#hero">Top ↑</a>
        </div>
      </div>
    </footer>
  );
}
