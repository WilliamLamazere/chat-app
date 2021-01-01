const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $locationButon = document.querySelector('#send-location')
const $messageFormInput = document.querySelector('input')
const $messageFormButton = document.querySelector('button')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate_1 = document.querySelector('#message-template_1').innerHTML
const messageTemplate_2 = document.querySelector('#message-template_2').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild
    
    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeigth = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // how far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeigth

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

// the client receives the message sent from one of the other clients
socket.on('message', (message) => {
    console.log(message)
    // {message} below refers to the dynamic value in the html file, shorthand syntax also
    const html = Mustache.render(messageTemplate_1, {
        username: message.username,
        message: message.text,
        // moment library needed to show human-readable time, and not that 12 digit timestamp
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate_2, {
        username:message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })

    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    document.querySelector('#sidebar').innerHTML = html

} )

$messageForm.addEventListener('submit', (e) => {
    //client-side code uses `on` to listen for the event
    
    // so that the input text does not disappear
    e.preventDefault()

    $messageFormButton.setAttribute('disabled','disabled')

    //would have worked --> const message = document.querySelector('input').value
    // issue is when multiple input are in the same form, following is safer
    const message = e.target.elements.message.value

    // client-side code also uses emit to send the sendMessage event. 
    // we can provide a third arg to emit, a function to run when the event is acknoledged
    socket.emit('sendMessage',message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('message delivered!')

    })
    
})

$locationButon.addEventListener('click', () => {
    
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

    $locationButon.setAttribute('disabled','disabled')

    // getCurrentPosition() still does not support promises
    navigator.geolocation.getCurrentPosition((position) => {
        
        const locationCoords = {
            lat : position.coords.latitude,
            long : position.coords.longitude
        }

        socket.emit('sendLocation', locationCoords, () => {
            
            $locationButon.removeAttribute('disabled')

            console.log('location has been shared!')
        }) 
    })

})

socket.emit('join', {username, room}, (error) => {
    if (error) {
        alert(error)
        // will send back to the root of the website, the join page
        location.href = '/'
    }
})