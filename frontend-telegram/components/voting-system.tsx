"use client"

import { useState, useRef, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Trophy,
  Clock,
  Users,
  ThumbsUp,
  ThumbsDown,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Star,
  CheckCircle,
} from "lucide-react"
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { darexAbi, darexContractAddress } from '@/lib/contracts';

interface Submission {
  id: string
  userId: string
  username: string
  description: string
  files: {
    id: string
    type: "image" | "video"
    url: string
    thumbnail?: string
  }[]
  votes: {
    yes: number
    no: number
  }
  userVote?: "yes" | "no"
  timestamp: string
  status: "pending" | "approved" | "rejected"
}

interface DareVoting {
  id: number
  title: string
  description: string
  reward: number
  creator: string
  deadline: string
  totalSubmissions: number
  votingEnds: string
  submissions: Submission[]
  phase: "community-voting" | "organizer-selection" | "completed"
  topSubmissions?: string[]
}

export function VotingSystem({ dareId }: { dareId?: number }) {
  const [currentSubmissionIndex, setCurrentSubmissionIndex] = useState(0)
  const [votedSubmissions, setVotedSubmissions] = useState<Set<string>>(new Set())
  const [dare, setDare] = useState<DareVoting | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const { data: completeDareHash, writeContract: completeDare } = useWriteContract();
  const { isLoading: isCompleting, isSuccess: isCompleted } = useWaitForTransactionReceipt({ hash: completeDareHash });

  useEffect(() => {
    if (dareId) {
      const fetchDareVotingData = async () => {
        setIsLoading(true)
        try {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dares/${dareId}/voting`)
          setDare(response.data.data)
        } catch (error) {
          console.error(`Failed to fetch voting data for dare ${dareId}:`, error)
        } finally {
          setIsLoading(false)
        }
      }
      fetchDareVotingData()
    }
  }, [dareId])

  const handleVote = async (submissionId: string, vote: "yes" | "no") => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/submissions/${submissionId}/vote`, { vote })
      setVotedSubmissions((prev) => new Set(prev).add(submissionId))
      console.log(`Voted ${vote} on submission ${submissionId}`)
    } catch (error) {
      console.error(`Failed to vote on submission ${submissionId}:`, error)
    }
  }

  const handleFinalize = () => {
    if (!dareId) return;
    completeDare({
      abi: darexAbi,
      address: darexContractAddress,
      functionName: 'completeDare',
      args: [BigInt(dareId)]
    })
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!dare || dare.submissions.length === 0) {
    return (
        <div className="p-4 space-y-4">
             <h2 className="text-2xl font-bold text-balance">Community Voting</h2>
            <p className="text-muted-foreground">This dare has no submissions for voting yet.</p>
             <Card>
                <CardHeader>
                    <CardTitle>Finalize Dare</CardTitle>
                    <CardDescription>Once the voting period is over, the dare can be finalized to distribute rewards.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleFinalize} disabled={isCompleting} className="w-full">
                        {isCompleting ? 'Distributing Rewards...' : 'Finalize & Distribute Rewards'}
                    </Button>
                    {isCompleted && <p className="text-green-500 text-center mt-2">Rewards have been distributed successfully!</p>}
                </CardContent>
            </Card>
        </div>
    );
  }
  
  const currentSubmission = dare.submissions[currentSubmissionIndex]

  const nextSubmission = () => {
    if (currentSubmissionIndex < dare.submissions.length - 1) {
      setCurrentSubmissionIndex(currentSubmissionIndex + 1)
    }
  }

  const prevSubmission = () => {
    if (currentSubmissionIndex > 0) {
      setCurrentSubmissionIndex(currentSubmissionIndex - 1)
    }
  }

  return (
    <div className="space-y-6">
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-balance">Community Voting</h2>
          <p className="text-muted-foreground">Help select the top 10 submissions for this dare</p>
        </div>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-lg leading-tight text-balance">{dare.title}</CardTitle>
                <CardDescription className="text-pretty leading-relaxed">{dare.description}</CardDescription>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Trophy className="w-3 h-3" />
                {dare.reward} USDC
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{dare.totalSubmissions} submissions</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>Voting ends in {dare.votingEnds}</span>
                </div>
              </div>
              <Badge variant="outline">Community Phase</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="vote" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mx-4">
          <TabsTrigger value="vote">Vote on Submissions</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="vote" className="mt-4">
          <VotingInterface
            submission={currentSubmission}
            currentIndex={currentSubmissionIndex}
            totalSubmissions={dare.submissions.length}
            onVote={handleVote}
            onNext={nextSubmission}
            onPrev={prevSubmission}
            hasVoted={votedSubmissions.has(currentSubmission?.id)}
            canGoNext={currentSubmissionIndex < dare.submissions.length - 1}
            canGoPrev={currentSubmissionIndex > 0}
          />
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <Leaderboard submissions={dare.submissions} />
        </TabsContent>
      </Tabs>

        <Card>
            <CardHeader>
                <CardTitle>Finalize Dare</CardTitle>
                <CardDescription>Once the voting period is over, the dare can be finalized to distribute rewards.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleFinalize} disabled={isCompleting} className="w-full">
                    {isCompleting ? 'Distributing Rewards...' : 'Finalize & Distribute Rewards'}
                </Button>
                {isCompleted && <p className="text-green-500 text-center mt-2">Rewards have been distributed successfully!</p>}
            </CardContent>
        </Card>
    </div>
  )
}

function VotingInterface({
  submission,
  currentIndex,
  totalSubmissions,
  onVote,
  onNext,
  onPrev,
  hasVoted,
  canGoNext,
  canGoPrev,
}: {
  submission: Submission
  currentIndex: number
  totalSubmissions: number
  onVote: (id: string, vote: "yes" | "no") => void
  onNext: () => void
  onPrev: () => void
  hasVoted: boolean
  canGoNext: boolean
  canGoPrev: boolean
}) {
  const [currentFileIndex, setCurrentFileIndex] = useState(0)

  if (!submission) return null

  const currentFile = submission.files[currentFileIndex]
  const totalVotes = submission.votes.yes + submission.votes.no
  const yesPercentage = totalVotes > 0 ? (submission.votes.yes / totalVotes) * 100 : 0

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>
            Submission {currentIndex + 1} of {totalSubmissions}
          </span>
          <span>{Math.round(((currentIndex + 1) / totalSubmissions) * 100)}% complete</span>
        </div>
        <Progress value={((currentIndex + 1) / totalSubmissions) * 100} className="w-full" />
      </div>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback>{submission.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{submission.username}</span>
                <Badge variant="outline" className="text-xs">
                  {submission.timestamp}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {submission.files.length > 0 && (
            <div className="space-y-3">
              <MediaViewer file={currentFile} />
              {submission.files.length > 1 && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentFileIndex(Math.max(0, currentFileIndex - 1))}
                    disabled={currentFileIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex gap-1">
                    {submission.files.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${index === currentFileIndex ? "bg-primary" : "bg-muted"}`}
                      />
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentFileIndex(Math.min(submission.files.length - 1, currentFileIndex + 1))}
                    disabled={currentFileIndex === submission.files.length - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
          <div className="space-y-2">
            <h4 className="font-medium">Description</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{submission.description}</p>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        {!hasVoted ? (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950 bg-transparent"
              onClick={() => onVote(submission.id, "no")}
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              No
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
              onClick={() => onVote(submission.id, "yes")}
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Yes
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Vote submitted!</span>
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onPrev} disabled={!canGoPrev} className="flex-1 bg-transparent">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button variant="outline" onClick={onNext} disabled={!canGoNext} className="flex-1 bg-transparent">
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function MediaViewer({ file }: { file: { type: "image" | "video"; url: string; thumbnail?: string } }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  return (
    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
      {file.type === "image" ? (
        <img src={file.url || "/placeholder.svg"} alt="Submission proof" className="w-full h-full object-cover" />
      ) : (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            src={file.url}
            className="w-full h-full object-cover"
            poster={file.thumbnail}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            muted={isMuted}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="secondary"
              size="icon"
              className="w-16 h-16 rounded-full bg-black/50 hover:bg-black/70"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
            </Button>
          </div>
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70"
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        </div>
      )}
    </div>
  )
}

function Leaderboard({ submissions }: { submissions: Submission[] }) {
  const sortedSubmissions = [...submissions].sort((a, b) => {
    const aScore = a.votes.yes / (a.votes.yes + a.votes.no || 1)
    const bScore = b.votes.yes / (b.votes.yes + b.votes.no || 1)
    return bScore - aScore
  })

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-balance">Current Rankings</h3>
        <p className="text-muted-foreground text-sm">Top 10 submissions will advance to organizer selection</p>
      </div>

      <div className="space-y-3">
        {sortedSubmissions.map((submission, index) => {
          const totalVotes = submission.votes.yes + submission.votes.no
          const yesPercentage = totalVotes > 0 ? (submission.votes.yes / totalVotes) * 100 : 0
          const isTopTen = index < 10

          return (
            <Card key={submission.id} className={`${isTopTen ? "border-primary/20 bg-primary/5" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold text-sm">
                    {index + 1}
                  </div>
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>{submission.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{submission.username}</span>
                      {isTopTen && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Star className="w-3 h-3" />
                          Top 10
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3 text-green-500" />
                        <span>{submission.votes.yes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsDown className="w-3 h-3 text-red-500" />
                        <span>{submission.votes.no}</span>
                      </div>
                      <span>{yesPercentage.toFixed(0)}% approval</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}