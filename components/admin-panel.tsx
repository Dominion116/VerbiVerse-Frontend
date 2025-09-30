"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useQuizContract } from "@/hooks/use-quiz-contract"
import { ShieldCheck } from "lucide-react"
import { useWallet } from "./providers/web3-provider"

export function AdminPanel() {
  const [newHash, setNewHash] = useState("")
  const [currentHash, setCurrentHash] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSettingHash, setIsSettingHash] = useState(false)

  const { isConnected, isContractOwner } = useWallet()
  const { getQuestionsIpfsHash, setQuestionsIpfsHash } = useQuizContract()

  useEffect(() => {
    const fetchCurrentHash = async () => {
      if (isConnected) {
        setIsLoading(true)
        try {
          const hash = await getQuestionsIpfsHash()
          setCurrentHash(hash)
        } catch (error) {
          console.error("Error fetching IPFS hash:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }
    fetchCurrentHash()
  }, [isConnected, getQuestionsIpfsHash])

  const handleSetHash = async () => {
    if (!newHash.trim()) {
      alert("Please enter a valid IPFS hash.")
      return
    }
    setIsSettingHash(true)
    try {
      const tx = await setQuestionsIpfsHash(newHash)
      if (tx) {
        alert("IPFS hash updated successfully!")
        setCurrentHash(newHash)
        setNewHash("")
      } else {
        throw new Error("Transaction failed to confirm.")
      }
    } catch (error) {
      console.error("Error setting IPFS hash:", error)
      alert(`Failed to set IPFS hash: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsSettingHash(false)
    }
  }

  if (!isConnected) {
    return null;
  }

  if (!isContractOwner) {
    return null;
  }

  return (
    <Card className="border-2 bg-secondary/30 mt-12">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Admin Panel (Owner Only)
        </CardTitle>
        <CardDescription>
          This panel allows the contract owner to manage the quiz data by setting the IPFS hash for the questions file.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <p className="text-sm font-medium">Instructions:</p>
            <ol className="list-decimal list-inside text-sm text-muted-foreground bg-background/50 p-4 rounded-lg">
                <li>Upload your <code className="font-mono bg-muted/80 px-1 py-0.5 rounded">data/questions.json</code> file to an IPFS pinning service (like Pinata or Fleek).</li>
                <li>Copy the IPFS CID (hash) provided by the service.</li>
                <li>Paste the hash below and click "Set IPFS Hash".</li>
            </ol>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Current IPFS Hash</label>
          <div className="p-3 bg-background/50 rounded-lg border text-sm min-h-[40px]">
            {isLoading ? (
                <span className="text-muted-foreground">Loading...</span>
            ) : currentHash ? (
                <code className="font-mono break-all">{currentHash}</code>
            ) : (
                <span className="text-destructive">Not set. The application will fail.</span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Enter new IPFS hash (CID)"
            value={newHash}
            onChange={(e) => setNewHash(e.target.value)}
            className="flex-grow"
          />
          <Button onClick={handleSetHash} disabled={isSettingHash || !newHash.trim()}>
            {isSettingHash ? "Setting Hash..." : "Set IPFS Hash"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
