import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Colonial Discourse & Indian Selfhood',
  description: 'Interrogating the texts that shaped how India came to know itself. A digital archive of missionary, bureaucratic, and reform texts from colonial India.',
  keywords: ['colonial discourse', 'Indian selfhood', 'missionary literature', 'reform', 'India', 'Hinduism', 'caste', 'digital humanities', 'colonial history'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
