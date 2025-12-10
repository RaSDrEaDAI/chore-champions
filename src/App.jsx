import { useState, useEffect, useCallback } from 'react'
import {
  Trophy, Star, Flame, Award, Plus, Edit2, Trash2, LogOut, Check, X,
  Gift, Crown, Target, Volume2, VolumeX, Palette, Sparkles,
  Book, BookOpen, GraduationCap, Flower2, Droplets, Leaf, PlusCircle, Sun,
  Lock, User, ChevronRight, ExternalLink
} from 'lucide-react'

// ============ CONSTANTS ============
const SUBJECTS = {
  math: { name: 'Math', emoji: '🔢', color: 'blue' },
  reading: { name: 'Reading', emoji: '📖', color: 'green' },
  science: { name: 'Science', emoji: '🔬', color: 'purple' },
  music: { name: 'Music', emoji: '🎵', color: 'pink' },
  language: { name: 'Language', emoji: '🗣️', color: 'orange' },
  art: { name: 'Art', emoji: '🎨', color: 'yellow' },
}

const SKILL_LEVELS = [
  { name: 'Beginner', xpRequired: 0, icon: '🌱' },
  { name: 'Developing', xpRequired: 100, icon: '🌿' },
  { name: 'Proficient', xpRequired: 300, icon: '🌳' },
  { name: 'Advanced', xpRequired: 600, icon: '⭐' },
  { name: 'Master', xpRequired: 1000, icon: '👑' },
]

const PLANT_TYPES = {
  sunflower: { name: 'Sunflower', emoji: '🌻', growthTime: 3, harvestPoints: 25 },
  tulip: { name: 'Tulip', emoji: '🌷', growthTime: 2, harvestPoints: 15 },
  rose: { name: 'Rose', emoji: '🌹', growthTime: 4, harvestPoints: 35 },
  bookFlower: { name: 'Knowledge Bloom', emoji: '📚', growthTime: 3, harvestPoints: 30 },
}

const GROWTH_STAGES = ['🟤', '🌱', '🌿', '🪴', '🌸']

const THEMES = {
  purple: { primary: 'from-purple-400 via-pink-400 to-orange-300', name: 'Purple' },
  blue: { primary: 'from-blue-400 via-cyan-400 to-teal-300', name: 'Blue' },
  green: { primary: 'from-green-400 via-emerald-400 to-lime-300', name: 'Green' },
  pink: { primary: 'from-pink-400 via-rose-400 to-red-300', name: 'Pink' },
  orange: { primary: 'from-orange-400 via-amber-400 to-yellow-300', name: 'Orange' },
}

const PRIZE_OPTIONS = [
  { name: 'Movie Night Pick', points: 100 },
  { name: '$10 Gift Card', points: 200 },
  { name: 'Robux 800', points: 250 },
  { name: 'Extra Screen Time (1hr)', points: 75 },
  { name: 'Ice Cream Trip', points: 150 },
  { name: 'New Book', points: 120 },
  { name: 'Sleepover Permission', points: 300 },
  { name: 'Choose Dinner', points: 80 },
  { name: 'Skip One Chore', points: 50 },
  { name: 'Stay Up Late (30min)', points: 60 },
]

// External learning resources (kid-specific)
const LEARNING_RESOURCES = {
  sophia: {
    mathTutor: {
      name: '8th Grade Math Tutor',
      url: 'https://gemini.google.com/gem/13DAOAjMybCBMuVwtAg12_l1rt_EMV4Bh',
      description: 'Your personal AI math tutor for 8th grade curriculum'
    }
  },
  ella: {
    mathTutor: {
      name: '4th Grade Math Tutor',
      url: 'https://gemini.google.com/gem/1AvTu_mAJjX6YJwEvvQA_F57L3ARl8thl',
      description: 'Your personal AI math tutor for 4th grade curriculum'
    }
  }
}

// ============ UTILITIES ============
const getLevelInfo = (lifetimePoints) => {
  const levels = [0, 50, 150, 300, 500, 750, 1100, 1500, 2000, 2600, 3300]
  let level = 1
  for (let i = 1; i < levels.length; i++) {
    if (lifetimePoints >= levels[i]) level = i + 1
    else break
  }
  const currentThreshold = levels[level - 1] || 0
  const nextThreshold = levels[level] || levels[levels.length - 1] + 1000
  const progress = ((lifetimePoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100
  return { level, currentThreshold, nextThreshold, progress: Math.min(progress, 100) }
}

// Garden plots unlock based on level: Level 1 = 2 plots, then +1 plot per level up to 8
const getUnlockedPlots = (level) => {
  // Level 1: 2 plots, Level 2: 3, Level 3: 4, ... Level 7+: 8 (all)
  return Math.min(8, level + 1)
}

const getSkillLevel = (xp) => {
  for (let i = SKILL_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= SKILL_LEVELS[i].xpRequired) {
      return {
        ...SKILL_LEVELS[i],
        index: i,
        nextLevel: SKILL_LEVELS[i + 1] || null,
        progress: SKILL_LEVELS[i + 1] 
          ? ((xp - SKILL_LEVELS[i].xpRequired) / (SKILL_LEVELS[i + 1].xpRequired - SKILL_LEVELS[i].xpRequired)) * 100
          : 100
      }
    }
  }
  return { ...SKILL_LEVELS[0], index: 0, nextLevel: SKILL_LEVELS[1], progress: 0 }
}

const playSound = (type) => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    const sounds = {
      complete: { freq: 800, duration: 0.1, type: 'sine' },
      click: { freq: 600, duration: 0.05, type: 'square' },
      water: { freq: 350, duration: 0.15, type: 'sine' },
      harvest: { freq: 700, duration: 0.25, type: 'triangle' },
      levelUp: { freq: 523.25, duration: 0.3, type: 'triangle' },
    }
    const sound = sounds[type] || sounds.click
    oscillator.type = sound.type
    oscillator.frequency.setValueAtTime(sound.freq, audioContext.currentTime)
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration)
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + sound.duration)
  } catch (e) {
    // Audio not supported
  }
}

// ============ DEFAULT DATA ============
const createDefaultKidData = () => ({
  points: 0,
  lifetimePoints: 0,
  totalCompleted: 0,
  streak: 0,
  bestStreak: 0,
  completedToday: [],
  prize: { name: 'Movie Night Pick', pointsNeeded: 100 },
  subjectXP: { math: 0, reading: 0, science: 0, music: 0, language: 0, art: 0 },
  readingLog: [],
  readingStreak: 0,
  garden: {
    plots: Array(8).fill(null).map((_, i) => ({ id: i, plant: null, stage: 0, health: 100 })),
    harvestHistory: []
  },
  theme: 'purple'
})

const defaultTasks = [
  { id: 1, title: 'Make bed', points: 10, category: 'chore', assignedTo: ['sophia', 'ella'] },
  { id: 2, title: 'Brush teeth (morning)', points: 5, category: 'chore', assignedTo: ['sophia', 'ella'] },
  { id: 3, title: 'Clean room', points: 20, category: 'chore', assignedTo: ['sophia', 'ella'] },
  { id: 4, title: 'Do homework', points: 25, category: 'learning', subject: 'math', assignedTo: ['sophia', 'ella'], teachBackBonus: true },
  { id: 5, title: 'Read for 20 minutes', points: 15, category: 'learning', subject: 'reading', assignedTo: ['sophia', 'ella'], teachBackBonus: true },
  { id: 6, title: 'Practice piano', points: 20, category: 'learning', subject: 'music', assignedTo: ['sophia'], teachBackBonus: true },
]

const defaultKids = [
  { id: 'sophia', name: 'Sophia', age: 13, pin: '1313', ...createDefaultKidData(), theme: 'purple' },
  { id: 'ella', name: 'Ella', age: 9, pin: '0909', ...createDefaultKidData(), theme: 'pink' }
]

// ============ STORAGE ============
const STORAGE_KEY = 'chore-champions-data'

const loadData = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      return {
        tasks: data.tasks || defaultTasks,
        kids: data.kids || defaultKids
      }
    }
  } catch (e) {
    console.error('Failed to load data:', e)
  }
  return { tasks: defaultTasks, kids: defaultKids }
}

const saveData = (tasks, kids) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, kids }))
  } catch (e) {
    console.error('Failed to save data:', e)
  }
}

// ============ MAIN APP ============
export default function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [loginView, setLoginView] = useState('select')
  const [selectedKid, setSelectedKid] = useState(null)
  const [parentPassword, setParentPassword] = useState('')
  const [kidPin, setKidPin] = useState('')
  const [adminTab, setAdminTab] = useState('dashboard')
  const [kidView, setKidView] = useState('tasks')
  const [showRedemption, setShowRedemption] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [teachBackModal, setTeachBackModal] = useState(null) // { task, onComplete }
  
  // Load initial data
  const [{ tasks, kids }, setData] = useState(loadData)

  // Save whenever data changes
  useEffect(() => {
    saveData(tasks, kids)
  }, [tasks, kids])

  const setTasks = (newTasks) => {
    setData(prev => ({ ...prev, tasks: typeof newTasks === 'function' ? newTasks(prev.tasks) : newTasks }))
  }

  const setKids = (newKids) => {
    setData(prev => ({ ...prev, kids: typeof newKids === 'function' ? newKids(prev.kids) : newKids }))
  }

  // Update kid data helper
  const updateKid = (kidId, updates) => {
    const updatedKids = kids.map(k => k.id === kidId ? { ...k, ...updates } : k)
    setKids(updatedKids)
    if (currentUser?.type === 'kid' && currentUser.data.id === kidId) {
      setCurrentUser({ ...currentUser, data: updatedKids.find(k => k.id === kidId) })
    }
  }

  // Auth handlers
  const handleParentLogin = () => {
    if (parentPassword === 'admin123') {
      setCurrentUser({ type: 'parent' })
      setLoginView('select')
      setParentPassword('')
    } else {
      alert('Incorrect password')
    }
  }

  const handleKidLogin = () => {
    const kid = kids.find(k => k.id === selectedKid && k.pin === kidPin)
    if (kid) {
      setCurrentUser({ type: 'kid', data: kid })
      setLoginView('select')
      setKidPin('')
    } else {
      alert('Incorrect PIN')
    }
  }

  const logout = () => {
    setCurrentUser(null)
    setKidView('tasks')
    setAdminTab('dashboard')
  }

  // Task handlers
  const saveTask = (taskData) => {
    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...taskData, id: editingTask.id } : t))
    } else {
      setTasks([...tasks, { ...taskData, id: Date.now() }])
    }
    setShowTaskModal(false)
    setEditingTask(null)
  }

  const deleteTask = (taskId) => {
    if (confirm('Delete this task?')) {
      setTasks(tasks.filter(t => t.id !== taskId))
    }
  }

  const toggleTaskComplete = (taskId, teachBack = false) => {
    const kid = currentUser.data
    const task = tasks.find(t => t.id === taskId)
    const isCompleted = kid.completedToday.includes(taskId)
    
    let taskPoints = task.points
    if (teachBack && task.teachBackBonus) taskPoints = Math.floor(task.points * 1.5)

    if (isCompleted) {
      updateKid(kid.id, {
        completedToday: kid.completedToday.filter(id => id !== taskId),
        points: kid.points - taskPoints,
        lifetimePoints: kid.lifetimePoints - taskPoints,
        totalCompleted: kid.totalCompleted - 1
      })
    } else {
      const newCompleted = [...kid.completedToday, taskId]
      let newSubjectXP = { ...kid.subjectXP }
      if (task.category === 'learning' && task.subject) {
        newSubjectXP[task.subject] = (newSubjectXP[task.subject] || 0) + task.points
      }

      const kidTasks = tasks.filter(t => t.assignedTo.includes(kid.id))
      const allComplete = kidTasks.every(t => newCompleted.includes(t.id))
      
      if (allComplete) {
        setShowCelebration(true)
        if (soundEnabled) playSound('complete')
        setTimeout(() => setShowCelebration(false), 3000)
      } else {
        if (soundEnabled) playSound('click')
      }

      updateKid(kid.id, {
        completedToday: newCompleted,
        points: kid.points + taskPoints,
        lifetimePoints: kid.lifetimePoints + taskPoints,
        totalCompleted: kid.totalCompleted + 1,
        subjectXP: newSubjectXP,
        streak: allComplete ? kid.streak + 1 : kid.streak,
        bestStreak: allComplete ? Math.max(kid.bestStreak, kid.streak + 1) : kid.bestStreak
      })
    }
  }

  // Goal handlers
  const updateKidGoal = (kidId, prizeName, pointsNeeded) => {
    updateKid(kidId, { prize: { name: prizeName, pointsNeeded } })
    setShowGoalModal(null)
  }

  const redeemPrize = () => {
    const kid = currentUser.data
    if (kid.points >= kid.prize.pointsNeeded) {
      updateKid(kid.id, { points: kid.points - kid.prize.pointsNeeded })
      setShowRedemption(false)
      if (soundEnabled) playSound('levelUp')
    }
  }

  // Garden handlers
  const plantInGarden = (plotIndex, plantType) => {
    const kid = currentUser.data
    const newPlots = [...kid.garden.plots]
    newPlots[plotIndex] = { ...newPlots[plotIndex], plant: plantType, stage: 0, health: 100 }
    updateKid(kid.id, { garden: { ...kid.garden, plots: newPlots } })
    if (soundEnabled) playSound('click')
  }

  const waterPlant = (plotIndex) => {
    const kid = currentUser.data
    const newPlots = [...kid.garden.plots]
    newPlots[plotIndex] = { ...newPlots[plotIndex], stage: Math.min(4, newPlots[plotIndex].stage + 1), health: 100 }
    updateKid(kid.id, { garden: { ...kid.garden, plots: newPlots } })
    if (soundEnabled) playSound('water')
  }

  const harvestPlant = (plotIndex) => {
    const kid = currentUser.data
    const plot = kid.garden.plots[plotIndex]
    const plant = PLANT_TYPES[plot.plant]
    if (!plant) return

    const newPlots = [...kid.garden.plots]
    newPlots[plotIndex] = { id: plotIndex, plant: null, stage: 0, health: 100 }
    
    updateKid(kid.id, {
      garden: {
        plots: newPlots,
        harvestHistory: [...kid.garden.harvestHistory, { plant: plot.plant, points: plant.harvestPoints, date: new Date().toISOString() }]
      },
      points: kid.points + plant.harvestPoints,
      lifetimePoints: kid.lifetimePoints + plant.harvestPoints
    })
    if (soundEnabled) playSound('harvest')
  }

  // Reading handlers
  const addBook = (title, totalPages) => {
    const kid = currentUser.data
    updateKid(kid.id, {
      readingLog: [...kid.readingLog, { id: Date.now(), title, totalPages, pagesRead: 0, completed: false }]
    })
  }

  const updateBookProgress = (bookId, pagesToAdd) => {
    const kid = currentUser.data
    const book = kid.readingLog.find(b => b.id === bookId)
    const newPagesRead = Math.min(book.pagesRead + pagesToAdd, book.totalPages)
    const completed = newPagesRead >= book.totalPages

    updateKid(kid.id, {
      readingLog: kid.readingLog.map(b => b.id === bookId ? { ...b, pagesRead: newPagesRead, completed } : b),
      subjectXP: { ...kid.subjectXP, reading: kid.subjectXP.reading + pagesToAdd },
      readingStreak: kid.readingStreak + 1
    })
  }

  // Theme handler
  const updateKidTheme = (theme) => {
    const kid = currentUser.data
    updateKid(kid.id, { theme })
  }

  // ============ RENDER ============

  // Login: Select Screen
  if (!currentUser && loginView === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-4 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
            <h1 className="text-3xl font-bold text-gray-800">Chore Champions</h1>
            <p className="text-gray-600 mt-2">Who's logging in?</p>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => setLoginView('parent')}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <Lock className="w-5 h-5" /> Parent Login
            </button>
            {kids.map(kid => (
              <button
                key={kid.id}
                onClick={() => { setLoginView('kid'); setSelectedKid(kid.id) }}
                className={`w-full bg-gradient-to-r ${THEMES[kid.theme].primary} text-white py-4 rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2`}
              >
                <User className="w-5 h-5" /> {kid.name} ({kid.age})
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Login: Parent
  if (!currentUser && loginView === 'parent') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 p-4 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-6 text-center">Parent Login</h2>
          <input
            type="password"
            placeholder="Password"
            value={parentPassword}
            onChange={(e) => setParentPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleParentLogin()}
            className="w-full p-4 border-2 border-gray-300 rounded-xl mb-4 focus:border-blue-500 focus:outline-none"
          />
          <div className="flex gap-3">
            <button onClick={handleParentLogin} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700">
              Login
            </button>
            <button onClick={() => setLoginView('select')} className="flex-1 bg-gray-200 py-3 rounded-xl font-semibold hover:bg-gray-300">
              Back
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">Password: admin123</p>
        </div>
      </div>
    )
  }

  // Login: Kid
  if (!currentUser && loginView === 'kid') {
    const kid = kids.find(k => k.id === selectedKid)
    const theme = THEMES[kid?.theme] || THEMES.purple
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.primary} p-4 flex items-center justify-center`}>
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-6 text-center">Hi {kid?.name}! 👋</h2>
          <p className="text-center mb-4 text-gray-600">Enter your PIN</p>
          <input
            type="password"
            inputMode="numeric"
            placeholder="PIN"
            value={kidPin}
            onChange={(e) => setKidPin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleKidLogin()}
            className="w-full p-4 border-2 border-gray-300 rounded-xl mb-4 text-center text-2xl focus:border-purple-500 focus:outline-none"
            maxLength={4}
          />
          <div className="flex gap-3">
            <button onClick={handleKidLogin} className={`flex-1 bg-gradient-to-r ${theme.primary} text-white py-3 rounded-xl font-semibold`}>
              Login
            </button>
            <button onClick={() => setLoginView('select')} className="flex-1 bg-gray-200 py-3 rounded-xl font-semibold hover:bg-gray-300">
              Back
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">Sophia: 1313, Ella: 0909</p>
        </div>
      </div>
    )
  }

  // ============ PARENT DASHBOARD ============
  if (currentUser?.type === 'parent') {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        {/* Task Modal */}
        {showTaskModal && (
          <TaskModal
            task={editingTask}
            kids={kids}
            onSave={saveTask}
            onClose={() => { setShowTaskModal(false); setEditingTask(null) }}
          />
        )}

        {/* Goal Modal */}
        {showGoalModal && (
          <GoalModal
            kid={kids.find(k => k.id === showGoalModal)}
            onSave={updateKidGoal}
            onClose={() => setShowGoalModal(null)}
          />
        )}

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <h1 className="text-2xl font-bold">Parent Dashboard</h1>
              <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-600">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {[
                { id: 'dashboard', label: '📊 Dashboard' },
                { id: 'tasks', label: '📋 Tasks' },
                { id: 'goals', label: '🎯 Goals' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAdminTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
                    adminTab === tab.id ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Dashboard Tab */}
            {adminTab === 'dashboard' && (
              <div className="grid md:grid-cols-2 gap-6">
                {kids.map(kid => {
                  const levelInfo = getLevelInfo(kid.lifetimePoints)
                  const theme = THEMES[kid.theme] || THEMES.purple
                  const kidTasks = tasks.filter(t => t.assignedTo.includes(kid.id))
                  const completedToday = kidTasks.filter(t => kid.completedToday.includes(t.id)).length
                  const prizeProgress = Math.round((kid.points / kid.prize.pointsNeeded) * 100)

                  return (
                    <div key={kid.id} className="border-2 rounded-xl p-6 bg-gradient-to-br from-purple-50 to-white">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold">{kid.name}</h3>
                          <div className="flex items-center gap-2 mt-1 text-purple-600">
                            <Crown className="w-4 h-4" />
                            <span className="text-sm font-semibold">Level {levelInfo.level}</span>
                          </div>
                        </div>
                        <span className="text-3xl">🏆</span>
                      </div>

                      <div className="mb-4">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${theme.primary}`} style={{ width: `${levelInfo.progress}%` }} />
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Today:</span>
                          <span className="font-bold">{completedToday}/{kidTasks.length} tasks</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Points:</span>
                          <span className="font-bold text-lg text-purple-600">{kid.points}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Streak:</span>
                          <span className="font-bold flex items-center gap-1 text-orange-500">
                            🔥 {kid.streak} days
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Books:</span>
                          <span className="font-bold">{kid.readingLog.filter(b => b.completed).length} finished</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Garden:</span>
                          <span className="font-bold">{kid.garden.plots.filter(p => p.plant).length} plants</span>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-semibold">🎁 {kid.prize.name}</span>
                          <span className="text-sm font-bold">{Math.min(prizeProgress, 100)}%</span>
                        </div>
                        <div className="h-2 bg-white rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-400" style={{ width: `${Math.min(prizeProgress, 100)}%` }} />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{kid.points}/{kid.prize.pointsNeeded} points</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Tasks Tab */}
            {adminTab === 'tasks' && (
              <div>
                <button
                  onClick={() => { setEditingTask(null); setShowTaskModal(true) }}
                  className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 mb-4 hover:bg-green-600"
                >
                  <Plus className="w-5 h-5" /> Add New Task
                </button>

                <div className="space-y-3">
                  {tasks.map(task => (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border-2 ${task.category === 'learning' ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold">{task.title}</h4>
                            <span className="text-purple-600 font-bold">+{task.points}</span>
                            {task.category === 'learning' && (
                              <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">
                                {SUBJECTS[task.subject]?.emoji} {SUBJECTS[task.subject]?.name}
                              </span>
                            )}
                            {task.teachBackBonus && (
                              <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                                🎓 Teach Back
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Assigned to: {task.assignedTo.map(id => kids.find(k => k.id === id)?.name).join(', ')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setEditingTask(task); setShowTaskModal(true) }}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-2 hover:bg-red-100 rounded-lg text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                  <h4 className="font-bold mb-2">💡 Tips</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>Learning tasks</strong> earn XP in skill trees</li>
                    <li>• <strong>Teach Back</strong> gives +50% points when kids explain what they learned</li>
                    <li>• Assign tasks to specific kids or both</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Goals Tab */}
            {adminTab === 'goals' && (
              <div className="space-y-4">
                {kids.map(kid => {
                  const prizeProgress = Math.round((kid.points / kid.prize.pointsNeeded) * 100)
                  return (
                    <div key={kid.id} className="p-4 border-2 rounded-xl">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-bold">{kid.name}'s Goal</h3>
                        <button
                          onClick={() => setShowGoalModal(kid.id)}
                          className="bg-purple-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-purple-600"
                        >
                          <Edit2 className="w-4 h-4" /> Change Goal
                        </button>
                      </div>

                      <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-lg font-bold">🎁 {kid.prize.name}</span>
                          <span className="font-bold text-purple-600">{kid.prize.pointsNeeded} pts</span>
                        </div>
                        <div className="h-3 bg-white rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${Math.min(prizeProgress, 100)}%` }} />
                        </div>
                        <div className="flex justify-between mt-2 text-sm">
                          <span>Current: {kid.points} pts</span>
                          <span>{kid.prize.pointsNeeded - kid.points > 0 ? `${kid.prize.pointsNeeded - kid.points} to go` : '✅ Ready!'}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}

                <div className="mt-4 p-4 bg-yellow-50 rounded-xl">
                  <h4 className="font-bold mb-2">🎯 Goal Ideas</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {PRIZE_OPTIONS.map(prize => (
                      <div key={prize.name} className="flex justify-between">
                        <span>{prize.name}</span>
                        <span className="font-bold text-purple-600">{prize.points} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ============ KID VIEW ============
  const kid = currentUser.data
  const theme = THEMES[kid.theme] || THEMES.purple
  const todaysTasks = tasks.filter(t => t.assignedTo.includes(kid.id))
  const choreTasks = todaysTasks.filter(t => t.category !== 'learning')
  const learningTasks = todaysTasks.filter(t => t.category === 'learning')
  const progressPercent = (kid.points / kid.prize.pointsNeeded) * 100
  const levelInfo = getLevelInfo(kid.lifetimePoints)

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.primary} p-4`}>
      {/* Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-3xl p-8 text-center animate-bounceIn">
            <Trophy className="w-24 h-24 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-3xl font-bold mb-2">🎉 Amazing! 🎉</h2>
            <p className="text-xl">All tasks complete!</p>
          </div>
        </div>
      )}

      {/* Redemption Modal */}
      {showRedemption && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full">
            <div className="text-center mb-6">
              <Gift className="w-16 h-16 mx-auto text-purple-500 mb-4" />
              <h2 className="text-2xl font-bold">Redeem Prize</h2>
            </div>
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-lg mb-2">🎁 {kid.prize.name}</h3>
              <p className="text-gray-600">Cost: {kid.prize.pointsNeeded} points</p>
              <p className="text-gray-600">Your points: {kid.points}</p>
            </div>
            {kid.points >= kid.prize.pointsNeeded ? (
              <div className="flex gap-3">
                <button onClick={redeemPrize} className="flex-1 bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600">
                  🎉 Claim!
                </button>
                <button onClick={() => setShowRedemption(false)} className="flex-1 bg-gray-200 py-3 rounded-xl font-semibold hover:bg-gray-300">
                  Later
                </button>
              </div>
            ) : (
              <div>
                <p className="text-orange-600 text-center mb-4 font-semibold">
                  🔒 Need {kid.prize.pointsNeeded - kid.points} more points
                </p>
                <button onClick={() => setShowRedemption(false)} className="w-full bg-gray-200 py-3 rounded-xl font-semibold hover:bg-gray-300">
                  Keep Working!
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Teach Back Modal */}
      {teachBackModal && (
        <TeachBackModal
          task={teachBackModal.task}
          onSuccess={() => {
            toggleTaskComplete(teachBackModal.task.id, true)
            setTeachBackModal(null)
          }}
          onClose={() => setTeachBackModal(null)}
        />
      )}

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">Hi {kid.name}! 👋</h1>
              <div className="flex items-center gap-2 mt-1 text-purple-600">
                <Crown className="w-5 h-5" />
                <span className="font-semibold">Level {levelInfo.level}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
              </button>
              <button onClick={logout} className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Level Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Level {levelInfo.level}</span>
              <span>{kid.lifetimePoints} / {levelInfo.nextThreshold} XP</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${theme.primary}`} style={{ width: `${levelInfo.progress}%` }} />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 hide-scrollbar">
            {[
              { id: 'tasks', icon: Target, label: 'Tasks' },
              { id: 'learning', icon: GraduationCap, label: 'Learning' },
              { id: 'reading', icon: Book, label: 'Reading' },
              { id: 'garden', icon: Flower2, label: 'Garden' },
              { id: 'settings', icon: Palette, label: 'Me' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setKidView(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition whitespace-nowrap text-sm ${
                  kidView === tab.id ? `bg-gradient-to-r ${theme.primary} text-white` : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          {/* TASKS VIEW */}
          {kidView === 'tasks' && (
            <div>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-yellow-100 rounded-xl p-3 text-center">
                  <Star className="w-6 h-6 mx-auto text-yellow-600 mb-1" />
                  <p className="text-xl font-bold">{kid.points}</p>
                  <p className="text-xs text-gray-600">Points</p>
                </div>
                <div className="bg-orange-100 rounded-xl p-3 text-center">
                  <Flame className="w-6 h-6 mx-auto text-orange-600 mb-1" />
                  <p className="text-xl font-bold">{kid.streak}</p>
                  <p className="text-xs text-gray-600">Streak</p>
                </div>
                <div className="bg-purple-100 rounded-xl p-3 text-center">
                  <Award className="w-6 h-6 mx-auto text-purple-600 mb-1" />
                  <p className="text-xl font-bold">{kid.totalCompleted}</p>
                  <p className="text-xs text-gray-600">Done</p>
                </div>
              </div>

              {/* Prize Progress */}
              <div
                onClick={() => setShowRedemption(true)}
                className={`bg-gradient-to-r ${theme.primary} rounded-xl p-4 mb-4 text-white cursor-pointer hover:opacity-95 transition`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-bold">Your Goal</h3>
                    <p className="text-lg font-bold mt-1">🎁 {kid.prize.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-90">Points</p>
                    <span className="font-bold text-xl">{kid.points}/{kid.prize.pointsNeeded}</span>
                  </div>
                </div>
                <div className="bg-white bg-opacity-30 rounded-full h-3 overflow-hidden">
                  <div className="bg-white h-full rounded-full transition-all" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
                </div>
                <p className="text-sm mt-2 opacity-90">
                  {kid.prize.pointsNeeded - kid.points > 0 ? `${kid.prize.pointsNeeded - kid.points} points to go!` : '🎉 Tap to claim!'}
                </p>
              </div>

              {/* Chore Tasks */}
              <div className="space-y-3 mb-4">
                <h3 className="font-bold text-sm text-gray-500 uppercase">🧹 Chores</h3>
                {choreTasks.map(task => {
                  const isComplete = kid.completedToday.includes(task.id)
                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleTaskComplete(task.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                        isComplete ? 'bg-green-100 border-green-500' : 'bg-white border-gray-200 hover:border-purple-400'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                            isComplete ? 'bg-green-500 border-green-500' : 'border-gray-400'
                          }`}>
                            {isComplete && <Check className="w-4 h-4 text-white" />}
                          </div>
                          <span className={`font-semibold ${isComplete ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                          </span>
                        </div>
                        <span className="font-bold text-purple-600">+{task.points}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Leaderboard */}
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" /> Leaderboard
                </h3>
                <div className="space-y-2">
                  {[...kids].sort((a, b) => b.points - a.points).map((k, index) => (
                    <div
                      key={k.id}
                      className={`flex justify-between items-center p-3 rounded-lg ${
                        k.id === kid.id ? 'bg-purple-200 font-bold' : 'bg-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-xl">{index === 0 ? '🥇' : '🥈'}</span> {k.name}
                      </span>
                      <span>{k.points} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LEARNING VIEW */}
          {kidView === 'learning' && (
            <div>
              {/* Math Tutor Button */}
              {LEARNING_RESOURCES[kid.id]?.mathTutor && (
                <a
                  href={LEARNING_RESOURCES[kid.id].mathTutor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block mb-4 p-4 bg-gradient-to-r ${theme.primary} rounded-xl text-white hover:opacity-90 transition transform hover:scale-[1.02]`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🤖</span>
                      <div>
                        <h4 className="font-bold text-lg">{LEARNING_RESOURCES[kid.id].mathTutor.name}</h4>
                        <p className="text-sm opacity-90">{LEARNING_RESOURCES[kid.id].mathTutor.description}</p>
                      </div>
                    </div>
                    <ExternalLink className="w-5 h-5" />
                  </div>
                </a>
              )}

              <h3 className="font-bold flex items-center gap-2 mb-3">
                <GraduationCap className="w-5 h-5" /> Skill Trees
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {Object.entries(SUBJECTS).map(([key, subject]) => {
                  const xp = kid.subjectXP[key] || 0
                  const level = getSkillLevel(xp)
                  return (
                    <div key={key} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{level.icon}</span>
                        <div>
                          <span className="font-semibold text-sm">{subject.emoji} {subject.name}</span>
                          <p className="text-xs text-gray-600">{level.name}</p>
                        </div>
                      </div>
                      <div className="h-2 bg-white rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 transition-all" style={{ width: `${level.progress}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{xp} / {level.nextLevel?.xpRequired || 'MAX'} XP</p>
                    </div>
                  )
                })}
              </div>

              <h3 className="font-bold text-sm text-gray-500 uppercase mb-3">📚 Learning Tasks</h3>
              {learningTasks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No learning tasks assigned!</p>
              ) : (
                learningTasks.map(task => {
                  const isComplete = kid.completedToday.includes(task.id)
                  const subject = SUBJECTS[task.subject]
                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border-2 mb-3 ${
                        isComplete ? 'bg-green-100 border-green-500' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isComplete ? 'bg-green-500 border-green-500' : 'border-gray-400'
                          }`}>
                            {isComplete && <Check className="w-4 h-4 text-white" />}
                          </div>
                          <div>
                            <span className={`font-semibold ${isComplete ? 'line-through text-gray-500' : ''}`}>
                              {task.title}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-2">
                              {subject?.emoji} {subject?.name}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-purple-600">+{task.points}</span>
                      </div>
                      {!isComplete && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => toggleTaskComplete(task.id, false)}
                            className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold text-sm hover:bg-green-600"
                          >
                            ✓ Done
                          </button>
                          {task.teachBackBonus && (
                            <button
                              onClick={() => setTeachBackModal({ task })}
                              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg font-semibold text-sm hover:opacity-90"
                            >
                              🎓 Teach Back (+50%)
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* READING VIEW */}
          {kidView === 'reading' && (
            <div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-green-100 rounded-xl p-3 text-center">
                  <BookOpen className="w-6 h-6 mx-auto text-green-600 mb-1" />
                  <p className="text-xl font-bold">{kid.readingLog.filter(b => b.completed).length}</p>
                  <p className="text-xs text-gray-600">Books</p>
                </div>
                <div className="bg-blue-100 rounded-xl p-3 text-center">
                  <Book className="w-6 h-6 mx-auto text-blue-600 mb-1" />
                  <p className="text-xl font-bold">{kid.readingLog.reduce((sum, b) => sum + b.pagesRead, 0)}</p>
                  <p className="text-xs text-gray-600">Pages</p>
                </div>
                <div className="bg-orange-100 rounded-xl p-3 text-center">
                  <Flame className="w-6 h-6 mx-auto text-orange-600 mb-1" />
                  <p className="text-xl font-bold">{kid.readingStreak}</p>
                  <p className="text-xs text-gray-600">Streak</p>
                </div>
              </div>

              <button
                onClick={() => {
                  const title = prompt('Book title:')
                  if (title) {
                    const pages = parseInt(prompt('Total pages:', '100')) || 100
                    addBook(title, pages)
                  }
                }}
                className={`w-full bg-gradient-to-r ${theme.primary} text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 mb-4 hover:opacity-90`}
              >
                <PlusCircle className="w-5 h-5" /> Add New Book
              </button>

              <h4 className="font-semibold mb-2">📚 Currently Reading</h4>
              {kid.readingLog.filter(b => !b.completed).length === 0 ? (
                <p className="text-gray-500 text-center py-4">No books yet! Add one above.</p>
              ) : (
                kid.readingLog.filter(b => !b.completed).map(book => {
                  const progress = (book.pagesRead / book.totalPages) * 100
                  return (
                    <div key={book.id} className="bg-white rounded-xl p-4 border mb-2">
                      <div className="flex justify-between items-center">
                        <h5 className="font-semibold">{book.title}</h5>
                        <span className="font-bold">{book.pagesRead}/{book.totalPages}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {[5, 10, 20, 50].map(pages => (
                          <button
                            key={pages}
                            onClick={() => updateBookProgress(book.id, pages)}
                            className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold hover:bg-green-200"
                          >
                            +{pages}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}

              {kid.readingLog.filter(b => b.completed).length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">✅ Completed</h4>
                  {kid.readingLog.filter(b => b.completed).map(book => (
                    <div key={book.id} className="bg-green-50 rounded-lg p-3 flex justify-between items-center mb-2">
                      <span className="font-semibold">{book.title}</span>
                      <span className="text-2xl">📗</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* GARDEN VIEW */}
          {kidView === 'garden' && (() => {
            const unlockedPlots = getUnlockedPlots(levelInfo.level)
            const nextUnlockLevel = unlockedPlots < 8 ? levelInfo.level + 1 : null

            return (
            <div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-green-100 rounded-xl p-3 text-center">
                  <Leaf className="w-6 h-6 mx-auto text-green-600 mb-1" />
                  <p className="text-xl font-bold">{kid.garden.plots.filter(p => p.plant).length}</p>
                  <p className="text-xs text-gray-600">Growing</p>
                </div>
                <div className="bg-blue-100 rounded-xl p-3 text-center">
                  <Lock className="w-6 h-6 mx-auto text-blue-600 mb-1" />
                  <p className="text-xl font-bold">{unlockedPlots}/8</p>
                  <p className="text-xs text-gray-600">Unlocked</p>
                </div>
                <div className="bg-purple-100 rounded-xl p-3 text-center">
                  <Sparkles className="w-6 h-6 mx-auto text-purple-600 mb-1" />
                  <p className="text-xl font-bold">{kid.garden.harvestHistory.length}</p>
                  <p className="text-xs text-gray-600">Harvested</p>
                </div>
              </div>

              {nextUnlockLevel && (
                <div className="bg-blue-50 rounded-xl p-3 mb-4 text-center">
                  <p className="text-sm text-blue-700">
                    🔓 Reach <span className="font-bold">Level {nextUnlockLevel}</span> to unlock the next garden plot!
                  </p>
                </div>
              )}

              <div className="bg-gradient-to-b from-green-200 to-green-300 rounded-2xl p-4 mb-4">
                <div className="grid grid-cols-4 gap-2">
                  {kid.garden.plots.map((plot, index) => {
                    const isUnlocked = index < unlockedPlots
                    const plantDisplay = plot.plant
                      ? (plot.stage >= 4 ? PLANT_TYPES[plot.plant]?.emoji : GROWTH_STAGES[plot.stage])
                      : isUnlocked ? '🟫' : '🔒'
                    const canHarvest = plot.plant && plot.stage >= 4

                    return (
                      <div
                        key={index}
                        onClick={() => {
                          if (!isUnlocked) return // Can't interact with locked plots
                          if (!plot.plant) {
                            const choice = prompt('Choose plant:\n1. Sunflower 🌻 (25pts)\n2. Tulip 🌷 (15pts)\n3. Rose 🌹 (35pts)\n4. Knowledge Bloom 📚 (30pts)', '1')
                            const plants = ['sunflower', 'tulip', 'rose', 'bookFlower']
                            const selected = plants[parseInt(choice) - 1]
                            if (selected) plantInGarden(index, selected)
                          } else if (canHarvest) {
                            harvestPlant(index)
                          } else {
                            waterPlant(index)
                          }
                        }}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center transition transform ${
                          !isUnlocked
                            ? 'bg-gray-300 opacity-60 cursor-not-allowed'
                            : plot.plant
                              ? 'bg-green-100 cursor-pointer hover:scale-105'
                              : 'bg-amber-100 hover:bg-amber-200 cursor-pointer hover:scale-105'
                        }`}
                      >
                        <span className="text-3xl">{plantDisplay}</span>
                        {plot.plant && isUnlocked && (
                          <div className="flex gap-1 mt-1">
                            <Droplets className="w-3 h-3 text-blue-500" />
                            {canHarvest && <Sparkles className="w-3 h-3 text-yellow-500" />}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-center gap-4 mt-3 text-xs text-gray-700">
                  <span>💧 Tap to water</span>
                  <span>✨ Ready to harvest!</span>
                </div>
              </div>

              {kid.garden.harvestHistory.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">🌾 Recent Harvests</h4>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {kid.garden.harvestHistory.slice(-5).reverse().map((harvest, i) => (
                      <div key={i} className="bg-yellow-50 rounded-lg p-2 text-center min-w-[64px] flex-shrink-0">
                        <span className="text-xl">{PLANT_TYPES[harvest.plant]?.emoji || '🌱'}</span>
                        <p className="text-xs font-semibold">+{harvest.points}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            )
          })()}

          {/* SETTINGS VIEW */}
          {kidView === 'settings' && (
            <div>
              <h3 className="font-bold mb-4">Choose Your Theme</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {Object.entries(THEMES).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => updateKidTheme(key)}
                    className={`p-4 rounded-xl bg-gradient-to-r ${t.primary} text-white font-semibold capitalize transition ${
                      kid.theme === key ? 'ring-4 ring-offset-2 ring-gray-400' : 'hover:opacity-90'
                    }`}
                  >
                    {t.name} {kid.theme === key && '✓'}
                  </button>
                ))}
              </div>

              <h3 className="font-bold mb-3">Your Stats</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Tasks:</span>
                  <span className="font-bold">{kid.totalCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lifetime Points:</span>
                  <span className="font-bold">{kid.lifetimePoints}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Best Streak:</span>
                  <span className="font-bold">{kid.bestStreak} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Books Finished:</span>
                  <span className="font-bold">{kid.readingLog.filter(b => b.completed).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Plants Harvested:</span>
                  <span className="font-bold">{kid.garden.harvestHistory.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============ MODALS ============

function TaskModal({ task, kids, onSave, onClose }) {
  const [formData, setFormData] = useState(task || {
    title: '',
    points: 10,
    category: 'chore',
    subject: 'math',
    assignedTo: [],
    teachBackBonus: false
  })

  const toggleKid = (kidId) => {
    if (formData.assignedTo.includes(kidId)) {
      setFormData({ ...formData, assignedTo: formData.assignedTo.filter(id => id !== kidId) })
    } else {
      setFormData({ ...formData, assignedTo: [...formData.assignedTo, kidId] })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Task Name</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-3 border-2 rounded-xl focus:border-purple-500 focus:outline-none"
              placeholder="e.g., Make bed"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Points</label>
            <input
              type="number"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
              className="w-full p-3 border-2 rounded-xl focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Category</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormData({ ...formData, category: 'chore' })}
                className={`flex-1 py-2 rounded-xl font-semibold transition ${
                  formData.category === 'chore' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                🧹 Chore
              </button>
              <button
                onClick={() => setFormData({ ...formData, category: 'learning' })}
                className={`flex-1 py-2 rounded-xl font-semibold transition ${
                  formData.category === 'learning' ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                📚 Learning
              </button>
            </div>
          </div>

          {formData.category === 'learning' && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-1">Subject</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full p-3 border-2 rounded-xl focus:border-purple-500 focus:outline-none"
                >
                  {Object.entries(SUBJECTS).map(([key, sub]) => (
                    <option key={key} value={key}>{sub.emoji} {sub.name}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.teachBackBonus}
                  onChange={(e) => setFormData({ ...formData, teachBackBonus: e.target.checked })}
                  className="w-5 h-5"
                />
                <div>
                  <span className="font-semibold">Teach Back Bonus</span>
                  <p className="text-sm text-gray-600">+50% points if kid explains what they learned</p>
                </div>
              </label>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">Assign To</label>
            <div className="space-y-2">
              {kids.map(kid => (
                <button
                  key={kid.id}
                  onClick={() => toggleKid(kid.id)}
                  className={`w-full p-3 rounded-xl flex items-center justify-between transition ${
                    formData.assignedTo.includes(kid.id)
                      ? 'bg-green-100 border-2 border-green-500'
                      : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-semibold">{kid.name}</span>
                  {formData.assignedTo.includes(kid.id) && <Check className="w-5 h-5 text-green-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-semibold bg-gray-200 hover:bg-gray-300">
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            disabled={!formData.title || formData.assignedTo.length === 0}
            className="flex-1 py-3 rounded-xl font-semibold bg-blue-500 text-white disabled:opacity-50 hover:bg-blue-600"
          >
            Save Task
          </button>
        </div>
      </div>
    </div>
  )
}

function GoalModal({ kid, onSave, onClose }) {
  const [selectedPrize, setSelectedPrize] = useState(kid?.prize?.name || PRIZE_OPTIONS[0].name)
  const [customPoints, setCustomPoints] = useState(kid?.prize?.pointsNeeded || 100)

  useEffect(() => {
    const preset = PRIZE_OPTIONS.find(p => p.name === selectedPrize)
    if (preset) setCustomPoints(preset.points)
  }, [selectedPrize])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Set Goal for {kid?.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 mb-4 max-h-[40vh] overflow-y-auto">
          {PRIZE_OPTIONS.map(prize => (
            <button
              key={prize.name}
              onClick={() => setSelectedPrize(prize.name)}
              className={`w-full p-3 rounded-xl text-left flex justify-between items-center transition ${
                selectedPrize === prize.name
                  ? 'bg-purple-100 border-2 border-purple-500'
                  : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="font-semibold">🎁 {prize.name}</span>
              <span className="text-purple-600 font-bold">{prize.points} pts</span>
            </button>
          ))}
        </div>

        <div className="bg-yellow-50 rounded-xl p-4 mb-4">
          <label className="block text-sm font-semibold mb-2">Custom Points (adjust if needed)</label>
          <input
            type="number"
            value={customPoints}
            onChange={(e) => setCustomPoints(parseInt(e.target.value) || 0)}
            className="w-full p-3 border-2 rounded-xl focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-semibold bg-gray-200 hover:bg-gray-300">
            Cancel
          </button>
          <button
            onClick={() => onSave(kid.id, selectedPrize, customPoints)}
            className="flex-1 py-3 rounded-xl font-semibold bg-purple-500 text-white hover:bg-purple-600"
          >
            Set Goal
          </button>
        </div>
      </div>
    </div>
  )
}

function TeachBackModal({ task, onSuccess, onClose }) {
  const [explanation, setExplanation] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null) // { passed, feedback, score }

  const handleSubmit = async () => {
    if (!explanation.trim() || explanation.trim().length < 10) {
      setResult({ passed: false, feedback: "Please write a bit more about what you learned! Try to explain it like you're teaching a friend." })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/evaluate-teachback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          explanation: explanation.trim(),
          taskTitle: task.title,
          subject: task.subject
        })
      })

      if (!response.ok) {
        throw new Error('Failed to evaluate')
      }

      const data = await response.json()
      setResult(data)

      if (data.passed) {
        // Auto-close after showing success for a moment
        setTimeout(() => {
          onSuccess()
        }, 2000)
      }
    } catch (error) {
      console.error('Error evaluating teach back:', error)
      setResult({
        passed: false,
        feedback: "Oops! Something went wrong. Let's try again or just click 'Done' for regular points."
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">🎓 Teach Back Time!</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-purple-50 rounded-xl p-4 mb-4">
          <p className="font-semibold text-purple-800">Task: {task.title}</p>
          <p className="text-sm text-purple-600 mt-1">
            Explain what you learned like you're teaching it to someone else!
          </p>
        </div>

        {!result?.passed && (
          <>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="I learned that... The most important thing is... For example..."
              className="w-full p-4 border-2 rounded-xl focus:border-purple-500 focus:outline-none resize-none h-32 mb-4"
              disabled={isLoading}
            />

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-semibold bg-gray-200 hover:bg-gray-300"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading || !explanation.trim()}
                className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin">⏳</span> Checking...
                  </>
                ) : (
                  '✨ Submit'
                )}
              </button>
            </div>
          </>
        )}

        {result && (
          <div className={`rounded-xl p-4 ${result.passed ? 'bg-green-100' : 'bg-orange-100'}`}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{result.passed ? '🎉' : '💭'}</span>
              <h3 className={`font-bold text-lg ${result.passed ? 'text-green-800' : 'text-orange-800'}`}>
                {result.passed ? 'Great Job!' : 'Almost There!'}
              </h3>
            </div>
            <p className={result.passed ? 'text-green-700' : 'text-orange-700'}>
              {result.feedback}
            </p>
            {result.passed && result.score && (
              <p className="text-green-600 text-sm mt-2">
                Understanding Score: {result.score}/10 ⭐
              </p>
            )}
            {!result.passed && (
              <button
                onClick={() => setResult(null)}
                className="mt-3 w-full py-2 rounded-lg font-semibold bg-orange-200 hover:bg-orange-300 text-orange-800"
              >
                Try Again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
