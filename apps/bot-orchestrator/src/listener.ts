import "dotenv/config";
import { ConvexClient } from "convex/browser";
import { exec } from "child_process";
import path from "path";


const activeContainers: string[] = [];
const activeMatchIds = new Set<string>();
let convexClient: ConvexClient | null = null;

export function startConvexListener() {
    const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!convexUrl) {
        console.error("❌ Missing CONVEX_URL in .env file! Convex listener will not start.");
        return;
    }

    console.log("🤖 Convex Listener starting up...");
    console.log(`🔗 Connected to Convex: ${convexUrl}`);
    console.log("📡 Listening for 'Queuing' matches...");

    convexClient = new ConvexClient(convexUrl);

    convexClient.onUpdate("matches:getReadyMatches" as any, {}, (matches: any[]) => {
        if (!matches || matches.length === 0) return;

        console.log(`\n🎉 BINGO! The Orchestrator "heard" ${matches.length} match(es) in the queue!`);

        matches.forEach((match) => {
            console.log(`- Match ID: ${match._id}`);

            const sampleCodePath = path.resolve("../bot-runner/sample_bot.js");

            const blueName = `${match._id}_BlueBot`;
            const redName = `${match._id}_RedBot`;

            // Store names for cleanup later
            activeContainers.push(blueName, redName);
            activeMatchIds.add(match._id);

            const blueCommand = `docker run -d --rm --name ${blueName} --network host -e MC_HOST=hteng.blockwarriors.ai -e MC_PORT=25568 -e BOT_USERNAME=BlueBot -e USER_CODE_PATH=/app/user_code.js -v "${sampleCodePath}:/app/user_code.js:ro" blockwarriors-bot`;
            const redCommand = `docker run -d --rm --name ${redName} --network host -e MC_HOST=hteng.blockwarriors.ai -e MC_PORT=25568 -e BOT_USERNAME=RedBot -e USER_CODE_PATH=/app/user_code.js -v "${sampleCodePath}:/app/user_code.js:ro" blockwarriors-bot`;

            if (convexClient) {
                convexClient.mutation("matches:updateStatus" as any, {
                    matchId: match._id,
                    status: "Running"
                })
                    .then(() => console.log(`✅ Convex status updated to 'Running'`))
                    .catch((err) => console.error("❌ Failed to update Convex status:", err));
            }

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

// 2. The Cleanup Function
async function cleanup() {
    if (activeContainers.length === 0 && activeMatchIds.size === 0) process.exit();

    console.log(`\n🛑 Shutting down... Processing cleanup...`);

    // 1. Reset match statuses to 'Waiting'
    if (activeMatchIds.size > 0 && convexClient) {
        console.log(`🔄 Resetting ${activeMatchIds.size} active match(es) to 'Waiting'...`);
        const updatePromises = Array.from(activeMatchIds).map((matchId) =>
            convexClient!.mutation("matches:updateStatus" as any, {
                matchId: matchId,
                status: "Waiting"
            })
                .then(() => console.log(`✅ Match ${matchId} reset to 'Waiting'`))
                .catch((err) => console.error(`❌ Failed to reset match ${matchId}:`, err))
        );
        await Promise.allSettled(updatePromises);
    }

    // 2. Kill containers
    if (activeContainers.length > 0) {
        console.log(`💀 Killing ${activeContainers.length} active bot containers...`);
        const names = activeContainers.join(" ");
        exec(`docker kill ${names}`, () => {
            console.log("✅ All bot containers stopped.");
            process.exit();
        });
    } else {
        process.exit();
    }
}

// 3. Listen for Ctrl+C (SIGINT) and terminal close (SIGTERM)
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);