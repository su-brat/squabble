const socket = io()

const messages = document.getElementById('messages')
const form = document.getElementById('form')
const input = document.getElementById('input')

socket.on('message', function(msg) {
    const item = document.createElement('li')
    let [message, user] = msg.split(':::')
    if (user)
        item.innerHTML = `<span class="text-secondary"><strong>${user}:</strong></span> ${message}`
    else
        item.innerHTML = `<span class="text-secondary"><em>${message}</em></span>`
    messages.appendChild(item)
    window.scrollTo(0, document.body.scrollHeight)
})

const sendMsg = (key, data) => socket.emit(key, data)

sendMsg('join-room', { username, room })

form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
        sendMsg('message', input.value)
        input.value = ''
    }
})