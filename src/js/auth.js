// Supabase configuration - Updated for Netlify deployment
const SUPABASE_URL = "https://your-project-id.supabase.co" // Replace with your actual Supabase URL
const SUPABASE_ANON_KEY = "your-anon-key-here" // Replace with your actual Supabase anon key

// For production, you might want to use environment variables
// But since this is client-side JavaScript, the keys will be visible anyway
// Make sure to use the anon key (public key) not the service key

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Authentication functions
document.addEventListener("DOMContentLoaded", () => {
  initializeAuth()
})

function initializeAuth() {
  // Check if user is already logged in
  checkAuthState()

  // Initialize login form
  const loginForm = document.getElementById("login-form")
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin)
    initializePasswordToggle("toggle-password", "password")
  }

  // Initialize signup form
  const signupForm = document.getElementById("signup-form")
  if (signupForm) {
    signupForm.addEventListener("submit", handleSignup)
    initializePasswordToggle("toggle-password", "password")
    initializePasswordToggle("toggle-confirm-password", "confirmPassword")
    initializeRoleField()
  }

  // Initialize logout
  const logoutBtn = document.getElementById("logout-btn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout)
  }
}

async function checkAuthState() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const currentPath = window.location.pathname
    const currentPage = currentPath.split("/").pop() || "index.html"

    if (user) {
      // User is logged in
      if (currentPage === "login.html" || currentPage === "signup.html") {
        window.location.href = "dashboard.html"
      }
    } else {
      // User is not logged in
      if (currentPage === "dashboard.html" || currentPage === "marketplace.html" || currentPage === "education.html") {
        window.location.href = "login.html"
      }
    }
  } catch (error) {
    console.error("Auth state check error:", error)
  }
}

async function handleLogin(e) {
  e.preventDefault()

  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  const loginBtn = document.getElementById("login-btn")

  // Show loading state
  loginBtn.disabled = true
  loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing in...'
  hideError()

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) {
      showError(error.message)
    } else {
      // Success - redirect to dashboard
      window.location.href = "dashboard.html"
    }
  } catch (err) {
    console.error("Login error:", err)
    showError("An unexpected error occurred")
  } finally {
    // Reset button state
    loginBtn.disabled = false
    const currentLang = localStorage.getItem("agrilink-language") || "en"
    loginBtn.innerHTML = currentLang === "en" ? "Sign In" : "Injira"
  }
}

async function handleSignup(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const data = Object.fromEntries(formData)

  // Validation
  if (data.password !== data.confirmPassword) {
    const currentLang = localStorage.getItem("agrilink-language") || "en"
    showError(currentLang === "en" ? "Passwords do not match" : "Amagambo y'ibanga ntabwo ahura")
    return
  }

  if (!data.acceptTerms) {
    const currentLang = localStorage.getItem("agrilink-language") || "en"
    showError(
      currentLang === "en" ? "Please accept the terms and conditions" : "Nyamuneka wemere amabwiriza n'amategeko",
    )
    return
  }

  const signupBtn = document.getElementById("signup-btn")

  // Show loading state
  signupBtn.disabled = true
  signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating account...'
  hideError()

  try {
    // Sign up user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          phone: data.phone,
          role: data.role,
          district: data.district,
          farm_location: data.farmLocation || null,
        },
      },
    })

    if (signUpError) {
      showError(signUpError.message)
    } else if (authData.user) {
      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: authData.user.id,
          full_name: data.fullName,
          email: data.email,
          phone: data.phone,
          role: data.role,
          district: data.district,
          farm_location: data.role === "farmer" ? data.farmLocation : null,
          created_at: new Date().toISOString(),
        },
      ])

      if (profileError) {
        console.error("Profile creation error:", profileError)
        showError("Account created but profile setup failed. Please contact support.")
      } else {
        // Success - redirect to dashboard
        window.location.href = "dashboard.html"
      }
    }
  } catch (err) {
    console.error("Signup error:", err)
    showError("An unexpected error occurred")
  } finally {
    // Reset button state
    signupBtn.disabled = false
    const currentLang = localStorage.getItem("agrilink-language") || "en"
    signupBtn.innerHTML = currentLang === "en" ? "Create Account" : "Kora Konti"
  }
}

async function handleLogout() {
  try {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      window.location.href = "index.html"
    } else {
      console.error("Logout error:", error)
    }
  } catch (err) {
    console.error("Logout error:", err)
  }
}

function initializePasswordToggle(toggleId, passwordId) {
  const toggleBtn = document.getElementById(toggleId)
  const passwordInput = document.getElementById(passwordId)

  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener("click", () => {
      const type = passwordInput.getAttribute("type") === "password" ? "text" : "password"
      passwordInput.setAttribute("type", type)

      const icon = toggleBtn.querySelector("i")
      if (type === "password") {
        icon.className = "fas fa-eye"
      } else {
        icon.className = "fas fa-eye-slash"
      }
    })
  }
}

function initializeRoleField() {
  const roleSelect = document.getElementById("role")
  const farmLocationField = document.getElementById("farm-location-field")

  if (roleSelect && farmLocationField) {
    roleSelect.addEventListener("change", function () {
      if (this.value === "farmer") {
        farmLocationField.classList.remove("hidden")
      } else {
        farmLocationField.classList.add("hidden")
      }
    })
  }
}

function showError(message) {
  const errorAlert = document.getElementById("error-alert")
  const errorMessage = document.getElementById("error-message")

  if (errorAlert && errorMessage) {
    errorMessage.textContent = message
    errorAlert.classList.remove("hidden")
  }
}

function hideError() {
  const errorAlert = document.getElementById("error-alert")
  if (errorAlert) {
    errorAlert.classList.add("hidden")
  }
}
