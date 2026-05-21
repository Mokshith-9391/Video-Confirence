import { spawn } from 'child_process';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve current directory path for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MeetingAgentManager {
    constructor() {
        this.agents = new Map(); // Maps roomId -> agentSession object
    }

    /**
     * Spawns a persistent python agent in a sandbox environment for a new meeting room
     * @param {string} roomId - The unique meeting room ID
     * @param {Function} onActionItem - Callback function when a new action item is detected
     */
    initRoomAgent(roomId, onActionItem) {
        if (this.agents.has(roomId)) {
            console.log(`[MeetingAgentManager] Agent session already running for room: ${roomId}`);
            return;
        }

        console.log(`[MeetingAgentManager] Initializing sandbox agent for room: ${roomId}`);

        // Resolve absolute path to the python script
        const scriptPath = path.resolve(__dirname, '../agents/meeting_agent.py');
        
        // Spawn the background Python process
        const agentProcess = spawn('python', [scriptPath]);

        // Interface to read stdout line by line
        const rl = readline.createInterface({
            input: agentProcess.stdout,
            terminal: false
        });

        let resolveSummary;
        const summaryPromise = new Promise((resolve) => {
            resolveSummary = resolve;
        });

        // Listen to stdout lines for JSON packets emitted by the Python agent
        rl.on('line', (line) => {
            try {
                const packet = JSON.parse(line);
                if (packet.event === 'action_item') {
                    const session = this.agents.get(roomId);
                    if (session && session.actionItems) {
                        session.actionItems.push(packet.data);
                    }
                    onActionItem(roomId, packet.data);
                } else if (packet.event === 'summary') {
                    resolveSummary(packet.data);
                }
            } catch (err) {
                // Ignore non-JSON logs (e.g. general Python logs)
                console.log(`[Python Log - Room ${roomId}]: ${line}`);
            }
        });

        // Capture error logs from the child process
        agentProcess.stderr.on('data', (data) => {
            console.error(`[Agent ${roomId} Stderr]: ${data.toString().trim()}`);
        });

        // Clean up when the process closes
        agentProcess.on('close', (code) => {
            console.log(`[MeetingAgentManager] Agent process for room ${roomId} exited with code ${code}`);
            this.agents.delete(roomId);
        });

        this.agents.set(roomId, {
            process: agentProcess,
            rl: rl,
            summaryPromise,
            resolveSummary,
            actionItems: []
        });
    }

    /**
     * Streams transcription text chunk to the room's agent
     * @param {string} roomId 
     * @param {string} speaker 
     * @param {string} text 
     */
    feedTranscription(roomId, speaker, text) {
        const session = this.agents.get(roomId);
        if (!session) {
            console.warn(`[MeetingAgentManager] Attempted to feed transcription, but no agent running for room: ${roomId}`);
            return;
        }

        const payload = JSON.stringify({ speaker, text });
        session.process.stdin.write(payload + '\n');
    }

    /**
     * Command the agent to generate final meeting summary, and clean up the process
     * @param {string} roomId 
     * @returns {Promise<string>} Structured Markdown summary of the meeting
     */
    async closeRoomAgent(roomId) {
        const session = this.agents.get(roomId);
        if (!session) {
            return { summary: 'No active agent session was found for this room.', actionItems: [] };
        }

        console.log(`[MeetingAgentManager] Generating summary & closing sandbox agent for room: ${roomId}`);

        try {
            // Write the close command to prompt final summary generation
            const closeCommand = JSON.stringify({ command: 'close' });
            session.process.stdin.write(closeCommand + '\n');

            // Await the summary from stdout
            const summary = await session.summaryPromise;
            const actionItems = session.actionItems || [];
            
            // Clean up and close writing pipe
            session.process.stdin.end();
            return { summary, actionItems };
        } catch (err) {
            console.error(`[MeetingAgentManager] Error summarizing room ${roomId}:`, err);
            session.process.kill();
            return { summary: 'Error generating meeting summary.', actionItems: session.actionItems || [] };
        }
    }
}

export const meetingAgentManager = new MeetingAgentManager();
