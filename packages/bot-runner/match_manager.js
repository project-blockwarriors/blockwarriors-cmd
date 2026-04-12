const { spawn } = require('child_process'); // Use 'spawn' instead of 'exec' for better control
const path = require('path');

function spawnBot(matchId, username, localCodePath) {
    const containerName = `${matchId}_${username}_${Date.now()}`;

    // Note: We removed the --rm flag so we can inspect it, 
    // but we will manually delete it when it finishes.
    const dockerArgs = [
        'run',
        '--name', containerName,
        '--network', 'host',
        '--cpus', '0.5',
        '--memory', '512m',
        '-e', 'MC_HOST=hteng.blockwarriors.ai',
        '-e', 'MC_PORT=25568',
        '-e', `BOT_USERNAME=${username}`,
        '-e', 'USER_CODE_PATH=/app/user_code.js',
        '-v', `${localCodePath}:/app/user_code.js:ro`,
        'blockwarriors-bot'
    ];

    console.log(`[${username}] Spawning bot...`);

    // Start the Docker process
    const subprocess = spawn('docker', dockerArgs);

    // 1. LISTEN FOR THE END
    // This event fires when the Docker container stops running 
    // (e.g. server stops, bot gets kicked, or match ends)
    subprocess.on('close', (code) => {
        console.log(`[${username}] Bot disconnected (Exit Code: ${code}).`);
        deleteContainer(containerName);
    });

    // Optional: Stream logs so you can see what's happening
    subprocess.stdout.on('data', (data) => {
        console.log(`[${username} Log]: ${data.toString().trim()}`);
    });
}

// 2. THE CLEANUP FUNCTION
function deleteContainer(containerName) {
    console.log(`[System] Deleting container: ${containerName}...`);
    
    // Run 'docker rm' to remove the stopped container
    const cleanup = spawn('docker', ['rm', '-f', containerName]);
    
    cleanup.on('close', () => {
        console.log(`[System] Trash collected: ${containerName} deleted.`);
    });
}

module.exports = { spawnBot };