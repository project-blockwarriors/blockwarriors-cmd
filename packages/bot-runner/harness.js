const mineflayer = require('mineflayer');

// 1. Get connection details from Environment Variables (set by the server later)
const bot = mineflayer.createBot({
  host: process.env.MC_HOST || 'hteng.blockwarriors.ai', // get from MCPanel
  port: parseInt(process.env.MC_PORT) || 25568,
  username: process.env.BOT_USERNAME || 'PlayerBot',
  version: '1.20.6' // Lock the version to match our server
});

bot.on('spawn', () => {
  console.log('[System] Bot connected. Loading user logic...');
  try {
    // 1. Define the path FIRST
    const userPath = process.env.USER_CODE_PATH || './sample_bot.js';

    // 2. THEN require the module using that path
    const userModule = require(userPath);

    // 3. Execute the user's code
    // (Handling both the new onStart style and the old function style)
    if (userModule.onStart) {
      userModule.onStart(bot);
    } else if (typeof userModule === 'function') {
      userModule(bot);
    }

    console.log('[System] User logic injected successfully.');
  } catch (err) {
    console.error('[System] CRITICAL: User code crashed the interface!');
    console.error(err);
  }
});


bot.on('error', (err) => console.log(`[System] Error: ${err.message}`));


// Import the readline module (built into Node.js)
const readline = require('readline');

// Create an interface to read from the terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Listen for lines of text you type
rl.on('line', (input) => {
  if (bot) {
    // Send your text to the Minecraft chat
    bot.chat(input);
    console.log(`[Sent] ${input}`);
  }
});

// Optional: Log chat messages coming FROM the server so you can see replies
bot.on('message', (message) => {
  // message.toAnsi() colors the text just like in the real game!
  console.log(message.toAnsi());
});

/**
 * docker run -it -e MC_HOST=hteng.blockwarriors.ai -e MC_PORT=25568 -e BOT_USERNAME=DockerBot -e USER_CODE_PATH=/app/dummy_code.js blockwarriors-bot
 */