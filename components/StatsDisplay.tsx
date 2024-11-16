import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PlayerStats {
  player: string // ENS name or wallet address
  totalGames: number
  totalWins: number
  bestScore: number
  averageScore: number
}

interface StatsDisplayProps {
  playerStats: PlayerStats[]
}

export default function StatsDisplay({ playerStats }: StatsDisplayProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-2">
        <CardTitle>Player Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[180px] py-2">Player</TableHead>
                <TableHead className="text-right py-2">Games</TableHead>
                <TableHead className="text-right py-2">Wins</TableHead>
                <TableHead className="text-right py-2">Best</TableHead>
                <TableHead className="text-right py-2">Avg</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playerStats.map((stats, index) => (
                <TableRow key={index} className="hover:bg-transparent">
                  <TableCell className="font-medium py-2 pl-0">{stats.player}</TableCell>
                  <TableCell className="text-right py-2">{stats.totalGames}</TableCell>
                  <TableCell className="text-right py-2">{stats.totalWins}</TableCell>
                  <TableCell className="text-right py-2">{stats.bestScore}</TableCell>
                  <TableCell className="text-right py-2">{stats.averageScore.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}