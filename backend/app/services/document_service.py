import os
import io
import re
from typing import List, Dict, Any, Optional
import pypdf
import docx
import pandas as pd
from app.models.schemas import Source

class DocumentService:
    @staticmethod
    def process_file(file_path: str, original_filename: str, source_id: str) -> Dict[str, Any]:
        ext = os.path.splitext(original_filename)[1].lower()
        passages: List[Dict[str, Any]] = []
        raw_text = ""
        total_pages = 1

        try:
            if ext == ".pdf":
                reader = pypdf.PdfReader(file_path)
                total_pages = len(reader.pages)
                for page_num, page in enumerate(reader.pages, start=1):
                    page_text = page.extract_text() or ""
                    raw_text += f"\n--- Page {page_num} ---\n" + page_text
                    
                    # Split page into meaningful paragraphs
                    paragraphs = [p.strip() for p in page_text.split("\n\n") if len(p.strip()) > 30]
                    for p_idx, para in enumerate(paragraphs, start=1):
                        passages.append({
                            "page": page_num,
                            "paragraph": p_idx,
                            "text": para
                        })

            elif ext == ".docx":
                doc = docx.Document(file_path)
                p_idx = 1
                for para in doc.paragraphs:
                    text = para.text.strip()
                    if len(text) > 30:
                        passages.append({
                            "page": 1,
                            "paragraph": p_idx,
                            "text": text
                        })
                        raw_text += text + "\n\n"
                        p_idx += 1

            elif ext == ".csv":
                df = pd.read_csv(file_path)
                summary_stats = df.describe(include='all').to_string()
                columns_list = ", ".join(df.columns.tolist())
                head_str = df.head(10).to_string()
                raw_text = f"CSV Document: {original_filename}\nColumns: {columns_list}\n\nSummary Statistics:\n{summary_stats}\n\nSample Data Rows:\n{head_str}"
                passages.append({
                    "page": 1,
                    "paragraph": 1,
                    "text": f"Dataset {original_filename} containing {len(df)} rows and {len(df.columns)} columns. Columns: {columns_list}."
                })
                for col in df.columns:
                    if pd.api.types.is_numeric_dtype(df[col]):
                        passages.append({
                            "page": 1,
                            "paragraph": 2,
                            "text": f"Column '{col}': mean={df[col].mean():.2f}, min={df[col].min()}, max={df[col].max()}, median={df[col].median()}."
                        })

            elif ext in [".txt", ".md"]:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                raw_text = content
                paragraphs = [p.strip() for p in content.split("\n\n") if len(p.strip()) > 30]
                for p_idx, para in enumerate(paragraphs, start=1):
                    passages.append({
                        "page": 1,
                        "paragraph": p_idx,
                        "text": para
                    })

            # Create a Source representation for the uploaded document
            source = Source(
                id=source_id,
                url=f"local://{original_filename}",
                title=f"User Document: {original_filename}",
                publisher="User Upload",
                author="Document Author",
                published_date="2024-2025",
                source_type="primary_document",
                credibility_score=90,
                publisher_authority=85,
                methodological_transparency=90,
                is_primary=True,
                snippet=passages[0]["text"][:300] if passages else "Uploaded file content",
                raw_content=raw_text[:10000]
            )

            return {
                "success": True,
                "source": source,
                "passages": passages,
                "raw_text": raw_text,
                "total_pages": total_pages,
                "total_passages": len(passages)
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "source": None,
                "passages": []
            }
