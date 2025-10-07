import { useState, useEffect } from "react";
import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterState {
  channels: string[];
  timeRange: '7' | '30' | '90' | 'custom';
  status: string[];
  search: string;
  customStartDate?: string;
  customEndDate?: string;
}

interface GlobalFilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableChannels?: Array<{ id: string; name: string }>;
  availableStatuses?: Array<{ value: string; label: string }>;
  showStatusFilter?: boolean;
}

export function GlobalFilterBar({
  filters,
  onFiltersChange,
  availableChannels = [],
  availableStatuses = [],
  showStatusFilter = true,
}: GlobalFilterBarProps) {
  const [channelPopoverOpen, setChannelPopoverOpen] = useState(false);

  const updateFilters = (updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const removeChannel = (channelId: string) => {
    updateFilters({
      channels: filters.channels.filter(id => id !== channelId)
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      channels: [],
      timeRange: '30',
      status: [],
      search: '',
    });
  };

  const hasActiveFilters = filters.channels.length > 0 || 
    filters.status.length > 0 || 
    filters.search.length > 0 ||
    filters.timeRange !== '30';

  return (
    <div className="border-b bg-muted/30 px-6 py-4 space-y-3" data-testid="global-filter-bar">
      {/* Search and Time Range */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search topics, threads..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="pl-9"
            data-testid="input-search"
          />
        </div>

        <Select 
          value={filters.timeRange} 
          onValueChange={(value: any) => updateFilters({ timeRange: value })}
        >
          <SelectTrigger className="w-40" data-testid="select-time-range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>

        {/* Channel Filter */}
        <Popover open={channelPopoverOpen} onOpenChange={setChannelPopoverOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="gap-2"
              data-testid="button-channel-filter"
            >
              <Filter className="h-4 w-4" />
              Channels
              {filters.channels.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {filters.channels.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-64" align="start">
            <Command>
              <CommandInput placeholder="Search channels..." />
              <CommandList>
                <CommandEmpty>No channels found</CommandEmpty>
                <CommandGroup>
                  {availableChannels.map((channel) => {
                    const isSelected = filters.channels.includes(channel.id);
                    return (
                      <CommandItem
                        key={channel.id}
                        onSelect={() => {
                          if (isSelected) {
                            removeChannel(channel.id);
                          } else {
                            updateFilters({
                              channels: [...filters.channels, channel.id]
                            });
                          }
                        }}
                        data-testid={`channel-option-${channel.id}`}
                      >
                        <div className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                          isSelected 
                            ? "bg-primary border-primary" 
                            : "border-input"
                        )}>
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span className="flex-1 truncate">{channel.name}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Status Filter */}
        {showStatusFilter && availableStatuses.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="gap-2"
                data-testid="button-status-filter"
              >
                Status
                {filters.status.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {filters.status.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-48" align="start">
              <Command>
                <CommandList>
                  <CommandGroup>
                    {availableStatuses.map((status) => {
                      const isSelected = filters.status.includes(status.value);
                      return (
                        <CommandItem
                          key={status.value}
                          onSelect={() => {
                            if (isSelected) {
                              updateFilters({
                                status: filters.status.filter(s => s !== status.value)
                              });
                            } else {
                              updateFilters({
                                status: [...filters.status, status.value]
                              });
                            }
                          }}
                          data-testid={`status-option-${status.value}`}
                        >
                          <div className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                            isSelected 
                              ? "bg-primary border-primary" 
                              : "border-input"
                          )}>
                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          {status.label}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}

        {/* Clear All */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="gap-2"
            data-testid="button-clear-filters"
          >
            <X className="h-4 w-4" />
            Clear all
          </Button>
        )}
      </div>

      {/* Active Channel Chips */}
      {filters.channels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.channels.map((channelId) => {
            const channel = availableChannels.find(c => c.id === channelId);
            if (!channel) return null;
            
            return (
              <Badge 
                key={channelId} 
                variant="secondary" 
                className="gap-1 pr-1"
                data-testid={`active-channel-${channelId}`}
              >
                #{channel.name}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeChannel(channelId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
