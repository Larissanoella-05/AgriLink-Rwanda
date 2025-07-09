// Marketplace functionality
let allProducts = []
let filteredProducts = []
const currentFilters = {
  search: "",
  category: "",
  district: "",
  freshness: "",
}

const showElement = (id) => {
  document.getElementById(id).style.display = "block"
}

const hideElement = (id) => {
  document.getElementById(id).style.display = "none"
}

const supabase = {
  from: (table) => ({
    select: (query) => ({
      eq: (column, value) => ({
        order: (orderByColumn, options) => ({
          then: async () => {
            return { data: [], error: null }
          },
        }),
      }),
    }),
  }),
}

const currentLanguage = "en"

document.addEventListener("DOMContentLoaded", () => {
  initializeMarketplace()
})

async function initializeMarketplace() {
  try {
    await loadProducts()
    initializeFilters()
    renderProducts()
  } catch (error) {
    console.error("Error initializing marketplace:", error)
    showNoProductsState()
  }
}

async function loadProducts() {
  showElement("loading-state")
  hideElement("products-grid")
  hideElement("no-products-state")

  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
                *,
                profiles!products_farmer_id_fkey (
                    full_name,
                    phone
                )
            `)
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    allProducts =
      data?.map((product) => ({
        ...product,
        farmer_name: product.profiles?.full_name || "Unknown Farmer",
        farmer_phone: product.profiles?.phone || "",
      })) || []

    filteredProducts = [...allProducts]
  } catch (error) {
    console.error("Error loading products:", error)
    allProducts = []
    filteredProducts = []
  } finally {
    hideElement("loading-state")
  }
}

function initializeFilters() {
  const searchInput = document.getElementById("search-input")
  const categoryFilter = document.getElementById("category-filter")
  const districtFilter = document.getElementById("district-filter")
  const freshnessFilter = document.getElementById("freshness-filter")

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentFilters.search = e.target.value
      applyFilters()
    })
  }

  if (categoryFilter) {
    categoryFilter.addEventListener("change", (e) => {
      currentFilters.category = e.target.value
      applyFilters()
    })
  }

  if (districtFilter) {
    districtFilter.addEventListener("change", (e) => {
      currentFilters.district = e.target.value
      applyFilters()
    })
  }

  if (freshnessFilter) {
    freshnessFilter.addEventListener("change", (e) => {
      currentFilters.freshness = e.target.value
      applyFilters()
    })
  }
}

function applyFilters() {
  filteredProducts = allProducts.filter((product) => {
    // Search filter
    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase()
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.farmer_name.toLowerCase().includes(searchTerm)

      if (!matchesSearch) return false
    }

    // Category filter
    if (currentFilters.category && product.category !== currentFilters.category) {
      return false
    }

    // District filter
    if (currentFilters.district && product.district !== currentFilters.district) {
      return false
    }

    // Freshness filter
    if (currentFilters.freshness && product.freshness !== currentFilters.freshness) {
      return false
    }

    return true
  })

  renderProducts()
}

function renderProducts() {
  const productsGrid = document.getElementById("products-grid")
  const noProductsState = document.getElementById("no-products-state")

  if (filteredProducts.length === 0) {
    showNoProductsState()
    return
  }

  hideElement("no-products-state")
  showElement("products-grid")

  productsGrid.innerHTML = filteredProducts
    .map(
      (product) => `
        <div class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div class="aspect-w-16 aspect-h-12 bg-gray-200 rounded-t-lg overflow-hidden">
                <img
                    src="${product.image_url || "https://via.placeholder.com/300x200?text=Product+Image"}"
                    alt="${product.name}"
                    class="w-full h-48 object-cover"
                >
            </div>
            
            <div class="p-4">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-lg font-semibold text-gray-900 line-clamp-1">${product.name}</h3>
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${getFreshnessColor(product.freshness)}">
                        ${product.freshness}
                    </span>
                </div>
                
                <p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.description}</p>
                
                <div class="space-y-3">
                    <!-- Price and Quantity -->
                    <div class="flex justify-between items-center">
                        <div class="text-2xl font-bold text-green-600">${product.price.toLocaleString()} RWF</div>
                        <div class="text-sm text-gray-600">per ${product.unit}</div>
                    </div>
                    
                    <div class="text-sm text-gray-600">
                        <span class="font-medium">Available:</span> ${product.quantity} ${product.unit}
                    </div>
                    
                    <!-- Location and Date -->
                    <div class="flex items-center justify-between text-sm text-gray-500">
                        <div class="flex items-center space-x-1">
                            <i class="fas fa-map-marker-alt text-xs"></i>
                            <span>${product.district}</span>
                        </div>
                        <div class="flex items-center space-x-1">
                            <i class="fas fa-clock text-xs"></i>
                            <span>${new Date(product.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                    
                    <!-- Farmer Info -->
                    <div class="border-t pt-3">
                        <div class="flex items-center justify-between mb-3">
                            <div class="text-sm">
                                <span class="font-medium">Farmer:</span> ${product.farmer_name}
                            </div>
                            <div class="flex items-center space-x-1">
                                <i class="fas fa-star text-yellow-400"></i>
                                <span class="text-sm text-gray-600">4.8</span>
                            </div>
                        </div>
                        
                        <!-- Action Buttons -->
                        <div class="flex space-x-2">
                            <button 
                                onclick="contactFarmer('${product.farmer_phone}')"
                                class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <i class="fas fa-phone text-xs mr-1"></i>
                                ${currentLanguage === "en" ? "Contact" : "Vugana"}
                            </button>
                            <button 
                                onclick="placeOrder('${product.id}')"
                                class="flex-1 px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                            >
                                <i class="fas fa-shopping-cart text-xs mr-1"></i>
                                ${currentLanguage === "en" ? "Order" : "Gena"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    )
    .join("")
}

function showNoProductsState() {
  hideElement("products-grid")
  showElement("no-products-state")
}

function getFreshnessColor(freshness) {
  switch (freshness.toLowerCase()) {
    case "excellent":
      return "bg-green-100 text-green-800"
    case "good":
      return "bg-yellow-100 text-yellow-800"
    case "fresh":
      return "bg-blue-100 text-blue-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

function contactFarmer(phone) {
  if (phone) {
    window.open(`tel:${phone}`, "_self")
  } else {
    alert(currentLanguage === "en" ? "Phone number not available" : "Nimero ya telefoni ntiboneka")
  }
}

function placeOrder(productId) {
  // This would typically open a modal or redirect to an order page
  alert(currentLanguage === "en" ? "Order functionality coming soon!" : "Ibikorwa byo gutumiza bizaza vuba!")
}
