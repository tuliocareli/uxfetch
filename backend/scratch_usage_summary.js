const fs = require('fs');
const readline = require('readline');

async function processLog() {
    const logPath = 'C:\\Users\\Tulio\\.gemini\\antigravity-ide\\brain\\ebd1790f-5503-4be7-a352-37324e811ffa\\.system_generated\\logs\\transcript.jsonl';
    
    if (!fs.existsSync(logPath)) {
        console.error('Log file not found at:', logPath);
        return;
    }
    
    const fileStream = fs.createReadStream(logPath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    
    let totalSteps = 0;
    let userMessagesCount = 0;
    let modelSteps = 0;
    let systemSteps = 0;
    
    const toolCounts = {};
    const filesModified = new Set();
    const filesCreated = new Set();
    
    const userRequests = [];
    
    for await (const line of rl) {
        if (!line.trim()) continue;
        try {
            const step = JSON.parse(line);
            totalSteps++;
            
            if (step.source === 'USER_EXPLICIT' || step.type === 'USER_INPUT') {
                userMessagesCount++;
                if (step.content) {
                    userRequests.push(step.content.trim());
                }
            } else if (step.source === 'MODEL') {
                modelSteps++;
            } else if (step.source === 'SYSTEM') {
                systemSteps++;
            }
            
            // Count tools
            if (step.tool_calls && Array.isArray(step.tool_calls)) {
                for (const tc of step.tool_calls) {
                    const name = tc.name || tc.ToolName || 'unknown';
                    toolCounts[name] = (toolCounts[name] || 0) + 1;
                    
                    // Track written or modified files if possible
                    if (name === 'write_to_file' || name === 'replace_file_content' || name === 'multi_replace_file_content') {
                        const file = tc.arguments?.TargetFile || tc.arguments?.TargetFile || 'unknown';
                        if (file !== 'unknown') {
                            if (name === 'write_to_file' && !tc.arguments?.Overwrite) {
                                filesCreated.add(file);
                            } else {
                                filesModified.add(file);
                            }
                        }
                    }
                }
            }
        } catch (e) {
            // Ignore parse errors on single lines
        }
    }
    
    console.log('--- ANTIGRAVITY USAGE REPORT ---');
    console.log(`Total Steps in Log: ${totalSteps}`);
    console.log(`User Requests Received: ${userMessagesCount}`);
    console.log(`Model Response Iterations: ${modelSteps}`);
    console.log(`System Triggers & Executions: ${systemSteps}`);
    console.log('\n--- TOOL EXECUTION COUNTS ---');
    for (const [tool, count] of Object.entries(toolCounts)) {
        console.log(`  ${tool}: ${count}`);
    }
    
    console.log('\n--- UNIQUE USER REQUEST HISTORY ---');
    userRequests.forEach((req, idx) => {
        // truncate long requests
        const trunc = req.length > 80 ? req.substring(0, 80) + '...' : req;
        console.log(`  ${idx + 1}. "${trunc.replace(/\n/g, ' ')}"`);
    });
}

processLog().catch(console.error);
