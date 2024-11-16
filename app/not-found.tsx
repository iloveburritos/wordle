import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="container">
        <div className="w-full max-w-md mx-auto">
          <h1 className="text-center mb-8">404 - Page Not Found</h1>
          <div className="grid grid-cols-5 gap-2 mb-8" aria-label="Wordle-style 404 message">
            {['4', '0', '4', '0', '4'].map((letter, index) => (
              <div 
                key={index} 
                className={`w-full aspect-square flex items-center justify-center text-2xl font-bold rounded-md ${
                  index % 2 === 0 ? 'bg-yellow-500 dark:bg-yellow-600' : 'bg-gray-500 dark:bg-gray-600'
                }`}
                aria-hidden="true"
              >
                {letter}
              </div>
            ))}
          </div>
          <p className="text-center mb-8">
            Oops! It looks like the word you're looking for doesn't exist in our dictionary.
          </p>
          <div className="flex justify-center">
            <Link href="/" className="button">
              Return to Game
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}