'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FileText, Search, Plus, X, Copy, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  variables: string[];
}

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'initial-contact',
    name: 'Initial Interest',
    category: 'Outreach',
    content: 'Hi {{player_name}},\n\nI hope this message finds you well. I\'m {{coach_name}} from {{school_name}}, and I\'ve been impressed by your performance as a {{position}}.\n\nWe\'d love to learn more about you and discuss potential opportunities. Would you be available for a brief conversation?\n\nBest regards,\n{{coach_name}}',
    variables: ['player_name', 'coach_name', 'school_name', 'position']
  },
  {
    id: 'camp-invite',
    name: 'Camp Invitation',
    category: 'Events',
    content: 'Hi {{player_name}},\n\nWe\'re excited to invite you to our {{camp_name}} on {{camp_date}} at {{location}}.\n\nThis is a great opportunity to showcase your skills and learn more about our program. The camp will include skill evaluations, drills, and a chance to meet our coaching staff.\n\nPlease let us know if you\'re interested in attending.\n\nBest,\n{{coach_name}}\n{{school_name}}',
    variables: ['player_name', 'camp_name', 'camp_date', 'location', 'coach_name', 'school_name']
  },
  {
    id: 'follow-up',
    name: 'Follow-up',
    category: 'Outreach',
    content: 'Hi {{player_name}},\n\nI wanted to follow up on our previous conversation about {{topic}}. We\'re still very interested in learning more about you.\n\nWould you be available for a call this week? I\'m available {{availability}}.\n\nLooking forward to connecting,\n{{coach_name}}',
    variables: ['player_name', 'topic', 'availability', 'coach_name']
  },
  {
    id: 'scholarship-offer',
    name: 'Scholarship Offer',
    category: 'Offers',
    content: 'Hi {{player_name}},\n\nWe\'re thrilled to extend a scholarship offer to you for the {{academic_year}} academic year at {{school_name}}.\n\nThis offer reflects our confidence in your abilities both on the field and in the classroom. We believe you would be an excellent addition to our program.\n\nPlease review the attached details and let us know if you have any questions. We\'d love to discuss this opportunity with you further.\n\nCongratulations!\n{{coach_name}}\n{{school_name}}',
    variables: ['player_name', 'academic_year', 'school_name', 'coach_name']
  }
];

export function MessageTemplateSystem({ 
  onSelectTemplate,
  playerData
}: { 
  onSelectTemplate?: (content: string) => void;
  playerData?: Record<string, any>;
}) {
  const [templates, setTemplates] = useState<MessageTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [previewContent, setPreviewContent] = useState('');
  const [customTemplates, setCustomTemplates] = useState<MessageTemplate[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadCustomTemplates();
  }, []);

  const loadCustomTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('message_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setCustomTemplates(data.map(t => ({
          id: t.id,
          name: t.name,
          category: t.category || 'Custom',
          content: t.content,
          variables: extractVariables(t.content)
        })));
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{(\w+)\}\}/g);
    return matches ? matches.map(m => m.replace(/[{}]/g, '')) : [];
  };

  const replaceVariables = (content: string, data: Record<string, any>): string => {
    let result = content;
    const variables = extractVariables(content);
    
    variables.forEach(variable => {
      const value = data[variable] || `{{${variable}}}`;
      result = result.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value);
    });
    
    return result;
  };

  const categories = ['All', ...Array.from(new Set(templates.map(t => t.category)))];

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    const preview = playerData 
      ? replaceVariables(template.content, playerData)
      : template.content;
    setPreviewContent(preview);
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;
    
    const finalContent = playerData
      ? replaceVariables(selectedTemplate.content, playerData)
      : selectedTemplate.content;
    
    onSelectTemplate?.(finalContent);
    toast.success('Template applied');
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(previewContent);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowCustomForm(!showCustomForm)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Template List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-colors",
                selectedTemplate?.id === template.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => handleTemplateSelect(template)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{template.name}</h4>
                  <p className="text-xs text-muted-foreground">{template.category}</p>
                </div>
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Preview</h4>
            {selectedTemplate && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyTemplate}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  onClick={handleUseTemplate}
                >
                  <Send className="w-3 h-3 mr-1" />
                  Use
                </Button>
              </div>
            )}
          </div>
          <Textarea
            value={previewContent}
            onChange={(e) => setPreviewContent(e.target.value)}
            placeholder="Select a template to preview..."
            className="min-h-64 font-mono text-sm"
          />
          {selectedTemplate && selectedTemplate.variables.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Variables: {selectedTemplate.variables.join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

