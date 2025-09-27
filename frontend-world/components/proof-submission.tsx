"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Camera,
  Video,
  Upload,
  X,
  Play,
  Pause,
  Check,
  AlertCircle,
  FileImage,
  FileVideo,
  Clock,
  Trophy,
} from "lucide-react"

interface ProofFile {
  id: string
  file: File
  type: "image" | "video"
  url: string
  thumbnail?: string
}

interface DareDetails {
  id: number
  title: string
  description: string
  reward: number
  deadline: string
  requirements: string[]
}

const mockDare: DareDetails = {
  id: 1,
  title: "Dance for 30 seconds in public",
  description:
    "Show off your moves in a busy public space and record it! Extra points for creativity and crowd reaction.",
  reward: 5,
  deadline: "2 days",
  requirements: [
    "Must be in a public space with people around",
    "Dance for at least 30 seconds",
    "Show your face clearly in the video",
    "Include audio of the music or environment",
  ],
}

export function ProofSubmission({ dareId }: { dareId?: number }) {
  const [files, setFiles] = useState<ProofFile[]>([])
  const [description, setDescription] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const selectedFiles = Array.from(event.target.files || [])

    selectedFiles.forEach((file) => {
      if (files.length >= 5) {
        alert("Maximum 5 files allowed")
        return
      }

      const url = URL.createObjectURL(file)
      const newFile: ProofFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        type,
        url,
      }

      // Generate thumbnail for video
      if (type === "video") {
        generateVideoThumbnail(file).then((thumbnail) => {
          newFile.thumbnail = thumbnail
          setFiles((prev) => [...prev, newFile])
        })
      } else {
        setFiles((prev) => [...prev, newFile])
      }
    })

    // Reset input
    if (event.target) {
      event.target.value = ""
    }
  }

  const generateVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement("video")
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        video.currentTime = 1 // Get frame at 1 second
      }

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0)
          resolve(canvas.toDataURL())
        }
      }

      video.src = URL.createObjectURL(file)
    })
  }

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id)
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url)
        if (fileToRemove.thumbnail) {
          URL.revokeObjectURL(fileToRemove.thumbnail)
        }
      }
      return prev.filter((f) => f.id !== id)
    })
  }

  const simulateUpload = async () => {
    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i)
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    setIsUploading(false)
  }

  const handleSubmit = async () => {
    if (files.length === 0) {
      alert("Please upload at least one file")
      return
    }

    if (!description.trim()) {
      alert("Please add a description")
      return
    }

    setIsSubmitting(true)
    await simulateUpload()
    setSubmitted(true)
    setIsSubmitting(false)
  }

  if (submitted) {
    return <SubmissionSuccess dare={mockDare} />
  }

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-balance">Submit Proof</h2>
        <p className="text-muted-foreground">Upload evidence that you completed the dare</p>
      </div>

      {/* Dare Details */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-lg leading-tight text-balance">{mockDare.title}</CardTitle>
              <CardDescription className="text-pretty leading-relaxed">{mockDare.description}</CardDescription>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Trophy className="w-3 h-3" />
              {mockDare.reward} USDC
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Deadline: {mockDare.deadline}</span>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Requirements:</Label>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {mockDare.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload Evidence</CardTitle>
          <CardDescription>Add photos or videos showing you completed the dare</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
              disabled={files.length >= 5}
            >
              <Camera className="w-4 h-4 mr-2" />
              Add Photos
            </Button>
            <Button
              variant="outline"
              onClick={() => videoInputRef.current?.click()}
              className="flex-1"
              disabled={files.length >= 5}
            >
              <Video className="w-4 h-4 mr-2" />
              Add Videos
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e, "image")}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e, "video")}
          />

          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Uploaded Files ({files.length}/5)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    files.forEach((file) => {
                      URL.revokeObjectURL(file.url)
                      if (file.thumbnail) URL.revokeObjectURL(file.thumbnail)
                    })
                    setFiles([])
                  }}
                >
                  Clear All
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {files.map((file) => (
                  <FilePreview key={file.id} file={file} onRemove={() => removeFile(file.id)} />
                ))}
              </div>
            </div>
          )}

          {files.length === 0 && (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">No files uploaded yet</p>
              <p className="text-xs text-muted-foreground">Upload photos or videos as proof of completion</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Description</CardTitle>
          <CardDescription>Tell us about your experience completing this dare</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Describe what you did, how it went, any challenges you faced..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-24 resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">{description.length}/500 characters</p>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {isUploading && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading to Filecoin...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        className="w-full"
        size="lg"
        disabled={files.length === 0 || !description.trim() || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Submitting Proof...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Submit Proof
          </>
        )}
      </Button>

      {files.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Make sure your evidence clearly shows you completing all the requirements listed above.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

function FilePreview({ file, onRemove }: { file: ProofFile; onRemove: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false)
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

  return (
    <div className="relative group">
      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
        {file.type === "image" ? (
          <img src={file.url || "/placeholder.svg"} alt="Proof" className="w-full h-full object-cover" />
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
            />
            <Button
              variant="secondary"
              size="icon"
              className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-black/50 hover:bg-black/70"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="absolute bottom-2 left-2 right-2">
        <div className="bg-black/50 backdrop-blur-sm rounded px-2 py-1 flex items-center gap-1">
          {file.type === "image" ? (
            <FileImage className="w-3 h-3 text-white" />
          ) : (
            <FileVideo className="w-3 h-3 text-white" />
          )}
          <span className="text-xs text-white truncate">{file.file.name}</span>
        </div>
      </div>

      {/* Remove Button */}
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onRemove}
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  )
}

function SubmissionSuccess({ dare }: { dare: DareDetails }) {
  return (
    <div className="p-4 space-y-6">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-2xl flex items-center justify-center mx-auto">
          <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-balance">Proof Submitted!</h2>
          <p className="text-muted-foreground text-pretty leading-relaxed">
            Your submission has been uploaded to Filecoin and is now ready for community voting.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-lg">What happens next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-primary-foreground font-bold">1</span>
              </div>
              <div className="space-y-1">
                <p className="font-medium">Community Review</p>
                <p className="text-sm text-muted-foreground">
                  The community will vote on submissions to select the top 10 participants
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-secondary-foreground font-bold">2</span>
              </div>
              <div className="space-y-1">
                <p className="font-medium">Organizer Selection</p>
                <p className="text-sm text-muted-foreground">
                  The dare creator will choose the winner from the top 10 submissions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-accent-foreground font-bold">3</span>
              </div>
              <div className="space-y-1">
                <p className="font-medium">Reward Distribution</p>
                <p className="text-sm text-muted-foreground">
                  Winner receives {dare.reward} USDC, voters get a share from the pool
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 bg-transparent">
          View Submission
        </Button>
        <Button className="flex-1">Back to Dares</Button>
      </div>
    </div>
  )
}
