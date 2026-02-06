const { spawn } = require('child_process');
const path = require('path');

// Colors for output
const colors = {
    reset: '\x1b[0m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m'
};

function startProcess(command, args, name, color) {
    const proc = spawn(command, args, {
        stdio: 'pipe',
        shell: true,
        cwd: process.cwd(),
        env: { ...process.env, FORCE_COLOR: 'true' }
    });

    proc.stdout.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                console.log(`${color}[${name}]${colors.reset} ${line}`);
            }
        });
    });

    proc.stderr.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                console.error(`${color}[${name}]${colors.red} ${line}${colors.reset}`);
            }
        });
    });

    proc.on('close', (code) => {
        if (code !== 0) {
            console.log(`${color}[${name}] process exited with code ${code}${colors.reset}`);
        }
    });

    return proc;
}

console.log(`${colors.cyan}Starting EngageHub development environment...${colors.reset}`);

// Start API Server
const apiServer = startProcess('node', ['api-server.cjs'], 'API', colors.yellow);

// Start Vite
const vite = startProcess('npm', ['run', 'dev'], 'WEB', colors.green);

// Handle termination
process.on('SIGINT', () => {
    console.log(`\n${colors.cyan}Shutting down...${colors.reset}`);
    apiServer.kill();
    vite.kill();
    process.exit();
});
