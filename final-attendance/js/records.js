// Records page functionality
document.addEventListener("DOMContentLoaded", async () => {
  // DOM elements
  const filterRoll = document.getElementById("filterRoll")
  const startDate = document.getElementById("startDate")
  const endDate = document.getElementById("endDate")
  const filterCourse = document.getElementById("filterCourse")
  const applyFiltersBtn = document.getElementById("applyFilters")
  const exportExcelBtn = document.getElementById("exportExcel")
  const exportCSVBtn = document.getElementById("exportCSV")
  const attendanceTable = document.getElementById("attendanceRecords").querySelector("tbody")
  const prevPageBtn = document.getElementById("prevPage")
  const nextPageBtn = document.getElementById("nextPage")
  const pageInfo = document.getElementById("pageInfo")

  // Pagination variables
  let currentPage = 1
  const recordsPerPage = 10
  let filteredRecords = []

  // Set default date values
  const today = new Date().toISOString().split("T")[0]
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  startDate.value = thirtyDaysAgo.toISOString().split("T")[0]
  endDate.value = today

  // Load attendance records
  async function loadAttendanceRecords() {
    try {
      // Get filters
      const filters = {
        rollNumber: filterRoll.value.trim(),
        startDate: startDate.value,
        endDate: endDate.value,
        course: filterCourse.value,
      }

      // Get filtered records
      filteredRecords = await window.attendanceDB.getFilteredAttendance(filters)

      // Sort by date (newest first)
      filteredRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      // Update pagination
      updatePagination()

      // Display records
      displayRecords()
    } catch (error) {
      console.error("Error loading attendance records:", error)
      attendanceTable.innerHTML = `<tr><td colspan="6" style="text-align: center;">Error loading records. Please try again.</td></tr>`
    }
  }

  // Update pagination controls
  function updatePagination() {
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage)

    // Reset to page 1 if current page is out of bounds
    if (currentPage > totalPages) {
      currentPage = 1
    }

    // Update page info
    pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`

    // Update button states
    prevPageBtn.disabled = currentPage <= 1
    nextPageBtn.disabled = currentPage >= totalPages || totalPages === 0
  }

  // Display records for current page
  function displayRecords() {
    // Clear table
    attendanceTable.innerHTML = ""

    if (filteredRecords.length === 0) {
      const row = document.createElement("tr")
      row.innerHTML = `<td colspan="6" style="text-align: center;">No attendance records found</td>`
      attendanceTable.appendChild(row)
      return
    }

    // Calculate start and end index for current page
    const startIndex = (currentPage - 1) * recordsPerPage
    const endIndex = Math.min(startIndex + recordsPerPage, filteredRecords.length)

    // Display records for current page
    for (let i = startIndex; i < endIndex; i++) {
      const record = filteredRecords[i]
      const row = document.createElement("tr")

      // Format date and time
      const recordDate = new Date(record.timestamp)
      const dateStr = recordDate.toLocaleDateString()
      const timeStr = recordDate.toLocaleTimeString()

      row.innerHTML = `
        <td>${dateStr}</td>
        <td>${record.rollNumber}</td>
        <td>${record.name}</td>
        <td>${record.course}</td>
        <td>${timeStr}</td>
        <td>${record.status}</td>
      `

      attendanceTable.appendChild(row)
    }
  }

  // Export to Excel
  exportExcelBtn.addEventListener("click", () => {
    if (filteredRecords.length === 0) {
      alert("No records to export")
      return
    }

    // Create worksheet
    let csv = "Date,Roll Number,Name,Course,Time,Status\n"

    filteredRecords.forEach((record) => {
      const recordDate = new Date(record.timestamp)
      const dateStr = recordDate.toLocaleDateString()
      const timeStr = recordDate.toLocaleTimeString()

      csv += `${dateStr},${record.rollNumber},"${record.name}","${record.course}",${timeStr},${record.status}\n`
    })

    // Create download link
    const blob = new Blob([csv], { type: "application/vnd.ms-excel" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendance_records_${new Date().toISOString().split("T")[0]}.xls`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  })

  // Export to CSV
  exportCSVBtn.addEventListener("click", () => {
    if (filteredRecords.length === 0) {
      alert("No records to export")
      return
    }

    // Create CSV content
    let csv = "Date,Roll Number,Name,Course,Time,Status\n"

    filteredRecords.forEach((record) => {
      const recordDate = new Date(record.timestamp)
      const dateStr = recordDate.toLocaleDateString()
      const timeStr = recordDate.toLocaleTimeString()

      csv += `${dateStr},${record.rollNumber},"${record.name}","${record.course}",${timeStr},${record.status}\n`
    })

    // Create download link
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendance_records_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  })

  // Apply filters
  applyFiltersBtn.addEventListener("click", () => {
    currentPage = 1 // Reset to first page
    loadAttendanceRecords()
  })

  // Pagination controls
  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--
      displayRecords()
      updatePagination()
    }
  })

  nextPageBtn.addEventListener("click", () => {
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage)
    if (currentPage < totalPages) {
      currentPage++
      displayRecords()
      updatePagination()
    }
  })

  // Load initial records
  loadAttendanceRecords()
})
