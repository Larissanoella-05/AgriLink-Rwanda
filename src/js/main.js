// Language switching functionality
let currentLanguage = "en"

// Initialize language switching
document.addEventListener("DOMContentLoaded", () => {
  initializeLanguageSwitching()
  updateCurrentDate()
})

function initializeLanguageSwitching() {
  const langEnBtn = document.getElementById("lang-en")
  const langRwBtn = document.getElementById("lang-rw")

  if (langEnBtn && langRwBtn) {
    langEnBtn.addEventListener("click", () => switchLanguage("en"))
    langRwBtn.addEventListener("click", () => switchLanguage("rw"))
  }

  // Load saved language preference
  const savedLanguage = localStorage.getItem("agrilink-language") || "en"
  switchLanguage(savedLanguage)
}

function switchLanguage(language) {
  currentLanguage = language
  localStorage.setItem("agrilink-language", language)

  // Update button states
  const langEnBtn = document.getElementById("lang-en")
  const langRwBtn = document.getElementById("lang-rw")

  if (langEnBtn && langRwBtn) {
    if (language === "en") {
      langEnBtn.className = "px-3 py-1 text-sm font-medium bg-amber-700 text-white rounded hover:bg-amber-800"
      langRwBtn.className = "px-3 py-1 text-sm font-medium bg-stone-200 text-stone-700 rounded hover:bg-stone-300"
    } else {
      langEnBtn.className = "px-3 py-1 text-sm font-medium bg-stone-200 text-stone-700 rounded hover:bg-stone-300"
      langRwBtn.className = "px-3 py-1 text-sm font-medium bg-amber-700 text-white rounded hover:bg-amber-800"
    }
  }

  // Update all text elements
  updateTextContent(language)
}

function updateTextContent(language) {
  const elements = document.querySelectorAll("[data-en][data-rw]")
  elements.forEach((element) => {
    const text = element.getAttribute(`data-${language}`)
    if (text) {
      element.textContent = text
    }
  })

  // Update select options
  const selectOptions = document.querySelectorAll("option[data-en][data-rw]")
  selectOptions.forEach((option) => {
    const text = option.getAttribute(`data-${language}`)
    if (text) {
      option.textContent = text
    }
  })

  // Update placeholders
  updatePlaceholders(language)
}

function updatePlaceholders(language) {
  const placeholders = {
    en: {
      "search-input": "Search products...",
      email: "Enter your email",
      password: "Enter your password",
      fullName: "Enter your full name",
      phone: "+250...",
      farmLocation: "Enter your farm location",
      confirmPassword: "Confirm your password",
    },
    rw: {
      "search-input": "Shakisha ibicuruzwa...",
      email: "Shyiramo email yawe",
      password: "Shyiramo ijambo ry'ibanga",
      fullName: "Shyiramo amazina yawe yose",
      phone: "+250...",
      farmLocation: "Shyiramo aho uhinze",
      confirmPassword: "Emeza ijambo ry'ibanga",
    },
  }

  Object.keys(placeholders[language]).forEach((id) => {
    const element = document.getElementById(id)
    if (element) {
      element.placeholder = placeholders[language][id]
    }
  })
}

function updateCurrentDate() {
  const dateElement = document.getElementById("current-date")
  if (dateElement) {
    const now = new Date()
    dateElement.textContent = now.toLocaleDateString()
  }
}

// Utility functions
function showElement(elementId) {
  const element = document.getElementById(elementId)
  if (element) {
    element.classList.remove("hidden")
  }
}

function hideElement(elementId) {
  const element = document.getElementById(elementId)
  if (element) {
    element.classList.add("hidden")
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

// Animation utilities
function fadeIn(element) {
  element.style.opacity = "0"
  element.style.transform = "translateY(20px)"
  element.style.transition = "opacity 0.6s ease-in, transform 0.6s ease-in"

  setTimeout(() => {
    element.style.opacity = "1"
    element.style.transform = "translateY(0)"
  }, 100)
}

// Initialize fade-in animations
document.addEventListener("DOMContentLoaded", () => {
  const fadeElements = document.querySelectorAll(".fade-in")
  fadeElements.forEach((element, index) => {
    setTimeout(() => {
      fadeIn(element)
    }, index * 200)
  })
})
