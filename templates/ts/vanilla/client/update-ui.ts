const updateUI = (messages: any[]) => {
  const messagesList = document.getElementsByClassName('messagesList')[0]
  const oldMessagesLength = messagesList.childNodes.length
  const newMessages = messages.slice(oldMessagesLength)

  for (const { userName, message } of newMessages) {
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

export default updateUI
