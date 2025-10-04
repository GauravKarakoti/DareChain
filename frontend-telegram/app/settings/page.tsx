"use client"

import { useState, useEffect } from "react"
import { useAccount, useDisconnect } from "wagmi"
import { useTheme } from "next-themes"
import axios from "axios";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Sun, Moon, Laptop, Bell, User, Palette, LogOut, Trash2 } from "lucide-react"

export default function SettingsPage() {
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const { setTheme } = useTheme()

  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")

  const [notifications, setNotifications] = useState({
    dareUpdates: true,
    comments: true,
    submissionStatus: true,
  })

  useEffect(() => {
    if (address) {
      // Fetch user profile
      axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/${address}`)
        .then(response => {
          const { displayName, bio } = response.data.data;
          setDisplayName(displayName || "");
          setBio(bio || "");
        })
        .catch(error => console.error("Failed to fetch profile:", error));

      // Fetch notification settings
      axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/settings/notifications/${address}`)
        .then(response => {
          setNotifications(response.data.data);
        })
        .catch(error => console.error("Failed to fetch notification settings:", error));
    }
  }, [address]);

  const handleNotificationChange = (key: keyof typeof notifications) => {
    const newNotifications = { ...notifications, [key]: !notifications[key] };
    setNotifications(newNotifications);

    axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/settings/notifications`, {
      walletAddress: address,
      ...newNotifications,
    })
      .catch(error => console.error("Failed to update notification settings:", error));
  }

  const handleSaveChanges = () => {
    axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile`, {
      walletAddress: address,
      displayName,
      bio,
    })
      .then(() => alert("Profile changes saved!"))
      .catch(error => {
        console.error("Failed to save profile:", error);
        alert("Failed to save profile changes.");
      });
  }

  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure you want to delete your account? This action is irreversible.")) {
      axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${address}`)
        .then(() => {
          alert("Account deleted!");
          disconnect();
        })
        .catch(error => {
          console.error("Failed to delete account:", error);
          alert("Failed to delete account.");
        });
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and application preferences.</p>
      </div>
      <Separator />

      {/* --- Profile Settings --- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User /> Profile</CardTitle>
          <CardDescription>Update your public display name and bio.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="Your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell everyone a little about yourself."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </CardContent>
      </Card>

      {/* --- Notification Settings --- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell /> Notifications</CardTitle>
          <CardDescription>Choose how you want to be notified about activity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <Label htmlFor="dareUpdates" className="font-medium">Dare Updates</Label>
            <Switch
              id="dareUpdates"
              checked={notifications.dareUpdates}
              onCheckedChange={() => handleNotificationChange('dareUpdates')}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <Label htmlFor="comments" className="font-medium">Comments & Replies</Label>
            <Switch
              id="comments"
              checked={notifications.comments}
              onCheckedChange={() => handleNotificationChange('comments')}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <Label htmlFor="submissionStatus" className="font-medium">Submission Status</Label>
            <Switch
              id="submissionStatus"
              checked={notifications.submissionStatus}
              onCheckedChange={() => handleNotificationChange('submissionStatus')}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* --- Appearance Settings --- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette /> Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the app.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
           <Button variant={"outline"} className="flex-1 justify-center gap-2" onClick={() => setTheme('light')}>
             <Sun className="w-4 h-4" /> Light
           </Button>
           <Button variant={"outline"} className="flex-1 justify-center gap-2" onClick={() => setTheme('dark')}>
             <Moon className="w-4 h-4" /> Dark
           </Button>
           <Button variant={"outline"} className="flex-1 justify-center gap-2" onClick={() => setTheme('system')}>
             <Laptop className="w-4 h-4" /> System
           </Button>
        </CardContent>
      </Card>
      
      {/* --- Account Settings (Danger Zone) --- */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive"><LogOut /> Account</CardTitle>
          <CardDescription>Manage your connected account and data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
             <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Connected Wallet</p>
                <p className="text-sm font-mono truncate text-muted-foreground">{address}</p>
             </div>
             <Button variant="ghost" onClick={() => disconnect()}>Disconnect</Button>
           </div>
           <Button variant="destructive" className="w-full gap-2" onClick={handleDeleteAccount}>
              <Trash2 className="w-4 h-4" /> Delete Account
           </Button>
        </CardContent>
      </Card>
    </div>
  )
}