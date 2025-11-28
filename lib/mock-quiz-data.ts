import type { IPFSBatch } from "@/hooks/use-ipfs-quiz";

// Mock quiz data for testing without IPFS
export const MOCK_QUIZ_BATCHES: IPFSBatch[] = [
  {
    batchId: 1,
    languagePair: "en-es",
    difficulty: "easy",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 1,
        sourceText: "Hello",
        correctTranslation: "Hola",
        targetLanguage: "es",
        difficulty: "easy"
      },
      {
        id: 2,
        sourceText: "Goodbye",
        correctTranslation: "Adiós",
        targetLanguage: "es",
        difficulty: "easy"
      },
      {
        id: 3,
        sourceText: "Thank you",
        correctTranslation: "Gracias",
        targetLanguage: "es",
        difficulty: "easy"
      },
      {
        id: 4,
        sourceText: "Good morning",
        correctTranslation: "Buenos días",
        targetLanguage: "es",
        difficulty: "easy"
      },
      {
        id: 5,
        sourceText: "How are you?",
        correctTranslation: "¿Cómo estás?",
        targetLanguage: "es",
        difficulty: "easy"
      }
    ]
  },
  {
    batchId: 2,
    languagePair: "en-es",
    difficulty: "easy",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 1,
        sourceText: "I love you",
        correctTranslation: "Te amo",
        targetLanguage: "es",
        difficulty: "easy"
      },
      {
        id: 2,
        sourceText: "What is your name?",
        correctTranslation: "¿Cómo te llamas?",
        targetLanguage: "es",
        difficulty: "easy"
      },
      {
        id: 3,
        sourceText: "Please",
        correctTranslation: "Por favor",
        targetLanguage: "es",
        difficulty: "easy"
      },
      {
        id: 4,
        sourceText: "Yes",
        correctTranslation: "Sí",
        targetLanguage: "es",
        difficulty: "easy"
      },
      {
        id: 5,
        sourceText: "No",
        correctTranslation: "No",
        targetLanguage: "es",
        difficulty: "easy"
      }
    ]
  },
  {
    batchId: 3,
    languagePair: "en-es",
    difficulty: "medium",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 1,
        sourceText: "Where is the bathroom?",
        correctTranslation: "¿Dónde está el baño?",
        targetLanguage: "es",
        difficulty: "medium"
      },
      {
        id: 2,
        sourceText: "I don't understand",
        correctTranslation: "No entiendo",
        targetLanguage: "es",
        difficulty: "medium"
      },
      {
        id: 3,
        sourceText: "How much does it cost?",
        correctTranslation: "¿Cuánto cuesta?",
        targetLanguage: "es",
        difficulty: "medium"
      },
      {
        id: 4,
        sourceText: "Can you help me?",
        correctTranslation: "¿Puedes ayudarme?",
        targetLanguage: "es",
        difficulty: "medium"
      },
      {
        id: 5,
        sourceText: "I am hungry",
        correctTranslation: "Tengo hambre",
        targetLanguage: "es",
        difficulty: "medium"
      }
    ]
  }
];

export function getMockBatch(batchId: number): IPFSBatch | null {
  return MOCK_QUIZ_BATCHES.find(b => b.batchId === batchId) || null;
}
