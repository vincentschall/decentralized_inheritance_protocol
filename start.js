import { spawn } from "child_process";
import fs from "fs";
import path from "path";

function run(command, args, options = {}) {
    const child = spawn(command, args, { stdio: "inherit", shell: true, ...options });
    return child;
}

console.log("Starting Hardhat node...");
const hardhat = spawn("npx", ["hardhat", "node"], {
    cwd: "contract",
    shell: true,
    stdio: "inherit"
});

// Handle CTRL+C to cleanly exit
process.on("SIGINT", () => {
    console.log("\nStopping Hardhat node...");
    hardhat.kill("SIGTERM");
    process.exit();
});

// Give the node a few seconds to boot
setTimeout(() => {
    console.log("Running auto-deploy script (checks if contracts exist before deploying)...");
    const deploy = run("npx", ["hardhat", "run", "scripts/auto-deploy.js", "--network", "localhost"], {
        cwd: "contract",
    });

    deploy.on("close", (code) => {
        if (code !== 0) {
            console.error(`Deploy script failed with exit code ${code}`);
            process.exit(code);
        }

        // Copy deployment-info.json to frontend
        try {
            const sourcePath = path.join("contract", "deployment-info.json");
            const destPath = path.join("client", "public", "deployment-info.json");
            const publicDir = path.join("client", "public");

            if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir, { recursive: true });
            }

            fs.copyFileSync(sourcePath, destPath);
            console.log("✓ Copied deployment-info.json to client/public/");
        } catch (error) {
            console.error("Failed to copy deployment-info.json:", error.message);
        }

        // Optionally start frontend (uncomment below)
        // console.log("Starting frontend...");
        // run("npm", ["start"], { cwd: "client" });
    });
}, 5000);
