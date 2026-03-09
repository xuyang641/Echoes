import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSharedBook, SharedBook } from '../services/book-service';
import { MockBookPreview } from './book-preview';
import { Loader2, AlertCircle, BookOpen } from 'lucide-react';

export function SharedBookView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<SharedBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookOpen, setIsBookOpen] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    getSharedBook(id)
      .then(setBook)
      .catch((err) => {
        console.error(err);
        setError("Book not found or private.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500">Loading Photo Book...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Oops!</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">{error || "This book doesn't exist."}</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-20 blur-sm pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent pointer-events-none"></div>

        {isBookOpen ? (
            <MockBookPreview 
                pages={book.pages} 
                onClose={() => setIsBookOpen(false)} 
            />
        ) : (
            <div className="z-10 flex flex-col items-center text-center p-8 max-w-2xl animate-in fade-in zoom-in duration-500">
                <BookOpen className="w-20 h-20 text-amber-400 mb-6 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
                  Photo Diary <span className="text-amber-400">{book.year}</span>
                </h1>
                <p className="text-xl text-gray-300 mb-12 leading-relaxed">
                  Thanks for viewing! This moment is captured forever in time.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <button 
                        onClick={() => setIsBookOpen(true)}
                        className="px-8 py-4 bg-white text-gray-900 rounded-full font-bold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                    >
                        <BookOpen className="w-5 h-5" />
                        Read Again
                    </button>
                    <button 
                        onClick={() => navigate('/')}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold hover:from-blue-500 hover:to-indigo-500 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                    >
                        Create Your Own
                    </button>
                </div>
                
                <p className="mt-12 text-sm text-gray-500">
                    Powered by <span className="font-semibold text-gray-400">Photo Diary</span>
                </p>
            </div>
        )}
    </div>
  );
}