import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">404 - Page Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2 mb-4" aria-label="Wordle-style 404 message">
            {['4', '0', '4', '0', '4'].map((letter, index) => (
              <div 
                key={index} 
                className={`w-full aspect-square flex items-center justify-center text-2xl font-bold rounded-md ${
                  index % 2 === 0 ? 'bg-yellow-500 dark:bg-yellow-600' : 'bg-gray-500 dark:bg-gray-600'
                } text-white`}
                aria-hidden="true"
              >
                {letter}
              </div>
            ))}
          </div>
          <p className="text-center text-gray-600 dark:text-gray-300">
            Oops! It looks like the word you're looking for doesn't exist in our dictionary.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/">
              Return to Game
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}