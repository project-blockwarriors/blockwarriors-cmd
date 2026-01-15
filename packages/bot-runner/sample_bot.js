// This is what a user uploads
module.exports = function(bot) {
    bot.on('chat', (username, message) => {
        if (username === 'admin') bot.chat('I am ready to fight!');
    });
    
    // Simple logic: Look at nearest player
    setInterval(() => {
        const player = bot.nearestEntity((e) => e.type === 'player');
        if (player) bot.lookAt(player.position.offset(0, 1.6, 0));
    }, 1000);
}