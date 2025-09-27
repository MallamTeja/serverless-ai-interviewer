import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  X,
  Check,
  Calendar,
  Star,
  ListFilter,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type SortField = 'name' | 'date' | 'score' | 'status';
export type SortDirection = 'asc' | 'desc';
export type FilterKey = 'status' | 'date' | 'favorite';
export type StatusFilter = 'all' | 'completed' | 'in-progress' | 'pending' | 'failed';
export type DateFilter = 'all' | 'today' | 'this-week' | 'this-month';

export interface SortOption {
  field: SortField;
  direction: SortDirection;
  label: string;
}

export interface Filter {
  key: FilterKey;
  value: string;
  label: string;
}

interface SearchSortBarProps {
  /**
   * Callback when search input changes
   */
  onSearchChange: (query: string) => void;
  
  /**
   * Callback when sort changes
   */
  onSortChange?: (field: SortField, direction: SortDirection) => void;
  
  /**
   * Callback when filters change
   */
  onFilterChange?: (filters: Filter[]) => void;
  
  /**
   * Callback when view type changes
   */
  onViewChange?: (view: 'table' | 'grid') => void;
  
  /**
   * Currently active sort option
   */
  activeSort?: {
    field: SortField;
    direction: SortDirection;
  };
  
  /**
   * Currently active filters
   */
  activeFilters?: Filter[];
  
  /**
   * Currently active view type
   */
  activeView?: 'table' | 'grid';
  
  /**
   * Whether component is in loading state
   */
  isLoading?: boolean;
  
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Component for multi-field search and sort in the dashboard
 */
const SearchSortBar: React.FC<SearchSortBarProps> = ({
  onSearchChange,
  onSortChange,
  onFilterChange,
  onViewChange,
  activeSort = { field: 'date', direction: 'desc' },
  activeFilters = [],
  activeView = 'table',
  isLoading = false,
  className,
}) => {
  // Local state for search query
  const [searchQuery, setSearchQuery] = useState('');
  
  // Define sort options
  const sortOptions: SortOption[] = [
    { field: 'name', direction: 'asc', label: 'Name (A-Z)' },
    { field: 'name', direction: 'desc', label: 'Name (Z-A)' },
    { field: 'date', direction: 'desc', label: 'Date (Newest)' },
    { field: 'date', direction: 'asc', label: 'Date (Oldest)' },
    { field: 'score', direction: 'desc', label: 'Score (High-Low)' },
    { field: 'score', direction: 'asc', label: 'Score (Low-High)' },
    { field: 'status', direction: 'asc', label: 'Status (A-Z)' },
    { field: 'status', direction: 'desc', label: 'Status (Z-A)' },
  ];
  
  // Define filter options by category
  const statusFilterOptions = [
    { key: 'status', value: 'all', label: 'All Status' },
    { key: 'status', value: 'completed', label: 'Completed' },
    { key: 'status', value: 'in-progress', label: 'In Progress' },
    { key: 'status', value: 'pending', label: 'Pending' },
    { key: 'status', value: 'failed', label: 'Failed' },
  ];
  
  const dateFilterOptions = [
    { key: 'date', value: 'all', label: 'All Time' },
    { key: 'date', value: 'today', label: 'Today' },
    { key: 'date', value: 'this-week', label: 'This Week' },
    { key: 'date', value: 'this-month', label: 'This Month' },
  ];
  
  const favoriteFilterOptions = [
    { key: 'favorite', value: 'all', label: 'All Candidates' },
    { key: 'favorite', value: 'favorite', label: 'Favorites Only' },
  ];
  
  // Get active sort option
  const getActiveSortLabel = (): string => {
    const option = sortOptions.find(
      opt => opt.field === activeSort.field && opt.direction === activeSort.direction
    );
    return option ? option.label : 'Sort';
  };
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearchChange(value);
  };
  
  // Handle clearing search
  const handleClearSearch = () => {
    setSearchQuery('');
    onSearchChange('');
  };
  
  // Handle filter toggling
  const handleFilterToggle = (filter: Filter) => {
    if (!onFilterChange) return;
    
    // If selecting "all" for a category, remove all filters of that category
    if (filter.value === 'all') {
      const updatedFilters = activeFilters.filter(f => f.key !== filter.key);
      onFilterChange(updatedFilters);
      return;
    }
    
    // Check if filter is already active
    const isActive = activeFilters.some(
      f => f.key === filter.key && f.value === filter.value
    );
    
    if (isActive) {
      // Remove filter
      onFilterChange(activeFilters.filter(
        f => !(f.key === filter.key && f.value === filter.value)
      ));
    } else {
      // Add filter, removing any other filters of same key
      const otherFilters = activeFilters.filter(f => f.key !== filter.key);
      onFilterChange([...otherFilters, filter]);
    }
  };
  
  // Check if a filter is active
  const isFilterActive = (filter: Filter): boolean => {
    return activeFilters.some(
      f => f.key === filter.key && f.value === filter.value
    );
  };
  
  // Render filter badge for active filters
  const renderFilterBadges = () => {
    if (activeFilters.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {activeFilters.map((filter, index) => (
          <Badge
            key={`${filter.key}-${filter.value}`}
            variant="secondary"
            className="pl-2 pr-1 flex items-center gap-1 h-6"
          >
            {filter.label}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 ml-1 rounded-full hover:bg-secondary"
              onClick={() => onFilterChange?.(activeFilters.filter((_, i) => i !== index))}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {filter.label} filter</span>
            </Button>
          </Badge>
        ))}
        
        {activeFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onFilterChange?.([])}
          >
            Clear all
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search Input */}
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-9"
            disabled={isLoading}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-9 w-9"
              onClick={handleClearSearch}
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
        
        {/* Sort Dropdown - Desktop */}
        <div className="hidden sm:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[120px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                {getActiveSortLabel()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={`${option.field}-${option.direction}`}
                  className="flex items-center justify-between"
                  onClick={() => onSortChange?.(option.field, option.direction)}
                >
                  {option.label}
                  {activeSort.field === option.field && activeSort.direction === option.direction && (
                    <Check className="h-4 w-4" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Filters Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1">
              <ListFilter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            {statusFilterOptions.map((filter) => (
              <DropdownMenuItem
                key={`${filter.key}-${filter.value}`}
                className="flex items-center justify-between"
                onClick={() => handleFilterToggle(filter)}
              >
                {filter.label}
                {isFilterActive(filter) && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Date</DropdownMenuLabel>
            {dateFilterOptions.map((filter) => (
              <DropdownMenuItem
                key={`${filter.key}-${filter.value}`}
                className="flex items-center justify-between"
                onClick={() => handleFilterToggle(filter)}
              >
                {filter.label}
                {isFilterActive(filter) && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Other</DropdownMenuLabel>
            {favoriteFilterOptions.map((filter) => (
              <DropdownMenuItem
                key={`${filter.key}-${filter.value}`}
                className="flex items-center justify-between"
                onClick={() => handleFilterToggle(filter)}
              >
                {filter.value === 'favorite' && <Star className="h-4 w-4 mr-2 text-amber-400" />}
                {filter.label}
                {isFilterActive(filter) && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* View Toggle */}
        {onViewChange && (
          <Button
            variant="outline"
            className="hidden sm:flex"
            onClick={() => onViewChange(activeView === 'table' ? 'grid' : 'table')}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {activeView === 'table' ? 'Grid View' : 'Table View'}
          </Button>
        )}
        
        {/* Sort Select - Mobile Only */}
        <div className="sm:hidden w-full">
          <Select 
            defaultValue={`${activeSort.field}-${activeSort.direction}`}
            onValueChange={(value) => {
              const [field, direction] = value.split('-') as [SortField, SortDirection];
              onSortChange?.(field, direction);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem 
                  key={`${option.field}-${option.direction}`} 
                  value={`${option.field}-${option.direction}`}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Active Filter Badges */}
      {renderFilterBadges()}
    </div>
  );
};

export default SearchSortBar;
