
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

    chatToggle.addEventListener('click', () => {
        chatWidget.classList.toggle('active');
        // Focus input when opened
        if (chatWidget.classList.contains('active')) {
            setTimeout(() => chatInput.focus(), 300);
        }
    });

    function addMessage(text, isUser = false) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', isUser ? 'user-msg' : 'bot-msg');
        msgDiv.textContent = text;
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        addMessage(message, true);
        chatInput.value = '';

        // Show loading indicator
        const loaderDiv = document.createElement('div');
        loaderDiv.classList.add('message', 'bot-msg');
        loaderDiv.innerHTML = '<div class="loader"></div>';
        chatBody.appendChild(loaderDiv);
        chatBody.scrollTop = chatBody.scrollHeight;

        try {
            // Note: In a real deployment, this URL should point to your Worker
            // For local dev with `wrangler dev`, it might be http://localhost:8787/api/chat
            // Using a relative path assuming served from same origin or configured proxy
            const response = await fetch('/api/chat', { // Updated to hit the worker route
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            const data = await response.json();

            // Remove loader
            chatBody.removeChild(loaderDiv);

            if (data.reply) {
                addMessage(data.reply);
            } else {
                addMessage("Something went wrong. Please try again.");
            }
        } catch (error) {
            chatBody.removeChild(loaderDiv);
            addMessage("Error connecting to server.");
            console.error(error);
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Initial Bot Greeting
    setTimeout(() => {
        addMessage("Hey there! Welcome to Ducks and Drakes. Need hours, menu info, or want to book a pool table?");
    }, 1000);
});
