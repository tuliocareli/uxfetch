const fs = require('fs');

const lines = fs.readFileSync('C:\\Users\\Tulio\\.gemini\\antigravity-ide\\brain\\ebd1790f-5503-4be7-a352-37324e811ffa\\.system_generated\\logs\\transcript.jsonl', 'utf-8').split('\n');

for (const line of lines) {
    if (!line) continue;
    try {
        const data = JSON.parse(line);
        if (data.tool_calls) {
            for (const call of data.tool_calls) {
                if (call.name === 'write_to_file' || call.name === 'replace_file_content') {
                    if (JSON.stringify(call.arguments).includes('implementation_plan.md')) {
                        console.log('FOUND TOOL CALL:', call.name);
                        console.log(call.arguments.CodeContent ? call.arguments.CodeContent.substring(0, 100) : 'No CodeContent');
                    }
                }
            }
        }
    } catch (e) {}
}
