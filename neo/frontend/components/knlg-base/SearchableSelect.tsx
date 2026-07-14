"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SearchableSelectProps {
  /** 当前选中的值 */
  value: string | null;
  /** 值变化回调 */
  onChange: (value: string | null) => void;
  /** 异步加载选项的函数 */
  loadOptions: (
    search: string,
    page: number,
  ) => Promise<{
    items: SelectOption[];
    hasMore: boolean;
  }>;
  /** 根据值获取单个选项的函数（用于初始化时显示选中项的标签） */
  getOptionByValue?: (value: string) => Promise<SelectOption | null>;
  /** 占位文本 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 最小搜索字符数，低于此字符不触发搜索 */
  minSearchLength?: number;
  /** 搜索防抖延迟（毫秒） */
  debounceMs?: number;
  /** 样式类名 */
  className?: string;
}

export function SearchableSelect({
  value,
  onChange,
  loadOptions,
  getOptionByValue,
  placeholder = "选择...",
  disabled = false,
  minSearchLength = 0,
  debounceMs = 300,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const lastFetchedValueRef = useRef<string | null>(null);

  // 加载选项
  const loadData = useCallback(
    async (query: string, pageNum: number, append = false) => {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const result = await loadOptions(query, pageNum);
        if (append) {
          setOptions((prev) => [...prev, ...result.items]);
        } else {
          setOptions(result.items);
        }
        setHasMore(result.hasMore);
        setPage(pageNum);
      } catch (error) {
        console.error("Failed to load options:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [loadOptions],
  );

  // 初始加载
  useEffect(() => {
    if (open && options.length === 0) {
      loadData("", 1);
    }
  }, [open, options.length, loadData]);

  // 搜索防抖
  useEffect(() => {
    if (!open) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (search.length >= minSearchLength) {
      searchTimeoutRef.current = setTimeout(() => {
        setPage(1);
        loadData(search, 1);
      }, debounceMs);
    } else if (search === "") {
      loadData("", 1);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search, open, minSearchLength, debounceMs, loadData]);

  // 无限滚动检测
  useEffect(() => {
    if (!open || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadData(search, page + 1, true);
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [open, hasMore, loadingMore, page, search, loadData]);

  // 设置选中标签
  useEffect(() => {
    if (value && options.length > 0) {
      const option = options.find((opt) => opt.value === value);
      if (option) {
        setSelectedLabel(option.label);
        lastFetchedValueRef.current = value;
      }
    } else if (!value) {
      setSelectedLabel(null);
      lastFetchedValueRef.current = null;
    }
  }, [value, options]);

  // 当value存在但未在options中找到时，调用 getOptionByValue 获取标签
  useEffect(() => {
    if (!value || !getOptionByValue) return;
    if (lastFetchedValueRef.current === value) return;
    if (options.some((opt) => opt.value === value)) return;

    let cancelled = false;
    (async () => {
      try {
        const option = await getOptionByValue(value);
        if (!cancelled && option && option.value === value) {
          setSelectedLabel(option.label);
          lastFetchedValueRef.current = value;
        }
      } catch (error) {
        console.error("Failed to fetch option by value:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [value, options, getOptionByValue]);

  const handleSelect = (currentValue: string) => {
    const selected = options.find((opt) => opt.value === currentValue);
    if (selected) {
      setSelectedLabel(selected.label);
    }
    onChange(currentValue === value ? null : currentValue);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLabel(null);
    onChange(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">
            {selectedLabel || value || placeholder}
          </span>
          <div className="flex items-center gap-1">
            {value && (
              <X
                className="h-4 w-4 shrink-0 cursor-pointer hover:text-destructive"
                onClick={handleClear}
              />
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-0"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={disabled}
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
        </div>

        <Command>
          <CommandList className="max-h-[300px]">
            <CommandEmpty>
              {loading ? "加载中..." : "没有找到匹配的选项"}
            </CommandEmpty>

            {!loading && (
              <CommandGroup>
                {options.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "relative flex w-full cursor-pointer items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                      value === option.value && "bg-accent",
                    )}
                  >
                    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
                      {value === option.value && <Check className="h-4 w-4" />}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span>{option.label}</span>
                      {option.description && (
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CommandGroup>
            )}

            {/* 加载更多触发器 */}
            {hasMore && (
              <div
                ref={loadMoreRef}
                className="flex items-center justify-center py-2 text-xs text-muted-foreground"
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "滚动加载更多..."
                )}
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// 简化版本：适用于选项较少的情况
interface SimpleSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SimpleSelect({
  value,
  onChange,
  options,
  placeholder = "选择...",
  disabled = false,
  className,
}: SimpleSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandList className="max-h-[300px]">
            <CommandEmpty>没有选项</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    onChange(option.value === value ? null : option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "relative flex w-full cursor-pointer items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === option.value && "bg-accent",
                  )}
                >
                  <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
                    {value === option.value && <Check className="h-4 w-4" />}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span>{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
