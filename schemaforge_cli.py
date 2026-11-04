#!/usr/bin/env python3
"""
SchemaForge CLI — Zero-Knowledge Database Schema Converter & AI Prompt Sanitizer
Author: GabrielHFGoncalez
Repo: https://github.com/GabrielHFGoncalez/schemaforge
Web App: https://gabrielhfgoncalez.github.io/schemaforge/

Usage:
  # Sanitize sensitive data before sending to LLMs:
  cat prod_dump.sql | python schemaforge_cli.py --sanitize > safe_prompt.sql

  # Convert SQL DDL to TypeScript interfaces:
  python schemaforge_cli.py convert schema.sql --to typescript -o types.ts
"""

import sys
import re
import argparse
from pathlib import Path

# Common redaction regexes
PATTERNS = [
    (r"\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}", "[REDACTED_BCRYPT_HASH]"),
    (r"sk_live_[0-9a-zA-Z]{24,}", "[REDACTED_STRIPE_LIVE_KEY]"),
    (r"ghp_[0-9a-zA-Z]{36}", "[REDACTED_GITHUB_PAT]"),
    (r"AKIA[0-9A-Z]{16}", "[REDACTED_AWS_ACCESS_KEY]"),
    (r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]{10,}\.[A-Za-z0-9._-]{10,}", "[REDACTED_JWT_TOKEN]"),
    (r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", "[REDACTED_EMAIL]"),
    (r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b", "[REDACTED_CPF]"),
    (r"\b\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}\b", "[REDACTED_CNPJ]"),
    (r"\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\d{4}[-\s]?\d{4}|\d{4}[-\s]?\d{4})\b", "[REDACTED_PHONE]"),
    (r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b", "[REDACTED_CREDIT_CARD]"),
]

def sanitize_text(text: str) -> str:
    """Scrub passwords, hashes, keys, PII, and sensitive secrets."""
    sanitized = text
    for pattern, replacement in PATTERNS:
        sanitized = re.sub(pattern, replacement, sanitized)
    return sanitized

def sql_to_typescript(sql_content: str) -> str:
    """Convert simple CREATE TABLE statements into TypeScript interfaces."""
    interfaces = []
    table_blocks = re.findall(r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`\"\[\w]+)\s*\((.*?)\);", sql_content, re.DOTALL | re.IGNORECASE)
    
    for table_name, body in table_blocks:
        clean_table = re.sub(r"[`\"\[\]]", "", table_name).strip()
        pascal_name = "".join(part.capitalize() for part in clean_table.split("_"))
        
        lines = [f"export interface {pascal_name} {{"]
        for line in body.splitlines():
            line = line.strip().rstrip(",")
            if not line or line.upper().startswith(("PRIMARY", "FOREIGN", "KEY", "CONSTRAINT", "INDEX")):
                continue
            parts = line.split()
            if len(parts) >= 2:
                col_name = re.sub(r"[`\"\[\]]", "", parts[0])
                col_type = parts[1].upper()
                
                # Type mapping
                if any(t in col_type for t in ["INT", "SERIAL", "DECIMAL", "NUMERIC", "FLOAT", "DOUBLE"]):
                    ts_type = "number"
                elif any(t in col_type for t in ["BOOL"]):
                    ts_type = "boolean"
                elif any(t in col_type for t in ["TIME", "DATE"]):
                    ts_type = "Date | string"
                elif "JSON" in col_type:
                    ts_type = "Record<string, any>"
                else:
                    ts_type = "string"
                    
                is_nullable = "NOT NULL" not in line.upper()
                optional = "?" if is_nullable else ""
                lines.append(f"  {col_name}{optional}: {ts_type};")
        lines.append("}\n")
        interfaces.append("\n".join(lines))
        
    return "\n".join(interfaces) if interfaces else "// Nenhum comando CREATE TABLE detectado."

def main():
    parser = argparse.ArgumentParser(description="SchemaForge CLI — Fast Schema Converter & AI Prompt Sanitizer")
    parser.add_argument("input_file", nargs="?", help="Input file path (or read from stdin)")
    parser.add_argument("--sanitize", action="store_true", help="Sanitize PII, credentials and secrets")
    parser.add_argument("--to", choices=["typescript", "prisma"], default="typescript", help="Target schema format")
    parser.add_argument("-o", "--output", help="Output file path (default: stdout)")
    
    args = parser.parse_args()
    
    if args.input_file:
        content = Path(args.input_file).read_text(encoding="utf-8")
    else:
        if sys.stdin.isatty():
            parser.print_help()
            sys.exit(0)
        content = sys.stdin.read()
        
    if args.sanitize:
        result = sanitize_text(content)
    else:
        if args.to == "typescript":
            result = sql_to_typescript(content)
        else:
            result = "// Suporte a Prisma via web app: https://gabrielhfgoncalez.github.io/schemaforge/"
            
    if args.output:
        Path(args.output).write_text(result, encoding="utf-8")
        print(f"[+] Output written to {args.output}")
    else:
        print(result)

if __name__ == "__main__":
    main()
