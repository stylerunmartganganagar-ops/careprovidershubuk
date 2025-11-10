import { Navigation } from '@/components/Navigation';
import { CodeOfConduct } from '@/components/CodeOfConduct';
import { Footer } from '@/components/Footer';

const CodeOfConductPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />
      <main className="flex-1">
        <CodeOfConduct />
      </main>
      <Footer />
    </div>
  );
};

export default CodeOfConductPage;
