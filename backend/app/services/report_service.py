import os
from typing import Dict, Any, List
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.models.schemas import ResearchReport, ResearchSession

class ReportService:
    @staticmethod
    def generate_markdown(report: ResearchReport, session: ResearchSession) -> str:
        md = []
        md.append(f"# KELET RESEARCH REPORT: {report.title.upper()}\n")
        md.append(f"**Research Question:** {report.question}  ")
        md.append(f"**Generated:** {report.generated_at}  ")
        md.append(f"**Report Type:** {report.report_type.replace('_', ' ').title()}  ")
        md.append(f"**Scope & Region:** {session.scope_region} | **Mode:** {session.depth_mode.title()}\n")
        md.append("---\n")

        md.append("## 1. Executive Summary")
        md.append(f"{report.executive_summary}\n")

        md.append("## 2. Scope & Research Methodology")
        md.append(f"{report.scope_and_methodology}\n")

        md.append("## 3. Key Findings")
        for idx, finding in enumerate(report.key_findings, 1):
            md.append(f"{idx}. {finding}")
        md.append("")

        md.append("## 4. Evidence-Backed Claims & Verification Audit")
        for claim in session.claims:
            status_symbol = {
                "Supported": "[SUPPORTED]",
                "Partially Supported": "[PARTIALLY SUPPORTED]",
                "Contradicted": "[CONTRADICTED]",
                "Unverified": "[UNVERIFIED]",
                "Misleading": "[MISLEADING]",
                "Outdated": "[OUTDATED]",
                "Inconclusive": "[INCONCLUSIVE]"
            }.get(claim.verification_status, "[UNVERIFIED]")

            md.append(f"### Claim {claim.id}: {claim.text}")
            md.append(f"- **Verification Status:** `{status_symbol} {claim.verification_status}` (Confidence: {claim.confidence_score}%)")
            md.append(f"- **Primary Source:** [{claim.source_title}]({claim.source_url})")
            if claim.original_quote:
                md.append(f"- **Original Evidence Excerpt:** *\"{claim.original_quote}\"*")
            if claim.page_number:
                md.append(f"- **Location Reference:** Page {claim.page_number}, Paragraph {claim.paragraph_number or 1}")
            md.append(f"- **Audit Rationale:** {claim.explanation}")
            
            if claim.corroborating_source_ids:
                md.append(f"- **Corroborating Sources:** {', '.join(claim.corroborating_source_ids)}")
            if claim.contradicting_source_ids:
                md.append(f"- **Contradicting Sources:** {', '.join(claim.contradicting_source_ids)}")
            md.append("")

        if session.contradictions:
            md.append("## 5. Contradiction & Divergence Intelligence")
            for c in session.contradictions:
                md.append(f"### Contradiction ({c.conflict_category.upper()}) [Severity: {c.severity.upper()}]")
                md.append(f"- **Statement A:** \"{c.claim_a_text}\" (Source: {c.source_a_id})")
                md.append(f"- **Statement B:** \"{c.claim_b_text}\" (Source: {c.source_b_id})")
                md.append(f"- **Root Divergence Reason:** {c.why_sources_disagree}")
                md.append(f"- **Analysis:** {c.explanation}")
                md.append("")

        if session.statistical_findings:
            md.append("## 6. Statistical & Numerical Integrity Analysis")
            for sf in session.statistical_findings:
                md.append(f"- **Metric:** {sf.metric_label}")
                md.append(f"  - Reported: `{sf.reported_stat}` | Assessment: `{sf.assessment.upper()}`")
                md.append(f"  - Evaluation: {sf.analysis_notes}")
            md.append("")

        if session.skeptic_challenges:
            md.append("## 7. Red-Team & Adversarial Skeptic Critique")
            for sc in session.skeptic_challenges:
                md.append(f"### Challenge to {sc.target_type}: \"{sc.target_text}\"")
                md.append(f"- **Vulnerability Score:** {sc.vulnerability_score}% | **Orchestrator Decision:** `{sc.orchestrator_decision}`")
                md.append(f"- **Adversarial Critique:** {sc.challenge_argument}")
                if sc.counterevidence_found:
                    md.append(f"- **Counterevidence Points:** {'; '.join(sc.counterevidence_found)}")
                if sc.unstated_assumptions:
                    md.append(f"- **Unstated Assumptions Challenged:** {'; '.join(sc.unstated_assumptions)}")
                md.append("")

        if session.research_gaps:
            md.append("## 8. Research Gaps & Missing Evidence")
            for rg in session.research_gaps:
                md.append(f"- **[{rg.gap_type.upper()}] ({rg.severity.upper()} Severity)**: {rg.description}")
                md.append(f"  - *Suggested Query:* `{rg.suggested_investigation_query}`")
            md.append("")

        md.append("## 9. Limitations & Unresolved Questions")
        for lim in report.limitations:
            md.append(f"- {lim}")
        for unq in report.unresolved_questions:
            md.append(f"- [Unresolved Question] {unq}")
        md.append("")

        md.append("## 10. Final Synthesized Verdict")
        md.append(f"{report.final_verdict}\n")

        md.append("## 11. Traceable Bibliography & Source Audit")
        for s in session.sources:
            pri = "[PRIMARY]" if s.is_primary else "[SECONDARY]"
            syn = " *(Syndicated/Wire duplicate)*" if s.is_syndicated else ""
            md.append(f"- **[{s.id}]** {pri} **{s.publisher}**: [{s.title}]({s.url}){syn}")
            md.append(f"  - Author: {s.author} | Date: {s.published_date} | Credibility Score: {s.credibility_score}/100")

        return "\n".join(md)

    @staticmethod
    def export_docx(report: ResearchReport, session: ResearchSession, output_path: str):
        doc = Document()

        # Styles
        title_p = doc.add_heading(report.title, level=0)
        title_p.paragraph_format.space_after = Pt(6)

        sub_p = doc.add_paragraph(f"Research Question: {report.question}\nGenerated: {report.generated_at} | Mode: {session.depth_mode.title()} | Region: {session.scope_region}")
        sub_p.paragraph_format.space_after = Pt(14)

        # 1. Executive Summary
        doc.add_heading("1. Executive Summary", level=1)
        doc.add_paragraph(report.executive_summary)

        # 2. Scope & Methodology
        doc.add_heading("2. Scope & Methodology", level=1)
        doc.add_paragraph(report.scope_and_methodology)

        # 3. Key Findings
        doc.add_heading("3. Key Findings", level=1)
        for idx, finding in enumerate(report.key_findings, 1):
            doc.add_paragraph(f"{idx}. {finding}", style='List Bullet')

        # 4. Verified Claims Table
        doc.add_heading("4. Evidence-Backed Claims & Verification Audit", level=1)
        table = doc.add_table(rows=1, cols=4)
        hdr_cells = table.rows[0].cells
        hdr_cells[0].text = "Claim Statement"
        hdr_cells[1].text = "Status"
        hdr_cells[2].text = "Confidence"
        hdr_cells[3].text = "Source & Evidence"

        for claim in session.claims:
            row_cells = table.add_row().cells
            row_cells[0].text = claim.text
            row_cells[1].text = claim.verification_status
            row_cells[2].text = f"{claim.confidence_score}%"
            quote_text = f"\nQuote: \"{claim.original_quote}\"" if claim.original_quote else ""
            row_cells[3].text = f"{claim.source_title} ({claim.source_id}){quote_text}"

        # 5. Contradictions
        if session.contradictions:
            doc.add_heading("5. Contradictions & Divergences", level=1)
            for c in session.contradictions:
                doc.add_heading(f"Conflict: {c.conflict_category.title()} (Severity: {c.severity})", level=2)
                p = doc.add_paragraph()
                p.add_run(f"Position A: ").bold = True
                p.add_run(f"{c.claim_a_text} [Source {c.source_a_id}]\n")
                p.add_run(f"Position B: ").bold = True
                p.add_run(f"{c.claim_b_text} [Source {c.source_b_id}]\n")
                p.add_run(f"Explanation of Divergence: ").bold = True
                p.add_run(c.why_sources_disagree)

        # 6. Final Assessment
        doc.add_heading("6. Final Assessment", level=1)
        doc.add_paragraph(report.final_verdict)

        # 7. Bibliography
        doc.add_heading("7. Bibliography & Sources", level=1)
        for s in session.sources:
            doc.add_paragraph(f"[{s.id}] {s.publisher} - {s.title} ({s.published_date}). URL: {s.url} (Credibility: {s.credibility_score}/100)")

        doc.save(output_path)

    @staticmethod
    def export_pdf(report: ResearchReport, session: ResearchSession, output_path: str):
        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )
        styles = getSampleStyleSheet()

        # Custom Technical Dark-Themed Print Palette
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=20,
            leading=24,
            textColor=colors.HexColor('#191B1D'),
            spaceAfter=8
        )
        h1_style = ParagraphStyle(
            'H1',
            parent=styles['Heading2'],
            fontSize=13,
            leading=16,
            textColor=colors.HexColor('#222528'),
            spaceBefore=12,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontSize=9.5,
            leading=13.5,
            textColor=colors.HexColor('#2C3033'),
            spaceAfter=6
        )
        meta_style = ParagraphStyle(
            'Meta',
            parent=styles['Normal'],
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor('#70777D'),
            spaceAfter=12
        )

        elements = []

        elements.append(Paragraph("<b>KELET RESEARCH INTELLIGENCE REPORT</b>", title_style))
        elements.append(Paragraph(f"<b>Research Question:</b> {report.question}<br/><b>Generated:</b> {report.generated_at} | <b>Type:</b> {report.report_type.title()} | <b>Mode:</b> {session.depth_mode.title()}", meta_style))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#34383B'), spaceAfter=10))

        # 1. Executive Summary
        elements.append(Paragraph("<b>1. Executive Summary</b>", h1_style))
        elements.append(Paragraph(report.executive_summary, body_style))
        elements.append(Spacer(1, 8))

        # 2. Scope & Methodology
        elements.append(Paragraph("<b>2. Scope & Methodology</b>", h1_style))
        elements.append(Paragraph(report.scope_and_methodology, body_style))
        elements.append(Spacer(1, 8))

        # 3. Key Findings
        elements.append(Paragraph("<b>3. Key Findings</b>", h1_style))
        for idx, f in enumerate(report.key_findings, 1):
            elements.append(Paragraph(f"• <b>{idx}.</b> {f}", body_style))
        elements.append(Spacer(1, 8))

        # 4. Verified Claims Table
        elements.append(Paragraph("<b>4. Verified Claims & Evidence Audit</b>", h1_style))
        table_data = [["Claim Statement", "Status", "Conf.", "Source"]]
        for c in session.claims[:10]: # Top 10 claims in PDF
            table_data.append([
                Paragraph(f"{c.text[:95]}...", body_style),
                Paragraph(f"<b>{c.verification_status}</b>", body_style),
                Paragraph(f"{c.confidence_score}%", body_style),
                Paragraph(f"[{c.source_id}] {c.source_title[:25]}", body_style)
            ])

        t = Table(table_data, colWidths=[240, 100, 50, 140])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#191B1D')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#F0F1F2')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8.5),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E0E0E0')),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 10))

        # 5. Final Assessment
        elements.append(Paragraph("<b>5. Final Assessment</b>", h1_style))
        elements.append(Paragraph(report.final_verdict, body_style))
        elements.append(Spacer(1, 8))

        # 6. Bibliography
        elements.append(Paragraph("<b>6. Traceable Bibliography</b>", h1_style))
        for s in session.sources[:12]:
            elements.append(Paragraph(f"• <b>[{s.id}]</b> {s.publisher} - <i>{s.title}</i> ({s.published_date}) <font color='#6FA9DC'>{s.url}</font>", meta_style))

        doc.build(elements)
