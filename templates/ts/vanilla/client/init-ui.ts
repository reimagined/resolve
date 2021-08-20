const initUI = (messages: any[], sendMessage: Function) => {
  const container = document.createElement('div')
  container.setAttribute('class', 'container')
  document.body.appendChild(container)

  const messagesList = document.createElement('div')
  messagesList.setAttribute('class', 'messagesList')
  container.appendChild(messagesList)

  const userName = document.createElement('input')
  userName.setAttribute('type', 'text')
  userName.setAttribute('class', 'userName')
  userName.setAttribute('placeholder', 'User name')
  container.appendChild(userName)

  const newMessage = document.createElement('input')
  newMessage.setAttribute('type', 'text')
  newMessage.setAttribute('class', 'newMessage')
  newMessage.setAttribute('placeholder', 'Message')
  container.appendChild(newMessage)

  newMessage.onkeypress = (e) => {
    if (e.charCode !== 13) return
    sendMessage(userName.value, newMessage.value)
    newMessage.value = ''
    userName.value = ''

    e.preventDefault()
    e.stopPropagation()
  }

  for (const { userName, message } of messages) {
    const currentMessage = document.createElement('div')
    currentMessage.setAttribute('class', 'currentMessage')
    messagesList.appendChild(currentMessage)

    const currentMessageUsername = document.createElement('span')
    currentMessageUsername.setAttribute('class', 'currentMessageUsername')
    currentMessage.appendChild(currentMessageUsername)

    const currentMessageText = document.createElement('div')
    currentMessageText.setAttribute('class', 'currentMessageText')
    currentMessage.appendChild(currentMessageText)

    currentMessageUsername.innerText = userName
    currentMessageText.innerText = message
  }
}

export default initUI
