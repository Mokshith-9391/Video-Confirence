import sys
import json
import asyncio
import re

try:
    from google.antigravity import Agent, LocalAgentConfig
    HAS_ANTIGRAVITY = True
except (ImportError, ModuleNotFoundError):
    HAS_ANTIGRAVITY = False

def extract_heuristic_action_items(speaker, text):
    sentences = re.split(r'[.!?]+', text)
    items = []
    triggers = [
        r'\bwill\b', r'\bneed to\b', r'\bneeds to\b', r'\bshould\b',
        r'\bmust\b', r'\bplease\b', r'\blet\'s\b', r'\blets\b',
        r'\bto-do\b', r'\btodo\b', r'\baction item\b'
    ]
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        
        matched = False
        for trigger in triggers:
            if re.search(trigger, sentence, re.IGNORECASE):
                matched = True
                break
        
        if matched:
            assignee = speaker
            name_match = re.search(r'\b([A-Z][a-z]+)\b\s+(?:will|needs to|should|must|please)', sentence)
            if name_match:
                assignee = name_match.group(1)
            elif re.search(r'\b(we|let\'s|lets)\b', sentence, re.IGNORECASE):
                assignee = "Team"
            elif re.search(r'\b(i|i\'ll|i will)\b', sentence, re.IGNORECASE):
                assignee = speaker
                
            task = sentence
            clean_match = re.search(r'(?:will|need to|needs to|should|must|please|let\'s|lets|todo|to-do)\s+(.*)', sentence, re.IGNORECASE)
            if clean_match:
                task = clean_match.group(1).strip()
                if task:
                    task = task[0].upper() + task[1:]
            else:
                task = re.sub(r'^(?:John|Sarah|Mike|Emma|I|We|You|They|He|She),?\s+', '', task)
            
            if len(task) > 3:
                items.append({
                    "assignee": assignee,
                    "task": task,
                    "raw_text": sentence
                })
    return items

if not HAS_ANTIGRAVITY:
    class LocalAgentConfig:
        def __init__(self, **kwargs):
            pass

    class FallbackResponse:
        def __init__(self, text_content):
            self._text = text_content

        async def text(self):
            return self._text

    class Agent:
        def __init__(self, config=None, model_name=None):
            self.config = config
            self.model_name = model_name
            self.history = []

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

        async def chat(self, prompt):
            self.history.append(prompt)
            if "generate a final, structured summary" in prompt.lower():
                transcript_lines = []
                detected_items = []
                for p in self.history:
                    match = re.search(r"New transcription chunk:\n\[(.*?)\]: (.*)\n\n", p)
                    if match:
                        spk = match.group(1)
                        txt = match.group(2)
                        transcript_lines.append(f"- **{spk}**: {txt}")
                        items = extract_heuristic_action_items(spk, txt)
                        detected_items.extend(items)
                
                summary = "# Meeting Summary\n\n"
                summary += "## Key Discussion Points\n"
                if transcript_lines:
                    summary += "The following statements were recorded during the session:\n\n"
                    summary += "\n".join(transcript_lines[:15])
                    if len(transcript_lines) > 15:
                        summary += f"\n- *... and {len(transcript_lines) - 15} more transcription segments.*"
                else:
                    summary += "No transcriptions were captured.\n"
                
                summary += "\n\n## Action Items & Assignments\n"
                if detected_items:
                    for idx, item in enumerate(detected_items, 1):
                        summary += f"{idx}. **{item['assignee']}** to {item['task']}\n   - *Context:* \"{item['raw_text']}\"\n"
                else:
                    summary += "No action items were detected.\n"
                
                summary += "\n\n*Summary generated dynamically by AI Meeting Agent.*"
                return FallbackResponse(summary)
            
            match = re.search(r"New transcription chunk:\n\[(.*?)\]: (.*)\n\n", prompt)
            if match:
                spk = match.group(1)
                txt = match.group(2)
                items = extract_heuristic_action_items(spk, txt)
                return FallbackResponse(json.dumps(items))
            
            return FallbackResponse("[]")

# Initialize Configuration for the Google Antigravity Agent
# We configure system instructions to instruct the agent to act as a real-time monitor
# and enable terminal sandboxing to run in a secure, isolated workspace environment.
config = LocalAgentConfig(
    system_instructions=(
        "You are a real-time Background Meeting Manager. Your job is to monitor a "
        "live stream of meeting transcriptions (formatted as JSON with speaker and text). "
        "You must continuously analyze the transcription chunks to extract actionable tasks "
        "and action items (e.g., 'John will do X' or 'Prepare the client report by Friday'). "
        "Whenever a new action item is identified, output it immediately in the specified JSON format. "
        "Only output new action items that were just agreed upon; do not repeat previously identified tasks. "
        "Respond ONLY with a JSON array or object event so that the host application can parse it."
    ),
    # Configures the runtime to run terminal tools and commands in a secure container sandbox
    enable_terminal_sandbox=True
)

async def read_stdin():
    """Asynchronously reads lines from standard input (stdin)"""
    loop = asyncio.get_event_loop()
    reader = asyncio.StreamReader()
    protocol = asyncio.StreamReaderProtocol(reader)
    await loop.connect_read_pipe(lambda: protocol, sys.stdin)
    return reader

async def main():
    reader = await read_stdin()
    
    # Instantiate the agent using the gemini-3.5-flash model
    async with Agent(config, model_name="gemini-3.5-flash") as agent:
        known_action_items = set()
        
        while True:
            line_bytes = await reader.readline()
            if not line_bytes:
                break
            
            line = line_bytes.decode('utf-8').strip()
            if not line:
                continue
                
            try:
                data = json.loads(line)
            except json.JSONDecodeError:
                continue
                
            # Handle close room event and generate final summary
            if data.get("command") == "close":
                summary_prompt = (
                    "The meeting has ended. Please generate a final, structured summary "
                    "of the entire meeting. Outline key discussion points, core decisions, "
                    "and the compiled final action items. Return the output in markdown."
                )
                response = await agent.chat(summary_prompt)
                summary_text = await response.text()
                
                # Print summary event to stdout for Node.js to consume
                print(json.dumps({
                    "event": "summary",
                    "data": summary_text
                }), flush=True)
                break
                
            speaker = data.get("speaker", "Unknown")
            text = data.get("text", "")
            
            # Send the new turn transcription to the agent and prompt it to extract action items
            prompt = (
                f"New transcription chunk:\n[{speaker}]: {text}\n\n"
                "Evaluate the latest chunk along with the conversation context. "
                "If any new action items, agreements, or assignments are mentioned in this specific turn, "
                "extract them. Respond strictly with a JSON list of new action items. "
                "Do not mention any previously identified action items. "
                "If no new action item exists, return an empty list: []. "
                "Format: [{\"assignee\": \"Name or Team\", \"task\": \"Description of the assignment\", \"raw_text\": \"The sentence from the transcript\"}]"
            )
            
            try:
                response = await agent.chat(prompt)
                response_text = await response.text()
                
                # Clean markdown code blocks from model response
                clean_json = response_text.strip()
                if clean_json.startswith("```json"):
                    clean_json = clean_json[7:]
                if clean_json.endswith("```"):
                    clean_json = clean_json[:-3]
                clean_json = clean_json.strip()
                
                if not clean_json:
                    continue
                    
                action_items = json.loads(clean_json)
                if isinstance(action_items, list):
                    for item in action_items:
                        key = (item.get("assignee"), item.get("task"))
                        if key not in known_action_items:
                            known_action_items.add(key)
                            # Emit action item back to Node.js server via stdout
                            print(json.dumps({
                                "event": "action_item",
                                "data": item
                            }), flush=True)
            except Exception as e:
                # Silently catch parsing or API errors to avoid breaking the real-time pipeline
                sys.stderr.write(f"Agent analysis error: {str(e)}\n")
                continue

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        sys.exit(0)
