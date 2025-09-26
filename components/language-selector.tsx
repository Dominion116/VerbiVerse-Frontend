"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight } from "lucide-react"

interface LanguagePair {
  from: string
  to: string
  label: string
}

interface LanguageSelectorProps {
  selectedPair: LanguagePair
  onPairChange: (pair: LanguagePair) => void
}

const languagePairs: LanguagePair[] = [
  { from: "English", to: "Spanish", label: "English → Spanish" },
  { from: "English", to: "Yoruba", label: "English → Yoruba" },
  { from: "English", to: "French", label: "English → French" },
  { from: "Spanish", to: "English", label: "Spanish → English" },
  { from: "Yoruba", to: "English", label: "Yoruba → English" },
  { from: "French", to: "English", label: "French → English" },
]

export function LanguageSelector({ selectedPair, onPairChange }: LanguageSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="text-center">
          <div className="font-medium">{selectedPair.from}</div>
          <div className="text-sm text-muted-foreground">From</div>
        </div>
        <ArrowRight className="h-5 w-5 text-primary" />
        <div className="text-center">
          <div className="font-medium">{selectedPair.to}</div>
          <div className="text-sm text-muted-foreground">To</div>
        </div>
      </div>

      <Select
        value={selectedPair.label}
        onValueChange={(value) => {
          const pair = languagePairs.find((p) => p.label === value)
          if (pair) onPairChange(pair)
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select language pair" />
        </SelectTrigger>
        <SelectContent>
          {languagePairs.map((pair) => (
            <SelectItem key={pair.label} value={pair.label}>
              {pair.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
