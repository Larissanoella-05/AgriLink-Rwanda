// Education portal functionality
let allContent = []
let userProgress = []
let activeTab = "all"
const currentLanguage = "en" // Declare currentLanguage variable
let supabase // Declare supabase variable

document.addEventListener("DOMContentLoaded", () => {
  initializeEducation()
})

async function initializeEducation() {
  try {
    await loadContent()
    await loadUserProgress()
    initializeTabs()
    renderProgressStats()
    renderContent()
  } catch (error) {
    console.error("Error initializing education portal:", error)
    showNoContentState()
  }
}

async function loadContent() {
  showElement("loading-state")
  hideElement("content-grid")
  hideElement("no-content-state")

  try {
    const { data, error } = await supabase
      .from("learning_content")
      .select(`
                *,
                profiles!learning_content_uploaded_by_fkey (
                    full_name
                )
            `)
      .eq("status", "published")
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    allContent =
      data?.map((item) => ({
        ...item,
        author_name: item.profiles?.full_name || "AgriLink Team",
      })) || []
  } catch (error) {
    console.error("Error loading content:", error)
    allContent = []
  } finally {
    hideElement("loading-state")
  }
}

async function loadUserProgress() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data, error } = await supabase.from("learning_progress").select("*").eq("user_id", user.id)

      if (!error && data) {
        userProgress = data
      }
    }
  } catch (error) {
    console.error("Error loading user progress:", error)
  }
}

function initializeTabs() {
  const tabButtons = document.querySelectorAll(".tab-button")

  tabButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const tab = e.target.getAttribute("data-tab")
      switchTab(tab)
    })
  })
}

function switchTab(tab) {
  activeTab = tab

  // Update tab buttons
  const tabButtons = document.querySelectorAll(".tab-button")
  tabButtons.forEach((button) => {
    if (button.getAttribute("data-tab") === tab) {
      button.className = "tab-button active py-4 px-1 border-b-2 border-green-500 font-medium text-sm text-green-600"
    } else {
      button.className =
        "tab-button py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300"
    }
  })

  // Show/hide content
  if (tab === "progress") {
    hideElement("content-grid")
    showElement("progress-content")
    renderProgressOverview()
  } else {
    hideElement("progress-content")
    renderContent()
  }
}

function renderProgressStats() {
  const statsContainer = document.getElementById("progress-stats")
  const completedLessons = userProgress.filter((p) => p.status === "completed").length
  const totalLessons = allContent.length
  const averageScore = 85 // This would be calculated from quiz results
  const certificatesEarned = 3 // This would come from certificates table

  const stats = [
    {
      icon: "fas fa-check-circle",
      label: currentLanguage === "en" ? "Completed Lessons" : "Amasomo Yarangije",
      value: completedLessons,
      color: "text-green-600",
    },
    {
      icon: "fas fa-book-open",
      label: currentLanguage === "en" ? "Total Lessons" : "Amasomo Yose",
      value: totalLessons,
      color: "text-blue-600",
    },
    {
      icon: "fas fa-chart-line",
      label: currentLanguage === "en" ? "Average Score" : "Amanota Rusange",
      value: `${averageScore}%`,
      color: "text-purple-600",
    },
    {
      icon: "fas fa-award",
      label: currentLanguage === "en" ? "Certificates Earned" : "Impamyabumenyi Zabonetse",
      value: certificatesEarned,
      color: "text-yellow-600",
    },
  ]

  statsContainer.innerHTML = stats
    .map(
      (stat) => `
        <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-600">${stat.label}</p>
                    <p class="text-2xl font-bold text-gray-900">${stat.value}</p>
                </div>
                <i class="${stat.icon} text-2xl ${stat.color}"></i>
            </div>
        </div>
    `,
    )
    .join("")
}

function renderContent() {
  const contentGrid = document.getElementById("content-grid")
  let filteredContent = allContent

  // Filter by tab
  if (activeTab !== "all") {
    filteredContent = allContent.filter((item) => item.type === activeTab)
  }

  if (filteredContent.length === 0) {
    showNoContentState()
    return
  }

  hideElement("no-content-state")
  showElement("content-grid")

  contentGrid.innerHTML = filteredContent
    .map((item) => {
      const progress = getProgressForContent(item.id)
      const icon = getContentIcon(item.type)

      return `
            <div class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center space-x-2">
                        <i class="${icon} text-gray-600"></i>
                        <span class="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full capitalize">
                            ${item.type}
                        </span>
                    </div>
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(item.difficulty)}">
                        ${getDifficultyText(item.difficulty)}
                    </span>
                </div>
                
                <h3 class="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">${item.title}</h3>
                <p class="text-gray-600 text-sm mb-4 line-clamp-3">${item.description}</p>
                
                <div class="space-y-4">
                    ${
                      progress
                        ? `
                        <div>
                            <div class="flex justify-between text-sm mb-2">
                                <span>Progress</span>
                                <span>${progress.progress_percentage}%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-green-600 h-2 rounded-full" style="width: ${progress.progress_percentage}%"></div>
                            </div>
                        </div>
                    `
                        : ""
                    }
                    
                    <div class="flex items-center justify-between text-sm text-gray-500">
                        <div class="flex items-center space-x-1">
                            <i class="fas fa-clock text-xs"></i>
                            <span>${item.duration} ${currentLanguage === "en" ? "minutes" : "iminota"}</span>
                        </div>
                        <div class="flex items-center space-x-1">
                            <i class="fas fa-user text-xs"></i>
                            <span>${item.author_name}</span>
                        </div>
                    </div>
                    
                    <button 
                        onclick="startContent('${item.id}')"
                        class="w-full px-4 py-2 ${progress?.status === "completed" ? "border border-gray-300 text-gray-700 hover:bg-gray-50" : "bg-green-600 text-white hover:bg-green-700"} rounded-lg font-medium transition-colors"
                    >
                        ${getButtonText(progress?.status)}
                    </button>
                </div>
            </div>
        `
    })
    .join("")
}

function renderProgressOverview() {
  const progressOverview = document.getElementById("progress-overview")
  const categories = [
    "Crop Production",
    "Soil Management",
    "Pest Control",
    "Climate Adaptation",
    "Post-Harvest",
    "Marketing",
    "Technology",
    "Livestock",
  ]

  const overallProgress =
    allContent.length > 0 ? (userProgress.filter((p) => p.status === "completed").length / allContent.length) * 100 : 0

  let progressHTML = `
        <div>
            <div class="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>${Math.round(overallProgress)}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3">
                <div class="bg-green-600 h-3 rounded-full" style="width: ${overallProgress}%"></div>
            </div>
        </div>
    `

  categories.forEach((category) => {
    const categoryContent = allContent.filter((c) => c.category === category)
    const categoryProgress = categoryContent.filter((c) => getProgressForContent(c.id)?.status === "completed")
    const percentage = categoryContent.length > 0 ? (categoryProgress.length / categoryContent.length) * 100 : 0

    progressHTML += `
            <div>
                <div class="flex justify-between text-sm mb-2">
                    <span>${category}</span>
                    <span>${Math.round(percentage)}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-green-600 h-2 rounded-full" style="width: ${percentage}%"></div>
                </div>
            </div>
        `
  })

  progressOverview.innerHTML = progressHTML
}

function showNoContentState() {
  hideElement("content-grid")
  showElement("no-content-state")
}

function getContentIcon(type) {
  switch (type) {
    case "video":
      return "fas fa-play-circle"
    case "quiz":
      return "fas fa-question-circle"
    default:
      return "fas fa-file-text"
  }
}

function getDifficultyColor(difficulty) {
  switch (difficulty) {
    case "beginner":
      return "bg-green-100 text-green-800"
    case "intermediate":
      return "bg-yellow-100 text-yellow-800"
    case "advanced":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

function getDifficultyText(difficulty) {
  const texts = {
    en: {
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced",
    },
    rw: {
      beginner: "Utangira",
      intermediate: "Hagati",
      advanced: "Rwihuse",
    },
  }

  return texts[currentLanguage][difficulty] || difficulty
}

function getProgressForContent(contentId) {
  return userProgress.find((p) => p.content_id === contentId)
}

function getButtonText(status) {
  if (status === "completed") {
    return `<i class="fas fa-check-circle mr-2"></i>${currentLanguage === "en" ? "Completed" : "Byarangiye"}`
  } else if (status === "in_progress") {
    return `<i class="fas fa-play mr-2"></i>${currentLanguage === "en" ? "Continue" : "Komeza"}`
  } else {
    return `<i class="fas fa-play mr-2"></i>${currentLanguage === "en" ? "Start Learning" : "Tangira Kwiga"}`
  }
}

function startContent(contentId) {
  // This would typically open the content or redirect to a learning page
  alert(currentLanguage === "en" ? "Learning content will open here!" : "Ibintu byo kwiga bizafungura hano!")
}

function showElement(elementId) {
  document.getElementById(elementId).style.display = "block"
}

function hideElement(elementId) {
  document.getElementById(elementId).style.display = "none"
}

// Initialize supabase
supabase = window.supabase // Assuming supabase is initialized globally
