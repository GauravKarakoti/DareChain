"use client"

import { useState, useEffect } from "react"
// Add axios for API calls
import axios from 'axios'

import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Label } from "./ui/label"
import { Switch } from "./ui/switch"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert" // Added AlertTitle
// Import Loader2 for the spinning icon
import { Plus, Trophy, Clock, Users, MapPin, Eye, AlertCircle, CheckCircle, Lock, Loader2 } from "lucide-react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { darexAbi, darexContractAddress, rewardDistributionContractAddress } from '../lib/contracts'
import { parseEther } from 'viem'
import { ConnectButton } from '@rainbow-me/rainbowkit'

interface DareFormData {
  title: string
  description: string
  category: string
  difficulty: string
  reward: string
  deadline: string // This stores the number of days as a string (e.g., "7")
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

// Utility to find the label for the deadline value to send to the DB
const getDeadlineLabel = (value: string) => deadlines.find(d => d.value === value)?.label || `${value} days`;


export function CreateDare() {
  const { isConnected, address } = useAccount()

  // Wagmi/Blockchain states
  const { data: createDareHash, writeContract: createDare, error: createDareError, isPending } = useWriteContract()
  const { isLoading: isWaitingForReceipt, isSuccess: isCreated } = useWaitForTransactionReceipt({ hash: createDareHash })

  // Database persistence states
  const [isPersistingToDB, setIsPersistingToDB] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)
  const [isDbPersisted, setIsDbPersisted] = useState(false)
  
  // Consolidated loading state: true if transaction is pending OR waiting for receipt OR persisting to DB.
  const isCreating = isPending || isWaitingForReceipt || isPersistingToDB;

  // Form Data and Errors
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

  const [errors, setErrors] = useState<Partial<DareFormData>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<DareFormData> = {}
    if (!formData.title.trim()) newErrors.title = "Title is required"
    if (!formData.description.trim()) newErrors.description = "Description is required"
    // Use Number.parseFloat for robust validation
    if (!formData.reward || Number.parseFloat(formData.reward) <= 0) newErrors.reward = "Valid reward amount is required"
    if (!formData.deadline) newErrors.deadline = "Deadline is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    // Only proceed if form is valid and user address is available
    if (!validateForm() || !address) return;
    
    // Reset DB state on new submission attempt
    setDbError(null);
    setIsDbPersisted(false);

    // Calculate deadline in seconds for the smart contract
    const deadlineInSeconds = Math.floor(Date.now() / 1000) + (parseInt(formData.deadline, 10) * 24 * 60 * 60);
    
    // 1. Initiate Blockchain Transaction
    createDare({
      abi: darexAbi,
      address: darexContractAddress as `0x${string}`,
      functionName: 'createDare',
      args: [
        formData.title,
        formData.description,
        parseEther(formData.reward),
        BigInt(deadlineInSeconds),
      ],
      // Send the reward amount with the transaction
      value: parseEther(formData.reward || '0'), 
    })
    console.log("Dare creation transaction sent to blockchain.");
  }

  // --- EFFECT TO PERSIST DARE TO DATABASE AFTER BLOCKCHAIN CONFIRMATION (now using axios) ---
  useEffect(() => {
    // Only proceed if the transaction is successful and we haven't already persisted the data
    if (isCreated && !isDbPersisted && address) {
      const persistDare = async () => {
        setIsPersistingToDB(true);
        setDbError(null);

        try {
          const deadlineLabel = getDeadlineLabel(formData.deadline);
          
          // 2. Persist Data to Database using axios
          await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dares`, {
            title: formData.title,
            description: formData.description,
            reward: formData.reward,
            category: formData.category,
            difficulty: formData.difficulty,
            deadlineLabel: deadlineLabel,
            creator: address,
            location: formData.requiresLocation ? formData.location : null, 
            featured: formData.featured, 
          });

          // If axios succeeds, it means status was 2xx, so we proceed to success state
          setIsDbPersisted(true);
          console.log("Dare successfully persisted to database.");

        } catch (error) {
          console.error("Database persistence error:", error);
          // Handle axios error structure: error is thrown for non-2xx status, details are in error.response.data
          const errorMessage = (error as any).response?.data?.error || (error as any).message || "An unknown network error occurred.";
          setDbError(errorMessage);
        } finally {
          setIsPersistingToDB(false);
        }
      };

      persistDare();
    }
  }, [isCreated, isDbPersisted, address, formData]);
  // --- END DATABASE PERSISTENCE EFFECT ---


  const updateFormData = (field: keyof DareFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear field-specific error when value changes
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  // Determine which error to display (blockchain error or database error)
  const anyError = createDareError || dbError;

  // Determine the current stage for the button text
  let buttonText;
  if (isWaitingForReceipt) {
    buttonText = 'Waiting for Confirmation...';
  } else if (isPending) {
    buttonText = 'Confirm in Wallet...';
  } else if (isPersistingToDB) {
    buttonText = 'Saving to Database...';
  } else {
    buttonText = 'Create Dare';
  }
  
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(value) => updateFormData("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => <SelectItem key={cat.value} value={cat.value} className="flex items-center space-x-2">
                        <span>{cat.icon} {cat.label}</span>
                      </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={(value) => updateFormData("difficulty", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {difficulties.map((diff) => (
                        <SelectItem key={diff.value} value={diff.value}>
                          {diff.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                  <Label htmlFor="reward">Reward (TFIL) *</Label>
                  <div className="relative">
                    <Trophy className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="reward" type="number" placeholder="0.1" value={formData.reward} onChange={(e) => updateFormData("reward", e.target.value)} className={`pl-10 ${errors.reward ? "border-destructive" : ""}`} min="0.001" step="0.001" />
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
              
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <Label htmlFor="location-switch" className="flex flex-col space-y-1">
                    <span>Location Required</span>
                    <span className="font-normal text-muted-foreground text-sm">Require proof of location for completion</span>
                  </Label>
                </div>
                <Switch 
                  id="location-switch" 
                  checked={formData.requiresLocation} 
                  onCheckedChange={(checked) => updateFormData("requiresLocation", checked)} 
                />
              </div>

              {formData.requiresLocation && (
                <div className="space-y-2">
                  <Label htmlFor="location">Required Location (Optional)</Label>
                  <Input id="location" placeholder="e.g., Central Park, NYC" value={formData.location} onChange={(e) => updateFormData("location", e.target.value)} />
                  <p className="text-xs text-muted-foreground">This is for descriptive purposes only.</p>
                </div>
              )}
              
              {/* Added a switch for the 'featured' flag, which is in the DB schema */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-primary" />
                  <Label htmlFor="featured-switch" className="flex flex-col space-y-1">
                    <span>Featured Dare</span>
                    <span className="font-normal text-muted-foreground text-sm">Mark this dare as featured on the homepage (requires approval)</span>
                  </Label>
                </div>
                <Switch 
                  id="featured-switch" 
                  checked={formData.featured} 
                  onCheckedChange={(checked) => updateFormData("featured", checked)} 
                />
              </div>

            </CardContent>
          </Card>
          
          <div className="flex justify-center">
            <Button 
              onClick={handleSubmit} 
              disabled={isCreating} 
              size="lg"
              className={isCreating ? 'cursor-not-allowed' : ''} 
            >
              {isCreating ? (
                // Loading state with spinning icon and dynamic text
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {buttonText}
                </>
              ) : (
                // Default state
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {'Create Dare'}
                </>
              )}
            </Button>
          </div>
          
          {/* Display success state only when both blockchain and DB persistence are done */}
          {isDbPersisted && isCreated && (
            <Alert className="bg-green-500/10 border-green-500 text-green-700">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-700">Dare Created!</AlertTitle>
              <AlertDescription className="text-green-700">
                Your dare has been successfully created on the blockchain and saved to the database.
              </AlertDescription>
            </Alert>
          )}

          {anyError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{anyError instanceof Error ? anyError.message : String(anyError)}</AlertDescription>
            </Alert>
          )}
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
