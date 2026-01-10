import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sword, Shield, Crown, Skull, Eye, Ghost, Users, 
  CheckCircle, XCircle, Scroll, ArrowRight, Dna, HelpCircle, AlertTriangle, Loader2, Lock, Pencil, Hand, BookOpen, X
} from 'lucide-react';

// --- 遊戲常數與配置 ---

// Sprite 圖片設定
// 假設圖片排列為 4欄 x 2列
// 第一排: 梅林, 派西維爾, 忠臣, 奧伯倫
// 第二排: 莫甘娜, 莫德雷德, 刺客, 爪牙
const SPRITE_CONFIG = {
  cols: 4,
  rows: 2,
  src: '/avalon-sprites.webp', // 請確認圖片檔名與此一致
};

// 角色設定 (加入 spritePosition 座標: {col: 0~3, row: 0~1})
const ROLES_CONFIG = {
  MERLIN: { 
    id: 'MERLIN', 
    roleName: '梅林', 
    side: 'GOOD', 
    description: '你知道誰是邪惡方 (除莫德雷德)。', 
    spritePosition: { col: 0, row: 0 } 
  },
  PERCIVAL: { 
    id: 'PERCIVAL', 
    roleName: '派西維爾', 
    side: 'GOOD', 
    description: '你知道誰是梅林 (也可能看到莫甘娜)。', 
    spritePosition: { col: 1, row: 0 }
  },
  SERVANT: { 
    id: 'SERVANT', 
    roleName: '亞瑟的忠臣', 
    side: 'GOOD', 
    description: '你不知道任何人的身份，為了正義而戰。',
    spritePosition: { col: 2, row: 0 }
  },
  OBERON: { 
    id: 'OBERON', 
    roleName: '奧伯倫', 
    side: 'EVIL', 
    description: '你看不到隊友，隊友也看不到你。',
    spritePosition: { col: 3, row: 0 }
  },
  MORGANA: { 
    id: 'MORGANA', 
    roleName: '莫甘娜', 
    side: 'EVIL', 
    description: '你假扮成梅林，迷惑派西維爾。',
    spritePosition: { col: 0, row: 1 }
  },
  MORDRED: { 
    id: 'MORDRED', 
    roleName: '莫德雷德', 
    side: 'EVIL', 
    description: '梅林看不到你的邪惡身份。',
    spritePosition: { col: 1, row: 1 }
  },
  ASSASSIN: { 
    id: 'ASSASSIN', 
    roleName: '刺客', 
    side: 'EVIL', 
    description: '若邪惡方失敗，你有機會刺殺梅林來反敗為勝。',
    spritePosition: { col: 2, row: 1 }
  },
  MINION: { 
    id: 'MINION', 
    roleName: '莫德雷德的爪牙', 
    side: 'EVIL', 
    description: '你知道誰是邪惡方 (除奧伯倫)。', 
    spritePosition: { col: 3, row: 1 }
  },
};

const QUEST_CONFIG = {
  5: [2, 3, 2, 3, 3],
  6: [2, 3, 4, 3, 4],
  7: [2, 3, 3, 4, 4], // 修改：-4 改為 4 (取消雙壞人機制)
  8: [3, 4, 4, 5, 5], // 修改：-5 改為 5
  9: [3, 4, 4, 5, 5], // 修改：-5 改為 5
  10: [3, 4, 4, 5, 5], // 修改：-5 改為 5
};

const GOOD_EVIL_COUNT = {
  5: { good: 3, evil: 2 },
  6: { good: 4, evil: 2 },
  7: { good: 4, evil: 3 },
  8: { good: 5, evil: 3 },
  9: { good: 6, evil: 3 },
  10: { good: 6, evil: 4 },
};

// --- 輔助函式 ---

const StarryBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-slate-950 pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-black"></div>
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-white rounded-full opacity-20"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: [null, Math.random() * window.innerHeight],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            width: Math.random() * 3 + 1 + 'px',
            height: Math.random() * 3 + 1 + 'px',
          }}
        />
      ))}
    </div>
  );
};

const shuffleArray = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

// --- 新增：遊戲說明彈窗組件 ---
const TutorialModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X/></button>
        
        <div className="bg-amber-600/20 p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-amber-500 flex items-center"><BookOpen className="mr-3" /> 傳說指南</h2>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh] text-slate-300">
          <section>
            <h3 className="text-white font-bold text-lg mb-2 flex items-center"><Users className="w-5 h-5 mr-2 text-blue-400"/> 兩大陣營</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><span className="text-blue-400 font-bold">亞瑟忠臣 (藍)</span>：找出邪惡方，成功完成 <span className="font-bold text-white">3</span> 次任務。</li>
              <li><span className="text-red-400 font-bold">莫德雷德爪牙 (紅)</span>：隱藏身份，破壞 <span className="font-bold text-white">3</span> 次任務，或刺殺梅林。</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-lg mb-2 flex items-center"><Crown className="w-5 h-5 mr-2 text-yellow-400"/> 遊戲流程</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li><span className="text-yellow-400">組隊</span>：隊長選擇隊員出任務。</li>
              <li><span className="text-yellow-400">投票</span>：所有人公開表決是否同意這個隊伍。</li>
              <li><span className="text-yellow-400">任務</span>：隊伍成員祕密決定任務「成功」或「失敗」。</li>
            </ol>
          </section>

          <section>
            <h3 className="text-white font-bold text-lg mb-2 flex items-center"><AlertTriangle className="w-5 h-5 mr-2 text-red-500"/> 特殊規則</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><span className="text-amber-500 font-bold">單一失敗制</span>：無論幾人局，只要任務中出現 <span className="font-bold text-red-500">1</span> 張失敗票，任務即判定失敗。</li>
              <li><span className="text-red-500 font-bold">隨時刺殺</span>：刺客可隨時宣告身分並發動刺殺，若猜中梅林則邪惡方直接獲勝，猜錯則直接落敗。</li>
            </ul>
          </section>
        </div>

        <div className="p-4 border-t border-slate-700 bg-slate-900">
          <button onClick={onClose} className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold transition-colors">
            我準備好了
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- 主應用組件 ---

export default function AvalonGame() {
  const [phase, setPhase] = useState('SETUP'); 
  const [playerCount, setPlayerCount] = useState(5);
  const [selectedRoles, setSelectedRoles] = useState(['MERLIN', 'ASSASSIN']);
  const [players, setPlayers] = useState([]);
  
  // 狀態
  const [showNameInputs, setShowNameInputs] = useState(false);
  const [customNames, setCustomNames] = useState({});
  const [showTutorial, setShowTutorial] = useState(false); // 教學彈窗開關

  const [questHistory, setQuestHistory] = useState([null, null, null, null, null]);
  const [currentQuestIndex, setCurrentQuestIndex] = useState(0);
  const [failedVoteCount, setFailedVoteCount] = useState(0);
  const [leaderIndex, setLeaderIndex] = useState(0);
  
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  
  const [isQuestVotingRevealed, setIsQuestVotingRevealed] = useState(false);

  const [selectedTeam, setSelectedTeam] = useState([]);
  const [questVotes, setQuestVotes] = useState([]);
  const [assassinTarget, setAssassinTarget] = useState(null);
  const [lastMissionLog, setLastMissionLog] = useState('');

  const config = GOOD_EVIL_COUNT[playerCount];
  const requiredEvil = config.evil;
  
  // --- 階段一：設置 ---

  const handlePlayerCountChange = (count) => {
    setPlayerCount(count);
    setSelectedRoles(['MERLIN', 'ASSASSIN']);
  };

  const toggleRole = (roleKey) => {
    if (roleKey === 'MERLIN' || roleKey === 'ASSASSIN') return;

    const roleSide = ROLES_CONFIG[roleKey].side;
    const config = GOOD_EVIL_COUNT[playerCount];
    const maxSideCount = roleSide === 'GOOD' ? config.good : config.evil;

    if (selectedRoles.includes(roleKey)) {
      setSelectedRoles(prev => prev.filter(r => r !== roleKey));
    } else {
      const currentSideCount = selectedRoles.filter(r => ROLES_CONFIG[r].side === roleSide).length;
      if (currentSideCount >= maxSideCount) return; 
      setSelectedRoles(prev => [...prev, roleKey]);
    }
  };

  const startGame = () => {
    let deck = [...selectedRoles];
    const currentEvilCount = deck.filter(r => ROLES_CONFIG[r].side === 'EVIL').length;
    
    if (currentEvilCount > requiredEvil) {
      alert(`壞人角色選太多了！當前人數只能有 ${requiredEvil} 個壞人。`);
      return;
    }

    if (currentEvilCount < requiredEvil) {
      const minionsToAdd = requiredEvil - currentEvilCount;
      for (let i = 0; i < minionsToAdd; i++) deck.push('MINION');
    }

    while (deck.length < playerCount) {
      deck.push('SERVANT');
    }

    deck = shuffleArray(deck);
    
    const hasMorgana = selectedRoles.includes('MORGANA');
    const hasMordred = selectedRoles.includes('MORDRED');
    const hasOberon = selectedRoles.includes('OBERON');

    const newPlayers = deck.map((roleKey, index) => {
        const config = ROLES_CONFIG[roleKey];
        const finalName = (customNames[index] && customNames[index].trim()) ? customNames[index].trim() : `玩家 ${index + 1}`;
        
        let description = config.description;

        if (roleKey === 'PERCIVAL') {
            description = hasMorgana ? '你知道誰是梅林 (也可能看到莫甘娜)。' : '你知道誰是梅林。';
        }
        if (roleKey === 'MERLIN') {
            description = hasMordred ? '你知道誰是邪惡方 (但你看不到莫德雷德)。' : '你知道誰是邪惡方。';
        }
        if (roleKey === 'MINION') {
             description = hasOberon ? '你知道誰是邪惡方 (但你看不到奧伯倫)。' : '你知道誰是邪惡方。';
        }

        return {
            id: index,
            name: finalName,
            role: roleKey,
            roleName: config.roleName,
            side: config.side,
            description: description,
            spritePosition: config.spritePosition
        };
    });

    setPlayers(newPlayers);
    setLeaderIndex(Math.floor(Math.random() * playerCount));
    setPhase('REVEAL');
    setCurrentPlayerIndex(0);
  };

  // --- 階段二：身份確認 ---

  const nextReveal = () => {
    setIsRevealed(false);
    if (currentPlayerIndex < playerCount - 1) {
      setCurrentPlayerIndex(prev => prev + 1);
    } else {
      setPhase('ROUND_START');
    }
  };

  const getKnowledge = (viewer) => {
    return players.map(target => {
      if (viewer.id === target.id) return { ...target, label: '你自己' };
      if (viewer.role === 'MERLIN') {
        if (['ASSASSIN', 'MORGANA', 'OBERON', 'MINION'].includes(target.role)) return { ...target, label: '邪惡方' };
      }
      if (viewer.role === 'PERCIVAL') {
        if (target.role === 'MERLIN' || target.role === 'MORGANA') return { ...target, label: '梅林' };
      }
      if (['ASSASSIN', 'MORGANA', 'MORDRED', 'MINION'].includes(viewer.role)) {
        if (target.role === 'OBERON') return { ...target, label: '未知' };
        if (['ASSASSIN', 'MORGANA', 'MORDRED', 'MINION'].includes(target.role)) return { ...target, label: '隊友' };
      }
      return { ...target, label: '未知' };
    });
  };

  // --- 階段三：遊戲主流程 ---

  const startRound = () => {
    setSelectedTeam([]);
    setQuestVotes([]);
    setPhase('TEAM_PROPOSAL');
  };

  const toggleTeamSelection = (pid) => {
    const limit = Math.abs(QUEST_CONFIG[playerCount][currentQuestIndex]);
    if (selectedTeam.includes(pid)) {
      setSelectedTeam(prev => prev.filter(id => id !== pid));
    } else {
      if (selectedTeam.length < limit) {
        setSelectedTeam(prev => [...prev, pid]);
      }
    }
  };

  const submitProposal = () => {
    const limit = Math.abs(QUEST_CONFIG[playerCount][currentQuestIndex]);
    if (selectedTeam.length !== limit) return;
    setPhase('TEAM_VOTE');
  };

  const handleVotePass = () => {
    setFailedVoteCount(0);
    const firstMemberIndex = Math.min(...selectedTeam);
    setCurrentPlayerIndex(firstMemberIndex);
    setIsQuestVotingRevealed(false);
    setPhase('QUEST_EXECUTION');
  };

  const handleVoteFail = () => {
    const newFailedCount = failedVoteCount + 1;
    setFailedVoteCount(newFailedCount);
    if (newFailedCount === 5) {
      setPhase('GAME_END');
    } else {
      setLeaderIndex((leaderIndex + 1) % playerCount);
      setPhase('ROUND_START');
    }
  };

  const castQuestVote = (success) => {
    setQuestVotes(prev => [...prev, success]);
    let nextIndex = -1;
    for(let i = currentPlayerIndex + 1; i < playerCount; i++) {
        if (selectedTeam.includes(i)) {
            nextIndex = i;
            break;
        }
    }
    if (nextIndex !== -1) {
      setCurrentPlayerIndex(nextIndex);
      setIsQuestVotingRevealed(false); 
    } else {
      setPhase('QUEST_RESULT');
    }
  };

  const processQuestResult = () => {
    const fails = questVotes.filter(v => v === false).length;
    const requiredFails = QUEST_CONFIG[playerCount][currentQuestIndex] < 0 ? 2 : 1;
    const isSuccess = fails < requiredFails;

    const newHistory = [...questHistory];
    newHistory[currentQuestIndex] = isSuccess;
    setQuestHistory(newHistory);
    setLastMissionLog(`任務 ${currentQuestIndex + 1}: ${isSuccess ? '成功' : '失敗'} (出現 ${fails} 張失敗牌)`);

    const successTotal = newHistory.filter(r => r === true).length;
    const failTotal = newHistory.filter(r => r === false).length;

    if (failTotal >= 3) {
      setPhase('GAME_END');
    } else if (successTotal >= 3) {
      setPhase('ASSASSIN');
    } else {
      setCurrentQuestIndex(prev => prev + 1);
      setLeaderIndex((leaderIndex + 1) % playerCount);
      setPhase('ROUND_START');
    }
  };

  const attemptAssassination = () => {
    if (assassinTarget === null) return;
    const targetPlayer = players.find(p => p.id === assassinTarget);
    if (targetPlayer.role === 'MERLIN') {
      setLastMissionLog('刺殺成功！梅林倒下了。');
      setPhase('GAME_END_EVIL_WIN');
    } else {
      setLastMissionLog(`刺殺失敗！${targetPlayer.name} 不是梅林。`);
      setPhase('GAME_END_GOOD_WIN');
    }
  };

  // --- 渲染組件 ---

  const Card3D = ({ title, roleName, sub, type, isRevealed, onClick, spritePosition }) => {
    // 計算背景圖偏移量
    // cols=4 => 每個寬度 25%, rows=2 => 每個高度 50%
    // backgroundPosition x% y%
    // x: (colIndex / (cols - 1)) * 100
    // y: (rowIndex / (rows - 1)) * 100
    const bgX = (spritePosition.col / (SPRITE_CONFIG.cols - 1)) * 100;
    const bgY = (spritePosition.row / (SPRITE_CONFIG.rows - 1)) * 100;

    return (
      <div className="w-72 h-[450px] cursor-pointer perspective-1000" onClick={onClick}>
        <motion.div
          className="relative w-full h-full preserve-3d transition-transform duration-700"
          animate={{ rotateY: isRevealed ? 180 : 0 }}
          style={{ transformStyle: 'preserve-3d' }} 
        >
          {/* 背面 */}
          <div 
            className="absolute w-full h-full backface-hidden bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-600 rounded-xl shadow-2xl flex flex-col items-center justify-center p-6"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg)' }}
          >
            <div className="w-24 h-24 rounded-full bg-slate-700/50 flex items-center justify-center mb-4 border border-slate-500 shadow-inner">
              <Scroll className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-3xl font-black text-slate-200 tracking-[0.2em] text-center border-y-2 border-slate-700 py-2">AVALON</h3>
            <p className="text-base text-slate-500 mt-4 animate-pulse">點擊翻開身份</p>
          </div>

          {/* 正面 */}
          <div 
            className={`absolute w-full h-full backface-hidden border-2 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.6)] flex flex-col items-center overflow-hidden
              ${type === 'GOOD' ? 'bg-gradient-to-b from-blue-900 to-slate-900 border-blue-400/50' : 'bg-gradient-to-b from-red-900 to-slate-900 border-red-500/50'}`}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }} 
          >
             {/* 圖片區域 (Sprite) */}
             <div className="w-full h-3/5 relative bg-black overflow-hidden group">
                <div 
                  className="w-full h-full absolute inset-0 transition-transform duration-700 group-hover:scale-110"
                  style={{
                    backgroundImage: `url(${SPRITE_CONFIG.src})`,
                    // ✅ 修改後：讓高度自動 (auto)，這樣比例就會鎖定，多餘的部分會自動裁切掉
                    backgroundSize: `${SPRITE_CONFIG.cols * 100}% auto`,
                    backgroundPosition: `${bgX}% ${bgY}%`,
                    backgroundRepeat: 'no-repeat'
                  }}
                ></div>
                
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none"></div>
             </div>

             {/* 文字區域 */}
             <div className="w-full h-2/5 flex flex-col items-center justify-center p-4 relative z-10 -mt-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 shadow-lg border-2 bg-slate-900 ${type === 'GOOD' ? 'border-blue-500 text-blue-400' : 'border-red-500 text-red-400'}`}>
                    {type === 'GOOD' ? <Shield className="w-6 h-6" /> : <Skull className="w-6 h-6" />}
                </div>
                <h2 className={`text-4xl font-bold mb-1 ${type === 'GOOD' ? 'text-blue-100 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'text-red-100 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}>
                  {roleName}
                </h2>
                <span className={`text-sm font-bold uppercase tracking-widest px-3 py-1 rounded-md mb-2 ${type === 'GOOD' ? 'bg-blue-900/50 text-blue-300' : 'bg-red-900/50 text-red-300'}`}>
                    {type === 'GOOD' ? '正義陣營' : '邪惡陣營'}
                </span>
                <p className="text-center text-sm text-slate-300 font-medium leading-relaxed opacity-90">{sub}</p>
             </div>
          </div>
        </motion.div>
      </div>
    );
  };

  // --- Sub-Render Functions ---

  const renderSetup = () => {
    const currentGood = selectedRoles.filter(r => ROLES_CONFIG[r].side === 'GOOD').length;
    const currentEvil = selectedRoles.filter(r => ROLES_CONFIG[r].side === 'EVIL').length;
    const maxGood = config.good;
    const maxEvil = config.evil;

    return (
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col items-center justify-center min-h-screen w-full max-w-md mx-auto p-6 space-y-8 pb-20">
        <div className="text-center space-y-2 mt-8">
          <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-100 via-amber-400 to-amber-700 tracking-tighter drop-shadow-lg" style={{filter: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.3))'}}>AVALON</h1>
          <p className="text-slate-400 text-base tracking-[0.4em] font-light">THE LEGEND BEGINS</p>
        </div>

        <button 
          onClick={() => setShowTutorial(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-full text-amber-500 text-sm font-bold hover:bg-slate-700 transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          <span>遊戲規則說明</span>
        </button>

        <div className="w-full bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-200 font-bold flex items-center text-lg"><Users className="w-5 h-5 mr-2 text-amber-500"/> 玩家人數</span>
            <select 
              value={playerCount} 
              onChange={(e) => handlePlayerCountChange(Number(e.target.value))}
              className="bg-slate-800 text-amber-400 font-bold p-3 px-5 rounded-lg border border-slate-600 outline-none focus:border-amber-500 transition-colors text-lg"
            >
              {[5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} 人</option>)}
            </select>
          </div>

          {/* 自訂名稱 */}
          <div className="mb-6 border-b border-slate-700/50 pb-4">
             <button 
                onClick={() => setShowNameInputs(!showNameInputs)}
                className="flex items-center text-sm font-bold text-amber-500 hover:text-amber-400 transition-colors mb-2 uppercase tracking-wider"
             >
                <Pencil className="w-4 h-4 mr-1" />
                {showNameInputs ? '收起名稱設定' : '自訂玩家名稱'}
             </button>
             
             <AnimatePresence>
                {showNameInputs && (
                   <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                   >
                      <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                         {[...Array(playerCount)].map((_, i) => (
                            <input
                               key={i}
                               type="text"
                               placeholder={`玩家 ${i + 1}`}
                               maxLength={10}
                               value={customNames[i] || ''}
                               onChange={(e) => setCustomNames(prev => ({...prev, [i]: e.target.value}))}
                               className="bg-slate-800 border border-slate-600 rounded px-3 py-3 text-base text-slate-200 focus:border-amber-500 focus:outline-none placeholder-slate-600"
                            />
                         ))}
                      </div>
                   </motion.div>
                )}
             </AnimatePresence>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end mb-2">
                <p className="text-slate-400 text-sm uppercase tracking-widest flex items-center"><Crown className="w-4 h-4 mr-2"/> 特殊角色配置</p>
                <span className="text-sm text-slate-500">邪惡位: {currentEvil}/{maxEvil}</span>
            </div>
            
            {['PERCIVAL', 'MORGANA', 'MORDRED', 'OBERON'].map(role => {
              const roleConfig = ROLES_CONFIG[role];
              const isSelected = selectedRoles.includes(role);
              const sideCount = roleConfig.side === 'GOOD' ? currentGood : currentEvil;
              const sideMax = roleConfig.side === 'GOOD' ? maxGood : maxEvil;
              const isFull = sideCount >= sideMax;
              const isDisabled = !isSelected && isFull;

              return (
                <div key={role} 
                  onClick={() => !isDisabled && toggleRole(role)}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all 
                    ${isDisabled ? 'bg-slate-900/40 border-slate-800 opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-800/50'}
                    ${isSelected ? 'bg-gradient-to-r from-slate-800 to-slate-700 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.1)]' : (!isDisabled && 'bg-slate-800/30 border-transparent')}
                  `}
                >
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-4 ${roleConfig.side === 'GOOD' ? 'bg-blue-400' : 'bg-red-500'}`}></div>
                    <span className={`font-bold text-lg ${roleConfig.side === 'GOOD' ? 'text-blue-100' : 'text-red-100'}`}>
                        {roleConfig.roleName}
                    </span>
                  </div>
                  {isSelected && <CheckCircle className="w-6 h-6 text-amber-400" />}
                  {isDisabled && <Lock className="w-5 h-5 text-slate-600" />}
                </div>
              );
            })}
            
            <div className="mt-4 p-4 bg-black/40 rounded-lg text-sm text-slate-400 leading-relaxed border border-slate-800">
              <strong className="text-slate-300 block mb-1 text-base">當前配置 ({config.good}善 vs {config.evil}惡)：</strong>
              {currentGood} 位正義方 (餘 {config.good - currentGood} 忠臣) <br/>
              {currentEvil} 位邪惡方 (餘 {config.evil - currentEvil} 爪牙)
            </div>
          </div>
        </div>

        <button 
          onClick={startGame}
          className="w-full py-5 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 rounded-xl font-bold text-white text-2xl shadow-[0_0_20px_rgba(217,119,6,0.4)] hover:shadow-[0_0_40px_rgba(217,119,6,0.6)] hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center group"
        >
          <span>進入阿瓦隆</span>
          <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>
    );
  };

  const renderReveal = () => {
    const player = players[currentPlayerIndex];
    const knowledge = getKnowledge(player);
    const knownPeople = knowledge.filter(p => p.label !== '未知' && p.label !== '你自己');

    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full p-6">
        {!isRevealed ? (
          <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="text-center space-y-8 max-w-sm w-full">
            <div className="w-24 h-24 bg-slate-800 rounded-full mx-auto flex items-center justify-center mb-4 border border-slate-600 shadow-xl">
                <Dna className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-3xl text-slate-300 font-bold">請將裝置交給</h2>
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-600 mb-8 py-4 leading-tight">{player.name}</div>
            <button onClick={() => setIsRevealed(true)} className="w-full px-8 py-6 bg-slate-700 rounded-xl text-white text-xl font-bold border border-slate-500 shadow-lg hover:bg-slate-600 transition-colors">
              我是 {player.name}，查看身份
            </button>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center w-full max-w-md">
             <Card3D 
               title={player.name} 
               roleName={player.roleName} 
               sub={player.description} 
               type={player.side} 
               isRevealed={true} 
               spritePosition={player.spritePosition}
               onClick={() => {}} 
             />
             
             <div className="mt-8 w-full bg-slate-900/90 backdrop-blur rounded-xl p-5 border border-slate-700 shadow-xl">
               <h3 className="text-slate-400 text-sm tracking-widest uppercase mb-4 text-center flex items-center justify-center font-bold"><Eye className="w-4 h-4 mr-2"/> 已知情報</h3>
               {knownPeople.length === 0 ? (
                 <p className="text-center text-slate-500 py-3 text-base">迷霧籠罩，你沒有看到任何特殊情報。</p>
               ) : (
                 <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                   {knownPeople.map(p => (
                     <div key={p.id} className="flex items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                       <div className={`w-3 h-3 rounded-full mr-3 shadow-[0_0_5px_currentColor] ${p.label.includes('邪惡') || p.label.includes('隊友') ? 'bg-red-500 text-red-500' : 'bg-amber-400 text-amber-400'}`}></div>
                       <div>
                         <div className="text-slate-200 text-base font-bold">{p.name}</div>
                         <div className="text-xs text-slate-400 uppercase tracking-wider">{p.label}</div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>

             <button 
              onClick={nextReveal}
              className="mt-8 w-full py-5 bg-slate-800 text-slate-300 text-lg font-bold rounded-xl border border-slate-600 active:bg-slate-700 hover:text-white transition-colors"
            >
              我記住了，隱藏身份
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="w-full max-w-lg mx-auto p-4 flex flex-col min-h-screen">
      {/* 頂部狀態列 */}
      <div className="flex justify-between items-end mb-6 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-amber-500 font-bold text-xl flex items-center"><Scroll className="w-5 h-5 mr-2"/>第 {currentQuestIndex + 1} 次遠征</h2>
          <p className="text-slate-400 text-sm mt-1">需 <span className="text-white font-bold">{Math.abs(QUEST_CONFIG[playerCount][currentQuestIndex])}</span> 人出征 {QUEST_CONFIG[playerCount][currentQuestIndex] < 0 && <span className="text-red-400 font-bold">(需2張失敗)</span>}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end space-x-1 mb-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`w-4 h-4 rounded-full transition-colors ${i < failedVoteCount ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-slate-700'}`}></div>
            ))}
          </div>
          <p className="text-sm text-slate-500">流標計數</p>
        </div>
      </div>

      {/* 任務進度條 */}
      <div className="flex justify-between mb-8 px-2">
        {questHistory.map((status, i) => (
          <div key={i} className={`relative w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-500
            ${i === currentQuestIndex ? 'border-amber-400 scale-110 shadow-[0_0_15px_rgba(251,191,36,0.5)] bg-slate-800' : 
              status === true ? 'border-blue-500 bg-blue-900/40 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 
              status === false ? 'border-red-500 bg-red-900/40 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'border-slate-700 bg-slate-800/50'}`}>
            <span className={`text-xl font-bold ${status === null ? 'text-slate-500' : 'text-white'}`}>
              {Math.abs(QUEST_CONFIG[playerCount][i])}
            </span>
            {status === true && <CheckCircle className="absolute -bottom-2 -right-2 w-7 h-7 text-blue-400 bg-slate-900 rounded-full border-2 border-slate-900" />}
            {status === false && <XCircle className="absolute -bottom-2 -right-2 w-7 h-7 text-red-500 bg-slate-900 rounded-full border-2 border-slate-900" />}
          </div>
        ))}
        
      </div>
      {/* --- 新增：隨時刺殺按鈕 (加在這裡！) --- */}
      <div className="mb-4 flex justify-end">
        <button 
          onClick={() => {
            if (window.confirm('⚠️ 警告：這將強制中斷遊戲進程！\n\n如果你是刺客，且已經確認梅林身分，請按下「確定」直接進行刺殺環節。\n\n若刺殺失敗，好人將直接獲勝。')) {
              setPhase('ASSASSIN');
            }
          }}
          className="flex items-center px-4 py-2 bg-red-900/30 border border-red-500/50 text-red-400 rounded-lg text-sm font-bold hover:bg-red-900/50 hover:text-red-200 transition-colors"
        >
          <Skull className="w-4 h-4 mr-2" />
          刺客現身
        </button>
      </div>

      {/* 根據子階段渲染內容 */}
      <div className="flex-1 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-5 shadow-xl overflow-y-auto">
        {phase === 'ROUND_START' && (
           <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
             <div className="w-28 h-28 bg-gradient-to-br from-yellow-500/20 to-amber-700/20 rounded-full flex items-center justify-center border border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                <Crown className="w-14 h-14 text-yellow-500" />
             </div>
             <div>
               <p className="text-slate-400 text-sm uppercase tracking-widest mb-3">本輪決策者</p>
               <h2 className="text-5xl font-bold text-white mt-2">{players[leaderIndex].name}</h2>
             </div>
             <button onClick={startRound} className="w-full max-w-xs px-8 py-5 bg-gradient-to-r from-yellow-600 to-amber-700 text-white text-xl font-bold rounded-xl shadow-lg hover:shadow-amber-500/20 hover:scale-105 transition-all">
               開始指派隊伍
             </button>
             {lastMissionLog && (
                <div className="mt-8 p-5 bg-slate-800/50 rounded-lg border border-slate-700 w-full">
                    <p className="text-base text-slate-300">{lastMissionLog}</p>
                </div>
             )}
           </div>
        )}

        {phase === 'TEAM_PROPOSAL' && (
          <div className="h-full flex flex-col">
            <h3 className="text-center text-slate-300 text-lg mb-6 flex items-center justify-center font-bold"><Users className="w-5 h-5 mr-2"/>隊長請點擊頭像選擇隊員</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {players.map(p => (
                <motion.div 
                  key={p.id}
                  whileTap={{scale: 0.95}}
                  onClick={() => toggleTeamSelection(p.id)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-xl border-2 cursor-pointer transition-all duration-200 relative overflow-hidden
                    ${selectedTeam.includes(p.id) ? 'bg-amber-900/40 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${selectedTeam.includes(p.id) ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-400'}`}>
                     <Users className="w-5 h-5" />
                  </div>
                  <span className={`text-sm font-bold ${selectedTeam.includes(p.id) ? 'text-amber-100' : 'text-slate-400'}`}>{p.name}</span>
                  {selectedTeam.includes(p.id) && <div className="absolute top-2 right-2"><CheckCircle className="w-5 h-5 text-amber-500" /></div>}
                </motion.div>
              ))}
            </div>
            <button 
              disabled={selectedTeam.length !== Math.abs(QUEST_CONFIG[playerCount][currentQuestIndex])}
              onClick={submitProposal}
              className="mt-auto w-full py-5 bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xl font-bold rounded-xl shadow-lg transition-all"
            >
              {selectedTeam.length !== Math.abs(QUEST_CONFIG[playerCount][currentQuestIndex]) 
               ? `請選擇 ${Math.abs(QUEST_CONFIG[playerCount][currentQuestIndex])} 人` 
               : '發起表決 (現場)'}
            </button>
          </div>
        )}

        {phase === 'TEAM_VOTE' && (
           <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
             <div className="mb-4 w-full">
                 <h2 className="text-2xl font-bold text-slate-200 mb-4 flex items-center justify-center">
                    <Hand className="w-6 h-6 mr-2 text-amber-400"/>
                    隊伍表決 (舉手投票)
                 </h2>
                 <p className="text-slate-400 text-base mb-8">請在場玩家進行公開舉手表決</p>
                 
                 <div className="bg-slate-800/60 p-6 rounded-xl border border-slate-700 mb-6">
                    <p className="text-sm text-slate-500 uppercase tracking-widest mb-4">提名隊伍</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {selectedTeam.map(id => (
                            <span key={id} className="bg-amber-500/10 text-amber-200 px-4 py-2 rounded-lg text-base border border-amber-500/20 font-bold">
                                {players.find(p => p.id === id)?.name}
                            </span>
                        ))}
                    </div>
                 </div>
             </div>

             <div className="w-full space-y-4">
                 <button onClick={handleVotePass} className="w-full py-5 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white text-xl font-bold rounded-xl shadow-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 mr-3" />
                    表決通過 (贊成 {'>'} 反對)
                 </button>
                 <button onClick={handleVoteFail} className="w-full py-5 bg-gradient-to-r from-red-800 to-red-700 hover:from-red-700 hover:to-red-600 text-white text-xl font-bold rounded-xl shadow-lg flex items-center justify-center">
                    <XCircle className="w-6 h-6 mr-3" />
                    表決失敗 (反對 {'≥'} 贊成)
                 </button>
             </div>
           </div>
        )}

{phase === 'QUEST_RESULT' && (
           <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
             <h2 className="text-3xl font-bold text-white">任務結果</h2>
             
             {/* 上半部：成功票展示區 */}
             <div className="w-full bg-blue-900/20 p-4 rounded-xl border border-blue-500/30">
                <p className="text-blue-400 text-sm font-bold mb-4 uppercase tracking-widest flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 mr-2"/> 
                    成功票數：{questVotes.filter(v => v).length}
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    {questVotes.filter(v => v).map((_, i) => (
                        <motion.div 
                        key={`success-${i}`}
                        initial={{scale: 0, opacity: 0}}
                        animate={{scale: 1, opacity: 1}}
                        transition={{delay: i * 0.1}}
                        className="w-20 h-28 rounded-lg flex flex-col items-center justify-center border-2 bg-gradient-to-br from-blue-800 to-blue-950 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                        >
                            <Sword className="w-8 h-8 text-blue-200 mb-2" />
                            <span className="text-xs font-bold text-blue-100">SUCCESS</span>
                        </motion.div>
                    ))}
                    {questVotes.filter(v => v).length === 0 && <span className="text-slate-500 text-sm py-2">無成功票</span>}
                </div>
             </div>

             {/* 下半部：失敗票展示區 */}
             <div className="w-full bg-red-900/20 p-4 rounded-xl border border-red-500/30">
                <p className="text-red-400 text-sm font-bold mb-4 uppercase tracking-widest flex items-center justify-center">
                    <XCircle className="w-4 h-4 mr-2"/> 
                    失敗票數：{questVotes.filter(v => !v).length}
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    {questVotes.filter(v => !v).map((_, i) => (
                        <motion.div 
                        key={`fail-${i}`}
                        initial={{scale: 0, opacity: 0}}
                        animate={{scale: 1, opacity: 1}}
                        transition={{delay: i * 0.1}}
                        className="w-20 h-28 rounded-lg flex flex-col items-center justify-center border-2 bg-gradient-to-br from-red-800 to-red-950 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                        >
                            <Skull className="w-8 h-8 text-red-200 mb-2" />
                            <span className="text-xs font-bold text-red-100">FAIL</span>
                        </motion.div>
                    ))}
                    {questVotes.filter(v => !v).length === 0 && <span className="text-slate-500 text-sm py-2">無失敗票</span>}
                </div>
             </div>

             <button onClick={processQuestResult} className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white text-xl font-bold rounded-xl shadow-lg transition-colors mt-2">
               確認並繼續
             </button>
           </div>
        )}
      </div>
    </div>
  );

  const renderQuestExecution = () => {
    const player = players[currentPlayerIndex];

    if (!selectedTeam.includes(player.id)) return <div>Error</div>; 

    if (!isQuestVotingRevealed) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950">
                 <div className="w-28 h-28 bg-slate-800 rounded-full mx-auto flex items-center justify-center mb-8 border-2 border-slate-600 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                    <Ghost className="w-14 h-14 text-slate-400" />
                </div>
                <h2 className="text-2xl text-slate-400 mb-4 uppercase tracking-widest font-bold">請將裝置交給執行者</h2>
                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600 mb-10 py-2">
                    {player.name}
                </div>
                <button 
                    onClick={() => setIsQuestVotingRevealed(true)}
                    className="w-full max-w-sm px-8 py-6 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white text-xl font-bold rounded-2xl border border-slate-500 shadow-xl transition-all active:scale-95"
                >
                    我是 {player.name}，開始執行任務
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-black/95">
            <div className="mb-12 text-center">
                <h2 className="text-slate-400 uppercase tracking-widest text-sm mb-3 font-bold">執行任務</h2>
                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-300 to-amber-600 pb-4">{player.name}</div>
                <p className="text-slate-500 text-base mt-2 flex items-center justify-center"><Ghost className="w-4 h-4 mr-2"/> 請祕密決定任務成敗</p>
            </div>

            <div className="space-y-6 w-full max-w-sm px-4">
                <button 
                    onClick={() => castQuestVote(true)}
                    className="w-full py-8 bg-gradient-to-r from-blue-900/40 to-slate-900 border-2 border-blue-500/50 text-blue-100 rounded-2xl font-bold hover:border-blue-400 active:scale-95 transition-all flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.2)] group"
                >
                    <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center mr-5 group-hover:bg-blue-500/30 transition-colors">
                        <Sword className="w-8 h-8 text-blue-300" />
                    </div>
                    <span className="text-2xl">任務成功</span>
                </button>
                
                {player.side === 'EVIL' ? (
                    <button 
                        onClick={() => castQuestVote(false)}
                        className="w-full py-8 bg-gradient-to-r from-red-900/40 to-slate-900 border-2 border-red-500/50 text-red-100 rounded-2xl font-bold hover:border-red-400 active:scale-95 transition-all flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.2)] group"
                    >
                         <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mr-5 group-hover:bg-red-500/30 transition-colors">
                            <Skull className="w-8 h-8 text-red-300" />
                        </div>
                        <span className="text-2xl">任務失敗</span>
                    </button>
                ) : (
                    <div className="w-full py-8 border-2 border-dashed border-slate-800 text-slate-600 rounded-2xl font-bold text-center flex items-center justify-center cursor-not-allowed select-none">
                        <span className="text-lg">好人陣營無法選擇失敗</span>
                    </div>
                )}
            </div>
            
            <div className="mt-12 max-w-xs text-center">
                 <p className={`text-base font-bold ${player.side === 'GOOD' ? 'text-blue-400' : 'text-red-400'}`}>
                    {player.side === 'GOOD' ? '為了正義，你別無選擇。' : '你可以選擇偽裝，或給予致命一擊。'}
                 </p>
            </div>
        </div>
    );
  };

  const renderAssassin = () => {
    const assassinPlayer = players.find(p => p.role === 'ASSASSIN');
    if (!assassinPlayer) {
        setPhase('GAME_END_GOOD_WIN');
        return null;
    }

    const potentialTargets = players.filter(p => p.side === 'GOOD');

    return (
        <div className="min-h-screen flex flex-col items-center p-6 bg-red-950/20">
            <div className="text-center my-10">
                <h1 className="text-6xl font-black text-red-500 mb-4 drop-shadow-[0_0_15px_rgba(220,38,38,0.6)]">刺客時刻</h1>
                <p className="text-slate-300 mt-4 text-xl">正義方已完成三次任務。<br/>現在是反擊的唯一機會。</p>
            </div>

            <div className="w-full max-w-md bg-black/40 p-6 rounded-xl border border-red-900/30">
                <p className="text-center text-red-400 font-bold mb-6 flex items-center justify-center text-lg"><AlertTriangle className="w-5 h-5 mr-2"/>找出梅林，扭轉戰局</p>
                <div className="grid grid-cols-2 gap-4">
                    {potentialTargets.map(p => (
                        <div 
                            key={p.id}
                            onClick={() => setAssassinTarget(p.id)}
                            className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center relative overflow-hidden
                                ${assassinTarget === p.id ? 'bg-red-600 border-red-500 scale-105 shadow-[0_0_20px_rgba(220,38,38,0.6)] z-10' : 'bg-slate-800 border-slate-700 hover:border-red-500/50 opacity-80 hover:opacity-100'}`}
                        >
                            <div className="w-14 h-14 bg-slate-700 rounded-full flex items-center justify-center mb-3">
                                <HelpCircle className="text-slate-400 w-8 h-8" />
                            </div>
                            <span className="text-white font-bold text-lg">{p.name}</span>
                            {assassinTarget === p.id && <div className="absolute top-2 right-2"><Skull className="w-5 h-5 text-white"/></div>}
                        </div>
                    ))}
                </div>
            </div>

            <button 
                disabled={!assassinTarget}
                onClick={attemptAssassination}
                className="mt-10 w-full max-w-md py-6 bg-red-600 disabled:bg-slate-800 disabled:text-slate-500 text-white text-2xl font-bold rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all hover:bg-red-500"
            >
                {assassinTarget ? '確認刺殺目標' : '請選擇刺殺對象'}
            </button>
        </div>
    );
  };

  const renderGameEnd = (winner) => {
    const isEvilWin = winner === 'EVIL';
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-10 z-10 relative">
            <motion.div 
                initial={{scale: 0, rotate: -180}} animate={{scale: 1, rotate: 0}} 
                transition={{type: 'spring', duration: 1.5}}
                className={`w-48 h-48 rounded-full flex items-center justify-center shadow-[0_0_80px_currentColor] border-4 ${isEvilWin ? 'text-red-500 bg-red-900/20 border-red-500' : 'text-blue-400 bg-blue-900/20 border-blue-400'}`}
            >
                {isEvilWin ? <Skull className="w-28 h-28" /> : <Crown className="w-28 h-28" />}
            </motion.div>
            
            <div className="space-y-6">
                <h1 className={`text-7xl font-black mb-2 tracking-tighter ${isEvilWin ? 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]' : 'text-blue-400 drop-shadow-[0_0_20px_rgba(96,165,250,0.8)]'}`}>
                    {isEvilWin ? '邪惡勝利' : '正義勝利'}
                </h1>
                <p className="text-slate-300 text-xl font-medium bg-black/40 px-6 py-3 rounded-xl inline-block">{lastMissionLog}</p>
            </div>

            <div className="w-full max-w-md bg-slate-900/80 p-6 rounded-2xl border border-slate-700 max-h-96 overflow-y-auto shadow-2xl">
                <h3 className="text-slate-500 text-sm mb-4 uppercase tracking-widest border-b border-slate-800 pb-3 font-bold">身份揭曉</h3>
                {players.map(p => (
                    <div key={p.id} className="flex justify-between items-center py-4 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 px-3 rounded">
                        <span className="text-white font-bold text-xl">{p.name}</span>
                        <div className="flex items-center">
                            <span className={`mr-3 text-sm px-3 py-1 rounded font-bold ${p.side === 'GOOD' ? 'bg-blue-900/50 text-blue-300' : 'bg-red-900/50 text-red-300'}`}>
                                {p.side === 'GOOD' ? '正義' : '邪惡'}
                            </span>
                            <span className="text-slate-300 font-medium text-lg">{p.roleName}</span>
                        </div>
                    </div>
                ))}
            </div>

            <button onClick={() => window.location.reload()} className="px-12 py-5 bg-slate-700 rounded-xl text-white text-xl font-bold hover:bg-slate-600 transition-all hover:scale-105 shadow-lg">
                重新開始新的傳說
            </button>
        </div>
    );
  };

  // --- Main Render Switch ---

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 select-none overflow-hidden relative">
      <StarryBackground />
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />

      <AnimatePresence mode="wait">
        <motion.div 
          key={phase + currentPlayerIndex} 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="relative z-10"
        >
          {phase === 'SETUP' && renderSetup()}
          {phase === 'REVEAL' && renderReveal()}
          {(phase === 'ROUND_START' || phase === 'TEAM_PROPOSAL' || phase === 'VOTE_RESULT' || phase === 'QUEST_RESULT') && renderDashboard()}
          {phase === 'TEAM_VOTE' && renderDashboard()}
          {phase === 'QUEST_EXECUTION' && renderQuestExecution()}
          {phase === 'ASSASSIN' && renderAssassin()}
          {(phase === 'GAME_END' || phase === 'GAME_END_EVIL_WIN') && renderGameEnd('EVIL')}
          {phase === 'GAME_END_GOOD_WIN' && renderGameEnd('GOOD')}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
