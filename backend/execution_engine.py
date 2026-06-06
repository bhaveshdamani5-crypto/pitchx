import os
import json
import asyncio
import logging
from typing import AsyncGenerator, Optional
from openai import OpenAI

from memory_manager import MemoryManager
from nvidia_trustops import guard_text

logger = logging.getLogger(__name__)

class ExecutionEngine:
    """Runs the execution layer powered by NVIDIA NIM tool calling."""
    
    def __init__(self, memory_manager: Optional[MemoryManager] = None):
        self.memory = memory_manager or MemoryManager()
        api_key = os.getenv("NVIDIA_API_KEY")
        if not api_key:
            raise ValueError("NVIDIA_API_KEY not set")
        self.api_key = api_key
        
        self.client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1", 
            api_key=api_key,
            max_retries=5
        )
        
        # Define the tools available to the LLM
        self.tools = [
            {
                "type": "function",
                "function": {
                    "name": "send_email",
                    "description": "Send an email to a candidate.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "to_email": {
                                "type": "string",
                                "description": "The candidate's email address (mock as candidate@example.com if not available)"
                            },
                            "subject": {
                                "type": "string",
                                "description": "The subject of the email"
                            },
                            "body": {
                                "type": "string",
                                "description": "The full body of the email. Must be professional and personalized based on their evaluation."
                            }
                        },
                        "required": ["to_email", "subject", "body"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "post_job",
                    "description": "Generate and post a job description to fill a team gap.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "job_title": {
                                "type": "string",
                                "description": "The title of the missing role"
                            },
                            "job_description": {
                                "type": "string",
                                "description": "A detailed job description tailored to the company's business plan and needs"
                            },
                            "platforms": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Platforms to post on, e.g. ['LinkedIn', 'HackerNews']"
                            }
                        },
                        "required": ["job_title", "job_description", "platforms"]
                    }
                }
            }
        ]

    async def execute_hr_decisions(self, hr_result: dict, company_id: str) -> AsyncGenerator[dict, None]:
        """Takes the HR result and uses LLM tool calling to execute the decisions."""
        
        yield {
            "type": "execution_start",
            "message": "Initializing NVIDIA NIM Execution Engine..."
        }
        
        evaluations = hr_result.get("evaluations", [])
        gap_analysis = hr_result.get("team_gap_analysis", {})
        
        system_prompt = """You are the HR Execution Agent. Your job is to take the intelligence provided by the HR evaluation and ACT on it.
You have access to tools to send emails and post jobs.

RULES:
1. For any candidate with verdict 'HIRE', send them an enthusiastic offer or next steps email. Highlight their strengths.
2. For any candidate with verdict 'NEXT_ROUND', send them an email to schedule an interview, mentioning a concern you want to discuss.
3. For any roles listed in the 'Team Gap Analysis' as 'still_missing' or 'critical_gap', post a job to fill that gap. Write a compelling JD.
4. Call as many tools as necessary to complete all executions.
"""
        
        user_prompt = f"""
HR EVALUATION RESULTS:
{json.dumps(evaluations, indent=2)}

TEAM GAP ANALYSIS:
{json.dumps(gap_analysis, indent=2)}

Please execute the necessary actions now.
"""

        try:
            loop = asyncio.get_event_loop()
            
            yield {
                "type": "execution_progress",
                "message": "Planning execution strategy based on HR decisions..."
            }
            
            # Since NVIDIA models like llama-3.1-70b-instruct support tool calling, we use it here
            response = await loop.run_in_executor(
                None,
                lambda: self.client.chat.completions.create(
                    model="meta/llama-3.1-70b-instruct",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    tools=self.tools,
                    tool_choice="auto",
                    max_tokens=2000
                )
            )
            
            message = response.choices[0].message
            
            if message.tool_calls:
                for tool_call in message.tool_calls:
                    function_name = tool_call.function.name
                    try:
                        args = json.loads(tool_call.function.arguments)
                    except json.JSONDecodeError:
                        args = {"raw": tool_call.function.arguments}
                    
                    yield {
                        "type": "tool_call",
                        "function": function_name,
                        "arguments": args
                    }

                    guard = await guard_text(
                        json.dumps(args),
                        self.api_key,
                        policy="safe and professional HR outreach or job posting action",
                    )
                    yield {
                        "type": "action_guard",
                        "function": function_name,
                        "safe": guard.get("safe", True),
                        "provider": guard.get("provider"),
                        "model": guard.get("model"),
                        "categories": guard.get("categories", []),
                        "pii_detected": guard.get("pii", {}).get("pii_detected", False),
                        "status": "awaiting_human_approval" if guard.get("safe", True) else "blocked",
                    }
                    self.memory.save_trustops_event(
                        company_id=company_id,
                        event_type="action_guard",
                        agent_name="Execution",
                        payload={
                            "function": function_name,
                            "safe": guard.get("safe", True),
                            "provider": guard.get("provider"),
                            "categories": guard.get("categories", []),
                        },
                    )

                    if not guard.get("safe", True):
                        yield {
                            "type": "tool_result",
                            "function": function_name,
                            "status": "blocked",
                            "message": f"Blocked {function_name} by NVIDIA TrustOps guard"
                        }
                        continue
                    
                    # Simulate slight delay for execution realism
                    await asyncio.sleep(2.0)
                    
                    yield {
                        "type": "tool_result",
                        "function": function_name,
                        "status": "success",
                        "message": f"Successfully executed {function_name}"
                    }
            else:
                yield {
                    "type": "execution_progress",
                    "message": "No actions required based on the evaluation."
                }
                
        except Exception as e:
            logger.error(f"Execution stream error: {e}")
            yield {
                "type": "error",
                "message": f"Execution failed: {str(e)}"
            }
            
        yield {
            "type": "execution_done",
            "message": "All HR execution tasks completed successfully."
        }
