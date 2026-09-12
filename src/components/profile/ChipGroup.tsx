type ChipGroupProps = {
  label: string;
  hint?: string;
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
};

export function ChipGroup({
  label,
  hint,
  options,
  selected,
  onChange,
}: ChipGroupProps) {
  function toggle(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
      return;
    }
    onChange([...selected, option]);
  }

  return (
    <fieldset>
      <legend className="text-sm font-medium text-white">{label}</legend>
      {hint ? <p className="mt-1 text-sm text-slate-400">{hint}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={
                active
                  ? "rounded-full bg-sky-500 px-3 py-1.5 text-sm font-medium text-white"
                  : "rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
              }
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
