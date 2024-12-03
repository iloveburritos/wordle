import { useEffect, useState } from 'react'
import { useGroup } from '@/contexts/GroupContext'
import { usePrivy } from '@privy-io/react-auth'
import GameResultGrid from './GameResultGrid'

interface Score {
  user: string
  score: string
  timestamp: number
}

export default function ScoreBoard() {
  const [scores, setScores] = useState<Score[]>([])
  const { currentGroup, isGroupMember } = useGroup()
  const { user } = usePrivy()

  useEffect(() => {
    const fetchScores = async () => {
      if (!currentGroup || !user?.wallet?.address) return

      try {
        // Query The Graph for scores
        const query = `
          query GroupScores($groupId: ID!, $currentGame: BigInt!) {
            scoreAddeds(
              where: {
                group: $groupId,
                currentGame: $currentGame
              }
              orderBy: blockTimestamp
            ) {
              user
              encryptedScore
              blockTimestamp
            }
          }
        `

        const response = await fetch('https://api.thegraph.com/subgraphs/name/your-subgraph', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            variables: {
              groupId: currentGroup,
              currentGame: currentGameNumber // You'll need to track this
            }
          })
        })

        const { data } = await response.json()
        
        // Filter scores to only show those from group members
        const filteredScores = await Promise.all(
          data.scoreAddeds.map(async (score: any) => {
            const isMember = await isGroupMember(score.user)
            return isMember ? {
              user: score.user,
              score: score.encryptedScore,
              timestamp: parseInt(score.blockTimestamp)
            } : null
          })
        )

        setScores(filteredScores.filter(Boolean))
      } catch (error) {
        console.error('Error fetching scores:', error)
      }
    }

    fetchScores()
  }, [currentGroup, user?.wallet?.address])

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Group Scores</h2>
      <div className="space-y-2">
        {scores.map((score, index) => (
          <div key={index} className="p-4 border rounded">
            <div className="flex justify-between">
              <span>{score.user}</span>
              <span>{new Date(score.timestamp * 1000).toLocaleString()}</span>
            </div>
            <div className="mt-2">
              <GameResultGrid 
                encryptedScore={score.score}
                hashScore=""
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 