// Dashboard functionality
let userProfile = null
const userStats = {
  totalProducts: 0,
  totalOrders: 0,
  totalEarnings: 0,
  completedLessons: 0,
}

const supabase = {} // Declare supabase variable here
const currentLanguage = "en" // Declare currentLanguage variable here

document.addEventListener("DOMContentLoaded", () => {
  initializeDashboard()
})

async function initializeDashboard() {
  try {
    await loadUserProfile()
    await loadUserStats()
    renderDashboard()
  } catch (error) {
    console.error("Error initializing dashboard:", error)
    // Redirect to login if there's an auth error
    window.location.href = "login.html"
  }
}

async function loadUserProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("No authenticated user")
  }

  // Fetch user profile
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (error) {
    throw error
  }

  userProfile = profile
}

async function loadUserStats() {
  if (!userProfile) return

  try {
    if (userProfile.role === "farmer") {
      // Load farmer stats
      const { data: products } = await supabase.from("products").select("*").eq("farmer_id", userProfile.id)

      const { data: orders } = await supabase.from("orders").select("*").eq("farmer_id", userProfile.id)

      userStats.totalProducts = products?.length || 0
      userStats.totalOrders = orders?.length || 0
      userStats.totalEarnings = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
    } else if (userProfile.role === "buyer") {
      // Load buyer stats
      const { data: orders } = await supabase.from("orders").select("*").eq("buyer_id", userProfile.id)

      userStats.totalOrders = orders?.length || 0
    }

    // Load learning progress for all users
    const { data: progress } = await supabase
      .from("learning_progress")
      .select("*")
      .eq("user_id", userProfile.id)
      .eq("status", "completed")

    userStats.completedLessons = progress?.length || 0
  } catch (error) {
    console.error("Error loading user stats:", error)
  }
}

function renderDashboard() {
  if (!userProfile) return

  // Update user info
  document.getElementById("user-name").textContent = userProfile.full_name
  document.getElementById("user-district").textContent = userProfile.district
  document.getElementById("user-role-badge").textContent = userProfile.role

  // Update avatar
  const avatar = document.getElementById("user-avatar")
  avatar.textContent = userProfile.full_name.charAt(0).toUpperCase()

  // Show farm location for farmers
  if (userProfile.role === "farmer" && userProfile.farm_location) {
    document.getElementById("farm-location-info").style.display = "flex"
    document.getElementById("user-farm-location").textContent = userProfile.farm_location
  }

  // Render stats
  renderStats()

  // Render quick actions
  renderQuickActions()
}

function renderStats() {
  const statsGrid = document.getElementById("stats-grid")
  const stats = getStatsForRole(userProfile.role)

  statsGrid.innerHTML = stats
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

function getStatsForRole(role) {
  const baseStats = [
    {
      icon: "fas fa-book-open",
      label: currentLanguage === "en" ? "Completed Lessons" : "Amasomo Yarangije",
      value: userStats.completedLessons,
      color: "text-purple-600",
    },
  ]

  if (role === "farmer") {
    return [
      {
        icon: "fas fa-box",
        label: currentLanguage === "en" ? "Total Products" : "Ibicuruzwa Byose",
        value: userStats.totalProducts,
        color: "text-green-600",
      },
      {
        icon: "fas fa-shopping-cart",
        label: currentLanguage === "en" ? "Total Orders" : "Ibicuruzwa Byose",
        value: userStats.totalOrders,
        color: "text-blue-600",
      },
      {
        icon: "fas fa-dollar-sign",
        label: currentLanguage === "en" ? "Total Earnings" : "Amafaranga Yose",
        value: `${userStats.totalEarnings.toLocaleString()} RWF`,
        color: "text-orange-600",
      },
      ...baseStats,
    ]
  } else if (role === "buyer") {
    return [
      {
        icon: "fas fa-shopping-cart",
        label: currentLanguage === "en" ? "Total Orders" : "Ibicuruzwa Byose",
        value: userStats.totalOrders,
        color: "text-blue-600",
      },
      ...baseStats,
    ]
  }

  return baseStats
}

function renderQuickActions() {
  const actionsGrid = document.getElementById("quick-actions-grid")
  const description = document.getElementById("quick-actions-description")
  const actions = getActionsForRole(userProfile.role)

  // Update description
  const descriptions = {
    farmer: currentLanguage === "en" ? "Manage your farm and products" : "Gucunga ubworozi n'ibicuruzwa byawe",
    buyer:
      currentLanguage === "en"
        ? "Find and purchase agricultural products"
        : "Shakisha no kugura ibicuruzwa by'ubuhinzi",
    trainer:
      currentLanguage === "en"
        ? "Manage educational content and track progress"
        : "Gucunga ibintu by'amahugurwa no gukurikirana iterambere",
  }

  description.textContent = descriptions[userProfile.role] || "Manage your activities"

  // Render actions
  actionsGrid.innerHTML = actions
    .map(
      (action) => `
        <a href="${action.href}" class="block">
            <div class="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors cursor-pointer">
                <div class="flex items-center space-x-3">
                    <div class="p-2 rounded-lg ${action.color}">
                        <i class="${action.icon} text-white"></i>
                    </div>
                    <span class="font-medium">${action.label}</span>
                </div>
            </div>
        </a>
    `,
    )
    .join("")
}

function getActionsForRole(role) {
  const commonActions = [
    {
      icon: "fas fa-book-open",
      label: currentLanguage === "en" ? "Start Learning" : "Tangira Kwiga",
      href: "education.html",
      color: "bg-purple-600",
    },
  ]

  switch (role) {
    case "farmer":
      return [
        {
          icon: "fas fa-plus",
          label: currentLanguage === "en" ? "Add Product" : "Ongeraho Igicuruzwa",
          href: "#",
          color: "bg-green-600",
        },
        {
          icon: "fas fa-box",
          label: currentLanguage === "en" ? "View Orders" : "Reba Ibicuruzwa",
          href: "#",
          color: "bg-blue-600",
        },
        ...commonActions,
        {
          icon: "fas fa-chart-bar",
          label: "Analytics",
          href: "#",
          color: "bg-orange-600",
        },
      ]
    case "buyer":
      return [
        {
          icon: "fas fa-shopping-cart",
          label: currentLanguage === "en" ? "Browse Market" : "Shakisha mu Isoko",
          href: "marketplace.html",
          color: "bg-green-600",
        },
        {
          icon: "fas fa-box",
          label: currentLanguage === "en" ? "View Orders" : "Reba Ibicuruzwa",
          href: "#",
          color: "bg-blue-600",
        },
        ...commonActions,
        {
          icon: "fas fa-users",
          label: "Find Farmers",
          href: "#",
          color: "bg-indigo-600",
        },
      ]
    case "trainer":
      return [
        {
          icon: "fas fa-book-open",
          label: "Manage Content",
          href: "#",
          color: "bg-purple-600",
        },
        {
          icon: "fas fa-users",
          label: "View Students",
          href: "#",
          color: "bg-indigo-600",
        },
        {
          icon: "fas fa-chart-bar",
          label: "Progress Reports",
          href: "#",
          color: "bg-orange-600",
        },
        {
          icon: "fas fa-plus",
          label: "Add Lesson",
          href: "#",
          color: "bg-green-600",
        },
      ]
    default:
      return commonActions
  }
}
