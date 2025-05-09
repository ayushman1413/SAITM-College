// Attendance page functionality
document.addEventListener("DOMContentLoaded", async () => {
  // DOM elements
  const video = document.getElementById("video")
  const canvas = document.getElementById("canvas")
  const overlay = document.getElementById("face-detection-overlay")
  const startCameraBtn = document.getElementById("startCamera")
  const startRecognitionBtn = document.getElementById("startRecognition")
  const recognitionMessage = document.getElementById("recognitionMessage")
  const studentInfo = document.getElementById("studentInfo")
  const studentName = document.getElementById("studentName")
  const studentRoll = document.getElementById("studentRoll")
  const studentCourse = document.getElementById("studentCourse")
  const attendanceStatus = document.getElementById("attendanceStatus")
  const attendanceTime = document.getElementById("attendanceTime")
  const todayAttendanceTable = document.getElementById("todayAttendance").querySelector("tbody")

  // Face recognition variables
  let stream = null
  let isRecognizing = false
  let recognitionInterval = null
  let faceMatcher = null
  let isModelLoaded = false

  // Check if face-api is loaded
  if (!window.faceapi) {
    recognitionMessage.textContent = "Face API not loaded. Please check your internet connection and refresh."
    recognitionMessage.style.backgroundColor = "#ffebee"
    return
  }

  const faceapi = window.faceapi

  // Load face-api.js models
  async function loadModels() {
    try {
      recognitionMessage.textContent = "Loading face recognition models..."
      recognitionMessage.style.backgroundColor = "#e3f2fd"

      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri("models/face-api.js-models-master/ssd_mobilenetv1"),
        faceapi.nets.faceLandmark68Net.loadFromUri("models/face-api.js-models-master/face_landmark_68"),
        faceapi.nets.faceRecognitionNet.loadFromUri("models/face-api.js-models-master/face_recognition"),
      ])

      isModelLoaded = true
      recognitionMessage.textContent = "Face recognition models loaded. You can start the camera now."
      recognitionMessage.style.backgroundColor = "#e8f5e9"
      console.log("Face detection models loaded")

      // Load face descriptors from database
      await loadFaceDescriptors()
    } catch (error) {
      console.error("Error loading models:", error)
      recognitionMessage.textContent =
        "Error loading face recognition models. Please check if model files exist in the 'models' folder."
      recognitionMessage.style.backgroundColor = "#ffebee"
    }
  }

  // Load face descriptors from database
  async function loadFaceDescriptors() {
    try {
      const faceData = await window.attendanceDB.getAllFaceDescriptors()

      if (faceData.length === 0) {
        recognitionMessage.textContent = "No registered faces found. Please register at least one face first."
        recognitionMessage.style.backgroundColor = "#fff3e0"
        return false
      }

      // Create labeled face descriptors
      const labeledDescriptors = faceData.map((face) => {
        return new faceapi.LabeledFaceDescriptors(face.rollNumber, [new Float32Array(face.descriptors)])
      })

      // Create face matcher
      faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6)
      recognitionMessage.textContent = `Loaded ${faceData.length} face(s). Ready to start camera.`
      recognitionMessage.style.backgroundColor = "#e8f5e9"
      return true
    } catch (error) {
      console.error("Error loading face descriptors:", error)
      recognitionMessage.textContent = "Error loading face data. Please try again."
      recognitionMessage.style.backgroundColor = "#ffebee"
      return false
    }
  }

  // Start camera
  startCameraBtn.addEventListener("click", async () => {
    try {
      recognitionMessage.textContent = "Requesting camera access..."
      recognitionMessage.style.backgroundColor = "#e3f2fd"

      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      })

      video.srcObject = stream

      // Make sure video plays
      video.onloadedmetadata = () => {
        video.play().catch((e) => {
          console.error("Error playing video:", e)
          recognitionMessage.textContent = "Error starting video. Please try again."
          recognitionMessage.style.backgroundColor = "#ffebee"
        })
      }

      startCameraBtn.disabled = true

      if (isModelLoaded && faceMatcher) {
        startRecognitionBtn.disabled = false
        recognitionMessage.textContent = 'Camera started. Click "Start Recognition" to begin face recognition.'
        recognitionMessage.style.backgroundColor = "#e8f5e9"
      } else {
        recognitionMessage.textContent = "Loading face data. Please wait..."
        recognitionMessage.style.backgroundColor = "#e3f2fd"
        const loaded = await loadFaceDescriptors()
        if (loaded) {
          startRecognitionBtn.disabled = false
          recognitionMessage.textContent = 'Camera started. Click "Start Recognition" to begin face recognition.'
          recognitionMessage.style.backgroundColor = "#e8f5e9"
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      recognitionMessage.textContent =
        "Error accessing camera. Please check camera permissions and ensure your device has a camera."
      recognitionMessage.style.backgroundColor = "#ffebee"

      // Re-enable button so user can try again
      startCameraBtn.disabled = false
    }
  })

  // Start face recognition
  startRecognitionBtn.addEventListener("click", () => {
    if (isRecognizing) {
      stopRecognition()
      startRecognitionBtn.innerHTML = '<i class="fas fa-play"></i> Start Recognition'
      recognitionMessage.textContent = "Face recognition stopped."
      recognitionMessage.style.backgroundColor = "#e3f2fd"
    } else {
      startRecognition()
      startRecognitionBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Recognition'
      recognitionMessage.textContent = "Face recognition active. Looking for registered faces..."
      recognitionMessage.style.backgroundColor = "#e8f5e9"
    }
  })

  // Start face recognition process
  function startRecognition() {
    if (!faceMatcher) {
      recognitionMessage.textContent = "No face data available. Please register faces first."
      recognitionMessage.style.backgroundColor = "#fff3e0"
      return
    }

    isRecognizing = true

    // Clear previous interval if any
    if (recognitionInterval) {
      clearInterval(recognitionInterval)
    }

    // Start recognition loop
    recognitionInterval = setInterval(async () => {
      if (!video.paused && !video.ended && video.readyState === 4) {
        // Draw video to canvas
        const context = canvas.getContext("2d")
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Detect faces
        const detections = await faceapi.detectAllFaces(canvas).withFaceLandmarks().withFaceDescriptors()

        // Clear previous drawings
        overlay.innerHTML = ""
        const displaySize = { width: canvas.width, height: canvas.height }
        const overlayCanvas = document.createElement("canvas")
        overlayCanvas.width = canvas.width
        overlayCanvas.height = canvas.height
        overlay.appendChild(overlayCanvas)
        const ctx = overlayCanvas.getContext("2d")

        if (detections.length > 0) {
          // Match detected faces with registered faces
          const results = detections.map((detection) => {
            const match = faceMatcher.findBestMatch(detection.descriptor)
            return {
              detection: detection.detection,
              match: match,
            }
          })

          // Draw results
          results.forEach((result) => {
            const box = result.detection.box
            const label = result.match.toString()
            const isRecognized = !label.includes("unknown")

            // Draw box
            const boxColor = isRecognized ? "#4caf50" : "#f44336"
            ctx.strokeStyle = boxColor
            ctx.lineWidth = 3
            ctx.strokeRect(box.x, box.y, box.width, box.height)

            // Draw label background
            ctx.fillStyle = boxColor
            ctx.font = "16px Arial"
            const textWidth = ctx.measureText(label).width + 10
            ctx.fillRect(box.x, box.y - 30, textWidth, 30)

            // Draw label text
            ctx.fillStyle = "#fff"
            ctx.fillText(label, box.x + 5, box.y - 10)

            // Process recognized student
            if (isRecognized) {
              const rollNumber = label.split(" ")[0]
              processRecognizedStudent(rollNumber)
            } else {
              // Show "No user found" message if face is detected but not recognized
              studentInfo.style.display = "block"
              studentName.textContent = "Unknown User"
              studentRoll.textContent = "N/A"
              studentCourse.textContent = "N/A"
              attendanceStatus.textContent = "Not Registered"
              attendanceTime.textContent = new Date().toLocaleTimeString()
            }
          })
        } else if (isRecognizing) {
          // No face detected in the frame
          recognitionMessage.textContent =
            "No face detected in the frame. Please position yourself in front of the camera."
          recognitionMessage.style.backgroundColor = "#fff3e0"
        }
      }
    }, 500) // Check every 500ms
  }

  // Stop face recognition
  function stopRecognition() {
    isRecognizing = false
    if (recognitionInterval) {
      clearInterval(recognitionInterval)
      recognitionInterval = null
    }
    overlay.innerHTML = ""
  }

  // Process recognized student
  async function processRecognizedStudent(rollNumber) {
    try {
      // Check if already processed recently (to avoid multiple processing)
      if (
        studentInfo.dataset.processedRoll === rollNumber &&
        Date.now() - Number.parseInt(studentInfo.dataset.processedTime || 0) < 5000
      ) {
        return
      }

      // Get student details
      const student = await window.attendanceDB.getStudent(rollNumber)
      if (!student) {
        console.error("Student not found in database:", rollNumber)
        return
      }

      // Check if already marked attendance today
      const alreadyMarked = await window.attendanceDB.checkAttendanceToday(rollNumber)

      if (!alreadyMarked) {
        // Mark attendance
        const now = new Date()
        const attendanceRecord = {
          rollNumber: student.rollNumber,
          name: student.fullName,
          course: student.course,
          date: now.toISOString().split("T")[0],
          timestamp: now.toISOString(),
          status: "Present",
        }

        await window.attendanceDB.markAttendance(attendanceRecord)

        // Update UI
        studentName.textContent = student.fullName
        studentRoll.textContent = student.rollNumber
        studentCourse.textContent = student.course
        attendanceStatus.textContent = "Present"
        attendanceTime.textContent = now.toLocaleTimeString()
        studentInfo.style.display = "block"

        // Set processed flag
        studentInfo.dataset.processedRoll = rollNumber
        studentInfo.dataset.processedTime = Date.now().toString()

        // Update today's attendance table
        await loadTodayAttendance()

        // Play success sound if available
        try {
          const audio = new Audio("sounds/success.mp3")
          audio.play().catch((e) => console.log("No sound played:", e))
        } catch (e) {
          console.log("Sound not available")
        }
      } else {
        // Already marked attendance
        const todayRecords = await window.attendanceDB.getAttendanceByDate(new Date().toISOString().split("T")[0])
        const studentRecord = todayRecords.find((record) => record.rollNumber === rollNumber)

        if (studentRecord) {
          studentName.textContent = student.fullName
          studentRoll.textContent = student.rollNumber
          studentCourse.textContent = student.course
          attendanceStatus.textContent = "Already Marked"
          attendanceTime.textContent = new Date(studentRecord.timestamp).toLocaleTimeString()
          studentInfo.style.display = "block"

          // Set processed flag
          studentInfo.dataset.processedRoll = rollNumber
          studentInfo.dataset.processedTime = Date.now().toString()
        }
      }
    } catch (error) {
      console.error("Error processing recognized student:", error)
      recognitionMessage.textContent = "Error processing student data. Please try again."
      recognitionMessage.style.backgroundColor = "#ffebee"
    }
  }

  // Load today's attendance
  async function loadTodayAttendance() {
    try {
      const today = new Date().toISOString().split("T")[0]
      const records = await window.attendanceDB.getAttendanceByDate(today)

      // Clear table
      todayAttendanceTable.innerHTML = ""

      if (records.length === 0) {
        const row = document.createElement("tr")
        row.innerHTML = `<td colspan="5" style="text-align: center;">No attendance records for today</td>`
        todayAttendanceTable.appendChild(row)
        return
      }

      // Sort by timestamp (newest first)
      records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      // Add records to table
      records.forEach((record) => {
        const row = document.createElement("tr")
        row.innerHTML = `
          <td>${record.rollNumber}</td>
          <td>${record.name}</td>
          <td>${record.course}</td>
          <td>${new Date(record.timestamp).toLocaleTimeString()}</td>
          <td>${record.status}</td>
        `
        todayAttendanceTable.appendChild(row)
      })
    } catch (error) {
      console.error("Error loading today's attendance:", error)
    }
  }

  // Load models on page load
  loadModels()

  // Load today's attendance
  loadTodayAttendance()
})
