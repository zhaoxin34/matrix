import type { SelectablePrototype } from "@/components/agent-factory/agent-factory-types";

export interface PrototypePickerProps {
  prototypes: SelectablePrototype[];
  selectedPrototype: SelectablePrototype | null;
  onSelect: (prototypeId: number, version: string) => void;
}

export interface PrototypeOptionItemProps {
  prototype: SelectablePrototype;
  isExpanded: boolean;
  onPrototypeClick: () => void;
  onVersionClick: (version: string) => void;
}
