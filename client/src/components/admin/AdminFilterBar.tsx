import { Search, Calendar, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface FilterOption {
  value: string;
  label: string;
}

interface AdminFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
  selectedStatuses: string[];
  onStatusToggle: (status: string) => void;
  statusOptions?: FilterOption[];
  sortBy: string;
  onSortChange: (value: string) => void;
  sortOptions: FilterOption[];
  showStatusFilter?: boolean;
  resultCount?: number;
  totalCount?: number;
}

export default function AdminFilterBar({
  searchValue,
  onSearchChange,
  timeRange,
  onTimeRangeChange,
  selectedStatuses,
  onStatusToggle,
  statusOptions = [],
  sortBy,
  onSortChange,
  sortOptions,
  showStatusFilter = true,
  resultCount,
  totalCount,
}: AdminFilterBarProps) {
  const activeFiltersCount = selectedStatuses.length + (timeRange !== 'all' ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>

        {/* Time Range */}
        <Select value={timeRange} onValueChange={onTimeRangeChange}>
          <SelectTrigger className="w-[160px]" data-testid="select-time-range">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        {showStatusFilter && statusOptions.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="button-status-filter">
                <Filter className="h-4 w-4" />
                Status
                {selectedStatuses.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5">
                    {selectedStatuses.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-3" align="start">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">Filter by status</span>
                  {selectedStatuses.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => selectedStatuses.forEach(s => onStatusToggle(s))}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {statusOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer hover:bg-accent rounded-md p-2 -mx-1"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(option.value)}
                      onChange={() => onStatusToggle(option.value)}
                      className="rounded"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Sort */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px]" data-testid="select-sort">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onTimeRangeChange('all');
              selectedStatuses.forEach(s => onStatusToggle(s));
            }}
            data-testid="button-clear-filters"
          >
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Results count */}
      {resultCount !== undefined && totalCount !== undefined && (
        <div className="text-sm text-muted-foreground">
          Showing {resultCount} of {totalCount} {resultCount === 1 ? 'result' : 'results'}
          {activeFiltersCount > 0 && ` (${activeFiltersCount} ${activeFiltersCount === 1 ? 'filter' : 'filters'} active)`}
        </div>
      )}
    </div>
  );
}
