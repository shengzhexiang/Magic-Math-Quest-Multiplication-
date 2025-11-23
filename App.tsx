import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Question, QuestionType, GameStats } from './types';
import { getMathHint, getFunExplanation, getEncouragement } from './services/geminiService';
import Button from './components/Button';
import Card from './components/Card';
import { Loader2, Lightbulb, Trophy, RotateCcw, Play, CheckCircle2, XCircle, Sparkles } from 'lucide-react';

const HINT_THRESHOLD = 15; // seconds
const TOTAL_QUESTIONS_LIMIT = 10; // Or keep it endless, but let's do a set for "Game Over" feel

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [stats, setStats] = useState<GameStats>({ score: 0, totalAnswered: 0, streak: 0 });
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [hintAvailable, setHintAvailable] = useState<boolean>(false);
  const [hintText, setHintText] = useState<string | null>(null);
  const [explanationText, setExplanationText] = useState<string | null>(null);
  const [encouragementText, setEncouragementText] = useState<string | null>(null);
  const [userInput, setUserInput] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [feedbackType, setFeedbackType] = useState<'correct' | 'wrong' | null>(null);
  const [isCorrectAnimation, setIsCorrectAnimation] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Game Logic ---

  const generateQuestion = useCallback((): Question => {
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;
    const answer = num1 * num2;
    const type = Math.random() > 0.5 ? QuestionType.MULTIPLE_CHOICE : QuestionType.FILL_IN_THE_BLANK;

    let options: number[] | undefined;
    if (type === QuestionType.MULTIPLE_CHOICE) {
      const wrong1 = answer + Math.floor(Math.random() * 5) + 1;
      const wrong2 = Math.max(1, answer - Math.floor(Math.random() * 5) - 1);
      const wrong3 = (num1 + 1) * num2; 
      // Shuffle options
      options = [answer, wrong1, wrong2, wrong3].sort(() => Math.random() - 0.5);
      // Ensure unique options roughly
      options = Array.from(new Set(options)).slice(0, 3);
      if (!options.includes(answer)) options.push(answer);
      options = options.sort(() => Math.random() - 0.5);
    }

    return { num1, num2, answer, type, options };
  }, []);

  const startGame = () => {
    setStats({ score: 0, totalAnswered: 0, streak: 0 });
    setGameState(GameState.PLAYING);
    nextTurn();
  };

  const nextTurn = () => {
    const q = generateQuestion();
    setCurrentQuestion(q);
    setGameState(GameState.PLAYING);
    setTimer(0);
    setHintAvailable(false);
    setHintText(null);
    setExplanationText(null);
    setEncouragementText(null);
    setUserInput('');
    setFeedbackType(null);
    setIsCorrectAnimation(false);
    
    // Start Timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
  };

  // Monitor Timer for Hint
  useEffect(() => {
    if (gameState === GameState.PLAYING && timer >= HINT_THRESHOLD && !hintAvailable) {
      setHintAvailable(true);
    }
  }, [timer, gameState, hintAvailable]);

  // Clean up timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleAnswer = async (userAnswer: number) => {
    if (!currentQuestion) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const isCorrect = userAnswer === currentQuestion.answer;

    if (isCorrect) {
      setFeedbackType('correct');
      const newStreak = stats.streak + 1;
      setStats(prev => ({
        ...prev,
        score: prev.score + 10 + (prev.streak * 2), // Bonus for streaks
        totalAnswered: prev.totalAnswered + 1,
        streak: newStreak
      }));
      setIsCorrectAnimation(true);

      // Fetch encouragement if streak is interesting
      if (newStreak % 3 === 0) {
          getEncouragement(newStreak).then(setEncouragementText);
      }

    } else {
      setFeedbackType('wrong');
      setStats(prev => ({
        ...prev,
        totalAnswered: prev.totalAnswered + 1,
        streak: 0
      }));
      
      // Fetch explanation from Gemini
      setIsAiLoading(true);
      try {
        const text = await getFunExplanation(currentQuestion.num1, currentQuestion.num2, userAnswer);
        setExplanationText(text);
      } finally {
        setIsAiLoading(false);
      }
    }

    setGameState(GameState.FEEDBACK);
  };

  const requestHint = async () => {
    if (!currentQuestion || isAiLoading) return;
    setIsAiLoading(true);
    try {
      const hint = await getMathHint(currentQuestion.num1, currentQuestion.num2);
      setHintText(hint);
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- Renders ---

  const renderStartScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         {/* Simple background decorations */}
         <div className="absolute top-10 left-10 text-6xl opacity-20 animate-bounce-slow">✖️</div>
         <div className="absolute bottom-20 right-10 text-6xl opacity-20 animate-bounce-slow" style={{animationDelay: '1s'}}>➗</div>
         <div className="absolute top-1/2 right-20 text-4xl opacity-20 animate-pulse text-yellow-500">⭐</div>
      </div>

      <Card className="max-w-md w-full flex flex-col items-center gap-8 z-10">
        <div className="bg-blue-100 p-6 rounded-full">
           <span className="text-6xl">🧙‍♂️</span>
        </div>
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-blue-600 mb-2 tracking-tight">Magic Math Quest</h1>
          <p className="text-lg text-gray-500 font-medium">Master the 9x9 scrolls!</p>
        </div>
        <Button onClick={startGame} className="w-full text-2xl py-4" variant="primary">
          <Play size={28} fill="currentColor" />
          Start Adventure
        </Button>
      </Card>
    </div>
  );

  const renderPlayingScreen = () => {
    if (!currentQuestion) return null;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        {/* Header Stats */}
        <div className="fixed top-4 left-4 right-4 flex justify-between items-center max-w-4xl mx-auto w-full z-20">
           <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-2xl shadow-sm border border-blue-100 font-bold text-blue-600 flex items-center gap-2">
              <Trophy size={20} className="text-yellow-500" />
              <span>Score: {stats.score}</span>
           </div>
           {stats.streak > 1 && (
             <div className="bg-orange-100 px-4 py-2 rounded-2xl border border-orange-200 text-orange-600 font-bold animate-pulse">
               🔥 {stats.streak} Streak!
             </div>
           )}
        </div>

        <Card className="max-w-xl w-full flex flex-col items-center gap-8 relative overflow-visible mt-12">
            
            {/* Mascot / Decoration */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-yellow-300 p-4 rounded-full border-4 border-white shadow-lg">
                <span className="text-4xl">🤔</span>
            </div>

            {/* Question Display */}
            <div className="mt-8 text-center">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-4">Question {stats.totalAnswered + 1}</p>
                <div className="flex items-center justify-center gap-4 text-6xl md:text-7xl font-black text-gray-800">
                    <span className="text-blue-500">{currentQuestion.num1}</span>
                    <span className="text-gray-300">×</span>
                    <span className="text-pink-500">{currentQuestion.num2}</span>
                    <span className="text-gray-300">=</span>
                    <span className="text-gray-400">?</span>
                </div>
            </div>

            {/* Hint Area */}
            <div className="h-16 w-full flex items-center justify-center">
                 {hintText ? (
                     <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl text-yellow-800 text-sm font-medium animate-pop text-center">
                        💡 {hintText}
                     </div>
                 ) : hintAvailable ? (
                     <Button 
                        onClick={requestHint} 
                        variant="secondary" 
                        className="text-sm py-2 px-4 animate-bounce"
                        disabled={isAiLoading}
                     >
                        {isAiLoading ? <Loader2 className="animate-spin" /> : <><Lightbulb size={18} /> Need a Hint?</>}
                     </Button>
                 ) : (
                     <div className="w-full bg-gray-100 rounded-full h-2.5 dark:bg-gray-200 overflow-hidden relative">
                        <div className="bg-blue-400 h-2.5 rounded-full transition-all duration-1000 ease-linear" style={{ width: `${Math.min((timer / HINT_THRESHOLD) * 100, 100)}%` }}></div>
                        <p className="text-[10px] text-center text-gray-400 mt-1">Wait for hint...</p>
                     </div>
                 )}
            </div>

            {/* Answer Section */}
            <div className="w-full grid gap-4">
                {currentQuestion.type === QuestionType.MULTIPLE_CHOICE ? (
                    <div className="grid grid-cols-2 gap-4">
                        {currentQuestion.options?.map((opt, idx) => (
                            <Button key={idx} onClick={() => handleAnswer(opt)} variant="outline" className="text-3xl py-6 hover:border-blue-400 hover:text-blue-500">
                                {opt}
                            </Button>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <input 
                            type="number" 
                            inputMode="numeric"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && userInput) {
                                    handleAnswer(parseInt(userInput));
                                }
                            }}
                            className="w-full text-center text-5xl font-bold border-4 border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-gray-700 placeholder-gray-200"
                            placeholder="?"
                            autoFocus
                        />
                        <Button 
                            onClick={() => userInput && handleAnswer(parseInt(userInput))} 
                            disabled={!userInput}
                            className="w-full"
                        >
                            Check Answer
                        </Button>
                    </div>
                )}
            </div>

            <Button onClick={() => setGameState(GameState.END)} variant="outline" className="mt-4 border-none shadow-none text-gray-400 text-sm py-1">
                End Game
            </Button>
        </Card>
      </div>
    );
  };

  const renderFeedbackScreen = () => {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-black/50 fixed inset-0 z-50 backdrop-blur-sm animate-pop">
         <Card className="max-w-md w-full flex flex-col items-center gap-6 text-center shadow-2xl relative">
            
            {/* Header Icon */}
            <div className={`absolute -top-12 p-6 rounded-full border-8 border-sky-100 shadow-xl ${feedbackType === 'correct' ? 'bg-green-500' : 'bg-red-500'}`}>
                {feedbackType === 'correct' ? (
                    <CheckCircle2 size={48} className="text-white" />
                ) : (
                    <XCircle size={48} className="text-white" />
                )}
            </div>

            <div className="mt-12">
                <h2 className={`text-3xl font-black mb-2 ${feedbackType === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
                    {feedbackType === 'correct' ? 'Awesome!' : 'Oopsie!'}
                </h2>
                <div className="text-gray-600 text-lg font-medium leading-relaxed">
                    {feedbackType === 'correct' ? (
                        <div className="flex flex-col items-center gap-2">
                            <p>{currentQuestion?.num1} × {currentQuestion?.num2} = {currentQuestion?.answer}</p>
                            {encouragementText && (
                                <p className="text-orange-500 font-bold mt-2 animate-bounce">{encouragementText}</p>
                            )}
                            {!encouragementText && stats.streak > 2 && (
                                <p className="text-orange-500 font-bold mt-2">On a roll! 🔥</p>
                            )}
                            {isCorrectAnimation && <div className="absolute inset-0 pointer-events-none flex justify-center items-center"><Sparkles className="text-yellow-400 w-full h-full animate-ping opacity-20"/></div>}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            {isAiLoading ? (
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Loader2 className="animate-spin" /> Asking the Math Wizard...
                                </div>
                            ) : (
                                <p className="bg-red-50 p-4 rounded-2xl border border-red-100 text-red-800">
                                    {explanationText || `The correct answer is ${currentQuestion?.answer}.`}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex w-full gap-3 mt-4">
                <Button onClick={() => setGameState(GameState.END)} variant="outline" className="flex-1">
                    Finish
                </Button>
                <Button onClick={nextTurn} variant="primary" className="flex-1">
                    Next <Play size={16} className="ml-1" fill="currentColor"/>
                </Button>
            </div>
         </Card>
      </div>
    );
  };

  const renderEndScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full flex flex-col items-center gap-8 text-center">
        <div className="text-8xl">🎉</div>
        <div>
            <h1 className="text-4xl font-black text-blue-600 mb-2">Adventure Complete!</h1>
            <p className="text-gray-500">Here is how you did:</p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-green-100 p-4 rounded-2xl flex flex-col items-center">
                <span className="text-green-600 text-sm font-bold uppercase">Total Score</span>
                <span className="text-green-800 text-4xl font-black">{stats.score}</span>
            </div>
            <div className="bg-purple-100 p-4 rounded-2xl flex flex-col items-center">
                <span className="text-purple-600 text-sm font-bold uppercase">Solved</span>
                <span className="text-purple-800 text-4xl font-black">{stats.totalAnswered}</span>
            </div>
        </div>

        <Button onClick={startGame} className="w-full py-4 text-xl" variant="success">
          <RotateCcw size={24} /> Play Again
        </Button>
      </Card>
    </div>
  );

  return (
    <div className="bg-[url('https://picsum.photos/1920/1080')] bg-cover bg-center bg-fixed min-h-screen relative font-sans">
      {/* Overlay to ensure readability */}
      <div className="absolute inset-0 bg-sky-100/90 backdrop-blur-sm z-0"></div>

      {/* Content */}
      <div className="relative z-10">
        {gameState === GameState.START && renderStartScreen()}
        {gameState === GameState.PLAYING && renderPlayingScreen()}
        {gameState === GameState.FEEDBACK && (
            <>
                {renderPlayingScreen()}
                {renderFeedbackScreen()}
            </>
        )}
        {gameState === GameState.END && renderEndScreen()}
      </div>
    </div>
  );
}