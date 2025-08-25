
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js/auto';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Rất quan trọng: Thay đổi cách lấy API Key để tương thích với Vite
const API_KEY = import.meta.env.VITE_API_KEY;

// --- Helper Functions ---
const shuffleArray = (array: any[]) => {
    return [...array].sort(() => Math.random() - 0.5);
};

// --- Custom Hooks ---
const useAIFeedback = () => {
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);
    // Kiểm tra API_KEY trước khi khởi tạo
    const ai = useMemo(() => {
        if (!API_KEY) {
            console.error("VITE_API_KEY is not set. Please check your .env file or environment variables.");
            return null;
        }
        return new GoogleGenAI({ apiKey: API_KEY });
    }, []);


    const getFeedback = useCallback(async (prompt: string, type: 'correct' | 'incorrect') => {
        if (!ai) {
            const fallbackMessage = type === 'correct' ? "Chính xác! Làm tốt lắm!" : "Không đúng rồi. Cố gắng lại nhé!";
            setFeedback({ message: fallbackMessage, type });
            return;
        }
        setIsLoading(true);
        setFeedback({ message: '', type });
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setFeedback({ message: response.text, type });
        } catch (error) {
            console.error("AI feedback error:", error);
            const fallbackMessage = type === 'correct' ? "Chính xác! Làm tốt lắm!" : "Không đúng rồi. Cố gắng lại nhé!";
            setFeedback({ message: fallbackMessage, type });
        } finally {
            setIsLoading(false);
        }
    }, [ai]);

    const resetFeedback = useCallback(() => {
        setFeedback({ message: '', type: '' });
    }, []);

    return { feedback, isLoading, getFeedback, resetFeedback };
};


// --- Components ---

const App: React.FC = () => {
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  const handleStartGame = (gameId: string) => {
    setActiveGameId(gameId);
  };

  const handleBackToMenu = () => {
    setActiveGameId(null);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Trò chơi Toán học Lớp 8</h1>
        <p>Khảo sát đồ thị hàm số bậc nhất y = ax + b</p>
      </header>
      <main className="app-main">
        {activeGameId ? (
          <GameHost gameId={activeGameId} onBackToMenu={handleBackToMenu} />
        ) : (
          <MainMenu onStartGame={handleStartGame} />
        )}
      </main>
      <footer className="app-footer">
        <p>
          Thiết kế bởi: Lê Thị Hà | Giáo viên Toán
          <br />
          Đơn vị: Trường TH-THCS Chiềng Chăn – Sơn la
        </p>
      </footer>
    </div>
  );
};

interface MainMenuProps {
  onStartGame: (gameId: string) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  const games = [
    {
      id: 'game1',
      title: 'Điền bảng giá trị nhanh',
      description: 'AI cho công thức, bạn điền giá trị y tương ứng với x.',
      icon: '📝',
    },
    {
      id: 'game2',
      title: 'Tìm tọa độ ẩn',
      description: 'AI hiển thị đồ thị, bạn tìm giao điểm hoặc kiểm tra điểm.',
      icon: '📍',
    },
    {
      id: 'game3',
      title: 'Đoán tham số & thuộc tính',
      description: 'AI đưa ra đồ thị, bạn chọn phương trình hoặc thuộc tính.',
      icon: '📈',
    },
    {
      id: 'game4',
      title: 'Ai nhanh hơn',
      description: 'Trả lời nhanh 10 câu hỏi trắc nghiệm đa dạng để đạt điểm cao.',
      icon: '⚡️',
    },
  ];

  return (
    <div className="game-menu-grid">
      {games.map((game) => (
        <div
          key={game.id}
          className="game-card"
          onClick={() => onStartGame(game.id)}
          role="button"
          tabIndex={0}
          aria-label={`Bắt đầu trò chơi ${game.title}`}
        >
          <div className="icon">{game.icon}</div>
          <h3>{game.title}</h3>
          <p>{game.description}</p>
        </div>
      ))}
    </div>
  );
};


interface GameHostProps {
    gameId: string;
    onBackToMenu: () => void;
}

const GameHost: React.FC<GameHostProps> = ({ gameId, onBackToMenu }) => {
    const gameComponents: { [key: string]: React.ReactNode } = {
        'game1': <DienBangGiaTriNhanh />,
        'game2': <TimToaDoAn />,
        'game3': <DoanThamSo />,
        'game4': <AiNhanhHon />,
    };

    const gameTitles: { [key: string]: string } = {
        'game1': 'Điền bảng giá trị nhanh',
        'game2': 'Tìm tọa độ ẩn',
        'game3': 'Đoán tham số & Thuộc tính',
        'game4': 'Ai nhanh hơn',
    };

    return (
        <div>
            <div className="game-host-header">
                <h2>{gameTitles[gameId]}</h2>
                <button className="btn btn-secondary" onClick={onBackToMenu}>Quay lại Menu</button>
            </div>
            {gameComponents[gameId] || <p>Trò chơi không tồn tại.</p>}
        </div>
    );
};

// --- Game 1: Điền bảng giá trị nhanh ---
const DienBangGiaTriNhanh: React.FC = () => {
    const [question, setQuestion] = useState<{a: number, b: number, x: number, y: number} | null>(null);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15);
    const [inputValue, setInputValue] = useState('');
    const [isAnswered, setIsAnswered] = useState(false);
    const { feedback, isLoading, getFeedback, resetFeedback } = useAIFeedback();

    const generateQuestion = useCallback(() => {
        resetFeedback();
        const a = Math.floor(Math.random() * 19) - 9 || 1;
        const b = Math.floor(Math.random() * 19) - 9;
        const x = Math.floor(Math.random() * 11) - 5;
        const y = a * x + b;
        setQuestion({ a, b, x, y });
        setInputValue('');
        setIsAnswered(false);
        setTimeLeft(15);
    }, [resetFeedback]);

    useEffect(() => {
        generateQuestion();
    }, [generateQuestion]);

    useEffect(() => {
        if (isAnswered) return;
        if (timeLeft > 0) {
            const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timerId);
        } else {
            handleSubmit(true);
        }
    }, [timeLeft, isAnswered]);

    const handleSubmit = (isTimeout = false) => {
        if (isAnswered || !question) return;
        setIsAnswered(true);
        const userAnswer = parseInt(inputValue, 10);
        const isCorrect = !isTimeout && userAnswer === question.y;

        if (isCorrect) {
            setScore(prev => prev + 10);
            const prompt = `Một học sinh lớp 8 đã trả lời đúng câu hỏi về hàm số bậc nhất. Câu hỏi: Với hàm số y=${question.a}x + ${question.b}, khi x=${question.x} thì y bằng bao nhiêu? (Đáp án đúng: ${question.y}). Hãy đưa ra một lời khen ngắn gọn và vui vẻ.`;
            getFeedback(prompt, 'correct');
        } else {
            const prompt = `Một học sinh lớp 8 trả lời SAI câu hỏi về hàm số bậc nhất. Câu hỏi: Với hàm số y=${question.a}x + ${question.b}, khi x=${question.x} thì y bằng bao nhiêu? (Đáp án đúng: ${question.y}, học sinh trả lời: ${isTimeout ? 'hết giờ' : inputValue}). Hãy đưa ra một gợi ý rất ngắn gọn, tập trung vào cách tính toán, ví dụ "Bạn hãy thử nhân ${question.a} với ${question.x} trước nhé!" hoặc "Đừng quên cộng thêm ${question.b} sau khi nhân!".`;
            getFeedback(prompt, 'incorrect');
        }
        setTimeout(generateQuestion, 3000);
    };

    if (!question) return <div className="loading-spinner"></div>;
    return (
        <div className="game-container">
            <div className="status-bar">
                <div className="status-item">🏆 Điểm: {score}</div>
                <div className="status-item">⏳ Thời gian: {timeLeft}s</div>
            </div>
            <div className="question-panel">
                <p className="function">y = {question.a}x {question.b >= 0 ? `+ ${question.b}` : `- ${Math.abs(question.b)}`}</p>
                <p className="prompt">Khi <strong>x = {question.x}</strong>, giá trị của <strong>y</strong> là bao nhiêu?</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="answer-panel">
                <input type="number" className="answer-input" value={inputValue} onChange={(e) => setInputValue(e.target.value)} disabled={isAnswered} autoFocus />
                <button type="submit" className="btn btn-primary" disabled={isAnswered}>Trả lời</button>
            </form>
            <div className={`feedback-panel ${feedback.type}`}>
                {isLoading ? <div className="loading-spinner"></div> : feedback.message}
            </div>
        </div>
    );
};

// --- Game 2: Tìm tọa độ ẩn ---
const TimToaDoAn = () => {
    const [question, setQuestion] = useState<{a: number, b: number, options: string[], answer: string, promptText: string} | null>(null);
    const [score, setScore] = useState(0);
    const [isAnswered, setIsAnswered] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const { feedback, isLoading, getFeedback, resetFeedback } = useAIFeedback();

    const generateQuestion = useCallback(() => {
        resetFeedback();
        setIsAnswered(false);
        setSelectedOption(null);

        let a, b;
        do {
            a = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1);
            b = a * (Math.floor(Math.random() * 5) + 1); 
            if (Math.random() < 0.5) b = -b;
        } while (b === 0);

        const questionType = Math.floor(Math.random() * 3);
        let promptText, answer;
        let options: string[] = [];

        switch (questionType) {
            case 0: // Y-intercept
                promptText = "Đồ thị hàm số cắt trục tung (trục Oy) tại điểm nào?";
                answer = `(0, ${b})`;
                options = shuffleArray([answer, `(${b}, 0)`, `(0, ${a})`, `(${a}, 0)`]);
                break;
            case 1: // X-intercept
                promptText = "Đồ thị hàm số cắt trục hoành (trục Ox) tại điểm nào?";
                answer = `(${-b/a}, 0)`;
                options = shuffleArray([answer, `(0, ${b})`, `(0, ${-b/a})`, `(0, ${a})`]);
                break;
            case 2: // Point check
                const x = Math.floor(Math.random() * 11) - 5;
                const y = a * x + b;
                const isPointOnLine = Math.random() < 0.5;
                const pointY = isPointOnLine ? y : y + (Math.random() < 0.5 ? 1 : -1) * (Math.floor(Math.random() * 2) + 1);
                promptText = `Điểm M(${x}, ${pointY}) có thuộc đồ thị hàm số không?`;
                answer = isPointOnLine ? "Có" : "Không";
                options = ["Có", "Không"];
                break;
        }

        setQuestion({a, b, options, answer, promptText});
    }, [resetFeedback]);

    useEffect(() => { generateQuestion() }, [generateQuestion]);

    const handleAnswer = (option: string) => {
        if (isAnswered) return;
        setIsAnswered(true);
        setSelectedOption(option);
        const isCorrect = option === question!.answer;
        if(isCorrect) {
            setScore(prev => prev + 10);
            getFeedback(`Một học sinh trả lời đúng câu hỏi về đồ thị y=${question!.a}x+${question!.b}. Hãy khen họ một cách ngắn gọn.`, 'correct');
        } else {
            const prompt = `Học sinh trả lời sai câu hỏi về đồ thị y=${question!.a}x+${question!.b}. Câu hỏi là "${question!.promptText}". Đáp án đúng là "${question!.answer}". Hãy đưa ra một gợi ý ngắn gọn, hữu ích. Ví dụ: "Để kiểm tra một điểm, hãy thay tọa độ (x, y) của nó vào phương trình nhé." hoặc "Giao điểm với trục tung (Oy) luôn có x=0."`;
            getFeedback(prompt, 'incorrect');
        }
        setTimeout(generateQuestion, 3000);
    };

    if (!question) return <div className="loading-spinner"></div>;

    const chartData = {
        labels: Array.from({length: 21}, (_, i) => i - 10),
        datasets: [{
            label: `y = ${question.a}x ${question.b >= 0 ? `+ ${question.b}` : `- ${Math.abs(question.b)}`}`,
            data: Array.from({length: 21}, (_, i) => question.a * (i - 10) + question.b),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    };
    const chartOptions = { responsive: true, plugins: { legend: { display: true } }, scales: { x: { grid: { color: '#eee'}}, y: { grid: { color: '#eee'}}} };

    return (
        <div className="game-container">
            <div className="status-bar"><div className="status-item">🏆 Điểm: {score}</div></div>
            <div className="chart-container"><Line options={chartOptions} data={chartData} /></div>
            <div className="question-panel">
                <p className="prompt">{question.promptText}</p>
            </div>
            <div className="mcq-options">
                {question.options.map((opt, i) => (
                    <button key={i} onClick={() => handleAnswer(opt)} disabled={isAnswered} className={`mcq-btn ${isAnswered && (opt === question.answer ? 'correct' : (opt === selectedOption ? 'incorrect' : ''))}`}>
                        {opt}
                    </button>
                ))}
            </div>
            <div className={`feedback-panel ${feedback.type}`}>
                 {isLoading ? <div className="loading-spinner"></div> : feedback.message}
            </div>
        </div>
    );
};

// --- Game 3: Đoán tham số & Thuộc tính ---
const DoanThamSo = () => {
    const [question, setQuestion] = useState<{a: number, b: number, options: string[], answer: string, promptText: string} | null>(null);
    const [score, setScore] = useState(0);
    const [isAnswered, setIsAnswered] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const { feedback, isLoading, getFeedback, resetFeedback } = useAIFeedback();

    const formatEquation = (a: number, b: number) => `y = ${a}x ${b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`}`;
    
    const generateQuestion = useCallback(() => {
        resetFeedback();
        setIsAnswered(false);
        setSelectedOption(null);
        
        const a = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1);
        const b = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1);
        
        const questionType = Math.floor(Math.random() * 3);
        let promptText = '', answer = '', options: string[] = [];

        switch(questionType) {
            case 0: // Guess equation
                promptText = "Đồ thị trên tương ứng với phương trình nào?";
                answer = formatEquation(a, b);
                const wrongOptions = new Set<string>();
                wrongOptions.add(formatEquation(-a, b));
                wrongOptions.add(formatEquation(a, -b));
                wrongOptions.add(formatEquation(-a, -b));
                if(wrongOptions.size < 3) wrongOptions.add(formatEquation(a*2, b));
                options = shuffleArray([answer, ...Array.from(wrongOptions).slice(0,3)]);
                break;
            case 1: // Monotonicity (Đồng biến/Nghịch biến)
                promptText = "Hàm số được biểu diễn bởi đồ thị này đồng biến hay nghịch biến?";
                answer = a > 0 ? "Đồng biến" : "Nghịch biến";
                options = ["Đồng biến", "Nghịch biến"];
                break;
            case 2: // Sign of a and b
                promptText = "Xác định dấu của các tham số a và b.";
                answer = `a ${a > 0 ? '>' : '<'} 0, b ${b > 0 ? '>' : '<'} 0`;
                const signs = ['>', '<'];
                const allSignOptions = new Set<string>();
                signs.forEach(signA => {
                    signs.forEach(signB => {
                        allSignOptions.add(`a ${signA} 0, b ${signB} 0`);
                    });
                });
                options = shuffleArray(Array.from(allSignOptions));
                break;
        }

        setQuestion({a, b, options, answer, promptText});
    }, [resetFeedback]);

    useEffect(() => { generateQuestion() }, [generateQuestion]);

    const handleAnswer = (option: string) => {
        if (isAnswered) return;
        setIsAnswered(true);
        setSelectedOption(option);
        const isCorrect = option === question!.answer;
        if(isCorrect) {
            setScore(prev => prev + 10);
            getFeedback(`Học sinh đã trả lời đúng câu hỏi "${question!.promptText}" với đáp án "${question!.answer}". Hãy khen họ.`, 'correct');
        } else {
            const prompt = `Học sinh đã trả lời sai câu hỏi "${question!.promptText}". Đáp án đúng là "${question!.answer}". Gợi ý ngắn gọn: "Hãy nhìn xem đồ thị đi lên (a>0) hay đi xuống (a<0). Sau đó, tìm điểm cắt trục tung Oy để xác định dấu của b."`;
            getFeedback(prompt, 'incorrect');
        }
        setTimeout(generateQuestion, 3000);
    };

    if (!question) return <div className="loading-spinner"></div>;
    const chartData = {
        labels: Array.from({length: 21}, (_, i) => i - 10),
        datasets: [{
            label: 'Đồ thị hàm số',
            data: Array.from({length: 21}, (_, i) => question.a * (i - 10) + question.b),
            borderColor: '#ff6384',
            tension: 0.1
        }]
    };
    const chartOptions = { responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { color: '#eee'}}, y: { grid: { color: '#eee'}}} };

    return (
        <div className="game-container">
            <div className="status-bar"><div className="status-item">🏆 Điểm: {score}</div></div>
            <div className="chart-container"><Line options={chartOptions} data={chartData} /></div>
            <div className="question-panel"><p className="prompt">{question.promptText}</p></div>
            <div className="mcq-options">
                {question.options.map((opt, i) => (
                    <button key={i} onClick={() => handleAnswer(opt)} disabled={isAnswered} className={`mcq-btn ${isAnswered && (opt === question.answer ? 'correct' : (opt === selectedOption ? 'incorrect' : ''))}`}>
                        {opt}
                    </button>
                ))}
            </div>
            <div className={`feedback-panel ${feedback.type}`}>
                 {isLoading ? <div className="loading-spinner"></div> : feedback.message}
            </div>
        </div>
    );
};

// --- Game 4: Ai nhanh hơn ---
const AiNhanhHon = () => {
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15);
    const [isAnswered, setIsAnswered] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isGameOver, setIsGameOver] = useState(false);
    const { feedback, isLoading, getFeedback } = useAIFeedback();

    const generateQuiz = useCallback(() => {
        const newQuestions = [];
        for (let i = 0; i < 10; i++) {
            let a = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1);
            let b = (Math.floor(Math.random() * 9) - 4); // -4 to 4
            
            const questionText = `Cho hàm số y = ${a}x ${b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`}.`;
            const type = Math.floor(Math.random() * 5);
            let prompt, options, answerIndex;

            switch (type) {
                case 0: // Đồng biến / Nghịch biến
                    prompt = `${questionText} Hàm số này đồng biến hay nghịch biến?`;
                    options = ["Đồng biến", "Nghịch biến"];
                    answerIndex = a > 0 ? 0 : 1;
                    break;
                case 1: // Giao điểm trục tung
                    prompt = `${questionText} Đồ thị cắt trục tung tại điểm nào?`;
                    const correctYIntercept = `(0, ${b})`;
                    options = shuffleArray([correctYIntercept, `(${b}, 0)`, `(0, ${a})`, `(0, ${-b})`]);
                    answerIndex = options.indexOf(correctYIntercept);
                    break;
                case 2: // Điểm thuộc đồ thị
                    const x = Math.floor(Math.random() * 5) + 1;
                    const y = a * x + b;
                    const isPointOnLine = Math.random() < 0.5;
                    const pointY = isPointOnLine ? y : y + (Math.random() < 0.5 ? 1 : -1);
                    prompt = `${questionText} Điểm M(${x}, ${pointY}) có thuộc đồ thị không?`;
                    options = ["Có", "Không"];
                    answerIndex = isPointOnLine ? 0 : 1;
                    break;
                case 3: // Đường thẳng song song
                    prompt = `${questionText} Đường thẳng nào sau đây song song với nó?`;
                    const b_diff = b + (Math.random() < 0.5 ? 1 : -1) * (Math.floor(Math.random()*3)+1) || b+1;
                    const correctParallel = `y = ${a}x ${b_diff >= 0 ? `+ ${b_diff}` : `- ${Math.abs(b_diff)}`}`;
                    options = shuffleArray([
                        correctParallel,
                        `y = ${-a}x ${b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`}`,
                        `y = ${a}x ${b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`}`, // Trùng nhau
                        `y = ${a+1}x ${b >= 0 ? `+ ${b_diff}` : `- ${Math.abs(b_diff)}`}`
                    ]);
                    answerIndex = options.indexOf(correctParallel);
                    break;
                case 4: // Giao điểm trục hoành
                    // Regenerate a,b to ensure integer intercept
                    a = (Math.floor(Math.random() * 4) + 1) * (Math.random() < 0.5 ? 1 : -1);
                    b = a * (Math.floor(Math.random() * 4) + 1) * (Math.random() < 0.5 ? 1 : -1);
                    const newQuestionText = `Cho hàm số y = ${a}x ${b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`}.`;
                    prompt = `${newQuestionText} Đồ thị cắt trục hoành tại điểm nào?`;
                    const correctXIntercept = `(${-b/a}, 0)`;
                    options = shuffleArray([correctXIntercept, `(0, ${b})`, `(0, ${-b/a})`, `(${b}, 0)`]);
                    answerIndex = options.indexOf(correctXIntercept);
                    break;
            }
            newQuestions.push({ prompt, options, answerIndex });
        }
        setQuestions(newQuestions);
    }, []);

    const resetGame = () => {
        setIsGameOver(false);
        setScore(0);
        setCurrentQIndex(0);
        generateQuiz();
        setIsAnswered(false);
        setSelectedOption(null);
        setTimeLeft(15);
    };

    useEffect(() => {
        resetGame();
    }, []);

    useEffect(() => {
        if (isGameOver || isAnswered) return;
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            handleAnswer(-1); // Timeout
        }
    }, [timeLeft, isAnswered, isGameOver]);
    
    const nextQuestion = () => {
        if (currentQIndex < questions.length - 1) {
            setCurrentQIndex(q => q + 1);
            setIsAnswered(false);
            setSelectedOption(null);
            setTimeLeft(15);
        } else {
            setIsGameOver(true);
            const numCorrect = score / 10;
            const prompt = `Một học sinh vừa hoàn thành bài kiểm tra nhanh 10 câu hỏi về hàm số bậc nhất. Họ trả lời đúng ${numCorrect} trên 10 câu. Dựa vào kết quả này, hãy đưa ra một lời nhận xét tổng quát ngắn gọn, khen ngợi điểm mạnh và gợi ý phần kiến thức cần xem lại.`;
            getFeedback(prompt, 'correct');
        }
    };

    const handleAnswer = (optionIndex: number) => {
        if (isAnswered) return;
        setIsAnswered(true);
        setSelectedOption(optionIndex);
        if (optionIndex === questions[currentQIndex].answerIndex) {
            setScore(s => s + 10);
        }
        setTimeout(nextQuestion, 1500);
    };

    if (questions.length === 0) return <div className="loading-spinner"></div>;

    if (isGameOver) {
        return (
            <div className="game-container quiz-results-panel">
                <h3>Hoàn thành!</h3>
                <p>Điểm số của bạn: {score}</p>
                <p>Số câu đúng: {score / 10} / 10</p>
                 <div className={`feedback-panel ${feedback.type}`}>
                     {isLoading ? <div className="loading-spinner"></div> : feedback.message}
                </div>
                <button className="btn btn-primary" onClick={resetGame}>Chơi lại</button>
            </div>
        );
    }
    
    const currentQuestion = questions[currentQIndex];

    return (
        <div className="game-container">
            <div className="status-bar">
                <div className="status-item">🏆 Điểm: {score}</div>
                <div className="status-item">❓ Câu hỏi: {currentQIndex + 1}/10</div>
                <div className="status-item">⏳ Thời gian: {timeLeft}s</div>
            </div>
            <div className="quiz-progress-bar"><div style={{ width: `${((currentQIndex + 1) / 10) * 100}%` }}></div></div>
            <div className="question-panel">
                <p className="prompt">{currentQuestion.prompt}</p>
            </div>
            <div className="mcq-options">
                {currentQuestion.options.map((opt: string, i: number) => (
                    <button key={i} onClick={() => handleAnswer(i)} disabled={isAnswered} className={`mcq-btn ${isAnswered && (i === currentQuestion.answerIndex ? 'correct' : (i === selectedOption ? 'incorrect' : ''))}`}>
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default App;
