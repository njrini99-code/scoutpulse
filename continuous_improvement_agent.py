#!/usr/bin/env python3
"""
ScoutPulse Continuous Improvement Agent
Monitors your codebase and continuously suggests/implements improvements
"""

import anthropic
import os
import time
import json
from datetime import datetime

class ContinuousImprovementAgent:
    def __init__(self, api_key, project_path):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.project_path = project_path
        self.history_file = os.path.join(project_path, '.improvement_history.json')
        self.load_history()
        
    def load_history(self):
        """Load improvement history"""
        if os.path.exists(self.history_file):
            with open(self.history_file, 'r') as f:
                self.history = json.load(f)
        else:
            self.history = {
                'improvements': [],
                'last_scan': None,
                'total_improvements': 0
            }
    
    def save_history(self):
        """Save improvement history"""
        with open(self.history_file, 'w') as f:
            json.dump(self.history, f, indent=2)
    
    def get_recent_changes(self):
        """Get files modified in last 24 hours"""
        import subprocess
        try:
            result = subprocess.run(
                ['git', '-C', self.project_path, 'diff', '--name-only', 'HEAD@{24.hours.ago}..HEAD'],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                return result.stdout.strip().split('\n') if result.stdout else []
        except:
            pass
        return []
    
    def scan_for_improvements(self):
        """Scan codebase for potential improvements"""
        print("\n🔍 SCANNING FOR IMPROVEMENTS")
        print("=" * 70)
        
        scan_prompt = f"""Analyze the ScoutPulse project at {self.project_path}.

Focus on finding:

1. **Quick Wins** (< 30 min each):
   - Missing hover states
   - Inconsistent spacing
   - Missing loading states
   - Console.log statements
   - TODO comments
   - Hardcoded values that should be constants
   - Missing error boundaries
   - Unoptimized images

2. **Medium Improvements** (1-2 hours each):
   - Missing animations
   - Incomplete glassmorphism
   - Non-responsive components
   - Missing accessibility features
   - Performance bottlenecks
   - Repeated code that could be abstracted

3. **Major Enhancements** (half-day each):
   - New features that would add value
   - Architecture improvements
   - Major UX enhancements
   - Integration opportunities

For each improvement, provide:
- TYPE: quick_win | medium | major
- PRIORITY: 1-10 (10 = critical)
- FILE: file path
- TITLE: short description
- IMPACT: what improvement this brings
- EFFORT: estimated time
- CODE: exact code changes needed

Return as JSON array of improvements, sorted by (PRIORITY * IMPACT / EFFORT).

Previous improvements to avoid duplicating:
{json.dumps([i['title'] for i in self.history['improvements'][-20:]], indent=2)}
"""
        
        print("Analyzing codebase...")
        
        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=8000,
            messages=[{"role": "user", "content": scan_prompt}]
        )
        
        content = response.content[0].text
        
        # Extract JSON from response
        try:
            # Find JSON array in response
            start = content.find('[')
            end = content.rfind(']') + 1
            if start >= 0 and end > start:
                improvements = json.loads(content[start:end])
                return improvements
        except Exception as e:
            print(f"❌ Error parsing improvements: {e}")
            return []
        
        return []
    
    def present_improvements(self, improvements):
        """Present improvements to user for selection"""
        if not improvements:
            print("\n✅ No new improvements found! Your codebase is in great shape.")
            return []
        
        print(f"\n📋 FOUND {len(improvements)} IMPROVEMENTS")
        print("=" * 70)
        
        for i, improvement in enumerate(improvements[:10], 1):  # Show top 10
            print(f"\n[{i}] {improvement.get('title', 'Unnamed')}")
            print(f"    📁 File: {improvement.get('file', 'N/A')}")
            print(f"    ⚡ Type: {improvement.get('type', 'N/A')}")
            print(f"    🎯 Priority: {improvement.get('priority', 0)}/10")
            print(f"    ⏱️  Effort: {improvement.get('effort', 'N/A')}")
            print(f"    💡 Impact: {improvement.get('impact', 'N/A')}")
        
        print("\n" + "=" * 70)
        return improvements[:10]
    
    def implement_improvement(self, improvement):
        """Implement a single improvement"""
        print(f"\n🔧 IMPLEMENTING: {improvement['title']}")
        print(f"📁 File: {improvement['file']}")
        
        file_path = os.path.join(self.project_path, improvement['file'])
        
        # Read current file
        try:
            with open(file_path, 'r') as f:
                current_content = f.read()
        except FileNotFoundError:
            print(f"❌ File not found: {file_path}")
            return False
        
        # Ask Claude to implement the improvement
        implement_prompt = f"""Implement this improvement:

IMPROVEMENT: {improvement['title']}
FILE: {improvement['file']}
CURRENT CODE:
```
{current_content}
```

REQUIRED CHANGES:
{improvement.get('code', 'Apply the improvement described in the title and impact')}

IMPACT: {improvement['impact']}

Return ONLY the complete updated file content. No explanations, no markdown, just code.
"""
        
        print("Generating improved code...")
        
        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=8000,
            messages=[{"role": "user", "content": implement_prompt}]
        )
        
        improved_content = response.content[0].text
        
        # Clean markdown if present
        import re
        improved_content = re.sub(r'^```[a-z]*\n', '', improved_content)
        improved_content = re.sub(r'\n```$', '', improved_content)
        
        # Write improved file
        try:
            with open(file_path, 'w') as f:
                f.write(improved_content)
            print(f"✅ Implemented successfully!")
            return True
        except Exception as e:
            print(f"❌ Error writing file: {e}")
            return False
    
    def run_continuous_mode(self, interval_hours=24, auto_apply_quick_wins=False):
        """Run in continuous mode - scans periodically"""
        print("\n" + "=" * 70)
        print("CONTINUOUS IMPROVEMENT AGENT - RUNNING")
        print("=" * 70)
        print(f"\n⏰ Scan interval: {interval_hours} hours")
        print(f"🤖 Auto-apply quick wins: {auto_apply_quick_wins}")
        print("\nPress Ctrl+C to stop\n")
        
        iteration = 0
        
        try:
            while True:
                iteration += 1
                print(f"\n{'=' * 70}")
                print(f"SCAN #{iteration} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"{'=' * 70}")
                
                # Scan for improvements
                improvements = self.scan_for_improvements()
                
                if not improvements:
                    print("✅ No improvements needed right now!")
                else:
                    # Present improvements
                    top_improvements = self.present_improvements(improvements)
                    
                    if auto_apply_quick_wins:
                        # Auto-apply quick wins
                        quick_wins = [i for i in top_improvements if i.get('type') == 'quick_win']
                        
                        if quick_wins:
                            print(f"\n🤖 Auto-applying {len(quick_wins)} quick wins...")
                            
                            for improvement in quick_wins:
                                success = self.implement_improvement(improvement)
                                
                                if success:
                                    self.history['improvements'].append({
                                        'timestamp': datetime.now().isoformat(),
                                        'title': improvement['title'],
                                        'file': improvement['file'],
                                        'type': improvement['type']
                                    })
                                    self.history['total_improvements'] += 1
                                    self.save_history()
                                
                                time.sleep(2)
                    else:
                        # Manual selection
                        print("\nSelect improvements to apply (comma-separated, e.g. 1,3,5):")
                        print("Or press Enter to skip this round")
                        selection = input("Selection: ").strip()
                        
                        if selection:
                            indices = [int(i.strip()) - 1 for i in selection.split(',') if i.strip().isdigit()]
                            
                            for idx in indices:
                                if 0 <= idx < len(top_improvements):
                                    improvement = top_improvements[idx]
                                    success = self.implement_improvement(improvement)
                                    
                                    if success:
                                        self.history['improvements'].append({
                                            'timestamp': datetime.now().isoformat(),
                                            'title': improvement['title'],
                                            'file': improvement['file'],
                                            'type': improvement['type']
                                        })
                                        self.history['total_improvements'] += 1
                                        self.save_history()
                                    
                                    time.sleep(2)
                
                self.history['last_scan'] = datetime.now().isoformat()
                self.save_history()
                
                # Wait for next scan
                print(f"\n⏰ Next scan in {interval_hours} hours...")
                print(f"💤 Sleeping... (Ctrl+C to stop)")
                time.sleep(interval_hours * 3600)
                
        except KeyboardInterrupt:
            print("\n\n⚠️  Continuous mode stopped by user")
            self.show_stats()
    
    def run_single_scan(self):
        """Run a single improvement scan"""
        print("\n" + "=" * 70)
        print("SINGLE SCAN MODE")
        print("=" * 70)
        
        # Scan
        improvements = self.scan_for_improvements()
        
        if not improvements:
            print("\n✅ No improvements needed!")
            return
        
        # Present
        top_improvements = self.present_improvements(improvements)
        
        # Manual selection
        print("\nSelect improvements to apply (comma-separated, e.g. 1,3,5):")
        print("Or 'all' to apply all, or Enter to skip")
        selection = input("Selection: ").strip()
        
        if not selection:
            print("❌ Skipped")
            return
        
        if selection.lower() == 'all':
            indices = list(range(len(top_improvements)))
        else:
            indices = [int(i.strip()) - 1 for i in selection.split(',') if i.strip().isdigit()]
        
        # Apply selected improvements
        for idx in indices:
            if 0 <= idx < len(top_improvements):
                improvement = top_improvements[idx]
                success = self.implement_improvement(improvement)
                
                if success:
                    self.history['improvements'].append({
                        'timestamp': datetime.now().isoformat(),
                        'title': improvement['title'],
                        'file': improvement['file'],
                        'type': improvement['type']
                    })
                    self.history['total_improvements'] += 1
                    self.save_history()
                
                time.sleep(2)
        
        self.show_stats()
    
    def show_stats(self):
        """Show improvement statistics"""
        print("\n" + "=" * 70)
        print("IMPROVEMENT STATISTICS")
        print("=" * 70)
        print(f"\n📊 Total improvements: {self.history['total_improvements']}")
        print(f"📅 Last scan: {self.history.get('last_scan', 'Never')}")
        
        if self.history['improvements']:
            print(f"\n Recent improvements:")
            for improvement in self.history['improvements'][-5:]:
                print(f"  ✓ {improvement['title']} ({improvement['timestamp'][:10]})")

def main():
    print("╔════════════════════════════════════════════════════════════════════╗")
    print("║   SCOUTPULSE CONTINUOUS IMPROVEMENT AGENT                         ║")
    print("║   Always making your code better                                   ║")
    print("╚════════════════════════════════════════════════════════════════════╝\n")
    
    API_KEY = "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"
    PROJECT_PATH = input("📂 Enter ScoutPulse project path: ").strip()
    
    agent = ContinuousImprovementAgent(API_KEY, PROJECT_PATH)
    
    print("\nMode:")
    print("  1. Single scan (find and apply improvements now)")
    print("  2. Continuous mode (scan every 24 hours)")
    print("  3. Continuous with auto quick-wins (auto-apply small improvements)")
    
    mode = input("\nSelect mode (1/2/3): ").strip()
    
    if mode == '1':
        agent.run_single_scan()
    elif mode == '2':
        agent.run_continuous_mode(interval_hours=24, auto_apply_quick_wins=False)
    elif mode == '3':
        agent.run_continuous_mode(interval_hours=24, auto_apply_quick_wins=True)
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
