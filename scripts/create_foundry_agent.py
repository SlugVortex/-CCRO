from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover
    load_dotenv = None


def update_env_value(env_path: Path, key: str, value: str) -> None:
    lines = env_path.read_text(encoding="utf-8").splitlines()
    updated = False
    output: list[str] = []

    for line in lines:
        if line.startswith(f"{key}="):
            output.append(f"{key}={value}")
            updated = True
        else:
            output.append(line)

    if not updated:
        output.append(f"{key}={value}")

    env_path.write_text("\n".join(output) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a Microsoft Foundry agent and persist its ID into .env.")
    parser.add_argument("--name", default="ccro-risk-agent", help="Agent name to create.")
    parser.add_argument(
        "--model",
        default=os.getenv("AZURE_OPENAI_DEPLOYMENT") or "gpt-5.4",
        help="Foundry/OpenAI deployment name to bind to the agent.",
    )
    parser.add_argument(
        "--instructions",
        default=(
            "You are the Caribbean Climate Resilience Orchestrator. "
            "Summarize climate risk, compare intervention scenarios, and explain prioritized recommendations clearly."
        ),
        help="Instruction string for the created agent.",
    )
    parser.add_argument(
        "--env-file",
        default=str(Path(__file__).resolve().parents[1] / ".env"),
        help="Path to the .env file to update.",
    )
    parser.add_argument(
        "--temperature",
        type=float,
        default=0.2,
        help="Sampling temperature for the prompt agent definition.",
    )
    parser.add_argument(
        "--description",
        default="Prompt agent for Caribbean climate resilience planning.",
        help="Human-readable agent description.",
    )
    args = parser.parse_args()

    env_path = Path(args.env_file).resolve()
    if load_dotenv is not None and env_path.exists():
        load_dotenv(env_path, override=False)

    project_endpoint = os.getenv("FOUNDRY_PROJECT_ENDPOINT", "").strip()
    if not project_endpoint:
        print("FOUNDRY_PROJECT_ENDPOINT is missing. Set it in .env first.", file=sys.stderr)
        return 1

    try:
        from azure.ai.projects import AIProjectClient
        from azure.ai.projects.models import PromptAgentDefinition
        from azure.identity import AzureCliCredential
    except ImportError:
        print(
            "Missing dependencies. Install them with:\n"
            "  py -m pip install azure-ai-projects azure-identity python-dotenv",
            file=sys.stderr,
        )
        return 1

    credential = AzureCliCredential()
    project_client = AIProjectClient(endpoint=project_endpoint, credential=credential)

    definition = PromptAgentDefinition(
        model=args.model,
        instructions=args.instructions,
        temperature=args.temperature,
    )
    version = project_client.agents.create_version(
        agent_name=args.name,
        definition=definition,
        description=args.description,
    )
    agent = project_client.agents.get(args.name)

    print(f"Created agent: {agent.name}")
    print(f"Agent ID: {agent.id}")
    print(f"Version ID: {version.id}")
    if getattr(version, "agent_guid", None):
        print(f"Agent GUID: {version.agent_guid}")

    if env_path.exists():
        update_env_value(env_path, "FOUNDRY_AGENT_ID", agent.id)
        print(f"Updated {env_path} with FOUNDRY_AGENT_ID.")
    else:
        print(f".env file not found at {env_path}; skipping env update.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
