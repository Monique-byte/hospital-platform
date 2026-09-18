import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { EmployeesService } from "@/services/employees.service";
import { EmployeePublic } from "@/types";

interface ManagerPickerProps {
  value?: string | null;
  currentLabel?: string | null;
  excludeEmployeeId?: string;
  onChange: (managerId: string | null) => void;
  disabled?: boolean;
}

export function ManagerPicker({
  value,
  currentLabel,
  excludeEmployeeId,
  onChange,
  disabled,
}: ManagerPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EmployeePublic[]>([]);
  const [selectedLabel, setSelectedLabel] = useState(currentLabel ?? "");
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const data = await EmployeesService.listDirectory({
        search: query,
        pageSize: 8,
      });

      setResults(
        data.items.filter((employee) => employee.id !== excludeEmployeeId)
      );
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, excludeEmployeeId]);

  function handleSelect(employee: EmployeePublic) {
    onChange(employee.id);
    setSelectedLabel(
      `${employee.socialName || employee.fullName} · ${employee.registrationNumber}`
    );
    setOpen(false);
    setQuery("");
  }

  function handleClear() {
    onChange(null);
    setSelectedLabel("");
  }

  if (disabled) {
    return (
      <input
        disabled
        value={selectedLabel}
        className="w-full rounded-lg border border-black/10 bg-black/5 px-3 py-2 text-sm"
      />
    );
  }

  return (
    <div className="relative">
      {value && selectedLabel ? (
        <div className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2 text-sm">
          <span>{selectedLabel}</span>

          <button
            type="button"
            onClick={handleClear}
            className="text-brand-700/50 hover:text-danger-500"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm">
          <Search size={14} className="text-brand-700/40" />

          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar por nome ou matrícula..."
            className="w-full outline-none"
          />
        </div>
      )}

      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-black/10 bg-white shadow-lg">
          {results.map((employee) => (
            <li key={employee.id}>
              <button
                type="button"
                onClick={() => handleSelect(employee)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-brand-50"
              >
                <p className="font-medium text-brand-900">
                  {employee.socialName || employee.fullName}
                </p>

                <p className="text-xs text-brand-700/60">
                  {employee.registrationNumber} · {employee.position.name}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
