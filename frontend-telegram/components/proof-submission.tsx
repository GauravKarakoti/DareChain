"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
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
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi"
import { darexAbi, darexContractAddress } from "@/lib/contracts"
import axios from "axios"
import { useRouter } from "next/navigation"

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

interface UserSubmission {
    description: string;
    fileCID: string;
}

export function ProofSubmission({ dareId }: { dareId?: number }) {
  const [files, setFiles] = useState<ProofFile[]>([])
  const [description, setDescription] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [fileCID, setFileCID] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const { address } = useAccount()
  const [dare, setDare] = useState<DareDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAlreadySubmitted, setHasAlreadySubmitted] = useState(false);
  const [userSubmission, setUserSubmission] = useState<UserSubmission | null>(null);

  const { data: submitProofHash, writeContract: submitProof, error: submitProofError, isError } = useWriteContract()
  const { isLoading: isSubmitting, isSuccess: isSubmittedSuccess } = useWaitForTransactionReceipt({ hash: submitProofHash })

  const { data: hasSubmittedData, isLoading: isLoadingSubmissionStatus } = useReadContract({
    abi: darexAbi,
    address: darexContractAddress as `0x${string}`,
    functionName: 'hasSubmitted',
    args: [dareId ? BigInt(dareId) : 0, address],
    query: {
        enabled: !!dareId && !!address,
    }
  });

  useEffect(() => {
    if(hasSubmittedData) {
        setHasAlreadySubmitted(true);
    }
  }, [hasSubmittedData])

  useEffect(() => {
    if (hasAlreadySubmitted && dareId && address) {
        const fetchUserSubmission = async () => {
            // This is a hypothetical endpoint. You will need to implement this on your backend.
            // It should fetch the submission details for a specific user and dare.
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/submission`, {
                    params: {
                        dareId,
                        walletAddress: address
                    }
                });
                console.log("Fetched user submission:", response.data);
                setUserSubmission(response.data.data);
            } catch (error) {
                console.error("Failed to fetch user submission details:", error);
                // Set an empty object or handle error to prevent infinite loading
                setUserSubmission({ description: "Could not load your submission description.", fileCID: "N/A" });
            }
        };
        fetchUserSubmission();
    }
  }, [hasAlreadySubmitted, dareId, address]);


  useEffect(() => {
    if (dareId) {
      const fetchDareDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dares/${dareId}`);
          setDare(response.data.data);
        } catch (error) {
          console.error(`Failed to fetch dare details for dare ${dareId}:`, error);
          setError("Failed to load dare details.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchDareDetails();
    }
  }, [dareId]);


  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const selectedFiles = Array.from(event.target.files || [])

    selectedFiles.forEach((file) => {
      if (files.length >= 5) {
        alert("Maximum 5 files allowed")
        return
      }
      const url = URL.createObjectURL(file)
      const newFile: ProofFile = { id: Math.random().toString(36).substr(2, 9), file, type, url, }
      if (type === "video") {
        generateVideoThumbnail(file).then((thumbnail) => {
          newFile.thumbnail = thumbnail
          setFiles((prev) => [...prev, newFile])
        })
      } else {
        setFiles((prev) => [...prev, newFile])
      }
    })
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
        video.currentTime = 1
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

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Please select files to upload.");
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    files.forEach(f => formData.append('files', f.file));

    try {
      const response = await axios.post('/api/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total ?? (files.reduce((acc, f) => acc + f.file.size, 0));
          const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
          setUploadProgress(percentCompleted);
        },
      });
      setFileCID(response.data.cid);
      alert(`Files uploaded successfully! CID: ${response.data.cid}`);
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("File upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };


  const handleSubmit = () => {
    if (!dareId || !fileCID) {
      alert("Dare ID is missing or files have not been uploaded to Filecoin first.");
      return;
    }
    if (!description.trim()) {
      alert("Please add a description")
      return
    }
    submitProof({
      abi: darexAbi,
      address: darexContractAddress as `0x${string}`,
      functionName: 'submitProof',
      args: [BigInt(dareId), fileCID],
    })
  }

  useEffect(() => {
    if (isSubmittedSuccess && fileCID && dareId && address) {
      const saveSubmissionToDb = async () => {
        try {
          await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/submissions`, {
            dareId,
            walletAddress: address,
            description,
            fileCID,
          });
          console.log('Submission saved to database');
        } catch (error) {
          console.error("Failed to save submission to database:", error);
        }
      };
      saveSubmissionToDb();
    }
  }, [isSubmittedSuccess, fileCID, dareId, address, description]);

  if (isLoading || isLoadingSubmissionStatus) {
    return <div>Loading dare details...</div>;
  }
  
  if (hasAlreadySubmitted) {
    if (dare && userSubmission) {
        console.log("User submission data:", userSubmission);
        return <AlreadySubmitted dare={dare} submission={userSubmission} />;
    }
    // Show a loading state while submission data is being fetched
    return (
        <div className="p-4 space-y-6">
            <Alert variant="default">
                <Check className="h-4 w-4" />
                <AlertDescription>
                    You have already submitted proof for this dare. Loading your submission...
                </AlertDescription>
            </Alert>
        </div>
    )
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!dare) {
    return <div className="p-4">Dare not found.</div>;
  }


  if (isSubmittedSuccess) {
    return <SubmissionSuccess dare={dare} submission={{ description, fileCID: fileCID || "" }} />
  }

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-balance">Submit Proof</h2>
        <p className="text-muted-foreground">Upload evidence that you completed the dare</p>
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
              {dare.reward} TFIL
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Deadline: {dare.deadline}</span>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Requirements:</Label>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {dare.requirements?.map((req, index) => (
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Upload Evidence to Filecoin</CardTitle>
          <CardDescription>Add photos or videos. This will upload them to decentralized storage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1" disabled={files.length >= 5}>
              <Camera className="w-4 h-4 mr-2" /> Add Photos
            </Button>
            <Button variant="outline" onClick={() => videoInputRef.current?.click()} className="flex-1" disabled={files.length >= 5}>
              <Video className="w-4 h-4 mr-2" /> Add Videos
            </Button>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileSelect(e, "image")} />
          <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={(e) => handleFileSelect(e, "video")} />

          {files.length > 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {files.map((file) => (
                  <FilePreview key={file.id} file={file} onRemove={() => removeFile(file.id)} />
                ))}
              </div>
              <Button onClick={handleUpload} className="w-full" disabled={isUploading || !!fileCID}>
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? `Uploading... ${uploadProgress}%` : fileCID ? 'Uploaded!' : 'Upload to Filecoin'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. Submit Proof On-Chain</CardTitle>
          <CardDescription>This will record the Filecoin CID on the blockchain.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea placeholder="Describe what you did..." value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-24 resize-none" />
          <p className="text-xs text-muted-foreground mt-2">{description.length}/500 characters</p>
          <Button onClick={handleSubmit} className="w-full mt-4" size="lg" disabled={!fileCID || isSubmitting || !description.trim()}>
            {isSubmitting ? 'Submitting...' : 'Submit Proof to Smart Contract'}
          </Button>
        </CardContent>
      </Card>

      {isError && (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
                Transaction failed. Possible reasons:
                <ul>
                    <li>- The dare has expired.</li>
                    <li>- You have already submitted a proof for this dare.</li>
                    <li>- You are the creator of the dare.</li>
                    <li>- The dare has already been completed.</li>
                </ul>
                <p className="mt-2 text-xs">
                    Error: {submitProofError?.message}
                </p>
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

function SubmissionSuccess({ dare, submission }: { dare: DareDetails; submission: UserSubmission }) {
    const handleViewOnGateway = () => {
        if (submission.fileCID && submission.fileCID !== "N/A") {
            window.open(`https://gateway.lighthouse.storage/ipfs/${submission.fileCID}`, '_blank');
        }
    };

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
                    The community will now be able to view and vote on all submissions for this dare.
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
                    After the deadline, the dare creator will review all submissions and select a single winner.
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
                    Once the winner is chosen and votes are tallied, the {dare.reward} TFIL reward will be distributed.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={handleViewOnGateway}>
            View Submission
          </Button>
        </div>
      </div>
    )
}

function AlreadySubmitted({ dare, submission }: { dare: DareDetails; submission: UserSubmission }) {
    const handleViewOnGateway = () => {
        if (submission.fileCID && submission.fileCID !== "N/A") {
            window.open(`https://gateway.lighthouse.storage/ipfs/${submission.fileCID}`, '_blank');
        }
    };

    return (
      <div className="p-4 space-y-6">
        <div className="text-center space-y-2">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center mx-auto">
                <Check className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-balance">You've Already Submitted!</h2>
            <p className="text-muted-foreground">Here are the details of your submission for this dare.</p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>{dare.title}</CardTitle>
                <CardDescription>Your submission is awaiting community review and voting.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label className="text-sm font-medium">Your Description</Label>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md mt-1 whitespace-pre-wrap">{submission.description}</p>
                </div>
                <div>
                    <Label className="text-sm font-medium">Your Proof (Filecoin CID)</Label>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md mt-1 break-all">{submission.fileCID}</p>
                </div>
                 <Button onClick={handleViewOnGateway} className="w-full" disabled={!submission.fileCID || submission.fileCID === "N/A"}>
                    View Files on IPFS Gateway
                </Button>
            </CardContent>
        </Card>
      </div>
    )
}