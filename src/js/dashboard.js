// Dashboard functionality - Updated with brown/beige color scheme
let userProfile = null
const userStats = {
  totalProducts: 0,
  totalOrders: 0,
  totalEarnings: 0,
  completedLessons: 0,
}

// Declare the supabase variable
const supabase = null

// Get Supabase client from auth.js
const getSupabaseClient = () => {
  if (typeof supabase !== "undefined") {
    return supabase
  }
  // Fallback if supabase is not loaded
  console.error("Supabase client not available")
  return null
}

document.addEventListener("DOMContentLoaded", () => {
  // Wait a bit for supabase to be loaded
  setTimeout(() => {
    initializeDashboard()
  }, 100)
})

async function initializeDashboard() {
  try {
    const client = getSupabaseClient()
    if (!client) {
      throw new Error("Supabase client not available")
    }

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
  const client = getSupabaseClient()
  if (!client) return

  const {
    data: { user },
  } = await client.auth.getUser()

  if (!user) {
    throw new Error("No authenticated user")
  }

  // Fetch user profile
  const { data: profile, error } = await client.from("profiles").select("*").eq("id", user.id).single()

  if (error) {
    console.error("Profile fetch error:", error)
    // If profile doesn't exist, create a basic one
    if (error.code === "PGRST116") {
      const { data: newProfile, error: createError } = await client
        .from("profiles")
        .insert([
          {
            id: user.id,
            full_name: user.user_metadata?.full_name || "User",
            email: user.email,
            role: user.user_metadata?.role || "farmer",
            district: user.user_metadata?.district || "Unknown",
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (createError) {
        throw createError
      }
      userProfile = newProfile
    } else {
      throw error
    }
  } else {
    userProfile = profile
  }
}

async function loadUserStats() {
  if (!userProfile) return

  const client = getSupabaseClient()
  if (!client) return

  try {
    if (userProfile.role === "farmer") {
      // Load farmer stats
      const { data: products } = await client.from("products").select("*").eq("farmer_id", userProfile.id)
      const { data: orders } = await client.from("orders").select("*").eq("farmer_id", userProfile.id)

      userStats.totalProducts = products?.length || 0
      userStats.totalOrders = orders?.length || 0
      userStats.totalEarnings = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
    } else if (userProfile.role === "buyer") {
      // Load buyer stats
      const { data: orders } = await client.from("orders").select("*").eq("buyer_id", userProfile.id)
      userStats.totalOrders = orders?.length || 0
    }

    // Load learning progress for all users
    const { data: progress } = await client
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
  const userNameEl = document.getElementById("user-name")
  const userDistrictEl = document.getElementById("user-district")
  const userRoleBadgeEl = document.getElementById("user-role-badge")
  const userAvatarEl = document.getElementById("user-avatar")

  if (userNameEl) userNameEl.textContent = userProfile.full_name
  if (userDistrictEl) userDistrictEl.textContent = userProfile.district
  if (userRoleBadgeEl) userRoleBadgeEl.textContent = userProfile.role
  if (userAvatarEl) userAvatarEl.textContent = userProfile.full_name.charAt(0).toUpperCase()

  // Show farm location for farmers
  if (userProfile.role === "farmer" && userProfile.farm_location) {
    const farmLocationInfo = document.getElementById("farm-location-info")
    const userFarmLocation = document.getElementById("user-farm-location")
    if (farmLocationInfo) farmLocationInfo.style.display = "flex"
    if (userFarmLocation) userFarmLocation.textContent = userProfile.farm_location
  }

  // Render stats
  renderStats()

  // Render quick actions
  renderQuickActions()
}

function renderStats() {
  const statsGrid = document.getElementById("stats-grid")
  if (!statsGrid) return

  const stats = getStatsForRole(userProfile.role)

  statsGrid.innerHTML = stats
    .map(
      (stat) => `
        <div class="bg-white rounded-lg shadow-sm p-6 border border-stone-200">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-stone-600">${stat.label}</p>
                    <p class="text-2xl font-bold text-stone-900">${stat.value}</p>
                </div>
                <i class="${stat.icon} text-2xl ${stat.color}"></i>
            </div>
        </div>
    `,
    )
    .join("")
}

function getStatsForRole(role) {
  const currentLang = localStorage.getItem("agrilink-language") || "en"

  const baseStats = [
    {
      icon: "fas fa-book-open",
      label: currentLang === "en" ? "Completed Lessons" : "Amasomo Yarangije",
      value: userStats.completedLessons,
      color: "text-orange-700",
    },
  ]

  if (role === "farmer") {
    return [
      {
        icon: "fas fa-box",
        label: currentLang === "en" ? "Total Products" : "Ibicuruzwa Byose",
        value: userStats.totalProducts,
        color: "text-amber-700",
      },
      {
        icon: "fas fa-shopping-cart",
        label: currentLang === "en" ? "Total Orders" : "Ibicuruzwa Byose",
        value: userStats.totalOrders,
        color: "text-yellow-700",
      },
      {
        icon: "fas fa-dollar-sign",
        label: currentLang === "en" ? "Total Earnings" : "Amafaranga Yose",
        value: `${userStats.totalEarnings.toLocaleString()} RWF`,
        color: "text-stone-700",
      },
      ...baseStats,
    ]
  } else if (role === "buyer") {
    return [
      {
        icon: "fas fa-shopping-cart",
        label: currentLang === "en" ? "Total Orders" : "Ibicuruzwa Byose",
        value: userStats.totalOrders,
        color: "text-yellow-700",
      },
      ...baseStats,
    ]
  }

  return baseStats
}

function renderQuickActions() {
  const actionsGrid = document.getElementById("quick-actions-grid")
  const description = document.getElementById("quick-actions-description")

  if (!actionsGrid || !userProfile) return

  const actions = getActionsForRole(userProfile.role)
  const currentLang = localStorage.getItem("agrilink-language") || "en"

  // Update description
  const descriptions = {
    farmer: currentLang === "en" ? "Manage your farm and products" : "Gucunga ubworozi n'ibicuruzwa byawe",
    buyer:
      currentLang === "en" ? "Find and purchase agricultural products" : "Shakisha no kugura ibicuruzwa by'ubuhinzi",
    trainer:
      currentLang === "en"
        ? "Manage educational content and track progress"
        : "Gucunga ibintu by'amahugurwa no gukurikirana iterambere",
  }

  if (description) {
    description.textContent = descriptions[userProfile.role] || "Manage your activities"
  }

  // Render actions
  actionsGrid.innerHTML = actions
    .map(
      (action) => `
        <a href="${action.href}" class="block">
            <div class="bg-stone-50 hover:bg-stone-100 rounded-lg p-4 transition-colors cursor-pointer border border-stone-200">
                <div class="flex items-center space-x-3">
                    <div class="p-2 rounded-lg ${action.color}">
                        <i class="${action.icon} text-white"></i>
                    </div>
                    <span class="font-medium text-stone-900">${action.label}</span>
                </div>
            </div>
        </a>
    `,
    )
    .join("")
}

function getActionsForRole(role) {
  const currentLang = localStorage.getItem("agrilink-language") || "en"

  const commonActions = [
    {
      icon: "fas fa-book-open",
      label: currentLang === "en" ? "Start Learning" : "Tangira Kwiga",
      href: "education.html",
      color: "bg-orange-700",
    },
  ]

  switch (role) {
    case "farmer":
      return [
        {
          icon: "fas fa-plus",
          label: currentLang === "en" ? "Add Product" : "Ongeraho Igicuruzwa",
          href: "#",
          color: "bg-amber-700",
        },
        {
          icon: "fas fa-box",
          label: currentLang === "en" ? "View Orders" : "Reba Ibicuruzwa",
          href: "#",
          color: "bg-yellow-700",
        },
        ...commonActions,
        {
          icon: "fas fa-chart-bar",
          label: "Analytics",
          href: "#",
          color: "bg-stone-700",
        },
      ]
    case "buyer":
      return [
        {
          icon: "fas fa-shopping-cart",
          label: currentLang === "en" ? "Browse Market" : "Shakisha mu Isoko",
          href: "marketplace.html",
          color: "bg-amber-700",
        },
        {
          icon: "fas fa-box",
          label: currentLang === "en" ? "View Orders" : "Reba Ibicuruzwa",
          href: "#",
          color: "bg-yellow-700",
        },
        ...commonActions,
        {
          icon: "fas fa-users",
          label: "Find Farmers",
          href: "#",
          color: "bg-stone-700",
        },
      ]
    case "trainer":
      return [
        {
          icon: "fas fa-book-open",
          label: "Manage Content",
          href: "#",
          color: "bg-orange-700",
        },
        {
          icon: "fas fa-users",
          label: "View Students",
          href: "#",
          color: "bg-stone-700",
        },
        {
          icon: "fas fa-chart-bar",
          label: "Progress Reports",
          href: "#",
          color: "bg-yellow-700",
        },
        {
          icon: "fas fa-plus",
          label: "Add Lesson",
          href: "#",
          color: "bg-amber-700",
        },
      ]
    default:
      return commonActions
  }
}
