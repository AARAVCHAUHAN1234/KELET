import asyncio
from typing import Dict, Any
from .base import BaseAgent

# Import stub agents (they will be simple implementations returning mock data)
from .discovery import DiscoveryAgent
from .deep_research import DeepResearchAgent
from .claim_extraction import ClaimExtractionAgent
from .verification import VerificationAgent
from .credibility import CredibilityAgent
from .contradiction import ContradictionAgent
from .bias import BiasAgent
from .statistical import StatisticalAgent
from .redteam import RedTeamAgent
from .synthesis import SynthesisAgent

class OrchestratorAgent(BaseAgent):
    """Coordinates the full research pipeline.

    It updates the TaskManager with status changes and aggregates the final report.
    """

    def __init__(self, task_manager, task_id: str, question: str, demo: bool = True):
        self.tm = task_manager
        self.task_id = task_id
        self.question = question
        self.demo = demo  # If True, agents return deterministic mock data.
        self.discovery = DiscoveryAgent(demo=self.demo)
        self.deep = DeepResearchAgent(demo=self.demo)
        self.claim = ClaimExtractionAgent(demo=self.demo)
        self.verify = VerificationAgent(demo=self.demo)
        self.cred = CredibilityAgent(demo=self.demo)
        self.contra = ContradictionAgent(demo=self.demo)
        self.bias = BiasAgent(demo=self.demo)
        self.stat = StatisticalAgent(demo=self.demo)
        self.red = RedTeamAgent(demo=self.demo)
        self.synthesis = SynthesisAgent(demo=self.demo)

    async def run(self) -> None:
        ctx: Dict[str, Any] = {"question": self.question}
        self.tm.update_status(self.task_id, "running")

        # 1. Discovery
        ctx["sources"] = await self.discovery.run(ctx)
        self.tm.update_status(self.task_id, "discovery_done")

        # 2. Deep research
        ctx["deep_insights"] = await self.deep.run(ctx)
        self.tm.update_status(self.task_id, "deep_done")

        # 3. Claim extraction
        ctx["claims"] = await self.claim.run(ctx)
        self.tm.update_status(self.task_id, "claims_extracted")

        # 4. Verification
        ctx["verification"] = await self.verify.run(ctx)
        self.tm.update_status(self.task_id, "verification_done")

        # 5. Credibility
        ctx["credibility"] = await self.cred.run(ctx)
        self.tm.update_status(self.task_id, "credibility_done")

        # 6. Contradiction detection
        ctx["contradictions"] = await self.contra.run(ctx)
        self.tm.update_status(self.task_id, "contradictions_done")

        # 7. Bias analysis
        ctx["bias"] = await self.bias.run(ctx)
        self.tm.update_status(self.task_id, "bias_done")

        # 8. Statistical analysis
        ctx["statistics"] = await self.stat.run(ctx)
        self.tm.update_status(self.task_id, "statistics_done")

        # 9. Red‑team review
        ctx["redteam"] = await self.red.run(ctx)
        self.tm.update_status(self.task_id, "redteam_done")

        # 10. Synthesis / final report
        report = await self.synthesis.run(ctx)
        self.tm.set_report(self.task_id, report)
        # final status set inside set_report (completed)

        # Optionally keep a log of the whole context for debugging
        self.tm._tasks[self.task_id]["full_context"] = ctx

        return None
