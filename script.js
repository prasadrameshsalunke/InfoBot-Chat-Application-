document.getElementById('send-button').addEventListener('click', sendMessage);

document.getElementById('message-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const messageText = messageInput.value.trim();

    if (messageText !== '') {
        appendMessage('You', messageText, 'user');
        messageInput.value = '';
        messageInput.focus();
        
        const reply = await fetchResponse(messageText);
        appendMessage('Bot', reply, 'bot', true);  // Use HTML content for the bot reply
    }
}

function appendMessage(sender, text, senderClass, isHtml = false) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', senderClass);
    
    const textElement = document.createElement('span');
    textElement.classList.add('text');
    textElement.setAttribute('data-sender', sender);

    if (isHtml) {
        typeWriterEffect(textElement, text, true);
    } else {
        typeWriterEffect(textElement, text, false);
    }

    messageElement.appendChild(textElement);
    document.getElementById('messages').appendChild(messageElement);
    document.getElementById('chat-box').scrollTop = document.getElementById('chat-box').scrollHeight;  // Auto-scroll to bottom
}

function typeWriterEffect(element, text, isHtml) {
    let i = 0;
    let isTag = false;
    let tagBuffer = '';

    function type() {
        if (i < text.length) {
            let char = text.charAt(i);
            if (char === '<') {
                isTag = true;
            }

            if (isTag) {
                tagBuffer += char;
            } else {
                if (isHtml) {
                    element.innerHTML += char;
                } else {
                    element.innerText += char;
                }
            }

            if (char === '>') {
                isTag = false;
                if (isHtml) {
                    element.innerHTML += tagBuffer;
                } else {
                    element.innerText += tagBuffer;
                }
                tagBuffer = '';
            }

            i++;
            setTimeout(type, isTag ? 0 : 10);  // Adjust typing speed; no delay inside HTML tags
        }
    }

    type();
}

function cleanQuery(query) {
    return query.replace(/[^\w\s]/gi, '').trim().toLowerCase();
}

async function fetchResponse(query) {
    // Special case handling for specific questions
    if (query.toLowerCase().includes("today's date") || query.toLowerCase().includes("current date") || query.toLowerCase().includes("todays date")) {
        const today = new Date();
        const dateString = today.toDateString();
        return `Today's date is ${dateString}.`;
    }
    
    if (query.toLowerCase().includes("current time") || query.toLowerCase().includes("time now") || query.toLowerCase().includes("now time")) {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        return `The current time is ${timeString}.`;
    }

    try {
        let cleanedQuery = cleanQuery(query);
        console.log(`Cleaned Query: ${cleanedQuery}`);

        let response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanedQuery)}&utf8=&format=json&origin=*`);
        let data = await response.json();
        
        if (data.query.search.length === 0) {
            return 'Sorry, I couldn\'t find any information on that topic.';
        }

        const pageTitle = data.query.search[0].title;
        console.log(`Page Title: ${pageTitle}`);

        response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`);
        data = await response.json();

        if (data.type === "standard" && data.extract) {
            let content = `<strong>${data.title}</strong><br>${data.extract}`;

            if (data.thumbnail && data.thumbnail.source) {
                content += `<br><img src="${data.thumbnail.source}" alt="${data.title}">`;
            }

            if (data.extract_html) {
                content += `<br>${data.extract_html}`;
            }

            return content;
        } else if (data.type === "disambiguation") {
            return 'This query is ambiguous. Please provide more specific information.';
        } else if (data.title && data.title === "Not found.") {
            return 'Sorry, I couldn\'t find any information on that topic.';
        } else if (data.title && data.description) {
            return `${data.title}: ${data.description}`;
        } else {
            return 'Sorry, I couldn\'t find any information on that topic.';
        }
    } catch (error) {
        console.error('Error fetching Wikipedia summary:', error);  // Log errors for debugging
        return 'Sorry, I couldn\'t fetch the information. Please try again later.';
    }
}
