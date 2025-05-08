document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const sidebar = document.getElementById("sidebar")
  const menuToggle = document.getElementById("menuToggle")
  const mainContainer = document.getElementById("mainContainer")
  const inputBox = document.getElementById("inputBox")
  const sendBtn = document.getElementById("sendBtn")
  const conversation = document.getElementById("conversation")
  const cards = document.querySelectorAll(".card")
  const recentEntries = document.querySelectorAll(".recent-entry")
  const enquiryFormBtn = document.getElementById("enquiryFormBtn")
  const enquiryModal = document.getElementById("enquiryModal")
  const closeModal = document.querySelector(".close-modal")
  const enquiryForm = document.getElementById("enquiryForm")
  const darkModeToggle = document.getElementById("darkModeToggle")
  const newChat = document.getElementById("newChat")
  const voiceInput = document.getElementById("voiceInput")
  const attachFile = document.getElementById("attachFile")

  // College data for the chatbot
  const collegeData = {
    about:
      "St. Andrews Institute of Technology & Management (SAITM) is a prestigious college established in 2008, located in Gurugram, Delhi NCR. It offers various undergraduate and postgraduate programs in engineering, management, and computer applications. SAITM is approved by AICTE and affiliated to Maharshi Dayanand University, Rohtak.",

    campus:
      "SAITM campus is spread over 10 acres with modern infrastructure including smart classrooms, well-equipped laboratories, library with digital resources, sports facilities, auditorium, and cafeteria. The campus provides a conducive environment for academic and extracurricular activities.",

    courses:
      "SAITM offers the following courses:\n- B.Tech (CSE, ME, CE, ECE)\n- M.Tech\n- BBA\n- MBA\n- BCA\n- MCA\nAll courses are approved by AICTE and affiliated to Maharshi Dayanand University, Rohtak.",

    hostel:
      "SAITM provides separate hostel facilities for boys and girls with furnished rooms, 24/7 security, Wi-Fi, dining hall, recreation area, and regular housekeeping services. The hostels are located within the campus for convenience and safety of students.",

    fees: "The fee structure varies by program:\n- B.Tech: ₹75,000-90,000 per semester\n- M.Tech: ₹65,000-80,000 per semester\n- BBA: ₹50,000-60,000 per semester\n- MBA: ₹70,000-85,000 per semester\n- BCA: ₹45,000-55,000 per semester\n- MCA: ₹60,000-75,000 per semester\nScholarship opportunities are available for meritorious students.",

    admission:
      "Admission to SAITM is based on:\n- For B.Tech: JEE Main score or state-level entrance exams\n- For M.Tech: GATE score\n- For MBA/BBA: CAT/MAT/XAT or college-level entrance test\n- For BCA/MCA: College-level entrance test\nThe admission process includes application submission, entrance exam, counseling, and document verification.",

    placements:
      "SAITM has an excellent placement record with top companies visiting the campus for recruitment. The average placement rate is over 85% with companies like TCS, Infosys, Wipro, IBM, Cognizant, and many more. The highest package offered was 12 LPA and the average package is around 5-6 LPA.",

    faculty:
      "SAITM has highly qualified and experienced faculty members with doctoral degrees from reputed institutions. The faculty-student ratio is 1:15, ensuring personalized attention to each student. Regular faculty development programs are conducted to keep them updated with the latest industry trends.",

    facilities:
      "SAITM provides excellent facilities including:\n- Digital library with e-journals\n- Computer labs with high-speed internet\n- Sports complex with indoor and outdoor games\n- Cafeteria serving nutritious food\n- Medical facility\n- Transportation facility\n- 24/7 Wi-Fi campus\n- Auditorium and seminar halls",

    contact:
      "You can contact SAITM at:\nAddress: Plot No. 76, Knowledge Park-III, Greater Noida, Uttar Pradesh 201308\nPhone: +91-120-2323854, +91-120-2323855\nEmail: info@saitm.ac.in\nWebsite: https://saitm.ac.in",
  }

  // Predefined questions and answers
  const qaPairs = [
    {
      keywords: ["about", "saitm", "college", "institute"],
      response: collegeData.about,
    },
    {
      keywords: ["campus", "infrastructure", "facilities", "building"],
      response: collegeData.campus,
    },
    {
      keywords: ["courses", "programs", "degrees", "offered", "study"],
      response: collegeData.courses,
    },
    {
      keywords: ["hostel", "accommodation", "dormitory", "staying", "living"],
      response: collegeData.hostel,
    },
    {
      keywords: ["fees", "cost", "tuition", "expenses", "payment"],
      response: collegeData.fees,
    },
    {
      keywords: ["admission", "apply", "entrance", "requirements", "eligibility"],
      response: collegeData.admission,
    },
    {
      keywords: ["placement", "job", "career", "recruitment", "companies"],
      response: collegeData.placements,
    },
    {
      keywords: ["faculty", "professors", "teachers", "staff"],
      response: collegeData.faculty,
    },
    {
      keywords: ["contact", "address", "phone", "email", "reach"],
      response: collegeData.contact,
    },
  ]

  // Initialize chat
  let chatHistory = []
  let isBotTyping = false

  // Toggle sidebar
  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed")
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle("active")
    }
    adjustMainMargin()
  })

  // Adjust main content margin based on sidebar state
  function adjustMainMargin() {
    if (window.innerWidth <= 768) {
      document.querySelector(".main").style.marginLeft = "0"
      document.querySelector(".main-bottom").style.left = "0"
    } else {
      if (sidebar.classList.contains("collapsed")) {
        document.querySelector(".main").style.marginLeft = "80px"
        document.querySelector(".main-bottom").style.left = "80px"
      } else {
        document.querySelector(".main").style.marginLeft = "280px"
        document.querySelector(".main-bottom").style.left = "280px"
      }
    }
  }

  // Handle window resize
  window.addEventListener("resize", adjustMainMargin)

  // Send message function
  function sendMessage() {
    const userInput = inputBox.value.trim()
    if (userInput === "" || isBotTyping) return

    // Add user message to conversation
    addMessage(userInput, "user")

    // Clear input
    inputBox.value = ""

    // Show typing indicator
    showTypingIndicator()

    // Process the message and get response
    setTimeout(
      () => {
        const botResponse = getBotResponse(userInput)
        hideTypingIndicator()
        addMessage(botResponse, "bot")
      },
      1000 + Math.random() * 1000,
    ) // Random delay for more natural feel
  }

  // Add message to conversation
  function addMessage(text, sender) {
    const messageDiv = document.createElement("div")
    messageDiv.className = `message ${sender}`

    const avatarDiv = document.createElement("div")
    avatarDiv.className = "message-avatar"

    const avatarImg = document.createElement("img")
    if (sender === "user") {
      avatarImg.src = "assets/user_icon.png"
    } else {
      avatarImg.src = "assets/gemini_icon.png"
    }

    avatarDiv.appendChild(avatarImg)

    const contentDiv = document.createElement("div")
    contentDiv.className = "message-content"

    const textP = document.createElement("p")
    textP.className = "message-text"

    if (sender === "bot") {
      // Animate typing effect for bot messages
      animateTyping(textP, text)
    } else {
      textP.textContent = text
    }

    contentDiv.appendChild(textP)
    messageDiv.appendChild(avatarDiv)
    messageDiv.appendChild(contentDiv)

    conversation.appendChild(messageDiv)

    // Save to chat history
    chatHistory.push({
      sender: sender,
      message: text,
    })

    // Scroll to bottom
    conversation.scrollTop = conversation.scrollHeight
  }

  // Animate typing effect
  function animateTyping(element, text) {
    let i = 0
    const speed = 30 // typing speed in milliseconds

    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i)
        i++
        setTimeout(type, speed)
        conversation.scrollTop = conversation.scrollHeight
      }
    }

    type()
  }

  // Show typing indicator
  function showTypingIndicator() {
    isBotTyping = true

    const typingDiv = document.createElement("div")
    typingDiv.className = "message bot typing-message"
    typingDiv.id = "typingIndicator"

    const avatarDiv = document.createElement("div")
    avatarDiv.className = "message-avatar"

    const avatarImg = document.createElement("img")
    avatarImg.src = "assets/gemini_icon.png"
    avatarDiv.appendChild(avatarImg)

    const contentDiv = document.createElement("div")
    contentDiv.className = "message-content"

    const indicatorDiv = document.createElement("div")
    indicatorDiv.className = "typing-indicator"

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("div")
      dot.className = "typing-dot"
      indicatorDiv.appendChild(dot)
    }

    contentDiv.appendChild(indicatorDiv)
    typingDiv.appendChild(avatarDiv)
    typingDiv.appendChild(contentDiv)

    conversation.appendChild(typingDiv)
    conversation.scrollTop = conversation.scrollHeight
  }

  // Hide typing indicator
  function hideTypingIndicator() {
    isBotTyping = false
    const typingIndicator = document.getElementById("typingIndicator")
    if (typingIndicator) {
      typingIndicator.remove()
    }
  }

  // Get bot response based on user input
  function getBotResponse(userInput) {
    userInput = userInput.toLowerCase()

    // Check for greetings
    if (userInput.match(/hello|hi|hey|greetings/i)) {
      return "Hello! I'm the SAITM Assistant. How can I help you today?"
    }

    // Check for thanks
    if (userInput.match(/thank you|thanks|thank/i)) {
      return "You're welcome! If you have any more questions about SAITM, feel free to ask."
    }

    // Check for goodbye
    if (userInput.match(/bye|goodbye|see you|farewell/i)) {
      return "Goodbye! Feel free to come back if you have more questions about SAITM."
    }

    // Check for predefined QA pairs
    for (const qa of qaPairs) {
      if (qa.keywords.some((keyword) => userInput.includes(keyword))) {
        return qa.response
      }
    }

    // Default response if no match found
    return "I'm not sure I understand your question. You can ask me about SAITM's courses, admission process, campus facilities, hostel, fees, placements, or contact information."
  }

  // Event listeners
  sendBtn.addEventListener("click", sendMessage)

  inputBox.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage()
    }
  })

  // Card click events
  cards.forEach((card) => {
    card.addEventListener("click", function () {
      const query = this.getAttribute("data-query")
      if (query) {
        inputBox.value = query
        sendMessage()
      }
    })
  })

  // Recent entries click events
  recentEntries.forEach((entry) => {
    entry.addEventListener("click", function () {
      const query = this.getAttribute("data-query")
      if (query) {
        inputBox.value = query
        sendMessage()
      }
    })
  })

  // Enquiry form modal
  enquiryFormBtn.addEventListener("click", () => {
    enquiryModal.style.display = "flex"
  })

  closeModal.addEventListener("click", () => {
    enquiryModal.style.display = "none"
  })

  window.addEventListener("click", (e) => {
    if (e.target === enquiryModal) {
      enquiryModal.style.display = "none"
    }
  })

  // Enquiry form submission
  enquiryForm.addEventListener("submit", (e) => {
    e.preventDefault()

    // Get form data
    const name = document.getElementById("name").value
    const email = document.getElementById("email").value
    const phone = document.getElementById("phone").value
    const course = document.getElementById("course").value
    const message = document.getElementById("message").value

    // In a real application, you would send this data to a server
    // For now, we'll just show a success message
    alert(`Thank you ${name} for your enquiry about ${course}. We will contact you soon at ${email} or ${phone}.`)

    // Reset form
    enquiryForm.reset()

    // Close modal
    enquiryModal.style.display = "none"

    // Add a message in the chat
    addMessage(`I've submitted an enquiry about ${course}.`, "user")

    // Show typing indicator
    showTypingIndicator()

    // Bot response
    setTimeout(() => {
      hideTypingIndicator()
      addMessage(
        `Thank you for your interest in ${course} at SAITM. Our admissions team will contact you shortly with more information. Is there anything specific about the course you'd like to know now?`,
        "bot",
      )
    }, 1500)
  })

  // Dark mode toggle
  darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode")

    // Update text based on current mode
    const darkModeText = darkModeToggle.querySelector("p")
    if (document.body.classList.contains("dark-mode")) {
      darkModeText.textContent = "Light Mode"
    } else {
      darkModeText.textContent = "Dark Mode"
    }
  })

  // New chat button
  newChat.addEventListener("click", () => {
    // Clear conversation
    conversation.innerHTML = ""

    // Reset chat history
    chatHistory = []

    // Show greeting again
    document.querySelector(".greet").style.display = "block"
    document.querySelector(".cards").style.display = "flex"
  })

  // Voice input (simulated)
  voiceInput.addEventListener("click", () => {
    alert("Voice input feature is coming soon!")
  })

  // File attachment (simulated)
  attachFile.addEventListener("click", () => {
    alert("File attachment feature is coming soon!")
  })

  // Initial setup
  adjustMainMargin()
})
