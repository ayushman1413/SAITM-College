// Main JavaScript file for the Smart Attendance System
document.addEventListener("DOMContentLoaded", () => {
  // Set current year in footer
  const yearElement = document.querySelector("footer p")
  if (yearElement) {
    const currentYear = new Date().getFullYear()
    yearElement.textContent = yearElement.textContent.replace("2025", currentYear)
  }

  // Add active class to current page in navigation
  const currentPage = window.location.pathname.split("/").pop() || "index.html"
  const navLinks = document.querySelectorAll("nav ul li a")

  navLinks.forEach((link) => {
    const linkPage = link.getAttribute("href")
    if (linkPage === currentPage) {
      link.classList.add("active")
    } else if (currentPage === "index.html" && linkPage === "index.html") {
      link.classList.add("active")
    }
  })
})
