import "dotenv/config";
import { ConvexClient } from "convex/browser";
import { exec } from "child_process";
import path from "path";

export function startConvexListener() {
    const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!convexUrl) {
        console.error("❌ Missing CONVEX_URL in .env file! Convex listener will not start.");
        return;
    }

    console.log("🤖 Convex Listener starting up...");
    console.log(`🔗 Connected to Convex: ${convexUrl}`);
    console.log("📡 Listening for 'Queuing' matches...");

    const client = new ConvexClient(convexUrl);

    client.onUpdate("matches:getReadyMatches" as any, {}, (matches: any[]) => {
        if (!matches || matches.length === 0) return;

        console.log(`\n🎉 BINGO! The Orchestrator "heard" ${matches.length} match(es) in the queue!`);

        matches.forEach((match) => {
            console.log(`- Match ID: ${match._id}`);

            const sampleCodePath = path.resolve("../bot-runner/sample_bot.js");

            // 1. Define BOTH commands
            const blueCommand = `docker run -d --rm --name ${match._id}_BlueBot --network host -e MC_HOST=hteng.blockwarriors.ai -e MC_PORT=25568 -e BOT_USERNAME=BlueBot -e USER_CODE_PATH=/app/user_code.js -v "${sampleCodePath}:/app/user_code.js:ro" blockwarriors-bot`;

            const redCommand = `docker run -d --rm --name ${match._id}_RedBot --network host -e MC_HOST=hteng.blockwarriors.ai -e MC_PORT=25568 -e BOT_USERNAME=RedBot -e USER_CODE_PATH=/app/user_code.js -v "${sampleCodePath}:/app/user_code.js:ro" blockwarriors-bot`;

            client.mutation("matches:updateStatus" as any, {
                matchId: match._id,
                status: "Running"
            })
                .then(() => console.log(`✅ Convex status updated to 'Running'`))
                .catch((err) => console.error("❌ Failed to update Convex status:", err));

            // 2. Spawn Blue Bot
            console.log(`🚀 Spawning Blue Bot...`);
            exec(blueCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error(`❌ Blue Bot Spawn Failed:`, error.message);
                    return;
                }
                console.log(`✅ Blue Bot started! ID: ${stdout.substring(0, 12)}`);
            });

            // 3. Spawn Red Bot (with a 1-second delay to stagger the logins)
            setTimeout(() => {
                console.log(`🚀 Spawning Red Bot...`);
                exec(redCommand, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`❌ Red Bot Spawn Failed:`, error.message);
                        return;
                    }
                    console.log(`✅ Red Bot started! ID: ${stdout.substring(0, 12)}`);
                });
            }, 5000);

        });
    });
}