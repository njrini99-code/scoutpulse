#!/usr/bin/env python3
"""
ScoutPulse Direct API Polisher
Uses Claude API to generate code and writes directly to files
No Cursor needed - fully autonomous
"""

import anthropic
import os
import time
import re

class DirectAPIPolisher:
    def __init__(self, api_key, scoutpulse_path):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.scoutpulse_path = scoutpulse_path
        
    def comprehensive_audit(self):
        """Run full production audit"""
        print("\n" + "="*70)
        print("COMPREHENSIVE PRODUCTION AUDIT")
        print("="*70 + "\n")
        
        audits = []
        
        audit_prompts = [
            ("FEATURES", self.get_feature_audit_prompt()),
            ("UI_UX", self.get_ui_audit_prompt()),
            ("ROUTING", self.get_routing_audit_prompt()),
            ("DESIGN", self.get_design_audit_prompt()),
            ("INTERACTIONS", self.get_interactions_audit_prompt()),
            ("ERRORS", self.get_error_handling_audit_prompt()),
            ("PERFORMANCE", self.get_performance_audit_prompt()),
            ("ACCESSIBILITY", self.get_accessibility_audit_prompt()),
            ("MOBILE", self.get_mobile_audit_prompt()),
            ("QUALITY", self.get_quality_audit_prompt()),
        ]
        
        for i, (category, prompt) in enumerate(audit_prompts, 1):
            print(f"{i}/10 - Auditing {category}...")
            
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            audits.append((category, response.content[0].text))
            time.sleep(2)
        
        return audits
    
    def get_feature_audit_prompt(self):
        return f"""Audit {self.scoutpulse_path} for FEATURE COMPLETENESS.

Check all features exist and work. List MISSING/INCOMPLETE features with:
- Feature name
- File path that needs work
- What's missing
- Priority (CRITICAL/HIGH/MEDIUM/LOW)

Format each issue as:
PRIORITY | FILE_PATH | ISSUE | WHAT_TO_DO
"""
    
    def get_ui_audit_prompt(self):
        return f"""Audit {self.scoutpulse_path} for UI/UX COMPLETENESS.

Check all screens for:
- Missing glassmorphism effects
- Inconsistent styling
- Missing empty/loading states
- Layout issues

Format each issue as:
PRIORITY | FILE_PATH | ISSUE | WHAT_TO_DO
"""
    
    def get_routing_audit_prompt(self):
        return f"""Audit {self.scoutpulse_path} for NAVIGATION & ROUTING.

Check:
- All routes exist
- Navigation works
- Links go to correct places
- 404 handling

Format each issue as:
PRIORITY | FILE_PATH | ISSUE | WHAT_TO_DO
"""
    
    def get_design_audit_prompt(self):
        return f"""Audit {self.scoutpulse_path} for GLASSMORPHISM & ANIMATIONS.

Every component should have:
- backdrop-filter: blur(24px)
- Glass borders
- Smooth animations
- Hover effects

Format each issue as:
PRIORITY | FILE_PATH | ISSUE | WHAT_TO_DO
"""
    
    def get_interactions_audit_prompt(self):
        return f"""Audit {self.scoutpulse_path} for INTERACTIVITY.

Check all buttons, forms, inputs work.
Check all states (loading, error, success).

Format each issue as:
PRIORITY | FILE_PATH | ISSUE | WHAT_TO_DO
"""
    
    def get_error_handling_audit_prompt(self):
        return f"""Audit {self.scoutpulse_path} for ERROR HANDLING.

Check for error boundaries, try/catch, validation.

Format each issue as:
PRIORITY | FILE_PATH | ISSUE | WHAT_TO_DO
"""
    
    def get_performance_audit_prompt(self):
        return f"""Audit {self.scoutpulse_path} for PERFORMANCE.

Check for lazy loading, code splitting, optimization.

Format each issue as:
PRIORITY | FILE_PATH | ISSUE | WHAT_TO_DO
"""
    
    def get_accessibility_audit_prompt(self):
        return f"""Audit {self.scoutpulse_path} for ACCESSIBILITY.

Check ARIA labels, keyboard nav, contrast.

Format each issue as:
PRIORITY | FILE_PATH | ISSUE | WHAT_TO_DO
"""
    
    def get_mobile_audit_prompt(self):
        return f"""Audit {self.scoutpulse_path} for MOBILE RESPONSIVENESS.

Check responsive design at all breakpoints.

Format each issue as:
PRIORITY | FILE_PATH | ISSUE | WHAT_TO_DO
"""
    
    def get_quality_audit_prompt(self):
        return f"""Audit {self.scoutpulse_path} for CODE QUALITY.

Check for TypeScript errors, console warnings, TODOs.

Format each issue as:
PRIORITY | FILE_PATH | ISSUE | WHAT_TO_DO
"""
    
    def parse_tasks(self, audits):
        """Parse all audits into actionable tasks"""
        print("\n📋 Parsing tasks from audits...")
        
        tasks = []
        for category, audit_text in audits:
            lines = audit_text.split('\n')
            for line in lines:
                if '|' in line:
                    parts = [p.strip() for p in line.split('|')]
                    if len(parts) >= 4 and any(p in parts[0].upper() for p in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']):
                        tasks.append({
                            'priority': parts[0],
                            'file': parts[1],
                            'issue': parts[2],
                            'action': parts[3],
                            'category': category
                        })
        
        # Sort by priority
        priority_order = {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3}
        tasks.sort(key=lambda x: priority_order.get(x['priority'], 4))
        
        return tasks
    
    def read_file(self, filepath):
        """Read a file"""
        full_path = os.path.join(self.scoutpulse_path, filepath.lstrip('/'))
        try:
            with open(full_path, 'r') as f:
                return f.read()
        except Exception as e:
            print(f"❌ Error reading {filepath}: {e}")
            return None
    
    def write_file(self, filepath, content):
        """Write to a file"""
        full_path = os.path.join(self.scoutpulse_path, filepath.lstrip('/'))
        
        # Create directory if needed
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        try:
            with open(full_path, 'w') as f:
                f.write(content)
            print(f"✅ Wrote to {filepath}")
            return True
        except Exception as e:
            print(f"❌ Error writing {filepath}: {e}")
            return False
    
    def fix_file(self, task):
        """Use Claude to fix a file"""
        print(f"\n{'='*70}")
        print(f"🎯 FIXING: {task['issue']}")
        print(f"📁 FILE: {task['file']}")
        print(f"⚡ PRIORITY: {task['priority']}")
        print(f"{'='*70}\n")
        
        # Read current file
        current_content = self.read_file(task['file'])
        if current_content is None:
            print("⚠️  File doesn't exist yet. Creating new file...")
            current_content = ""
        
        # Ask Claude to fix it
        fix_prompt = f"""Fix this file for ScoutPulse.

FILE: {task['file']}
ISSUE: {task['issue']}
ACTION NEEDED: {task['action']}

CURRENT CODE:
```
{current_content}
```

REQUIREMENTS:
1. Fix the issue described
2. Maintain all existing functionality
3. Use glassmorphism design (backdrop-blur-2xl, rgba backgrounds, white/15 borders)
4. Add smooth animations where appropriate
5. Ensure TypeScript types are correct
6. Keep code clean and readable

Return ONLY the complete fixed file content. No explanations, no markdown, just the code."""

        print("🤖 Asking Claude to fix it...")
        
        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=8000,
            messages=[{"role": "user", "content": fix_prompt}]
        )
        
        fixed_content = response.content[0].text
        
        # Clean up markdown if Claude added it
        fixed_content = re.sub(r'^```[a-z]*\n', '', fixed_content)
        fixed_content = re.sub(r'\n```$', '', fixed_content)
        
        # Write to file
        success = self.write_file(task['file'], fixed_content)
        
        return success
    
    def save_audit_report(self, audits):
        """Save audit report"""
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        filename = f"scoutpulse_audit_{timestamp}.txt"
        
        with open(filename, 'w') as f:
            f.write("="*70 + "\n")
            f.write("SCOUTPULSE PRODUCTION AUDIT\n")
            f.write(f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write("="*70 + "\n\n")
            
            for category, results in audits:
                f.write(f"\n{'='*70}\n")
                f.write(f"{category}\n")
                f.write(f"{'='*70}\n\n")
                f.write(results)
                f.write("\n\n")
        
        print(f"\n💾 Audit saved: {filename}")
        return filename
    
    def run(self):
        """Main execution"""
        print("\n" + "="*70)
        print("SCOUTPULSE DIRECT API POLISHER")
        print("Fully autonomous - no Cursor needed!")
        print("="*70 + "\n")
        
        # Run audits
        audits = self.comprehensive_audit()
        
        # Save report
        report = self.save_audit_report(audits)
        
        # Parse tasks
        tasks = self.parse_tasks(audits)
        
        if not tasks:
            print("\n✅ No issues found! ScoutPulse is production-ready!")
            return
        
        print(f"\n📋 Found {len(tasks)} issues to fix\n")
        
        # Show breakdown
        priorities = {}
        for task in tasks:
            priorities[task['priority']] = priorities.get(task['priority'], 0) + 1
        
        print("Breakdown:")
        for priority, count in sorted(priorities.items()):
            print(f"  {priority}: {count} tasks")
        
        # Ask to proceed
        print("\n" + "="*70)
        print("⚠️  This will automatically modify your files!")
        print("Make sure you have a backup or git commit first.")
        proceed = input("\nProceed with automatic fixes? (yes/no): ")
        
        if proceed.lower() != 'yes':
            print("\n❌ Cancelled. Check the audit report for details.")
            return
        
        # Fix each task
        completed = []
        failed = []
        
        for i, task in enumerate(tasks, 1):
            print(f"\n[{i}/{len(tasks)}]")
            
            success = self.fix_file(task)
            
            if success:
                completed.append(task)
                print("✅ Fixed!\n")
            else:
                failed.append(task)
                print("❌ Failed\n")
            
            # Small delay to avoid rate limits
            time.sleep(1)
        
        # Final report
        print("\n" + "="*70)
        print("COMPLETE!")
        print("="*70)
        print(f"\n✅ Fixed: {len(completed)}/{len(tasks)}")
        print(f"❌ Failed: {len(failed)}/{len(tasks)}")
        
        if failed:
            print("\n⚠️  Failed tasks:")
            for task in failed:
                print(f"  - {task['issue']} ({task['file']})")
        
        print(f"\n📄 Audit report: {report}")
        print("\n🎉 ScoutPulse is now more production-ready!")

def main():
    print("╔════════════════════════════════════════════════════════════════════╗")
    print("║   SCOUTPULSE DIRECT API POLISHER                                  ║")
    print("║   Uses Claude API to automatically fix your code                  ║")
    print("╚════════════════════════════════════════════════════════════════════╝\n")
    
    API_KEY = "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"
    SCOUTPULSE_PATH = input("📂 Enter ScoutPulse project path: ")
    
    polisher = DirectAPIPolisher(API_KEY, SCOUTPULSE_PATH)
    polisher.run()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Stopped by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
