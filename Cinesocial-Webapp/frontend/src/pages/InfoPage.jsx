import { Link } from 'react-router-dom';

const content = {
  members: {
    title: 'Members',
    body: 'Member discovery is coming soon. Use search to find films and follow activity from movie pages.',
  },
  about: {
    title: 'About',
    body: 'CineSocial helps film fans discover movies, publish reviews, build lists, and host watch parties.',
  },
  contact: {
    title: 'Contact',
    body: 'For support, account help, or partnership questions, contact the CineSocial team from your project administrator channel.',
  },
  terms: {
    title: 'Terms',
    body: 'Use CineSocial respectfully. Do not post abusive content, spam the platform, or misuse another member account.',
  },
  privacy: {
    title: 'Privacy',
    body: 'CineSocial stores account, review, list, and party activity so the app can provide its community features.',
  },
};

export default function InfoPage({ page }) {
  const details = content[page] || {
    title: 'Page Not Found',
    body: 'That page does not exist yet.',
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-6xl md:text-8xl font-serif font-black mb-8 border-b-8 border-ink pb-4 uppercase">
        {details.title}
      </h1>
      <div className="bg-surface-container border-4 border-ink neo-shadow p-8">
        <p className="font-mono text-xl leading-relaxed mb-8">{details.body}</p>
        <Link to="/" className="neo-btn inline-block px-8 py-3 text-xl">
          BACK HOME
        </Link>
      </div>
    </div>
  );
}
