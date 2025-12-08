#!/usr/bin/env python3
"""
ScoutPulse Landing Page & Onboarding Enhancement Agent
Makes the home page, login, and onboarding experience absolutely stunning
"""

import anthropic
import time
import json
import os
import sys
from pathlib import Path

class LandingPageAgent:
    def __init__(self, api_key, project_path):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.project_path = project_path
        self.enhancements_added = 0
        
    def scan_landing_page_enhancements(self):
        """Scan for landing page, login, and onboarding enhancements"""
        
        enhancement_prompt = f"""Analyze ScoutPulse's landing page, login, and onboarding flow at {self.project_path}.

We need a STUNNING first impression. Think Apple, Stripe, Linear, Vercel level polish.

Suggest 15-20 enhancements across these areas:

# LANDING PAGE (/) - The Main Homepage

**Current State:** Likely basic or incomplete
**Target:** Premium SaaS landing page that converts visitors into users

Suggest enhancements for:
1. **Hero Section**
   - Animated headline with gradient text
   - Compelling value proposition
   - CTA buttons with hover effects
   - Hero image/video/3D animation
   - Social proof (logos, testimonials)

2. **Features Section**
   - Bento grid layout
   - Interactive feature cards
   - Screenshots/GIFs showing features
   - Icon animations on scroll
   - "See it in action" demos

3. **Social Proof**
   - Testimonials with photos
   - Success stories
   - Stats that matter (X players recruited, Y coaches, Z connections)
   - Logo cloud of schools using it
   - Video testimonials

4. **Pricing Section (if applicable)**
   - Clear pricing tiers
   - Feature comparison
   - "Most popular" badge
   - Annual/Monthly toggle
   - CTA buttons

5. **Footer**
   - Quick links
   - Social media
   - Newsletter signup
   - Trust badges
   - Legal links

6. **Animations & Interactions**
   - Scroll animations (Intersection Observer)
   - Parallax effects
   - Hover states on everything
   - Smooth transitions
   - Loading animations

# LOGIN PAGE (/login)

**Target:** Beautiful, trustworthy, fast login experience

Suggest:
1. **Visual Design**
   - Full-screen glassmorphism design
   - Background gradient animation
   - Centered glass card
   - Logo animation on load
   - Subtle patterns/textures

2. **Functionality**
   - Email + Password
   - "Remember me" checkbox
   - "Forgot password" link
   - Social login (Google, Apple if possible)
   - Form validation with helpful errors
   - Loading states on submit
   - Success animation

3. **Trust Signals**
   - "Secure login" badge
   - SSL indicator
   - Privacy policy link
   - Terms link
   - Support contact

4. **UX Improvements**
   - Auto-focus email field
   - Enter to submit
   - Password visibility toggle
   - Error shake animation
   - Success confetti

# SIGNUP PAGE (/signup)

**Target:** Low-friction, delightful signup

Suggest:
1. **Multi-step vs Single Page**
   - Should we use multi-step (better conversion)?
   - Progress indicator if multi-step
   - "Save and continue later" option

2. **Fields**
   - Minimal required fields
   - Smart defaults
   - Real-time validation
   - Helpful placeholders
   - Type-ahead for common inputs

3. **Role Selection**
   - Player / College Coach / HS Coach / JUCO
   - Beautiful cards to select
   - Show what each role gets
   - Hover effects

4. **Social Proof**
   - "Join 10,000+ players" 
   - Recent signups ticker
   - Testimonial sidebar

# ONBOARDING FLOW (/onboarding)

**Target:** Get users to "aha moment" FAST

Suggest a complete onboarding experience:

1. **Welcome Screen**
   - Personalized welcome
   - "Here's what happens next"
   - Estimated time (2 minutes)
   - Skip option (but discourage)

2. **Profile Setup Steps**
   
   **For Players:**
   - Step 1: Basic info (name, position, grad year)
   - Step 2: Location & school
   - Step 3: Stats (optional but encouraged)
   - Step 4: Upload profile photo
   - Step 5: Upload first video (critical!)
   - Step 6: Write bio
   - Completion: "Your profile is live!"

   **For Coaches:**
   - Step 1: Program info (school, conference, division)
   - Step 2: Upload program logo
   - Step 3: Coach profile
   - Step 4: Set recruiting preferences
   - Step 5: Invite first team member (optional)
   - Completion: "Start discovering players"

3. **UI Elements**
   - Progress bar at top
   - "Save and finish later" option
   - Back button
   - Smart "Skip" (only on optional steps)
   - Celebration on completion
   - Confetti when done

4. **Interactive Tour** (After onboarding)
   - Spotlight key features
   - "Click here to..." prompts
   - Dismissible
   - "Take tour later" option
   - Progress dots

5. **Empty State Prompts**
   - First time on dashboard: helpful tooltips
   - "Upload your first video" CTA
   - "Add your first player to watchlist"
   - Contextual help

# ADDITIONAL PAGES TO ADD

1. **/about** - About ScoutPulse, mission, team
2. **/how-it-works** - Step-by-step guide for each role
3. **/pricing** - Pricing tiers if applicable
4. **/testimonials** - Success stories
5. **/blog** - Content marketing (optional but valuable)
6. **/contact** - Contact form
7. **/demo** - Book a demo page
8. **/404** - Beautiful 404 page

# MODERN FEATURES TO ADD

1. **Dark Mode Toggle** - Premium feel
2. **Loading Screens** - Branded, glass effect
3. **Toast Notifications** - Success/error messages
4. **Cookie Consent Banner** - GDPR compliant
5. **Live Chat Widget** - Support (Intercom/Crisp)
6. **Announcement Bar** - "🎉 New feature: Video analysis"
7. **Exit Intent Popup** - Catch leaving visitors
8. **Social Sharing** - Share profile links
9. **Referral Program** - "Invite a friend"
10. **Email Verification Flow** - Professional emails

# WOW FACTOR ELEMENTS

These make visitors say "wow, this is legit":

1. **Animated Stats Counter** - Numbers count up
2. **Interactive Map** - Show active users by location
3. **Live Activity Feed** - Recent signups, connections
4. **Video Background** - Hero section with video
5. **3D Elements** - Subtle 3D cards/effects
6. **Smooth Page Transitions** - Between sections
7. **Micro-interactions** - Everything responds to hover
8. **Premium Illustrations** - Custom graphics
9. **Gradient Animations** - Moving gradients
10. **Glass Morphism Everywhere** - Signature style

---

For EACH enhancement, provide:

{{
  "enhancement_name": "Animated Hero Section",
  "page": "Landing Page",
  "section": "Hero",
  "priority": "high",
  "effort": "4hrs",
  "wow_factor": "high",
  "value": "First impression matters. An animated hero grabs attention and shows this is a premium product.",
  "cursor_prompt": "[Detailed implementation with code examples]"
}}

Return as JSON array. Focus on HIGH wow-factor items.
"""
        
        print(f"\n🔍 Analyzing landing page, login, and onboarding...")
        print(f"   🎯 Goal: Premium SaaS first impression")
        
        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=16000,
            messages=[{"role": "user", "content": enhancement_prompt}]
        )
        
        content = response.content[0].text
        
        # Extract JSON
        try:
            start = content.find('[')
            end = content.rfind(']') + 1
            if start >= 0 and end > start:
                enhancements = json.loads(content[start:end])
                return enhancements
        except Exception as e:
            print(f"❌ Error parsing: {e}")
            return []
        
        return []
    
    def present_enhancement(self, enhancement, number, total):
        """Present enhancement to user"""
        wow = enhancement.get('wow_factor', 'medium').upper()
        wow_emoji = "🔥" if wow == "HIGH" else "⚡" if wow == "MEDIUM" else "✨"
        
        print("\n" + "="*70)
        print(f"ENHANCEMENT {number}/{total} {wow_emoji}")
        print("="*70)
        print(f"\n✨ {enhancement.get('enhancement_name', 'Untitled')}")
        print(f"📄 Page: {enhancement.get('page', 'N/A')}")
        print(f"📍 Section: {enhancement.get('section', 'N/A')}")
        print(f"🎯 Priority: {enhancement.get('priority', 'N/A').upper()}")
        print(f"⏱️  Effort: {enhancement.get('effort', 'N/A')}")
        print(f"{wow_emoji} Wow Factor: {wow}")
        print(f"\n💡 Why This Matters:")
        print(f"   {enhancement.get('value', 'N/A')}")
        print(f"\n" + "="*70)
        print("🤖 IMPLEMENTATION (Copy to Cursor):")
        print("="*70)
        print(enhancement.get('cursor_prompt', 'No prompt available'))
        print("="*70)
    
    def list_all_enhancements(self):
        """List all enhancements without interactive prompts"""
        
        print("\n" + "="*70)
        print("LANDING PAGE & ONBOARDING ENHANCEMENT")
        print("="*70)
        print("\n🎯 Mission: Create a stunning first impression")
        print("📄 Scope: Landing page, login, signup, onboarding")
        print("\n⏳ Analyzing...\n")
        
        # Scan for enhancements
        enhancements = self.scan_landing_page_enhancements()
        
        if not enhancements:
            print("\n❌ Could not generate enhancements")
            return enhancements
        
        print(f"\n📋 Found {len(enhancements)} enhancements")
        
        # Sort by priority and wow factor
        priority_order = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}
        wow_order = {'high': 3, 'medium': 2, 'low': 1}
        
        enhancements.sort(
            key=lambda x: (
                priority_order.get(x.get('priority', 'low'), 0) * 10 +
                wow_order.get(x.get('wow_factor', 'low'), 0)
            ),
            reverse=True
        )
        
        # Display all enhancements
        for i, enhancement in enumerate(enhancements, 1):
            self.present_enhancement(enhancement, i, len(enhancements))
            if i < len(enhancements):
                print("\n")
        
        return enhancements
    
    def run_landing_enhancement(self, interactive=True):
        """Run landing page enhancement session"""
        
        print("\n" + "="*70)
        print("LANDING PAGE & ONBOARDING ENHANCEMENT")
        print("="*70)
        print("\n🎯 Mission: Create a stunning first impression")
        print("📄 Scope: Landing page, login, signup, onboarding")
        print("\n⏳ This will take a moment to analyze...\n")
        
        # Scan for enhancements
        enhancements = self.scan_landing_page_enhancements()
        
        if not enhancements:
            print("\n❌ Could not generate enhancements")
            return
        
        print(f"\n📋 Found {len(enhancements)} enhancements")
        
        # Sort by priority and wow factor
        priority_order = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}
        wow_order = {'high': 3, 'medium': 2, 'low': 1}
        
        enhancements.sort(
            key=lambda x: (
                priority_order.get(x.get('priority', 'low'), 0) * 10 +
                wow_order.get(x.get('wow_factor', 'low'), 0)
            ),
            reverse=True
        )
        
        # Show summary first
        print("\n" + "="*70)
        print("ENHANCEMENT SUMMARY")
        print("="*70)
        
        by_page = {}
        for e in enhancements:
            page = e.get('page', 'Other')
            if page not in by_page:
                by_page[page] = []
            by_page[page].append(e.get('enhancement_name', 'Untitled'))
        
        for page, items in by_page.items():
            print(f"\n📄 {page} ({len(items)} enhancements):")
            for item in items[:5]:
                print(f"   • {item}")
            if len(items) > 5:
                print(f"   • ... and {len(items) - 5} more")
        
        if not interactive:
            # Just list all
            print("\n" + "="*70)
            for i, enhancement in enumerate(enhancements, 1):
                self.present_enhancement(enhancement, i, len(enhancements))
                if i < len(enhancements):
                    print("\n")
            return
        
        print("\n" + "="*70)
        try:
            input("\nPress Enter to review each enhancement...")
        except (EOFError, KeyboardInterrupt):
            print("\n⚠️  Running in list mode")
            for i, enhancement in enumerate(enhancements, 1):
                self.present_enhancement(enhancement, i, len(enhancements))
                if i < len(enhancements):
                    print("\n")
            return
        
        # Present each enhancement
        for i, enhancement in enumerate(enhancements, 1):
            self.present_enhancement(enhancement, i, len(enhancements))
            
            print("\n" + "-"*70)
            try:
                response = input("\nAdd this enhancement? (y/n/skip/quit): ").lower().strip()
            except (EOFError, KeyboardInterrupt):
                print("\n⚠️  Session ended")
                break
            
            if response == 'quit' or response == 'q':
                print("\n⚠️  Session ended")
                break
            elif response == 'skip' or response == 's':
                print("⏭️  Skipped")
                continue
            elif response != 'y' and response != 'yes':
                print("⏭️  Skipped")
                continue
            
            # Implementation instructions
            print("\n✅ Excellent choice!")
            print("\n📋 To implement:")
            print("   1. Open Cursor (Cmd+L)")
            print("   2. Copy the IMPLEMENTATION prompt above")
            print("   3. Paste into Cursor chat")
            print("   4. Let Cursor build it")
            print("   5. Test it in browser")
            print("   6. Come back here")
            
            try:
                input("\nPress Enter when implemented and tested...")
                verify = input("\n✓ Does it look amazing? (y/n): ").lower().strip()
            except (EOFError, KeyboardInterrupt):
                print("\n⚠️  Skipping verification")
                continue
            
            if verify == 'y' or verify == 'yes':
                print("✅ Enhancement added!")
                self.enhancements_added += 1
            else:
                print("⚠️  May need refinement")
                try:
                    feedback = input("What needs adjustment? ").strip()
                    if feedback:
                        print(f"📝 Noted: {feedback}")
                except (EOFError, KeyboardInterrupt):
                    pass
            
            time.sleep(1)
        
        # Summary
        print("\n" + "="*70)
        print("ENHANCEMENT SESSION COMPLETE")
        print("="*70)
        print(f"\n✅ Enhancements added: {self.enhancements_added}/{len(enhancements)}")
        print(f"\n🎉 Your landing page is now {self.enhancements_added}x more impressive!")
        
        if self.enhancements_added > 0:
            print("\n📝 Next steps:")
            print("   1. Test the full user journey (visitor → signup → onboarding)")
            print("   2. Get feedback from 3-5 people")
            print("   3. Refine based on feedback")
            print("   4. Launch! 🚀")

def main():
    print("╔════════════════════════════════════════════════════════════════════╗")
    print("║   SCOUTPULSE LANDING PAGE ENHANCEMENT AGENT                       ║")
    print("║   Make your first impression absolutely stunning                  ║")
    print("╚════════════════════════════════════════════════════════════════════╝\n")
    
    # Get API key from environment variable, .env.local, or prompt
    API_KEY = os.getenv('ANTHROPIC_API_KEY')
    
    # Try loading from .env.local if not in environment
    if not API_KEY:
        env_file = Path(__file__).parent / '.env.local'
        if env_file.exists():
            try:
                with open(env_file, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith('ANTHROPIC_API_KEY=') and not line.startswith('#'):
                            API_KEY = line.split('=', 1)[1].strip().strip('"').strip("'")
                            break
            except Exception as e:
                pass
    
    if not API_KEY:
        print("⚠️  ANTHROPIC_API_KEY not found in environment or .env.local")
        print("   You can set it with: export ANTHROPIC_API_KEY='your-key-here'")
        print("   Or add it to .env.local: ANTHROPIC_API_KEY=your-key-here")
        try:
            API_KEY = input("\nEnter your Anthropic API key (or press Enter to exit): ").strip()
        except EOFError:
            print("❌ Cannot read input in non-interactive mode.")
            print("   Please set ANTHROPIC_API_KEY environment variable or add it to .env.local")
            return
        if not API_KEY:
            print("❌ API key required. Exiting.")
            return
    
    # Get project path (default to current directory or workspace)
    PROJECT_PATH = os.getenv('SCOUTPULSE_PATH', str(Path(__file__).parent.absolute()))
    
    print(f"📂 Project: {PROJECT_PATH}")
    print(f"🎯 Focus: Landing page, login, signup, onboarding")
    print(f"🎨 Goal: Apple/Stripe/Linear level polish\n")
    
    # Check for command-line arguments
    non_interactive = '--list' in sys.argv or '--non-interactive' in sys.argv
    
    if non_interactive:
        agent = LandingPageAgent(API_KEY, PROJECT_PATH)
        agent.list_all_enhancements()
        return
    
    print("This will analyze your current pages and suggest:")
    print("  • Hero section enhancements")
    print("  • Feature showcase improvements")
    print("  • Social proof elements")
    print("  • Login/signup polish")
    print("  • Complete onboarding flow")
    print("  • Additional pages to add")
    print("  • Wow factor features\n")
    
    try:
        confirm = input("Ready to make ScoutPulse stunning? (yes/no): ").lower().strip()
    except (EOFError, KeyboardInterrupt):
        print("\n⚠️  Running in list mode")
        agent = LandingPageAgent(API_KEY, PROJECT_PATH)
        agent.list_all_enhancements()
        return
    
    if confirm != 'yes' and confirm != 'y':
        print("\n❌ Cancelled")
        return
    
    agent = LandingPageAgent(API_KEY, PROJECT_PATH)
    agent.run_landing_enhancement()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Stopped by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
