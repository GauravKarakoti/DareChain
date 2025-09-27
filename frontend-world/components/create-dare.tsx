"use client"

import { useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Plus, Trophy, Clock, Users, MapPin, Eye, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<DareFormData>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<DareFormData> = {}

    if (!formData.title.trim()) newErrors.title = "Title is required"
    if (!formData.description.trim()) newErrors.description = "Description is required"
    if (!formData.category) newErrors.category = "Category is required"
    if (!formData.difficulty) newErrors.difficulty = "Difficulty is required"
    if (!formData.reward || Number.parseFloat(formData.reward) <= 0)
      newErrors.reward = "Valid reward amount is required"
    if (!formData.deadline) newErrors.deadline = "Deadline is required"
    if (formData.requiresLocation && !formData.location.trim()) {
      newErrors.location = "Location is required when location-specific"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dares`, formData);
      alert("Dare created successfully!");
      // Optionally reset form or redirect
      setFormData({
        title: "",
        description: "",
        category: "",
        difficulty: "",
        reward: "",
        deadline: "",
        location: "",
        requiresLocation: false,
        featured: false,
      });
      setShowPreview(false);
    } catch (error) {
      console.error("Failed to create dare:", error);
      alert("Failed to create dare. See console for details.");
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFormData = (field: keyof DareFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  if (showPreview) {
    return (
      <DarePreview
        formData={formData}
        onBack={() => setShowPreview(false)}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    )
  }

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-balance">Create a Dare</h2>
        <p className="text-muted-foreground">Challenge the community with your own dare</p>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
            <CardDescription>Tell us about your dare</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Dare Title *</Label>
              <Input
                id="title"
                placeholder="What's the challenge?"
                value={formData.title}
                onChange={(e) => updateFormData("title", e.target.value)}
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.title}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the dare in detail. What should participants do? Any specific requirements?"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                className={`min-h-24 resize-none ${errors.description ? "border-destructive" : ""}`}
              />
              {errors.description && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground">{formData.description.length}/500 characters</p>
            </div>
          </CardContent>
        </Card>

        {/* Category and Difficulty */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Classification</CardTitle>
            <CardDescription>Help users find your dare</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <Button
                    key={category.value}
                    variant={formData.category === category.value ? "default" : "outline"}
                    onClick={() => updateFormData("category", category.value)}
                    className="justify-start gap-2 h-auto py-3"
                  >
                    <span>{category.icon}</span>
                    <span>{category.label}</span>
                  </Button>
                ))}
              </div>
              {errors.category && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.category}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Difficulty Level *</Label>
              <Select value={formData.difficulty} onValueChange={(value) => updateFormData("difficulty", value)}>
                <SelectTrigger className={errors.difficulty ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map((difficulty) => (
                    <SelectItem key={difficulty.value} value={difficulty.value}>
                      <div className="space-y-1">
                        <div className="font-medium">{difficulty.label}</div>
                        <div className="text-xs text-muted-foreground">{difficulty.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.difficulty && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.difficulty}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reward and Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reward & Timeline</CardTitle>
            <CardDescription>Set the stakes and deadline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reward">Reward (USDC) *</Label>
                <div className="relative">
                  <Trophy className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reward"
                    type="number"
                    placeholder="5"
                    value={formData.reward}
                    onChange={(e) => updateFormData("reward", e.target.value)}
                    className={`pl-10 ${errors.reward ? "border-destructive" : ""}`}
                    min="0.1"
                    step="0.1"
                  />
                </div>
                {errors.reward && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.reward}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Deadline *</Label>
                <Select value={formData.deadline} onValueChange={(value) => updateFormData("deadline", value)}>
                  <SelectTrigger className={errors.deadline ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select deadline" />
                  </SelectTrigger>
                  <SelectContent>
                    {deadlines.map((deadline) => (
                      <SelectItem key={deadline.value} value={deadline.value}>
                        {deadline.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.deadline && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.deadline}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Location Settings</CardTitle>
            <CardDescription>Specify if your dare requires a specific location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Requires Specific Location</Label>
                <p className="text-sm text-muted-foreground">Toggle if participants must be at a specific place</p>
              </div>
              <Switch
                checked={formData.requiresLocation}
                onCheckedChange={(checked) => updateFormData("requiresLocation", checked)}
              />
            </div>

            {formData.requiresLocation && (
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="e.g., Times Square, New York"
                    value={formData.location}
                    onChange={(e) => updateFormData("location", e.target.value)}
                    className={`pl-10 ${errors.location ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.location && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.location}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
            className="flex-1"
            disabled={!formData.title || !formData.description}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Dare
              </>
            )}
          </Button>
        </div>
      </div>
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
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getCategoryLabel = (value: string) => {
    return categories.find((cat) => cat.value === value)?.label || value
  }

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-balance">Preview Your Dare</h2>
        <p className="text-muted-foreground">This is how your dare will appear to other users</p>
      </div>

      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Review your dare carefully before publishing. You won't be able to edit it once it's live.
        </AlertDescription>
      </Alert>

      {/* Preview Card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-lg leading-tight text-balance">{formData.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>by You</span>
                  <Badge variant="outline" className="text-xs">
                    {getCategoryLabel(formData.category)}
                  </Badge>
                </div>
              </div>
            </div>
            <CardDescription className="text-pretty leading-relaxed">{formData.description}</CardDescription>
            {formData.requiresLocation && formData.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{formData.location}</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-secondary" />
                <span className="font-medium">{formData.reward} USDC</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{deadlines.find((d) => d.value === formData.deadline)?.label}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>0</span>
              </div>
            </div>
            <Badge className={getDifficultyColor(formData.difficulty)}>
              {difficulties.find((d) => d.value === formData.difficulty)?.label}
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1">Accept Dare</Button>
            <Button variant="outline" size="icon">
              <Trophy className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 bg-transparent">
          Back to Edit
        </Button>
        <Button onClick={onSubmit} className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Publishing...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Publish Dare
            </>
          )}
        </Button>
      </div>
    </div>
  )
}