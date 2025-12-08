#!/usr/bin/env python3
"""
ScoutPulse Cursor-Integrated Improvement Agent
Finds improvements, asks permission, then sends prompts to Cursor automatically

SECURITY: Uses environment variables for API key
"""

import anthropic
import subprocess
import time
import os
import json
from pathlib import Path

class CursorImprovementAgent:
    def __init__(self, api_key=None, project_path=None):
        # Get API key from environment or parameter
        self.api_key = api_key or os.getenv('ANTHROPIC_API_KEY')
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set. Export it or pass as parameter.")
        
        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.project_path = project_path or os.getenv('SCOUTPULSE_PROJECT_PATH', '/Users/ricknini/Downloads/scoutpulse')
        self.improvements_applied = 0
        self.improvements_history = []
        
        # Load previous improvements to avoid duplicates
        self.history_file = Path(self.project_path) / '.improvement_history.json'
        self.load_history()
        
    def load_history(self):
        """Load previous improvements to avoid duplicates"""
        if self.history_file.exists():
            try:
                with open(self.history_file, 'r') as f:
                    self.improvements_history = json.load(f)
            except:
                self.improvements_history = []
    
    def save_history(self, improvement):
        """Save improvement to history"""
        self.improvements_history.append({
            'title': improvement.get('title'),
            'file': improvement.get('file'),
            'timestamp': time.time()
        })
        try:
            with open(self.history_file, 'w') as f:
                json.dump(self.improvements_history[-50:], f, indent=2)  # Keep last 50
        except:
            pass
    
    def scan_for_improvements(self, category=None):
        """Scan codebase for improvements in a specific category"""
        
        categories = {
            'features': 'Feature completeness - buttons that work, forms that submit, complete user flows',
            'functionality': 'Core functionality - data persistence, API integration, real vs mock data',
            'database': 'Database integration - queries, real-time, data flow',
            'ui': 'UI polish - hover states, animations, loading states, empty states',
            'ux': 'UX improvements - feedback, navigation, error handling',
            'performance': 'Performance - load times, bundle size, optimizations',
            'accessibility': 'Accessibility - keyboard nav, screen readers, ARIA',
            'mobile': 'Mobile responsiveness - breakpoints, touch targets',
            'code': 'Code quality - TypeScript errors, console warnings, duplicates'
        }
        
        if category:
            focus = f"Focus ONLY on: {categories.get(category, category)}"
        else:
            focus = "Cover all categories"
        
        # Build history context
        history_context = ""
        if self.improvements_history:
            recent = self.improvements_history[-10:]
            history_context = "\n\nPrevious improvements to avoid duplicating:\n"
            for item in recent:
                history_context += f"- {item.get('title')} in {item.get('file')}\n"
        
        scan_prompt = f"""Analyze the ScoutPulse project at {self.project_path}.

{focus}

Find 5-10 concrete, actionable improvements. For each improvement:

1. **TYPE:** quick_win | feature | polish | fix
2. **CATEGORY:** {category or 'any'}
3. **TITLE:** Short description
4. **FILE:** Exact file path
5. **CURRENT:** What's happening now
6. **EXPECTED:** What should happen
7. **CURSOR_PROMPT:** Exact prompt to give Cursor AI to implement this
8. **EFFORT:** 15min | 1hr | 4hrs
9. **IMPACT:** Why this matters

**CRITICAL:** The CURSOR_PROMPT must be:
- Specific and actionable
- Reference exact file paths
- Include code examples if needed
- Be complete enough for Cursor to implement without asking questions

**IMPORTANT:** Check the COMPREHENSIVE_AUDIT_REPORT.md file for already identified issues and focus on NEW improvements not yet addressed.

Return as JSON array like:
[
  {{
    "type": "quick_win",
    "category": "ui",
    "title": "Add hover state to PlayerCard",
    "file": "components/PlayerCard.tsx",
    "current": "Card is static, no hover feedback",
    "expected": "Card lifts 4px with shadow on hover",
    "cursor_prompt": "In components/PlayerCard.tsx, add hover states to the card. The card should lift 4px and increase shadow on hover. Add these Tailwind classes to the main card div: 'hover:-translate-y-1 hover:shadow-2xl transition-all duration-300'. Make sure the transition is smooth and feels premium.",
    "effort": "15min",
    "impact": "Better UX, clearer affordances"
  }}
]
{history_context}
"""
        
        print(f"\n🔍 Scanning for improvements...")
        if category:
            print(f"   Focus: {categories.get(category, category)}")
        
        try:
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=8000,
                messages=[{"role": "user", "content": scan_prompt}]
            )
            
            content = response.content[0].text
            
            # Extract JSON
            start = content.find('[')
            end = content.rfind(']') + 1
            if start >= 0 and end > start:
                improvements = json.loads(content[start:end])
                
                # Filter out duplicates based on history
                filtered = []
                for imp in improvements:
                    is_duplicate = any(
                        imp.get('title') == h.get('title') and 
                        imp.get('file') == h.get('file')
                        for h in self.improvements_history
                    )
                    if not is_duplicate:
                        filtered.append(imp)
                
                return filtered
        except Exception as e:
            print(f"❌ Error scanning: {e}")
            return []
        
        return []
    
    def present_improvement(self, improvement, number, total):
        """Present a single improvement to user"""
        print("\n" + "="*70)
        print(f"IMPROVEMENT {number}/{total}")
        print("="*70)
        print(f"\n📌 {improvement['title']}")
        print(f"📁 File: {improvement['file']}")
        print(f"⚡ Type: {improvement['type']}")
        print(f"📂 Category: {improvement['category']}")
        print(f"⏱️  Effort: {improvement['effort']}")
        print(f"💡 Impact: {improvement['impact']}")
        print(f"\n📊 Current State:")
        print(f"   {improvement['current']}")
        print(f"\n✨ Expected State:")
        print(f"   {improvement['expected']}")
        print(f"\n🤖 Cursor Prompt:")
        print(f"   {improvement['cursor_prompt'][:200]}...")
        if len(improvement['cursor_prompt']) > 200:
            print(f"   ... ({len(improvement['cursor_prompt'])} chars total)")
    
    def send_to_cursor(self, prompt):
        """Send prompt to Cursor AI via AppleScript"""
        print("\n💬 Sending to Cursor AI...")
        
        # Clean the prompt for AppleScript - handle special characters
        clean_prompt = prompt.replace('\\', '\\\\').replace('"', '\\"').replace("'", "\\'")
        # Replace newlines with spaces for AppleScript
        clean_prompt = ' '.join(clean_prompt.split())
        
        applescript = f'''
        tell application "Cursor"
            activate
        end tell
        
        delay 1
        
        tell application "System Events"
            keystroke "l" using {{command down}}
            delay 1
            keystroke "{clean_prompt}"
            delay 0.5
            keystroke return
        end tell
        '''
        
        try:
            subprocess.run(['osascript', '-e', applescript], check=True, timeout=10)
            print("✅ Sent to Cursor AI!")
            return True
        except subprocess.TimeoutExpired:
            print("❌ Timeout sending to Cursor")
            return False
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    def run_improvement_session(self, category=None, auto_mode=False):
        """Run a session of improvements"""
        
        print("\n" + "="*70)
        print("CURSOR-INTEGRATED IMPROVEMENT SESSION")
        print("="*70)
        
        if category:
            print(f"\n🎯 Focus: {category}")
        else:
            print(f"\n🎯 Focus: All categories")
        
        print(f"🤖 Mode: {'Automatic' if auto_mode else 'Ask permission'}")
        
        # Scan for improvements
        improvements = self.scan_for_improvements(category)
        
        if not improvements:
            print("\n✅ No new improvements found! Your code is looking good.")
            return
        
        print(f"\n📋 Found {len(improvements)} new improvements")
        
        # Process each improvement
        for i, improvement in enumerate(improvements, 1):
            # Present the improvement
            self.present_improvement(improvement, i, len(improvements))
            
            # Ask for permission (unless auto mode)
            if not auto_mode:
                print("\n" + "-"*70)
                response = input("\nApply this improvement? (y/n/skip/quit): ").lower().strip()
                
                if response == 'quit' or response == 'q':
                    print("\n⚠️  Session ended by user")
                    break
                elif response == 'skip' or response == 's':
                    print("⏭️  Skipped")
                    continue
                elif response != 'y' and response != 'yes':
                    print("⏭️  Skipped")
                    continue
            
            # Send to Cursor
            success = self.send_to_cursor(improvement['cursor_prompt'])
            
            if success:
                self.improvements_applied += 1
                self.save_history(improvement)
                
                # Wait for Cursor to process
                wait_time = 15
                print(f"\n⏳ Waiting {wait_time}s for Cursor to generate...")
                time.sleep(wait_time)
                
                # Verify with user
                verify = input("\n✓ Did Cursor complete this successfully? (y/n): ").lower().strip()
                
                if verify == 'y' or verify == 'yes':
                    print("✅ Improvement applied!")
                else:
                    print("⚠️  May need manual review")
            
            # Brief pause between improvements
            if i < len(improvements):
                time.sleep(2)
        
        # Summary
        print("\n" + "="*70)
        print("SESSION COMPLETE")
        print("="*70)
        print(f"\n✅ Improvements applied: {self.improvements_applied}/{len(improvements)}")
    
    def run_continuous_mode(self):
        """Run continuous improvement sessions"""
        
        categories = [
            None,  # All categories first
            'features',
            'functionality', 
            'database',
            'ui',
            'ux',
            'performance',
            'accessibility',
            'mobile',
            'code'
        ]
        
        print("\n" + "="*70)
        print("CONTINUOUS IMPROVEMENT MODE")
        print("="*70)
        print("\nThis will run improvement sessions for each category:")
        for cat in categories:
            print(f"  • {cat or 'All categories'}")
        print("\nYou'll review each improvement before it's sent to Cursor.")
        print("Press Ctrl+C to stop at any time.\n")
        
        input("Press Enter to begin...")
        
        for category in categories:
            print(f"\n\n{'='*70}")
            print(f"CATEGORY: {(category or 'ALL').upper()}")
            print(f"{'='*70}\n")
            
            self.run_improvement_session(category=category, auto_mode=False)
            
            # Ask to continue
            if category != categories[-1]:
                cont = input(f"\n\nContinue to next category ({categories[categories.index(category)+1]})? (y/n): ").lower().strip()
                if cont != 'y' and cont != 'yes':
                    print("\n⚠️  Continuous mode stopped")
                    break
        
        print("\n" + "="*70)
        print("CONTINUOUS MODE COMPLETE")
        print("="*70)
        print(f"\n🎉 Total improvements applied: {self.improvements_applied}")

def main():
    print("╔════════════════════════════════════════════════════════════════════╗")
    print("║   CURSOR-INTEGRATED IMPROVEMENT AGENT                             ║")
    print("║   Finds improvements → Asks permission → Prompts Cursor           ║")
    print("╚════════════════════════════════════════════════════════════════════╝\n")
    
    # Get API key from environment
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        print("⚠️  ANTHROPIC_API_KEY not found in environment")
        api_key = input("Enter your Anthropic API key (or set ANTHROPIC_API_KEY env var): ").strip()
        if not api_key:
            print("❌ API key required")
            return
    
    project_path = os.getenv('SCOUTPULSE_PROJECT_PATH', '/Users/ricknini/Downloads/scoutpulse')
    
    print(f"📂 Project: {project_path}")
    print(f"🤖 Cursor: Will be prompted automatically\n")
    
    try:
        agent = CursorImprovementAgent(api_key=api_key, project_path=project_path)
    except ValueError as e:
        print(f"❌ {e}")
        return
    
    print("Choose mode:")
    print("  1. Single session (one category)")
    print("  2. Continuous mode (all categories, back to back)")
    print("  3. Focus on specific category")
    
    mode = input("\nSelect mode (1/2/3): ").strip()
    
    if mode == '1':
        agent.run_improvement_session()
    
    elif mode == '2':
        agent.run_continuous_mode()
    
    elif mode == '3':
        print("\nCategories:")
        print("  1. features")
        print("  2. functionality")
        print("  3. database")
        print("  4. ui")
        print("  5. ux")
        print("  6. performance")
        print("  7. accessibility")
        print("  8. mobile")
        print("  9. code")
        
        cat_choice = input("\nSelect category (1-9): ").strip()
        
        categories = ['features', 'functionality', 'database', 'ui', 'ux', 
                     'performance', 'accessibility', 'mobile', 'code']
        
        try:
            category = categories[int(cat_choice) - 1]
            agent.run_improvement_session(category=category)
        except:
            print("Invalid category")
    
    else:
        print("Invalid mode")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Stopped by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

