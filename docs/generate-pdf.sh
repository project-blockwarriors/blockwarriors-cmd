#!/bin/bash
# Generate PDF from the Game Development Guide markdown
#
# Requirements:
#   - pandoc: brew install pandoc
#   - LaTeX (for PDF): brew install --cask mactex-no-gui
#     OR use: brew install basictex && sudo tlmgr install collection-fontsrecommended
#
# Alternative (no LaTeX required):
#   - wkhtmltopdf: brew install wkhtmltopdf
#
# Usage:
#   ./generate-pdf.sh
#
# Output:
#   game-development-guide.pdf

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INPUT_FILE="$SCRIPT_DIR/game-development-guide.md"
OUTPUT_FILE="$SCRIPT_DIR/game-development-guide.pdf"

echo "📄 Generating PDF from Game Development Guide..."

# Check if pandoc is installed
if ! command -v pandoc &> /dev/null; then
    echo "❌ pandoc is not installed."
    echo "   Install with: brew install pandoc"
    echo ""
    echo "   Alternative: Use an online converter like:"
    echo "   - https://md2pdf.netlify.app/"
    echo "   - https://www.markdowntopdf.com/"
    exit 1
fi

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "❌ Input file not found: $INPUT_FILE"
    exit 1
fi

# Try different PDF engines based on what's available
if command -v xelatex &> /dev/null; then
    echo "Using xelatex engine (better Unicode support)..."
    pandoc "$INPUT_FILE" \
        -o "$OUTPUT_FILE" \
        --pdf-engine=xelatex \
        -V geometry:margin=1in \
        -V fontsize=11pt \
        -V documentclass=article \
        --toc \
        --toc-depth=3 \
        -V colorlinks=true \
        -V linkcolor=blue \
        -V urlcolor=blue \
        --highlight-style=tango
elif command -v pdflatex &> /dev/null; then
    echo "Using pdflatex engine..."
    pandoc "$INPUT_FILE" \
        -o "$OUTPUT_FILE" \
        --pdf-engine=pdflatex \
        -V geometry:margin=1in \
        -V fontsize=11pt \
        -V documentclass=article \
        --toc \
        --toc-depth=3 \
        -V colorlinks=true \
        -V linkcolor=blue \
        -V urlcolor=blue \
        --highlight-style=tango
elif command -v wkhtmltopdf &> /dev/null; then
    echo "Using wkhtmltopdf engine..."
    # First convert to HTML, then to PDF
    TEMP_HTML="$SCRIPT_DIR/.temp-guide.html"
    pandoc "$INPUT_FILE" \
        -o "$TEMP_HTML" \
        --standalone \
        --toc \
        --toc-depth=3 \
        --highlight-style=tango \
        --metadata title="BlockWarriors Game Development Guide"
    
    wkhtmltopdf \
        --enable-local-file-access \
        --margin-top 20mm \
        --margin-bottom 20mm \
        --margin-left 15mm \
        --margin-right 15mm \
        --header-center "BlockWarriors Game Development Guide" \
        --footer-center "[page]" \
        "$TEMP_HTML" "$OUTPUT_FILE"
    
    rm -f "$TEMP_HTML"
else
    echo "⚠️  No PDF engine found. Creating HTML version instead..."
    OUTPUT_HTML="$SCRIPT_DIR/game-development-guide.html"
    pandoc "$INPUT_FILE" \
        -o "$OUTPUT_HTML" \
        --standalone \
        --toc \
        --toc-depth=3 \
        --highlight-style=tango \
        --metadata title="BlockWarriors Game Development Guide" \
        --css="https://cdn.jsdelivr.net/npm/github-markdown-css/github-markdown.min.css"
    
    echo "✅ Generated: $OUTPUT_HTML"
    echo ""
    echo "To generate PDF:"
    echo "  Option 1: Install LaTeX: brew install --cask mactex-no-gui"
    echo "  Option 2: Install wkhtmltopdf: brew install wkhtmltopdf"
    echo "  Option 3: Open the HTML in a browser and print to PDF"
    exit 0
fi

if [ -f "$OUTPUT_FILE" ]; then
    echo "✅ Generated: $OUTPUT_FILE"
    echo "   Size: $(du -h "$OUTPUT_FILE" | cut -f1)"
else
    echo "❌ Failed to generate PDF"
    exit 1
fi
