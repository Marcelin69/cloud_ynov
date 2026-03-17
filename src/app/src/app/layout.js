import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "JobFlow — Traitements Cloud",
  description: "Plateforme de soumission et gestion de traitements cloud",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
        {/* Navbar */}
        <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-950">
                J
              </div>
              <span className="font-semibold text-white text-lg tracking-tight">
                Job<span className="text-indigo-400">Flow</span>
              </span>
            </Link>

            <nav className="flex items-center gap-2">
              <Link
                href="/job"
                className="text-sm text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-all"
              >
                Traitements
              </Link>
              <Link
                href="/job/createJob"
                className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-all font-medium shadow-lg shadow-indigo-950/50"
              >
                + Nouveau
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-slate-800 mt-24">
          <div className="max-w-5xl mx-auto px-6 py-6 text-center text-sm text-slate-600">
            JobFlow &mdash; Traitements Cloud &copy; {new Date().getFullYear()}
          </div>
        </footer>
      </body>
    </html>
  );
}
