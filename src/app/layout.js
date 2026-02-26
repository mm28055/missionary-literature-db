import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Missionary Literature Database — 19th Century Writings on India & Hinduism',
  description: 'A digital humanities project: a searchable, sortable database of 19th-century missionary literature on India and Hinduism. Browse extracts by missionary, denomination, period, and thematic tags.',
  keywords: ['missionary', 'literature', 'India', 'Hinduism', '19th century', 'digital humanities', 'colonial history'],
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
