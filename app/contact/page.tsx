import { ContactForm } from '@/src/components/contact';
import { generateBaseMetadata } from '@/src/seo/metadata';

export const metadata = {
  ...generateBaseMetadata(
    'Contact',
    'Get in touch with Ankit Nandwani for opportunities, collaborations, or questions.'
  ),
};

export default function ContactPage() {
  return (
    <div className="flex flex-col items-center bg-zinc-50 font-sans dark:bg-black min-h-screen">
      <main className="flex flex-1 w-full flex-col items-center justify-start pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl w-full">
          <header className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Contact Ankit
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-2xl mx-auto">
              Get in touch for opportunities, collaborations, or questions.
              I&apos;ll get back to you as soon as possible.
            </p>
          </header>
          <ContactForm />
        </div>
      </main>
    </div>
  );
}