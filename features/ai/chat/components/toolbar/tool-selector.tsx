'use client';

import { useState } from 'react';
import { Plus, Search, MessageCircle, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';

type ToolOption = {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  prompt: string;
};

const toolOptions: ToolOption[] = [
  {
    id: 'search',
    label: 'Search Web',
    description: 'Search for current information on the internet',
    icon: Search,
    color: 'text-blue-500',
    prompt: 'Search for: ',
  },
  {
    id: 'conversation',
    label: 'Role-play Conversation',
    description: 'Practice Vietnamese with interactive conversations',
    icon: MessageCircle,
    color: 'text-green-500',
    prompt: 'Start a Vietnamese conversation about: ',
  },
  {
    id: 'grammar',
    label: 'Explain Grammar',
    description: 'Get detailed Vietnamese grammar explanations',
    icon: BookOpen,
    color: 'text-purple-500',
    prompt: 'Explain Vietnamese grammar: ',
  },
  {
    id: 'folklore',
    label: 'Vietnamese Folklore',
    description: 'Discover proverbs, folk songs, and cultural wisdom',
    icon: Sparkles,
    color: 'text-amber-500',
    prompt: 'Find Vietnamese proverb or folk song about: ',
  },
];

type ToolSelectorProps = {
  onToolSelect: (tool: ToolOption) => void;
  disabled?: boolean;
};

export function ToolSelector({ onToolSelect, disabled = false }: ToolSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                className="aspect-square h-8 rounded-lg p-1 transition-colors hover:bg-accent"
                disabled={disabled}
                variant="ghost"
                data-testid="tool-selector-button"
              >
                <Plus size={16} className="transition-transform group-hover:rotate-90" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Select a tool</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent align="start" className="w-[280px]">
          <DropdownMenuLabel>Select a Tool</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {toolOptions.map((tool) => {
            const Icon = tool.icon;
            return (
              <DropdownMenuItem
                key={tool.id}
                onClick={() => {
                  onToolSelect(tool);
                  setOpen(false);
                }}
                className="flex cursor-pointer items-start gap-3 p-3"
              >
                <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${tool.color}`} />
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-sm">{tool.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {tool.description}
                  </span>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
