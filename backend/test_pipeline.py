import os
import sys
import unittest
import asyncio

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.models.schemas import ResearchSession, StartResearchRequest
from app.services.search_service import SearchService, is_safe_url, classify_source_domain
from app.services.document_service import DocumentService
from app.services.report_service import ReportService
from app.services.gemini_service import GeminiService
from app.agents.pipeline import ResearchPipeline, GapDetector, GraphBuilder

class TestKeletPipeline(unittest.TestCase):
    def test_ssrf_safety(self):
        self.assertFalse(is_safe_url("http://127.0.0.1:8000"))
        self.assertFalse(is_safe_url("http://localhost:5173"))
        self.assertFalse(is_safe_url("http://169.254.169.254/latest/meta-data/"))
        self.assertTrue(is_safe_url("https://en.wikipedia.org/wiki/Solid-state_battery"))
        self.assertTrue(is_safe_url("https://arxiv.org/abs/2101.00001"))

    def test_source_classification(self):
        self.assertEqual(classify_source_domain("https://arxiv.org/abs/2101.00001"), "academic")
        self.assertEqual(classify_source_domain("https://www.cdc.gov/flu/index.html"), "government")
        self.assertEqual(classify_source_domain("https://www.reuters.com/business/"), "news")

    def test_document_processing_txt(self):
        test_file = os.path.join(os.path.dirname(__file__), "test_doc.txt")
        with open(test_file, "w", encoding="utf-8") as f:
            f.write("Solid-state batteries replace liquid electrolytes with solid ceramics or polymers.\n\n"
                    "Laboratory prototypes show 400 Wh/kg energy density, exceeding current NMC cells.\n\n"
                    "However, dendrite growth and interfacial resistance remain unsolved at automotive scale.")
        try:
            res = DocumentService.process_file(test_file, "test_doc.txt", "src_test_01")
            self.assertTrue(res["success"])
            self.assertGreaterEqual(res["total_passages"], 2)
            self.assertEqual(res["source"].id, "src_test_01")
        finally:
            if os.path.exists(test_file):
                os.remove(test_file)

    def test_full_pipeline_execution(self):
        async def run_pipeline():
            session = ResearchSession(
                id="rs_test_suite_01",
                question="Are solid-state batteries ready for commercial EV scale?",
                depth_mode="fast",
                source_preference="balanced",
                scope_region="Global"
            )
            gemini = GeminiService(api_key=None) # Tests offline/deterministic pipeline
            search = SearchService(tavily_api_key=None)
            
            pipeline = ResearchPipeline(session, gemini, search)
            await pipeline.run()

            # Verifications
            self.assertEqual(session.status, "completed")
            self.assertGreater(len(session.sources), 0)
            self.assertGreater(len(session.claims), 0)
            self.assertIn("comprehensive", session.reports)
            self.assertGreater(len(session.graph_nodes), 0)
            self.assertGreater(len(session.graph_edges), 0)
            
            # Verify report export
            report = session.reports["comprehensive"]
            md = ReportService.generate_markdown(report, session)
            self.assertIn("KELET RESEARCH REPORT", md)
            self.assertIn("Executive Summary", md)
            self.assertIn("Traceable Bibliography", md)

            # Test PDF and DOCX exports
            export_dir = os.path.join(os.path.dirname(__file__), "exports")
            os.makedirs(export_dir, exist_ok=True)
            pdf_path = os.path.join(export_dir, "test_report.pdf")
            docx_path = os.path.join(export_dir, "test_report.docx")

            ReportService.export_pdf(report, session, pdf_path)
            ReportService.export_docx(report, session, docx_path)

            self.assertTrue(os.path.exists(pdf_path))
            self.assertTrue(os.path.exists(docx_path))
            self.assertGreater(os.path.getsize(pdf_path), 1000)
            self.assertGreater(os.path.getsize(docx_path), 1000)

        asyncio.run(run_pipeline())

if __name__ == "__main__":
    unittest.main()
