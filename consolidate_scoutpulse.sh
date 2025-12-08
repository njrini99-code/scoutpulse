#!/bin/bash

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║   SCOUTPULSE FOLDER CONSOLIDATION                                 ║"
echo "║   Merging all scattered folders into one clean structure          ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

cd ~/scoutpulse

# Backup first
echo "📦 Creating backup..."
cp -r . ../scoutpulse_backup_$(date +%Y%m%d_%H%M%S)
echo "✅ Backup created"
echo ""

# Find all duplicate folders
echo "🔍 Scanning for duplicate folders..."
echo ""

# Find all 'app' folders
APP_FOLDERS=$(find . -type d -name "app" 2>/dev/null)
echo "Found app folders:"
echo "$APP_FOLDERS"
echo ""

# Find all 'components' folders
COMPONENT_FOLDERS=$(find . -type d -name "components" 2>/dev/null)
echo "Found components folders:"
echo "$COMPONENT_FOLDERS"
echo ""

# Find all 'lib' folders
LIB_FOLDERS=$(find . -type d -name "lib" 2>/dev/null)
echo "Found lib folders:"
echo "$LIB_FOLDERS"
echo ""

echo "════════════════════════════════════════════════════════════════════"
echo "CONSOLIDATION PLAN:"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "1. Keep main folders at root: ./app, ./components, ./lib"
echo "2. Merge any nested folders into main ones"
echo "3. Move all documentation (.md files) to ./docs"
echo "4. Move all scripts (.py files) to ./scripts"
echo "5. Remove empty nested folders"
echo ""

read -p "Proceed with consolidation? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Cancelled"
    exit 1
fi

echo ""
echo "🚀 Starting consolidation..."
echo ""

# Create docs and scripts folders
mkdir -p docs
mkdir -p scripts

# Move all .md files to docs
echo "📄 Moving documentation..."
find . -maxdepth 1 -name "*.md" -exec mv {} docs/ \; 2>/dev/null
echo "✅ Documentation moved to ./docs"

# Move all .py files to scripts
echo "🐍 Moving Python scripts..."
find . -maxdepth 1 -name "*.py" -exec mv {} scripts/ \; 2>/dev/null
echo "✅ Scripts moved to ./scripts"

# Merge nested app folders
echo "📱 Merging app folders..."
for folder in $(find . -type d -name "app" | grep -v "^\./app$"); do
    if [ -d "$folder" ]; then
        echo "  Merging $folder into ./app"
        rsync -av "$folder/" ./app/ 2>/dev/null
    fi
done
echo "✅ App folders merged"

# Merge nested components folders
echo "🧩 Merging components folders..."
for folder in $(find . -type d -name "components" | grep -v "^\./components$"); do
    if [ -d "$folder" ]; then
        echo "  Merging $folder into ./components"
        rsync -av "$folder/" ./components/ 2>/dev/null
    fi
done
echo "✅ Components folders merged"

# Merge nested lib folders
echo "📚 Merging lib folders..."
for folder in $(find . -type d -name "lib" | grep -v "^\./lib$"); do
    if [ -d "$folder" ]; then
        echo "  Merging $folder into ./lib"
        rsync -av "$folder/" ./lib/ 2>/dev/null
    fi
done
echo "✅ Lib folders merged"

# Remove nested scoutpulse folders (but keep main content)
echo "🗑️  Removing empty nested folders..."
find . -type d -name "scoutpulse" -not -path "." -exec rm -rf {} \; 2>/dev/null
echo "✅ Cleanup complete"

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "CONSOLIDATION COMPLETE!"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "Final structure:"
echo ""
ls -la | grep "^d" | awk '{print $9}' | grep -v "^\.$" | grep -v "^\.\.$" | sed 's/^/  📁 /'
echo ""
echo "Your backup is at: ~/scoutpulse_backup_$(date +%Y%m%d_%H%M%S)"
echo ""
echo "✅ Ready to run the polisher on /Users/ricknini/scoutpulse"
