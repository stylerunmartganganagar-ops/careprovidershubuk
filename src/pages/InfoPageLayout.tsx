import { ReactNode } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

interface InfoPageLayoutProps {
  title: string;
  subtitle?: string;
  updated?: string;
  intro?: string;
  children: ReactNode;
}

export const InfoPageLayout = ({ title, subtitle, updated, intro, children }: InfoPageLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />
      <main className="flex-1">
        <section className="bg-white py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <header className="mb-10 text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{title}</h1>
              {subtitle && <p className="text-lg text-gray-600 mb-1">{subtitle}</p>}
              {updated && (
                <p className="text-sm uppercase tracking-wide text-gray-500">{updated}</p>
              )}
            </header>

            {intro && (
              <p className="text-lg text-gray-700 leading-relaxed mb-10 text-center">
                {intro}
              </p>
            )}

            <article className="space-y-10 text-gray-700 leading-relaxed">
              {children}
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};
