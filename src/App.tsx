import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseConfig';
import { Account } from './components/UserAccount';
import { Forum } from './components/Forum';
import { SignInWithGoogle } from './components/SignInButton';

// A simple loading spinner for the initial app load
const AppLoader = () => (
  <div className="bg-slate-50 min-h-screen flex items-center justify-center">
    <div className="w-10 h-10 border-2 border-slate-200 border-t-sage-500 rounded-full animate-spin"></div>
  </div>
);

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('forum'); // 'forum' or 'account'

  useEffect(() => {
    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false); // Stop loading once session is fetched
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setView('forum'); // Reset view to forum on sign out
  };

  // Show a loader while the initial session is being fetched
  if (loading) {
    return <AppLoader />;
  }

  return (
    <main className="bg-slate-50 min-h-screen font-sans text-slate-800">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* --- Logged Out View --- */}
        {!session ? (
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <div className="text-center max-w-lg">
              <h1 className="text-4xl sm:text-5xl font-serif text-slate-800 mb-4">
                Welcome to Axiom
              </h1>
              <p className="text-slate-500 mb-8 text-lg">
                A calm and focused space for thoughtful discussion. Sign in to join the community.
              </p>
              <SignInWithGoogle />
            </div>
          </div>
        ) : (
          // --- Logged In View ---
          <div>
            <header className="flex justify-between items-center pb-6 border-b border-slate-200 mb-8">
              <h1
                onClick={() => setView('forum')}
                className="text-2xl font-serif font-bold cursor-pointer hover:text-sage-600 transition-colors"
              >
                Axiom
              </h1>
              <nav className="flex items-center gap-4">
                <button
                  onClick={() => setView('forum')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                    view === 'forum' ? 'bg-sage-100 text-sage-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Forum
                </button>
                <button
                  onClick={() => setView('account')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                    view === 'account' ? 'bg-sage-100 text-sage-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Account
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-md text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Sign Out
                </button>
              </nav>
            </header>

            {/* Conditionally render the selected view */}
            {view === 'forum' ? <Forum session={session}/> : <Account session={session} />}
          </div>
        )}
      </div>
    </main>
  );
}

export default App;