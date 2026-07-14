"use client";

import { useState, useEffect } from "react";
import {
  listModelProviders,
  listProviderModels,
  type ModelProviderResponse,
  type ModelConfigResponse,
  ApiError,
} from "@/lib/api/model-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ModelProviderSelectorProps {
  value: {
    providerId?: number;
    modelId?: string;
    temperature?: number;
    maxTokens?: number;
  };
  onChange: (value: {
    providerId?: number;
    modelId?: string;
    temperature?: number;
    maxTokens?: number;
  }) => void;
  disabled?: boolean;
}

export function ModelProviderSelector({
  value,
  onChange,
  disabled = false,
}: ModelProviderSelectorProps) {
  const [providers, setProviders] = useState<ModelProviderResponse[]>([]);
  const [models, setModels] = useState<ModelConfigResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await listModelProviders({
          enabled: true,
          for_agent: true,
          page_size: 100,
        });
        setProviders(response.items);

        // If we have a selected provider, fetch its models
        if (value.providerId) {
          const modelsResponse = await listProviderModels(value.providerId, {
            enabled: true,
            page_size: 100,
          });
          setModels(modelsResponse);
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("获取模型提供商失败");
        }
        console.error("Failed to fetch providers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  // Fetch models when provider changes
  useEffect(() => {
    const fetchModels = async () => {
      if (!value.providerId) {
        setModels([]);
        return;
      }

      setLoadingModels(true);
      try {
        const modelsResponse = await listProviderModels(value.providerId, {
          enabled: true,
          page_size: 100,
        });
        setModels(modelsResponse);

        // If current model is not in the new list, clear it
        if (
          value.modelId &&
          !modelsResponse.some((m) => m.model_id === value.modelId)
        ) {
          onChange({ ...value, modelId: undefined });
        }
      } catch (err) {
        console.error("Failed to fetch models:", err);
      } finally {
        setLoadingModels(false);
      }
    };

    fetchModels();
  }, [value.providerId]);

  const handleProviderChange = (providerId: string) => {
    const id = parseInt(providerId, 10);
    onChange({
      ...value,
      providerId: id,
      modelId: undefined, // Reset model when provider changes
    });
  };

  const handleModelChange = (modelId: string) => {
    onChange({
      ...value,
      modelId,
    });
  };

  const handleTemperatureChange = (temp: string) => {
    onChange({
      ...value,
      temperature: parseFloat(temp),
    });
  };

  const handleMaxTokensChange = (tokens: string) => {
    onChange({
      ...value,
      maxTokens: parseInt(tokens, 10),
    });
  };

  // Get API type badge color
  const getApiTypeBadge = (apiType: string) => {
    switch (apiType) {
      case "openai-completions":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            OpenAI
          </Badge>
        );
      case "anthropic-messages":
        return (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 border-orange-200"
          >
            Anthropic
          </Badge>
        );
      default:
        return <Badge variant="outline">{apiType}</Badge>;
    }
  };

  // Get selected provider name
  const selectedProvider = providers.find((p) => p.id === value.providerId);
  const selectedModel = models.find((m) => m.model_id === value.modelId);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-4">
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>模型提供商</Label>
          <Select
            value={value.providerId?.toString() || ""}
            onValueChange={handleProviderChange}
            disabled={disabled || providers.length === 0}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="选择模型提供商" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id.toString()}>
                  <div className="flex items-center justify-between gap-4 py-0.5">
                    <span>{provider.name}</span>
                    {getApiTypeBadge(provider.api_type)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedProvider && (
          <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-medium">API:</span>
              <span className="font-mono">{selectedProvider.base_url}</span>
            </div>
            {selectedProvider.api_key_env && (
              <div className="flex items-center gap-1.5">
                <span className="font-medium">Auth:</span>
                <span className="font-mono text-green-600">
                  ${selectedProvider.api_key_env}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Model Selection */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>模型</Label>
          {loadingModels ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select
              value={value.modelId || ""}
              onValueChange={handleModelChange}
              disabled={disabled || !value.providerId || models.length === 0}
            >
              <SelectTrigger className="h-10">
                <SelectValue
                  placeholder={value.providerId ? "选择模型" : "请先选择提供商"}
                />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.model_id} value={model.model_id}>
                    <div className="flex items-center gap-2 py-0.5">
                      <span className="font-medium">
                        {model.display_name || model.model_id}
                      </span>
                      {model.supports_thinking && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1 py-0 bg-purple-50 text-purple-700"
                        >
                          Thinking
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Selected Model Summary */}
        {selectedModel && (
          <div className="rounded-md border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {selectedModel.display_name || selectedModel.model_id}
                </p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {selectedModel.model_id}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded bg-muted/50 px-2 py-1.5">
                <p className="text-muted-foreground text-[10px] uppercase tracking-wide">
                  Context
                </p>
                <p className="font-mono font-medium mt-0.5">
                  {selectedModel.context_window.toLocaleString()}
                </p>
              </div>
              <div className="rounded bg-muted/50 px-2 py-1.5">
                <p className="text-muted-foreground text-[10px] uppercase tracking-wide">
                  Max Output
                </p>
                <p className="font-mono font-medium mt-0.5">
                  {selectedModel.max_tokens.toLocaleString()}
                </p>
              </div>
              <div className="rounded bg-muted/50 px-2 py-1.5">
                <p className="text-muted-foreground text-[10px] uppercase tracking-wide">
                  Input
                </p>
                <p className="font-medium mt-0.5 truncate">
                  {selectedModel.input_types.join(", ")}
                </p>
              </div>
            </div>
            {selectedModel.supports_thinking && (
              <div className="flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50 rounded px-2 py-1">
                <span>🧠</span>
                <span>支持 Thinking 推理</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Advanced Settings */}
      {value.modelId && (
        <div className="space-y-4 pt-4 border-t">
          <Label className="text-sm font-medium">生成参数</Label>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="temperature" className="text-xs">
                Temperature
              </Label>
              <Select
                value={value.temperature?.toString() || "0.7"}
                onValueChange={handleTemperatureChange}
                disabled={disabled}
              >
                <SelectTrigger id="temperature" className="font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 - Deterministic</SelectItem>
                  <SelectItem value="0.3">0.3 - Focused</SelectItem>
                  <SelectItem value="0.5">0.5 - Balanced</SelectItem>
                  <SelectItem value="0.7">0.7 - Creative</SelectItem>
                  <SelectItem value="1">1 - More Creative</SelectItem>
                  <SelectItem value="1.5">1.5 - Very Creative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxTokens" className="text-xs">
                Max Tokens
              </Label>
              <Select
                value={value.maxTokens?.toString() || "4096"}
                onValueChange={handleMaxTokensChange}
                disabled={disabled}
              >
                <SelectTrigger id="maxTokens" className="font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="512">512</SelectItem>
                  <SelectItem value="1024">1,024</SelectItem>
                  <SelectItem value="2048">2,048</SelectItem>
                  <SelectItem value="4096">4,096</SelectItem>
                  <SelectItem value="8192">8,192</SelectItem>
                  <SelectItem value="16384">16,384</SelectItem>
                  <SelectItem value="32768">32,768</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
