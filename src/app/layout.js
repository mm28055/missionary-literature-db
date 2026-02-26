import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Missionary Literature Database — 19th Century Writings on India & Hinduism',
  description: 'A digital humanities project: a searchable, sortable database of 19th-century missionary literature on India and Hinduism. Browse extracts by missionary, denomination, period, and thematic tags.',
  keywords: ['missionary', 'literature', 'India', 'Hinduism', '19th century', 'digital humanities', 'colonial history'],
};

export default async function RootLayout({ children }) {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch {
    // Supabase not configured yet — that's fine
  }

  return (
    <html lang="en">
      <body>
        <Navbar user={user} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
