import os
import json
import asyncio
import logging
from typing import Optional
from fastapi import WebSocket, WebSocketDisconnect
from openai import OpenAI

from memory_manager import MemoryManager
from agents import AGENT_CONFIG, build_agent_prompt_with_memory

logger = logging.getLogger(__name__)

class VoiceArenaEngine:
    """Handles real-time WebSocket communication for the Live Pitch Simulator."""
    
    def __init__(self, memory_manager: MemoryManager):
        self.memory = memory_manager
        api_key = os.getenv("NVIDIA_API_KEY")
        if not api_key:
            logger.warning("NVIDIA_API_KEY not set for Voice Arena")
        
        self.client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1", 
            api_key=api_key or "dummy",
            max_retries=3
        )
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("Voice Arena client connected.")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info("Voice Arena client disconnected.")

    async def handle_session(self, websocket: WebSocket, session_id: str, company_id: str):
        """Main loop for handling live audio/text streams from the founder."""
        
        # Load company context
        company = self.memory.get_company(company_id)
        if not company:
            await websocket.send_json({"type": "error", "message": "Company not found."})
            return

        company_brief = company.get("company_brief", {})
        if isinstance(company_brief, str):
            try:
                company_brief = json.loads(company_brief)
            except:
                company_brief = {}

        # Welcome message
        await websocket.send_json({
            "type": "system", 
            "message": "Connected to PitchX Voice Arena. The board is listening. Start pitching."
        })

        conversation_history = []

        try:
            while True:
                # Receive transcript or audio data from frontend
                data = await websocket.receive_text()
                
                try:
                    payload = json.loads(data)
                except json.JSONDecodeError:
                    continue

                if payload.get("type") == "founder_transcript":
                    transcript = payload.get("text", "")
                    if not transcript.strip():
                        continue
                    
                    conversation_history.append({"role": "founder", "content": transcript})

                    # Decide which agent should interrupt/respond
                    # Simple heuristic: look for keywords, default to Devil's Advocate
                    agent_name = self._route_to_agent(transcript)
                    
                    # Notify frontend that an agent is thinking
                    await websocket.send_json({
                        "type": "agent_thinking",
                        "agent": agent_name
                    })

                    # Get response from agent
                    await self._generate_agent_response(
                        websocket, 
                        agent_name, 
                        company_id, 
                        company_brief, 
                        transcript,
                        conversation_history
                    )

        except WebSocketDisconnect:
            self.disconnect(websocket)
        except Exception as e:
            logger.error(f"Voice Arena error: {e}")
            self.disconnect(websocket)

    def _route_to_agent(self, text: str) -> str:
        """Route the founder's statement to the most appropriate agent."""
        text_lower = text.lower()
        if any(word in text_lower for word in ["revenue", "burn", "cost", "margin", "budget", "money", "price"]):
            return "CFO"
        elif any(word in text_lower for word in ["tech", "code", "architecture", "scale", "stack", "server"]):
            return "CTO"
        elif any(word in text_lower for word in ["marketing", "users", "ads", "acquisition", "brand", "sales"]):
            return "CMO"
        else:
            return "Devil"  # Devil's Advocate takes general/strategic pitches

    async def _generate_agent_response(
        self, 
        websocket: WebSocket, 
        agent_name: str, 
        company_id: str, 
        company_brief: dict, 
        latest_transcript: str,
        conversation_history: list
    ):
        """Stream Llama-3 response to the websocket."""
        
        system_prompt = build_agent_prompt_with_memory(
            agent_name=agent_name,
            company_id=company_id,
            company_brief=company_brief,
            memory_manager=self.memory
        )

        # Contextualize for live voice mode
        system_prompt += "\n\nCRITICAL INSTRUCTION: You are in a LIVE WebRTC voice call with the founder. Do NOT write long essays. Speak in short, punchy, conversational sentences. Actively INTERRUPT and challenge their logic. Be brutal but professional. DO NOT use markdown, emojis, or lists, as your output will be sent directly to a Text-to-Speech engine."

        # Format history
        messages = [{"role": "system", "content": system_prompt}]
        
        # Only include last 4 turns for context
        for turn in conversation_history[-4:-1]:
            role = "user" if turn["role"] == "founder" else "assistant"
            messages.append({"role": role, "content": turn["content"]})
            
        messages.append({
            "role": "user", 
            "content": f"The founder just said: '{latest_transcript}'. Respond immediately."
        })

        full_response = ""
        
        await websocket.send_json({
            "type": "agent_start",
            "agent": agent_name
        })

        try:
            loop = asyncio.get_event_loop()
            
            def create_stream():
                return self.client.chat.completions.create(
                    model="meta/llama-3.3-70b-instruct",
                    max_tokens=150,  # Keep it short for voice
                    messages=messages,
                    stream=True,
                )

            stream = await loop.run_in_executor(None, create_stream)

            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    text = chunk.choices[0].delta.content
                    full_response += text
                    await websocket.send_json({
                        "type": "agent_token",
                        "agent": agent_name,
                        "text": text
                    })
                    # Yield control to event loop
                    await asyncio.sleep(0.01)

            conversation_history.append({"role": "agent", "name": agent_name, "content": full_response})

            await websocket.send_json({
                "type": "agent_done",
                "agent": agent_name,
                "full_text": full_response
            })

        except Exception as e:
            logger.error(f"Error generating agent response: {e}")
            await websocket.send_json({
                "type": "error",
                "message": "Agent connection lost."
            })
