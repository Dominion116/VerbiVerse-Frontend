'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LanguageSelector } from './language-selector';
import { QuestionCard } from './question-card';
import { WalletConnection } from './wallet-connection';
import { ProgressTracker } from './progress-tracker';
import { QuizResults } from './quiz-results';
import { QuizHistory } from './quiz-history';
import { Globe, Wallet, Trophy, History } from 'lucide-react';
import { useWallet } from './providers/web3-provider';
import { useQuizProgress } from '@/hooks/use-quiz-progress';
import { useQuizContract } from '@/hooks/use-quiz-contract';
import { useIPFSQuiz, type IPFSBatch } from '@/hooks/use-ipfs-quiz';

interface Question {
  id: string;
  text: string;
  targetLanguage: string;
}

interface LanguagePair {
  from: string;
  to: string;
  label: string;
}

type ViewMode = 'home' | 'quiz' | 'results' | 'history';

export function QuizInterface() {
  const [selectedLanguagePair, setSelectedLanguagePair] = useState<LanguagePair>({
    from: 'English',
    to: 'Spanish',
    label: 'English → Spanish',
  });
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const { isConnected } = useWallet();
  const [currentBatchId, setCurrentBatchId] = useState<number | null>(null);
  const [currentBatchData, setCurrentBatchData] = useState<IPFSBatch | null>(
    null
  );
  const [isSubmittingToContract, setIsSubmittingToContract] = useState(false);
  const [isStartingQuiz, setIsStartingQuiz] = useState(false);

  const {
    currentSession,
    userStats,
    startQuiz,
    updateAnswer,
    moveToQuestion,
    completeQuiz,
    resetQuiz,
  } = useQuizProgress();

  const {
    submitQuizAnswers,
    getRandomBatch,
    isContractReady,
    isLoading: contractLoading,
  } = useQuizContract();

  const {
    fetchBatch,
    getRandomBatchId,
    calculateScore,
    isLoading: ipfsLoading,
    error: ipfsError,
  } = useIPFSQuiz();

  const handleAnswerChange = (answer: string) => {
    if (currentSession) {
      updateAnswer(currentSession.currentQuestionIndex, answer);
    }
  };

  const handleNext = () => {
    if (currentSession && currentSession.currentQuestionIndex < 4) {
      moveToQuestion(currentSession.currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSession && currentSession.currentQuestionIndex > 0) {
      moveToQuestion(currentSession.currentQuestionIndex - 1);
    }
  };

  const handleStartQuiz = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsStartingQuiz(true);

    try {
      // Get a random batch ID (either from contract or fallback)
      let batchId: number;
      try {
        const contractBatchId = await getRandomBatch();
        batchId = contractBatchId || getRandomBatchId();
      } catch {
        batchId = getRandomBatchId();
      }

      console.log('Fetching batch:', batchId);

      // Fetch batch data from IPFS
      const batchData = await fetchBatch(batchId);

      if (!batchData) {
        alert('Failed to get quiz batch. Please try again.');
        return;
      }

      setCurrentBatchId(batchId);
      setCurrentBatchData(batchData);

      // Convert IPFS questions to quiz format
      const questions = batchData.questions.map((q) => ({
        id: q.id.toString(),
        text: q.sourceText,
        targetLanguage: q.targetLanguage,
      }));

      startQuiz(selectedLanguagePair.label, questions);
      setViewMode('quiz');
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert(
        `Failed to start quiz: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    } finally {
      setIsStartingQuiz(false);
    }
  };

  const handleCompleteQuiz = async () => {
    if (
      !currentSession ||
      !currentBatchId ||
      !currentBatchData ||
      !isContractReady
    )
      return;

    setIsSubmittingToContract(true);

    try {
      // Get user answers and ensure we have exactly 5 answers
      const userAnswers = currentSession.questions.map(
        (q) => q.userAnswer || ''
      );

      // Ensure we have exactly 5 answers (pad with empty strings if needed)
      while (userAnswers.length < 5) {
        userAnswers.push('');
      }

      // Calculate score using IPFS data
      const score = calculateScore(currentBatchData.questions, userAnswers);

      console.log('Calculated score:', score);

      // Prepare answers array for contract (5 answers required)
      const answers: [string, string, string, string, string] = [
        userAnswers[0],
        userAnswers[1],
        userAnswers[2],
        userAnswers[3],
        userAnswers[4],
      ];

      const correctAnswers: [string, string, string, string, string] = [
        currentBatchData.questions[0]?.correctTranslation || '',
        currentBatchData.questions[1]?.correctTranslation || '',
        currentBatchData.questions[2]?.correctTranslation || '',
        currentBatchData.questions[3]?.correctTranslation || '',
        currentBatchData.questions[4]?.correctTranslation || '',
      ];

      // Submit to blockchain
      const txHash = await submitQuizAnswers(
        currentBatchId,
        answers,
        correctAnswers,
        score
      );

      if (txHash) {
        console.log('Quiz submitted to blockchain:', txHash);
        // Complete the quiz locally
        completeQuiz(score);
        setViewMode('results');
      } else {
        throw new Error('Failed to submit to blockchain');
      }
    } catch (error) {
      console.error('Error submitting to blockchain:', error);

      // Calculate score for local completion even if blockchain fails
      const userAnswers = currentSession.questions.map(
        (q) => q.userAnswer || ''
      );
      const score = currentBatchData
        ? calculateScore(currentBatchData.questions, userAnswers)
        : Math.floor(Math.random() * 40) + 60; // Fallback score

      alert(
        'Failed to submit quiz to blockchain. Your progress has been saved locally.'
      );
      // Still complete the quiz locally
      completeQuiz(score);
      setViewMode('results');
    } finally {
      setIsSubmittingToContract(false);
    }
  };

  const handleNewQuiz = () => {
    resetQuiz();
    setCurrentBatchData(null);
    setCurrentBatchId(null);
    setViewMode('home');
  };

  const handleGoHome = () => {
    resetQuiz();
    setCurrentBatchData(null);
    setCurrentBatchId(null);
    setViewMode('home');
  };

  // Show results if quiz is completed
  if (viewMode === 'results' && currentSession?.status === 'completed') {
    return (
      <QuizResults
        session={currentSession}
        onNewQuiz={handleNewQuiz}
        onGoHome={handleGoHome}
      />
    );
  }

  // Show history view
  if (viewMode === 'history') {
    return (
      <div>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <Button
            variant='outline'
            onClick={() => setViewMode('home')}
            className='mb-4'
          >
            ← Back to Home
          </Button>
        </div>
        <QuizHistory userStats={userStats} />
      </div>
    );
  }

  // Show quiz view
  if (viewMode === 'quiz' && currentSession) {
    const currentQuestion =
      currentSession.questions[currentSession.currentQuestionIndex];
    const currentAnswer = currentQuestion?.userAnswer || '';

    return (
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8'>
        <div className='max-w-6xl mx-auto'>
          <div className='grid lg:grid-cols-3 gap-4 sm:gap-6'>
            <div className='lg:col-span-2'>
              <div className='flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4'>
                <div>
                  <h1 className='text-xl sm:text-2xl font-bold'>
                    Translation Quiz
                  </h1>
                  <div className='flex gap-2 mt-2'>
                    <Badge variant='secondary' className='w-fit'>
                      {selectedLanguagePair.label}
                    </Badge>
                    {currentBatchId && (
                      <Badge variant='outline' className='w-fit'>
                        Batch #{currentBatchId}
                      </Badge>
                    )}
                    {currentBatchData && (
                      <Badge variant='outline' className='w-fit capitalize'>
                        {currentBatchData.difficulty}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant='outline'
                  onClick={handleGoHome}
                  className='w-fit bg-transparent'
                >
                  Exit Quiz
                </Button>
              </div>

              {/* Question */}
              <QuestionCard
                question={currentQuestion}
                answer={currentAnswer}
                onAnswerChange={handleAnswerChange}
                questionNumber={currentSession.currentQuestionIndex + 1}
              />

              <div className='flex flex-col sm:flex-row justify-between mt-6 sm:mt-8 gap-4'>
                <Button
                  variant='outline'
                  onClick={handlePrevious}
                  disabled={currentSession.currentQuestionIndex === 0}
                  className='w-full sm:w-auto bg-transparent'
                >
                  Previous
                </Button>
                <Button
                  onClick={
                    currentSession.currentQuestionIndex === 4
                      ? handleCompleteQuiz
                      : handleNext
                  }
                  disabled={!currentAnswer.trim() || isSubmittingToContract}
                  className='w-full sm:w-auto'
                >
                  {isSubmittingToContract
                    ? 'Submitting...'
                    : currentSession.currentQuestionIndex === 4
                    ? 'Complete Quiz'
                    : 'Next'}
                </Button>
              </div>
            </div>

            <div className='lg:col-span-1 order-first lg:order-last'>
              <ProgressTracker
                currentSession={currentSession}
                userStats={userStats}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show home view
  return (
    <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8'>
      <div className='max-w-6xl mx-auto'>
        <div className='text-center mb-8 sm:mb-12'>
          <div className='flex items-center justify-center gap-3 mb-4 sm:mb-6'>
            <div className='p-2 sm:p-3 bg-primary/10 rounded-xl'>
              <Globe className='h-6 w-6 sm:h-8 sm:w-8 text-primary' />
            </div>
            <h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold text-balance'>
              Translation Quiz
            </h1>
          </div>
          <p className='text-base sm:text-lg lg:text-xl text-muted-foreground text-balance max-w-2xl mx-auto px-4'>
            Test your translation skills with our interactive quiz platform.
            Connect your wallet to track progress and earn rewards.
          </p>
        </div>

        {/* Show IPFS error if present */}
        {ipfsError && (
          <div className='mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg'>
            <p className='text-sm text-destructive'>
              IPFS Error: {ipfsError}. Using fallback questions.
            </p>
          </div>
        )}

        <div className='grid lg:grid-cols-3 gap-4 sm:gap-6'>
          <div className='lg:col-span-2 space-y-4 sm:space-y-6'>
            <div className='grid sm:grid-cols-2 gap-4 sm:gap-6'>
              {/* Language Selection */}
              <Card className='border-2'>
                <CardHeader className='pb-4'>
                  <CardTitle className='flex items-center gap-2 text-base sm:text-lg'>
                    <Globe className='h-4 w-4 sm:h-5 sm:w-5 text-primary' />
                    Language Pair
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LanguageSelector
                    selectedPair={selectedLanguagePair}
                    onPairChange={setSelectedLanguagePair}
                  />
                </CardContent>
              </Card>

              {/* Wallet Connection */}
              <Card className='border-2'>
                <CardHeader className='pb-4'>
                  <CardTitle className='flex items-center gap-2 text-base sm:text-lg'>
                    <Wallet className='h-4 w-4 sm:h-5 sm:w-5 text-primary' />
                    Wallet Connection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WalletConnection />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className='pt-4 sm:pt-6'>
                <div className='grid grid-cols-3 gap-4 sm:gap-6 text-center'>
                  <div>
                    <div className='text-xl sm:text-2xl font-bold text-primary mb-1 sm:mb-2'>
                      5
                    </div>
                    <div className='text-xs sm:text-sm text-muted-foreground'>
                      Questions per batch
                    </div>
                  </div>
                  <div>
                    <div className='text-xl sm:text-2xl font-bold text-primary mb-1 sm:mb-2'>
                      200
                    </div>
                    <div className='text-xs sm:text-sm text-muted-foreground'>
                      Character limit
                    </div>
                  </div>
                  <div>
                    <div className='text-xl sm:text-2xl font-bold text-primary mb-1 sm:mb-2'>
                      <Trophy className='h-5 w-5 sm:h-6 sm:w-6 mx-auto' />
                    </div>
                    <div className='text-xs sm:text-sm text-muted-foreground'>
                      Earn rewards
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Button
                size='lg'
                onClick={handleStartQuiz}
                disabled={
                  !isConnected ||
                  contractLoading ||
                  ipfsLoading ||
                  isStartingQuiz
                }
                className='px-6 sm:px-8 py-3 text-base sm:text-lg w-full sm:w-auto'
              >
                {isStartingQuiz
                  ? 'Loading Quiz...'
                  : contractLoading
                  ? 'Loading Contract...'
                  : ipfsLoading
                  ? 'Loading Questions...'
                  : 'Start Quiz'}
              </Button>
              {userStats.completedQuizzes > 0 && (
                <Button
                  size='lg'
                  variant='outline'
                  onClick={() => setViewMode('history')}
                  className='px-6 sm:px-8 py-3 text-base sm:text-lg w-full sm:w-auto'
                >
                  <History className='h-4 w-4 mr-2' />
                  View History
                </Button>
              )}
            </div>
            {!isConnected && (
              <p className='text-sm text-muted-foreground text-center px-4'>
                Connect your wallet to start the quiz
              </p>
            )}
          </div>

          <div className='lg:col-span-1 order-first lg:order-last'>
            <ProgressTracker
              currentSession={currentSession}
              userStats={userStats}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
