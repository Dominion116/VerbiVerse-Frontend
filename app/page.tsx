import { QuizInterface } from "@/components/quiz-interface"
import { Header } from "@/components/header"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <QuizInterface />
      </main>
    </div>
  )
}
