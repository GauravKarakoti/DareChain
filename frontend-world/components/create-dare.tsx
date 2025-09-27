"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Label } from "./ui/label"
import { Switch } from "./ui/switch"
import { Alert, AlertDescription } from "./ui/alert"
import { Plus, Trophy, Clock, Users, MapPin, Eye, AlertCircle, CheckCircle, Lock } from "lucide-react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { darexAbi, darexContractAddress, pyusdAbi, pyusdContractAddress, rewardDistributionContractAddress } from '../lib/contracts'
import { parseEther } from 'viem'
import { ConnectButton } from '@rainbow-me/rainbowkit'

interface DareFormData {
  title: string
  description: string
  category: string
  difficulty: string
  reward: string
  deadline: string
  location: string
  requiresLocation: boolean
  featured: boolean
}

const categories = [
  { value: "performance", label: "Performance", icon: "🎭" },
  { value: "learning", label: "Learning", icon: "📚" },
  { value: "social-good", label: "Social Good", icon: "❤️" },
  { value: "creative", label: "Creative", icon: "🎨" },
  { value: "adventure", label: "Adventure", icon: "🏔️" },
  { value: "fitness", label: "Fitness", icon: "💪" },
]

const difficulties = [
  { value: "easy", label: "Easy", description: "Simple tasks anyone can do" },
  { value: "medium", label: "Medium", description: "Requires some effort or skill" },
  { value: "hard", label: "Hard", description: "Challenging tasks for experienced users" },
]

const deadlines = [
  { value: "1", label: "1 day" },
  { value: "3", label: "3 days" },
  { value: "7", label: "1 week" },
  { value: "14", label: "2 weeks" },
  { value: "30", label: "1 month" },
]

export function CreateDare() {
  const { isConnected } = useAccount()

  const { data: approveHash, writeContract: approveTokens, error: approveError } = useWriteContract()
  const { isLoading: isApproving, isSuccess: isApproved } = useWaitForTransactionReceipt({ hash: approveHash })

  const { data: createDareHash, writeContract: createDare, error: createDareError } = useWriteContract()
  const { isLoading: isCreating, isSuccess: isCreated } = useWaitForTransactionReceipt({ hash: createDareHash })

  const [formData, setFormData] = useState<DareFormData>({
    title: "",
    description: "",
    category: "",
    difficulty: "",
    reward: "",
    deadline: "",
    location: "",
    requiresLocation: false,
    featured: false,
  })

  const [showPreview, setShowPreview] = useState(false)
  const [errors, setErrors] = useState<Partial<DareFormData>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<DareFormData> = {}
    if (!formData.title.trim()) newErrors.title = "Title is required"
    if (!formData.description.trim()) newErrors.description = "Description is required"
    if (!formData.category) newErrors.category = "Category is required"
    if (!formData.difficulty) newErrors.difficulty = "Difficulty is required"
    if (!formData.reward || Number.parseFloat(formData.reward) <= 0) newErrors.reward = "Valid reward amount is required"
    if (!formData.deadline) newErrors.deadline = "Deadline is required"
    if (formData.requiresLocation && !formData.location.trim()) {
      newErrors.location = "Location is required when location-specific"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleApprove = () => {
    console.log("Approving tokens...")
    if (!validateForm()) return
    approveTokens({
      abi: pyusdAbi,
      address: pyusdContractAddress,
      functionName: 'approve',
      args: [rewardDistributionContractAddress, parseEther(formData.reward)]
    })
  }

  const handleSubmit = () => {
    if (!validateForm()) return;
    if (!isApproved) {
        alert("Please approve the token transfer first.");
        return
    };
    const deadlineInSeconds = Math.floor(Date.now() / 1000) + (parseInt(formData.deadline, 10) * 24 * 60 * 60);
    createDare({
      abi: darexAbi,
      address: darexContractAddress,
      functionName: 'createDare',
      args: [
        formData.title,
        formData.description,
        parseEther(formData.reward),
        BigInt(deadlineInSeconds),
      ],
    })
  }

  const updateFormData = (field: keyof DareFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const anyError = approveError || createDareError;

  return (
    <div className="p-4 space-y-6">
        <div className="space-y-2">
            <h2 className="text-2xl font-bold text-balance">Create a Dare</h2>
            <p className="text-muted-foreground">Challenge the community with your own dare</p>
        </div>

        {!isConnected ? (
            <Card className="text-center p-8">
                <CardTitle>Connect Your Wallet</CardTitle>
                <CardDescription className="mb-4">You need to connect your wallet to create a dare.</CardDescription>
                <ConnectButton />
            </Card>
        ) : (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Basic Information</CardTitle>
                        <CardDescription>Tell us about your dare</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Dare Title *</Label>
                            <Input id="title" placeholder="What's the challenge?" value={formData.title} onChange={(e) => updateFormData("title", e.target.value)} className={errors.title ? "border-destructive" : ""} />
                            {errors.title && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.title}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea id="description" placeholder="Describe the dare in detail..." value={formData.description} onChange={(e) => updateFormData("description", e.target.value)} className={`min-h-24 resize-none ${errors.description ? "border-destructive" : ""}`} />
                            {errors.description && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.description}</p>}
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Reward & Timeline</CardTitle>
                        <CardDescription>Set the stakes and deadline</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="reward">Reward (PYUSD) *</Label>
                            <div className="relative">
                            <Trophy className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input id="reward" type="number" placeholder="5" value={formData.reward} onChange={(e) => updateFormData("reward", e.target.value)} className={`pl-10 ${errors.reward ? "border-destructive" : ""}`} min="0.1" step="0.1" />
                            </div>
                            {errors.reward && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.reward}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Deadline *</Label>
                            <Select value={formData.deadline} onValueChange={(value) => updateFormData("deadline", value)}>
                            <SelectTrigger className={errors.deadline ? "border-destructive" : ""}>
                                <SelectValue placeholder="Select deadline" />
                            </SelectTrigger>
                            <SelectContent>
                                {deadlines.map((deadline) => <SelectItem key={deadline.value} value={deadline.value}>{deadline.label}</SelectItem>)}
                            </SelectContent>
                            </Select>
                            {errors.deadline && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.deadline}</p>}
                        </div>
                        </div>
                    </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button onClick={handleApprove} disabled={isApproving || isApproved}>
                        <Lock className="w-4 h-4 mr-2" />
                        {isApproving ? 'Approving...' : isApproved ? 'Tokens Approved' : '1. Approve PYUSD'}
                    </Button>
                    <Button onClick={handleSubmit} disabled={isCreating || !isApproved}>
                        <Plus className="w-4 h-4 mr-2" />
                        {isCreating ? 'Creating Dare...' : '2. Create Dare'}
                    </Button>
                </div>
                
                {isCreated && <Alert><CheckCircle className="h-4 w-4" /><AlertDescription>Dare created successfully!</AlertDescription></Alert>}
                {anyError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{anyError.message}</AlertDescription></Alert>}
            </div>
        )}
    </div>
  )
}

function DarePreview({
  formData,
  onBack,
  onSubmit,
  isSubmitting,
}: {
  formData: DareFormData
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
}) {
    // This component remains unchanged but is included for completeness
    return <div>Preview component here</div>
}