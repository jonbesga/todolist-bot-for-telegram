const TelegramBot = require('node-telegram-bot-api')

if(process.env.NODE_ENV != 'production'){
  require('dotenv').config();
}

const TOKEN = process.env.TOKEN || '';
const WEBHOOK_URL = process.env.WEBHOOK_URL || '';

const options = {
  webHook: {
  }
};

const LIST = {}
const TASK_ARRAY = [];
const SYMBOLS = {
  'todo': '❌',
  'done': '✅'
}
const bot = new TelegramBot(TOKEN, options);
bot.setWebHook(`${WEBHOOK_URL}/bot${TOKEN}`);

bot.on('message', (message) => {
  console.log(message)
  
  if(message.new_chat_members){
    if(message.new_chat_members[0] && message.new_chat_members[0].username == 'MakeThatBot'){
      helpMessage(message)
    }
  }
});

const taskDone = (listObject, id) => {
  if(id <= listObject['tasks'].length){
    listObject['tasks'][id - 1]['status'] = 'done'
    updateTaskList(listObject)
  }
}

const updateTaskList = (listObject) => {
  

  const messageOptions = {
    chat_id: listObject.chat_id,
    message_id: listObject.message_id,
    parse_mode: 'Markdown'
  }
  let text = `${listObject.name}\n`
  for([index, task] of listObject.tasks.entries()){
    
    let author = task.firstName
    if(task.username){
      author = `@${task.username}`
    }
    
    text += `${index + 1}. ${task.name} by ${author} [${SYMBOLS[task.status]}]\n`
  }

  bot.editMessageText(text, messageOptions)
}

const helpMessage = (message) => {
  text = '*How to use this bot*\n' +
  'To create a list: _@MyTestingPlaygroundBot create #<list name>_\n' +
  'To add a task to a list: _/a #<list name> <task>_\n' +
  'To mark a task as done: _/d #<list name> <number>_'
  bot.sendMessage(message.chat.id, text, { parse_mode: 'Markdown'})
}

bot.on('text', (message) => {
  if(message.text.startsWith('/help')){
    helpMessage(message)
  }
  else if(message.text.startsWith('@MyTestingPlaygroundBot create #')){
    const listName = message.text.split('@MyTestingPlaygroundBot create #').pop()
    
    bot.sendMessage(message.chat.id, `Hey, I will update this message with the tasks for #${listName} list`)
    .then((response) => {
      LIST[listName] = {
        name: `#${listName}`,
        tasks: [],
        chat_id: response.chat.id,
        message_id: response.message_id
      }
    })
  }
  else if(message.text.startsWith('/a #')){
    const params = message.text.split('/a #').pop()
    nameAndTask = params.split(' ')
    const nameList = nameAndTask.shift()
    const task = nameAndTask.join(' ')
    
    
    if(!task){ return; }

    LIST[nameList]['tasks'].push({
      name: `${task}`,
      status: 'todo',
      username: message.from.username || '',
      firstName: message.from.first_name
    })

    updateTaskList(LIST[nameList])
    bot.deleteMessage(message.chat.id, message.message_id)
    
  }
  else if(message.text.startsWith('/d #')){
    const params = message.text.split('/d #').pop()
    const nameAndId = params.split(' ')
    const nameList = nameAndId.shift()
    const id = parseInt(nameAndId[0])
    if(!isNaN(id)){
      taskDone(LIST[nameList], id)
    }
    bot.deleteMessage(message.chat.id, message.message_id)
  }
  
})

console.log('Playground started!');