// Enhanced Chatbot for Ducks and Drakes
document.addEventListener('DOMContentLoaded', () => {
    // Navigation Scroll Effect
    const nav = document.querySelector('nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        menuToggle.innerHTML = navLinks.classList.contains('active') ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });

    // Chatbot Logic
    const chatWidget = document.querySelector('.chat-widget');
    const chatToggle = document.querySelector('.chat-toggle-btn');
    const chatInput = document.querySelector('.chat-input');
    const sendBtn = document.querySelector('.send-btn');
    const chatBody = document.querySelector('.chat-body');

    let conversationCount = 0;
    let leadCaptured = false;

    // Food images by category
    const foodImages = {
        breakfast: [
            '/assets/food.png',
            '/assets/food.png'
        ],
        lunch: [
            '/assets/food.png',
            '/assets/food.png'
        ],
        coffee: [
            '/assets/food.png',
            '/assets/food.png'
        ],
        baked: [
            '/assets/food.png'
        ]
    };

    // Get time-based greeting
    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) {
            return "Good morning! ☀️ Ready for some breakfast and coffee?";
        } else if (hour < 17) {
            return "Good afternoon! 🍔 Hungry for lunch or a cold beer?";
        } else {
            return "Good evening! 🍻 Welcome to Ducks and Drakes!";
        }
    }

    // Format timestamp
    function getTimestamp() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }

    // Add message with timestamp
    function addMessage(text, isUser = false, options = {}) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', isUser ? 'user-msg' : 'bot-msg');

        const textDiv = document.createElement('div');
        textDiv.classList.add('message-text');
        textDiv.textContent = text;

        const timeDiv = document.createElement('div');
        timeDiv.classList.add('message-time');
        timeDiv.textContent = getTimestamp();

        msgDiv.appendChild(textDiv);
        msgDiv.appendChild(timeDiv);

        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;

        if (!isUser) conversationCount++;
    }

    // Add suggestion chips
    function addSuggestions() {
        const suggestions = [
            { text: '📋 Menu', query: 'What\'s on the menu?' },
            { text: '🕐 Hours', query: 'What are your hours?' },
            { text: '📍 Location', query: 'Where are you located?' },
            { text: '⭐ Specials', query: 'Any specials today?' }
        ];

        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.classList.add('suggestions');

        suggestions.forEach(sug => {
            const btn = document.createElement('button');
            btn.classList.add('suggestion-chip');
            btn.textContent = sug.text;
            btn.onclick = () => {
                chatInput.value = sug.query;
                sendMessage();
            };
            suggestionsDiv.appendChild(btn);
        });

        chatBody.appendChild(suggestionsDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Add CTA buttons
    function addCTAButtons() {
        const ctaDiv = document.createElement('div');
        ctaDiv.classList.add('cta-buttons');
        ctaDiv.innerHTML = `
            <button class="cta-btn" onclick="window.location.href='tel:5095480270'">
                <i class="fas fa-phone"></i> Call Us
            </button>
            <button class="cta-btn" onclick="window.open('https://maps.google.com/?q=Ducks+And+Drakes+Leavenworth', '_blank')">
                <i class="fas fa-map-marker-alt"></i> Get Directions
            </button>
        `;
        chatBody.appendChild(ctaDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Add typing indicator
    function showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('message', 'bot-msg', 'typing-indicator');
        typingDiv.innerHTML = `
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
        `;
        chatBody.appendChild(typingDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
        return typingDiv;
    }

    // Detect image request
    function detectImageRequest(message) {
        const lower = message.toLowerCase();
        if (lower.includes('breakfast') || lower.includes('morning')) return 'breakfast';
        if (lower.includes('lunch') || lower.includes('burger')) return 'lunch';
        if (lower.includes('coffee') || lower.includes('drink')) return 'coffee';
        if (lower.includes('baked') || lower.includes('dessert')) return 'baked';
        return null;
    }

    // Show images
    function showImages(category) {
        const images = foodImages[category] || [];
        if (images.length === 0) return;

        const imgDiv = document.createElement('div');
        imgDiv.classList.add('image-gallery');

        images.forEach(img => {
            const imgEl = document.createElement('img');
            imgEl.src = img;
            imgEl.alt = category;
            imgEl.classList.add('food-image');
            imgEl.onclick = () => {
                // Open in modal or new tab
                window.open(img, '_blank');
            };
            imgDiv.appendChild(imgEl);
        });

        chatBody.appendChild(imgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Lead capture
    function attemptLeadCapture() {
        if (leadCaptured || conversationCount < 3) return;

        setTimeout(() => {
            addMessage("By the way, would you like us to give you a call back about reservations or events? 📞");
            leadCaptured = true;
        }, 2000);
    }

    // Send message
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        addMessage(message, true);
        chatInput.value = '';

        // Check for image request
        const imageCategory = detectImageRequest(message);
        if (imageCategory) {
            const typing = showTyping();
            setTimeout(() => {
                chatBody.removeChild(typing);
                addMessage(`Here are some ${imageCategory} items! 😋`);
                showImages(imageCategory);
            }, 1000);
            return;
        }

        // Show typing indicator
        const typing = showTyping();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            const data = await response.json();

            // Remove typing indicator
            chatBody.removeChild(typing);

            if (data.reply) {
                addMessage(data.reply);

                // Attempt lead capture after meaningful conversation
                attemptLeadCapture();
            } else {
                addMessage("Something went wrong. Please try again.");
            }
        } catch (error) {
            chatBody.removeChild(typing);
            addMessage("Error connecting to server.");
            console.error(error);
        }
    }

    // Clear chat
    function clearChat() {
        if (confirm('Clear chat history?')) {
            chatBody.innerHTML = '';
            conversationCount = 0;
            leadCaptured = false;
            initializeChat();
        }
    }

    // Initialize chat
    function initializeChat() {
        setTimeout(() => {
            addMessage(getGreeting());
            setTimeout(() => {
                addSuggestions();
                addCTAButtons();
            }, 500);
        }, 500);
    }

    // Event listeners
    chatToggle.addEventListener('click', () => {
        chatWidget.classList.toggle('active');
        if (chatWidget.classList.contains('active')) {
            setTimeout(() => chatInput.focus(), 300);
        }
    });

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Add clear button
    const chatHeader = document.querySelector('.chat-header');
    const clearBtn = document.createElement('button');
    clearBtn.classList.add('clear-chat-btn');
    clearBtn.innerHTML = '<i class="fas fa-trash"></i>';
    clearBtn.title = 'Clear chat';
    clearBtn.onclick = clearChat;
    chatHeader.appendChild(clearBtn);

    // Initialize on load
    initializeChat();
});
